const express = require('express');
const router = express.Router();
const ipController = require('../controllers/ipController');

// Change printer IP address
router.post('/:id/ip', ipController.changeIp);

module.exports = router; 