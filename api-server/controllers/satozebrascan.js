const express = require('express');
const { exec } = require('child_process');
const http = require('http');
const cheerio = require('cheerio');
const { promisify } = require('util');
const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');

// Express app setup
const app = express();
const port = 3002;

// Default credentials for Sato printers
const SATO_USERNAME = 'admin';
const SATO_PASSWORD = 'admin';

// Timeout settings
const CONNECTION_TIMEOUT = 5000; // 5 seconds
const STATUS_FILE = path.join(__dirname, 'data/printer_status.txt');

// Create data directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir(path.dirname(STATUS_FILE), { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
})();

// Main routes
app.get('/', (req, res) => {
  res.send('Combined Zebra and SATO Printer Network Scanner API');
});

// API endpoint to scan for all printer types
app.get('/scan', async (req, res) => {
  try {
    console.log("=== Combined Printer Network Scanner ===");
    console.log("Scanning network for devices...");
    
    // Step 1: Scan network for devices with web ports open
    const networkDevices = await scanNetwork();
    
    if (networkDevices.size === 0) {
      return res.json({ 
        message: "No devices found with web ports open.",
        devices: {} 
      });
    }
    
    console.log(`\nFound ${networkDevices.size} devices with web ports open.`);
    
    // Step 2: Check each device for printers
    console.log("\nChecking for Zebra and Sato printers...");
    const results = await findPrinters(networkDevices);
    
    res.json(results);
  } catch (error) {
    console.error('Error processing scan:', error);
    res.status(500).json({ error: 'Error processing scan', details: error.message });
  }
});

// API endpoint to get all previously discovered printers
app.get('/printers', async (req, res) => {
  try {
    const printerStatus = await loadPrinterStatuses();
    res.json(printerStatus);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// API endpoint to get Zebra printers only
app.get('/printers/zebra', async (req, res) => {
  try {
    const allStatuses = await loadPrinterStatuses();
    const zebraPrinters = {};
    
    // Filter only Zebra printers
    for (const [ip, printer] of Object.entries(allStatuses)) {
      if (printer.type === 'ZebraPrinter') {
        zebraPrinters[ip] = printer;
      }
    }
    
    res.json(zebraPrinters);
  } catch (error) {
    console.error('Error fetching Zebra printers:', error);
    res.status(500).json({ error: 'Failed to fetch Zebra printers' });
  }
});

// API endpoint to get Sato printers only
app.get('/printers/sato', async (req, res) => {
  try {
    const allStatuses = await loadPrinterStatuses();
    const satoPrinters = {};
    
    // Filter only Sato printers
    for (const [ip, printer] of Object.entries(allStatuses)) {
      if (printer.type === 'SatoPrinter') {
        satoPrinters[ip] = printer;
      }
    }
    
    res.json(satoPrinters);
  } catch (error) {
    console.error('Error fetching Sato printers:', error);
    res.status(500).json({ error: 'Failed to fetch Sato printers' });
  }
});

/**
 * Scans the network for devices with web ports open
 * @returns {Promise<Set>} Set of IP addresses with web ports open
 */
async function scanNetwork() {
  const ipAddresses = new Set();
  
  try {
    // Using nmap to scan for devices with port 80 or 443 open
    const { stdout } = await promisify(exec)('nmap -p 80,443 --open 10.0.0.0/24');
    
    let ipAddress = null;
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Nmap scan report')) {
        ipAddress = line.split(' ')[4]; // Extract IP address
      }
      
      if (line.includes('80/tcp') || line.includes('443/tcp')) {
        if (ipAddress) {
          ipAddresses.add(ipAddress);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning network: ${error.message}`);
  }
  
  return ipAddresses;
}

/**
 * Main function to check for and identify both printer types
 * @param {Set} ipAddresses Set of IP addresses to check
 * @returns {Promise<Object>} Object containing discovered printers
 */
async function findPrinters(ipAddresses) {
  const printers = {
    zebra: {},
    sato: {},
    message: ''
  };
  
  const savedStatuses = await loadPrinterStatuses();
  const printerCheckPromises = [];
  
  // Process each IP address
  for (const ip of ipAddresses) {
    printerCheckPromises.push(
      (async () => {
        try {
          // Check if it's a Zebra printer
          const isZebraPrinter = await checkIfZebraPrinter(ip);
          
          if (isZebraPrinter) {
            console.log(`Zebra Printer found at IP: ${ip}`);
            const printerDetails = await fetchZebraPrinterDetails(ip);
            printers.zebra[ip] = {
              type: 'ZebraPrinter',
              status: 'Online',
              ...printerDetails
            };
            await savePrinterStatus(ip, 'ZebraPrinter', 'Online', printerDetails);
            return; // Skip checking for Sato if it's a Zebra
          }
          
          // Check if it's a Sato printer
          const printerUrl = `http://${ip}`;
          const isSatoPrinter = await isSatoPrinterByPages(printerUrl);
          
          if (isSatoPrinter) {
            console.log(`Sato printer found at: ${printerUrl}`);
            const printerInfo = await getSatoPrinterInfo(printerUrl);
            printers.sato[ip] = {
              ip: ip,
              type: 'SatoPrinter',
              status: 'Online',
              statusMessage: printerInfo.statusMessage || printerInfo.detailedStatus || 'Status not available',
              ...printerInfo
            };
            await savePrinterStatus(ip, 'SatoPrinter', 'Online', {
              ...printerInfo,
              statusMessage: printerInfo.statusMessage || printerInfo.detailedStatus || 'Status not available'
            });
          }
        } catch (error) {
          // Check if this was previously identified as a printer
          if (savedStatuses[ip]) {
            const printerType = savedStatuses[ip].type;
            
            console.log(`Known ${printerType} at ${ip} appears to be offline or unreachable`);
            
            if (printerType === 'ZebraPrinter') {
              printers.zebra[ip] = {
                type: 'ZebraPrinter',
                status: 'Offline',
                error: error.message
              };
            } else if (printerType === 'SatoPrinter') {
              printers.sato[ip] = {
                type: 'SatoPrinter',
                status: 'Offline',
                statusMessage: 'Printer is offline or unreachable',
                error: error.message
              };
            }
            
            await savePrinterStatus(ip, printerType, 'Offline');
          }
        }
      })()
    );
  }
  
  // Wait for all checks to complete
  await Promise.allSettled(printerCheckPromises);
  
  // Check previously saved printers that are now offline
  for (const savedIp of Object.keys(savedStatuses)) {
    if (!ipAddresses.has(savedIp)) {
      const printerType = savedStatuses[savedIp].type;
      
      if (printerType === 'ZebraPrinter' && !printers.zebra[savedIp]) {
        printers.zebra[savedIp] = {
          type: 'ZebraPrinter',
          status: 'Offline'
        };
        await savePrinterStatus(savedIp, 'ZebraPrinter', 'Offline');
      } else if (printerType === 'SatoPrinter' && !printers.sato[savedIp]) {
        printers.sato[savedIp] = {
          type: 'SatoPrinter',
          status: 'Offline'
        };
        await savePrinterStatus(savedIp, 'SatoPrinter', 'Offline');
      }
    }
  }
  
  // Generate summary message
  const zebraCount = Object.keys(printers.zebra).length;
  const satoCount = Object.keys(printers.sato).length;
  printers.message = `Found ${zebraCount} Zebra printer(s) and ${satoCount} Sato printer(s) on the network`;
  
  console.log(printers.message);
  return printers;
}

// ===== ZEBRA PRINTER FUNCTIONS =====

/**
 * Checks if a device is specifically a Zebra printer
 * @param {string} ip IP address of the device
 * @returns {Promise<boolean>} True if it's a Zebra printer, false otherwise
 */
async function checkIfZebraPrinter(ip) {
  try {
    // Try to access common Zebra printer paths
    const endpoints = [
      `http://${ip}`,
      `http://${ip}/config.html`,
      `http://${ip}/info.html`,
      `http://${ip}/status.html`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { 
          timeout: 3000,
          validateStatus: () => true 
        });
        
        if (response.status === 200) {
          const pageText = response.data.toLowerCase();
          
          // Check specifically for Zebra indicators
          if (pageText.includes('zebra')) {
            return true;
          }
        }
      } catch (error) {
        // Continue to next endpoint if this one fails
        continue;
      }
    }
    
    return false; // Not a Zebra printer
  } catch (error) {
    return false; // Error occurred, assume not a Zebra printer
  }
}

/**
 * Fetches details from a Zebra printer
 * @param {string} ip IP address of the printer
 * @returns {Promise<Object>} Printer details
 */
async function fetchZebraPrinterDetails(ip) {
  try {
    const printerDetails = {};
    
    // Fetch data from config page
    const configUrl = `http://${ip}/config.html`;
    const configResponse = await axios.get(configUrl, { timeout: 5000 });
    const $config = cheerio.load(configResponse.data);
    
    // Fetch data from main page
    const indexUrl = `http://${ip}`;
    const indexResponse = await axios.get(indexUrl, { timeout: 5000 });
    const $index = cheerio.load(indexResponse.data);
    
    // Extract model from the h1 tag
    const modelElement = $index('h1').first();
    if (modelElement) {
      const modelText = modelElement.text();
      // Extract the model name (e.g., "ZD420-203dpi" from "Zebra Technologies ZTC ZD420-203dpi ZPL")
      const modelMatch = modelText.match(/ZTC\s+([^\s]+)/);
      if (modelMatch) {
        const fullModel = modelMatch[1].trim();
        printerDetails.model = fullModel;
        console.log('Found printer model:', printerDetails.model);
        
        // Extract resolution from model name (e.g., "203dpi" from "ZD420-203dpi")
        const resolutionMatch = fullModel.match(/(\d+)dpi$/);
        if (resolutionMatch) {
          printerDetails.resolution = `${resolutionMatch[1]} dpi`;
          console.log('Found printer resolution:', printerDetails.resolution);
        }
      }
    }
    
    // Extract serial number
    const serialNumberElement = $config('h2').first();
    printerDetails.serialNumber = serialNumberElement ? serialNumberElement.text() : 'Serial Number not found';
    
    // Extract printer status and error message
    const statusElements = $index('h3 font');
    printerDetails.printerStatus = statusElements.first().text() || 'Status not found';
    
    // If printer is paused, get the error message from the second h3 font element
    if (printerDetails.printerStatus.includes('PAUSED')) {
      const errorMessage = statusElements.eq(1).text();
      if (errorMessage) {
        printerDetails.statusMessage = errorMessage;
        console.log('Found error message:', errorMessage);
      }
    } else {
      printerDetails.statusMessage = printerDetails.printerStatus;
    }
    
    // Parse config text to extract details
    const configText = $config.text();
    const configLines = configText.split('\n');
    
    for (const line of configLines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('Zebra Technologies') && !printerDetails.model) {
        const modelMatch = trimmedLine.match(/ZTC\s+([^\s]+)/);
        if (modelMatch) {
          printerDetails.model = modelMatch[1].trim();
          console.log('Found printer model:', printerDetails.model);
        }
      } else if (trimmedLine.includes('FIRMWARE')) {
        printerDetails.firmware = trimmedLine.replace('FIRMWARE', '').trim();
      } else if (trimmedLine.includes('HARDWARE ID')) {
        printerDetails.hardwareId = trimmedLine.replace('HARDWARE ID', '').trim();
      } else if (trimmedLine.includes('LINK-OS VERSION')) {
        printerDetails.linkOsVersion = trimmedLine.replace('LINK-OS VERSION', '').trim();
      } else if (trimmedLine.includes('DARKNESS') && !trimmedLine.includes('DARKNESS SWITCH')) {
        const darknessValue = trimmedLine.split('DARKNESS')[0].trim();
        if (darknessValue) {
          printerDetails.contrast = darknessValue.replace('+', '').trim();
          console.log('Found darkness value:', printerDetails.contrast);
        }
      } else if (trimmedLine.includes('PRINT SPEED')) {
        // Extract the print speed value (e.g., "4.0 IPS")
        const speedMatch = trimmedLine.match(/^([\d.]+)\s+IPS/);
        if (speedMatch) {
          printerDetails.vitesse = parseFloat(speedMatch[1]);
          console.log('Found print speed:', printerDetails.vitesse);
        }
      } else if (trimmedLine.includes('PRINT METHOD')) {
        // Extract the print method value (e.g., "THERMAL-TRANS.")
        const methodMatch = trimmedLine.match(/^([A-Z-]+\.?)\s+PRINT METHOD/);
        if (methodMatch) {
          printerDetails.typeImpression = methodMatch[1].trim();
          console.log('Found print method:', printerDetails.typeImpression);
        }
      }
    }
    
    // If no darkness value was found, set a default
    if (!printerDetails.contrast) {
      console.log('No darkness value found, using default');
      printerDetails.contrast = '20';
    }
    
    console.log(`Zebra Printer Found at ${ip}`);
    console.log(`Printer Status: ${printerDetails.printerStatus}`);
    if (printerDetails.model) {
      console.log(`Model: ${printerDetails.model}`);
    }
    if (printerDetails.serialNumber) {
      console.log(`Serial Number: ${printerDetails.serialNumber}`);
    }
    if (printerDetails.contrast) {
      console.log(`Darkness/Contrast: ${printerDetails.contrast}`);
    }
    
    return printerDetails;
  } catch (error) {
    console.error(`Error fetching Zebra printer data at IP: ${ip}`, error.message);
    return { error: 'Failed to fetch printer details' };
  }
}

// ===== SATO PRINTER FUNCTIONS =====

/**
 * Improved method to check if the given IP is a Sato printer
 * by trying multiple detection methods
 * @param {string} baseUrl Base URL of the printer
 * @returns {Promise<boolean>} True if it's a Sato printer, false otherwise
 */
async function isSatoPrinterByPages(baseUrl) {
  // Try several pages that are specific to Sato printers
  const satoPages = [
    '/Main_Frame.htm?',
    '/PS_General_Normal.htm',
  ];
  
  for (const page of satoPages) {
    try {
      const fullUrl = baseUrl + page;
      const response = await makeAuthenticatedRequest(fullUrl);
      
      if (response && containsSatoKeywords(response)) {
        console.log(`Sato printer detected at ${baseUrl} via page ${page}`);
        return true;
      }
    } catch (error) {
      // Connection failed or timed out for this page, continue to next page
    }
  }
  
  return false;
}

/**
 * Check if the content contains any Sato-related keywords
 * @param {string} content HTML content to check
 * @returns {boolean} True if content contains Sato keywords
 */
function containsSatoKeywords(content) {
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  const satoKeywords = [
    'sato', 'cl4nx', 'cl6nx', 'printer status', 'printer information',
    'sato printer', 'printer settings', 'printer configuration',
    'ps_general', 'main_status', 'web interface', 'admin login',
    '<title>sato', '<h1>sato', 'label printer'
  ];
  
  for (const keyword of satoKeywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      console.log(`Found Sato keyword: ${keyword} in content`);
      return true;
    }
  }
  
  return false;
}

/**
 * Gets the status and information of the Sato printer
 * @param {string} printerIp URL of the printer
 * @returns {Promise<Object>} Printer information
 */
async function getSatoPrinterInfo(printerIp) {
  try {
    // Get printer status
    console.log("\n--- SATO PRINTER STATUS INFORMATION ---");
    const statusData = await getSatoPrinterStatus(printerIp);
    if (statusData) {
      console.log(statusData.status);
    } else {
      console.log("Could not retrieve Sato printer status.");
    }
    
    // Get printer configuration details
    console.log("\n--- SATO PRINTER CONFIGURATION DETAILS ---");
    const configData = await getSatoPrinterConfig(printerIp);
    if (configData) {
      console.log(configData.configuration);
    } else {
      console.log("Could not retrieve Sato printer configuration.");
    }
    
    // Extract resolution from status
    let resolution = '203 dpi'; // Default value
    if (statusData) {
      // Look for resolution in the status text
      const resolutionMatch = statusData.status.match(/Resolution:\s*([^|\n]+)/);
      if (resolutionMatch) {
        resolution = resolutionMatch[1].trim();
        console.log('Found Sato printer resolution:', resolution);
      }
    }

    // Use error message if present, otherwise use status
    let detailedStatus = statusData?.errorMessage || statusData?.status || "Status not available";
    console.log('Found Sato printer status:', detailedStatus);
    
    return {
      status: statusData?.status || "Could not retrieve printer status.",
      configuration: configData?.configuration || "Could not retrieve printer configuration.",
      contrast: configData?.contrast || '18',
      resolution: resolution,
      detailedStatus: detailedStatus,
      statusMessage: detailedStatus,
      model: statusData?.model || 'Sato Printer'
    };
  } catch (error) {
    console.error(`Error getting Sato printer information: ${error.message}`);
    return {
      status: "Error retrieving status",
      configuration: "Error retrieving configuration",
      contrast: '18',
      resolution: '203 dpi',
      detailedStatus: "Error retrieving status",
      error: error.message
    };
  }
}

/**
 * Gets the status of the Sato printer
 * @param {string} printerIp URL of the printer
 * @returns {Promise<string>} Status information
 */
async function getSatoPrinterStatus(printerIp) {
  const statusPage = `${printerIp}/Main_Status.htm`;
  let result = '';
  let model = '';
  let errorMessage = '';
  
  try {
    const response = await makeAuthenticatedRequest(statusPage);
    
    if (response) {
      // Parse the HTML response using Cheerio
      const $ = cheerio.load(response);
      
      // Extract model from the status page
      const modelElement = $('td:contains("Model")').next('td');
      if (modelElement.length) {
        model = modelElement.text().trim();
        console.log('Found printer model:', model);
      }
      
      // Extract status from HTML response
      const statusElement = $('td:contains("Status")').next('td');
      if (statusElement.length) {
        result = statusElement.text().trim();
        console.log('Found printer status:', result);
      } else {
        result = "Could not find printer status in the response.";
      }

      // Extract error message if present
      const errorElement = $('h3 font[color="RED"]');
      if (errorElement.length) {
        errorMessage = errorElement.text().trim();
        console.log('Found error message:', errorMessage);
      }
    } else {
      result = "Failed to fetch printer status.";
    }
  } catch (error) {
    return `Error retrieving printer status: ${error.message}`;
  }
  
  return {
    status: result,
    model: model,
    errorMessage: errorMessage
  };
}

/**
 * Gets the configuration of the Sato printer
 * @param {string} printerIp URL of the printer
 * @returns {Promise<string>} Configuration information
 */
async function getSatoPrinterConfig(printerIp) {
  const infoPage = `${printerIp}/PS_General_Normal.htm`;
  let result = '';
  let contrast = '18'; // Default value
  
  try {
    const response = await makeAuthenticatedRequest(infoPage);
    
    if (response) {
      // Parse the HTML response using Cheerio
      const $ = cheerio.load(response);
      
      // Extract printer settings
      result += "\nExtracted Printer Settings:\n";
      result += extractSetting($, "general_normal_sensor_type", "Sensor Type") + "\n";
      result += extractSetting($, "general_normal_ribbon_sensor", "Ribbon Sensor") + "\n";
      result += extractSetting($, "general_normal_feed_key", "Feed Key") + "\n";
      result += extractSetting($, "general_normal_head_check", "Head Check (Power on)") + "\n";
      result += extractSetting($, "general_normal_auto_calibration", "Auto Calibration") + "\n";
      result += extractSetting($, "general_normal_reprint_after_error", "Reprint After Error") + "\n";
      result += extractSetting($, "general_normal_print_speed", "Print Speed (ips)") + "\n";
      result += extractSetting($, "general_normal_cutter_enable", "Cutter") + "\n";
      result += extractSetting($, "general_normal_dispenser_enable", "Dispenser") + "\n";
      result += extractSetting($, "general_normal_backfeed_enable", "Backfeed") + "\n";
      result += extractSetting($, "general_normal_label_unit", "Label Unit") + "\n";
      
      // Extract input values
      result += "\nExtracted Input Values:\n";
      const printDarkness = extractInputValue($, "general_normal_print_darkness", "Print Darkness");
      result += printDarkness + "\n";
      
      // Map Print Darkness to contrast value
      if (printDarkness) {
        const darknessValue = printDarkness.split(':')[1].trim();
        contrast = darknessValue;
      }
      
      result += extractInputValue($, "general_normal_label_width", "Label Width") + "\n";
      result += extractInputValue($, "general_normal_label_height", "Label Height") + "\n";
      result += extractInputValue($, "general_normal_x_coordinate", "Horizontal Offset") + "\n";
      result += extractInputValue($, "general_normal_y_coordinate", "Vertical Offset") + "\n";
      result += extractInputValue($, "general_normal_tear_off", "Tear Off Offset") + "\n";
      result += extractInputValue($, "general_normal_cutter", "Cutter/Dispenser Offset") + "\n";
    } else {
      result += "Failed to fetch printer configuration.";
    }
  } catch (error) {
    return `Error retrieving printer configuration: ${error.message}`;
  }
  
  return {
    configuration: result,
    contrast: contrast
  };
}

/**
 * Makes an authenticated HTTP request to the SATO printer
 * @param {string} url URL to request
 * @returns {Promise<string>} Response data
 */
function makeAuthenticatedRequest(url) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${SATO_USERNAME}:${SATO_PASSWORD}`).toString('base64');
    
    const options = {
      timeout: CONNECTION_TIMEOUT,
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };
    
    http.get(url, options, (res) => {
      let data = '';
      
      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed with status code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Connection timed out'));
    });
  });
}

/**
 * Extracts selected option from a dropdown (for SATO printers)
 * @param {Object} $ Cheerio object
 * @param {string} selectName Name of the select element
 * @param {string} label Label for the setting
 * @returns {string} Formatted setting string
 */
function extractSetting($, selectName, label) {
  const selectedOption = $(`select[name=${selectName}] option[selected]`).first().text();
  return selectedOption ? `${label}: ${selectedOption}` : `${label}: Not found`;
}

/**
 * Extracts value from an input field (for SATO printers)
 * @param {Object} $ Cheerio object
 * @param {string} inputName Name of the input element
 * @param {string} label Label for the setting
 * @returns {string} Formatted setting string
 */
function extractInputValue($, inputName, label) {
  const value = $(`input[name=${inputName}]`).first().attr('value');
  return value ? `${label}: ${value}` : `${label}: Not found`;
}

// ===== COMMON UTILITY FUNCTIONS =====

/**
 * Loads saved printer statuses from file
 * @returns {Promise<Object>} Object with saved printer statuses
 */
async function loadPrinterStatuses() {
  try {
    const fileExists = await fileExistsAsync(STATUS_FILE);
    if (!fileExists) {
      return {};
    }

    const content = await fs.readFile(STATUS_FILE, 'utf8');
    const statuses = {};
    
    for (const line of content.split('\n')) {
      if (line.trim()) {
        try {
          // Split by first comma only
          const firstCommaIndex = line.indexOf(',');
          if (firstCommaIndex === -1) continue;
          
          const ip = line.substring(0, firstCommaIndex);
          const statusData = line.substring(firstCommaIndex + 1);
          
          try {
            statuses[ip] = JSON.parse(statusData);
          } catch (parseError) {
            console.error('Error parsing JSON for IP', ip, ':', parseError);
            // Skip this entry if JSON parsing fails
            continue;
          }
        } catch (e) {
          console.error('Error processing line:', line, e);
        }
      }
    }
    
    return statuses;
  } catch (error) {
    console.error('Error loading printer statuses:', error);
    return {};
  }
}

/**
 * Saves printer status to file
 * @param {string} ip IP address of the printer
 * @param {string} type Type of the printer ('ZebraPrinter' or 'SatoPrinter')
 * @param {string} status Status of the printer
 * @param {Object} details Additional printer details
 */
async function savePrinterStatus(ip, type, status, details = {}) {
  try {
    const statuses = await loadPrinterStatuses();
    
    const statusData = {
      type,
      status,
      lastUpdated: new Date().toISOString(),
      ...details
    };
    
    let content = '';
    for (const [ipAddress, data] of Object.entries(statuses)) {
      if (ipAddress === ip) continue; // Skip the current IP as we'll add it later
      content += `${ipAddress},${JSON.stringify(data)}\n`;
    }
    
    // Add the new/updated status
    content += `${ip},${JSON.stringify(statusData)}\n`;
    
    await fs.writeFile(STATUS_FILE, content, 'utf8');
  } catch (error) {
    console.error('Error saving printer status:', error);
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} Whether the file exists
 */
async function fileExistsAsync(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Combined Printer Scanner server running at http://localhost:${port}`);
    console.log("Access /scan endpoint to start scanning");
  });
}

// Export for use as a module
module.exports = { 
  app, 
  scanNetwork, 
  findPrinters,
  checkIfZebraPrinter,
  fetchZebraPrinterDetails,
  isSatoPrinterByPages,
  getSatoPrinterInfo
};