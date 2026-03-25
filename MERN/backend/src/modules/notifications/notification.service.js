const Notification = require('./notification.model');

const createNotification = async ({ userId, type, title, message, data = {} }) => {
  if (!userId || !title || !message) {
    throw new Error('userId, title and message are required for notification creation');
  }

  return Notification.create({
    user: userId,
    type: type || 'system',
    title,
    message,
    data,
  });
};

const getUserNotifications = async (userId, page = 1, limit = 15, unreadOnly = false) => {
  const numericPage = Math.max(parseInt(page, 10) || 1, 1);
  const numericLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const skip = (numericPage - 1) * numericLimit;

  const filter = { user: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.ceil(total / numericLimit),
    },
    unreadCount,
  };
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  return { unreadCount };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
