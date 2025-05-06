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
  const query = `
    INSERT INTO application (packagename)
    VALUES ($1)
    ON CONFLICT (packagename) DO UPDATE SET packagename = $1
    RETURNING idapp, packagename
  `;
  const values = [packageName];
  
  try {
    const result = await localPool.query(query, values);
    console.log('Application added or found:', result.rows[0]);
    return result.rows[0];
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
  const query = `
    INSERT INTO pda_application (idpda, idapp)
    VALUES ($1, $2)
    ON CONFLICT (idpda, idapp) DO NOTHING
    RETURNING *
  `;
  const values = [pdaId, appId];
  
  try {
    const result = await localPool.query(query, values);
    return result.rowCount > 0 ? result.rows[0] : { message: 'Link already exists' };
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

module.exports = {
  addBatteryStatus,
  addStorageStatus,
  addPda,
  addApplication,
  linkPdaToApplication,
  getPdaApplications,
  storeApplicationsForPda
}; 