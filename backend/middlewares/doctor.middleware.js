import asyncHandler from '../utils/asyncHandler.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import Profile from '../models/Profile.model.js';

// Middleware to check if the authenticated DOCTOR has active access to the profile.
// Access is granted via:
//   1. ConsultationRequest (standard clinical workflow)
//   2. DoctorAccess (parent-invited family / outside doctor - Method 1 handshake)
// Expects 'id' in params to be the Profile ID.
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

    // 2a. Check via ConsultationRequest (clinical pathway)
    const clinicalAccess = await ConsultationRequest.findOne({
        doctorId: req.user._id,
        profileId: profileId,
        status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] },
    });

    if (clinicalAccess) {
        req.profile = profile;
        req.accessType = 'clinical';
        return next();
    }

    // 2b. Check via DoctorAccess (parent-invited family doctor pathway)
    const directAccess = await DoctorAccess.findOne({
        doctorId: req.user._id,
        profileId: profileId,
        status: { $in: ['restricted', 'active'] },
    });

    if (directAccess) {
        req.profile = profile;
        req.accessType = 'direct_invite';
        req.accessLevel = directAccess.status; // 'restricted' | 'active'
        return next();
    }

    res.status(403);
    throw new Error('You do not have access to this patient profile');
});
