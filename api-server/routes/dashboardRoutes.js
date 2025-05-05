const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Equipment statistics endpoint
router.get('/equipment-stats', dashboardController.getEquipmentStats);

// User statistics endpoint
router.get('/user-stats', dashboardController.getUserStats);

// Command history endpoint
router.get('/commands-history', dashboardController.getCommandsHistory);

// Ticket history endpoint
router.get('/ticket-history', dashboardController.getTicketHistory);

// Debug endpoint for action table
router.get('/debug/action-table', dashboardController.checkActionTable);

module.exports = router; 