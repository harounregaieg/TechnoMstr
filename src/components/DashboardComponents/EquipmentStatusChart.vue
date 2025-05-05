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
          <g>
            <template v-for="(segment, idx) in animatedPieSegments" :key="idx">
              <path :d="segment.d" :fill="segment.color" />
            </template>
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
    required: true
  }
});

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep <= 180 ? '0' : '1';
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians)
  };
}

const cx = 75, cy = 75, r = 70;
const animationDuration = 900; // ms per segment
const animationStagger = 200; // ms delay between segments

const segmentDefs = computed(() => {
  const { okPercentage, warningPercentage, errorPercentage } = props.equipmentStatusStats;
  return [
    { value: errorPercentage, color: '#F44336' },
    { value: warningPercentage, color: '#FF9800' },
    { value: okPercentage, color: '#4CAF50' }
  ];
});

const animatedAngles = ref([0, 0, 0]);

const animatedPieSegments = computed(() => {
  const defs = segmentDefs.value;
  const total = defs.reduce((sum, seg) => sum + seg.value, 0);
  // If all are zero, show a gray placeholder
  if (total === 0) {
    return [{ d: describeArc(cx, cy, r, 0, 360), color: '#e0e0e0' }];
  }
  // If only one segment is nonzero, draw a full circle for it
  const nonzero = defs.filter(seg => seg.value > 0);
  if (nonzero.length === 1) {
    return [{ d: describeArc(cx, cy, r, 0, 360), color: nonzero[0].color }];
  }
  // Otherwise, draw each segment as animated
  let startAngle = 0;
  return defs.map((seg, i) => {
    if (seg.value === 0) return null;
    const sweep = animatedAngles.value[i];
    if (sweep === 0) return null;
    const endAngle = startAngle + sweep;
    const d = describeArc(cx, cy, r, startAngle, endAngle);
    const out = { d, color: seg.color };
    startAngle = endAngle;
    return out;
  }).filter(Boolean);
});

function animateSegments() {
  const targets = segmentDefs.value.map(seg => seg.value * 3.6); // 1% = 3.6deg
  animatedAngles.value = [0, 0, 0];
  // If only one segment is nonzero or all are zero, skip animation
  const nonzero = targets.filter(v => v > 0);
  if (nonzero.length <= 1) {
    animatedAngles.value = targets;
    return;
  }
  function animateSegment(idx, timestamp, segmentStart) {
    if (!segmentStart) segmentStart = timestamp;
    const elapsed = timestamp - segmentStart;
    const progress = Math.min(elapsed / animationDuration, 1);
    animatedAngles.value[idx] = targets[idx] * progress;
    if (progress < 1) {
      requestAnimationFrame(ts => animateSegment(idx, ts, segmentStart));
    } else {
      animatedAngles.value[idx] = targets[idx];
      // Start next segment after stagger
      if (idx + 1 < targets.length) {
        setTimeout(() => {
          requestAnimationFrame(ts => animateSegment(idx + 1, ts));
        }, animationStagger);
      }
    }
  }
  // Start first segment
  requestAnimationFrame(ts => animateSegment(0, ts));
}

onMounted(() => {
  animateSegments();
});

watch(() => ({...props.equipmentStatusStats}), () => {
  animateSegments();
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