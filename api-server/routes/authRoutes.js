const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { localPool, cloudPool } = require('../config/db');
const { validateLoginInput } = require('../middleware/validationMiddleware');

// Login route
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = process.env.NODE_ENV === 'production' ? cloudPool : localPool;
    
    console.log('Login attempt for email:', email);
    
    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    const user = result.rows[0];
    console.log('User found with ID:', user.id);
    
    // Log the stored password hash for debugging (partial)
    const partialHash = user.motdepasse ? user.motdepasse.substring(0, 10) + '...' : 'null';
    console.log('Stored password hash (partial):', partialHash);
    
    // Check password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.motdepasse);
      console.log('bcrypt.compare result:', isPasswordValid);
    } catch (bcryptError) {
      console.error('bcrypt.compare error:', bcryptError);
      
      // TEMPORARY FALLBACK for testing: direct comparison if bcrypt fails
      // IMPORTANT: REMOVE THIS IN PRODUCTION!
      if (password === user.motdepasse) {
        console.log('INSECURE: Direct password match (for testing only)');
        isPasswordValid = true;
      }
    }
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.id);
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    console.log('Valid password for user:', user.id);
    
    // Update last_login timestamp
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roleuser },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send response without password
    delete user.motdepasse;
    
    console.log('Login successful for user:', user.id);
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur de connexion' });
  }
});

module.exports = router; 