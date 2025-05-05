<template>
  <div class="dashboard-card">
    <h2>Distribution par Marque</h2>
    <div class="status-chart">
      <div class="chart-legend">
        <div class="legend-item">
          <span class="dot zebra"></span>
          <span>Zebra ({{ brandStats.zebra || 0 }})</span>
        </div>
        <div class="legend-item">
          <span class="dot sato"></span>
          <span>Sato ({{ brandStats.sato || 0 }})</span>
        </div>
        <div class="legend-item">
          <span class="dot other"></span>
          <span>Autres ({{ brandStats.other || 0 }})</span>
        </div>
      </div>
      <div class="chart-visual">
        <div class="pie-chart brand-chart" :style="brandChartStyle"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';

const props = defineProps({
  brandStats: {
    type: Object,
    required: true,
    default: () => ({
      zebra: 0,
      sato: 0,
      other: 0
    })
  }
});

const isAnimating = ref(false);

// Compute dynamic CSS conic gradient for brand chart
const brandChartStyle = computed(() => {
  const total = Object.values(props.brandStats).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return {
      background: '#f5f5f5'
    };
  }
  
  // Calculate percentage ranges for conic gradient
  let percentAccumulator = 0;
  const segments = [];
  
  // Add each brand to the gradient if it has a value
  if (props.brandStats.zebra > 0) {
    const percentage = Math.round((props.brandStats.zebra / total) * 100);
    segments.push(`#000000 ${percentAccumulator}% ${percentAccumulator + percentage}%`);
    percentAccumulator += percentage;
  }
  
  if (props.brandStats.sato > 0) {
    const percentage = Math.round((props.brandStats.sato / total) * 100);
    segments.push(`#1976D2 ${percentAccumulator}% ${percentAccumulator + percentage}%`);
    percentAccumulator += percentage;
  }
  
  if (props.brandStats.other > 0) {
    const percentage = Math.round((props.brandStats.other / total) * 100);
    segments.push(`#607D8B ${percentAccumulator}% ${percentAccumulator + percentage}%`);
  }
  
  return {
    background: `conic-gradient(${segments.join(', ')})`,
    animation: isAnimating.value ? 'rotatePieChart 1s ease-out forwards' : 'none'
  };
});

// Trigger animation when data changes
watch(() => props.brandStats, () => {
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 1000);
}, { deep: true });

// Initial animation
onMounted(() => {
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 1000);
});
</script>

<style lang="scss" scoped>
.dashboard-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    color: #2c3e50;
  }
}

.status-chart {
  display: flex;
  gap: 2rem;
  align-items: center;

  .chart-legend {
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      opacity: 0;
      animation: fadeIn 0.5s ease-out forwards;

      @for $i from 1 through 3 {
        &:nth-child(#{$i}) {
          animation-delay: #{$i * 0.15}s;
        }
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;

        &.zebra { background: #000000; }
        &.sato { background: #1976D2; }
        &.other { background: #607D8B; }
      }
    }
  }

  .pie-chart {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
    
    &.brand-chart {
      background: #f5f5f5;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      transform-origin: center;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotatePieChart {
  0% {
    transform: rotate(-90deg) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
}
</style> 