const express = require('express');
const monitorController = require('../controllers/monitorController');

const router = express.Router();

// Route to check status of all equipment
router.get('/check-status', async (req, res) => {
  try {
    const statusUpdates = await monitorController.monitorAllEquipment();
    res.json({
      success: true,
      message: 'Status check completed successfully',
      updatedEquipment: statusUpdates.filter(update => update.statusChanged),
      totalChecked: statusUpdates.length
    });
  } catch (error) {
    console.error('Error checking equipment status:', error);
    res.status(500).json({
      error: 'Failed to check equipment status',
      details: error.message
    });
  }
});

// Route to check status of a specific equipment
router.get('/check-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the equipment data first
    const query = `
      SELECT e.idequipement, e.ipadresse, e.disponibilite, i.idmarque, i.printer_status, i.status_message
      FROM equipement e
      LEFT JOIN imprimante i ON e.idequipement = i.idequipement
      WHERE e.idequipement = $1
    `;
    
    const db = require('../config/db').localPool;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    const equipment = result.rows[0];
    const status = await monitorController.checkEquipmentStatus(equipment);
    
    // Update database if status changed
    if (status.statusChanged) {
      await monitorController.updateEquipmentStatus(
        equipment.idequipement,
        status.newStatus,
        status.isOnline,
        status.statusMessage,
        status.printerStatus
      );
    }
    
    res.json({
      success: true,
      equipment: {
        id: equipment.idequipement,
        ipAddress: equipment.ipadresse,
        isOnline: status.isOnline,
        status: status.newStatus,
        statusMessage: status.statusMessage,
        printerStatus: status.printerStatus
      },
      statusChanged: status.statusChanged
    });
  } catch (error) {
    console.error('Error checking equipment status:', error);
    res.status(500).json({
      error: 'Failed to check equipment status',
      details: error.message
    });
  }
});

module.exports = router; 