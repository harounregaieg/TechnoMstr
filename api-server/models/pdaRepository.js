const { localPool } = require('../config/db');

/**
 * Add battery status for a PDA
 * @param {Object} batteryData - Battery information
 * @returns {Promise<Object>} - Added battery status
 */
async function addBatteryStatus(batteryData) {
  const { typeCharge, niveauCharge } = batteryData;
  const query = `
    INSERT INTO etat_batterie (typeCharge, niveauCharge)
    VALUES ($1, $2)
    RETURNING idBatterie
  `;
  const values = [typeCharge, niveauCharge];
  
  try {
    const result = await localPool.query(query, values);
    console.log('Battery status added:', result.rows[0]);
    return { idBatterie: result.rows[0].idbatterie };
  } catch (error) {
    console.error('Error adding battery status:', error);
    throw error;
  }
}

/**
 * Add storage status for a PDA
 * @param {Object} storageData - Storage information
 * @returns {Promise<Object>} - Added storage status
 */
async function addStorageStatus(storageData) {
  const { stockageTotale, stockageLibre } = storageData;
  const query = `
    INSERT INTO etat_stockage (stockageTotale, stockageLibre)
    VALUES ($1, $2)
    RETURNING idStockage
  `;
  const values = [stockageTotale, stockageLibre];
  
  try {
    const result = await localPool.query(query, values);
    console.log('Storage status added:', result.rows[0]);
    return { idStockage: result.rows[0].idstockage };
  } catch (error) {
    console.error('Error adding storage status:', error);
    throw error;
  }
}

/**
 * Add PDA information
 * @param {Object} pdaData - PDA information
 * @returns {Promise<Object>} - Added PDA
 */
async function addPda(pdaData) {
  const { id, versionAndroid, serialnumber, modele, idStockage, idBatterie } = pdaData;
  console.log('PDA data received:', { id, versionAndroid, serialnumber, modele, idStockage, idBatterie });
  
  const query = `
    INSERT INTO pda (id, versionAndroid, serialnumber, modele, idStockage, idBatterie)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [id, versionAndroid, serialnumber, modele, idStockage, idBatterie];
  
  try {
    const result = await localPool.query(query, values);
    console.log('PDA added successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error adding PDA:', error);
    throw error;
  }
}

/**
 * Add an application to the database
 * @param {string} packageName - The package name of the application
 * @returns {Promise<Object>} - Added application
 */
async function addApplication(packageName) {
  try {
    // First check if the application already exists
    const checkQuery = `
      SELECT idapp, packagename
      FROM application
      WHERE packagename = $1
    `;
    const checkResult = await localPool.query(checkQuery, [packageName]);
    
    if (checkResult.rows.length > 0) {
      // Application already exists, just return it
      console.log('Application already exists:', checkResult.rows[0]);
      return checkResult.rows[0];
    } else {
      // Application doesn't exist, insert it
      const insertQuery = `
        INSERT INTO application (packagename)
        VALUES ($1)
        RETURNING idapp, packagename
      `;
      const insertResult = await localPool.query(insertQuery, [packageName]);
      console.log('Application added:', insertResult.rows[0]);
      return insertResult.rows[0];
    }
  } catch (error) {
    console.error('Error adding application:', error);
    throw error;
  }
}

/**
 * Link a PDA to an application
 * @param {number} pdaId - The PDA ID
 * @param {number} appId - The application ID
 * @returns {Promise<Object>} - Added link
 */
async function linkPdaToApplication(pdaId, appId) {
  try {
    // Check if the link already exists
    const checkQuery = `
      SELECT idpda, idapp
      FROM pda_application
      WHERE idpda = $1 AND idapp = $2
    `;
    const checkResult = await localPool.query(checkQuery, [pdaId, appId]);
    
    if (checkResult.rows.length > 0) {
      // Link already exists
      return { message: 'Link already exists', exists: true };
    }
    
    // If not, create the link
    const insertQuery = `
      INSERT INTO pda_application (idpda, idapp)
      VALUES ($1, $2)
      RETURNING *
    `;
    const insertResult = await localPool.query(insertQuery, [pdaId, appId]);
    console.log(`Linked PDA ${pdaId} to application ${appId}`);
    return insertResult.rows[0];
  } catch (error) {
    console.error('Error linking PDA to application:', error);
    throw error;
  }
}

/**
 * Get all applications for a PDA
 * @param {number} pdaId - The PDA ID
 * @returns {Promise<Array>} - List of applications
 */
async function getPdaApplications(pdaId) {
  const query = `
    SELECT a.packagename
    FROM application a
    INNER JOIN pda_application pa ON a.idapp = pa.idapp
    WHERE pa.idpda = $1
  `;
  const values = [pdaId];
  
  try {
    const result = await localPool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting PDA applications:', error);
    throw error;
  }
}

/**
 * Store multiple applications for a PDA
 * @param {number} pdaId - The PDA ID
 * @param {Array<string>} packageNames - List of package names
 * @returns {Promise<Object>} - Result of the operation
 */
async function storeApplicationsForPda(pdaId, packageNames) {
  try {
    // First, clear existing applications for this PDA
    await localPool.query('DELETE FROM pda_application WHERE idpda = $1', [pdaId]);
    
    let addedCount = 0;
    // Add each application and link to PDA
    for (const packageName of packageNames) {
      const app = await addApplication(packageName);
      await linkPdaToApplication(pdaId, app.idapp);
      addedCount++;
    }
    
    return { success: true, message: `Stored ${addedCount} applications for PDA ID: ${pdaId}` };
  } catch (error) {
    console.error('Error storing applications for PDA:', error);
    throw error;
  }
}

/**
 * Get a PDA with all its installed applications
 * @param {number} pdaId - The PDA ID
 * @returns {Promise<Object>} - PDA with applications
 */
async function getPdaWithApplications(pdaId) {
  try {
    // Get PDA information
    const pdaQuery = `
      SELECT p.*, e.ipadresse, e.disponibilite, e.modele, 
             eb.typeCharge, eb.niveauCharge,
             es.stockageTotale, es.stockageLibre
      FROM pda p
      JOIN equipement e ON p.id = e.idequipement
      JOIN etat_batterie eb ON p.idBatterie = eb.idBatterie
      JOIN etat_stockage es ON p.idStockage = es.idStockage
      WHERE p.id = $1
    `;
    const pdaResult = await localPool.query(pdaQuery, [pdaId]);
    
    if (pdaResult.rows.length === 0) {
      return null;
    }
    
    const pda = pdaResult.rows[0];
    
    // Get applications for this PDA
    const apps = await getPdaApplications(pdaId);
    
    return {
      ...pda,
      applications: apps.map(app => app.packagename)
    };
  } catch (error) {
    console.error('Error getting PDA with applications:', error);
    throw error;
  }
}

module.exports = {
  addBatteryStatus,
  addStorageStatus,
  addPda,
  addApplication,
  linkPdaToApplication,
  getPdaApplications,
  storeApplicationsForPda,
  getPdaWithApplications
}; 