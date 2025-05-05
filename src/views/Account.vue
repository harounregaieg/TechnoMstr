<template>
  <main class="profile-bg">
    <div class="profile-center">
      <div class="profile-card">
        <ProfileHeader :user-data="userData" />
        <div class="profile-details">
          <div class="detail-section">
            <h3>Contact Information</h3>
            <div class="detail-item">
              <span class="icon"><i class="fas fa-envelope"></i></span>
              <span class="label">Email</span>
              <span class="value">{{ userData.email }}</span>
            </div>
            <div class="detail-item">
              <span class="icon"><i class="fas fa-user-shield"></i></span>
              <span class="label">Role</span>
              <span class="value">{{ userData.roleuser }}</span>
            </div>
          </div>
          <div class="detail-section">
            <h3>Account Settings</h3>
            <div class="detail-item">
              <span class="icon"><i class="fas fa-sign-in-alt"></i></span>
              <span class="label">Last Login</span>
              <span class="value">{{ lastLogin }}</span>
            </div>
            <div class="detail-item">
              <span class="icon"><i class="fas fa-calendar-plus"></i></span>
              <span class="label">Account Created</span>
              <span class="value">{{ accountCreated }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import ProfileHeader from "../components/ProfileComponents/ProfileHeader.vue";
import api from '../services/api';

const lastLogin = ref('Loading...');
const accountCreated = ref('Loading...');

const userData = reactive({
  prenom: "",
  nom: "",
  email: "",
  roleuser: "",
});

const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const fetchUserData = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      userData.prenom = currentUser.prenom;
      userData.nom = currentUser.nom;
      userData.email = currentUser.email;
      userData.roleuser = currentUser.roleuser;
      
      lastLogin.value = formatDate(currentUser.last_login || currentUser.lastLogin);
      accountCreated.value = formatDate(currentUser.created_at || currentUser.createdAt);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    lastLogin.value = 'Error loading date';
    accountCreated.value = 'Error loading date';
  }
};

onMounted(() => {
  fetchUserData();
});
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap");
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.profile-bg {
  min-height: 100vh;
  background: linear-gradient(120deg, #eaf4fd 0%, #f8f9fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Poppins', sans-serif;
}

.profile-center {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.profile-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(74, 144, 226, 0.10);
  overflow: hidden;
  width: 100%;
  margin: 32px 0;
  transition: box-shadow 0.2s;
  position: relative;
}

.profile-card:hover {
  box-shadow: 0 12px 40px rgba(74, 144, 226, 0.16);
}

.profile-details {
  padding: 32px 28px 28px 28px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  background: #f8f9fa;
}

.detail-section {
  background: #fff;
  padding: 22px 20px 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.04);
  margin-bottom: 0;

  h3 {
    margin: 0 0 18px 0;
    color: #357abd;
    font-size: 1.15rem;
    font-weight: 600;
    border-bottom: 1.5px solid #eaf4fd;
    padding-bottom: 7px;
    letter-spacing: 0.2px;
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;
  font-size: 1rem;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  .icon {
    color: #4a90e2;
    font-size: 1.1em;
    width: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .label {
    color: #6c757d;
    font-weight: 500;
    min-width: 90px;
  }
  .value {
    color: #2c3e50;
    font-weight: 400;
    margin-left: auto;
    text-align: right;
  }
}

@media (max-width: 768px) {
  .profile-center {
    min-height: unset;
    padding: 16px 0;
  }
  .profile-card {
    margin: 16px 0;
  }
  .profile-details {
    padding: 18px 8px 12px 8px;
  }
  .detail-section {
    padding: 14px 8px 10px 8px;
  }
}
</style>