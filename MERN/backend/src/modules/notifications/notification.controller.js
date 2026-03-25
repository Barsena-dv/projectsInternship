const notificationService = require('./notification.service');

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      page,
      limit,
      unreadOnly === 'true'
    );

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await notificationService.markAsRead(notificationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
