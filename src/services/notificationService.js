import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

/**
 * Fetch notifications for the current user
 * @param {Object} params - Query parameters
 * @param {boolean} params.unreadOnly - Only fetch unread notifications
 * @param {number} params.limit - Maximum number of notifications to fetch
 * @returns {Promise<Array>} Array of notification objects
 */
export const fetchNotifications = async ({ unreadOnly = false, limit = 50 } = {}) => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      params: { 
        unreadOnly,
        limit
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markNotificationAsRead = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Result of the operation
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/read-all`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Result of the operation
 */
export const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    throw error;
  }
};

/**
 * Delete all notifications
 * @returns {Promise<Object>} Result of the operation
 */
export const deleteAllNotifications = async () => {
  try {
    const response = await axios.delete(`${API_URL}/notifications`);
    return response.data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}; 