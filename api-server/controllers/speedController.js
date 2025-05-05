const net = require('net');
const { localPool, cloudPool } = require('../config/db');
const equipmentRepository = require('../models/equipmentRepository');

class SpeedController {
    getPrintSpeed = async (printerIp, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let response = '';

            socket.setTimeout(3000);

            socket.on('connect', () => {
                socket.write('~HD');
            });

            socket.on('data', (data) => {
                response += data.toString();
            });

            socket.on('timeout', () => {
                socket.destroy();
                const match = response.match(/Print Speed = (\d+\.\d+)/);
                if (match) {
                    resolve(parseFloat(match[1]));
                } else {
                    resolve(null);
                }
            });

            socket.on('error', (error) => {
                reject(error);
            });

            socket.on('close', () => {
                const match = response.match(/Print Speed = (\d+\.\d+)/);
                if (match) {
                    resolve(parseFloat(match[1]));
                } else {
                    resolve(null);
                }
            });

            socket.connect(port, printerIp);
        });
    }

    setPrintSpeed = async (printerIp, speedValue, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const speedStr = speedValue.toFixed(1);
            const sgdCmd = `! U1 setvar \"media.speed\" \"${speedStr}\"`;

            socket.setTimeout(3000);

            socket.on('connect', () => {
                socket.write(sgdCmd);
                // Give printer time to process the command
                setTimeout(() => {
                    socket.destroy();
                    resolve(true);
                }, 2000);
            });

            socket.on('error', (error) => {
                socket.destroy();
                reject(error);
            });

            socket.on('close', () => {
                resolve(true);
            });

            socket.connect(port, printerIp);
        });
    }

    updatePrinterSpeed = async (idequipement, speedValue) => {
        try {
            // First get the IP address from local database
            const getIpQuery = `
                SELECT ipadresse 
                FROM equipement 
                WHERE idequipement = $1
            `;
            const ipResult = await localPool.query(getIpQuery, [idequipement]);
            
            if (!ipResult.rows.length) {
                throw new Error('Equipment not found in local database');
            }

            const ipAdresse = ipResult.rows[0].ipadresse;
            console.log('Found IP address:', ipAdresse);

            // First check if printer exists in cloud database
            const checkCloudQuery = `
                SELECT i.vitesse, i.idequipement, e.ipadresse
                FROM imprimante i
                JOIN equipement e ON i.idequipement = e.idequipement
                WHERE e.ipadresse = $1
            `;
            console.log('Checking printer in cloud database...');
            const cloudCheck = await cloudPool.query(checkCloudQuery, [ipAdresse]);
            console.log('Cloud database check result:', cloudCheck.rows[0]);

            if (!cloudCheck.rows.length) {
                console.log('Printer not found in cloud database with IP:', ipAdresse);
                // Try to find the printer in cloud database by listing all printers
                const listPrintersQuery = `
                    SELECT i.vitesse, i.idequipement, e.ipadresse
                    FROM imprimante i
                    JOIN equipement e ON i.idequipement = e.idequipement
                `;
                console.log('Listing all printers in cloud database...');
                const allPrinters = await cloudPool.query(listPrintersQuery);
                console.log('All printers in cloud database:', allPrinters.rows);
                return {
                    local: null,
                    cloud: null,
                    error: 'Printer not found in cloud database',
                    cloud_printers: allPrinters.rows
                };
            }

            // Update local database using idequipement
            const localUpdateQuery = `
                UPDATE imprimante 
                SET vitesse = $1 
                WHERE idequipement = $2
                RETURNING *
            `;
            console.log('Attempting to update local database...');
            console.log('Local update query:', localUpdateQuery);
            console.log('Local update parameters:', [speedValue, idequipement]);
            const localResult = await localPool.query(localUpdateQuery, [speedValue, idequipement]);
            console.log('Local database update successful:', localResult.rows[0]);

            // Update cloud database using IP address
            const cloudUpdateQuery = `
                UPDATE imprimante i
                SET vitesse = $1
                FROM equipement e
                WHERE i.idequipement = e.idequipement
                AND e.ipadresse = $2
                RETURNING i.*
            `;
            console.log('Attempting to update cloud database...');
            console.log('Cloud update query:', cloudUpdateQuery);
            console.log('Cloud update parameters:', [speedValue, ipAdresse]);
            const cloudResult = await cloudPool.query(cloudUpdateQuery, [speedValue, ipAdresse]);
            console.log('Cloud database update result:', cloudResult);

            // Verify the update in cloud database
            const verifyQuery = `
                SELECT i.vitesse, i.idequipement, e.ipadresse
                FROM imprimante i
                JOIN equipement e ON i.idequipement = e.idequipement
                WHERE e.ipadresse = $1
            `;
            console.log('Verifying cloud database update...');
            const verifyResult = await cloudPool.query(verifyQuery, [ipAdresse]);
            console.log('Cloud database verification result:', verifyResult.rows[0]);

            return {
                local: localResult.rows[0],
                cloud: cloudResult.rows[0],
                verification: verifyResult.rows[0]
            };
        } catch (error) {
            console.error('Error updating printer speed:', error);
            if (error.message.includes('cloud')) {
                console.error('Cloud database update failed:', error.message);
            } else {
                console.error('Local database update failed:', error.message);
            }
            throw error;
        }
    }

    changeSpeed = async (req, res) => {
        try {
            const { id } = req.params;
            const { value } = req.body;
            
            // Get user info from the request headers or auth token
            const userEmail = req.headers['x-user-email'] || 'unknown_user';
            const userName = req.headers['x-user-name'] || 'Unknown User';

            // Get printer IP from database
            const query = `
                SELECT e.ipadresse, i.vitesse 
                FROM equipement e
                LEFT JOIN imprimante i ON e.idequipement = i.idequipement
                WHERE e.idequipement = $1
            `;
            const result = await localPool.query(query, [id]);
            
            if (!result.rows.length) {
                return res.status(404).json({ error: 'Equipment not found' });
            }

            const { ipadresse: printerIp, vitesse: currentDbSpeed } = result.rows[0];
            const newSpeed = parseFloat(value);

            if (isNaN(newSpeed) || newSpeed < 1 || newSpeed > 100) {
                return res.status(400).json({ error: 'Invalid speed value' });
            }

            // Get current speed from printer
            const beforeSpeed = await this.getPrintSpeed(printerIp);
            if (beforeSpeed === null) {
                return res.status(500).json({ error: 'Could not read current speed from printer' });
            }

            // Set new speed
            await this.setPrintSpeed(printerIp, newSpeed);
            
            // Wait for printer to update
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verify the change
            const afterSpeed = await this.getPrintSpeed(printerIp);

            // Update database
            const updateResult = await this.updatePrinterSpeed(id, newSpeed);

            // Log the command execution
            await equipmentRepository.logCommandExecution({
                idequipement: id,
                command_type: 'SPEED_CHANGE',
                command_details: `Changed printer speed from ${beforeSpeed} to ${newSpeed}`,
                old_value: beforeSpeed.toString(),
                new_value: afterSpeed.toString(),
                executed_by: `${userName} (${userEmail})`
            });

            res.json({
                success: true,
                printer_ip: printerIp,
                before_speed: beforeSpeed,
                after_speed: afterSpeed,
                message: `Print speed changed from ${beforeSpeed} to ${afterSpeed}`,
                database_updates: updateResult
            });

        } catch (error) {
            console.error('Error changing printer speed:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to change print speed'
            });
        }
    }
}

module.exports = new SpeedController(); 