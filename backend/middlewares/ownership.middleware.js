import asyncHandler from '../utils/asyncHandler.js';
import Profile from '../models/Profile.model.js';

// Middleware to check if the authenticated user owns the profile being accessed
// This expects 'id' in params to be the Profile ID, OR 'profileId' in body/query
export const checkProfileOwnership = asyncHandler(async (req, res, next) => {
    let profileId = req.params.id || req.body.profileId || req.query.profileId;

    // If we are hitting a route that doesn't target a specific profile (like create), skip
    // But for Create Meal, we need to check the body.profileId

    if (!profileId) {
        // If no profile ID involved (e.g. list all my profiles), move on
        return next();
    }

    const profile = await Profile.findById(profileId);

    if (!profile) {
        res.status(404);
        throw new Error('Profile not found');
    }

    const isParent = profile.parentId.toString() === req.user._id.toString();
    
    let isAuthorizedDoctor = false;
    let isAuthorizedDietitian = false;

    if (req.user.role === 'doctor') {
        const ConsultationRequest = (await import('../models/ConsultationRequest.model.js')).default;
        const access = await ConsultationRequest.findOne({
            doctorId: req.user._id,
            profileId: profileId,
            status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] }
        });
        if (access) {
            isAuthorizedDoctor = true;
        }
    }

    if (req.user.role === 'dietitian') {
        const ConsultationRequest = (await import('../models/ConsultationRequest.model.js')).default;
        const access = await ConsultationRequest.findOne({
            dietitianId: req.user._id,
            profileId: profileId
        });
        if (access) {
            isAuthorizedDietitian = true;
        }
    }

    if (!isParent && !isAuthorizedDoctor && !isAuthorizedDietitian) {
        res.status(403);
        throw new Error('Not authorized to access this profile');
    }

    // Attach profile to req for convenience in controller
    req.profile = profile;
    next();
});
