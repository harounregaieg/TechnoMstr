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
            <div class="info-icon">🏢</div>
            <div class="info-content">
              <span class="label">Parc</span>
              <span class="value">{{ equipment.nomparc || 'Non spécifié' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🏛️</div>
            <div class="info-content">
              <span class="label">Département</span>
              <span class="value">{{ currentUser ? (currentUser.nomdepartement || currentUser.departement || 'Non spécifié') : 'Chargement...' }}</span>
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
          <div class="info-card">
            <div class="info-icon">🔢</div>
            <div class="info-content">
              <span class="label">Numéro de Série</span>
              <span class="value">{{ equipment.serialnumber }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🤖</div>
            <div class="info-content">
              <span class="label">Version Android</span>
              <span class="value">{{ equipment.versionAndroid }}</span>
            </div>
          </div>
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
          <div class="info-card">
            <div class="info-icon">⚡</div>
            <div class="info-content">
              <span class="label">État de la Batterie</span>
              <span class="value">{{ getBatteryStatusText(equipment.batteryType) }}</span>
            </div>
          </div>
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
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
    const currentUser = ref(null);

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
      } catch (err) {
        console.error('Error loading equipment details:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchCurrentUser = async () => {
      try {
        currentUser.value = await userApi.getCurrentUser();
        console.log('Current user:', currentUser.value);
        console.log('Current user department:', currentUser.value?.departement);
        console.log('Current user nomdepartement:', currentUser.value?.nomdepartement);
        console.log('Current user structure:', JSON.stringify(currentUser.value, null, 2));
      } catch (err) {
        console.error('Error fetching current user:', err);
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
            1: 'Unknown - Battery status cannot be determined',
            2: 'Charging - Battery is currently charging',
            3: 'Discharging - Battery is currently discharging',
            4: 'Not Charging - Battery is not charging',
            5: 'Full - Battery is fully charged'
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

    onMounted(() => {
      fetchEquipmentDetails();
      fetchCurrentUser();
    });

    return {
      equipment,
      loading,
      error,
      currentUser,
      getStatusClass,
      getStatusText,
      getBatteryStatusText,
      getStatusIcon,
      calculateStoragePercentage
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
</style> 