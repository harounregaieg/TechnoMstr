// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getAllUsers);

// Get current user
router.get('/current', userController.getCurrentUser);

// Get a single user
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

// Update a user
router.put('/:id', userController.updateUser);

// Delete a user
router.delete('/:id', userController.deleteUser);

// Toggle user status
router.patch('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;
