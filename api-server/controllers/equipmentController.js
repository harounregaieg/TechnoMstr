const equipmentRepository = require('../models/equipmentRepository');
const pdaRepository = require('../models/pdaRepository');
const notificationController = require('./notificationController');

/**
 * Get all equipment
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
exports.getAllEquipment = async (req, res) => {
  try {
    const equipement = await equipmentRepository.getAllEquipment();
    res.json(equipement);
  } catch (error) {
    console.error('Error getting equipment:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

/**
 * Add a new equipment
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
exports.addEquipment = async (req, res) => {
  try {
    const equipement = await equipmentRepository.addEquipment(req.body);
    await notificationController.createNotification(
      'success',
      'equipment',
      `Nouveau équipement ajouté: ${req.body.nom || 'Équipement'} (${req.body.type || 'N/A'})`,
      equipement.local.idequipement
    );
    res.status(201).json(equipement);
  } catch (error) {
    console.error('Error adding equipment:', error);
    res.status(500).json({ error: 'Failed to add equipment' });
  }
};

/**
 * Add a printer found during a scan
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
exports.addScannedPrinter = async (req, res) => {
  const { ip, printer } = req.body;
  
  console.log('Received printer data:', JSON.stringify({ ip, printer }, null, 2));
  
  if (!ip || !printer) {
    return res.status(400).json({ error: 'Missing required fields: ip and printer' });
  }
  
  // Handle PDA case separately
  if (printer.type === 'PDA') {
    try {
      // First add the equipment
      const equipmentData = {
        modele: printer.model || 'Unknown Model',
        ipAdresse: ip.trim(),
        disponibilite: true, // PDAs are considered available if detected
        type: 'PDA', // Explicitly set type as PDA
        idMarque: 1, // Assuming 3 is the ID for Zebra PDAs in your marque table
        serialnumber: printer.serialnumber || 'Unknown' // Only use lowercase property
      };
      
      // Handle the N/A or missing serialnumber case
      if (!printer.serialnumber || printer.serialnumber === 'N/A' || printer.serialnumber === 'Unknown') {
        try {
          // Get the serial number directly using ADB
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);
          
          console.log(`Attempting to fetch serial number directly from device ${ip}...`);
          const { stdout: serial } = await execPromise(`adb -s ${ip}:5555 shell getprop ro.serialno`);
          if (serial && serial.trim()) {
            equipmentData.serialnumber = serial.trim();
            console.log(`Successfully retrieved serial number directly: ${equipmentData.serialnumber}`);
          } else {
            console.log('Failed to retrieve serial number directly');
          }
        } catch (serialError) {
          console.error('Error retrieving serial number directly:', serialError);
        }
      }
      
      const equipement = await equipmentRepository.addEquipment(equipmentData);
      
      // Add battery status
      const batteryData = {
        typeCharge: printer.batteryInfo?.status || 'Unknown',
        niveauCharge: parseInt(printer.batteryInfo?.level || '0')
      };
      const batteryResult = await pdaRepository.addBatteryStatus(batteryData);
      console.log('Battery result:', batteryResult); // Debug log
      
      // Add storage status
      const storageData = {
        stockageTotale: printer.storageInfo?.Total || '0 GB',
        stockageLibre: printer.storageInfo?.Available || '0 GB'
      };
      const storageResult = await pdaRepository.addStorageStatus(storageData);
      console.log('Storage result:', storageResult); // Debug log
      
      // Add PDA details
      const pdaData = {
        id: equipement.local.idequipement,
        versionAndroid: printer.androidVersion || 'Unknown',
        serialnumber: equipmentData.serialnumber || 'Unknown', // Use the potentially updated serialnumber
        modele: printer.model || 'Unknown Model',
        idStockage: storageResult.idStockage, // Access the ID directly
        idBatterie: batteryResult.idBatterie // Access the ID directly
      };
      
      console.log('Adding PDA with data:', pdaData); // Debug log
      
      const pdaResult = await pdaRepository.addPda(pdaData);
      
      // Store the installed applications if any
      if (Array.isArray(printer.installedApps) && printer.installedApps.length > 0) {
        console.log(`Storing ${printer.installedApps.length} applications for PDA ID ${equipement.local.idequipement}`);
        const appsResult = await pdaRepository.storeApplicationsForPda(equipement.local.idequipement, printer.installedApps);
        console.log('Applications stored:', appsResult);
      } else {
        console.log('No applications to store for this PDA');
      }
      
      await notificationController.createNotification(
        'success',
        'equipment',
        `Nouveau équipement ajouté: ${equipmentData.modele} (${equipmentData.type})`,
        equipement.local.idequipement
      );
      
      res.status(201).json({ 
        equipement: {
          ...equipement,
          type: 'PDA',
          serialnumber: equipmentData.serialnumber,
          marque: 'Zebra'
        }, 
        pda: pdaResult 
      });
    } catch (error) {
      console.error('Error adding PDA:', error);
      res.status(500).json({ 
        error: 'Failed to add PDA', 
        details: error.message,
        success: false 
      });
    }
  } else {
    // Handle printer case
    let serialNumber = printer.serialNumber || printer.serialnumber;
    let resolution = printer.resolution || '203 dpi';
    let disponibilite = true;   // Default to true for manually added printers
    let model = printer.model || '';

    // For manually added printers from the form
    if (printer.printerType === 'Zebra' || printer.brand === '1') {
      disponibilite = true; // Default to true for manual additions
      resolution = printer.resolution || '203 dpi';
      printer.printerType = 'Zebra';
    } else if (printer.printerType === 'Sato' || printer.brand === '2') {
      disponibilite = true; // Default to true for manual additions
      resolution = printer.resolution || '203 dpi';
      printer.printerType = 'Sato';
      
      // If we still don't have a serial number, use a default
      if (!serialNumber) {
        serialNumber = 'SATO_UNKNOWN';
        model = 'Sato Printer';
      }
    }
    
    // Check if we have a valid serial number
    if (!serialNumber) {
      serialNumber = `UNKNOWN_${Date.now()}`;
      console.warn('Generated temporary serial number for printer:', serialNumber);
    }
    
    try {
      let equipement;
      const idMarque = printer.printerType === 'Zebra' ? 1 : 2; // 1 for Zebra, 2 for Sato
      
      // Check if equipment already exists with this IP
      try {
        const { localPool, cloudPool } = require('../config/db');
        const checkQuery = 'SELECT idequipement FROM equipement WHERE ipadresse = $1';
        const checkResult = await localPool.query(checkQuery, [ip.trim()]);
        
        console.log(`Checking if equipment exists with IP ${ip.trim()}`);
        
        // Try to directly find the corresponding cloud equipment by IP address
        let cloudIdequipement = null;
        try {
          const cloudQuery = 'SELECT idequipement FROM equipement WHERE ipadresse = $1';
          const cloudResult = await cloudPool.query(cloudQuery, [ip.trim()]);
          if (cloudResult.rows.length > 0) {
            cloudIdequipement = cloudResult.rows[0].idequipement;
            console.log(`Found matching cloud equipment with ID ${cloudIdequipement} for IP ${ip.trim()}`);
          } else {
            console.log(`No matching cloud equipment found for IP ${ip.trim()}`);
          }
        } catch (cloudError) {
          console.warn(`Could not query cloud database for equipment with IP ${ip.trim()}:`, cloudError.message);
        }
        
        if (checkResult.rows.length > 0) {
          console.log(`Equipment already exists with IP ${ip}, updating it`);
          const idequipement = checkResult.rows[0].idequipement;
          
          console.log(`Found equipment IDs - Local: ${idequipement}, Cloud: ${cloudIdequipement || 'Not found'}`);
          
          // Update the existing equipment
          const updateQuery = `
            UPDATE equipement 
            SET modele = $1, disponibilite = $2 
            WHERE idequipement = $3
            RETURNING *
          `;
          const updateResult = await localPool.query(updateQuery, [
            model || printer.model || 'Unknown Printer',
            disponibilite,
            idequipement
          ]);
          
          equipement = { 
            local: updateResult.rows[0],
            cloud: null
          };
          
          // Try to update cloud equipment
          if (cloudIdequipement) {
            try {
              const cloudUpdateQuery = `
                UPDATE equipement
                SET modele = $1, disponibilite = $2 
                WHERE idequipement = $3
                RETURNING *
              `;
              const cloudUpdateResult = await cloudPool.query(cloudUpdateQuery, [
                model || printer.model || 'Unknown Printer',
                disponibilite,
                cloudIdequipement
              ]);
              equipement.cloud = cloudUpdateResult.rows[0];
              console.log('Successfully updated cloud equipment');
            } catch (cloudUpdateError) {
              console.warn(`Could not update cloud equipment for ID ${cloudIdequipement}:`, cloudUpdateError.message);
            }
          }
        } else {
          // Add new equipment
          const equipmentData = {
            modele: model || printer.model || 'Unknown Printer',
            ipAdresse: ip.trim(), // Remove any whitespace or line endings
            disponibilite: disponibilite
          };
          console.log('Adding equipment with data:', equipmentData);
          
          equipement = await equipmentRepository.addEquipment(equipmentData);
        }
      } catch (error) {
        console.error('Error checking/updating equipment:', error);
        
        // Add new equipment as fallback
        const equipmentData = {
          modele: model || printer.model || 'Unknown Printer',
          ipAdresse: ip.trim(),
          disponibilite: disponibilite
        };
        console.log('Adding equipment with data:', equipmentData);
        
        equipement = await equipmentRepository.addEquipment(equipmentData);
      }
      
      console.log('Equipment added/updated successfully:', equipement);
      
      // Then add the printer with a reference to the equipment
      const printerData = {
        serialnumber: serialNumber,
        softwareVersion: printer.firmware || printer.linkOsVersion || printer.softwareVersion || 'Unknown',
        resolution: resolution,
        coverOpen: false,
        vitesse: printer.vitesse || 6.0,
        nbrEtiquette: 0,
        contrast: printer.contrast || 10.0,
        typeImpression: printer.typeImpression || 'Thermique',
        latch: 'Oui',
        idMarque: idMarque, // 1 for Zebra, 2 for Sato
        ipAdresse: ip.trim(), // Add the IP address to printer data
        printer_status: printer.printer_status || 'UNKNOWN', // Ensure this is properly set
        status_message: printer.status_message || printer.statusMessage || 'Status not available' // Ensure this is properly set
      };
      console.log('Adding printer with data:', printerData);
      
      // Use the local equipment ID when adding the printer
      const printerResult = await equipmentRepository.addPrinter(printerData, equipement.local.idequipement);
      console.log('Printer added successfully:', printerResult);
      
      await notificationController.createNotification(
        'success',
        'equipment',
        `Nouveau équipement ajouté: ${equipement.local.modele} (${equipement.local.type || 'Imprimante'})`,
        equipement.local.idequipement
      );
      
      res.status(201).json({ 
        success: true,
        message: 'Printer added successfully',
        equipement, 
        printer: printerResult 
      });
    } catch (error) {
      console.error('Error details:', error);
      
      // Check for unique constraint violation (duplicate IP or serial number)
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Printer already exists in the database',
          detail: error.detail,
          success: false
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to add printer', 
        detail: error.message,
        success: false
      });
    }
  }
};

/**
 * Delete an equipment
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
exports.deleteEquipment = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get equipment details before deletion for logging
    let equipmentDetails;
    try {
      equipmentDetails = await equipmentRepository.getEquipmentDetails(id);
    } catch (error) {
      console.warn(`Could not get equipment details for ID ${id} before deletion:`, error.message);
      // Continue with deletion even if we can't get details
    }
    
    const equipmentType = equipmentDetails?.type || 'Equipment';
    const modelName = equipmentDetails?.modele || 'Unknown';
    
    // Store the equipment info
    const equipmentInfo = { 
      nom: equipmentDetails?.nom || 'Équipement inconnu',
      type: equipmentDetails?.type || 'N/A'
    };
    
    // Delete the equipment
    const deleted = await equipmentRepository.deleteEquipment(id);
    
    if (!deleted.local) {
      return res.status(404).json({ 
        error: 'Equipment not found or could not be deleted from local database',
        success: false
      });
    }

    let message = 'Equipment deleted successfully';
    
    // If cloud connection failed, let the user know but consider it a success
    // since we're primarily concerned with local database operations
    if (!deleted.cloud) {
      message += ' (from local database only)';
      console.warn(`Equipment with ID ${id} was deleted from local database but not from cloud.`);
    }
    
    await notificationController.createNotification(
      'warning',
      'equipment',
      `Équipement supprimé: ${equipmentInfo.nom} (${equipmentInfo.type})`,
      id
    );
    
    res.json({ 
      message,
      success: true,
      local: deleted.local,
      cloud: deleted.cloud
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    
    if (error.message.includes('associated tickets')) {
      return res.status(400).json({ 
        error: error.message,
        details: 'Please delete all associated tickets before deleting this equipment.',
        success: false
      });
    }
    
    if (error.message.includes('foreign key')) {
      return res.status(400).json({ 
        error: 'Cannot delete equipment due to database constraints',
        details: 'This equipment is referenced by other records. Please delete those records first.',
        success: false
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete equipment',
      details: error.message,
      success: false
    });
  }
};

/**
 * Get detailed information about an equipment
 * @param {Object} req Request object
 * @param {Object} res Response object
 */
exports.getEquipmentDetails = async (req, res) => {
  const { id } = req.params;
  
  try {
    const details = await equipmentRepository.getEquipmentDetails(id);
    
    // If it's a Sato printer, fetch the current status
    if (details && details.idMarque === 2) { // 2 is Sato
      try {
        const { getSatoPrinterInfo } = require('./satozebrascan');
        const printerInfo = await getSatoPrinterInfo(`http://${details.ipAdresse}`);
        
        // Update the status in the details object
        if (printerInfo.detailedStatus) {
          details.statusMessage = printerInfo.detailedStatus;
        }
      } catch (error) {
        console.error('Error fetching current printer status:', error);
        details.statusMessage = 'Error fetching current status';
      }
    }
    
    await notificationController.createNotification(
      'info',
      'equipment',
      `Équipement mis à jour: ${details?.nom || 'Équipement'} (${details?.type || 'N/A'})`,
      id
    );
    
    res.json(details);
  } catch (error) {
    console.error('Error getting equipment details:', error);
    if (error.message === 'Equipment not found') {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.status(500).json({ error: 'Failed to get equipment details' });
  }
}; 