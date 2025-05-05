const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const userRoutes = require('./userRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const monitorRoutes = require('./monitorRoutes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/monitor', monitorRoutes);

module.exports = router; 