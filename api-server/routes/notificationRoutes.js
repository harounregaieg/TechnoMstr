const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/', notificationController.getNotifications.bind(notificationController));

// Mark a notification as read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read for the current user
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Delete a notification
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

// Delete all notifications for the current user
router.delete('/', notificationController.deleteAllNotifications.bind(notificationController));

module.exports = router; 