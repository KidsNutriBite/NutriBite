import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { uploadFile } from '../services/storage.service.js';

// @desc    Get current parent profile
// @route   GET /api/parent/me
// @access  Private (Parent)
export const getParentProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(new ApiResponse(200, user));
});

// @desc    Update parent profile
// @route   PATCH /api/parent/update
// @access  Private (Parent)
export const updateParentProfile = asyncHandler(async (req, res) => {
    let { name, phone, address, title } = req.body;

    // Handle Address parsing if sent as JSON string via FormData
    if (address && typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch (error) {
            console.error('Error parsing address JSON:', error);
        }
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Handle Image Upload
    if (req.file) {
        const filename = await uploadFile(req.file);
        user.profileImage = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    }

    if (name) user.name = name;
    if (title) user.title = title;

    // Sync phone
    if (phone) {
        user.phone = phone;
        if (user.parentProfile) {
            user.parentProfile.phoneNumber = phone;
        }
    }

    // Update Address
    if (address) {
        user.address = {
            city: address.city || user.address?.city || '',
            state: address.state || user.address?.state || '',
            country: address.country || user.address?.country || ''
        };
        // Sync city to parentProfile for legacy support
        if (user.parentProfile && address.city) {
            user.parentProfile.city = address.city;
        }
    }

    await user.save();

    res.status(200).json(new ApiResponse(200, { user, message: 'Profile updated successfully' }));
});
