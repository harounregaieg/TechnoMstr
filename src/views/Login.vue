<template>
  <main class="dashboard-login">
    <div class="login-wrapper">
      <div class="logo">
        <img src="../assets/full-logo-horizontal.webp" alt="Company Logo">
      </div>
      <div class="login-container">
        <form @submit.prevent="handleSubmit" class="login-form-container">
          <h2 class="welcome-text">Bienvenue</h2>
          <p class="subtitle">Connectez-vous pour accéder à votre compte</p>
          
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
          
          <div v-if="generalError" class="error-message">
            {{ generalError }}
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api'; // Import our api service

// Import your custom components
import EmailInput from '../components/LoginComponents/EmailInput.vue';
import FormInput from '../components/LoginComponents/FormInput.vue';
import LoginButton from '../components/LoginComponents/LoginButton.vue';

export default {
  name: 'LoginDashboard',
  components: {
    EmailInput,
    FormInput,
    LoginButton,
    
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
      console.log('Attempting login with:', { email: this.email });

      try {
        // Make the login request using our api service
        console.log('Sending request to /api/auth/login');
        
        // Log the complete URL for debugging
        console.log('Complete URL:', api.defaults.baseURL + '/api/auth/login');
        
        const response = await api.post('/api/auth/login', {
          email: this.email,
          password: this.password
        });

        console.log('Login response:', response.data);

        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home page
        this.router.push('/');
      } catch (error) {
        // Handle login errors
        console.error('Login error details:', error);
        
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Server response status:', error.response.status);
          console.error('Server response headers:', error.response.headers);
          console.error('Server response data:', error.response.data);
          this.generalError = error.response.data.message || 'Échec de la connexion';
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received. Request details:', error.request);
          this.generalError = 'Aucune réponse du serveur. Vérifiez que le serveur est en cours d\'exécution sur le port 3000.';
        } else {
          // Something happened in setting up the request
          console.error('Request setup error:', error.message);
          this.generalError = 'Erreur de connexion: ' + error.message;
        }
      } finally {
        // Reset loading state
        this.isLoading = false;
      }
    },
    handleForgotPassword() {
      // Navigate to forgot password page or open modal
      
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
  background: linear-gradient(135deg, rgb(67, 89, 155) 0%, rgb(45, 60, 105) 100%);
  display: flex;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  align-items: center;
  font-family: Montserrat, -apple-system, Roboto, Helvetica, sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-wrapper {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  width: 90%;
  max-width: 400px;
  margin: 2rem;
}

.logo {
  margin-bottom: 2rem;
  text-align: center;
}

.logo img {
  max-width: 200px;
  height: auto;
}

.login-container {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  align-items: center;
}

.login-form-container {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 1.5rem;
}

.welcome-text {
  color: white;
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.password-input {
  margin-top: 1rem;
}

.error-message {
  color: #ff6b6b;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9em;
  padding: 0.5rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

@media (max-width: 480px) {
  .login-wrapper {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .welcome-text {
    font-size: 1.75rem;
  }
}
</style>