<template>
    <article
      :class="[
        'notification-item',
        `notification-${notification.type}`,
        { 'notification-read': notification.read },
      ]"
      role="alert"
    >
      <div class="notification-icon" :aria-label="notification.type">
        {{ getIcon(notification.type) }}
      </div>
      <div class="notification-content">
        <p class="notification-message">{{ notification.message }}</p>
        <time class="notification-time">{{ notification.time }}</time>
      </div>
      <button
        v-if="!notification.read"
        class="notification-action"
        @click="$emit('markAsRead', notification.id)"
        :aria-label="'Mark notification as read'"
      >
        Mark as read
      </button>
    </article>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from "vue";
  
  defineProps({
    notification: {
      type: Object,
      required: true,
    },
  });
  
  defineEmits(["markAsRead"]);
  
  const getIcon = (type) => {
    const icons = {
      success: "✓",
      warning: "⚠",
      info: "ℹ",
      error: "✕",
    };
    return icons[type];
  };
  </script>
  
  <style scoped>
  .notification-item {
    display: flex;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .notification-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 14px;
  }
  
  .notification-success .notification-icon {
    background: rgba(0, 255, 0, 0.1);
    color: #2da44e;
  }
  
  .notification-warning .notification-icon {
    background: rgba(255, 166, 0, 0.1);
    color: #bf8700;
  }
  
  .notification-info .notification-icon {
    background: rgba(0, 120, 255, 0.1);
    color: #0969da;
  }
  
  .notification-error .notification-icon {
    background: rgba(255, 0, 0, 0.1);
    color: #cf222e;
  }
  
  .notification-content {
    flex: 1;
  }
  
  .notification-message {
    margin: 0;
    color: rgba(0, 0, 0, 0.8);
    font-size: 14px;
  }
  
  .notification-time {
    display: block;
    margin-top: 4px;
    color: rgba(0, 0, 0, 0.4);
    font-size: 12px;
  }
  
  .notification-action {
    padding: 6px 12px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.6);
    font-size: 12px;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .notification-action:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .notification-read {
    opacity: 0.7;
  }
  </style>
  