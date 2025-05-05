<template>
    <article
      :class="[
        'notification-item',
        `notification-${notification.type}`,
        { 'notification-read': notification.is_read },
      ]"
      role="alert"
    >
      <div class="notification-icon" :aria-label="notification.type">
        {{ getIcon(notification.type) }}
      </div>
      <div class="notification-content">
        <p class="notification-message">{{ notification.message }}</p>
        <div class="notification-metadata">
          <span class="notification-category">{{ getCategoryLabel(notification.category) }}</span>
          <time class="notification-time">{{ notification.time }}</time>
        </div>
      </div>
      <div class="notification-actions">
        <button
          v-if="!notification.is_read"
          class="notification-action read-action"
          @click="$emit('mark-as-read', notification.id)"
          :aria-label="'Mark notification as read'"
        >
          Marquer comme lu
        </button>
        <button
          class="notification-action delete-action"
          @click="$emit('delete', notification.id)"
          :aria-label="'Delete notification'"
        >
          Supprimer
        </button>
      </div>
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
  
  defineEmits(["mark-as-read", "delete"]);
  
  const getIcon = (type) => {
    const icons = {
      success: "✓",
      warning: "⚠",
      info: "ℹ",
      error: "✕",
    };
    return icons[type] || icons.info;
  };
  
  const getCategoryLabel = (category) => {
    const labels = {
      equipment: 'Équipement',
      ticket: 'Ticket',
      system: 'Système'
    };
    return labels[category] || category;
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
    min-width: 32px;
    height: 32px;
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
  
  .notification-metadata {
    display: flex;
    align-items: center;
    margin-top: 4px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
  }
  
  .notification-category {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    margin-right: 8px;
  }
  
  .notification-time {
    display: block;
  }
  
  .notification-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
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
    white-space: nowrap;
  }
  
  .read-action {
    background: rgba(0, 120, 255, 0.1);
    color: #0969da;
  }
  
  .delete-action {
    background: rgba(255, 0, 0, 0.05);
    color: #cf222e;
  }
  
  .notification-action:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .read-action:hover {
    background: rgba(0, 120, 255, 0.2);
  }
  
  .delete-action:hover {
    background: rgba(255, 0, 0, 0.1);
  }
  
  .notification-read {
    opacity: 0.7;
  }
  </style>
  