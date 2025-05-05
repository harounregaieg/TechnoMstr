// api/middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

/**
 * Validates login input data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  // Check if email is provided
  if (!email) {
    errors.push('Email is required');
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Check if password is provided
  if (!password) {
    errors.push('Password is required');
  }
  
  // If there are validation errors, return 400 with error messages
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation error',
      errors
    });
  }
  
  // If validation passes, proceed to the next middleware
  next();
};

/**
 * Validates new user input data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validateUserInput = (req, res, next) => {
  const { nom, prenom, email, motdepasse, roleuser } = req.body;
  const errors = [];
  
  // Check required fields
  if (!nom) errors.push('Name is required');
  if (!prenom) errors.push('First name is required');
  
  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Validate password
  if (!motdepasse) {
    errors.push('Password is required');
  } else if (motdepasse.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  // Validate role
  if (!roleuser) {
    errors.push('Role is required');
  } else {
    const validRoles = ['user', 'technicien', 'admin', 'superadmin'];
    if (!validRoles.includes(roleuser)) {
      errors.push('Invalid role');
    }
  }
  
  // If there are validation errors, return 400 with error messages
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation error',
      errors
    });
  }
  
  // If validation passes, proceed to the next middleware
  next();
};