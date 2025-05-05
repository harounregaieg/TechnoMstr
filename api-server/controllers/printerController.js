const net = require('net');
const { localPool, cloudPool } = require('../config/db');
const equipmentRepository = require('../models/equipmentRepository');

class PrinterController {
    getContrast = async (printerIp, port = 9100) => {
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
                const match = response.match(/Darkness Adjust = (\d+\.?\d*)/);
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
                const match = response.match(/Darkness Adjust = (\d+\.?\d*)/);
                if (match) {
                    resolve(parseFloat(match[1]));
                } else {
                    resolve(null);
                }
            });

            socket.connect(port, printerIp);
        });
    }

    setContrast = async (printerIp, contrastValue, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const zplCommand = `~SD${contrastValue.toFixed(1)}`;

            socket.setTimeout(3000);

            socket.on('connect', () => {
                socket.write(zplCommand);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('error', (error) => {
                reject(error);
            });

            socket.on('close', () => {
                resolve(true);
            });

            socket.connect(port, printerIp);
        });
    }

    updatePrinterContrast = async (idequipement, contrastValue) => {
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

            // Update query using IP address
            const updateQuery = `
                UPDATE imprimante i
                SET contrast = $1
                FROM equipement e
                WHERE i.idequipement = e.idequipement
                AND e.ipadresse = $2
                RETURNING i.*
            `;

            console.log('Attempting to update local database...');
            const localResult = await localPool.query(updateQuery, [contrastValue, ipAdresse]);
            console.log('Local database update successful:', localResult.rows[0]);

            console.log('Attempting to update cloud database...');
            const cloudResult = await cloudPool.query(updateQuery, [contrastValue, ipAdresse]);
            console.log('Cloud database update successful:', cloudResult.rows[0]);

            return {
                local: localResult.rows[0],
                cloud: cloudResult.rows[0]
            };
        } catch (error) {
            console.error('Error updating printer contrast:', error);
            if (error.message.includes('cloud')) {
                console.error('Cloud database update failed:', error.message);
            } else {
                console.error('Local database update failed:', error.message);
            }
            throw error;
        }
    }

    changeTemperature = async (req, res) => {
        try {
            const { id } = req.params;
            const { value } = req.body;
            
            // Get user info from the request headers or auth token
            const userEmail = req.headers['x-user-email'] || 'unknown_user';
            const userName = req.headers['x-user-name'] || 'Unknown User';

            // Get printer IP from database
            const query = `
                SELECT e.ipadresse, i.contrast 
                FROM equipement e
                LEFT JOIN imprimante i ON e.idequipement = i.idequipement
                WHERE e.idequipement = $1
            `;
            const result = await localPool.query(query, [id]);
            
            if (!result.rows.length) {
                return res.status(404).json({ error: 'Equipment not found' });
            }

            const { ipadresse: printerIp, contrast: currentDbContrast } = result.rows[0];
            const newContrast = parseFloat(value);

            if (isNaN(newContrast) || newContrast < 0 || newContrast > 100) {
                return res.status(400).json({ error: 'Invalid contrast value' });
            }

            // Get current contrast from printer
            const beforeContrast = await this.getContrast(printerIp);
            if (beforeContrast === null) {
                return res.status(500).json({ error: 'Could not read current contrast from printer' });
            }

            // Set new contrast
            await this.setContrast(printerIp, newContrast);
            
            // Wait for printer to update
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verify the change
            const afterContrast = await this.getContrast(printerIp);

            // Update database
            const updateResult = await this.updatePrinterContrast(id, newContrast);

            // Log the command execution
            await equipmentRepository.logCommandExecution({
                idequipement: id,
                command_type: 'CONTRAST_CHANGE',
                command_details: `Changed printer contrast from ${beforeContrast.toFixed(1)} to ${newContrast.toFixed(1)}`,
                old_value: beforeContrast.toFixed(1),
                new_value: afterContrast.toFixed(1),
                executed_by: `${userName} (${userEmail})`
            });

            res.json({
                success: true,
                printer_ip: printerIp,
                before_contrast: beforeContrast.toFixed(1),
                after_contrast: afterContrast.toFixed(1),
                message: `Temperature changed from ${beforeContrast.toFixed(1)} to ${afterContrast.toFixed(1)}`,
                database_updates: updateResult
            });

        } catch (error) {
            console.error('Error changing printer temperature:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to change temperature'
            });
        }
    }

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
            const sgdCmd = `! U1 setvar "media.speed" "${speedStr}"`;

            socket.setTimeout(3000);

            socket.on('connect', () => {
                socket.write(sgdCmd);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('error', (error) => {
                reject(error);
            });

            socket.on('close', () => {
                resolve(true);
            });

            socket.connect(port, printerIp);
        });
    }

    updatePrinterSpeed = async (idequipement, speedValue) => {
        const query = `
            UPDATE imprimante 
            SET vitesse = $1 
            WHERE idequipement = $2
            RETURNING *
        `;
        const result = await localPool.query(query, [speedValue, idequipement]);
        return result.rows[0];
    }

    changeSpeed = async (req, res) => {
        try {
            const { id } = req.params;
            const { value } = req.body;

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
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verify the change
            const afterSpeed = await this.getPrintSpeed(printerIp);

            // Update database
            await this.updatePrinterSpeed(id, newSpeed);

            res.json({
                success: true,
                printer_ip: printerIp,
                before_speed: beforeSpeed,
                after_speed: afterSpeed,
                message: `Print speed changed from ${beforeSpeed} to ${afterSpeed}`
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

    // Send a custom command to the printer and get the response
    sendCustomCommand = async (req, res) => {
        try {
            const { id } = req.params;
            const { command } = req.body;
            
            // Get user info from the request headers or auth token
            const userEmail = req.headers['x-user-email'] || 'unknown_user';
            const userName = req.headers['x-user-name'] || 'Unknown User';

            // Validate command
            if (!command || typeof command !== 'string') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Command is required and must be a string' 
                });
            }

            // Get printer IP from database
            const query = `
                SELECT e.ipadresse, e.modele
                FROM equipement e
                WHERE e.idequipement = $1
            `;
            const result = await localPool.query(query, [id]);
            
            if (!result.rows.length) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Equipment not found' 
                });
            }

            const { ipadresse: printerIp, modele } = result.rows[0];

            // Send the command to the printer
            const response = await this.executeCustomCommand(printerIp, command);

            // Log the command execution
            await equipmentRepository.logCommandExecution({
                idequipement: id,
                command_type: 'CUSTOM_COMMAND',
                command_details: `Sent custom command: ${command}`,
                old_value: 'N/A',
                new_value: 'N/A',
                executed_by: `${userName} (${userEmail})`
            });

            res.json({
                success: true,
                printer_ip: printerIp,
                model: modele,
                command: command,
                response: response || 'No response from printer',
                message: response 
                    ? `Command executed successfully: ${command}\nResponse: ${response}` 
                    : `Command executed: ${command}. No response received.`
            });

        } catch (error) {
            console.error('Error sending custom command to printer:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to send custom command'
            });
        }
    }

    // Execute a custom command on a printer and return the response
    executeCustomCommand = async (printerIp, command, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let response = '';
            const isZplCommand = command.startsWith('^');
            const isSgdCommand = command.startsWith('!');

            // Adjust timeout based on command type
            const timeout = isZplCommand ? 3000 : 5000;
            socket.setTimeout(timeout);

            socket.on('connect', () => {
                console.log(`Connected to printer at ${printerIp}. Sending command: ${command}`);
                
                // Send the command
                socket.write(command);
                
                // For SGD commands that don't already include a getvar operation,
                // we need to ensure we get some response
                if (isSgdCommand && !command.includes('getvar')) {
                    // Add a small delay before requesting status to ensure command is processed
                    setTimeout(() => {
                        socket.write('! U1 getvar "device.status"\r\n');
                    }, 500);
                }
                
                // For ZPL commands that don't explicitly request information,
                // add a host status request to get some response
                if (isZplCommand && !command.includes('^HH') && !command.includes('^HS')) {
                    // Add a small delay before requesting status
                    setTimeout(() => {
                        socket.write('^XA^HS^XZ');
                    }, 500);
                }
            });

            socket.on('data', (data) => {
                const chunk = data.toString();
                console.log(`Received data from printer (${chunk.length} bytes): ${chunk}`);
                response += chunk;
                
                // Some commands might need more time to complete
                // Reset the timer when we receive data
                socket.setTimeout(timeout);
            });

            socket.on('timeout', () => {
                console.log('Socket timeout reached. Closing connection.');
                socket.destroy();
                
                // Process ZPL response if needed
                if (isZplCommand && response.includes('PRINT INFO')) {
                    // Extract useful info from ZPL response
                    const processedResponse = this.processZplResponse(response);
                    resolve(processedResponse || response.trim() || null);
                } else {
                    resolve(response.trim() || null);
                }
            });

            socket.on('error', (error) => {
                console.error(`Socket error: ${error.message}`);
                reject(error);
            });

            socket.on('close', () => {
                console.log('Socket connection closed');
                
                // Process ZPL response if needed
                if (isZplCommand && response.includes('PRINT INFO')) {
                    // Extract useful info from ZPL response
                    const processedResponse = this.processZplResponse(response);
                    resolve(processedResponse || response.trim() || null);
                } else {
                    resolve(response.trim() || null);
                }
            });

            console.log(`Attempting to connect to printer at ${printerIp}:${port}`);
            socket.connect(port, printerIp);
        });
    }

    // Helper to process ZPL response data
    processZplResponse = (response) => {
        if (!response) return null;
        
        try {
            // Extract useful information from various ZPL responses
            if (response.includes('PRINT INFO')) {
                // Extract print information
                const lines = response.split('\n').filter(line => line.trim().length > 0);
                return lines.join('\n');
            } else if (response.includes('CONFIGURATION')) {
                // Extract configuration information
                const lines = response.split('\n').filter(line => line.trim().length > 0);
                return lines.join('\n');
            }
            
            return response.trim();
        } catch (error) {
            console.error('Error processing ZPL response:', error);
            return response.trim();
        }
    }
}

module.exports = new PrinterController(); 