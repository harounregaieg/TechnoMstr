const express = require('express');
const scannerController = require('../controllers/scannerController');

const router = express.Router();

// Route to trigger network scan for Zebra printers
router.get('/scan', scannerController.scanNetwork);

// Route to get all discovered Zebra printers
router.get('/zebra-printers', scannerController.getZebraPrinters);

module.exports = router;