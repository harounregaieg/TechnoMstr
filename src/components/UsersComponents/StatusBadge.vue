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
  gap: .5rem;
  padding: .25rem 1.75rem;
  border-radius: 9999px;
  font-size: .75rem;
  font-weight: 500;

  &__dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }

  &--active {
    background: rgba(#10b981, 0.1);
    color: #10b981;

    .status-badge__dot {
      background: #10b981;
    }
  }

  &--inactive {
    background: rgba(#6b7280, 0.1);
    color: #6b7280;

    .status-badge__dot {
      background: #6b7280;
    }
  }

  &--pending {
    background: rgba(#f59e0b, 0.1);
    color: #f59e0b;

    .status-badge__dot {
      background: #f59e0b;
    }
  }
}
</style>