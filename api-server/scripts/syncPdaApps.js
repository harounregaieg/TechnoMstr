#!/usr/bin/env node
/**
 * Script to synchronize applications for all PDAs in the database
 * This can be run manually or as a scheduled job
 */
const { localPool } = require('../config/db');
const { getAdbDevices, getInstalledApps } = require('../controllers/pdainfo');
const pdaRepository = require('../models/pdaRepository');

async function syncAllPdaApplications() {
  console.log('Starting PDA applications synchronization...');
  
  try {
    // Get all PDAs from the database
    const query = `
      SELECT e.idequipement, e.ipadresse
      FROM equipement e
      JOIN pda p ON e.idequipement = p.id
      WHERE e.ipadresse IS NOT NULL
    `;
    
    const result = await localPool.query(query);
    const pdas = result.rows;
    
    console.log(`Found ${pdas.length} PDAs in the database`);
    
    // Get list of currently connected ADB devices
    const connectedDevices = await getAdbDevices();
    console.log(`Found ${connectedDevices.length} connected devices via ADB`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Process each PDA
    for (const pda of pdas) {
      const { idequipement, ipadresse } = pda;
      
      try {
        // Check if the PDA is connected
        if (connectedDevices.includes(ipadresse)) {
          console.log(`Processing PDA ${idequipement} with IP ${ipadresse}...`);
          
          // Get installed applications
          const installedApps = await getInstalledApps(ipadresse);
          
          if (installedApps.length > 0) {
            console.log(`Found ${installedApps.length} applications on PDA ${idequipement}`);
            
            // Store the applications in the database
            await pdaRepository.storeApplicationsForPda(idequipement, installedApps);
            
            console.log(`Successfully synchronized applications for PDA ${idequipement}`);
            syncedCount++;
          } else {
            console.log(`No applications found on PDA ${idequipement}`);
          }
        } else {
          console.log(`PDA ${idequipement} with IP ${ipadresse} is not connected`);
        }
      } catch (error) {
        console.error(`Error processing PDA ${idequipement}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Synchronization completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
    return {
      total: pdas.length,
      synced: syncedCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('Error synchronizing PDA applications:', error);
    throw error;
  }
}

// Run the synchronization if executed directly
if (require.main === module) {
  syncAllPdaApplications()
    .then(() => {
      console.log('PDA applications synchronization script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in PDA applications synchronization script:', error);
      process.exit(1);
    });
}

module.exports = { syncAllPdaApplications }; 