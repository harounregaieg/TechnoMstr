const { exec } = require('child_process');
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const { 
  scanNetwork, 
  findPrinters,
  checkIfZebraPrinter,
  fetchZebraPrinterDetails,
  isSatoPrinterByPages,
  getSatoPrinterInfo 
} = require('./satozebrascan');

const STATUS_FILE = path.join(__dirname, '../data/printer_status.txt');

// Create data directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir(path.dirname(STATUS_FILE), { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
})();

// Controller to scan network for all printers (Zebra and Sato)
exports.scanNetwork = async (req, res) => {
    try {
        console.log('Starting network scan...');
        
        // Scan for printers
        const networkDevices = await scanNetwork();
        let combinedPrinters = { zebra: {}, sato: {} };
        
        if (networkDevices.size > 0) {
          console.log(`Found ${networkDevices.size} devices with open ports, checking for printers...`);
          const results = await findPrinters(networkDevices);
          
          // Add Zebra printers
          for (const [ip, printer] of Object.entries(results.zebra || {})) {
            combinedPrinters.zebra[ip] = {
              ...printer,
              printerType: 'Zebra'
            };
          }
          
          // Add Sato printers
          for (const [ip, printer] of Object.entries(results.sato || {})) {
            combinedPrinters.sato[ip] = {
              ...printer,
              printerType: 'Sato'
            };
          }
        }

        const zebraCount = Object.keys(combinedPrinters.zebra).length;
        const satoCount = Object.keys(combinedPrinters.sato).length;
        console.log(`Found ${zebraCount} Zebra printer(s) and ${satoCount} Sato printer(s) on the network`);

        res.json(combinedPrinters);
    } catch (error) {
        console.error('Error scanning network:', error);
        res.status(500).json({ error: 'Failed to scan network' });
    }
};

// Get printer status
exports.getPrinterStatus = async (req, res) => {
  try {
    const statuses = await loadPrinterStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error getting printer status:', error);
    res.status(500).json({ error: 'Failed to get printer status' });
  }
};

// Get printer details
exports.getPrinterDetails = async (req, res) => {
    try {
        const { ip } = req.params;
        const statuses = await loadPrinterStatuses();
        const printer = statuses[ip];
        
        if (!printer) {
          return res.status(404).json({ error: 'Printer not found' });
        }

        res.json(printer);
    } catch (error) {
        console.error('Error getting printer details:', error);
        res.status(500).json({ error: 'Failed to get printer details' });
    }
};

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
          const [ip, statusData] = line.split(',', 2);
          statuses[ip] = JSON.parse(statusData);
        } catch (e) {
          console.error('Error parsing status line:', line, e);
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