<template>
    <div class="home-page">
      <div class="dashboard-header">
        <h1>Tableau de Bord</h1>
        
      </div>
  
      <!-- KPI Cards -->
      <KpiCards 
        :equipment-stats="equipmentStats" 
        :user-stats="userStats"
        :equipment-status-stats="equipmentStatusStats"
        :equipment-type-stats="equipmentTypeStats"
      />
  
      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Equipment Status Chart -->
        <EquipmentStatusChart :equipment-status-stats="equipmentStatusStats" />
  
        <!-- Brand Distribution Chart -->
        <BrandDistributionChart :brand-stats="brandStats" />
  
        <!-- Commands History Chart -->
        <CommandsHistoryChart />
  
        <!-- Ticket History Chart -->
        <TicketHistoryChart />
  
        <!-- Recent Activity Feed -->
        <ActivityFeed :activities="activities" />
  
        <!-- Notifications Panel -->
        <NotificationsPanel :notifications="notifications" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import KpiCards from '../components/DashboardComponents/KpiCards.vue';
  import EquipmentStatusChart from '../components/DashboardComponents/EquipmentStatusChart.vue';
  import BrandDistributionChart from '../components/DashboardComponents/BrandDistributionChart.vue';
  import CommandsHistoryChart from '../components/DashboardComponents/CommandsHistoryChart.vue';
  import TicketHistoryChart from '../components/DashboardComponents/TicketHistoryChart.vue';
  import ActivityFeed from '../components/DashboardComponents/ActivityFeed.vue';
  import NotificationsPanel from '../components/DashboardComponents/NotificationsPanel.vue';
  import { 
    fetchEquipmentStats, 
    fetchUserStats, 
    fetchEquipmentStatusStats,
    fetchBrandStats,
    fetchRecentActivity,
    fetchEquipmentTypeStats 
  } from '../services/dashboardService';

  // State
  const equipmentStats = ref({
    total: 0,
    active: 0,
    inactive: 0,
    activePercentage: 0,
    inactivePercentage: 0
  });

  const equipmentTypeStats = ref({
    printers: 0,
    pdas: 0,
    total: 0
  });

  const userStats = ref({
    total: 0,
    admin: 0,
    tech: 0,
    user: 0
  });

  const equipmentStatusStats = ref({
    ok: 0,
    warning: 0,
    error: 0,
    okPercentage: 0,
    warningPercentage: 0,
    errorPercentage: 0
  });

  const brandStats = ref({
    zebra: 0,
    sato: 0,
    other: 0
  });

  const activities = ref([]);
  const notifications = ref([]);
  const currentUser = ref(null);
  const refreshInterval = ref(null);

  // Load data
  const loadDashboardData = async () => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUser.value = JSON.parse(userStr);
      }
      
      // Fetch all data in parallel for better performance
      const [
        equipmentStatsData,
        equipmentTypeStatsData,
        userStatsData,
        equipmentStatusStatsData,
        brandStatsData,
        activitiesData
      ] = await Promise.all([
        fetchEquipmentStats(),
        fetchEquipmentTypeStats(),
        fetchUserStats(currentUser.value?.departement || ''),
        fetchEquipmentStatusStats(),
        fetchBrandStats(),
        fetchRecentActivity(3)
      ]);
      
      equipmentStats.value = equipmentStatsData;
      equipmentTypeStats.value = equipmentTypeStatsData;
      userStats.value = userStatsData;
      equipmentStatusStats.value = equipmentStatusStatsData;
      brandStats.value = brandStatsData;
      activities.value = activitiesData;
      
      // Generate notifications based on equipment status
      generateNotifications();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Generate notifications based on equipment status
  const generateNotifications = () => {
    const newNotifications = [];
    
    // Add notification for equipment in error state
    if (equipmentStatusStats.value.error > 0) {
      newNotifications.push({
        type: 'error',
        message: `${equipmentStatusStats.value.error} équipement${equipmentStatusStats.value.error === 1 ? ' est' : 's sont'} en état d'ERREUR`
      });
    }
    
    // Add notification for equipment in warning state
    if (equipmentStatusStats.value.warning > 0) {
      newNotifications.push({
        type: 'warning',
        message: `${equipmentStatusStats.value.warning} équipement${equipmentStatusStats.value.warning === 1 ? ' est' : 's sont'} en état d'AVERTISSEMENT`
      });
    }
    
    // Always add an informational notification
    newNotifications.push({
      type: 'info',
      message: `${equipmentStatusStats.value.ok} équipement${equipmentStatusStats.value.ok === 1 ? ' fonctionne' : 's fonctionnent'} correctement`
    });
    
    notifications.value = newNotifications;
  };

  onMounted(() => {
    loadDashboardData();
    
    // Set up automatic refresh every 30 seconds
    refreshInterval.value = setInterval(() => {
      loadDashboardData();
    }, 30000);
  });

  onUnmounted(() => {
    // Clear interval on component unmount
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
  });
  </script>
  
  <style lang="scss" scoped>
  .home-page {
    width: 102%;
    padding: 1.5rem;
    padding-left: calc(2rem + 48px);
    box-sizing: border-box;
    transition: padding-left 0.2s ease-out;
  
    &.sidebar-expanded {
      padding-left: calc(var(--sidebar-width) + 1rem);
    }
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  
    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #2c3e50;
    }
  
    .date-filter {
      background: #f5f7fa;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      color: #666;
    }
  }
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    
    /* Ensure all cards have the same height */
    & > * {
      height: 350px;
      overflow: hidden;
    }
  }
  </style>