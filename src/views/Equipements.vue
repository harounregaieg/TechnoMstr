<template>
  <div class="equipment-page">
    <h1 class="page-title">Gestion des Équipements</h1>
    
    <div class="controls">
      <SearchBar @search="handleSearch" />
      <div class="action-buttons">
        <button class="refresh-btn" @click="refreshStatus" :disabled="isRefreshing">
          <span v-if="isRefreshing">Actualisation...</span>
          <span v-else>Actualiser le statut</span>
        </button>
        <ActionButtons @scan-start="startScan" :is-scanning="isScanning" />
      </div>
    </div>
    
    <EquipementTable 
      :search-query="searchQuery" 
      :refresh-trigger="refreshTrigger" 
      :last-update="lastUpdate"
    />
    
    <ScanResults 
      v-model="showScanResults"
      :printers="foundPrinters"
      :loading="isScanning"
      :existing-ips="existingIps"
      @close="closeScanResults"
      @scan-again="startScan"
      @add-printer="handleAddPrinter"
    />
  </div>
</template>

<script>
import SearchBar from '../components/EquipementComponents/SearchBar.vue';
import ActionButtons from '../components/EquipementComponents/ActionButtons.vue';
import EquipementTable from '../components/EquipementComponents/EquipementTable.vue';
import ScanResults from './ScanResults.vue';

export default {
  name: 'EquipmentPage',
  components: {
    SearchBar,
    ActionButtons,
    EquipementTable,
    ScanResults
  },
  data() {
    return {
      searchQuery: '',
      showScanResults: false,
      refreshTrigger: 0,
      foundPrinters: {},
      isScanning: false,
      isRefreshing: false,
      lastUpdate: null,
      scanAbortController: null,
      existingIps: []
    };
  },
  methods: {
    async fetchExistingIps() {
      try {
        const res = await fetch('http://localhost:3000/api/equipment');
        const data = await res.json();
        
        // Normalize IP addresses by considering all possible field names and removing port if present
        this.existingIps = data
          .map(eq => {
            // Try all possible IP field names with different casings
            const ip = eq.ipadresse || eq.ipAdresse || eq.ipaddresse || eq.ip || eq.IP;
            // If IP has a port, remove it (format: "192.168.1.1:5555" -> "192.168.1.1")
            return ip ? ip.split(':')[0] : null;
          })
          .filter(Boolean); // Remove any null or undefined values
        
        console.log('Filtered existing equipment IPs:', this.existingIps);
      } catch (e) {
        console.error('Failed to fetch equipment IPs', e);
        this.existingIps = [];
      }
    },
    closeScanResults() {
      // Cancel any ongoing scan
      if (this.scanAbortController) {
        this.scanAbortController.abort();
        this.scanAbortController = null;
      }
      
      // Reset all scan-related state
      this.showScanResults = false;
      this.foundPrinters = {};
      this.isScanning = false;
    },
    handleSearch(query) {
      this.searchQuery = query;
    },
    async startScan() {
      await this.fetchExistingIps(); // Fetch latest IPs before scan
      console.log('startScan method triggered');
      
      // Cancel any existing scan
      if (this.scanAbortController) {
        this.scanAbortController.abort();
        this.scanAbortController = null;
      }

      // Create new abort controller for this scan
      this.scanAbortController = new AbortController();
      
      // Reset state and show modal
      this.isScanning = true;
      this.showScanResults = true;
      this.foundPrinters = {};

      try {
        console.log('Starting printer and PDA scan...');
        
        // Run both scans in parallel
        const [printerResponse, pdaResponse] = await Promise.all([
          fetch('http://localhost:3000/api/scanner/scan', { 
            signal: this.scanAbortController.signal 
          }),
          fetch('http://localhost:3000/api/pda/scan', {
            signal: this.scanAbortController.signal
          })
        ]);
        
        console.log('Printer scan response status:', printerResponse.status);
        console.log('PDA scan response status:', pdaResponse.status);
        
        // Handle printer scan results
        if (printerResponse.ok) {
          try {
            const printerData = await printerResponse.json();
            console.log('Printer scan response:', printerData);
            
            const formattedPrinters = {};
            
            // Process Zebra printers
            if (printerData.zebra) {
              Object.entries(printerData.zebra).forEach(([ip, printer]) => {
                formattedPrinters[ip] = {
                  ip: ip,
                  type: 'Printer',
                  printerType: 'Zebra',
                  status: printer.status || 'Unknown',
                  model: printer.model || 'Unknown Model',
                  serialnumber: printer.serialNumber || 'Unknown',
                  resolution: printer.resolution || 'Unknown',
                  vitesse: printer.vitesse || 0,
                  contrast: printer.contrast || 0,
                  typeImpression: printer.typeImpression || 'Unknown',
                  printerStatus: printer.printerStatus || 'UNKNOWN',
                  statusMessage: printer.statusMessage || 'No status message',
                  firmware: printer.firmware,
                  hardwareId: printer.hardwareId,
                  linkOsVersion: printer.linkOsVersion
                };
              });
            }
            
            // Process Sato printers
            if (printerData.sato) {
              Object.entries(printerData.sato).forEach(([ip, printer]) => {
                formattedPrinters[ip] = {
                  ip: ip,
                  type: 'Printer',
                  printerType: 'Sato',
                  status: printer.status || 'Unknown',
                  model: printer.model || 'Unknown Model',
                  serialnumber: printer.serialNumber || 'Unknown',
                  resolution: printer.resolution || 'Unknown',
                  vitesse: printer.vitesse || 0,
                  contrast: printer.contrast || 0,
                  typeImpression: printer.typeImpression || 'Unknown',
                  printerStatus: printer.printerStatus || 'UNKNOWN',
                  statusMessage: printer.statusMessage || 'No status message',
                  configuration: printer.configuration
                };
              });
            }
            
            this.foundPrinters = { ...formattedPrinters };
          } catch (error) {
            console.error('Error parsing printer data:', error);
          }
        }

        // Handle PDA scan results
        if (pdaResponse.ok) {
          try {
            const pdaData = await pdaResponse.json();
            console.log('PDA scan response:', pdaData);
            
            // Process PDA devices
            if (pdaData.devices && pdaData.devices.length > 0) {
              pdaData.devices.forEach(device => {
                this.foundPrinters[device.ip] = {
                  ip: device.ip,
                  type: 'PDA',
                  model: device.model,
                  androidVersion: device.androidVersion,
                  serialnumber: device.serialNumber,
                  manufacturer: device.manufacturer,
                  deviceName: device.deviceName,
                  batteryInfo: device.batteryInfo,
                  storageInfo: device.storageInfo
                };
              });
            }
          } catch (error) {
            console.error('Error parsing PDA data:', error);
          }
        }
        
        // Force update the UI
        await this.$nextTick();
        
        console.log('Final scan results:', {
          devices: Object.keys(this.foundPrinters).length,
          showResults: this.showScanResults
        });

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Scan was cancelled');
        } else {
          console.error('Error during scan:', error);
          alert('Erreur lors du scan: ' + error.message);
        }
      } finally {
        // Always update these states regardless of success or failure
        console.log('Scan completed. Final state:');
        console.log('Found Devices:', this.foundPrinters);
        
        // Add a small delay to ensure data is properly updated before changing loading state
        setTimeout(() => {
          this.isScanning = false;
          console.log('isScanning set to false after timeout');
        }, 500);
      }
    },
    async handleAddPrinter(result) {
      console.log('Adding printer:', result);
      
      try {
        // Format the data to match what the backend expects
        const formattedData = {
          ip: result.ip,
          printer: {
            type: result.type,
            printerType: result.printerType,
            serialNumber: result.serialnumber || result.serialNumber, // Try both field names
            model: result.model,
            status: result.status,
            resolution: result.resolution,
            vitesse: result.vitesse,
            contrast: result.contrast,
            typeImpression: result.typeImpression,
            printerStatus: result.printerStatus,
            statusMessage: result.statusMessage,
            firmware: result.firmware,
            hardwareId: result.hardwareId,
            linkOsVersion: result.linkOsVersion,
            // PDA-specific fields
            androidVersion: result.androidVersion,
            manufacturer: result.manufacturer,
            deviceName: result.deviceName,
            batteryInfo: result.batteryInfo,
            storageInfo: result.storageInfo
          }
        };

        console.log('Sending formatted data:', formattedData);

        const response = await fetch('http://localhost:3000/api/equipment/scanned-printer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formattedData)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.detail || 'Failed to add printer');
        }

        console.log('Printer added successfully');
        this.refreshTrigger++;
        alert(`L'imprimante a été ajoutée avec succès!`);
        
        // Remove the added printer from the list
        const { [result.ip]: removed, ...remaining } = this.foundPrinters;
        this.foundPrinters = remaining;
        
        // Close the modal if no more printers to add
        if (Object.keys(this.foundPrinters).length === 0) {
          this.showScanResults = false;
        }
      } catch (error) {
        console.error('Error adding printer:', error);
        alert('Erreur lors de l\'ajout de l\'imprimante: ' + error.message);
      }
    },
    async refreshStatus() {
      this.isRefreshing = true;
      try {
        const response = await fetch('http://localhost:3000/api/monitor/check-status');
        if (!response.ok) {
          throw new Error('Failed to refresh status');
        }
        const data = await response.json();
        console.log('Status refresh response:', data);
        this.refreshTrigger++;
        this.lastUpdate = new Date();
      } catch (error) {
        console.error('Error refreshing status:', error);
        alert('Erreur lors de l\'actualisation du statut: ' + error.message);
      } finally {
        this.isRefreshing = false;
      }
    }
  },
  async mounted() {
    await this.fetchExistingIps();
  }
};
</script>

<style scoped>
.equipment-page {
  padding: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  margin-left: 60px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  align-items: center;
}

.refresh-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.refresh-btn:hover {
  background-color: #45a049;
}

.refresh-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 991px) {
  .controls {
    flex-direction: column;
    gap: 16px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>