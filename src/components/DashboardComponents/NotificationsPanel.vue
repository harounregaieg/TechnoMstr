<template>
  <div class="dashboard-card">
    <h2>Notifications</h2>
    <div class="notifications-list">
      <div v-if="notifications.length === 0" class="no-notifications">
        <i class="fas fa-bell-slash"></i>
        <p>Aucune notification</p>
      </div>
      <div 
        v-for="(notification, index) in notifications" 
        :key="index" 
        class="notification-item" 
        :class="notification.type"
      >
        <i :class="getIconClass(notification.type)"></i>
        <p>{{ notification.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  notifications: {
    type: Array,
    default: () => [
      { type: 'warning', message: 'Imprimante #123 est hors ligne depuis plus de 24 heures' },
      { type: 'error', message: 'Ticket #456 est en retard de résolution' },
      { type: 'info', message: '3 imprimantes nécessitent une maintenance programmée' }
    ]
  }
});

const getIconClass = (type) => {
  switch (type) {
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'error': return 'fas fa-times-circle';
    case 'info': return 'fas fa-info-circle';
    case 'success': return 'fas fa-check-circle';
    default: return 'fas fa-bell';
  }
};
</script>

<style lang="scss" scoped>
.dashboard-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  animation: fadeIn 0.8s ease-out forwards;

  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    color: #2c3e50;
  }
}

.notifications-list {
  .notification-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 0.5rem;
    animation: slideInRight 0.5s ease-out forwards;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
    
    @for $i from 1 through 5 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.1}s;
      }
    }
    
    &:hover {
      transform: translateX(5px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    &.warning {
      background: #FFF3E0;
      color: #FF9800;
    }

    &.error {
      background: #FFEBEE;
      color: #F44336;
    }

    &.info {
      background: #E3F2FD;
      color: #2196F3;
    }

    &.success {
      background: #E8F5E9;
      color: #4CAF50;
    }

    i {
      font-size: 1.2rem;
      animation: pulseIcon 1.5s infinite alternate;
    }

    p {
      margin: 0;
      flex: 1;
    }
  }

  .no-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9e9e9e;
    padding: 2rem 0;
    animation: fadeIn 0.8s ease-out forwards;
    
    i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      animation: pulse 2s infinite alternate;
    }
    
    p {
      margin: 0;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseIcon {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
}

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style> 