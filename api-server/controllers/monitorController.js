const { localPool, cloudPool } = require('../config/db');
const { checkIfZebraPrinter, fetchZebraPrinterDetails, isSatoPrinterByPages, getSatoPrinterInfo } = require('./satozebrascan');

class MonitorController {
    /**
     * Monitor all equipment in the database
     * @returns {Promise<Object>} Status updates for all equipment
     */
    async monitorAllEquipment() {
        try {
            // Get all equipment with their IP addresses, excluding PDAs
            const query = `
                SELECT e.idequipement, e.ipadresse, e.disponibilite, i.idmarque, i.printer_status, i.status_message
                FROM equipement e
                LEFT JOIN imprimante i ON e.idequipement = i.idequipement
                LEFT JOIN pda p ON e.idequipement = p.id
                WHERE e.ipadresse IS NOT NULL
                AND p.id IS NULL
            `;
            
            const result = await localPool.query(query);
            const equipmentList = result.rows;
            
            const statusUpdates = [];
            
            // Check each equipment
            for (const equipment of equipmentList) {
                try {
                    const status = await this.checkEquipmentStatus(equipment);
                    statusUpdates.push(status);
                    
                    // Update database if status changed
                    if (status.statusChanged) {
                        await this.updateEquipmentStatus(
                            equipment.idequipement, 
                            status.newStatus, 
                            status.isOnline, 
                            status.statusMessage,
                            status.printerStatus
                        );
                    }
                } catch (error) {
                    console.error(`Error checking equipment ${equipment.idequipement}:`, error);
                    statusUpdates.push({
                        idequipement: equipment.idequipement,
                        ipadresse: equipment.ipadresse,
                        error: error.message,
                        statusChanged: false
                    });
                }
            }
            
            return statusUpdates;
        } catch (error) {
            console.error('Error monitoring equipment:', error);
            throw error;
        }
    }

    /**
     * Check the status of a single equipment
     * @param {Object} equipment Equipment object from database
     * @returns {Promise<Object>} Status information
     */
    async checkEquipmentStatus(equipment) {
        const { idequipement, ipadresse, disponibilite, idmarque } = equipment;
        
        try {
            let isOnline = false;
            let newStatus = false;
            let statusMessage = '';
            let printerStatus = 'OFFLINE';
            
            // Check if it's a Zebra printer
            if (idmarque === 1) {
                isOnline = await checkIfZebraPrinter(ipadresse);
                if (isOnline) {
                    const details = await fetchZebraPrinterDetails(ipadresse);
                    printerStatus = details.printerStatus;
                    statusMessage = details.statusMessage || details.printerStatus;
                    
                    // Determine printer status based on the status message
                    if (printerStatus.includes('PAUSED') || printerStatus.includes('ERROR')) {
                        printerStatus = 'PAUSED';
                        newStatus = true; // Keep disponibilite true for paused printers
                    } else if (printerStatus === 'READY') {
                        printerStatus = 'READY';
                        newStatus = true;
                    } else {
                        printerStatus = 'UNKNOWN';
                        newStatus = true;
                    }
                }
            }
            // Check if it's a Sato printer
            else if (idmarque === 2) {
                const printerUrl = `http://${ipadresse}`;
                isOnline = await isSatoPrinterByPages(printerUrl);
                if (isOnline) {
                    const info = await getSatoPrinterInfo(printerUrl);
                    statusMessage = info.detailedStatus;
                    
                    // Set printer status based on detailed status
                    if (info.detailedStatus.includes('ERROR') || info.detailedStatus.includes('PAUSED')) {
                        printerStatus = 'PAUSED';
                        newStatus = true; // Keep disponibilite true for paused printers
                    } else {
                        printerStatus = 'ONLINE';
                        newStatus = true;
                    }
                }
            }
            
            return {
                idequipement,
                ipadresse,
                wasOnline: disponibilite,
                isOnline,
                newStatus,
                statusMessage,
                printerStatus,
                statusChanged: disponibilite !== newStatus || equipment.printer_status !== printerStatus || equipment.status_message !== statusMessage
            };
        } catch (error) {
            // If we can't connect, the equipment is offline
            return {
                idequipement,
                ipadresse,
                wasOnline: disponibilite,
                isOnline: false,
                newStatus: false,
                statusMessage: 'Equipment is offline',
                printerStatus: 'OFFLINE',
                statusChanged: disponibilite !== false || equipment.printer_status !== 'OFFLINE' || equipment.status_message !== 'Equipment is offline'
            };
        }
    }

    /**
     * Update equipment status in both local and cloud databases
     * @param {number} idequipement Equipment ID
     * @param {boolean} newStatus New availability status
     * @param {boolean} isOnline Whether the equipment is online
     * @param {string} statusMessage Detailed status message
     * @param {string} printerStatus Printer status (ONLINE, OFFLINE, PAUSED, etc.)
     */
    async updateEquipmentStatus(idequipement, newStatus, isOnline, statusMessage, printerStatus) {
        try {
            // Get the IP address from local database
            const getIpQuery = `
                SELECT ipadresse 
                FROM equipement 
                WHERE idequipement = $1
            `;
            const ipResult = await localPool.query(getIpQuery, [idequipement]);
            
            if (!ipResult.rows.length) {
                throw new Error('Equipment not found in local database');
            }

            const ipAdresse = ipResult.rows[0].ipadresse;
            console.log(`Updating status for IP: ${ipAdresse}, New Status: ${printerStatus}, Message: ${statusMessage}`);

            // Start transaction for local database
            await localPool.query('BEGIN');

            try {
                // Update equipment status in local database using IP address
                const equipmentQuery = `
                    UPDATE equipement 
                    SET disponibilite = $1 
                    WHERE ipadresse = $2
                `;
                console.log('Updating equipment status in local database...');
                const localEquipResult = await localPool.query(equipmentQuery, [newStatus, ipAdresse]);
                console.log('Local equipment update result:', localEquipResult.rowCount);

                // Update printer status in local database using IP address
                const printerQuery = `
                    UPDATE imprimante i
                    SET printer_status = $1,
                        status_message = $2
                    FROM equipement e
                    WHERE i.idequipement = e.idequipement
                    AND e.ipadresse = $3
                `;
                
                console.log('Updating printer status in local database...');
                const localPrinterResult = await localPool.query(printerQuery, [printerStatus, statusMessage, ipAdresse]);
                console.log('Local printer update result:', localPrinterResult.rowCount);

                // Commit local transaction
                await localPool.query('COMMIT');
                console.log('Local transaction committed successfully');
                
                // Try to update cloud database too, but don't fail if cloud is unavailable
                try {
                    // Get cloud equipment ID
                    const cloudEquipIdQuery = `
                        SELECT idequipement 
                        FROM equipement 
                        WHERE ipadresse = $1
                    `;
                    const cloudEquipIdResult = await queryWithTimeout(cloudPool, cloudEquipIdQuery, [ipAdresse], 1500);
                    
                    if (cloudEquipIdResult.rows.length > 0) {
                        const cloudEquipId = cloudEquipIdResult.rows[0].idequipement;
                        
                        // Now get the associated printer ID from cloud database
                        const cloudPrinterIdQuery = `
                            SELECT idimprimante 
                            FROM imprimante 
                            WHERE idequipement = $1
                        `;
                        const cloudPrinterIdResult = await queryWithTimeout(cloudPool, cloudPrinterIdQuery, [cloudEquipId], 1500);
                        
                        // Start transaction for cloud database
                        await queryWithTimeout(cloudPool, 'BEGIN', [], 1000);
                        
                        try {
                            // Update equipment status in cloud database
                            console.log('Updating equipment status in cloud database...');
                            const cloudEquipResult = await queryWithTimeout(cloudPool, equipmentQuery, [newStatus, ipAdresse], 1500);
                            console.log('Cloud equipment update result:', cloudEquipResult.rowCount);
            
                            // Update printer status in cloud database if printer exists
                            if (cloudPrinterIdResult.rows.length > 0) {
                                const cloudPrinterId = cloudPrinterIdResult.rows[0].idimprimante;
                                console.log(`Found cloud printer ID: ${cloudPrinterId}`);
                                
                                // Use a direct update based on idimprimante for cloud
                                const cloudPrinterQuery = `
                                    UPDATE imprimante
                                    SET printer_status = $1,
                                        status_message = $2
                                    WHERE idimprimante = $3
                                `;
                                
                                console.log('Updating printer status in cloud database...');
                                const cloudPrinterResult = await queryWithTimeout(
                                    cloudPool, 
                                    cloudPrinterQuery, 
                                    [printerStatus, statusMessage, cloudPrinterId], 
                                    1500
                                );
                                console.log('Cloud printer update result:', cloudPrinterResult.rowCount);
                            } else {
                                console.log('No corresponding printer found in cloud database, attempting to create one');
                                
                                // Try to get information about the printer from local database
                                const getPrinterQuery = `
                                    SELECT serialnumber, resolution, vitesse, contrast
                                    FROM imprimante i
                                    JOIN equipement e ON i.idequipement = e.idequipement
                                    WHERE e.ipadresse = $1
                                `;
                                const printerInfoResult = await localPool.query(getPrinterQuery, [ipAdresse]);
                                
                                if (printerInfoResult.rows.length > 0) {
                                    const printerInfo = printerInfoResult.rows[0];
                                    
                                    // Get next ID for cloud imprimante
                                    const getMaxIdQuery = 'SELECT COALESCE(MAX(idimprimante), 0) + 1 as next_id FROM imprimante';
                                    const maxIdResult = await queryWithTimeout(cloudPool, getMaxIdQuery, [], 1500);
                                    const nextImprimanteId = maxIdResult.rows[0].next_id;
                                    
                                    // Insert a new printer record in cloud
                                    const insertPrinterQuery = `
                                        INSERT INTO imprimante (
                                            idimprimante,
                                            idequipement,
                                            serialnumber,
                                            resolution,
                                            vitesse,
                                            nbrEtiquette,
                                            contrast,
                                            printer_status,
                                            status_message,
                                            idmarque
                                        )
                                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                                        RETURNING *
                                    `;
                                    
                                    const insertValues = [
                                        nextImprimanteId,
                                        cloudEquipId,
                                        printerInfo.serialnumber,
                                        printerInfo.resolution || '203 dpi',
                                        printerInfo.vitesse || 6.0,
                                        0,
                                        printerInfo.contrast || 10.0,
                                        printerStatus,
                                        statusMessage,
                                        1 // Default to Zebra
                                    ];
                                    
                                    try {
                                        const insertResult = await queryWithTimeout(cloudPool, insertPrinterQuery, insertValues, 2000);
                                        console.log('Created new printer in cloud database:', insertResult.rows[0]);
                                    } catch (insertError) {
                                        console.error('Failed to create printer in cloud database:', insertError.message);
                                    }
                                }
                            }
                            
                            // Commit cloud transaction
                            await cloudPool.query('COMMIT');
                            console.log('Cloud transaction committed successfully');
                        } catch (cloudError) {
                            // Rollback cloud transaction in case of error
                            await cloudPool.query('ROLLBACK');
                            console.warn('Cloud database update failed, rolling back:', cloudError.message);
                        }
                    } else {
                        console.warn('Equipment not found in cloud database, skipping cloud update');
                    }
                } catch (cloudError) {
                    console.warn('Could not connect to cloud database:', cloudError.message);
                    console.log('Continuing with local update only');
                }
            } catch (localError) {
                // Rollback local transaction in case of error
                await localPool.query('ROLLBACK');
                console.error('Error during local database updates:', localError);
                throw localError;
            }
        } catch (error) {
            console.error(`Error updating equipment status for ID ${idequipement}:`, error);
            throw error;
        }
    }
}

// Helper function to add timeout to cloud database operations
const queryWithTimeout = async (pool, query, values, timeoutMs = 2000) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Cloud database operation timeout')), timeoutMs);
  });
  
  try {
    return await Promise.race([
      pool.query(query, values),
      timeout
    ]);
  } catch (error) {
    if (error.message === 'Cloud database operation timeout') {
      console.warn('Database operation timed out after', timeoutMs, 'ms');
    }
    throw error;
  }
};

module.exports = new MonitorController(); 