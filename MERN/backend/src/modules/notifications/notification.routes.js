const express = require('express');
const { verifyToken } = require('../../middleware/auth.middleware');
const notificationController = require('./notification.controller');

const router = express.Router();

router.get('/my', verifyToken, notificationController.getMyNotifications);
router.get('/my/unread-count', verifyToken, notificationController.getMyUnreadCount);
router.patch('/:notificationId/read', verifyToken, notificationController.markNotificationAsRead);
router.patch('/my/read-all', verifyToken, notificationController.markAllNotificationsAsRead);

module.exports = router;
