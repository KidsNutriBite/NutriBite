import Notification from '../models/Notification.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';

/**
 * Get dynamic real-time daily reminders for parent (meals and water).
 * Disappears automatically when all meals are logged and water intake target is met.
 */
export const getActiveParentReminders = async (userId) => {
    try {
        const profiles = await Profile.find({ parentId: userId });
        if (!profiles || profiles.length === 0) return [];

        const todayStr = new Date().toISOString().split('T')[0];
        const reminders = [];

        for (const child of profiles) {
            const todayLog = await MealLog.findOne({ profileId: child._id, date: todayStr });

            // 1. Check Meal Logging Status
            const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
            const completedSlots = [];
            let totalWater = 0;

            if (todayLog) {
                slots.forEach(slot => {
                    const items = todayLog[slot] || [];
                    if (items.length > 0) {
                        completedSlots.push(slot);
                    }
                    items.forEach(item => {
                        totalWater += (item.water || 0);
                    });
                });
            }

            // If less than 3 main meals logged today (breakfast, lunch, dinner), show reminder
            const mainSlots = ['breakfast', 'lunch', 'dinner'];
            const missingMain = mainSlots.filter(s => !completedSlots.includes(s));
            const hasAllMeals = (todayLog && (todayLog.completedMealsCount >= 3 || missingMain.length === 0));

            if (!hasAllMeals) {
                const missingText = missingMain.length > 0 ? missingMain.join(', ') : 'daily meals';
                reminders.push({
                    _id: `dynamic_meal_${child._id}_${todayStr}`,
                    recipientId: userId,
                    type: 'meal_reminder',
                    message: `🍱 Meal Reminder: Remember to log ${child.name}'s ${missingText} for today to balance nutrition and preserve streak!`,
                    isRead: false,
                    isDynamic: true,
                    createdAt: new Date()
                });
            }

            // 2. Check Water Intake Status
            const targetWater = child.preferences?.waterIntake || 1400;
            const isWaterMet = totalWater >= targetWater;

            if (!isWaterMet) {
                reminders.push({
                    _id: `dynamic_water_${child._id}_${todayStr}`,
                    recipientId: userId,
                    type: 'hydration_reminder',
                    message: `💧 Hydration Reminder: ${child.name} has logged ${totalWater}ml / ${targetWater}ml of water today. Offer a glass of water to reach the required level!`,
                    isRead: false,
                    isDynamic: true,
                    createdAt: new Date()
                });
            }
        }

        return reminders;
    } catch (err) {
        console.error('Error generating active parent reminders:', err);
        return [];
    }
};

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
 * Get notifications for a user (combining dynamic reminders and persistent notifications)
 * @param {string} userId 
 */
export const getUserNotifications = async (userId) => {
    const saved = await Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    const dynamicReminders = await getActiveParentReminders(userId);

    return [...dynamicReminders, ...saved];
};

/**
 * Get unread count
 */
export const getUnreadCount = async (userId) => {
    const savedCount = await Notification.countDocuments({ recipientId: userId, isRead: false });
    const dynamicReminders = await getActiveParentReminders(userId);
    return savedCount + dynamicReminders.length;
};

/**
 * Mark notification as read
 * @param {string} notificationId 
 * @param {string} userId (for ownership check)
 */
export const markAsRead = async (notificationId, userId) => {
    if (String(notificationId).startsWith('dynamic_')) {
        return { _id: notificationId, isRead: true };
    }
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
