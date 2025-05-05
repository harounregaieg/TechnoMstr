import { ref } from 'vue';

// Create a reactive event bus for notification system
export const notificationEvents = {
  // Ref to hold the latest count
  unreadCount: ref(0),
  
  // Method to update the count
  updateUnreadCount(count) {
    this.unreadCount.value = count;
  },
  
  // Method to decrement the count (when marking as read)
  decrementCount() {
    if (this.unreadCount.value > 0) {
      this.unreadCount.value--;
    }
  }
}; 