<template>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <div class="users-view">
    <section class="main-content">
      <div class="header-actions">
        <h1 class="page-title">Ajouter Utilisateur</h1>
        <button class="back-button" @click="goBack">
          <span class="material-icons">arrow_back</span>
          Retour
        </button>
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      <form @submit.prevent="handleSubmit" class="form-container">
        <FormRow>
          <FormField label="Nom" v-model="formData.lastName" :error="errors.lastName" />
          <FormField label="Prenom" v-model="formData.firstName" :error="errors.firstName" />
        </FormRow>

        <FormRow>
          <FormField label="Role" type="select" v-model="formData.role" :error="errors.role">
            <option value="" hidden >Sélectionnez un Role</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="technicien">Technicien</option>
          </FormField>
          <FormField label="Departement" type="departement" v-model="formData.department" :error="errors.department" />
        </FormRow>

        <FormRow>
          <FormField label="Email" type="email" v-model="formData.email" :error="errors.email" />
          <FormField
            label="Mot de Passe"
            type="password"
            v-model="formData.password"
            :error="errors.password"
          />
        </FormRow>

        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'En cours...' : 'Ajouter' }}
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
import axios from 'axios';

export default {
  name: "UserRegistrationForm",
  components: {
    FormField,
    FormRow,
  },
  setup() {
    const router = useRouter();
    
    const goBack = () => {
      router.push('/users');
    };

    return {
      goBack
    };
  },
  data() {
    return {
      formData: {
        id: "",
        lastName: "",
        firstName: "",
        role: "",
        department: "",
        email: "",
        password: "",
      },
      isSubmitting: false,
      errorMessage: "",
      successMessage: "",
      errors: {
        lastName: "",
        firstName: "",
        role: "",
        department: "",
        email: "",
        password: "",
      }
    };
  },
  methods: {
    validateForm() {
      let isValid = true;
      // Reset errors
      this.errors = {
        lastName: "",
        firstName: "",
        role: "",
        department: "",
        email: "",
        password: "",
      };
      
      if (!this.formData.lastName) {
        this.errors.lastName = "Le nom est requis";
        isValid = false;
      }
      
      if (!this.formData.firstName) {
        this.errors.firstName = "Le prénom est requis";
        isValid = false;
      }
      
      if (!this.formData.role) {
        this.errors.role = "Le rôle est requis";
        isValid = false;
      }
      
      if (!this.formData.email) {
        this.errors.email = "L'email est requis";
        isValid = false;
      } else if (!this.validateEmail(this.formData.email)) {
        this.errors.email = "Format d'email invalide";
        isValid = false;
      }
      
      if (!this.formData.password) {
        this.errors.password = "Le mot de passe est requis";
        isValid = false;
      } else if (this.formData.password.length < 6) {
        this.errors.password = "Le mot de passe doit contenir au moins 6 caractères";
        isValid = false;
      }
      
      return isValid;
    },
    
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    
    async handleSubmit() {
      this.errorMessage = "";
      this.successMessage = "";
      
      if (!this.validateForm()) {
        return;
      }
      
      try {
        this.isSubmitting = true;
        
        // Map frontend field names to database field names
        const userData = {
          nom: this.formData.lastName,
          prenom: this.formData.firstName,
          email: this.formData.email,
          motdepasse: this.formData.password,
          roleuser: this.formData.role,
          statut: 'active', // Default status for new users
          departement: this.formData.department
        };
        
        // Send data to your API
        const API_URL = 'http://localhost:3000/api';
        const response = await axios.post(`${API_URL}/users`, userData);
        
        console.log("User added successfully:", response.data);
        this.successMessage = 'Utilisateur ajouté avec succès!';
        
        // Clear form
        this.formData = {
          id: "",
          lastName: "",
          firstName: "",
          role: "",
          department: "",
          email: "",
          password: "",
        };
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          this.$router.push('/users');
        }, 1500);
      } catch (err) {
        console.error("Error adding user:", err);
        this.errorMessage = err.response?.data?.error || 'Failed to add user';
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
}

.submit-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.error-message {
  padding: 10px;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin-bottom: 16px;
}

.success-message {
  padding: 10px;
  background-color: #dcfce7;
  color: #166534;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>