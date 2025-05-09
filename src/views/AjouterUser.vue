<template>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <div class="users-view">
    <section class="main-content">
      <div class="header-actions">
        <h1 class="page-title">{{ isEditing ? 'Modifier Utilisateur' : 'Ajouter Utilisateur' }}</h1>
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
          <FormField 
            v-if="!isTechnoCodeUser" 
            label="Departement" 
            type="text" 
            v-model="formData.department" 
            :error="errors.department" 
            :disabled="true" 
          />
          <div v-else class="department-selection">
            <FormField 
              label="Departement" 
              type="select" 
              v-model="formData.department" 
              :error="errors.department"
              @change="onDepartmentChange"
            >
              <option value="" hidden>Sélectionnez un Departement</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.nomdep">
                {{ dept.nomdep }}
              </option>
              <option value="create-new">+ Créer un nouveau département</option>
            </FormField>
            <div v-if="isCreatingDepartment" class="new-department-input">
              <input 
                type="text"
                v-model="newDepartmentName"
                placeholder="Nom du département"
                @keyup.enter="createNewDepartment"
              />
              <div class="new-dept-actions">
                <button type="button" class="create-dept-btn" @click="createNewDepartment" :disabled="!newDepartmentName">
                  Créer
                </button>
                <button type="button" class="cancel-dept-btn" @click="cancelNewDepartment">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </FormRow>

        <FormRow>
          <FormField label="Email" type="email" v-model="formData.email" :error="errors.email" />
          <FormField
            label="Mot de Passe"
            type="password"
            v-model="formData.password"
            :error="errors.password"
            :placeholder="isEditing ? 'Laisser vide pour ne pas changer' : ''"
            :required="!isEditing"
          />
        </FormRow>

        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'En cours...' : (isEditing ? 'Mettre à jour' : 'Ajouter') }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script>
import FormField from "../components/AddUserComponents/FormField.vue";
import FormRow from "../components/AddUserComponents/FormRow.vue";
import { useRouter, useRoute } from 'vue-router';
import { userApi } from "../services/userApi";

export default {
  name: "UserRegistrationForm",
  components: {
    FormField,
    FormRow,
  },
  props: {
    id: {
      type: [String, Number],
      default: null
    }
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    const goBack = () => {
      router.push('/users');
    };

    return {
      goBack,
      route
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
      isEditing: false,
      currentUser: null,
      isTechnoCodeUser: false,
      departments: [],
      isCreatingDepartment: false,
      newDepartmentName: "",
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
  async created() {
    // Fetch current user to get department
    try {
      this.currentUser = await userApi.getCurrentUser();
      
      // Check if user is from TechnoCode department
      this.isTechnoCodeUser = this.currentUser.departement === "TechnoCode";
      
      // Set department from current user
      this.formData.department = this.currentUser.departement;
      
      // If user is from TechnoCode, fetch departments
      if (this.isTechnoCodeUser) {
        await this.fetchDepartments();
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
    
    // Check if we are in edit mode
    const userId = this.id || this.$route.params.id;
    if (userId) {
      this.isEditing = true;
      await this.fetchUserData(userId);
    }
  },
  methods: {
    async fetchDepartments() {
      try {
        this.departments = await userApi.getDepartments();
      } catch (deptError) {
        console.error("Error fetching departments:", deptError);
        this.errorMessage = "Impossible de récupérer la liste des départements";
      }
    },
    onDepartmentChange(event) {
      if (this.formData.department === 'create-new') {
        this.isCreatingDepartment = true;
        this.formData.department = ''; // Reset department selection
      }
    },
    async createNewDepartment() {
      if (!this.newDepartmentName) {
        return;
      }
      
      try {
        this.isSubmitting = true;
        const result = await userApi.createDepartment(this.newDepartmentName);
        
        // Add the new department to the list and select it
        if (result.success) {
          this.successMessage = "Département créé avec succès";
          await this.fetchDepartments(); // Refresh departments list
          
          // Select the newly created department
          this.formData.department = this.newDepartmentName;
        }
        
        // Reset creation state
        this.isCreatingDepartment = false;
        this.newDepartmentName = "";
      } catch (error) {
        this.errorMessage = error.response?.data?.error || "Erreur lors de la création du département";
      } finally {
        this.isSubmitting = false;
      }
    },
    cancelNewDepartment() {
      this.isCreatingDepartment = false;
      this.newDepartmentName = "";
    },
    async fetchUserData(userId) {
      try {
        const userData = await userApi.getUserById(userId);
        
        // Map database fields to form fields
        this.formData = {
          id: userData.id,
          lastName: userData.nom,
          firstName: userData.prenom,
          role: userData.roleuser,
          department: userData.departement,
          email: userData.email,
          password: "", // Don't populate password
        };
      } catch (error) {
        console.error("Error fetching user data:", error);
        this.errorMessage = "Impossible de récupérer les données de l'utilisateur";
      }
    },
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
      
      // Only validate password on create or if provided during edit
      if (!this.isEditing && !this.formData.password) {
        this.errors.password = "Le mot de passe est requis";
        isValid = false;
      } else if (this.formData.password && this.formData.password.length < 6) {
        this.errors.password = "Le mot de passe doit contenir au moins 6 caractères";
        isValid = false;
      }

      // Department is required
      if (!this.formData.department) {
        this.errors.department = "Le département est requis";
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
        
        // Ensure we preserve the department set during creation
        const currentDepartment = this.formData.department;
        
        // Map frontend field names to database field names
        const userData = {
          nom: this.formData.lastName,
          prenom: this.formData.firstName,
          email: this.formData.email,
          roleuser: this.formData.role,
          statut: 'active', // Default status for new users
          departement: currentDepartment // Ensure we use the original department value
        };
        
        // Only include password if it's set (for create) or changed (for edit)
        if (this.formData.password) {
          userData.motdepasse = this.formData.password;
        }
        
        let response;
        
        if (this.isEditing) {
          // Update existing user
          response = await userApi.updateUser(this.formData.id, userData);
          this.successMessage = 'Utilisateur mis à jour avec succès!';
        } else {
          // Create new user
          response = await userApi.createUser(userData);
          this.successMessage = 'Utilisateur ajouté avec succès!';
        }
        
        console.log("User operation successful:", response);
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          this.$router.push('/users');
        }, 1500);
      } catch (err) {
        console.error("Error handling user:", err);
        this.errorMessage = err.response?.data?.error || 'Failed to process user';
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

.department-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.new-department-input {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-department-input input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.new-dept-actions {
  display: flex;
  gap: 8px;
}

.create-dept-btn, .cancel-dept-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.create-dept-btn {
  background-color: #2563eb;
  color: white;
}

.create-dept-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.cancel-dept-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}
</style>