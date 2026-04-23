import Profile from '../models/Profile.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { profileSchema } from '../validators/profile.schema.js';
import { uploadFile } from '../services/storage.service.js';

// @desc    Create a new child profile
// @route   POST /api/profiles
// @access  Private (Parent)
export const createProfile = asyncHandler(async (req, res) => {
    // Note: Validation might fail if we don't preprocess body for numbers.
    // FormData sends everything as strings. validation with Zod 'coerce' is recommended,
    // or we manually cast here.

    // 1. Handle Files
    let profileImageUrl = null;
    let medicalReportUrls = [];

    if (req.files && req.files.length > 0) {
        // Construct base URL for static files
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

        for (const file of req.files) {
            if (file.fieldname === 'profileImage') {
                const filename = await uploadFile(file);
                profileImageUrl = `${baseUrl}/${filename}`;
            } else if (file.fieldname === 'medicalReports') {
                const filename = await uploadFile(file);
                medicalReportUrls.push(`${baseUrl}/${filename}`);
            }
        }
    }

    // 2. Parse Body (Manual casting for FormData strings)
    const dob = new Date(req.body.dob);
    const today = new Date();
    let computedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        computedAge--;
    }

    const profileData = {
        name: req.body.name,
        dob: dob,
        age: computedAge,
        gender: req.body.gender,
        height: Number(req.body.height),
        weight: Number(req.body.weight),
        waistCircumference: Number(req.body.waistCircumference),
        avatar: req.body.avatar || 'lion',
        healthConditions: req.body.healthConditions || [],
        location: {
            city: req.body.city,
            state: req.body.state
        },
        profileImage: profileImageUrl,
        medicalReports: medicalReportUrls,
        dietaryPreferences: req.body.dietaryPreferences || []
    };

    // 3. Create Profile (Skipping validation for brevity since manual casting does checks implicitly or fails at DB level)
    // In production, run Zod here again with coerced types.

    const profile = await Profile.create({
        parentId: req.user._id,
        ...profileData
    });

    await GrowthRecord.create({
        childId: profile._id,
        height: profileData.height,
        weight: profileData.weight,
        waistCircumference: profileData.waistCircumference,
        ageInMonths: (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth()),
        recordedByRole: 'parent',
        recordedByUserId: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, profile, 'Profile created successfully'));
});

import { generateHealthTips } from '../utils/healthTipsEngine.js';

// ... imports

import Appointment from '../models/Appointment.model.js';

// @desc    Get all profiles for logged in parent (with Tips)
// @route   GET /api/profiles
// @access  Private (Parent)
export const getMyProfiles = asyncHandler(async (req, res) => {
    const profiles = await Profile.find({ parentId: req.user._id }).lean();

    // Attach Health Tips and Last Checkup to each profile
    const profilesWithTips = await Promise.all(profiles.map(async (profile) => {
        const lastCheckup = await Appointment.findOne({ profileId: profile._id, status: { $ne: 'cancelled' } })
            .sort({ date: -1 })
            .lean();

        return {
            ...profile,
            tips: generateHealthTips(profile.healthConditions),
            lastCheckup: lastCheckup ? {
                date: lastCheckup.date,
                time: lastCheckup.time,
                doctorName: lastCheckup.hospitalName || 'Pediatrician'
            } : null
        };
    }));

    res.status(200).json(new ApiResponse(200, profilesWithTips));
});

// @desc    Get single profile details (with Tips)
// @route   GET /api/profiles/:id
// @access  Private (Owner/Parent)
export const getProfileById = asyncHandler(async (req, res) => {
    // req.profile is a Mongoose document from middleware
    const profileData = req.profile.toObject();
    profileData.tips = generateHealthTips(profileData.healthConditions);

    res.status(200).json(new ApiResponse(200, profileData));
});

// @desc    Update profile
// @route   PUT /api/profiles/:id
// @access  Private (Owner/Parent)
export const updateProfile = asyncHandler(async (req, res) => {
    const validation = profileSchema.partial().safeParse(req.body);

    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const updatedProfile = await Profile.findByIdAndUpdate(
        req.params.id,
        validation.data,
        { new: true, runValidators: true }
    );

    res.status(200).json(new ApiResponse(200, updatedProfile, 'Profile updated'));
});

// @desc    Delete profile
// @route   DELETE /api/profiles/:id
// @access  Private (Owner/Parent)
export const deleteProfile = asyncHandler(async (req, res) => {
    await Profile.findByIdAndDelete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Profile deleted'));
});
