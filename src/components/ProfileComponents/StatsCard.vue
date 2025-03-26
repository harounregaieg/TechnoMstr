<template>
    <article class="stats-card">
      <span class="stats-value">{{ value }}</span>
      <span class="stats-label">{{ label }}</span>
    </article>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    value: number;
    label: string;
  }>();
  </script>
  
  <style scoped>
  .stats-card {
    background: white;
    border-radius: 10px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stats-value {
    font-size: 32px;
    font-weight: 400;
    color: #454545;
  }
  
  .stats-label {
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
  }
  </style>
  