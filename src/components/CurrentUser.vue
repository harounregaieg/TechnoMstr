<template>
  <div class="current-user" v-if="currentUser">
    <div class="user-info">
      <span class="user-label">Connected as:</span>
      <span class="user-name">{{ currentUser.prenom }} {{ currentUser.nom }}</span>
      <span class="user-email">({{ currentUser.email }})</span>
      <span class="user-role">Role: {{ currentUser.roleuser }}</span>
    </div>
  </div>
</template>

<script>
import { userApi } from '../services/userApi';

export default {
  name: 'CurrentUser',
  data() {
    return {
      currentUser: null
    }
  },
  async created() {
    try {
      this.currentUser = await userApi.getCurrentUser();
    } catch (e) {
      console.error('Error fetching current user:', e);
    }
  }
}
</script>

<style scoped>
.current-user {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin: 10px;
}

.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}

.user-label {
  font-weight: bold;
}

.user-name {
  font-weight: 500;
}

.user-email {
  color: #666;
}

.user-role {
  background-color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
</style> 