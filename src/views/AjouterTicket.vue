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
         
  
          <FormRow>
            <FormField label="Sujet" v-model="formData.sujet" />
            <FormField label="Equipement I.D" v-model="formData.equipementid" />
          </FormRow>
  
          <FormRow>
            <FormField label="Priority" type="select" v-model="formData.priority">
              <option value="" hidden>Select a priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </FormField>
            <FormField
              label="Responsable" type="select" v-model="formData.responsable"
            >
              <option value="" hidden >Sélectionnez un responsable</option>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Pieces A Remplacer" type="piecearemplacer" v-model="formData.replacepiece" />
          </FormRow>
  
          <FormRow>
            <FormField label="Description" type="description" v-model="formData.description" />
          </FormRow>
  
          <div class="form-actions">
            <button type="submit" class="submit-button">Envoyer</button>
          </div>
        </form>
      </section>
    </div>
  </template>
  
  <script>
  import FormField from "../components/AddUserComponents/FormField.vue";
  import FormRow from "../components/AddUserComponents/FormRow.vue";
  import { useRouter } from 'vue-router';
  
  export default {
    name: "UserRegistrationForm",
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
        formData: {
          id: "",
          lastName: "",
          firstName: "",
          role: "",
          department: "",
          email: "",
          password: "",
        },
      };
    },
    methods: {
      handleSubmit() {
        console.log("Form submitted:", this.formData);
        this.$router.push('/tickets');
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
  
  .submit-button:hover {
    background-color: #1d4ed8;
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
  