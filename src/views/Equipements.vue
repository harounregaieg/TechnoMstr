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
        <button class="settings-btn" @click="toggleSettingsModal">
          <span>Intervalle Automatique ({{ formattedInterval }})</span>
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

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="settings-modal-overlay">
      <div class="settings-modal">
        <h3>Paramètres d'intervalle de scan</h3>
        <div class="interval-setting">
          <div class="current-value">
            <span>Intervalle actuel: <strong>{{ formattedScanInterval }}</strong></span>
          </div>
          
          <div class="input-container">
            <label for="scan-interval">Entrez l'intervalle en secondes:</label>
            <div class="number-input-wrapper">
              <input 
                type="number" 
                id="scan-interval" 
                v-model.number="scanInterval" 
                min="10" 
                max="300" 
                step="1"
                class="number-input"
              />
              <span class="input-unit">secondes</span>
            </div>
          </div>
          
          <div class="preset-buttons">
            <button @click="scanInterval = 30" :class="{ active: scanInterval == 30 }">30s</button>
            <button @click="scanInterval = 60" :class="{ active: scanInterval == 60 }">1min</button>
            <button @click="scanInterval = 120" :class="{ active: scanInterval == 120 }">2min</button>
            <button @click="scanInterval = 300" :class="{ active: scanInterval == 300 }">5min</button>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="saveSettings" class="save-btn">Sauvegarder</button>
          <button @click="showSettingsModal = false" class="cancel-btn">Annuler</button>
        </div>
      </div>
    </div>
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
      existingIps: [],
      showSettingsModal: false,
      scanInterval: 30,
      currentScanInterval: 30
    };
  },
  computed: {
    formattedInterval() {
      const interval = this.currentScanInterval;
      if (interval < 60) {
        return `${interval}s`;
      } else if (interval === 60) {
        return `1 min`;
      } else {
        const minutes = Math.floor(interval / 60);
        const seconds = interval % 60;
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;
      }
    },
    formattedScanInterval() {
      const interval = this.scanInterval;
      if (interval < 60) {
        return `${interval} secondes`;
      } else if (interval === 60) {
        return `1 minute`;
      } else {
        const minutes = Math.floor(interval / 60);
        const seconds = interval % 60;
        return seconds > 0 ? `${minutes} minutes et ${seconds} secondes` : `${minutes} minutes`;
      }
    }
  },
  methods: {
    toggleSettingsModal() {
      this.showSettingsModal = !this.showSettingsModal;
      if (this.showSettingsModal) {
        this.fetchCurrentInterval();
      }
    },
    async fetchCurrentInterval() {
      try {
        const response = await fetch('http://localhost:3000/api/monitor/interval');
        if (response.ok) {
          const data = await response.json();
          this.scanInterval = data.intervalSeconds;
          this.currentScanInterval = data.intervalSeconds;
        }
      } catch (error) {
        console.error('Error fetching scan interval:', error);
      }
    },
    async saveSettings() {
      try {
        // Validate input before saving
        let intervalValue = parseInt(this.scanInterval);
        
        // Ensure it's within valid range
        if (isNaN(intervalValue) || intervalValue < 10) {
          intervalValue = 10;
          this.scanInterval = 10;
        } else if (intervalValue > 300) {
          intervalValue = 300;
          this.scanInterval = 300;
        }
        
        const response = await fetch('http://localhost:3000/api/monitor/interval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ intervalSeconds: intervalValue })
        });
        
        if (response.ok) {
          this.currentScanInterval = intervalValue;
          this.showSettingsModal = false;
          alert('Intervalle de scan mis à jour avec succès');
        } else {
          throw new Error('Failed to update scan interval');
        }
      } catch (error) {
        console.error('Error saving scan interval:', error);
        alert('Erreur lors de la mise à jour de l\'intervalle: ' + error.message);
      }
    },
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
                  storageInfo: device.storageInfo,
                  installedApps: device.installedApps || []
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
       
        const formattedData = {
          ip: result.ip,
          departement: result.departement,
          printer: {
            type: result.type,
            printerType: result.printerType,
            serialNumber: result.serialnumber || result.serialNumber,
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
            storageInfo: result.storageInfo,
            installedApps: result.installedApps || []
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

.settings-btn {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.settings-btn:hover {
  background-color: #1976D2;
  
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.settings-btn::before {  
  font-size: 16px;
}

.settings-modal h3 {
  color: #2196F3;
  text-align: center;
  margin-bottom: 20px;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

.save-btn {
  padding: 10px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.cancel-btn {
  padding: 10px 24px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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

/* Settings Modal Styles */
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-modal {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.interval-setting {
  margin: 20px 0;
}

.current-value {
  margin-bottom: 15px;
  text-align: center;
  font-size: 16px;
}

.current-value strong {
  color: #2196F3;
  font-size: 18px;
}

.input-container {
  margin: 20px 0;
}

.input-container label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.number-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.number-input {
  width: 120px;
  padding: 10px 12px;
  font-size: 16px;
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.number-input:focus {
  border-color: #2196F3;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}

.number-input::-webkit-inner-spin-button, 
.number-input::-webkit-outer-spin-button { 
  opacity: 1;
  height: 30px;
}

.input-unit {
  margin-left: 8px;
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  justify-content: space-between;
}

.preset-buttons button {
  flex: 1;
  padding: 8px 0;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.preset-buttons button:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.preset-buttons button.active {
  background-color: #2196F3;
  color: white;
  border-color: #1976D2;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
</style>