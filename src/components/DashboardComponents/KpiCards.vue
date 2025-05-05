<template>
  <div class="kpi-grid">
    <!-- Equipment KPI Card -->
    <div class="kpi-card">
      <div class="kpi-icon printer">
        <i class="fas fa-print"></i>
      </div>
      <div class="kpi-content">
        <h3>Équipements Total</h3>
        <div class="kpi-value">{{ equipmentTypeStats.total || equipmentStats.total || 0 }}</div>
        <div class="kpi-stats">
          <span class="printer">{{ equipmentTypeStats.printers || 0 }} Imprimantes</span>
          <span class="pda">{{ equipmentTypeStats.pdas || 0 }} PDAs</span>
        </div>
      </div>
    </div>

    <!-- Users KPI Card -->
    <div class="kpi-card">
      <div class="kpi-icon users">
        <i class="fas fa-users"></i>
      </div>
      <div class="kpi-content">
        <h3>Utilisateurs</h3>
        <div class="kpi-value">{{ userStats.total || 0 }}</div>
        <div class="kpi-stats">
          <span class="admin">{{ userStats.admin || 0 }} Administrateurs</span>
          <span class="tech">{{ userStats.tech || 0 }} Techniciens</span>
          <span class="user">{{ userStats.user || 0 }} Utilisateurs</span>
        </div>
      </div>
    </div>

    <!-- Issues KPI Card -->
    <div class="kpi-card">
      <div class="kpi-icon alert">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="kpi-content">
        <h3>Problèmes d'Équipement</h3>
        <div class="kpi-value">{{ equipmentStatusStats.warning + equipmentStatusStats.error }}</div>
        <div class="kpi-stats">
          <span class="error">{{ equipmentStatusStats.error }} Erreurs</span>
          <span class="offline">{{ equipmentStatusStats.warning }} Avertissements</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  equipmentStats: {
    type: Object,
    required: true
  },
  equipmentTypeStats: {
    type: Object,
    default: () => ({
      printers: 0,
      pdas: 0,
      total: 0
    })
  },
  userStats: {
    type: Object,
    required: true
  },
  equipmentStatusStats: {
    type: Object,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  
  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  
  &:nth-child(2) {
    animation-delay: 0.25s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.4s;
  }

  .kpi-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    animation: pulseIcon 1.5s infinite alternate;
    animation-delay: 0.6s;

    &.printer { 
      background: #4CAF50; 
    }
    &.users { 
      background: #2196F3; 
    }
    &.alert { 
      background: #f81616; 
    }
  }

  .kpi-content {
    flex: 1;

    h3 {
      margin: 0;
      font-size: 1rem;
      color: #666;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      margin: 0.5rem 0;
      animation: countUp 1.5s ease-out forwards;
      animation-delay: 0.8s;
    }

    .kpi-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      opacity: 0;
      animation: fadeIn 0.5s forwards;
      animation-delay: 1s;

      span {
        transition: color 0.3s;
        
        &.active { color: #4CAF50; }
        &.inactive { color: #F44336; }
        &.admin { color: #2196F3; }
        &.tech { color: #4b7921; }
        &.error { color: #F44336; }
        &.offline { color: #666; }
        &.user { color: #666; }
        &.printer { color: #4CAF50; }
        &.pda { color: #4474a8; }
      }
    }
  }
  
  // Hover effect
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-3px);
    transition: all 0.3s ease;
    
    .kpi-icon {
      animation-play-state: paused;
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseIcon {
  from {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(0,0,0,0.1);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  }
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
</style> 