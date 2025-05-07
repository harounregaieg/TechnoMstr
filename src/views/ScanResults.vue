<template>
    <div v-if="modelValue" class="scan-results-overlay">
      <div class="scan-results-modal">
        <div class="scan-header">
          <h2>Résultat du scan</h2>
          <button class="close-button" @click="closeModal">×</button>
        </div>
        
        <div class="scan-body">
          <div v-if="loading" class="scan-loading">
            <div class="spinner"></div>
            <p>Recherche sur le réseau...</p>
          </div>
          
          <div v-else-if="Object.keys(filteredDevices).length === 0" class="no-devices">
            <p>Aucun équipement trouvé sur le réseau</p>
          </div>
          
          <div v-else class="devices-found">
            <p>{{ Object.keys(filteredDevices).length }} équipement(s) trouvé(s)</p> 
            
            <div class="devices-list">
              <!-- Printers and PDAs -->
              <div v-for="(device, ip) in filteredDevices" :key="ip" class="device-item">
                <div class="device-info">
                  <div class="device-name">
                    <span class="device-type-badge" :class="getDeviceTypeClass(device)">
                      {{ device.type }}
                    </span>
                    {{ device.model || `Équipement ${device.type}` }}
                  </div>
                  <div class="device-address">{{ ip }}</div>
                  <div :class="['device-status', getDeviceStatusClass(device)]">
                    {{ getDeviceStatus(device) }}
                  </div>
                </div>
                
                <div class="device-actions">
                  <button class="add-button" @click="addDevice(ip, device)" :disabled="addingDevices.has(ip)">
                    <span v-if="addingDevices.has(ip)" class="button-spinner"></span>
                    <span v-else>Ajouter</span>
                  </button>
                  <button class="details-button" @click="showDetails(ip, device)">
                    Détails
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="scan-footer">
          <button class="scan-again-button" @click="$emit('scan-again')" :disabled="loading">
            Scanner à nouveau
          </button>
          <button class="close-scan-button" @click="closeModal">
            Fermer
          </button>
        </div>
      </div>
      
      <!-- Device Details Modal -->
      <div v-if="showDetailsModal" class="details-modal-overlay" @click="closeDetailsModal">
        <div class="details-modal" @click.stop>
          <div class="details-header">
            <h3>Détails de l'équipement {{ selectedDevice.model }}</h3>
            <button class="close-button" @click="closeDetailsModal">×</button>
          </div>
          
          <div class="details-content">
            <div class="detail-row">
              <div class="detail-label">Type:</div>
              <div class="detail-value">{{ selectedDevice.type }}</div>
            </div>

            <div class="detail-row">
              <div class="detail-label">Adresse IP:</div>
              <div class="detail-value">{{ selectedDeviceIp }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Modèle:</div>
              <div class="detail-value">{{ selectedDevice.model || 'Non spécifié' }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value" :class="getDeviceStatusClass(selectedDevice)">
                {{ getDeviceStatus(selectedDevice) }}
              </div>
            </div>
            
            <div class="detail-row" v-if="selectedDevice.serialnumber">
              <div class="detail-label">Numéro de série:</div>
              <div class="detail-value">{{ selectedDevice.serialnumber }}</div>
            </div>
            
            <!-- Printer Specific Details -->
            <template v-if="selectedDevice.type === 'Printer'">
              <div class="detail-row" v-if="selectedDevice.printerStatus">
                <div class="detail-label">État imprimante:</div>
                <div class="detail-value">{{ selectedDevice.printerStatus }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.firmware">
                <div class="detail-label">Firmware:</div>
                <div class="detail-value">{{ selectedDevice.firmware }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.hardwareId">
                <div class="detail-label">ID Matériel:</div>
                <div class="detail-value">{{ selectedDevice.hardwareId }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.linkOsVersion">
                <div class="detail-label">Version Link-OS:</div>
                <div class="detail-value">{{ selectedDevice.linkOsVersion }}</div>
              </div>
            </template>
            
            <!-- PDA Specific Details -->
            <template v-else-if="selectedDevice.type === 'PDA'">
              <div class="detail-row" v-if="selectedDevice.androidVersion">
                <div class="detail-label">Version Android:</div>
                <div class="detail-value">{{ selectedDevice.androidVersion }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.manufacturer">
                <div class="detail-label">Fabricant:</div>
                <div class="detail-value">{{ selectedDevice.manufacturer }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.deviceName">
                <div class="detail-label">Nom de l'appareil:</div>
                <div class="detail-value">{{ selectedDevice.deviceName }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.batteryInfo?.level">
                <div class="detail-label">Niveau de batterie:</div>
                <div class="detail-value">{{ selectedDevice.batteryInfo.level }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.storageInfo?.Total">
                <div class="detail-label">Stockage total:</div>
                <div class="detail-value">{{ selectedDevice.storageInfo.Total }}</div>
              </div>
              
              <div class="detail-row" v-if="selectedDevice.storageInfo?.Available">
                <div class="detail-label">Stockage disponible:</div>
                <div class="detail-value">{{ selectedDevice.storageInfo.Available }}</div>
              </div>
            </template>
          </div>
          
          <div class="details-footer">
            <button class="add-button" @click="addDevice(selectedDeviceIp, selectedDevice); closeDetailsModal()">
              Ajouter cet équipement
            </button>
            <button class="cancel-button" @click="closeDetailsModal">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { userApi } from '../services/userApi';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    printers: {
      type: Object,
      required: true,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    existingIps: {
      type: Array,
      default: () => []
    }
  });

  const emit = defineEmits(['update:modelValue', 'close', 'scan-again', 'add-printer']);

  const addingDevices = ref(new Set());
  const showDetailsModal = ref(false);
  const selectedDevice = ref({});
  const selectedDeviceIp = ref('');
  const currentUserDepartment = ref('');

  const devices = computed(() => props.printers);
  const deviceCount = computed(() => Object.keys(devices.value || {}).length);
  const hasDevices = computed(() => deviceCount.value > 0);

  // Debug logs
  console.log('Existing IPs:', props.existingIps);
  console.log('Scanned IPs:', Object.keys(devices.value));

  // Normalize IPs (remove port if present and convert to lowercase)
  const normalizeIp = ip => {
    if (!ip) return '';
    // Remove port number if present and convert to lowercase for consistent comparison
    return ip.split(':')[0].toLowerCase().trim();
  };

  // Filter out devices with IPs already in the equipment table
  const filteredDevices = computed(() => {
    // Normalize all existing IPs for consistent comparison
    const normalizedExisting = props.existingIps.map(normalizeIp);
    console.log('Normalized existing IPs:', normalizedExisting);
    
    const result = {};
    for (const [ip, device] of Object.entries(devices.value)) {
      const normalizedIp = normalizeIp(ip);
      console.log(`Checking device IP: ${ip} (normalized: ${normalizedIp})`);
      
      if (!normalizedExisting.includes(normalizedIp)) {
        result[ip] = device;
      } else {
        console.log(`Device with IP ${ip} filtered out - already exists in equipment table`);
      }
    }
    
    console.log('Filtered result count:', Object.keys(result).length);
    return result;
  });

  // Fetch user department when modal opens
  watch(() => props.modelValue, async (val) => {
    if (val) {
      try {
        const user = await userApi.getCurrentUser();
        currentUserDepartment.value = user.departement || user.nomdepartement || '';
      } catch (e) {
        currentUserDepartment.value = '';
      }
    }
  });

  const closeModal = () => {
    emit('update:modelValue', false);
    emit('close');
  };

  const addDevice = async (ip, device) => {
    try {
      addingDevices.value.add(ip);
      let payload = { ip, ...device, departement: currentUserDepartment.value };
      if (device.type === 'PDA') {
        payload.serialnumber = device.serialnumber || device.serialNumber || '';
      }
      await emit('add-printer', payload);
    } finally {
      addingDevices.value.delete(ip);
    }
  };

  const showDetails = (ip, device) => {
    selectedDeviceIp.value = ip;
    selectedDevice.value = device;
    showDetailsModal.value = true;
  };

  const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedDevice.value = {};
    selectedDeviceIp.value = '';
  };

  const getDeviceStatus = (device) => {
    if (device.type === 'Printer') {
      return device.status || device.printerStatus || 'Unknown';
    } else if (device.type === 'PDA') {
      return 'Online';
    }
    return 'Unknown';
  };

  const getDeviceStatusClass = (device) => {
    const status = getDeviceStatus(device).toLowerCase();
    return `status-${status.replace(/\s+/g, '-')}`;
  };

  const getDeviceTypeClass = (device) => {
    if (device.type === 'Printer') {
      return device.printerType?.toLowerCase() || 'printer';
    }
    return device.type.toLowerCase();
  };
  </script>
  
  <style scoped>
  .scan-results-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .scan-results-modal {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .scan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .scan-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
  }
  
  .scan-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }
  
  .scan-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #4318d1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .no-devices {
    text-align: center;
    color: #64748b;
    padding: 48px 0;
  }
  
  .devices-found {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .devices-found p {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-weight: 500;
  }
  
  .devices-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .device-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  
  .device-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .device-name {
    font-weight: 500;
    color: #1e293b;
  }
  
  .device-address {
    color: #64748b;
    font-size: 14px;
  }
  
  .device-status {
    font-size: 14px;
    font-weight: 500;
  }
  
  .status-online {
    color: #10b981;
  }
  
  .status-warning {
    color: #f59e0b;
  }
  
  .status-offline {
    color: #ef4444;
  }
  
  .device-actions {
    display: flex;
    gap: 8px;
  }
  
  .add-button, .details-button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    border: none;
  }
  
  .add-button {
    background-color: #4318d1;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }
  
  .add-button:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
  
  .button-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
    display: inline-block;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .details-button {
    background-color: #e2e8f0;
    color: #1e293b;
  }
  
  .scan-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .scan-again-button, .close-scan-button {
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .scan-again-button {
    background-color: #4318d1;
    color: white;
    border: none;
  }
  
  .scan-again-button:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
  
  .close-scan-button {
    background-color: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
  }
  
  /* Details Modal Styles */
  .details-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100; /* Higher than the scan results modal */
  }
  
  .details-modal {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .details-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .details-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-row {
    display: grid;
    grid-template-columns: 40% 60%;
    gap: 8px;
  }
  
  .detail-label {
    color: #64748b;
    font-weight: 500;
  }
  
  .detail-value {
    color: #1e293b;
  }
  
  .details-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .cancel-button {
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    background-color: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    cursor: pointer;
  }
  
  .device-type-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    margin-right: 8px;
  }
  
  .device-type-badge.printer {
    background-color: #4318d1;
    color: white;
  }
  
  .device-type-badge.pda {
    background-color: #10b981;
    color: white;
  }
  
  .device-type-badge.zebra {
    background-color: #4318d1;
    color: white;
  }
  
  .device-type-badge.sato {
    background-color: #10b981;
    color: white;
  }
  
  .debug-info {
    position: fixed;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px;
    font-size: 12px;
    z-index: 2000;
  }

  .debug-info-inline {
    background-color: #f8fafc;
    padding: 8px;
    margin-bottom: 16px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  .debug-counts {
    font-size: 12px;
    color: #64748b;
    margin-top: 8px;
  }
  </style>