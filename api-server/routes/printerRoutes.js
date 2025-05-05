const express = require('express');
const router = express.Router();
const printerController = require('../controllers/printerController');

// Change printer temperature/contrast
router.post('/:id/temperature', printerController.changeTemperature);

// Change printer speed
router.post('/:id/speed', printerController.changeSpeed);

// Send custom command to printer
router.post('/:id/custom', printerController.sendCustomCommand);

module.exports = router; 