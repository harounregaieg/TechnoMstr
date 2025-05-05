<template>
  <div class="dashboard-card">
    <h2>Historique des Tickets</h2>
    <div class="chart-container">
      <!-- Loading and Error States -->
      <div v-if="isLoading" class="loading-state">
        <span class="loading-spinner"></span>
        <span>Chargement des données...</span>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>
      
      <div v-else class="chart-content">
        <!-- Chart Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="dot tickets"></span>
            <span>Tickets créés</span>
          </div>
        </div>
        
        <!-- Bar Chart -->
        <div class="bar-chart">
          <div class="y-axis">
            <div class="tick" v-for="tick in yAxisTicks" :key="tick">{{ tick }}</div>
          </div>
          
          <div class="chart-bars">
            <div 
              v-for="(day, index) in ticketData" 
              :key="day.name" 
              class="bar-column"
            >
              <div 
                class="bar" 
                :style="{ 
                  height: `${calculateBarHeight(day.count)}%`,
                  animationDelay: `${index * 0.1}s`
                }"
              >
                <span class="bar-value">{{ day.count }}</span>
              </div>
              <div class="x-label">{{ day.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchTicketHistory } from '../../services/dashboardService';

// State
const ticketData = ref([
  { name: 'Lun', count: 0 },
  { name: 'Mar', count: 0 },
  { name: 'Mer', count: 0 },
  { name: 'Jeu', count: 0 },
  { name: 'Ven', count: 0 }
]);

const isLoading = ref(true);
const error = ref(null);
const maxValue = ref(10); // Default max value for Y-axis
const daysToFetch = ref(7); // Default to fetch last 7 days

// Fetch ticket data from the API
const fetchTicketsData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching ticket history data...');
    // Use the service function
    const data = await fetchTicketHistory(daysToFetch.value);
    
    if (data && Array.isArray(data)) {
      console.log('Received ticket history data:', data);
      
      // Update ticket data
      ticketData.value = data;
      
      // Calculate max for Y-axis based on data
      const counts = ticketData.value.map(day => day.count);
      const dataMax = Math.max(...counts);
      
      // If all counts are 0, just keep default max
      if (dataMax > 0) {
        maxValue.value = Math.ceil(dataMax * 1.2); // Add 20% padding
      }
    } else {
      console.warn("Unexpected data format:", data);
    }
  } catch (err) {
    console.error("Error fetching ticket data:", err);
    error.value = "Erreur de connexion";
  } finally {
    isLoading.value = false;
  }
};

// Calculate bar height as percentage of max value
const calculateBarHeight = (value) => {
  if (maxValue.value === 0) return 0;
  return (value / maxValue.value) * 100;
};

// Generate Y-axis ticks
const yAxisTicks = computed(() => {
  const ticks = [];
  const tickCount = 5;
  
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(Math.round((maxValue.value / tickCount) * i));
  }
  
  return ticks.reverse(); // Reverse for top-to-bottom display
});

// Watch for changes in the data source
watch(daysToFetch, () => {
  fetchTicketsData();
});

onMounted(() => {
  fetchTicketsData();
});
</script>

<style lang="scss" scoped>
.dashboard-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  animation: fadeIn 0.5s ease-out forwards;
  height: 350px; /* Fixed height for the card */
  display: flex;
  flex-direction: column;

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    color: #2c3e50;
    flex-shrink: 0; /* Prevent header from shrinking */
  }
}

.chart-container {
  position: relative;
  padding-bottom: 1rem;
  flex-grow: 1; /* Take remaining space */
  display: flex;
  flex-direction: column;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: #666;
  gap: 1rem;
  
  .loading-spinner {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #e74c3c;
    animation: spin 1s ease-in-out infinite;
  }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: #e74c3c;
  gap: 0.5rem;
  
  .error-icon {
    font-size: 2rem;
  }
}

/* Chart content wrapper */
.chart-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.chart-legend {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;
    
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      
      &.tickets {
        background: #e74c3c;
      }
    }
  }
}

.bar-chart {
  display: flex;
  flex-grow: 1;
  position: relative;
  padding-bottom: 2rem;
  padding-left: 2rem;
  
  .y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 2rem;
    
    .tick {
      color: #888;
      font-size: 0.8rem;
      text-align: right;
      transform: translateY(-50%);
    }
  }
  
  .chart-bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex: 1;
    padding: 0 1rem;
    height: 100%;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: #ddd;
    }
    
    .bar-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      flex: 1;
      height: 100%;
      position: relative;
      
      .bar {
        width: 24px;
        background: #e74c3c;
        border-radius: 4px 4px 0 0;
        position: relative;
        animation: barGrow 1s ease-out forwards;
        transform-origin: bottom;
        
        .bar-value {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(231, 76, 60, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        &:hover {
          background: #c0392b;
          
          .bar-value {
            opacity: 1;
          }
        }
      }
      
      .x-label {
        margin-top: 0.5rem;
        color: #555;
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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

@keyframes barGrow {
  0% {
    transform: scaleY(0);
  }
  60% {
    transform: scaleY(1.1);
  }
  100% {
    transform: scaleY(1);
  }
}
</style> 