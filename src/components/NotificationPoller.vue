<template>
  <div style="display: none;">
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { fetchNotifications } from '../services/notificationService';
import { notificationEvents } from '../services/eventBus';

let pollingInterval = null;

// Function to fetch unread notification count
const fetchUnreadCount = async () => {
  try {
    const notifications = await fetchNotifications({ unreadOnly: true });
    notificationEvents.updateUnreadCount(notifications.length);
  } catch (error) {
    console.error('Error fetching notifications count:', error);
  }
};

onMounted(() => {
  // Fetch count immediately
  fetchUnreadCount();
  
  // Set up polling interval (every 30 seconds)
  pollingInterval = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  // Clean up the interval when component is unmounted
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
});
</script> 