import * as notificationService from '../services/notification.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    const unreadCount = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json(new ApiResponse(200, {
        notifications,
        unreadCount
    }));
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user._id);
    res.status(200).json(new ApiResponse(200, { message: 'Marked as read' }));
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json(new ApiResponse(200, { message: 'All marked as read' }));
});
