<template>
  <div class="equipment-details">
    <div class="details-header">
      <div class="header-content">
        <h2>Détails de l'Équipement</h2>
        <div class="status-badge" :class="getStatusClass(equipment)">
          <i class="status-icon" :class="getStatusIcon(equipment)"></i>
          {{ getStatusText(equipment) }}
        </div>
      </div>
      <button class="close-button" @click="$emit('close')">×</button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>Chargement...</span>
    </div>
    <div v-else-if="error" class="error">
      <i class="error-icon">⚠️</i>
      {{ error }}
    </div>
    <div v-else class="details-content">
      <div class="section general-info">
        <div class="section-header">
          
          <h3>Informations Générales</h3>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">🖥️</div>
            <div class="info-content">
              <span class="label">Modèle</span>
              <span class="value">{{ equipment.modele }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🌐</div>
            <div class="info-content">
              <span class="label">Adresse IP</span>
              <span class="value">{{ equipment.ipadresse }}</span>
            </div>
          </div>
          
          <div class="info-card">
            <div class="info-icon">🏛️</div>
            <div class="info-content">
              <span class="label">Département</span>
              <span class="value">{{ equipment.departement || 'Non spécifié' }}</span>
            </div>
          </div>
          <div v-if="equipment.printer && equipment.printer.status_message" class="info-card">
            <div class="info-icon">📝</div>
            <div class="info-content">
              <span class="label">Message d'état</span>
              <span class="value">{{ equipment.printer.status_message || 'Aucun message' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="equipment.printer" class="section printer-info">
        <div class="section-header">
          
          <h3>Informations Imprimante</h3>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">🔢</div>
            <div class="info-content">
              <span class="label">Numéro de Série</span>
              <span class="value">{{ equipment.printer.serialnumber }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🏷️</div>
            <div class="info-content">
              <span class="label">Marque</span>
              <span class="value">{{ equipment.printer.nommarque }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📊</div>
            <div class="info-content">
              <span class="label">Résolution</span>
              <span class="value">{{ equipment.printer.resolution }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">⚡</div>
            <div class="info-content">
              <span class="label">Vitesse</span>
              <span class="value">{{ equipment.printer.vitesse }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">💾</div>
            <div class="info-content">
              <span class="label">Version Logicielle</span>
              <span class="value">{{ equipment.printer.softwareversion }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🎨</div>
            <div class="info-content">
              <span class="label">Contraste</span>
              <span class="value">{{ equipment.printer.contrast }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🖨️</div>
            <div class="info-content">
              <span class="label">Type d'Impression</span>
              <span class="value">{{ equipment.printer.typeimpression }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🔒</div>
            <div class="info-content">
              <span class="label">Couvert</span>
              <span class="value" :class="equipment.printer.coveropen ? 'status-warning' : 'status-available'">
                {{ equipment.printer.coveropen ? 'Ouvert' : 'Fermé' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="equipment.type === 'PDA'" class="section pda-info">
        <div class="section-header">
          <h3>Informations PDA</h3>
        </div>
        
        <div class="info-grid">
          <!-- DataWedge Version Info Card -->
          <div class="info-card">
            <div class="info-icon">🔍</div>
            <div class="info-content">
              <span class="label">DataWedge Version</span>
              <span class="value" style="display: flex; align-items: center; gap: 8px;">
                <span v-if="!loadingDatawedge">{{ datawedgeVersion }}</span>
                <span v-else class="loading-spinner" style="width: 18px; height: 18px; border-width: 2px;"></span>
                <button 
                  class="refresh-datawedge-btn info-refresh-btn" 
                  @click="fetchDatawedgeVersion" 
                  :disabled="loadingDatawedge" 
                  title="Rafraîchir la version DataWedge"
                  style="background: none; border: none; padding: 0; margin-left: 4px; font-size: 18px; cursor: pointer; color: #64748b;"
                >↻</button>
              </span>
            </div>
          </div>
          <!-- DeviceManager Version Info Card -->
          <div class="info-card">
            <div class="info-icon">🛠️</div>
            <div class="info-content">
              <span class="label">StageNow Version</span>
              <span class="value" style="display: flex; align-items: center; gap: 8px;">
                <span v-if="!loadingDevicemanager">{{ devicemanagerVersion }}</span>
                <span v-else class="loading-spinner" style="width: 18px; height: 18px; border-width: 2px;"></span>
                <button 
                  class="refresh-datawedge-btn info-refresh-btn" 
                  @click="fetchDevicemanagerVersion" 
                  :disabled="loadingDevicemanager" 
                  title="Rafraîchir la version DeviceManager"
                  style="background: none; border: none; padding: 0; margin-left: 4px; font-size: 18px; cursor: pointer; color: #64748b;"
                >↻</button>
              </span>
            </div>
          </div>
          <!-- Serial Number -->
          <div class="info-card">
            <div class="info-icon">🔢</div>
            <div class="info-content">
              <span class="label">Numéro de Série</span>
              <span class="value">{{ equipment.serialnumber }}</span>
            </div>
          </div>
          <!-- Android Version -->
          <div class="info-card">
            <div class="info-icon">🤖</div>
            <div class="info-content">
              <span class="label">Version Android</span>
              <span class="value">{{ equipment.versionAndroid }}</span>
            </div>
          </div>
          <!-- Battery Level -->
          <div class="info-card">
            <div class="info-icon">🔋</div>
            <div class="info-content">
              <div class="battery-label-row">
                <span class="label">Niveau de Batterie</span>
                <span class="battery-percentage">{{ equipment.batteryLevel }}%</span>
              </div>
              <div class="battery-indicator">
                <div class="battery-level" :style="{ width: equipment.batteryLevel + '%' }"></div>
              </div>
            </div>
          </div>
          <!-- Battery Status -->
          <div class="info-card">
            <div class="info-icon">⚡</div>
            <div class="info-content">
              <span class="label">État de la Batterie</span>
              <span class="value">{{ getBatteryStatusText(equipment.batteryType) }}</span>
            </div>
          </div>
          <!-- Storage -->
          <div class="info-card">
            <div class="info-icon">💾</div>
            <div class="info-content">
              <span class="label">Stockage</span>
              <div class="storage-info">
                <div class="storage-bar">
                  <div class="storage-used" :style="{ width: calculateStoragePercentage(equipment) + '%' }"></div>
                </div>
                <div class="storage-details">
                  <span>Total: {{ equipment.storageTotal }}</span>
                  <span>Disponible: {{ equipment.storageFree }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="applications-section" v-if="equipment.type === 'PDA'">
          <div class="section-header collapsible" @click="toggleApplications">
            <div class="header-left">
              <h3>Applications Installées <span class="app-count" v-if="pdaApplications.length">({{ pdaApplications.length }})</span></h3>
              <span class="toggle-icon">{{ showApplications ? '▼' : '▶' }}</span>
            </div>
            <div class="header-actions">
              <button class="refresh-apps-btn" @click.stop="fetchPdaApplications" :disabled="loadingApps" title="Rafraîchir la liste des applications">
                ↻
              </button>
            </div>
          </div>
          <div v-if="loadingApps" class="loading-apps">
            <div class="loading-spinner"></div>
            <span>Chargement des applications...</span>
          </div>
          <div v-else-if="showApplications && pdaApplications.length > 0" class="applications-container">
            <div class="search-container">
              <input 
                type="text" 
                v-model="appSearchQuery" 
                placeholder="Rechercher une application..." 
                class="app-search-input"
              />
            </div>
            <div class="applications-list">
              <div 
                class="application-item" 
                v-for="app in filteredApplications" 
                :key="app.package_name"
              >
                <span class="app-icon">📱</span>
                <span class="app-name">{{ app.package_name }}</span>
              </div>
            </div>
            <div class="applications-count" v-if="filteredApplications.length !== pdaApplications.length">
              Affichage de {{ filteredApplications.length }} sur {{ pdaApplications.length }} applications
            </div>
          </div>
          <div v-else-if="showApplications && pdaApplications.length === 0" class="no-applications">
            <span>Aucune application trouvée</span>
            <button class="sync-apps-btn" @click.stop="syncPdaApplications">
              Synchroniser les applications
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { userApi } from '../../services/userApi';

export default {
  name: 'EquipmentDetails',
  props: {
    equipmentId: {
      type: [Number, String],
      required: true
    }
  },
  setup(props) {
    const equipment = ref({});
    const loading = ref(true);
    const error = ref(null);
    const pdaApplications = ref([]);
    const loadingApps = ref(false);
    const showApplications = ref(false);
    const appSearchQuery = ref('');
    const datawedgeVersion = ref('Loading...');
    const loadingDatawedge = ref(false);
    const devicemanagerVersion = ref('Loading...');
    const loadingDevicemanager = ref(false);

    // Computed property for filtered applications
    const filteredApplications = computed(() => {
      if (!appSearchQuery.value) {
        return pdaApplications.value;
      }
      const query = appSearchQuery.value.toLowerCase();
      return pdaApplications.value.filter(app => 
        app.package_name.toLowerCase().includes(query)
      );
    });

    const fetchEquipmentDetails = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await fetch(`http://localhost:3000/api/equipment/${props.equipmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment details');
        }
        
        const data = await response.json();
        console.log('Equipment details response:', data);
        equipment.value = data;
        
        // If it's a PDA, fetch the installed applications and DataWedge version
        if (data.type === 'PDA') {
          fetchPdaApplications();
          fetchDatawedgeVersion();
          fetchDevicemanagerVersion();
        }
      } catch (err) {
        console.error('Error loading equipment details:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchPdaApplications = async () => {
      loadingApps.value = true;
      try {
        const response = await fetch(`http://localhost:3000/api/equipment/pda/${props.equipmentId}/applications`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch PDA applications');
        }
        
        const data = await response.json();
        console.log('PDA applications response:', data);
        
        // Map the response to a format we can display
        if (data.success && Array.isArray(data.applications)) {
          pdaApplications.value = data.applications.map(app => ({
            package_name: app.packagename || app.package_name || app
          }));
        } else {
          pdaApplications.value = [];
        }
        
        console.log('Formatted PDA applications:', pdaApplications.value);
      } catch (err) {
        console.error('Error loading PDA applications:', err);
        pdaApplications.value = [];
      } finally {
        loadingApps.value = false;
      }
    };

    const fetchDatawedgeVersion = async () => {
      if (!props.equipmentId) return;
      
      loadingDatawedge.value = true;
      
      try {
        const response = await fetch(`http://localhost:3000/api/equipment/pda/${props.equipmentId}/datawedge-version`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch DataWedge version');
        }
        
        const data = await response.json();
        console.log('DataWedge version response:', data);
        
        if (data.success) {
          datawedgeVersion.value = data.datawedgeVersion;
        } else {
          datawedgeVersion.value = 'Not available';
        }
      } catch (err) {
        console.error('Error loading DataWedge version:', err);
        datawedgeVersion.value = 'Error';
      } finally {
        loadingDatawedge.value = false;
      }
    };

    // Fetch DeviceManager version
    const fetchDevicemanagerVersion = async () => {
      if (!props.equipmentId) return;
      loadingDevicemanager.value = true;
      try {
        const response = await fetch(`http://localhost:3000/api/equipment/pda/${props.equipmentId}/devicemanager-version`);
        if (!response.ok) {
          throw new Error('Failed to fetch DeviceManager version');
        }
        const data = await response.json();
        console.log('DeviceManager version response:', data);
        if (data.success) {
          devicemanagerVersion.value = data.devicemanagerVersion;
        } else {
          devicemanagerVersion.value = 'Not available';
        }
      } catch (err) {
        console.error('Error loading DeviceManager version:', err);
        devicemanagerVersion.value = 'Error';
      } finally {
        loadingDevicemanager.value = false;
      }
    };

    // Function to trigger a sync of applications for this specific PDA
    const syncPdaApplications = async () => {
      loadingApps.value = true;
      try {
        const response = await fetch(`http://localhost:3000/api/equipment/pda/sync-apps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pdaId: props.equipmentId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to sync PDA applications');
        }
        
        // After sync, fetch the updated applications
        await fetchPdaApplications();
        
        alert('Applications synchronisées avec succès!');
      } catch (err) {
        console.error('Error syncing PDA applications:', err);
        alert('Erreur lors de la synchronisation des applications');
      } finally {
        loadingApps.value = false;
      }
    };

    const getStatusClass = (equipment) => {
      console.log('Getting status class for equipment:', equipment);
      if (!equipment.disponibilite) {
        return 'status-unavailable';
      }
      if (equipment.printer?.printer_status === 'PAUSED') {
        return 'status-warning';
      }
      return 'status-available';
    };

    const getStatusText = (equipment) => {
      console.log('Getting status text for equipment:', equipment);
      if (!equipment.disponibilite) {
        return 'Indisponible';
      }
      if (equipment.printer?.printer_status === 'PAUSED') {
        return 'En pause';
      }
      return 'Disponible';
    };

    const getBatteryStatusText = (status) => {
        const statusMap = {
            1: 'État de la batterie inconnu',
            2: 'Equipement en charge',
            3: 'Equipement en décharge',
            4: 'Equipement en pause',
            5: 'Plein Charge'
        };
        return statusMap[status] || 'Unknown - Battery status cannot be determined';
    };

    const getStatusIcon = (equipment) => {
      if (!equipment.disponibilite) {
        return 'status-icon-offline';
      }
      if (equipment.printer?.printer_status === 'PAUSED') {
        return 'status-icon-paused';
      }
      return 'status-icon-online';
    };

    const calculateStoragePercentage = (equipment) => {
      if (!equipment.storageTotal || !equipment.storageFree) return 0;
      const total = parseInt(equipment.storageTotal);
      const free = parseInt(equipment.storageFree);
      return ((total - free) / total) * 100;
    };

    const toggleApplications = () => {
      showApplications.value = !showApplications.value;
    };

    onMounted(() => {
      fetchEquipmentDetails();
    });

    return {
      equipment,
      loading,
      error,
      pdaApplications,
      loadingApps,
      showApplications,
      appSearchQuery,
      datawedgeVersion,
      loadingDatawedge,
      devicemanagerVersion,
      loadingDevicemanager,
      getStatusClass,
      getStatusText,
      getStatusIcon,
      getBatteryStatusText,
      calculateStoragePercentage,
      fetchEquipmentDetails,
      fetchPdaApplications,
      syncPdaApplications,
      toggleApplications,
      filteredApplications,
      fetchDatawedgeVersion,
      fetchDevicemanagerVersion
    };
  }
};
</script>

<style lang="scss" scoped>
.equipment-details {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  h2 {
    margin: 0;
    font-size: 28px;
    color: #1e293b;
    font-weight: 600;
  }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  
  &.status-available {
    background: #ecfdf5;
    color: #10b981;
  }
  
  &.status-warning {
    background: #fffbeb;
    color: #f59e0b;
  }
  
  &.status-unavailable {
    background: #fef2f2;
    color: #ef4444;
  }
}

.close-button {
  background: none;
  font-size: 28px;
  cursor: pointer;
  color: #64748b;
  padding: 8px;
  border-radius: 1%;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
}

.section {
  margin-bottom: 32px;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    
    h3 {
      margin: 0;
      font-size: 20px;
      color: #334155;
      font-weight: 600;
    }
    
    .section-icon {
      font-size: 24px;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.info-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .info-icon {
    font-size: 24px;
    color: #64748b;
  }
  
  .info-content {
    flex: 1;
    
    .label {
      display: block;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .value {
      display: block;
      font-size: 16px;
      color: #1e293b;
      font-weight: 500;
    }
  }
}

.battery-indicator {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: visible;
  position: relative;
  margin-top: 8px;
  margin-bottom: 20px;
  
  .battery-level {
    position: absolute;
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }
  
  .battery-percentage {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
}

.storage-info {
  .storage-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
    
    .storage-used {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
    }
  }
  
  .storage-details {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f1f5f9;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #fef2f2;
  border-radius: 8px;
  color: #ef4444;
  
  .error-icon {
    font-size: 24px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Status icons
.status-icon {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  
  &.status-icon-online {
    background: #10b981;
  }
  
  &.status-icon-paused {
    background: #f59e0b;
  }
  
  &.status-icon-offline {
    background: #ef4444;
  }
}

.battery-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.battery-percentage {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

/* Applications section styles */
.applications-section {
  margin-top: 32px;
  width: 100%;
}

.applications-section .section-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collapsible {
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  font-size: 14px;
  color: #64748b;
  transition: transform 0.2s;
}

.header-actions {
  display: flex;
  align-items: center;
}

.applications-container {
  position: relative;
  margin-top: 48px;
}

.search-container {
  position: sticky;
  top: -16px;
  left: 0;
  width: 100%;
  padding: 8px;
  background-color: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.app-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
}

.applications-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding: 16px;
  padding-top: 48px;
  margin-top: -40px;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.application-item {
  background: #edf2f7;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
  }
  
  .app-icon {
    font-size: 16px;
  }
  
  .app-name {
    font-family: monospace;
  }
}

.app-count {
  font-size: 14px;
  color: #64748b;
  font-weight: normal;
}

.loading-apps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
}

.loading-apps .loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.refresh-apps-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  margin-left: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #3b82f6;
  }
}

.no-applications {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  text-align: center;
}

.sync-apps-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #3b82f6;
  padding: 0;
  margin-top: 8px;
}

.applications-count {
  font-size: 12px;
  color: #64748b;
  text-align: right;
  padding: 8px;
}

.info-refresh-btn {
  background: none;
  border: none;
  padding: 0;
  margin-left: 4px;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
}
</style> 