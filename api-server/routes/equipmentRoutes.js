const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const equipmentRepository = require('../models/equipmentRepository');
const pdaRepository = require('../models/pdaRepository');
const { scanDevices } = require('../controllers/pdainfo');
const { syncAllPdaApplications } = require('../scripts/syncPdaApps');
const { localPool } = require('../config/db');

const router = express.Router();

// Route to get all equipment
router.get('/', equipmentController.getAllEquipment);

// Route to get equipment details
router.get('/:id', equipmentController.getEquipmentDetails);

// Route to add new equipment
router.post('/', equipmentController.addEquipment);

// Route to add a printer found during a scan
router.post('/scanned-printer', equipmentController.addScannedPrinter);

// Route to delete equipment
router.delete('/:id', equipmentController.deleteEquipment);

// Route to scan for PDAs
router.get('/pda/scan', async (req, res) => {
    try {
        const devices = await scanDevices();
        res.json({ 
            success: true, 
            message: 'PDA scan completed successfully',
            devices: devices
        });
    } catch (error) {
        console.error('Error scanning PDAs:', error);
        res.status(500).json({ error: 'Failed to scan PDAs' });
    }
});

// Route to get a PDA with its installed applications
router.get('/pda/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pda = await pdaRepository.getPdaWithApplications(id);
        
        if (!pda) {
            return res.status(404).json({ error: 'PDA not found' });
        }
        
        res.json(pda);
    } catch (error) {
        console.error('Error getting PDA with applications:', error);
        res.status(500).json({ error: 'Failed to get PDA details' });
    }
});

// Get applications for a specific PDA
router.get('/pda/:id/applications', async (req, res) => {
    try {
        const { id } = req.params;
        const applications = await pdaRepository.getPdaApplications(id);
        
        console.log(`Retrieved ${applications.length} applications for PDA ID ${id}`);
        
        res.json({
            success: true,
            applications: applications
        });
    } catch (error) {
        console.error(`Error getting applications for PDA ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to get PDA applications' });
    }
});

// Route to sync applications for all PDAs
router.post('/pda/sync-apps', async (req, res) => {
    try {
        let result;
        
        // If a specific PDA ID is provided, only sync that PDA
        if (req.body.pdaId) {
            const pdaId = req.body.pdaId;
            console.log(`Syncing applications for specific PDA: ${pdaId}`);
            
            // Get the PDA's IP address
            const pdaQuery = `
                SELECT e.idequipement, e.ipadresse
                FROM equipement e
                JOIN pda p ON e.idequipement = p.id
                WHERE e.idequipement = $1
            `;
            const pdaResult = await localPool.query(pdaQuery, [pdaId]);
            
            if (pdaResult.rows.length === 0) {
                return res.status(404).json({ error: 'PDA not found' });
            }
            
            const ip = pdaResult.rows[0].ipadresse;
            
            // Get PDA apps using ADB
            const { getInstalledApps } = require('../controllers/pdainfo');
            console.log(`Retrieving applications for PDA ${pdaId} with IP ${ip}...`);
            
            const installedApps = await getInstalledApps(ip);
            
            if (installedApps && installedApps.length > 0) {
                console.log(`Retrieved ${installedApps.length} applications for PDA ${pdaId}`);
                result = await pdaRepository.storeApplicationsForPda(pdaId, installedApps);
                console.log('Applications stored:', result);
            } else {
                result = { success: false, message: 'No applications found on the PDA' };
            }
        } else {
            // Sync all PDAs
            result = await syncAllPdaApplications();
        }
        
        res.json({
            success: true,
            message: req.body.pdaId 
                ? `PDA applications synchronized for PDA ID: ${req.body.pdaId}` 
                : 'All PDA applications synchronized',
            result
        });
    } catch (error) {
        console.error('Error synchronizing PDA applications:', error);
        res.status(500).json({ error: 'Failed to synchronize PDA applications' });
    }
});

// Get command logs for an equipment
router.get('/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await equipmentRepository.getCommandLogs(id);
        res.json(logs);
    } catch (error) {
        console.error('Error getting command logs:', error);
        res.status(500).json({ error: 'Failed to get command logs' });
    }
});

// Get recent equipment activities (additions and deletions)
router.get('/activities/recent', async (req, res) => {
  console.log('Received request for recent equipment activities');
  
  try {
    const limit = req.query.limit || 3; // Default to 4 activities instead of 5
    
    // Get most recent equipment using idequipement (assuming newer equipment has higher IDs)
    const addedQuery = `
      SELECT 
        e.idequipement,
        e.ipadresse,
        e.modele,
        CASE 
          WHEN i.idequipement IS NOT NULL THEN 'Printer'
          WHEN p.id IS NOT NULL THEN 'PDA'
          ELSE 'Unknown'
        END as equipment_type,
        CASE
          WHEN i.idequipement IS NOT NULL THEN 
            CASE 
              WHEN i.idmarque = 1 THEN 'Zebra'
              WHEN i.idmarque = 2 THEN 'Sato'
              ELSE 'Unknown'
            END
          WHEN p.id IS NOT NULL THEN 'Zebra'
          ELSE 'Unknown'
        END as marque
      FROM equipement e
      LEFT JOIN imprimante i ON e.idequipement = i.idequipement
      LEFT JOIN pda p ON e.idequipement = p.id
      ORDER BY e.idequipement DESC
      LIMIT $1
    `;
    
    const addedResult = await localPool.query(addedQuery, [limit]);
    
    // Format the activities
    const addedEquipment = addedResult.rows.map(eq => ({
      idequipement: eq.idequipement,
      equipment_type: eq.equipment_type,
      marque: eq.marque,
      activity_time: new Date().toISOString(), // Current time is fine since we'll sort by ID anyway
      activity_type: 'added',
      message: `Equipment ${eq.idequipement} (${eq.modele || eq.marque || 'Unknown'}) added with IP ${eq.ipadresse || 'Unknown'}`
    }));
    
    console.log(`Found ${addedEquipment.length} recent equipment activities`);
    res.json(addedEquipment);
  } catch (error) {
    console.error('Error fetching recent equipment activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent equipment activities',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get DataWedge version for a specific PDA
router.get('/pda/:id/datawedge-version', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the PDA's IP address first
        const query = `
            SELECT e.ipadresse
            FROM equipement e
            JOIN pda p ON e.idequipement = p.id
            WHERE e.idequipement = $1
        `;
        
        const result = await localPool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'PDA not found' });
        }
        
        const ip = result.rows[0].ipadresse;
        
        // Get DataWedge version using ADB
        const { promisify } = require('util');
        const { exec } = require('child_process');
        const execPromise = promisify(exec);
        
        console.log(`Fetching DataWedge version for PDA ${id} (IP: ${ip})...`);
        
        try {
            const { stdout } = await execPromise(`adb -s ${ip}:5555 shell "dumpsys package com.symbol.datawedge | grep versionName"`);
            
            // Parse version from output (format: "versionName=X.X.X.X")
            let version = 'Not installed';
            const versionMatch = stdout.match(/versionName=([0-9.]+)/);
            
            if (versionMatch && versionMatch[1]) {
                version = versionMatch[1];
                console.log(`Found DataWedge version: ${version}`);
            } else {
                console.log('DataWedge version not found in output:', stdout);
            }
            
            res.json({
                success: true,
                datawedgeVersion: version
            });
        } catch (adbError) {
            console.error('Error executing ADB command:', adbError);
            res.json({
                success: false,
                datawedgeVersion: 'Error retrieving version',
                error: adbError.message
            });
        }
    } catch (error) {
        console.error(`Error getting DataWedge version for PDA ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to get DataWedge version' });
    }
});

// Get DeviceManager version for a specific PDA
router.get('/pda/:id/devicemanager-version', async (req, res) => {
    try {
        const { id } = req.params;
        // Get the PDA's IP address first
        const query = `
            SELECT e.ipadresse
            FROM equipement e
            JOIN pda p ON e.idequipement = p.id
            WHERE e.idequipement = $1
        `;
        const result = await localPool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'PDA not found' });
        }
        const ip = result.rows[0].ipadresse;
        // Get DeviceManager version using ADB
        const { promisify } = require('util');
        const { exec } = require('child_process');
        const execPromise = promisify(exec);
        console.log(`Fetching DeviceManager version for PDA ${id} (IP: ${ip})...`);
        try {
            const { stdout } = await execPromise(`adb -s ${ip}:5555 shell "dumpsys package com.zebra.devicemanager | grep versionName"`);
            // Parse version from output (format: "versionName=X.X.X.X")
            let version = 'Not installed';
            const versionMatch = stdout.match(/versionName=([0-9.]+)/);
            if (versionMatch && versionMatch[1]) {
                version = versionMatch[1];
                console.log(`Found DeviceManager version: ${version}`);
            } else {
                console.log('DeviceManager version not found in output:', stdout);
            }
            res.json({
                success: true,
                devicemanagerVersion: version
            });
        } catch (adbError) {
            console.error('Error executing ADB command:', adbError);
            res.json({
                success: false,
                devicemanagerVersion: 'Error retrieving version',
                error: adbError.message
            });
        }
    } catch (error) {
        console.error(`Error getting DeviceManager version for PDA ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to get DeviceManager version' });
    }
});

module.exports = router; 