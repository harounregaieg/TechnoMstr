const express = require('express');
const scannerController = require('../controllers/scannerController');

const router = express.Router();

// Scan network for all printers (Zebra and Sato)
router.get('/scan', scannerController.scanNetwork);

// Get printer status
router.get('/status', scannerController.getPrinterStatus);

// Get printer details
router.get('/printer/:ip', scannerController.getPrinterDetails);



module.exports = router;