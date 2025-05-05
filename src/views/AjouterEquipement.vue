<template>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <div class="users-view">
      <section class="main-content">
        <div class="header-actions">
          <h1 class="page-title">Ajouter Equipement</h1>
          <button class="back-button" @click="goBack">
            <span class="material-icons">arrow_back</span>
            Retour
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="form-container">
          <FormRow>
            <FormField label="IP Adresse" v-model="formData.ipAddress" required />
            <FormField label="Numéro de série" v-model="formData.serialNumber" required />
            <FormField label="Marque" type="select" v-model="formData.brand" required>
                <option value="" hidden>Sélectionnez la marque</option>
                <option value="1">Zebra</option>
                <option value="2">Sato</option>
              </FormField>
          </FormRow>

          

          <FormRow>

            <FormField label="Modéle" v-model="formData.model" required />
            <FormField label="Type" type="select" v-model="formData.type" required>
              <option value="" hidden>Sélectionnez un type</option>
              <option value="Printer">Imprimante</option>
              <option value="PDA">PDA</option>
              <option value="Other">Autre</option>
            </FormField>
            
          </FormRow>
  
          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-if="isSubmitting">Ajout en cours...</span>
              <span v-else>Ajouter</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </template>
  
  <script>
  import FormField from "../components/AddEquip/FormField.vue";
  import FormRow from "../components/AddEquip/FormRow.vue";
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  import { ref, onMounted } from 'vue';
  import { userApi } from "../services/userApi";
  
  export default {
    name: "EquipementRegistrationForm",
    components: {
      FormField,
      FormRow,
    },
    setup() {
      const router = useRouter();
      
      const goBack = () => {
        router.push('/equipements');
      };

      return {
        goBack
      };
    },
    data() {
      return {
        formData: {
          serialNumber: "",
          ipAddress: "",
          model: "",
          brand: "",
          type: "",
          availability: true,
          location: "",
          departement: "",
          notes: "",
          resolution: "",
          speed: "",
          softwareVersion: "",
          contrast: "",
          printType: "",
          latch: ""
        },
        currentUser: null,
        departments: [],
        isSubmitting: false
      };
    },
    async created() {
      // Fetch current user to get department
      try {
        this.currentUser = await userApi.getCurrentUser();
        // Set department from current user
        this.formData.departement = this.currentUser.departement;
      } catch (error) {
        console.error("Error fetching current user:", error);
      }

      // Fetch departments if needed
      try {
        const response = await axios.get('http://localhost:3000/api/departments');
        this.departments = response.data;
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    },
    methods: {
      async handleSubmit() {
        if (this.isSubmitting) return;
        
        // Validate required fields
        const requiredFields = ['ipAddress', 'model', 'type', 'serialNumber', 'brand'];
        
        const missingFields = requiredFields.filter(field => !this.formData[field]);
        
        if (missingFields.length > 0) {
          alert('Veuillez remplir tous les champs obligatoires');
          return;
        }

        this.isSubmitting = true;
        
        try {
          // Create axios instance with timeout
          const api = axios.create({
            baseURL: 'http://localhost:3000/api',
            timeout: 5000 // 5 second timeout
          });
          
          // Format the data according to what the backend expects
          const equipmentData = {
            modele: this.formData.model,
            ipAdresse: this.formData.ipAddress,
            disponibilite: true,
            idParc: 1, // Using default idParc
          };
          
          // First add the equipment
          const equipmentResponse = await api.post('/equipment', equipmentData);
          
          if (!equipmentResponse.data || !equipmentResponse.data.local) {
            throw new Error('Failed to add equipment');
          }
          
          // For printers, we need to add the printer details too
          if (this.formData.type === 'Printer') {
            const printerData = {
              serialnumber: this.formData.serialNumber,
              ipAdresse: this.formData.ipAddress,
              resolution: '203 dpi', // Default value
              vitesse: 6, // Default value
              contrast: 10.0, // Default value
              typeImpression: 'Thermique', // Default value
              latch: 'Oui', // Default value
              idMarque: parseInt(this.formData.brand),
              coverOpen: false,
              printer_status: 'UNKNOWN',
              status_message: 'New printer added manually'
            };
            
            // Add the printer with a reference to the equipment
            const printerResponse = await api.post('/equipment/scanned-printer', {
              ip: this.formData.ipAddress,
              printer: {
                ...printerData,
                model: this.formData.model,
                type: this.formData.type,
                printerType: this.formData.brand === '1' ? 'Zebra' : 'Sato',
                brand: this.formData.brand
              }
            });
            
            // If cloud database connection failed but local succeeded, show a warning but proceed
            if (printerResponse.data && printerResponse.data.equipement && printerResponse.data.equipement.cloud === null) {
              console.warn('Cloud database connection failed, but equipment was added to local database');
              alert('Équipement ajouté localement avec succès. La synchronisation cloud sera effectuée ultérieurement.');
            } else {
              alert('Équipement ajouté avec succès');
            }
          } else {
            // For non-printer types
            alert('Équipement ajouté avec succès');
          }
          
          // Navigate back to the equipment list
          this.$router.push('/equipements');
        } catch (error) {
          console.error('Error adding equipment:', error);
          
          let errorMessage = 'Erreur lors de l\'ajout de l\'équipement';
          
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'L\'opération a pris trop de temps, mais l\'équipement a probablement été ajouté. Vérifiez la liste des équipements.';
          } else if (error.response) {
            if (error.response.data && error.response.data.detail) {
              errorMessage += ': ' + error.response.data.detail;
            } else if (error.response.data && error.response.data.error) {
              errorMessage += ': ' + error.response.data.error;
            } else {
              errorMessage += ' (Status: ' + error.response.status + ')';
            }
          } else if (error.message) {
            errorMessage += ': ' + error.message;
          }
          
          alert(errorMessage);
          
          // In case of timeout but equipment was added, navigate back
          if (error.code === 'ECONNABORTED') {
            this.$router.push('/equipements');
          }
        } finally {
          this.isSubmitting = false;
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .users-view {
    width: 100%;
    padding: 1rem;
    padding-left: calc(2rem + 48px);
    box-sizing: border-box;
    transition: padding-left 0.2s ease-out;
  }
  
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .back-button:hover {
    background: #e5e7eb;
  }
  
  .main-content {
    flex: 1;
    padding: 22px;
    height: 100%;
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
  
  .form-container {
    padding: 2px;
    border-radius: 8px;
    max-width: 1662px;
    margin-bottom: 8px;
    background-color: #fff;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .submit-button {
    color: #fff;
    padding: 10px 24px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #2563eb;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .submit-button:hover {
    background-color: #1d4ed8;
  }

  .submit-button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    display: inline-block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .main-content {
      padding: 16px;
    }
  
    .page-title {
      font-size: 20px;
      margin-bottom: 24px;
    }
  
    .form-container {
      padding: 16px;
    }
  }
  </style>
  