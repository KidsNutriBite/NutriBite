import asyncHandler from '../utils/asyncHandler.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
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

    // 2. Check for active/completed assigned consultation request
    const access = await ConsultationRequest.findOne({
        doctorId: req.user._id,
        profileId: profileId,
        status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] },
    });

    if (!access) {
        res.status(403);
        throw new Error('You do not have access to this patient profile');
    }

    // Attach profile to req for convenience
    req.profile = profile;
    next();
});
