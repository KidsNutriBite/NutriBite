import Feedback from '../models/Feedback.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
export const submitFeedback = asyncHandler(async (req, res) => {
    const { type, message, email } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    if (message.length < 10) {
        res.status(400);
        throw new Error('Message must be at least 10 characters long');
    }

    if (message.length > 500) {
        res.status(400);
        throw new Error('Message cannot exceed 500 characters');
    }

    const feedback = await Feedback.create({
        type: type || 'Bug',
        message,
        email,
        userId: req.user._id
    });

    res.status(201).json(new ApiResponse(201, feedback, 'Feedback submitted successfully'));
});
