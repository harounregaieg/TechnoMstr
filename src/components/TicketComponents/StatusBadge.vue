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
        ["Ouvert", "Resolu", "Solved"].includes(value),
    },
  });
  </script>
  
  <style scoped>
  .status-badge {
    display: inline-block;
    padding: 6px 18px;
    border-radius: 999px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.10);
    letter-spacing: 0.2px;
    text-align: center;
    min-width: 80px;
    transition: background 0.2s;
  }
  .status-badge-ouvert {
    background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%);
  }
  .status-badge-resolu,
  .status-badge-solved {
    background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  }
  </style>
  