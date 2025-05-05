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
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
  }

  static async create(nomdep, useCloud = false) {
    const pool = useCloud ? cloudPool : localPool;
    
    // First check if department exists (case-insensitive)
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
    
    try {
      const result = await pool.query(query, [nomdep]);
      return result.rows[0];
    } catch (error) {
      // If we get a duplicate key error, try to get the department again
      if (error.code === '23505') {
        return await this.getByName(nomdep, useCloud);
      }
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
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
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
    const result = await pool.query(query, [normalizedName]);
    return result.rows[0];
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

      // Handle cloud database
      let cloudDepartment;
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

      return { localDepartment, cloudDepartment };
    } catch (error) {
      console.error('Error handling department:', error);
      throw error;
    }
  }
}

module.exports = Department; 