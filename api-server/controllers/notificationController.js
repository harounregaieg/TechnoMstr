const { localPool } = require('../config/db');

class NotificationController {
  /**
   * Get notifications for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNotifications(req, res) {
    try {
      const { unreadOnly, limit = 50 } = req.query;
      const userId = req.userId; // Assuming user ID comes from auth middleware
      
      // Build query - get notifications for this user or for all users (null recipient_id)
      let query = `
        SELECT *
        FROM notifications
        WHERE (recipient_id = $1 OR recipient_id IS NULL)
      `;
      
      const params = [userId || null];
      
      // Add filter for unread if requested
      if (unreadOnly === 'true') {
        query += ` AND is_read = false`;
      }
      
      // Order and limit
      query += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(limit);
      
      const result = await localPool.query(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
  }
  
  /**
   * Mark notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId; // Assuming user ID comes from auth middleware
      
      // Only mark notification as read if it belongs to this user or is for everyone
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE id = $1 AND (recipient_id = $2 OR recipient_id IS NULL)
        RETURNING *
      `;
      
      const result = await localPool.query(query, [id, userId || null]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Notification not found or not authorized' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.userId; // Assuming user ID comes from auth middleware
      
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE (recipient_id = $1 OR recipient_id IS NULL) AND is_read = false
      `;
      
      await localPool.query(query, [userId || null]);
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
    }
  }
  
  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId; // Assuming user ID comes from auth middleware
      
      const query = `
        DELETE FROM notifications
        WHERE id = $1 AND (recipient_id = $2 OR recipient_id IS NULL)
        RETURNING *
      `;
      
      const result = await localPool.query(query, [id, userId || null]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Notification not found or not authorized' });
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
  }
  
  /**
   * Delete all notifications for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.userId; // Assuming user ID comes from auth middleware
      
      const query = `
        DELETE FROM notifications
        WHERE (recipient_id = $1 OR recipient_id IS NULL)
      `;
      
      await localPool.query(query, [userId || null]);
      
      res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      res.status(500).json({ message: 'Error deleting all notifications', error: error.message });
    }
  }
  
  /**
   * Create notification system event
   * @param {string} type - Notification type (success, warning, info, error)
   * @param {string} category - Notification category (equipment, ticket, system)
   * @param {string} message - Notification message
   * @param {number} relatedId - ID of related entity
   * @param {number} recipientId - User ID who should receive this notification, null for all users
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(type, category, message, relatedId = null, recipientId = null) {
    try {
      const query = `
        INSERT INTO notifications 
        (type, category, message, related_id, recipient_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await localPool.query(query, [type, category, message, relatedId, recipientId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationController(); 