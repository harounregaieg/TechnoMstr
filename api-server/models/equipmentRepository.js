const { localPool, cloudPool } = require('../config/db');

/**
 * Repository for equipment-related database operations
 */
class EquipmentRepository {
  /**
   * Add a new equipment to both local and cloud databases
   * @param {Object} equipement Equipment information
   * @returns {Promise<Object>} The created equipment
   */
  async addEquipment(equipement) {
    const { modele, ipAdresse, disponibilite = true, idParc = 1, departement } = equipement;
    console.log('[addEquipment] Received values:', { modele, ipAdresse, disponibilite, idParc, departement });
    
    const query = `
      INSERT INTO equipement (modele, ipAdresse, disponibilite, idParc, departement)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [modele, ipAdresse, disponibilite, idParc, departement];
    console.log('[addEquipment] Local insert query:', query);
    console.log('[addEquipment] Local insert values:', values);
    
    try {
      // Add to local database
      const localResult = await localPool.query(query, values);
      const localEquipment = localResult.rows[0];
      console.log('Equipment added to local database:', localEquipment);
      
      // Try to add to cloud database with a timeout
      let cloudEquipment = null;
      try {
        console.log('Attempting to add equipment to cloud database...');
        // For cloud, we need to explicitly set the idequipement to match the local one
        const cloudQuery = `
          INSERT INTO equipement (idequipement, modele, ipAdresse, disponibilite, idParc, departement)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const cloudValues = [
          localEquipment.idequipement, // Use same ID as local
          modele, 
          ipAdresse, 
          disponibilite, 
          idParc,
          departement
        ];
        console.log('[addEquipment] Cloud insert query:', cloudQuery);
        console.log('[addEquipment] Cloud insert values:', cloudValues);
        
        const cloudResult = await this.queryWithTimeout(cloudPool, cloudQuery, cloudValues, 3000);
        cloudEquipment = cloudResult.rows[0];
        console.log('Equipment successfully added to cloud database:', cloudEquipment);
      } catch (cloudError) {
        console.warn('Could not add equipment to cloud database:', cloudError.message);
        // Try an alternate approach - check if it already exists with the same IP
        try {
          const checkQuery = `SELECT * FROM equipement WHERE ipAdresse = $1`;
          const checkResult = await this.queryWithTimeout(cloudPool, checkQuery, [ipAdresse], 2000);
          
          if (checkResult.rows.length > 0) {
            cloudEquipment = checkResult.rows[0];
            console.log('Found existing equipment in cloud database:', cloudEquipment);
          } else {
            // Try one more approach - directly set the ID
            try {
              const directQuery = `
                INSERT INTO equipement (idequipement, modele, ipAdresse, disponibilite, idParc, departement)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
              `;
              const directValues = [localEquipment.idequipement, modele, ipAdresse, disponibilite, idParc, departement];
              console.log('[addEquipment] Direct cloud insert query:', directQuery);
              console.log('[addEquipment] Direct cloud insert values:', directValues);
              const directResult = await this.queryWithTimeout(
                cloudPool, 
                directQuery, 
                directValues,
                2000
              );
              cloudEquipment = directResult.rows[0];
              console.log('Equipment added to cloud database with direct approach:', cloudEquipment);
            } catch (directError) {
              console.warn('Failed to add equipment to cloud with direct approach:', directError.message);
            }
          }
        } catch (checkError) {
          console.warn('Could not check for existing equipment in cloud database:', checkError.message);
        }
      }
      
      // Return the local result as primary response
      return {
        local: localEquipment,
        cloud: cloudEquipment
      };
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  }

  // Helper function to create a timeout promise
  createTimeout(ms = 2000) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloud database connection timeout')), ms);
    });
  }

  // Helper function to execute a query with timeout
  async queryWithTimeout(pool, query, values, timeoutMs = 2000) {
    try {
      // Log query for debugging
      console.log(`Executing query with timeout (${timeoutMs}ms):`, query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      console.log('Query values:', values);
      
      const result = await Promise.race([
        pool.query(query, values),
        this.createTimeout(timeoutMs)
      ]);
      
      console.log(`Query completed successfully with ${result.rowCount} rows affected`);
      return result;
    } catch (error) {
      if (error.message === 'Cloud database connection timeout') {
        console.warn('Database operation timed out after', timeoutMs, 'ms');
      } else {
        console.error('Database query error:', {
          message: error.message,
          code: error.code,
          detail: error.detail || 'No additional details',
          query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
        });
      }
      throw error;
    }
  }

  /**
   * Add a new printer to both local and cloud databases
   * @param {Object} printer Printer information
   * @param {number} idequipement The equipment ID linked to this printer
   * @returns {Promise<Object>} The created printer
   */
  async addPrinter(printer, idequipement) {
    const { 
      serialnumber, 
      resolution = '203 dpi',
      vitesse = 6,
      nbrEtiquette = 0,
      softwareVersion,
      contrast = 10.0,
      typeImpression = 'Thermique',
      latch = 'Oui',
      idMarque = 1,
      coverOpen = false,
      ipAdresse
    } = printer;

    try {
      // First, get the IP address for this equipment from local database
      let equipmentIp = ipAdresse;
      if (!equipmentIp && idequipement) {
        const getIpQuery = 'SELECT ipAdresse FROM equipement WHERE idequipement = $1';
        const ipResult = await localPool.query(getIpQuery, [idequipement]);
        if (ipResult.rows.length > 0) {
          equipmentIp = ipResult.rows[0].ipAdresse;
          console.log(`Found IP address for equipment ID ${idequipement}: ${equipmentIp}`);
        } else {
          console.warn(`Could not find IP address for equipment ID ${idequipement}`);
        }
      }
      
      if (!equipmentIp) {
        throw new Error('No IP address available for this equipment');
      }
      
      // Use the IP address to find the corresponding cloud equipment ID
      let cloudEquipId = null;
      try {
        const findCloudEquipQuery = 'SELECT idequipement FROM equipement WHERE ipAdresse = $1';
        const cloudEquipResult = await this.queryWithTimeout(cloudPool, findCloudEquipQuery, [equipmentIp], 2000);
        
        if (cloudEquipResult.rows.length > 0) {
          cloudEquipId = cloudEquipResult.rows[0].idequipement;
          console.log(`Found matching cloud equipment ID ${cloudEquipId} for IP ${equipmentIp}`);
        } else {
          console.warn(`No matching equipment found in cloud database for IP ${equipmentIp}`);
        }
      } catch (cloudLookupError) {
        console.warn(`Error looking up cloud equipment for IP ${equipmentIp}:`, cloudLookupError.message);
      }
      
      // Check if printer already exists with this IP in either database
      const checkPrinterQuery = `
        SELECT i.* 
        FROM imprimante i 
        JOIN equipement e ON i.idequipement = e.idequipement 
        WHERE e.ipAdresse = $1
      `;

      // Check local database first
      const localPrinterCheck = await localPool.query(checkPrinterQuery, [equipmentIp]);
      let cloudPrinterCheck = { rows: [] };
      
      try {
        if (cloudEquipId) {
          // For cloud, we need to check by cloud equipment ID
          const cloudCheckQuery = 'SELECT * FROM imprimante WHERE idequipement = $1';
          cloudPrinterCheck = await this.queryWithTimeout(cloudPool, cloudCheckQuery, [cloudEquipId], 1500);
        }
      } catch (cloudError) {
        console.warn('Warning: Could not check printer in cloud database:', cloudError.message);
      }

      // If printer exists, update it
      if (localPrinterCheck.rows.length > 0) {
        console.log(`Printer already exists with IP ${equipmentIp}, updating local printer`);
        
        const updateQuery = `
          UPDATE imprimante
          SET 
            serialnumber = $1,
            resolution = $2,
            vitesse = $3,
            nbrEtiquette = $4,
            softwareVersion = $5,
            contrast = $6,
            typeImpression = $7,
            latch = $8,
            idMarque = $9,
            coverOpen = $10,
            printer_status = $11,
            status_message = $12
          WHERE idequipement = $13
          RETURNING *
        `;

        const localUpdateValues = [
          serialnumber,
          resolution,
          vitesse,
          nbrEtiquette,
          softwareVersion || printer.firmware || 'Unknown',
          contrast,
          typeImpression,
          latch,
          idMarque,
          coverOpen,
          printer.printer_status || 'UNKNOWN',
          printer.status_message || 'Status not available',
          idequipement
        ];

        // Update in local database
        const localUpdateResult = await localPool.query(updateQuery, localUpdateValues);
        let cloudUpdateResult = { rows: [] };
        
        // Try to update in cloud database if we found a matching printer
        if (cloudEquipId && cloudPrinterCheck.rows.length > 0) {
          try {
            // Get the existing imprimante ID from cloud
            const cloudPrinterId = cloudPrinterCheck.rows[0].idimprimante;
            console.log(`Found existing cloud printer with ID ${cloudPrinterId}`);
            
            // Use a proper update for cloud
            const cloudUpdateQuery = `
              UPDATE imprimante
              SET 
                serialnumber = $1,
                resolution = $2,
                vitesse = $3,
                nbrEtiquette = $4,
                softwareVersion = $5,
                contrast = $6,
                typeImpression = $7,
                latch = $8,
                idMarque = $9,
                coverOpen = $10,
                printer_status = $11,
                status_message = $12
              WHERE idimprimante = $13
              RETURNING *
            `;
            
            const cloudUpdateValues = [
              serialnumber,
              resolution,
              vitesse,
              nbrEtiquette,
              softwareVersion || printer.firmware || 'Unknown',
              contrast,
              typeImpression,
              latch,
              idMarque,
              coverOpen,
              printer.printer_status || 'UNKNOWN',
              printer.status_message || 'Status not available',
              cloudPrinterId
            ];
            
            cloudUpdateResult = await this.queryWithTimeout(cloudPool, cloudUpdateQuery, cloudUpdateValues, 2000);
            console.log('Successfully updated printer in cloud database');
          } catch (cloudUpdateError) {
            console.error('Error updating printer in cloud database:', cloudUpdateError.message);
          }
        } else if (cloudEquipId) {
          // If we have the cloud equipment ID but no printer yet, insert a new one
          try {
            // Get next ID for the cloud printer
            const getMaxIdQuery = 'SELECT COALESCE(MAX(idimprimante), 0) + 1 as next_id FROM imprimante';
            const maxIdResult = await this.queryWithTimeout(cloudPool, getMaxIdQuery, [], 2000);
            const nextImprimanteId = maxIdResult.rows[0].next_id;
            
            console.log(`Creating new printer in cloud database with ID ${nextImprimanteId}`);
            
            // Insert a new printer in cloud
            const cloudInsertQuery = `
              INSERT INTO imprimante (
                idimprimante,
                idequipement, 
                serialnumber, 
                resolution, 
                vitesse, 
                nbrEtiquette, 
                softwareVersion, 
                contrast, 
                typeImpression, 
                latch, 
                idMarque,
                coverOpen,
                printer_status,
                status_message
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              RETURNING *
            `;
            
            const cloudInsertValues = [
              nextImprimanteId,
              cloudEquipId,
              serialnumber,
              resolution,
              vitesse,
              nbrEtiquette,
              softwareVersion || printer.firmware || 'Unknown',
              contrast,
              typeImpression,
              latch,
              idMarque,
              coverOpen,
              printer.printer_status || 'UNKNOWN',
              printer.status_message || 'Status not available'
            ];
            
            cloudUpdateResult = await this.queryWithTimeout(cloudPool, cloudInsertQuery, cloudInsertValues, 3000);
            console.log('Created new printer in cloud database:', cloudUpdateResult.rows[0]);
          } catch (cloudInsertError) {
            console.error('Error creating new printer in cloud database:', cloudInsertError.message);
          }
        }

        return {
          local: localUpdateResult.rows[0],
          cloud: cloudUpdateResult.rows[0] || null
        };
      }

      // If printer doesn't exist, add it
      // First to local database
      const localInsertQuery = `
        INSERT INTO imprimante (
          idequipement, 
          serialnumber, 
          resolution, 
          vitesse, 
          nbrEtiquette, 
          softwareVersion, 
          contrast, 
          typeImpression, 
          latch, 
          idMarque,
          coverOpen,
          printer_status,
          status_message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const localValues = [
        idequipement,
        serialnumber,
        resolution,
        vitesse,
        nbrEtiquette,
        softwareVersion || printer.firmware || 'Unknown',
        contrast,
        typeImpression,
        latch,
        idMarque,
        coverOpen,
        printer.printer_status || 'UNKNOWN',
        printer.status_message || 'Status not available'
      ];

      console.log('Adding printer to local database with values:', localValues);
      
      // Insert into local database
      const localResult = await localPool.query(localInsertQuery, localValues);
      let cloudResult = { rows: [null] };
      
      // Try to insert into cloud database if we have a cloud equipment ID
      if (cloudEquipId) {
        try {
          // First get the current max ID from cloud database
          const getMaxIdQuery = 'SELECT COALESCE(MAX(idimprimante), 0) + 1 as next_id FROM imprimante';
          const maxIdResult = await this.queryWithTimeout(cloudPool, getMaxIdQuery, [], 2000);
          const nextImprimanteId = maxIdResult.rows[0].next_id;
          
          console.log(`Next available imprimante ID in cloud database: ${nextImprimanteId}`);
          
          // Use the same query but with cloud equipment ID and explicit ID
          const cloudInsertQuery = `
            INSERT INTO imprimante (
              idimprimante,
              idequipement, 
              serialnumber, 
              resolution, 
              vitesse, 
              nbrEtiquette, 
              softwareVersion, 
              contrast, 
              typeImpression, 
              latch, 
              idMarque,
              coverOpen,
              printer_status,
              status_message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
          `;
          
          const cloudValues = [
            nextImprimanteId,  // Explicitly set the ID
            cloudEquipId,      // Use the cloud equipment ID
            serialnumber,
            resolution,
            vitesse,
            nbrEtiquette,
            softwareVersion || printer.firmware || 'Unknown',
            contrast,
            typeImpression,
            latch,
            idMarque,
            coverOpen,
            printer.printer_status || 'UNKNOWN',
            printer.status_message || 'Status not available'
          ];
          
          console.log('Adding printer to cloud database with values:', cloudValues);
          cloudResult = await this.queryWithTimeout(cloudPool, cloudInsertQuery, cloudValues, 3000);
          console.log('Successfully added printer to cloud database:', cloudResult.rows[0]);
        } catch (cloudError) {
          console.error('Error adding printer to cloud database:', cloudError.message);
          
          // Try again with a more direct approach - get ID first, then insert
          try {
            // Get the next ID directly with a simpler query
            const getSimpleMaxQuery = 'SELECT MAX(idimprimante) as max_id FROM imprimante';
            const simpleMaxResult = await this.queryWithTimeout(cloudPool, getSimpleMaxQuery, [], 2000);
            const nextId = (simpleMaxResult.rows[0].max_id || 0) + 1;
            
            console.log(`Using direct approach with next ID: ${nextId}`);
            
            const simpleCloudQuery = `
              INSERT INTO imprimante (
                idimprimante,
                idequipement, 
                serialnumber
              )
              VALUES ($1, $2, $3)
              RETURNING *
            `;
            cloudResult = await this.queryWithTimeout(cloudPool, simpleCloudQuery, [nextId, cloudEquipId, serialnumber], 2000);
            console.log('Added printer to cloud with minimal data:', cloudResult.rows[0]);
          } catch (simpleCloudError) {
            console.error('Error adding minimal printer to cloud:', simpleCloudError.message);
          }
        }
      } else {
        console.warn(`No cloud equipment ID found for IP ${equipmentIp}, skipping cloud printer insertion`);
      }

      return {
        local: localResult.rows[0],
        cloud: cloudResult.rows[0] || null
      };
    } catch (error) {
      console.error('Error adding printer:', error);
      throw error;
    }
  }

  /**
   * Get all equipment from the local database
   * @returns {Promise<Array>} List of equipment from local database
   */
  async getAllEquipment() {
    const query = `
      SELECT 
        e.*,
        i.serialnumber as printer_serialnumber,
        i.resolution,
        i.vitesse,
        i.softwareversion,
        i.printer_status,
        i.status_message,
        m.nommarque as marque,
        p.serialnumber as pda_serialnumber,
        p.versionandroid,
        p.modele as pda_model,
        eb.typecharge as battery_type,
        eb.niveaucharge as battery_level,
        es.stockagetotale as storage_total,
        es.stockagelibre as storage_free,
        CASE 
          WHEN p.id IS NOT NULL THEN 'PDA'
          WHEN i.idequipement IS NOT NULL THEN 'Printer'
          ELSE 'Unknown'
        END as type
      FROM equipement e
      LEFT JOIN imprimante i ON e.idequipement = i.idequipement
      LEFT JOIN marque m ON i.idmarque = m.idmarque
      LEFT JOIN pda p ON e.idequipement = p.id
      LEFT JOIN etat_batterie eb ON p.idbatterie = eb.idbatterie
      LEFT JOIN etat_stockage es ON p.idstockage = es.idstockage
      ORDER BY e.idequipement DESC
    `;
    
    try {
      const result = await localPool.query(query);
      return result.rows.map(row => ({
        ...row,
        serialnumber: row.printer_serialnumber || row.pda_serialnumber || null,
        type: row.type,
        marque: row.marque || (row.type === 'PDA' ? 'Zebra' : null),
        versionAndroid: row.versionandroid,
        batteryLevel: row.battery_level,
        batteryType: row.battery_type,
        storageTotal: row.storage_total,
        storageFree: row.storage_free
      }));
    } catch (error) {
      console.error('Error getting equipment:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about an equipment from local database
   * @param {number} idequipement The ID of the equipment
   * @returns {Promise<Object>} Detailed equipment information
   */
  async getEquipmentDetails(idequipement) {
    try {
      // First get equipment basic info
      const equipmentQuery = `
        SELECT 
          e.*,
          p.nomparc,
          d.nomdep,
          CASE 
            WHEN pda.id IS NOT NULL THEN 'PDA'
            WHEN i.idequipement IS NOT NULL THEN 'Printer'
            ELSE 'Unknown'
          END as type,
          CASE 
            WHEN pda.id IS NOT NULL THEN 'Zebra'
            ELSE m.nommarque
          END as marque
        FROM equipement e
        LEFT JOIN parc p ON e.idparc = p.idparc
        LEFT JOIN departement d ON p.iddep = d.iddep
        LEFT JOIN imprimante i ON e.idequipement = i.idequipement
        LEFT JOIN marque m ON i.idmarque = m.idmarque
        LEFT JOIN pda ON e.idequipement = pda.id
        WHERE e.idequipement = $1
      `;

      // Then get printer info if exists
      const printerQuery = `
        SELECT 
          i.serialnumber,
          i.resolution,
          i.vitesse,
          i.nbretiquette,
          i.softwareversion,
          i.contrast,
          i.typeimpression,
          i.latch,
          i.coveropen,
          i.printer_status,
          i.status_message,
          m.nommarque
        FROM imprimante i
        LEFT JOIN marque m ON i.idmarque = m.idmarque
        WHERE i.idequipement = $1
      `;

      // Get PDA info if exists
      const pdaQuery = `
        SELECT 
          p.*,
          eb.typecharge as battery_type,
          eb.niveaucharge as battery_level,
          es.stockagetotale as storage_total,
          es.stockagelibre as storage_free
        FROM pda p
        LEFT JOIN etat_batterie eb ON p.idbatterie = eb.idbatterie
        LEFT JOIN etat_stockage es ON p.idstockage = es.idstockage
        WHERE p.id = $1
      `;

      const [equipResult, printerResult, pdaResult] = await Promise.all([
        localPool.query(equipmentQuery, [idequipement]),
        localPool.query(printerQuery, [idequipement]),
        localPool.query(pdaQuery, [idequipement])
      ]);
      
      if (equipResult.rowCount === 0) {
        throw new Error('Equipment not found');
      }

      // Get the base equipment data
      const equipment = equipResult.rows[0];

      // Structure the response based on equipment type
      let response = {
        ...equipment
      };

      if (equipment.type === 'Printer' && printerResult.rowCount > 0) {
        response.printer = printerResult.rows[0];
      } else if (equipment.type === 'PDA' && pdaResult.rowCount > 0) {
        const pda = pdaResult.rows[0];
        response = {
          ...response,
          versionAndroid: pda.versionandroid,
          batteryLevel: pda.battery_level,
          batteryType: pda.battery_type,
          storageTotal: pda.storage_total,
          storageFree: pda.storage_free,
          serialnumber: pda.serialnumber,
          marque: 'Zebra' // Explicitly set marque for PDAs
        };
      }

      console.log('Equipment details response:', response);
      return response;
    } catch (error) {
      console.error('Error getting equipment details:', error);
      throw error;
    }
  }

  /**
   * Delete an equipment and its associated printer from both databases
   * @param {number} idequipement The ID of the equipment to delete
   * @returns {Promise<Object>} Deletion status for both databases
   */
  async deleteEquipment(idequipement) {
    try {
      // First get the IP address of the equipment to find it in both databases
      const getIpQuery = 'SELECT ipadresse FROM equipement WHERE idequipement = $1';
      const ipResult = await localPool.query(getIpQuery, [idequipement]);
      
      if (ipResult.rowCount === 0) {
        throw new Error('Equipment not found');
      }

      const ipAdresse = ipResult.rows[0].ipadresse;

      // Get equipment IDs from both databases using IP address
      const getIdsQuery = 'SELECT idequipement FROM equipement WHERE ipadresse = $1';
      const localIds = await localPool.query(getIdsQuery, [ipAdresse]);
      
      let cloudIds = { rows: [] };
      try {
        cloudIds = await this.queryWithTimeout(cloudPool, getIdsQuery, [ipAdresse], 1500);
      } catch (cloudError) {
        console.warn('Warning: Could not fetch equipment from cloud database:', cloudError.message);
        // Continue with local deletion only
      }

      const localEquipId = localIds.rows[0]?.idequipement;
      const cloudEquipId = cloudIds.rows[0]?.idequipement;

      // Get printer serial numbers for the local database
      const getSerialNumbersQuery = 'SELECT serialnumber FROM imprimante WHERE idequipement = $1';
      const localSerialNumbers = await localPool.query(getSerialNumbersQuery, [localEquipId]);
      
      let cloudSerialNumbers = { rows: [] };
      try {
        if (cloudEquipId) {
          cloudSerialNumbers = await this.queryWithTimeout(cloudPool, getSerialNumbersQuery, [cloudEquipId], 1500);
        }
      } catch (cloudError) {
        console.warn('Warning: Could not fetch printer details from cloud database:', cloudError.message);
        // Continue with local deletion only
      }

      // Delete from local database in correct order
      let localDeleted = false;
      if (localEquipId) {
        await localPool.query('BEGIN');
        try {
          // Delete associated tickets first
          await localPool.query('DELETE FROM ticket WHERE serialnumber = ANY($1)', 
            [localSerialNumbers.rows.map(row => row.serialnumber)]);
          // Delete actions
          await localPool.query('DELETE FROM action WHERE idequipement = $1', [localEquipId]);
          // Delete printer
          await localPool.query('DELETE FROM imprimante WHERE idequipement = $1', [localEquipId]);
          // Finally delete equipment
          await localPool.query('DELETE FROM equipement WHERE idequipement = $1', [localEquipId]);
          await localPool.query('COMMIT');
          localDeleted = true;
        } catch (error) {
          await localPool.query('ROLLBACK');
          throw new Error(`Error in local database: ${error.message}`);
        }
      }
      if (!localDeleted) {
        throw new Error('Failed to delete equipment from local database');
      }

      // Try to delete from cloud database if we have a cloud equipment ID
      let cloudDeleted = false;
      if (cloudEquipId) {
        try {
          // Start transaction with timeout
          await this.queryWithTimeout(cloudPool, 'BEGIN', [], 1000);
          try {
            // Delete associated tickets first
            await this.queryWithTimeout(
              cloudPool, 
              'DELETE FROM ticket WHERE serialnumber = ANY($1)',
              [cloudSerialNumbers.rows.map(row => row.serialnumber)],
              1500
            );
            // Delete actions
            await this.queryWithTimeout(
              cloudPool, 
              'DELETE FROM action WHERE idequipement = $1', 
              [cloudEquipId],
              1500
            );
            // Delete printer
            await this.queryWithTimeout(
              cloudPool, 
              'DELETE FROM imprimante WHERE idequipement = $1', 
              [cloudEquipId],
              1500
            );
            // Finally delete equipment
            await this.queryWithTimeout(
              cloudPool, 
              'DELETE FROM equipement WHERE idequipement = $1', 
              [cloudEquipId],
              1500
            );
            await cloudPool.query('COMMIT');
            cloudDeleted = true;
          } catch (error) {
            await cloudPool.query('ROLLBACK');
            console.warn(`Warning: Error in cloud database deletion: ${error.message}`);
            // Continue with local deletion success
          }
        } catch (cloudError) {
          console.warn('Warning: Could not connect to cloud database for deletion:', cloudError.message);
          // Continue with local deletion success
        }
      }

      return {
        local: localDeleted,
        cloud: cloudDeleted
      };
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  /**
   * Log a command execution in both local and cloud databases
   * @param {Object} logData Command log data
   * @returns {Promise<Object>} Log entry for both databases
   */
  async logCommandExecution(logData) {
    const {
      idequipement,
      command_type,
      command_details,
      old_value,
      new_value,
      executed_by,
      executed_at = new Date()
    } = logData;

    // First get the IP address from local database
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

    // Get the corresponding idequipement from cloud database
    let cloudEquipId = null;
    try {
      const getCloudEquipIdQuery = `
        SELECT idequipement 
        FROM equipement 
        WHERE ipadresse = $1
      `;
      const cloudEquipResult = await cloudPool.query(getCloudEquipIdQuery, [ipAdresse]);
      if (cloudEquipResult.rows.length) {
        cloudEquipId = cloudEquipResult.rows[0].idequipement;
      }
    } catch (cloudError) {
      console.warn('Could not get equipment from cloud for logging:', cloudError.message);
    }

    const query = `
      INSERT INTO action (
        idequipement,
        command_type,
        command_details,
        old_value,
        new_value,
        executed_by,
        executed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    // Execute for local database first
    const localValues = [
      idequipement,
      command_type,
      command_details,
      old_value,
      new_value,
      executed_by,
      executed_at
    ];
    let localResult;
    try {
      localResult = await localPool.query(query, localValues);
    } catch (error) {
      console.error('Error logging command execution in local database:', error);
      throw error;
    }

    // Try to log in cloud, but ignore errors
    let cloudResult = null;
    if (cloudEquipId) {
      const cloudValues = [
        cloudEquipId,
        command_type,
        command_details,
        old_value,
        new_value,
        executed_by,
        executed_at
      ];
      try {
        const cloudRes = await cloudPool.query(query, cloudValues);
        cloudResult = cloudRes.rows[0];
      } catch (cloudError) {
        console.warn('Could not log command in cloud database (ignored):', cloudError.message);
      }
    }

    return {
      local: localResult.rows[0],
      cloud: cloudResult
    };
  }

  /**
   * Get command logs for a specific equipment
   * @param {number} idequipement Equipment ID
   * @returns {Promise<Array>} List of command logs
   */
  async getCommandLogs(idequipement) {
    const query = `
      SELECT 
        a.*,
        e.modele as equipment_model,
        e.ipadresse as equipment_ip
      FROM action a
      JOIN equipement e ON a.idequipement = e.idequipement
      WHERE a.idequipement = $1
      ORDER BY a.executed_at DESC
    `;

    try {
      const result = await localPool.query(query, [idequipement]);
      return result.rows;
    } catch (error) {
      console.error('Error getting command logs:', error);
      throw error;
    }
  }

  /**
   * Get equipment statistics including total count and active/inactive percentages
   * @param {string} departement Optional department to filter by
   * @returns {Promise<Object>} Equipment statistics
   */
  async getEquipmentStatistics(departement) {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN disponibilite = true THEN 1 END) as active,
        COUNT(CASE WHEN disponibilite = false THEN 1 END) as inactive
      FROM equipement
    `;
    
    // Only filter by department if it's provided and not TechnoCode
    const params = [];
    if (departement && departement !== 'TechnoCode') {
      query += ` WHERE departement = $1`;
      params.push(departement);
    }

    try {
      const result = await localPool.query(query, params);
      const stats = result.rows[0];
      
      // Calculate percentages safely (avoid division by zero)
      const total = parseInt(stats.total) || 0;
      const active = parseInt(stats.active) || 0;
      const inactive = parseInt(stats.inactive) || 0;
      
      const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
      const inactivePercentage = total > 0 ? Math.round((inactive / total) * 100) : 0;
      
      return {
        total,
        active,
        inactive,
        activePercentage,
        inactivePercentage
      };
    } catch (error) {
      console.error('Error getting equipment statistics:', error);
      throw error;
    }
  }
}

module.exports = new EquipmentRepository(); 