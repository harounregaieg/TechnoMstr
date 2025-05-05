const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const equipmentRepository = require('../models/equipmentRepository');
const { scanDevices } = require('../controllers/pdainfo');
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

module.exports = router; 