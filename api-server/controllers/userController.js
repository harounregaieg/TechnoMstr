const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const { localPool, cloudPool } = require('../config/db');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.nom || !userData.prenom || !userData.email || !userData.motdepasse || !userData.roleuser || !userData.departement) {
      return res.status(400).json({ 
        error: 'All fields are required (nom, prenom, email, motdepasse, roleuser, departement)' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (userData.motdepasse.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Validate role
    const validRoles = ['user', 'technicien', 'admin', 'superadmin'];
    if (!validRoles.includes(userData.roleuser)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Handle department in both databases
    await Department.handleDepartment(userData, 'create');
    
    // Create the user in both databases
    const newUser = await User.create(userData);
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    
    // Get current user to check department changes
    const currentUser = await User.getById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate email if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    // Validate password if provided
    if (userData.motdepasse && userData.motdepasse.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Validate role if provided
    if (userData.roleuser) {
      const validRoles = ['user', 'technicien', 'admin', 'superadmin'];
      if (!validRoles.includes(userData.roleuser)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    // Handle department changes
    if (userData.departement && userData.departement !== currentUser.departement) {
      // Decrement user count for old department in both databases
      await Department.handleDepartment({ departement: currentUser.departement }, 'delete');
      // Handle new department in both databases
      await Department.handleDepartment(userData, 'create');
    }
    
    const updatedUser = await User.update(userId, userData);
    
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrement user count in both databases
    await Department.handleDepartment({ departement: user.departement }, 'delete');

    await User.delete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Toggle user status
exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Attempting to toggle status for user ID:', userId);
    
    const user = await User.getById(userId);
    console.log('Current user status:', user?.statut);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Toggle the status
    const newStatus = user.statut === 'active' ? 'inactive' : 'active';
    console.log('New status will be:', newStatus);
    
    const updatedUser = await User.update(userId, { statut: newStatus });
    console.log('Updated user:', updatedUser);
    
    res.status(200).json({
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to update user status',
      details: error.message 
    });
  }
};

// Get current user (by email from query or header for now)
exports.getCurrentUser = async (req, res) => {
  try {
    const email = req.query.email || req.headers['x-user-email'];
    if (!email) {
      return res.status(400).json({ error: 'User email required' });
    }
    const user = await User.getByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};