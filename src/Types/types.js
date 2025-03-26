/**
 * @typedef {Object} Notification
 * @property {number} id
 * @property {'success' | 'warning' | 'info' | 'error'} type
 * @property {string} message
 * @property {string} time
 * @property {boolean} read
 */

export const initialNotifications = [
    {
      id: 1,
      type: "success",
      message: "Your profile was updated successfully",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "warning",
      message: "Your subscription will expire in 3 days",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "info",
      message: "New feature available: Dark mode is now live!",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 4,
      type: "error",
      message: "Failed to upload document. Please try again",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 5,
      type: "success",
      message: "Payment processed successfully",
      time: "1 day ago",
      read: true,
    },
  ];
  