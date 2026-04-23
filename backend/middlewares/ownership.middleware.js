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

    // Strict check: Profile's parentId must match User's ID
    if (profile.parentId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this profile');
    }

    // Attach profile to req for convenience in controller
    req.profile = profile;
    next();
});
