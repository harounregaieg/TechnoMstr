<template>
  <div class="profile-header">
    <div class="avatar-wrapper">
      <div class="avatar-gradient">
        <div class="avatar">
          <span class="initials">{{ userInitials }}</span>
        </div>
      </div>
    </div>
    <div class="info-content">
      <h1>{{ userData.prenom }} {{ userData.nom }}</h1>
      <p class="role">{{ userData.roleuser }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  userData: {
    type: Object,
    required: true
  }
});

const userInitials = computed(() => {
  return `${props.userData.prenom.charAt(0)}${props.userData.nom.charAt(0)}`.toUpperCase();
});
</script>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 40px 32px 24px 32px;
  background: transparent;
  justify-content: center;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-gradient {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  padding: 4px;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: #357abd;
  box-shadow: 0 2px 8px rgba(53, 122, 189, 0.08);
}

.info-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.info-content h1 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.role {
  margin-top: 8px;
  font-size: 1.1rem;
  color: #4a90e2;
  font-weight: 500;
  letter-spacing: 0.2px;
  background: #eaf4fd;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 32px 8px 16px 8px;
  }
  .info-content {
    align-items: center;
  }
}
</style>
  