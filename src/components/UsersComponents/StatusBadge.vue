<template>
  <div class="status-badge" :class="badgeClass">
    <span class="status-badge__dot"></span>
    <span class="status-badge__label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ["active", "inactive", "pending"].includes(value),
  },
});

const badgeClass = computed(() => `status-badge--${props.status}`);
const label = computed(() => {
  switch (props.status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "pending":
      return "En Service";
    default:
      return "";
  }
});
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.18rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 500;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  min-width: 80px;
  justify-content: center;
}

.status-badge__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
}

.status-badge--active {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border-color: #10b98122;
}
.status-badge--active .status-badge__dot {
  background: #10b981;
}

.status-badge--inactive {
  background: rgba(107, 114, 128, 0.10);
  color: #6b7280;
  border-color: #6b728022;
}
.status-badge--inactive .status-badge__dot {
  background: #6b7280;
}

.status-badge--pending {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border-color: #f59e0b22;
}
.status-badge--pending .status-badge__dot {
  background: #f59e0b;
}
</style>