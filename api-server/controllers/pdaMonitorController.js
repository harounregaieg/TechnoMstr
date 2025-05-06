const { localPool, cloudPool } = require('../config/db');
const { getAdbDevices, getDeviceInfo } = require('./pdainfo');
const pdaRepository = require('../models/pdaRepository');

class PdaMonitorController {
    /**
     * Monitor all PDAs in the database
     * @returns {Promise<Object>} Status updates for all PDAs
     */
    async monitorAllPdas() {
        try {
            // Get all PDAs with their IP addresses
            const query = `
                SELECT e.idequipement, e.ipadresse, e.disponibilite, p.id, p.idbatterie, p.idstockage
                FROM equipement e
                JOIN pda p ON e.idequipement = p.id
                WHERE e.ipadresse IS NOT NULL
            `;
            
            const result = await localPool.query(query);
            const pdaList = result.rows;
            
            // Get list of currently connected ADB devices
            const connectedDevices = await getAdbDevices();
            console.log('Connected ADB devices:', connectedDevices);
            
            const statusUpdates = [];
            
            // Check each PDA
            for (const pda of pdaList) {
                try {
                    const status = await this.checkPdaStatus(pda, connectedDevices);
                    statusUpdates.push(status);
                    
                    // Always update battery/storage info if online and info is available
                    if (status.isOnline && (status.batteryInfo || status.storageInfo)) {
                        await this.updatePdaStatus(
                            pda.idequipement,
                            status.newStatus,
                            status.batteryInfo,
                            status.storageInfo
                        );
                    } else if (status.statusChanged) {
                        // Still update status if online status changed
                        await this.updatePdaStatus(
                            pda.idequipement,
                            status.newStatus,
                            status.batteryInfo,
                            status.storageInfo
                        );
                    }
                } catch (error) {
                    console.error(`Error checking PDA ${pda.idequipement}:`, error);
                    statusUpdates.push({
                        idequipement: pda.idequipement,
                        ipadresse: pda.ipadresse,
                        error: error.message,
                        statusChanged: false
                    });
                }
            }
            
            return statusUpdates;
        } catch (error) {
            console.error('Error monitoring PDAs:', error);
            throw error;
        }
    }

    /**
     * Check the status of a single PDA
     * @param {Object} pda PDA object from database
     * @param {Array} connectedDevices List of currently connected ADB devices
     * @returns {Promise<Object>} Status information
     */
    async checkPdaStatus(pda, connectedDevices) {
        const { idequipement, ipadresse, disponibilite } = pda;
        
        try {
            // Check if PDA is in the list of connected devices
            const isConnected = connectedDevices.includes(ipadresse);
            let batteryInfo = null;
            let storageInfo = null;
            
            if (isConnected) {
                // Get detailed device info
                const deviceInfo = await getDeviceInfo(ipadresse);
                
                if (deviceInfo) {
                    // Extract battery information
                    const batteryLevel = parseInt(deviceInfo["Battery Info"]?.level || '0');
                    // Ensure battery level is between 0 and 100
                    const normalizedBatteryLevel = Math.min(Math.max(batteryLevel, 0), 100);
                    
                    // Get the battery status as a number
                    const batteryStatus = deviceInfo["Battery Info"]?.status;
                    
                    batteryInfo = {
                        typeCharge: batteryStatus,
                        niveauCharge: normalizedBatteryLevel
                    };
                    
                    // Extract storage information
                    storageInfo = {
                        stockageTotale: deviceInfo["Storage Info"]?.Total || '0 GB',
                        stockageLibre: deviceInfo["Storage Info"]?.Available || '0 GB'
                    };

                    console.log(`PDA ${ipadresse} battery info:`, {
                        rawLevel: deviceInfo["Battery Info"]?.level,
                        normalizedLevel: normalizedBatteryLevel,
                        status: batteryStatus
                    });
                }
            }
            
            return {
                idequipement,
                ipadresse,
                wasOnline: disponibilite,
                isOnline: isConnected,
                newStatus: isConnected,
                batteryInfo,
                storageInfo,
                statusChanged: disponibilite !== isConnected
            };
        } catch (error) {
            // If we can't connect, the PDA is offline
            return {
                idequipement,
                ipadresse,
                wasOnline: disponibilite,
                isOnline: false,
                newStatus: false,
                batteryInfo: null,
                storageInfo: null,
                statusChanged: disponibilite !== false
            };
        }
    }

    /**
     * Update PDA status in both local and cloud databases
     * @param {number} idequipement Equipment ID
     * @param {boolean} newStatus New availability status
     * @param {Object} batteryInfo Battery information
     * @param {Object} storageInfo Storage information
     */
    async updatePdaStatus(idequipement, newStatus, batteryInfo, storageInfo) {
        try {
            // Get the IP address from local database
            const getIpQuery = `
                SELECT ipadresse 
                FROM equipement 
                WHERE idequipement = $1
            `;
            const ipResult = await localPool.query(getIpQuery, [idequipement]);
            
            if (!ipResult.rows.length) {
                throw new Error('PDA not found in local database');
            }

            const ipAdresse = ipResult.rows[0].ipadresse;
            console.log(`Updating status for PDA IP: ${ipAdresse}, New Status: ${newStatus}`);

            // Start transactions for both databases
            await localPool.query('BEGIN');
            await cloudPool.query('BEGIN');

            try {
                // Update equipment status in both databases using IP address
                const equipmentQuery = `
                    UPDATE equipement 
                    SET disponibilite = $1 
                    WHERE ipadresse = $2
                `;
                
                await localPool.query(equipmentQuery, [newStatus, ipAdresse]);
                await cloudPool.query(equipmentQuery, [newStatus, ipAdresse]);

                // If we have new battery and storage info, update them
                if (batteryInfo && storageInfo) {
                    // Get PDA ID from local database
                    const getPdaIdQuery = `
                        SELECT p.id, p.idbatterie, p.idstockage
                        FROM pda p
                        JOIN equipement e ON p.id = e.idequipement
                        WHERE e.ipadresse = $1
                    `;
                    
                    const pdaResult = await localPool.query(getPdaIdQuery, [ipAdresse]);
                    if (pdaResult.rows.length > 0) {
                        const { id, idbatterie, idstockage } = pdaResult.rows[0];
                        
                        // Update battery status
                        const batteryQuery = `
                            UPDATE etat_batterie
                            SET typeCharge = $1,
                                niveauCharge = $2
                            WHERE idbatterie = $3
                        `;
                        await localPool.query(batteryQuery, [batteryInfo.typeCharge, batteryInfo.niveauCharge, idbatterie]);
                        
                        // Update storage status
                        const storageQuery = `                            UPDATE etat_stockage
                            SET stockageTotale = $1,
                                stockageLibre = $2
                            WHERE idstockage = $3
                        `;
                        await localPool.query(storageQuery, [storageInfo.stockageTotale, storageInfo.stockageLibre, idstockage]);
                    }
                }

                // Commit both transactions
                await localPool.query('COMMIT');
                await cloudPool.query('COMMIT');
                console.log('Both transactions committed successfully');
            } catch (error) {
                // Rollback both transactions in case of error
                await localPool.query('ROLLBACK');
                await cloudPool.query('ROLLBACK');
                console.error('Error during database updates:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error updating PDA status:', error);
            throw error;
        }
    }
}

module.exports = new PdaMonitorController(); 
