<template>
  <main class="notification-system" aria-labelledby="notification-title">
    <header class="notification-header">
      <h1 id="notification-title" class="notification-title">Notifications</h1>
      <div class="header-actions">
        <button
          @click="markAllAsRead"
          class="action-button read-all-button"
          :disabled="!unreadNotifications.length"
          aria-label="Marquer toutes les notifications comme lues"
        >
          Marquer tout comme lu
        </button>
        <button
          @click="clearAll"
          class="action-button clear-button"
          :disabled="!notifications.length"
          aria-label="Effacer toutes les notifications"
        >
          Tout effacer
        </button>
      </div>
    </header>

    <section class="notification-content">
      <div v-if="loading" class="status-message loading-indicator" role="status">
        <span class="loading-spinner"></span>
        Chargement des notifications...
      </div>
      
      <div v-else-if="error" class="status-message error-message" role="alert">
        Erreur lors du chargement des notifications: {{ error }}
      </div>
      
      <div v-else class="notification-container">
        <transition-group name="notification-list" tag="div">
          <NotificationItem
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            @mark-as-read="markAsRead"
            @delete="deleteNotification"
          />
        </transition-group>
        <p v-if="!notifications.length" class="no-notifications" role="status">Aucune notification</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import NotificationItem from "../components/NotificationComponenets/NotificationItem.vue";
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification as deleteNotificationAPI,
  deleteAllNotifications 
} from "../services/notificationService.js";
import { notificationEvents } from "../services/eventBus";

const notifications = ref([]);
const loading = ref(false);
const error = ref(null);

// Computed property for unread notifications
const unreadNotifications = computed(() => {
  return notifications.value.filter(notification => !notification.is_read);
});

// Fetch notifications from the API
const loadNotifications = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const result = await fetchNotifications();
    // Convert database timestamp to human-friendly format
    notifications.value = result.map(notification => ({
      ...notification,
      time: formatTimestamp(notification.created_at)
    }));
    
    // Update the unread count in the event bus
    const unreadCount = notifications.value.filter(n => !n.is_read).length;
    notificationEvents.updateUnreadCount(unreadCount);
  } catch (err) {
    console.error('Error loading notifications:', err);
    error.value = err.message || 'Erreur lors du chargement des notifications';
  } finally {
    loading.value = false;
  }
};

// Format timestamp to relative time (e.g., "2 minutes ago")
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return "à l'instant";
  } else if (diffMins < 60) {
    return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  } else {
    // Format as date for older notifications
    return date.toLocaleDateString();
  }
};

// Mark a notification as read
const markAsRead = async (id) => {
  try {
    await markNotificationAsRead(id);
    // Update local state
    notifications.value = notifications.value.map((notification) =>
      notification.id === id ? { ...notification, is_read: true } : notification
    );
    
    // Update the unread count in the event bus
    notificationEvents.decrementCount();
  } catch (err) {
    console.error(`Error marking notification ${id} as read:`, err);
    error.value = err.message || 'Erreur lors du marquage de la notification comme lue';
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  try {
    await markAllNotificationsAsRead();
    
    // Get the count of previously unread notifications
    const previousUnreadCount = notifications.value.filter(n => !n.is_read).length;
    
    // Update local state
    notifications.value = notifications.value.map(notification => ({
      ...notification,
      is_read: true
    }));
    
    // Update the event bus by setting count to 0
    notificationEvents.updateUnreadCount(0);
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    error.value = err.message || 'Erreur lors du marquage de toutes les notifications comme lues';
  }
};

// Delete a notification
const deleteNotification = async (id) => {
  try {
    await deleteNotificationAPI(id);
    
    // Check if the notification was unread before removing it
    const wasUnread = notifications.value.find(n => n.id === id && !n.is_read);
    
    // Remove from local state
    notifications.value = notifications.value.filter(notification => notification.id !== id);
    
    // If it was unread, decrement the count
    if (wasUnread) {
      notificationEvents.decrementCount();
    }
  } catch (err) {
    console.error(`Error deleting notification ${id}:`, err);
    error.value = err.message || 'Erreur lors de la suppression de la notification';
  }
};

// Clear all notifications
const clearAll = async () => {
  try {
    await deleteAllNotifications();
    notifications.value = [];
    
    // Update the event bus by setting count to 0
    notificationEvents.updateUnreadCount(0);
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    error.value = err.message || 'Erreur lors de la suppression de toutes les notifications';
  }
};

// Load notifications on component mount
onMounted(() => {
  loadNotifications();
});
</script>

<style lang="scss" scoped>
.notification-system {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  margin: 0 auto;
  padding: 0 1rem;
  font-family: "Poppins", sans-serif;
  color: #333;
  background: transparent;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
}

.notification-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.read-all-button {
  background-color: #f0f7ff;
  color: #2563eb;
}

.read-all-button:hover:not(:disabled) {
  background-color: #e0f0ff;
}

.clear-button {
  background-color: #f5f5f5;
  color: #666;
}

.clear-button:hover:not(:disabled) {
  background-color: #ebebeb;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.notification-content::-webkit-scrollbar {
  width: 6px;
}

.notification-content::-webkit-scrollbar-track {
  background: transparent;
}

.notification-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.notification-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  font-size: 0.95rem;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.loading-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #dc2626;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 1rem;
}

.no-notifications {
  text-align: center;
  padding: 3rem 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from,
.notification-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .action-button {
    flex: 1;
  }
}
</style>