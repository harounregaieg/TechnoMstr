<template>
  <div class="dashboard-card">
    <h2>État des Équipements</h2>
    <div class="status-chart">
      <div class="chart-legend">
        <div class="legend-item">
          <span class="dot ok"></span>
          <span>OK ({{ equipmentStatusStats.ok }})</span>
        </div>
        <div class="legend-item">
          <span class="dot warning"></span>
          <span>Avertissement ({{ equipmentStatusStats.warning }})</span>
        </div>
        <div class="legend-item">
          <span class="dot error"></span>
          <span>Erreur ({{ equipmentStatusStats.error }})</span>
        </div>
      </div>
      <div class="chart-visual">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <!-- Show placeholder circle if no equipment or all counts are zero -->
          <circle
            v-if="totalEquipment === 0"
            cx="75"
            cy="75"
            r="70"
            fill="#e0e0e0"
          />
          
          <!-- Single status case - show one full circle -->
          <circle
            v-else-if="singleStatusType"
            cx="75"
            cy="75"
            r="70"
            :fill="singleStatusColor"
          />
          
          <!-- Multiple status case - show pie segments -->
          <g v-else>
            <path
              v-if="errorSegment.visible"
              :d="errorSegment.path"
              fill="#F44336"
            />
            <path
              v-if="warningSegment.visible"
              :d="warningSegment.path"
              fill="#FF9800"
            />
            <path
              v-if="okSegment.visible"
              :d="okSegment.path"
              fill="#4CAF50"
            />
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, onMounted, watch } from 'vue';

const props = defineProps({
  equipmentStatusStats: {
    type: Object,
    required: true,
    default: () => ({
      ok: 0,
      warning: 0,
      error: 0,
      okPercentage: 0,
      warningPercentage: 0,
      errorPercentage: 0
    })
  }
});

// SVG circle center and radius
const cx = 75;
const cy = 75;
const radius = 70;

// Calculate total equipment
const totalEquipment = computed(() => {
  return props.equipmentStatusStats.ok + props.equipmentStatusStats.warning + props.equipmentStatusStats.error;
});

// Determine if we have only a single status type
const singleStatusType = computed(() => {
  const { ok, warning, error } = props.equipmentStatusStats;
  const nonZeroCount = [ok, warning, error].filter(count => count > 0).length;
  return nonZeroCount === 1;
});

// Determine the color for single status case
const singleStatusColor = computed(() => {
  const { ok, warning, error } = props.equipmentStatusStats;
  if (error > 0) return '#F44336'; // Red
  if (warning > 0) return '#FF9800'; // Orange
  if (ok > 0) return '#4CAF50'; // Green
  return '#e0e0e0'; // Gray (fallback)
});

// Helper function to convert polar to cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

// Helper function to create SVG arc path
function describeArc(centerX, centerY, radius, startAngle, endAngle) {
  // If the segment is very small, just return null
  if (Math.abs(endAngle - startAngle) < 0.1) return null;
  
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', centerX, centerY,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

// Calculate segment paths
const errorSegment = computed(() => {
  const { errorPercentage } = props.equipmentStatusStats;
  const visible = errorPercentage > 0;
  const startAngle = 0;
  const endAngle = (errorPercentage / 100) * 360;
  const path = describeArc(cx, cy, radius, startAngle, endAngle);
  
  return { visible, path };
});

const warningSegment = computed(() => {
  const { errorPercentage, warningPercentage } = props.equipmentStatusStats;
  const visible = warningPercentage > 0;
  const startAngle = (errorPercentage / 100) * 360;
  const endAngle = startAngle + (warningPercentage / 100) * 360;
  const path = describeArc(cx, cy, radius, startAngle, endAngle);
  
  return { visible, path };
});

const okSegment = computed(() => {
  const { errorPercentage, warningPercentage, okPercentage } = props.equipmentStatusStats;
  const visible = okPercentage > 0;
  const startAngle = ((errorPercentage + warningPercentage) / 100) * 360;
  const endAngle = startAngle + (okPercentage / 100) * 360;
  const path = describeArc(cx, cy, radius, startAngle, endAngle);
  
  return { visible, path };
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
      
      &:nth-child(1) {
        animation-delay: 0.3s;
      }
      
      &:nth-child(2) {
        animation-delay: 0.5s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.7s;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;

        &.ok { background: #4CAF50; }
        &.warning { background: #FF9800; }
        &.error { background: #F44336; }
      }
    }
  }

  .chart-visual {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 