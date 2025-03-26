// api/middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

// Validation middleware for login
exports.validateLoginInput = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array().map(err => err.msg) 
      });
    }
    
    next();
  }
];