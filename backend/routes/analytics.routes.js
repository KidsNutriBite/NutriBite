import express from 'express';
import { getMealFrequency, createPrescription, getPrescriptions, getNutritionTrends } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkDoctorAccess } from '../middlewares/doctor.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import Profile from '../models/Profile.model.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);

// Analytics Routes
// Both Parent and Doctor can view analytics. 
// Note: We need a middleware that checks "Access" generically (Owner or Doctor).
// For now, let's assume the frontend handles the correct role-based calls, 
// and we implement a shared `checkAccess` middleware or just use specific role checks.
// To keep it simple: We'll allow access if (Doctor AND hasAccess) OR (Parent AND ownsProfile).
// Implementing a simple inline check or reusing existing.

// Quick inline middleware for dual access check
const checkSharedAccess = async (req, res, next) => {
    // If Doctor, run checkDoctorAccess (which expects :id param)
    if (req.user.role === 'doctor') {
        // Map :profileId to :id for the existing middleware, or just call it directly
        req.params.id = req.params.profileId;
        return checkDoctorAccess(req, res, next);
    }
    // If Parent, default ownership middleware (logic duplicated here for speed or import `ownership.middleware`)
    // Let's rely on the controller or a new middleware for thoroughness. 
    // Actually, let's keep it safe:
    if (req.user.role === 'parent') {
        const profile = await Profile.findById(req.params.profileId);
        if (!profile) {
            res.status(404);
            throw new Error('Profile not found');
        }
        if (profile.parentId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this profile');
        }
        next();
    } else {
        res.status(403);
        throw new Error('Unauthorized');
    }
};

// Middleware to ensure a doctor is assigned through the consultation workflow.
const checkFullAccess = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'doctor') {
        req.params.id = req.params.profileId || req.params.id || req.body.profileId;
        return checkDoctorAccess(req, res, next);
    }
    next();
});

router.get('/meal-frequency/:profileId', checkSharedAccess, checkFullAccess, getMealFrequency);
router.get('/nutrition-trends/:profileId', checkSharedAccess, getNutritionTrends);
router.get('/prescriptions/:profileId', checkSharedAccess, getPrescriptions);

router.post('/prescriptions', authorize('doctor'), async (req, res, next) => {
    req.params.id = req.body.profileId; // For checkDoctorAccess
    next();
}, checkDoctorAccess, createPrescription);

export default router;
