import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { uploadFile } from '../services/storage.service.js';

// @desc    Get dietitian profile
// @route   GET /api/dietitian/me
// @access  Private (Dietitian)
export const getDietitianProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user || user.role !== 'dietitian') {
        res.status(404);
        throw new Error('Dietitian profile not found');
    }
    res.status(200).json(new ApiResponse(200, user));
});

// @desc    Update dietitian profile
// @route   PATCH /api/dietitian/update
// @access  Private (Dietitian)
export const updateDietitianProfile = asyncHandler(async (req, res) => {
    let { name, phone, address, title, dietitianProfile } = req.body;

    // Handle JSON parsing if sent via FormData
    if (address && typeof address === 'string') {
        try { address = JSON.parse(address); } catch (e) { }
    }
    if (dietitianProfile && typeof dietitianProfile === 'string') {
        try { dietitianProfile = JSON.parse(dietitianProfile); } catch (e) { }
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
    if (phone) user.phone = phone;

    if (address) {
        user.address = {
            city: address.city || user.address?.city || '',
            state: address.state || user.address?.state || '',
            country: address.country || user.address?.country || ''
        };
    }

    if (dietitianProfile) {
        user.dietitianProfile = {
            specialization: dietitianProfile.specialization || user.dietitianProfile?.specialization || '',
            experienceYears: dietitianProfile.experienceYears || user.dietitianProfile?.experienceYears || 0,
            registrationId: dietitianProfile.registrationId || user.dietitianProfile?.registrationId || ''
        };
    }

    await user.save();
    res.status(200).json(new ApiResponse(200, { user, message: 'Profile updated successfully' }));
});
