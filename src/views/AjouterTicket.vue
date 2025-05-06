<template>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <div class="users-view">
      <section class="main-content">
        <div class="header-actions">
          <h1 class="page-title">New Ticket</h1>
          <button class="back-button" @click="goBack">
            <span class="material-icons">arrow_back</span>
            Retour
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="form-container">
         
          <div class="ticket-type-selector">
            <label class="type-label">Type de Ticket:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="ticketType" value="type1" v-model="formData.ticketType" @change="filterUsers">
                Type 1 (Même Département)
              </label>
              <label class="radio-label">
                <input type="radio" name="ticketType" value="type2" v-model="formData.ticketType" @change="filterUsers">
                Type 2 (Technocode)
              </label>
            </div>
          </div>
  
          <FormRow>
            <FormField label="Sujet" v-model="formData.sujet" />
            <FormField label="Equipement Serial Number" v-model="formData.equipementserialnumber" />
          </FormRow>
  
          <FormRow>
            <FormField label="Priority" type="select" v-model="formData.priority">
              <option value="" hidden>Select a priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </FormField>
            <FormField
              label="Responsable" type="select" v-model="formData.responsable"
            >
              <option value="" hidden>Sélectionnez un responsable</option>
              <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
                {{ user.prenom }} {{ user.nom }} - {{ user.departement }}
              </option>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Pieces A Remplacer" type="piecearemplacer" v-model="formData.replacepiece" />
          </FormRow>
  
          <FormRow>
            <FormField label="Description" type="description" v-model="formData.description" />
          </FormRow>
  
          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              <span v-if="isSubmitting">Création...</span>
              <span v-else>Créer</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </template>
  
  <script>
  import FormField from "../components/AddUserComponents/FormField.vue";
  import FormRow from "../components/AddUserComponents/FormRow.vue";
  import { useRouter } from 'vue-router';
  import { userApi } from "../services/userApi.js";
  
  export default {
    name: "TicketRegistrationForm",
    components: {
      FormField,
      FormRow,
    },
    setup() {
      const router = useRouter();
      
      const goBack = () => {
        router.push('/tickets');
      };
  
      return {
        goBack
      };
    },
    data() {
      return {
        users: [],
        filteredUsers: [],
        currentUser: null,
        formData: {
          sujet: "",
          equipementserialnumber: "",
          priority: "",
          responsable: "",
          replacepiece: "",
          description: "",
          ticketType: "type1", // Default to type1
        },
        isSubmitting: false, // Add loading state
      };
    },
    async mounted() {
      try {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          this.currentUser = JSON.parse(userStr);
          console.log("Current user from localStorage:", this.currentUser);
        } else {
          console.error("No user found in localStorage");
          // Redirect to login if no user is found
          this.router.push('/login');
          return;
        }

        // Get serial number from URL query parameters
        const serialNumber = this.$route.query.serialnumber;
        if (serialNumber) {
          this.formData.equipementserialnumber = serialNumber;
          console.log("Setting serial number from URL:", serialNumber);
        }

        // Fetch users from the API
        this.users = await userApi.getUsers();
        console.log("Fetched users:", this.users);
        
        // Initial filtering of users
        this.filterUsers();
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    },
    methods: {
      filterUsers() {
        if (!this.currentUser || !this.users.length) {
          this.filteredUsers = [];
          return;
        }
        
        if (this.formData.ticketType === "type1") {
          // Filter users from the same department as the current user
          this.filteredUsers = this.users.filter(user => 
            user.departement === this.currentUser.departement &&
            user.id !== this.currentUser.id  // Exclude current user from the list
          );
          console.log("Filtered users (same department):", this.filteredUsers);
        } else if (this.formData.ticketType === "type2") {
          // Filter users from Technocode department (case-insensitive)
          this.filteredUsers = this.users.filter(user => 
            user.departement.toLowerCase() === "technocode"
          );
          console.log("Filtered users (Technocode):", this.filteredUsers);
        }
      },
      async handleSubmit() {
        if (this.isSubmitting) return; // Prevent double submit
        this.isSubmitting = true;
        try {
          // Validate required fields
          if (!this.formData.sujet || !this.formData.equipementserialnumber || !this.formData.priority || !this.formData.responsable) {
            console.log('Form validation failed:', {
              sujet: !!this.formData.sujet,
              serialnumber: !!this.formData.equipementserialnumber,
              priority: !!this.formData.priority,
              responsable: !!this.formData.responsable
            });
            alert('Please fill in all required fields');
            this.isSubmitting = false;
            return;
          }

          // Create ticket data
          const ticketData = {
            sujet: this.formData.sujet,
            serialnumber: this.formData.equipementserialnumber,
            agent: parseInt(this.formData.responsable),
            requester: this.currentUser.id,
            priority: this.formData.priority,
            piecesaremplacer: this.formData.replacepiece || '',
            description: this.formData.description || ''
          };

          console.log('Submitting ticket data:', ticketData);

          // Send ticket to backend
          const response = await fetch('http://localhost:3000/api/tickets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData)
          });

          console.log('Response status:', response.status);
          const responseData = await response.json();
          console.log('Response data:', responseData);

          if (!response.ok) {
            throw new Error(`Failed to create ticket: ${responseData.error || 'Unknown error'}`);
          }

          // Navigate back to tickets page on success
          this.$router.push('/tickets');
        } catch (error) {
          console.error('Detailed error creating ticket:', {
            message: error.message,
            stack: error.stack,
            formData: this.formData
          });
          alert(`Failed to create ticket: ${error.message}`);
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
  
  .ticket-type-selector {
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
    padding: 1rem;
    border-radius: 6px;
    background-color: #f9fafb;
  }
  
  .type-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: #374151;
  }
  
  .radio-group {
    display: flex;
    gap: 1.5rem;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4b5563;
  }
  
  .radio-label input {
    cursor: pointer;
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
  }
  
  .submit-button:hover {
    background-color: #1d4ed8;
  }
  
  .form-container select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: white;
    font-size: 14px;
    color: #1f2937;
  }
  
  .form-container select option {
    padding: 8px;
    font-size: 14px;
    color: #1f2937;
    background-color: white;
  }
  
  .form-container select option:hover {
    background-color: #f3f4f6;
    cursor: pointer;
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
  