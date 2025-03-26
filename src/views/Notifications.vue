<template>
    <main class="notification-system">
      <header class="notification-header">
        <h1 class="notification-title">Notifications</h1>
        <button
          @click="clearAll"
          class="clear-button"
          :disabled="!notifications.length"
        >
          Clear All
        </button>
      </header>
  
      <section class="notification-content">
        <div class="notification-container">
          <template v-if="notifications.length">
            <NotificationItem
              v-for="notification in notifications"
              :key="notification.id"
              :notification="notification"
              @mark-as-read="markAsRead"
            />
          </template>
          <p v-else class="no-notifications">No notifications</p>
        </div>
      </section>
    </main>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import NotificationItem from "../components/NotificationComponenets/NotificationItem.vue";
  import { initialNotifications } from "../Types/types.js";
  
  const notifications = ref(initialNotifications);
  
  const markAsRead = (id) => {
    notifications.value = notifications.value.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    );
  };
  
  const clearAll = () => {
    notifications.value = [];
  };
  </script>
  
  <style lang="scss" scoped>
  
  .notifications-page {
      width: 102%;
      padding: 1rem;
      padding-left: calc(2rem + 48px);
      box-sizing: border-box;
      transition: padding-left 0.2s ease-out;
  
      &.sidebar-expanded {
        padding-left: calc(var(--sidebar-width) + 1rem);
      }
      
      h1 {
        margin-bottom: 1rem;
      }
    }
  
  /*.notification-system {
    display: flex;
    flex-direction: column;
    width: 96%; // Use full available space instead of viewport width
    height: 89vh;
    margin-left: calc(2rem + 32px);
    background: rgba(255, 255, 255, 0.6);
    font-family: "Poppins", sans-serif;
  }*/
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    margin-left: calc(2rem + 32px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }
  
  .notification-title {
    font-size: 32px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0;
  }
  
  .clear-button {
    padding: 8px 16px;
    border-radius: 4px;
    background: rgba(128, 120, 120, 0.35);
    color: rgba(0, 0, 0, 0.6);
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.2s;
  }
  
  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .notification-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  .notification-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .no-notifications {
    text-align: center;
    padding: 48px;
    color: rgba(0, 0, 0, 0.4);
    margin: 0;
  }
  </style>