<template>
  <main class="app">
    <Sidebar v-if="!isLoginPage" />
    <div :class="{ 'content': !isLoginPage, 'full-content': isLoginPage }">
      <router-view />
    </div>
    <NotificationPoller v-if="!isLoginPage && hasPermission" />
  </main>
</template>



<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import Sidebar from './components/Sidebar.vue';
  import NotificationPoller from './components/NotificationPoller.vue';

  const route = useRoute()
  const isLoginPage = computed(() => route.name === 'Login')
  const currentUser = ref(null)
  const hasPermission = computed(() => {
    if (!currentUser.value) return false
    
    const role = currentUser.value.roleuser
    // Check if user has permission to see notifications
    return ['superadmin', 'admin', 'technicien'].includes(role)
  })
  
  onMounted(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        currentUser.value = JSON.parse(userStr)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  })
</script>


<style lang="scss">
:root{
  --primary: #d36c0b;
  --grey: #64748b;
  --dark: #1e293b;
  --dark-alt: #334155;
  --light: #f1f5f9;
  --sidebar-width: 300px;
  --sidebar-width-collapsed: calc(2rem + 32px);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Fira sans', sans-serif;
}

body {
  background: var(--light);
}

button {
  cursor: pointer;
  appearance: none;
  border: none;
  outline: none;
  background: none;
}

.app {
  position: relative;

  .content {
    min-height: 100vh;
    width: 100%;
    padding: 2rem;
  }

  .full-content {
    min-height: 100vh;
    width: 100%;
    padding: 0;
  }
}
</style>
