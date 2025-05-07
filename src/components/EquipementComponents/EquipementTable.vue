<template>
  <div>
    <section class="equipment-table">
      <header class="table-header">
        <div class="header-cell">Équipement P.N</div>
        <div class="header-cell">IP Adresse</div>
        <div class="header-cell">Type</div>
        <div class="header-cell">Marque</div>
        <div class="header-cell">Numéro de série</div>
        <div class="header-cell">Département</div>
        <div class="header-cell actions">Actions</div>
      </header>
  
      <div class="table-body">
        <div v-for="(equipment, index) in filteredEquipment" :key="index" 
             class="table-row" 
             :class="{ 
               'clickable': true,
               'row-available': equipment.disponibilite && (equipment.type === 'PDA' || equipment.printer_status === 'READY') && !(equipment.type === 'PDA' && equipment.batteryLevel < 15),
               'row-warning': (equipment.disponibilite && equipment.printer_status === 'PAUSED' && !equipment.status_message?.toUpperCase().includes('ERROR')) || 
                             (equipment.type === 'PDA' && equipment.batteryLevel < 15),
               'row-unavailable': !equipment.disponibilite || (equipment.type !== 'PDA' && (equipment.printer_status === 'OFFLINE' || (equipment.printer_status === 'PAUSED' && equipment.status_message?.toUpperCase().includes('ERROR'))))
             }"
             @click="showEquipmentDetails(equipment.idequipement)">
          <div class="table-cell">
            <div class="cell-content">
              <span class="status-indicator" :class="getStatusClass(equipment)"></span>
              {{ equipment.modele }}
              <span v-if="equipment.type === 'PDA' && equipment.batteryLevel !== null" 
                    class="battery-indicator"
                    :class="{'low-battery': equipment.batteryLevel < 15}">
                {{ equipment.batteryLevel }}%
              </span>
            </div>
          </div>
          <div class="table-cell">{{ equipment.ipadresse }}</div>
          <div class="table-cell">
            <span class="type-badge" :class="equipment.type.toLowerCase()">
              {{ equipment.type }}
            </span>
          </div>
          <div class="table-cell">{{ equipment.marque || '-' }}</div>
          <div class="table-cell">{{ equipment.serialnumber || '-' }}</div>
          <div class="table-cell department-cell">
            <span class="department-badge" v-if="equipment.departement">
              {{ equipment.departement }}
            </span>
            <span v-else>-</span>
          </div>
          <div class="table-cell actions" @click.stop>
            <div class="ellipsis-menu" @click.stop>
              <button class="ellipsis-button" @click="toggleMenu(index)">
                <span class="ellipsis-dots">...</span>
              </button>
              <div v-if="activeMenu === index" class="menu-dropdown">
                <button class="menu-item" @click="createTicket(equipment.serialnumber)">
                  
                  Créer ticket
                </button>
                <button v-if="equipment.type !== 'PDA'" class="menu-item" @click="sendCommand(equipment.idequipement)">
                  
                  Envoyer commande
                </button>
                <button class="menu-item delete" @click="deleteEquipment(equipment.idequipement)">
                  
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredEquipment.length === 0" class="no-results">
          <i class="no-results-icon">🔍</i>
          Aucun équipement trouvé
        </div>
      </div>
    </section>

    <!-- Equipment Details Modal -->
    <div v-if="showDetails" class="modal-overlay" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <EquipmentDetails 
          :equipment-id="selectedEquipmentId"
          @close="closeDetails"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import EquipmentDetails from './EquipmentDetails.vue';
import { useRouter } from 'vue-router';
import { userApi } from '../../services/userApi';

export default {
  name: "EquipmentTable",
  components: {
    EquipmentDetails
  },
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    refreshTrigger: {
      type: Number,
      default: 0
    },
    existingEquipment: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const equipmentList = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const activeMenu = ref(null);
    const showDetails = ref(false);
    const selectedEquipmentId = ref(null);
    const router = useRouter();
    const refreshInterval = ref(null);
    const currentUser = ref(null);

    const isPrinterPaused = (equipment) => {
      return equipment.printer?.printerStatus === 'PAUSED';
    };

    // Function to load the current user
    const fetchCurrentUser = async () => {
      try {
        currentUser.value = await userApi.getCurrentUser();
        const isTechnoCode = currentUser.value.departement === "TechnoCode";
        console.log('Current user loaded:', currentUser.value);
        console.log('User department:', currentUser.value.departement);
        console.log('Is TechnoCode user:', isTechnoCode);
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };

    // Function to load equipment from the database
    const loadEquipment = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await fetch('http://localhost:3000/api/equipment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment');
        }
        
        const data = await response.json();
        console.log('Equipment data:', data);
        
        // Transform data to match the component's expected format
        equipmentList.value = data.map(item => {
          const departement = item.departement || item.nomdep || null;
          console.log(`Equipment ${item.idequipement} (${item.modele}) department: ${departement}`);
          
          // For PDA devices, log battery level
          if (item.type === 'PDA') {
            console.log(`PDA ${item.idequipement} (${item.modele}) battery level: ${item.batteryLevel}`);
          }
          
          return {
            idequipement: item.idequipement,
            modele: item.modele,
            ipadresse: item.ipadresse,
            type: item.type || 'Printer',
            disponibilite: item.disponibilite,
            serialnumber: item.serialnumber,
            marque: item.marque,
            printer_status: item.printer_status,
            status_message: item.status_message,
            departement: departement, // Add departement field
            batteryLevel: item.batteryLevel || null, // Make sure batteryLevel is included
            // Include other PDA specific properties
            versionAndroid: item.versionAndroid,
            batteryType: item.batteryType,
            storageTotal: item.storageTotal,
            storageFree: item.storageFree
          };
        });
      } catch (err) {
        console.error('Error loading equipment:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    // Function to delete equipment
    const deleteEquipment = async (id) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/equipment/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || result.details || 'Failed to delete equipment');
        }

        // If deletion was successful (even if only from local database)
        if (result.success) {
          // Show appropriate message
          if (!result.cloud) {
            alert('Équipement supprimé localement avec succès. La suppression dans la base de données cloud sera effectuée lors de la prochaine connexion.');
          } else {
            alert('Équipement supprimé avec succès.');
          }
          
          // Remove the equipment from the local list
          equipmentList.value = equipmentList.value.filter(e => e.idequipement !== id);
          activeMenu.value = null;
        } else {
          throw new Error(result.error || 'Failed to delete equipment');
        }
      } catch (err) {
        console.error('Error deleting equipment:', err);
        alert(`Erreur lors de la suppression de l'équipement: ${err.message}`);
      }
    };

    const createTicket = (serialNumber) => {
      router.push({ 
        path: '/ajouter-ticket', 
        query: { serialnumber: serialNumber } 
      });
    };

    const sendCommand = (equipmentId) => {
      router.push({ 
        path: '/envoyer-commande', 
        query: { equipmentId: equipmentId } 
      });
    };

    // Function to toggle the menu
    const toggleMenu = (index) => {
      activeMenu.value = activeMenu.value === index ? null : index;
    };

    // Close menu when clicking outside
    const closeMenu = () => {
      activeMenu.value = null;
    };

    // Add click outside listener
    onMounted(() => {
      document.addEventListener('click', closeMenu);
      fetchCurrentUser().then(() => {
        loadEquipment();
      });
      
      // Set up periodic refresh every 30 seconds
      refreshInterval.value = setInterval(() => {
        loadEquipment();
      }, 30000);
    });

    // Remove click outside listener and clear interval
    onUnmounted(() => {
      document.removeEventListener('click', closeMenu);
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
    });
    
    // Watch for changes to the refreshTrigger prop to reload data
    watch(() => props.refreshTrigger, () => {
      loadEquipment();
    });
    
    // Filtered equipment based on search query and user's department
    const filteredEquipment = computed(() => {
      let filtered = equipmentList.value;
      
      // Filter by user's department if available and not from TechnoCode
      if (currentUser.value && currentUser.value.departement) {
        const userDepartment = currentUser.value.departement || currentUser.value.nomdepartement;
        const isTechnoCodeUser = userDepartment === "TechnoCode";
        
        console.log('User department:', userDepartment);
        console.log('Is TechnoCode user:', isTechnoCodeUser);
        
        // Only filter by department if user is not from TechnoCode
        if (!isTechnoCodeUser) {
          console.log('Filtering by department:', userDepartment);
          filtered = filtered.filter(equipment => {
            return equipment.departement === userDepartment;
          });
        } else {
          console.log('User is from TechnoCode, showing all equipment');
        }
      }
      
      // Apply search filter if there's a query
      if (props.searchQuery) {
        const query = props.searchQuery.toLowerCase();
        filtered = filtered.filter(equipment => {
          return equipment.modele.toLowerCase().includes(query) ||
                 equipment.ipadresse.toLowerCase().includes(query) ||
                 equipment.type.toLowerCase().includes(query) ||
                 (equipment.departement && equipment.departement.toLowerCase().includes(query)) ||
                 (equipment.disponibilite ? 'disponible' : 'indisponible').includes(query);
        });
      }
      
      // Sort equipment: unavailable first, then by model name
      return filtered.sort((a, b) => {
        // First sort by availability (unavailable first)
        if (a.disponibilite !== b.disponibilite) {
          return a.disponibilite ? 1 : -1;
        }
        
        // If both have same availability, sort by model name
        return a.modele.localeCompare(b.modele);
      });
    });

    // Function to show equipment details
    const showEquipmentDetails = (id) => {
      selectedEquipmentId.value = id;
      showDetails.value = true;
    };

    // Function to close details modal
    const closeDetails = () => {
      showDetails.value = false;
      selectedEquipmentId.value = null;
    };

    const getStatusClass = (equipment) => {
      if (!equipment.disponibilite) {
        return 'status-offline';
      }
      if (equipment.type === 'PDA' && equipment.batteryLevel < 15) {
        return 'status-paused'; // Use the yellow status for low battery
      }
      if (equipment.printer_status === 'PAUSED') {
        return 'status-paused';
      }
      return 'status-online';
    };

    return {
      equipmentList,
      filteredEquipment,
      loading,
      error,
      activeMenu,
      showDetails,
      selectedEquipmentId,
      showEquipmentDetails,
      closeDetails,
      toggleMenu,
      deleteEquipment,
      createTicket,
      sendCommand,
      getStatusClass,
      currentUser
    };
  }
};
</script>

<style lang="scss" scoped>
.equipment-table {    
  border-radius: 12px;
  margin-left: 60px;
  margin-top: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: visible;
}

.table-header {
  display: flex;
  padding: 12px 24px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-cell {
  color: #475569;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
  
  &.actions {
    flex: 0.5;
    text-align: center;
  }
}

.table-body {
  overflow: visible;
}

.table-row {
  display: flex;
  padding: 12px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  align-items: center;
  position: relative;
  
  &:hover {
    background-color: #f8fafc;
  }
  
  &.row-available {
    background-color: rgba(34, 197, 94, 0.18);
    
    &:hover {
      background-color: rgba(34, 197, 94, 0.32);
    }
  }
  
  &.row-warning {
    background-color: rgba(245, 158, 11, 0.18);
    
    &:hover {
      background-color: rgba(245, 158, 11, 0.32);
    }
  }
  
  &.row-unavailable {
    background-color: rgba(239, 68, 68, 0.18);
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.32);
    }
  }
}

.table-cell {
  flex: 1;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #1e293b;
  display: flex;
  align-items: center;
  
  .cell-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &.actions {
    flex: 0.5;
    justify-content: center;
  }
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.status-online {
    background-color: #10b981;
  }
  
  &.status-paused {
    background-color: #f59e0b;
  }
  
  &.status-offline {
    background-color: #ff1111;
  }
}

.battery-indicator {
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  background-color: #e2e8f0;
  color: #1e293b;
  font-weight: 500;
  
  &.low-battery {
    background-color: #f59e0b;
    color: #fff;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.type-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.pda {
    background-color: #e0f2fe;
    color: #0369a1;
  }
  
  &.printer {
    background-color: #f0fdf4;
    color: #15803d;
  }
}

.no-results {
  padding: 32px;
  text-align: center;
  font-family: "Inter", sans-serif;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  
  .no-results-icon {
    font-size: 24px;
  }
}

.ellipsis-menu {
  position: relative;
  display: inline-block;
}

.ellipsis-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 18px;
  color: #64748b;
  transition: all 0.2s ease;
  
  &:hover {
    color: #334155;
    background-color: #eaeaea;
    border-radius: 4px;
  }
}

.menu-dropdown {
  position: fixed;
  right: 2px;
  top: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
  margin-right: 100px;
  margin-left: 0px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: #334155;
  font-size: 14px;
  transition: all 0.2s ease;
  
  .menu-icon {
    font-size: 16px;
  }
  
  &:hover {
    background: #f1f5f9;
  }
  
  &.delete {
    color: #ef4444;
    
    &:hover {
      background: #fee2e2;
    }
  }
}

.clickable {
  cursor: pointer;
}

.modal-overlay {
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.department-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #e0f2fe;
  color: #0369a1;
}

.department-cell {
  flex: 1;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #1e293b;
  display: flex;
  align-items: center;
}
</style>