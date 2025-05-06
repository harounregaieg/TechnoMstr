const { localPool, cloudPool } = require('../config/db');

class Department {
  // Helper method to normalize department name
  static normalizeDepartmentName(nomdep) {
    return nomdep.trim().toLowerCase();
  }

  // Get department by name (case-insensitive)
  static async getByName(nomdep, useCloud = false) {
    const pool = useCloud ? cloudPool : localPool;
    const normalizedName = this.normalizeDepartmentName(nomdep);
    const query = 'SELECT * FROM departement WHERE LOWER(nomdep) = $1';
    
    try {
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
    } catch (error) {
      // If this is a cloud operation and it failed, log and re-throw
      if (useCloud) {
        console.error('Error getting department by name from cloud database:', error);
        throw error;
      }
      
      // Otherwise re-throw for local operations
      throw error;
    }
  }

  static async create(nomdep, useCloud = false) {
    const pool = useCloud ? cloudPool : localPool;
    
    // First check if department exists (case-insensitive)
    try {
    const existingDept = await this.getByName(nomdep, useCloud);
    if (existingDept) {
      return existingDept;
    }

    // If department doesn't exist, create it with the original case
    const query = `
      INSERT INTO departement (nomdep, nbrparc, nbrutilisateur)
      VALUES ($1, 0, 1)
      RETURNING *
    `;
    
      const result = await pool.query(query, [nomdep]);
      return result.rows[0];
    } catch (error) {
      // If we get a duplicate key error, try to get the department again
      if (error.code === '23505') {
        return await this.getByName(nomdep, useCloud);
      }
      
      // If this is a cloud operation and it failed, log and re-throw
      if (useCloud) {
        console.error('Error creating department in cloud database:', error);
        throw error;
      }
      
      // Otherwise re-throw for local operations
      throw error;
    }
  }

  static async incrementUserCount(nomdep, useCloud = false) {
    const pool = useCloud ? cloudPool : localPool;
    const normalizedName = this.normalizeDepartmentName(nomdep);
    const query = `
      UPDATE departement 
      SET nbrutilisateur = nbrutilisateur + 1
      WHERE LOWER(nomdep) = $1
      RETURNING *
    `;
    
    try {
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
    } catch (error) {
      // If this is a cloud operation and it failed, log and re-throw
      if (useCloud) {
        console.error('Error incrementing user count in cloud database:', error);
        throw error;
      }
      
      // Otherwise re-throw for local operations
      throw error;
    }
  }

  static async decrementUserCount(nomdep, useCloud = false) {
    const pool = useCloud ? cloudPool : localPool;
    const normalizedName = this.normalizeDepartmentName(nomdep);
    const query = `
      UPDATE departement 
      SET nbrutilisateur = nbrutilisateur - 1
      WHERE LOWER(nomdep) = $1
      RETURNING *
    `;
    
    try {
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
    } catch (error) {
      // If this is a cloud operation and it failed, log and re-throw
      if (useCloud) {
        console.error('Error decrementing user count in cloud database:', error);
        throw error;
      }
      
      // Otherwise re-throw for local operations
      throw error;
    }
  }

  // Handle department operations in both databases
  static async handleDepartment(userData, operation = 'create') {
    try {
      // Handle local database
      let localDepartment;
      if (operation === 'create') {
        localDepartment = await this.getByName(userData.departement);
        if (localDepartment) {
          userData.departement = localDepartment.nomdep;
          await this.incrementUserCount(userData.departement);
        } else {
          localDepartment = await this.create(userData.departement);
          userData.departement = localDepartment.nomdep;
        }
      } else if (operation === 'delete') {
        await this.decrementUserCount(userData.departement);
      }

      // Handle cloud database with error handling
      let cloudDepartment;
      try {
      if (operation === 'create') {
        cloudDepartment = await this.getByName(userData.departement, true);
        if (cloudDepartment) {
          await this.incrementUserCount(userData.departement, true);
        } else {
          cloudDepartment = await this.create(userData.departement, true);
        }
      } else if (operation === 'delete') {
        await this.decrementUserCount(userData.departement, true);
        }
      } catch (cloudError) {
        console.error('Error handling cloud department operation:', cloudError);
        console.log('Continuing with local department operations only');
        // No need to throw - continue with local operations only
      }

      return { localDepartment, cloudDepartment };
    } catch (error) {
      console.error('Error handling department:', error);
      throw error;
    }
  }
}

module.exports = Department; 