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

module.exports = {
  addBatteryStatus,
  addStorageStatus,
  addPda
}; 