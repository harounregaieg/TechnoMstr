<template>
  <main class="dashboard-login">
    <div class="logo">
      <img src="../assets/full-logo-horizontal.webp" alt="Company Logo">
    </div>
    <div class="login-container">
      <form @submit.prevent="handleSubmit" class="login-form-container">
        <EmailInput 
          id="email"
          label="E-MAIL"
          :icon-src="'https://cdn.builder.io/api/v1/image/assets/11ca9f5aa3e84ca99e47336ecb81adba/57c615065e7588efe8142e4aa4b035def68b598d6c0de255ad7a6478d883cb5d?placeholderIfAbsent=true'"
          v-model="email"
          :error="emailError"

        />
        
        <FormInput
          id="password"
          label="MOT DE PASSE"
          type="password"
          v-model="password"
           :icon-src="'https://cdn.builder.io/api/v1/image/assets/11ca9f5aa3e84ca99e47336ecb81adba/bcf115377daebb36ffec05544b8347b5f0a7d3cc8a63a28e5329761bb4156f71?placeholderIfAbsent=true'"
          :error="passwordError"
          class="password-input"
        />
        
        <LoginButton 
          :disabled="isLoading"
          @click="handleSubmit"
        >
          {{ isLoading ? 'Connexion...' : 'Connecter' }}
        </LoginButton>
        
        <ForgotPassword 
          @click="handleForgotPassword"
        />
        
        <!-- Error Message -->
        <div v-if="generalError" class="error-message">
          {{ generalError }}
        </div>
      </form>
    </div>
  </main>
</template>

<script>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Import your custom components
import EmailInput from '../components/LoginComponents/EmailInput.vue';
import FormInput from '../components/LoginComponents/FormInput.vue';
import LoginButton from '../components/LoginComponents/LoginButton.vue';
import ForgotPassword from '../components/LoginComponents/ForgotPassword.vue';

export default {
  name: 'LoginDashboard',
  components: {
    EmailInput,
    FormInput,
    LoginButton,
    ForgotPassword
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      email: '',
      password: '',
      emailError: '',
      passwordError: '',
      generalError: '',
      isLoading: false
    };
  },
  methods: {
    validateForm() {
      // Reset previous errors
      this.emailError = '';
      this.passwordError = '';
      this.generalError = '';

      // Email validation
      if (!this.email) {
        this.emailError = 'L\'email est requis';
        return false;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = 'Format d\'email invalide';
        return false;
      }

      // Password validation
      if (!this.password) {
        this.passwordError = 'Le mot de passe est requis';
        return false;
      }

      return true;
    },
    async handleSubmit() {
      // Prevent multiple submissions
      if (this.isLoading) return;

      // Validate form
      if (!this.validateForm()) return;

      // Set loading state
      this.isLoading = true;

      try {
        const response = await axios.post('/api/auth/login', {
          email: this.email,
          password: this.password
        });

        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home page
        this.router.push('/');
      } catch (error) {
        // Handle login errors
        if (error.response) {
          // The request was made and the server responded with a status code
          this.generalError = error.response.data.message || 'Échec de la connexion';
        } else if (error.request) {
          // The request was made but no response was received
          this.generalError = 'Aucune réponse du serveur';
        } else {
          // Something happened in setting up the request
          this.generalError = 'Erreur de connexion';
        }
        console.error('Login error:', error);
      } finally {
        // Reset loading state
        this.isLoading = false;
      }
    },
    handleForgotPassword() {
      // Navigate to forgot password page or open modal
      this.router.push('/forgot-password');
    }
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-login {
  background-color: rgb(67, 89, 155);
  display: flex;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
  font-family: Montserrat, -apple-system, Roboto, Helvetica, sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 1);
  font-weight: 300;
  text-align: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.logo {
  margin-top: 10rem;
}

.login-container {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1000px;
  align-items: center;
  justify-content: center;
}

.login-form-container {
  position: relative;
  display: flex;
  width: 300px;
  max-width: 100%;
  flex-direction: column;
  align-items: stretch;
  z-index: 1;
}

.password-input {
  margin-top: 20px;
}

.error-message {
  color: #ff4136;
  margin-top: 15px;
  text-align: center;
  font-size: 0.9em;
}
</style>