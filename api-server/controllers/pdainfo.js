#!/usr/bin/env node
const { promisify } = require('util');
const child_process = require('child_process');
const exec = promisify(child_process.exec);

async function getAdbDevices() {
    /** Get list of all connected ADB devices */
    try {
        const { stdout } = await exec("adb devices");
        const devices = [];
        
        // Parse the output to get device IPs
        for (const line of stdout.split('\n')) {
            if (line.includes('device') && !line.includes('List of devices')) {
                const ip = line.split('\t')[0];
                if (ip.includes(':')) {
                    // Remove port number if present
                    devices.push(ip.split(':')[0]);
                } else {
                    devices.push(ip);
                }
            }
        }
        
        return devices;
    } catch (error) {
        console.error('Error getting ADB devices:', error);
        return [];
    }
}

async function getDeviceInfo(ip) {
    /** Get detailed information from a specific device */
    try {
        const deviceInfo = {};
        
        // Get device model
        const { stdout: model } = await exec(`adb -s ${ip}:5555 shell getprop ro.product.model`);
        deviceInfo.Model = model.trim();
        
        // Get Android version
        const { stdout: androidVersion } = await exec(`adb -s ${ip}:5555 shell getprop ro.build.version.release`);
        deviceInfo["Android Version"] = androidVersion.trim();
        
        // Get serial number
        const { stdout: serial } = await exec(`adb -s ${ip}:5555 shell getprop ro.serialno`);
        deviceInfo["Serial Number"] = serial.trim();
        
        // Get device manufacturer
        const { stdout: manufacturer } = await exec(`adb -s ${ip}:5555 shell getprop ro.product.manufacturer`);
        deviceInfo.Manufacturer = manufacturer.trim();
        
        // Get device name
        const { stdout: deviceName } = await exec(`adb -s ${ip}:5555 shell getprop ro.product.name`);
        deviceInfo["Device Name"] = deviceName.trim();
        
        // Get battery information
        const { stdout: battery } = await exec(`adb -s ${ip}:5555 shell dumpsys battery`);
        const batteryInfo = {};
        const batteryLines = battery.split('\n');
        for (const line of batteryLines) {
            if (line.includes('status:')) {
                const status = parseInt(line.split('status:')[1].trim());
                batteryInfo.status = status;  // Store the numeric value directly
            } else if (line.includes('level:') && !line.includes('low temp') && !line.includes('high temp')) {
                batteryInfo.level = line.split('level:')[1].trim();
            }
        }
        deviceInfo["Battery Info"] = batteryInfo;
        
        // Get storage information
        const { stdout: storageInfo } = await exec(`adb -s ${ip}:5555 shell df /data`);
        
        // Parse storage info to get total, used, and available space
        for (const line of storageInfo.split('\n')) {
            if (line.includes('/data')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    const total = parseInt(parts[1]) / (1024 * 1024);  // Convert to GB
                    const used = parseInt(parts[2]) / (1024 * 1024);   // Convert to GB
                    const available = parseInt(parts[3]) / (1024 * 1024);  // Convert to GB
                    deviceInfo["Storage Info"] = {
                        "Total": `${total.toFixed(2)} GB`,
                        "Used": `${used.toFixed(2)} GB`,
                        "Available": `${available.toFixed(2)} GB`
                    };
                    break;
                }
            }
        }
        
        return deviceInfo;
    } catch (error) {
        console.error(`Error getting device info for ${ip}:`, error);
        return null;
    }
}

async function scanDevices() {
    console.log('Starting PDA scanner...');
    const foundDevices = [];
    
    try {
        // Get all ADB devices
        const devices = await getAdbDevices();
        console.log('\nFound ADB devices:', devices);
        
        if (devices.length === 0) {
            console.log('No ADB devices found. Please ensure devices are connected and ADB is enabled.');
            return foundDevices;
        }
        
        // Process each device
        for (const ip of devices) {
            console.log(`\n=== Processing device ${ip} ===`);
            
            // Get device info directly via ADB
            const deviceInfo = await getDeviceInfo(ip);
            if (deviceInfo) {
                // Format device information for the UI
                const formattedDevice = {
                    ip: ip,
                    type: 'PDA',
                    model: deviceInfo.Model || 'N/A',
                    androidVersion: deviceInfo["Android Version"] || 'N/A',
                    serialNumber: deviceInfo["Serial Number"] || 'N/A',
                    manufacturer: deviceInfo.Manufacturer || 'N/A',
                    deviceName: deviceInfo["Device Name"] || 'N/A',
                    batteryInfo: {},
                    storageInfo: deviceInfo["Storage Info"] || {}
                };

                // Parse battery information
                if (deviceInfo["Battery Info"]) {
                    formattedDevice.batteryInfo.status = deviceInfo["Battery Info"].status;
                    formattedDevice.batteryInfo.level = deviceInfo["Battery Info"].level;
                }

                foundDevices.push(formattedDevice);
                
                // Log the information for the terminal
                console.log("\n=== Device Details ===");
                console.log(`  IP Address: ${ip}`);
                console.log(`  Model: ${formattedDevice.model}`);
                console.log(`  Android Version: ${formattedDevice.androidVersion}`);
                console.log(`  Serial Number: ${formattedDevice.serialNumber}`);
                console.log(`  Manufacturer: ${formattedDevice.manufacturer}`);
                console.log(`  Device Name: ${formattedDevice.deviceName}`);
                
                console.log("\n=== Battery Information ===");
                if (formattedDevice.batteryInfo.status) {
                    console.log(`  Status: ${formattedDevice.batteryInfo.status}`);
                }
                if (formattedDevice.batteryInfo.level) {
                    console.log(`  Level: ${formattedDevice.batteryInfo.level}`);
                }
                
                console.log("\n=== Storage Information ===");
                if (formattedDevice.storageInfo.Total) {
                    console.log(`  Total: ${formattedDevice.storageInfo.Total}`);
                    console.log(`  Used: ${formattedDevice.storageInfo.Used}`);
                    console.log(`  Available: ${formattedDevice.storageInfo.Available}`);
                }
            }
        }
        
        console.log('\nScan completed successfully');
        return foundDevices;
    } catch (error) {
        console.error('Error in PDA scan:', error);
        throw error;
    }
}

// Export the scanDevices function
module.exports = {
    scanDevices,
    getAdbDevices,
    getDeviceInfo
};

// Run the scanner if this file is executed directly
if (require.main === module) {
    scanDevices();
}