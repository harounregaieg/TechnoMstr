<template>
    <span :class="['status-badge', `status-badge-${status.toLowerCase()}`]">
      {{ status }}
    </span>
  </template>
  
  <script setup>
  defineProps({
    status: {
      type: String,
      required: true,
      validator: (value) =>
        ["Ouvert", "Solved"].includes(value),
    },
  });
  </script>
  
  <style scoped>
  .status-badge {
    padding: 12px 1px;
    border-radius: 16px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #667085;
  }
  </style>
  