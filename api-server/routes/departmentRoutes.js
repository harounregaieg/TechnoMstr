const express = require('express');
const router = express.Router();
const { localPool } = require('../config/db');
const Department = require('../models/departmentModel');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM departement ORDER BY nomdep';
    const result = await localPool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create a new department
router.post('/', async (req, res) => {
  try {
    const { nomdep } = req.body;
    
    if (!nomdep) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Use the Department model to create a new department
    const departmentData = { departement: nomdep };
    const result = await Department.handleDepartment(departmentData, 'create');
    
    res.status(201).json({
      success: true,
      department: result.localDepartment,
      cloud: result.cloudDepartment ? true : false
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

module.exports = router; 