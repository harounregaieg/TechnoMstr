<template>
  <div class="dashboard-card">
    <h2>Activités Récentes</h2>
    <div class="activity-feed">
      <div v-if="activities.length === 0" class="no-activities">
        <i class="fas fa-history"></i>
        <p>Aucune activité récente</p>
      </div>
      <div v-for="(activity, index) in activities" :key="index" class="activity-item">
        <div class="activity-icon">
          <i :class="getIconClass(activity.type)"></i>
        </div>
        <div class="activity-content">
          <p>{{ activity.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  }
});

const getIconClass = (type) => {
  switch (type) {
    case 'maintenance': return 'fas fa-wrench';
    case 'alert': return 'fas fa-exclamation-circle';
    case 'success': return 'fas fa-check-circle';
    case 'update': return 'fas fa-sync';
    case 'created': return 'fas fa-plus-circle';
    case 'resolved': return 'fas fa-check-circle';
    case 'added': return 'fas fa-plus';
    case 'deleted': return 'fas fa-trash';
    default: return 'fas fa-history';
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
  animation-delay: 0.2s;
  opacity: 0;
  height: 350px;
  display: flex;
  flex-direction: column;

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    color: #2c3e50;
    flex-shrink: 0;
  }
}

.activity-feed {
  flex-grow: 1;
  overflow-y: auto;
  
  .activity-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
    animation: slideInLeft 0.5s ease-out forwards;
    opacity: 0;
    transform: translateX(-20px);
    
    @for $i from 1 through 5 {
      &:nth-child(#{$i}) {
        animation-delay: #{0.3 + ($i * 0.15)}s;
      }
    }

    &:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      transition: all 0.3s ease;
      
      i {
        transition: transform 0.3s ease;
      }
    }

    .activity-content {
      flex: 1;

      p {
        margin: 0;
        color: #2c3e50;
      }
    }
    
    &:hover {
      .activity-icon {
        background: #e3f2fd;
        color: #1976d2;
        
        i {
          transform: scale(1.2);
        }
      }
      
      .activity-content p {
        color: #1976d2;
      }
    }
  }
  
  .no-activities {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9e9e9e;
    padding: 2rem 0;
    animation: fadeIn 1s ease-out forwards;
    animation-delay: 0.4s;
    opacity: 0;
    
    i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      animation: rotate 4s linear infinite;
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 