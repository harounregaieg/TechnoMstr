const { localPool, cloudPool } = require('../config/db');
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
      
      // Check if this user already exists in local database
      try {
        const checkQuery = 'SELECT email FROM users WHERE email = $1';
        const checkResult = await localPool.query(checkQuery, [userData.email]);
        if (checkResult.rows.length > 0) {
          throw new Error('Email already exists');
        }
      } catch (checkError) {
        if (checkError.message === 'Email already exists') {
          throw checkError;
        }
        // Continue if it's just a database error checking existence
        console.error('Error checking email existence:', checkError);
      }
      
      // Insert into local first
      let localResult;
      try {
        const localRes = await localPool.query(query, values);
        localResult = localRes.rows[0];
      } catch (localErr) {
        if (localErr.code === '23505' && localErr.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
        throw new Error(`Failed to create user in local DB: ${localErr.message}`);
      }
      
      // Try to insert into cloud, but ignore errors
      try {
        await cloudPool.query(query, values);
        console.log('User created in cloud database');
      } catch (cloudErr) {
        console.error('Cloud database insert failed (ignored):', cloudErr.message);
      }
      
      return localResult;
    } catch (error) {
      console.error('Error in User.create:', error);
      if (error.message === 'Email already exists') {
      throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async getAll() {
    // Get from local database
    const query = 'SELECT id, nom, prenom, email, roleuser, statut, departement FROM users';
    const result = await localPool.query(query);
    return result.rows;
  }

  static async getById(id) {
    try {
      // First get the user's email by ID from local database
      const getEmailQuery = 'SELECT email FROM users WHERE id = $1';
      const emailResult = await localPool.query(getEmailQuery, [id]);
      
      if (emailResult.rows.length === 0) {
        return null;
      }

      const userEmail = emailResult.rows[0].email;
      
      // Get user details using email from local database
      const query = 'SELECT id, nom, prenom, email, roleuser, statut, departement FROM users WHERE email = $1';
      const result = await localPool.query(query, [userEmail]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in User.getById:', error);
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      // First get the user's email by ID from local database
      const getUserQuery = 'SELECT email FROM users WHERE id = $1';
      const userResult = await localPool.query(getUserQuery, [id]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const userEmail = userResult.rows[0].email;
      console.log('Updating user with email:', userEmail);

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

      // Add email for WHERE clause
      values.push(userEmail);

      // Construct and execute query
      const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE email = $${paramCount}
        RETURNING id, nom, prenom, email, roleuser, statut, departement
      `;

      console.log('Update query:', query);
      console.log('Query values:', values);

      // Try to update both databases, but continue with local if cloud fails
      try {
      // Update both databases
      const [localResult, cloudResult] = await Promise.all([
        localPool.query(query, values),
        cloudPool.query(query, values)
      ]);

      console.log('Local update result:', localResult.rows[0]);
      console.log('Cloud update result:', cloudResult.rows[0]);

      return localResult.rows[0];
      } catch (cloudError) {
        console.error('Error updating user in cloud database:', cloudError);
        
        // If there was an error with the cloud database, still update local
        const localResult = await localPool.query(query, values);
        console.log('User updated in local database only');
        
        return localResult.rows[0];
      }
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    // First get the user's email by ID from local database
    const getUserQuery = 'SELECT email, departement FROM users WHERE id = $1';
    const userResult = await localPool.query(getUserQuery, [id]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userEmail = userResult.rows[0].email;
    const userDepartment = userResult.rows[0].departement;

    // Delete from both databases using email
    const deleteQuery = 'DELETE FROM users WHERE email = $1 RETURNING id, departement';
    
    try {
      // Try to delete from both databases, but continue with local if cloud fails
      let localResult;
      try {
        // Delete from both databases
        const [localRes, cloudRes] = await Promise.all([
          localPool.query(deleteQuery, [userEmail]),
          cloudPool.query(deleteQuery, [userEmail])
        ]);
        localResult = localRes;
      } catch (cloudError) {
        console.error('Error deleting user from cloud database:', cloudError);
        // If there was an error with the cloud database, still delete from local
        localResult = await localPool.query(deleteQuery, [userEmail]);
        console.log('User deleted from local database only');
      }
      // Safely check if localResult.rows[0] exists
      if (localResult.rows && localResult.rows[0]) {
      return { id: localResult.rows[0].id, departement: userDepartment };
      } else {
        // User was deleted, but no row returned (should not happen, but handle gracefully)
        return { id: null, departement: userDepartment };
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getStatistics(departement) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN roleuser = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN roleuser = 'technicien' THEN 1 END) as tech_count,
        COUNT(CASE WHEN roleuser = 'user' THEN 1 END) as user_count
      FROM users
      WHERE departement = $1
    `;

    try {
      const result = await localPool.query(query, [departement]);
      const stats = result.rows[0];
      
      return {
        total: parseInt(stats.total),
        admin: parseInt(stats.admin_count),
        tech: parseInt(stats.tech_count),
        user: parseInt(stats.user_count)
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  static async getByEmail(email) {
    try {
    const query = 'SELECT id, nom, prenom, email, roleuser, statut, departement FROM users WHERE email = $1';
    const result = await localPool.query(query, [email]);
    return result.rows[0];
    } catch (error) {
      console.error('Error in User.getByEmail:', error);
      throw error;
    }
  }
}

module.exports = User;