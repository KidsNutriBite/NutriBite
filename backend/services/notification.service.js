import Notification from '../models/Notification.model.js';

/**
 * Create a new notification
 * @param {string} recipientId 
 * @param {string} message 
 * @param {string} type 
 * @param {string} [senderId] 
 */
export const createNotification = async (recipientId, message, type, senderId = null) => {
    try {
        const notification = await Notification.create({
            recipientId,
            message,
            type,
            senderId
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw, notifications shouldn't block main flow if they fail
        return null;
    }
};

/**
 * Get notifications for a user
 * @param {string} userId 
 */
export const getUserNotifications = async (userId) => {
    return await Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(20); // Limit to last 20
};

/**
 * Get unread count
 */
export const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
};

/**
 * Mark notification as read
 * @param {string} notificationId 
 * @param {string} userId (for ownership check)
 */
export const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOne({ _id: notificationId, recipientId: userId });
    if (notification) {
        notification.isRead = true;
        await notification.save();
    }
    return notification;
};

/**
 * Mark all as read
 */
export const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
    );
};
