import asyncHandler from '../utils/asyncHandler.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import Profile from '../models/Profile.model.js';

// Middleware to check if the authenticated DOCTOR has active access to the profile
// Expects 'id' in params to be the Profile ID
export const checkDoctorAccess = asyncHandler(async (req, res, next) => {
    const profileId = req.params.id;

    if (!profileId) {
        return next();
    }

    // 1. Verify Profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
        res.status(404);
        throw new Error('Profile not found');
    }

    // 2. Check for Access record (Active, Restricted, or Pending)
    const access = await DoctorAccess.findOne({
        doctorId: req.user._id,
        profileId: profileId,
        status: { $in: ['active', 'restricted', 'pending'] },
    });

    if (!access) {
        res.status(403);
        throw new Error('You do not have access to this patient profile');
    }

    // 3. Check Expiration (if set)
    if (access.expiresAt && new Date() > access.expiresAt) {
        res.status(403);
        throw new Error('Access to this patient has expired');
    }

    // Attach profile to req for convenience
    req.profile = profile;
    next();
});
