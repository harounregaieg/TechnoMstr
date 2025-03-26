const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.motdepasse, saltRounds);
      
      // Insert new user
      const query = `
        INSERT INTO users (nom, prenom, email, motdepasse, roleuser, statut, departement)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nom, prenom, email, roleuser, statut, departement
      `;
      
      const values = [
        userData.nom,
        userData.prenom,
        userData.email,
        hashedPassword,
        userData.roleuser,
        userData.statut || 'active',
        userData.departement
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Check for duplicate email
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async getAll() {
    const query = 'SELECT id, nom, prenom, email, roleuser, statut, departement FROM users';
    const result = await db.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 'SELECT id, nom, prenom, email, roleuser, statut, departement FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userData) {
    // First check if user exists
    const user = await this.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Building update query dynamically based on provided fields
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Only update fields that are provided
    for (const [key, value] of Object.entries(userData)) {
      // Skip password for now, handle it separately
      if (key !== 'motdepasse') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    // Handle password separately (if provided) to hash it
    if (userData.motdepasse) {
      const hashedPassword = await bcrypt.hash(userData.motdepasse, 10);
      fields.push(`motdepasse = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    // Add ID for WHERE clause
    values.push(id);

    // Construct and execute query
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, nom, prenom, email, roleuser, statut
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  }
}

module.exports = User;