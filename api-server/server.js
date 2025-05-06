const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { localPool } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const scannerRoutes = require('./routes/scannerRoutes');
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const printerRoutes = require('./routes/printerRoutes');
const speedRoutes = require('./routes/speedRoutes');
const ipRoutes = require('./routes/ipRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const monitorController = require('./controllers/monitorController');
const pdaMonitorController = require('./controllers/pdaMonitorController');
const { scanDevices } = require('./controllers/pdainfo');
const equipmentRepository = require('./models/equipmentRepository');
const pdaRepository = require('./models/pdaRepository');
const User = require('./models/userModel');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Start ADB server before anything else
async function startAdbServer() {
    try {
        console.log('Starting ADB server...');
        const { stdout, stderr } = await execAsync('adb start-server');
        if (stderr) {
            console.warn('ADB server warning:', stderr);
        }
        console.log('ADB server started successfully');
    } catch (error) {
        console.error('Error starting ADB server:', error);
        // Don't throw the error, just log it and continue
        // This allows the server to start even if ADB fails
    }
}

// Connect to all PDAs wirelessly
async function connectToAllPdas() {
    try {
        console.log('Fetching PDA IP addresses from database...');
        const query = `
            SELECT e.ipadresse 
            FROM equipement e
            JOIN pda p ON e.idequipement = p.id
            WHERE e.ipadresse IS NOT NULL
        `;
        
        const result = await localPool.query(query);
        const pdaIps = result.rows.map(row => row.ipadresse);
        
        console.log(`Found ${pdaIps.length} PDAs to connect to`);
        
        for (const ip of pdaIps) {
            try {
                console.log(`Attempting to connect to PDA at ${ip}...`);
                const { stdout, stderr } = await execAsync(`adb connect ${ip}:5555`);
                console.log(`Connection result for ${ip}:`, stdout);
                if (stderr) {
                    console.warn(`Warning for ${ip}:`, stderr);
                }
            } catch (error) {
                console.error(`Error connecting to PDA at ${ip}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error in connectToAllPdas:', error);
    }
}

// Configure CORS with specific options
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  
  // Log request body for debugging (except for password fields)
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.motdepasse) sanitizedBody.motdepasse = '[REDACTED]';
  console.log('Request body:', JSON.stringify(sanitizedBody));
  
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/speed', speedRoutes);
app.use('/api/printer', ipRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Add PDA scan route
app.get('/api/pda/scan', async (req, res) => {
    try {
        console.log('Starting PDA scan...');
        const foundDevices = await scanDevices();
        res.json({ 
            message: 'PDA scan completed successfully',
            devices: foundDevices
        });
    } catch (error) {
        console.error('Error scanning PDAs:', error);
        res.status(500).json({ error: 'Failed to scan PDAs' });
    }
});

// Get applications for a specific PDA
app.get('/api/pda/:id/applications', async (req, res) => {
    try {
        const pdaId = req.params.id;
        console.log(`Fetching applications for PDA ID: ${pdaId}`);
        
        const applications = await pdaRepository.getPdaApplications(pdaId);
        
        res.json({
            success: true,
            applications: applications
        });
    } catch (error) {
        console.error('Error fetching PDA applications:', error);
        res.status(500).json({ error: 'Failed to fetch PDA applications' });
    }
});

// Store applications for a PDA
app.post('/api/pda/:id/applications', async (req, res) => {
    try {
        const pdaId = req.params.id;
        const { applications } = req.body;
        
        if (!Array.isArray(applications)) {
            return res.status(400).json({ error: 'Applications must be an array of package names' });
        }
        
        console.log(`Storing ${applications.length} applications for PDA ID: ${pdaId}`);
        
        const result = await pdaRepository.storeApplicationsForPda(pdaId, applications);
        
        res.json(result);
    } catch (error) {
        console.error('Error storing PDA applications:', error);
        res.status(500).json({ error: 'Failed to store PDA applications' });
    }
});

// Root route
app.get('/', (req, res) => {
  res.send('TechnoMaster API is running');
});

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
async function startServer() {
    try {
        // Start ADB server first
        await startAdbServer();
        
        // Connect to all PDAs wirelessly
        await connectToAllPdas();
        
        // Then start the Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`CORS enabled for origins: ${corsOptions.origin.join(', ')}`);
        });

        // Set up periodic monitoring
        const MONITOR_INTERVAL = 30 * 1000; // 30 seconds
        setInterval(async () => {
            try {
                console.log('Starting periodic equipment status check...');
                const [printerStatusUpdates, pdaStatusUpdates] = await Promise.all([
                    monitorController.monitorAllEquipment(),
                    pdaMonitorController.monitorAllPdas()
                ]);
                console.log('Periodic check completed:', {
                    printers: printerStatusUpdates,
                    pdas: pdaStatusUpdates
                });
            } catch (error) {
                console.error('Error in periodic equipment check:', error);
            }
        }, MONITOR_INTERVAL);

        // Initial check on server start
        Promise.all([
            monitorController.monitorAllEquipment(),
            pdaMonitorController.monitorAllPdas()
        ])
            .then(([printerStatusUpdates, pdaStatusUpdates]) => {
                console.log('Initial equipment status check completed:', {
                    printers: printerStatusUpdates,
                    pdas: pdaStatusUpdates
                });
            })
            .catch(error => {
                console.error('Error in initial equipment check:', error);
            });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();