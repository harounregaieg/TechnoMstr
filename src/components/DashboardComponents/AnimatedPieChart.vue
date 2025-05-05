<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" style="border:2px solid red; background:#fff;">
    <circle :cx="size/2" :cy="size/2" :r="size/2 - 10" fill="#eee" />
    <g>
      <template v-for="(segment, idx) in animatedPieSegments" :key="idx">
        <path :d="segment.d" :fill="segment.color" />
      </template>
    </g>
  </svg>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true // [{ value: number, color: string }]
  },
  size: {
    type: Number,
    default: 150
  },
  animationDuration: {
    type: Number,
    default: 900
  },
  animationStagger: {
    type: Number,
    default: 200
  }
});

const cx = computed(() => props.size / 2);
const cy = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - 5);
const animatedAngles = ref([]);

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

const animatedPieSegments = computed(() => {
  const total = props.data.reduce((sum, seg) => sum + seg.value, 0);
  if (total === 0) {
    return [{ d: describeArc(cx.value, cy.value, r.value, 0, 360), color: '#e0e0e0' }];
  }
  const nonzero = props.data.filter(seg => seg.value > 0);
  if (nonzero.length === 1) {
    return [{ d: describeArc(cx.value, cy.value, r.value, 0, 360), color: nonzero[0].color }];
  }
  let startAngle = 0;
  return props.data.map((seg, i) => {
    if (seg.value === 0) return null;
    const sweep = animatedAngles.value[i] || 0;
    if (sweep === 0) return null;
    const endAngle = startAngle + sweep;
    const d = describeArc(cx.value, cy.value, r.value, startAngle, endAngle);
    const out = { d, color: seg.color };
    startAngle = endAngle;
    return out;
  }).filter(Boolean);
});

function animateSegments() {
  const targets = props.data.map(seg => seg.value * 3.6);
  animatedAngles.value = Array(props.data.length).fill(0);
  const nonzero = targets.filter(v => v > 0);
  if (nonzero.length <= 1) {
    animatedAngles.value = targets;
    return;
  }
  function animateSegment(idx, timestamp, segmentStart) {
    if (!segmentStart) segmentStart = timestamp;
    const elapsed = timestamp - segmentStart;
    const progress = Math.min(elapsed / props.animationDuration, 1);
    animatedAngles.value[idx] = targets[idx] * progress;
    if (progress < 1) {
      requestAnimationFrame(ts => animateSegment(idx, ts, segmentStart));
    } else {
      animatedAngles.value[idx] = targets[idx];
      if (idx + 1 < targets.length) {
        setTimeout(() => {
          requestAnimationFrame(ts => animateSegment(idx + 1, ts));
        }, props.animationStagger);
      }
    }
  }
  requestAnimationFrame(ts => animateSegment(0, ts));
}

onMounted(() => {
  animateSegments();
});

watch(
  () => props.data.map(seg => seg.value),
  () => {
    animateSegments();
  },
  { deep: true }
);
</script> 