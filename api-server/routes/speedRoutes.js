const express = require('express');
const router = express.Router();
const speedController = require('../controllers/speedController');

// Change printer speed
router.post('/:id/speed', speedController.changeSpeed);

module.exports = router; 