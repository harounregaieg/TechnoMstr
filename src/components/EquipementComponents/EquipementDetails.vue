<template>
  <div class="equipment-details">
    <h3>Détails de l'équipement</h3>
    
    <div class="details-grid">
      <div class="detail-row">
        <span class="label">Type:</span>
        <span class="value">{{ equipment.type }}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Modèle:</span>
        <span class="value">{{ equipment.modele }}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Adresse IP:</span>
        <span class="value">{{ equipment.ipadresse }}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Disponibilité:</span>
        <span class="value" :class="equipment.disponibilite ? 'status-online' : 'status-offline'">
          {{ equipment.disponibilite ? 'Disponible' : 'Indisponible' }}
        </span>
      </div>
      
      <div class="detail-row">
        <span class="label">Département:</span>
        <span class="value">{{ currentUser ? (currentUser.nomdepartement || currentUser.departement || 'Non spécifié') : 'Chargement...' }}</span>
      </div>

      <!-- PDA Specific Details -->
      <template v-if="equipment.type === 'PDA'">
        <div class="detail-row">
          <span class="label">Numéro de série:</span>
          <span class="value">{{ equipment.serialnumber }}</span>
        </div>

        <div class="detail-row">
          <span class="label">Version Android:</span>
          <span class="value">{{ equipment.versionAndroid }}</span>
        </div>

        <div class="detail-row">
          <span class="label">Niveau de batterie:</span>
          <span class="value">{{ equipment.batteryLevel }}%</span>
        </div>

        <div class="detail-row">
          <span class="label">État de la batterie:</span>
          <span class="value">{{ equipment.batteryType }}</span>
        </div>

        <div class="detail-row">
          <span class="label">Stockage:</span>
          <span class="value">
            Total: {{ equipment.storageTotal }}<br>
            Disponible: {{ equipment.storageFree }}
          </span>
        </div>
      </template>

      <!-- Printer Specific Details -->
      <template v-else-if="equipment.printer">
        <div class="detail-row">
          <span class="label">Numéro de série:</span>
          <span class="value">{{ equipment.printer.serialnumber }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Résolution:</span>
          <span class="value">{{ equipment.printer.resolution }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Vitesse:</span>
          <span class="value">{{ equipment.printer.vitesse }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Version logicielle:</span>
          <span class="value">{{ equipment.printer.softwareversion }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Contraste:</span>
          <span class="value">{{ equipment.printer.contrast }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Type d'impression:</span>
          <span class="value">{{ equipment.printer.typeimpression }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Loquet:</span>
          <span class="value">{{ equipment.printer.latch }}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Tete:</span>
          <span class="value">{{ equipment.printer.coveropen ? 'Ouvert' : 'Fermé' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { userApi } from '../../services/userApi';

export default {
  name: 'EquipementDetails',
  props: {
    equipment: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentUser: null
    };
  },
  methods: {
    getBatteryStatusText(status) {
      const statusMap = {
        1: 'Unknown - Battery status cannot be determined',
        2: 'Equipement en charge',
        3: 'Equipement en décharge',
        4: 'Equipement en pause',
        5: 'Plein Charge'
      };
      return statusMap[status] || 'Unknown - Battery status cannot be determined';
    },
    async fetchCurrentUser() {
      try {
        this.currentUser = await userApi.getCurrentUser();
        console.log('Current user:', this.currentUser);
        console.log('Current user department:', this.currentUser?.departement);
        console.log('Current user nomdepartement:', this.currentUser?.nomdepartement);
        console.log('Current user structure:', JSON.stringify(this.currentUser, null, 2));
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    }
  },
  created() {
    this.fetchCurrentUser();
  }
}
</script>

<style scoped>
.equipment-details {
  padding: 20px;
}

.details-grid {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.detail-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #64748b;
}

.value {
  color: #1e293b;
}

.status-online {
  color: #10b981;
}

.status-offline {
  color: #ef4444;
}
</style> 