import User from '../models/User.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { findNearbyDoctors } from '../services/location.service.js';
import {
    requestAccess as requestAccessService,
    getMyPatients as getMyPatientsService,
    getPatientDetails as getPatientDetailsService,
    updateHealthNotes as updateHealthNotesService
} from '../services/doctor.service.js';

// @desc    Find nearby pediatricians (Public/Parent)
// @route   GET /api/doctor/nearby
// @access  Private (Parent)
export const getNearbyDoctors = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
        res.status(400);
        throw new Error('Latitude and Longitude are required');
    }

    const doctors = await findNearbyDoctors(lat, lng, radius);

    res.status(200).json(new ApiResponse(200, doctors));
});

// @desc    Request access to a parent's children (via Email)
// @route   POST /api/doctor/request-access
// @access  Private (Doctor)
export const requestAccess = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Parent email is required');
    }

    const result = await requestAccessService(req.user._id, email);

    res.status(201).json(new ApiResponse(201, result));
});

// @desc    Get all active patients
// @route   GET /api/doctor/patients
// @access  Private (Doctor)
export const getMyPatients = asyncHandler(async (req, res) => {
    const patients = await getMyPatientsService(req.user._id);
    res.status(200).json(new ApiResponse(200, patients));
});

// @desc    Get patient details (Read-Only)
// @route   GET /api/doctor/patients/:id
// @access  Private (Doctor)
export const getPatientDetails = asyncHandler(async (req, res) => {
    // Service handles Audit Logging and Access Validation
    const data = await getPatientDetailsService(req.user._id, req.params.id);
    res.status(200).json(new ApiResponse(200, data));
});

// @desc    Update patient health notes
// @route   PATCH /api/doctor/patients/:id/notes
// @access  Private (Doctor)
export const updatePatientNotes = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    if (!notes) {
        res.status(400);
        throw new Error('Notes are required');
    }

    const result = await updateHealthNotesService(req.user._id, req.params.id, notes);
    res.status(200).json(new ApiResponse(200, result));
});

// @desc    Get current doctor profile
// @route   GET /api/doctor/me
// @access  Private (Doctor)
export const getDoctorProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(new ApiResponse(200, user));
});

// @desc    Update doctor profile
// @route   PATCH /api/doctor/update
// @access  Private (Doctor)
export const updateDoctorProfile = asyncHandler(async (req, res) => {
    let { name, phone, address, title, doctorProfile } = req.body;

    // Handle JSON parsing if sent via FormData
    if (address && typeof address === 'string') {
        try { address = JSON.parse(address); } catch (e) { }
    }
    if (doctorProfile && typeof doctorProfile === 'string') {
        try { doctorProfile = JSON.parse(doctorProfile); } catch (e) { }
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

    if (doctorProfile) {
        user.doctorProfile = {
            specialization: doctorProfile.specialization || user.doctorProfile?.specialization,
            hospitalName: doctorProfile.hospitalName || user.doctorProfile?.hospitalName,
            experienceYears: doctorProfile.experienceYears || user.doctorProfile?.experienceYears,
            registrationId: doctorProfile.registrationId || user.doctorProfile?.registrationId
        };
    }

    await user.save();
    res.status(200).json(new ApiResponse(200, { user, message: 'Profile updated successfully' }));
});

// @desc    Get all registered doctors (for parents to choose)
// @route   GET /api/doctor/all
// @access  Private (Parent/Doctor)
export const getAllDoctors = asyncHandler(async (req, res) => {
    const doctors = await User.find({ role: 'doctor' })
        .select('name email profileImage doctorProfile')
        .sort({ name: 1 });
    res.status(200).json(new ApiResponse(200, doctors));
});

// @desc    Request full access to a patient profile
// @route   POST /api/doctor/patients/:id/request-full-access
// @access  Private (Doctor)
export const requestFullAccess = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const profileId = req.params.id;

    if (!message) {
        res.status(400);
        throw new Error('Please provide a reason for requesting full access');
    }

    const access = await DoctorAccess.findOne({
        doctorId: req.user._id,
        profileId: profileId,
        status: 'restricted'
    });

    if (!access) {
        res.status(404);
        throw new Error('No pending access found for this patient');
    }

    access.doctorMessage = message;
    access.fullAccessRequested = true;
    await access.save();

    res.status(200).json(new ApiResponse(200, null, 'Full access request sent to parent'));
});
