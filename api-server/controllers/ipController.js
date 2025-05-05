const net = require('net');
const { localPool, cloudPool } = require('../config/db');
const equipmentRepository = require('../models/equipmentRepository');

class IpController {
    // Function to validate IP address format
    validateIpAddress = (ip) => {
        const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) {
            return false;
        }
        
        // Check each octet is between 0 and 255
        const octets = ip.split('.');
        return octets.every(octet => {
            const num = parseInt(octet);
            return num >= 0 && num <= 255;
        });
    }

    // Function to check if IP is reachable
    checkIpReachability = async (ip, port = 9100) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let isReachable = false;

            socket.setTimeout(3000);

            socket.on('connect', () => {
                isReachable = true;
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });

            socket.connect(port, ip);
        });
    }

    // Function to update IP in database
    updatePrinterIp = async (idequipement, newIp) => {
        try {
            // First get the current IP from local database
            const getCurrentIpQuery = `
                SELECT ipadresse 
                FROM equipement 
                WHERE idequipement = $1
            `;
            const currentIpResult = await localPool.query(getCurrentIpQuery, [idequipement]);
            
            if (!currentIpResult.rows.length) {
                throw new Error('Equipment not found in local database');
            }

            const currentIp = currentIpResult.rows[0].ipadresse;
            console.log('Current IP address:', currentIp);

            // Update local database
            const localUpdateQuery = `
                UPDATE equipement 
                SET ipadresse = $1 
                WHERE idequipement = $2
                RETURNING *
            `;
            console.log('Attempting to update local database...');
            console.log('Local update query:', localUpdateQuery);
            console.log('Local update parameters:', [newIp, idequipement]);
            const localResult = await localPool.query(localUpdateQuery, [newIp, idequipement]);
            console.log('Local database update successful:', localResult.rows[0]);

            // Update cloud database using current IP to find the record
            const cloudUpdateQuery = `
                UPDATE equipement 
                SET ipadresse = $1 
                WHERE ipadresse = $2
                RETURNING *
            `;
            console.log('Attempting to update cloud database...');
            console.log('Cloud update query:', cloudUpdateQuery);
            console.log('Cloud update parameters:', [newIp, currentIp]);
            const cloudResult = await cloudPool.query(cloudUpdateQuery, [newIp, currentIp]);
            console.log('Cloud database update result:', cloudResult);

            // Verify the update in cloud database
            const verifyQuery = `
                SELECT ipadresse, idequipement
                FROM equipement
                WHERE ipadresse = $1
            `;
            console.log('Verifying cloud database update...');
            const verifyResult = await cloudPool.query(verifyQuery, [newIp]);
            console.log('Cloud database verification result:', verifyResult.rows[0]);

            return {
                local: localResult.rows[0],
                cloud: cloudResult.rows[0],
                verification: verifyResult.rows[0]
            };
        } catch (error) {
            console.error('Error updating printer IP:', error);
            if (error.message.includes('cloud')) {
                console.error('Cloud database update failed:', error.message);
            } else {
                console.error('Local database update failed:', error.message);
            }
            throw error;
        }
    }

    // Function to send a single command and get response
    sendSingleCommand = async (printerIp, command, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let response = '';

            socket.setTimeout(5000); // 5 seconds timeout

            socket.on('connect', () => {
                console.log(`Connected to printer at ${printerIp}, sending command: ${command.trim()}`);
                socket.write(command);
            });

            socket.on('data', (data) => {
                response += data.toString();
                console.log('Printer response:', response);
            });

            socket.on('timeout', () => {
                console.log('Command timeout');
                socket.destroy();
                resolve(response || 'timeout');
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
                socket.destroy();
                reject(error);
            });

            socket.on('close', () => {
                console.log('Connection closed');
                resolve(response);
            });

            socket.connect(port, printerIp);
        });
    }

    // Function to verify printer is ready
    verifyPrinterReady = async (printerIp) => {
        try {
            const response = await this.sendSingleCommand(printerIp, `! U1 getvar "device.status"\r\n`);
            return response.includes('ready');
        } catch (error) {
            console.error('Error verifying printer status:', error);
            return false;
        }
    }

    // Function to send IP change command to printer
    sendIpChangeCommand = async (printerIp, newIp, port = 9100) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const ipOctets = newIp.split('.');
            const gateway = `${ipOctets[0]}.${ipOctets[1]}.${ipOctets[2]}.1`;
            
            // Format the commands for Zebra printer
            const commands = [
                `! U1 setvar "internal_wired.ip.protocol" "permanent"\r\n`,
                `! U1 setvar "internal_wired.ip.addr" "${newIp}"\r\n`,
                `! U1 setvar "internal_wired.ip.gateway" "${gateway}"\r\n`,
                `! U1 setvar "internal_wired.ip.netmask" "255.255.255.0"\r\n`,
                `! U1 setvar "device.reset" ""\r\n`,
                `\r\n`  // Extra newline after reset command
            ];

            socket.setTimeout(10000); // 10 seconds timeout

            socket.on('connect', async () => {
                try {
                    console.log(`Connected to printer at ${printerIp}, sending commands...`);
                    
                    // Send each command with a delay
                    for (const command of commands) {
                        console.log('Sending command:', command.trim());
                        socket.write(command);
                        
                        // Wait for response before sending next command
                        await new Promise((resolve) => {
                            const responseTimeout = setTimeout(() => {
                                console.log('No response received for command:', command.trim());
                                resolve();
                            }, 3000);

                            socket.once('data', (data) => {
                                clearTimeout(responseTimeout);
                                console.log('Printer response:', data.toString());
                                resolve();
                            });
                        });

                        // Add delay after certain commands
                        if (command.includes('device.reset')) {
                            console.log('Waiting after reset command...');
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                    
                    // Wait before closing
                    console.log('All commands sent, waiting before closing connection...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    socket.destroy();
                    console.log('Connection closed');
                    resolve(true);
                } catch (error) {
                    console.error('Error in command sequence:', error);
                    reject(error);
                }
            });

            socket.on('data', (data) => {
                console.log('Unexpected printer response:', data.toString());
            });

            socket.on('timeout', () => {
                console.log('Socket timeout - printer may be busy or unresponsive');
                socket.destroy();
                resolve(false);
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
                socket.destroy();
                reject(error);
            });

            console.log(`Attempting to connect to printer at ${printerIp}...`);
            socket.connect(port, printerIp);
        });
    }

    changeIp = async (req, res) => {
        try {
            const { id } = req.params;
            const { value: newIp, debug = false } = req.body;
            
            // Get user info from the request headers or auth token
            const userEmail = req.headers['x-user-email'] || 'unknown_user';
            const userName = req.headers['x-user-name'] || 'Unknown User';
            
            const debugLogs = [];

            // Validate IP format
            if (!this.validateIpAddress(newIp)) {
                return res.status(400).json({ 
                    error: 'Invalid IP address format',
                    message: 'Please enter a valid IP address (e.g., 192.168.1.100)',
                    debug: debug ? debugLogs : undefined
                });
            }

            // Get current printer details
            const query = `
                SELECT e.ipadresse as current_ip, e.modele, i.*
                FROM equipement e
                LEFT JOIN imprimante i ON e.idequipement = i.idequipement
                WHERE e.idequipement = $1
            `;
            const result = await localPool.query(query, [id]);
            
            if (!result.rows.length) {
                return res.status(404).json({ 
                    error: 'Equipment not found',
                    debug: debug ? debugLogs : undefined
                });
            }

            const { current_ip: currentIp, modele } = result.rows[0];

            debugLogs.push(`Starting IP change process for printer ${id}`);
            debugLogs.push(`Current IP: ${currentIp}, New IP: ${newIp}`);

            // First verify we can connect to the current IP
            debugLogs.push(`Verifying current IP (${currentIp}) is reachable...`);
            const isCurrentIpReachable = await this.checkIpReachability(currentIp);
            if (!isCurrentIpReachable) {
                debugLogs.push(`Current IP (${currentIp}) is not reachable, trying original IP (10.0.0.205)...`);
                const isOriginalIpReachable = await this.checkIpReachability('10.0.0.205');
                
                if (!isOriginalIpReachable) {
                    debugLogs.push('Neither current nor original IP is reachable');
                    return res.status(400).json({
                        error: 'Printer not reachable',
                        message: 'Cannot connect to printer at any known IP address. Please verify the printer is connected and powered on.',
                        debug: debug ? debugLogs : undefined
                    });
                }
                
                // If original IP is reachable, use it for the IP change
                currentIp = '10.0.0.205';
                debugLogs.push(`Using original IP (${currentIp}) for IP change`);
            }

            debugLogs.push(`Printer is reachable at ${currentIp}, proceeding with IP change to ${newIp}`);

            // Send IP change command to printer using current IP
            try {
                debugLogs.push(`Sending IP change commands to current IP (${currentIp})`);
                const commandResult = await this.sendIpChangeCommand(currentIp, newIp);
                if (!commandResult) {
                    throw new Error('Failed to send commands to printer');
                }
                debugLogs.push('IP change commands sent successfully');
            } catch (error) {
                debugLogs.push(`Error sending IP change command: ${error.message}`);
                return res.status(500).json({
                    error: 'Failed to send IP change command',
                    message: 'Could not communicate with printer to change IP address',
                    debug: debug ? debugLogs : undefined
                });
            }

            // Update IP in both databases
            debugLogs.push('Updating IP in databases...');
            const updateResult = await this.updatePrinterIp(id, newIp);
            debugLogs.push('Database updates complete:', updateResult);

            // Wait for printer to reboot (90 seconds)
            debugLogs.push('Waiting for printer to reboot (90 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 90000));
            debugLogs.push('Reboot wait complete');

            // Try to verify the new IP
            debugLogs.push('Attempting to verify new IP...');
            const isReachable = await this.checkIpReachability(newIp);
            debugLogs.push(`New IP reachability check: ${isReachable ? 'success' : 'failed'}`);

            if (!isReachable) {
                // If new IP is not reachable, try factory reset
                debugLogs.push('New IP not reachable, attempting factory reset...');
                try {
                    await this.sendFactoryReset(newIp);
                    debugLogs.push('Factory reset command sent, waiting for printer to reboot...');
                    await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes for factory reset
                    debugLogs.push('Factory reset wait complete');
                } catch (error) {
                    debugLogs.push(`Error during factory reset: ${error.message}`);
                }
            }

            // After successful IP change, log the command execution
            await equipmentRepository.logCommandExecution({
                idequipement: id,
                command_type: 'IP_CHANGE',
                command_details: `Changed printer IP from ${currentIp} to ${newIp}`,
                old_value: currentIp,
                new_value: newIp,
                executed_by: `${userName} (${userEmail})`
            });

            res.json({
                success: true,
                old_ip: currentIp,
                new_ip: newIp,
                is_reachable: isReachable,
                message: isReachable 
                    ? `IP address changed from ${currentIp} to ${newIp} and verified`
                    : `IP address changed from ${currentIp} to ${newIp}. Note: The new IP is not yet accessible. A factory reset has been attempted. Please check the printer's physical network settings.`,
                database_updates: updateResult,
                debug: debug ? debugLogs : undefined
            });

        } catch (error) {
            debugLogs.push(`Error changing printer IP: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to change printer IP address',
                debug: debug ? debugLogs : undefined
            });
        }
    }
}

module.exports = new IpController(); 