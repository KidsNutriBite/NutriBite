import axios from 'axios';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import Prescription from '../models/Prescription.model.js';
import Notification from '../models/Notification.model.js';
import { emitToUser, emitToRoom } from '../socket/videoSignaling.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

const ACTIVE_STATUSES = [
    'Pending',
    'AssignedToDietitian',
    'UnderDietitianReview',
    'AssignedToDoctor',
    'UnderDoctorReview',
    'PrescriptionIssued'
];

const DOCTOR_ACTIVE_STATUSES = ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued'];

const VALID_TRANSITIONS = {
    Pending: ['AssignedToDietitian'],
    AssignedToDietitian: ['UnderDietitianReview'],
    UnderDietitianReview: ['AssignedToDoctor'],
    AssignedToDoctor: ['UnderDoctorReview'],
    UnderDoctorReview: ['PrescriptionIssued'],
    PrescriptionIssued: ['Closed'],
    Closed: []
};

const ensureTransition = (fromStatus, toStatus) => {
    if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus)) {
        const allowed = VALID_TRANSITIONS[fromStatus] || [];
        const error = new Error(
            allowed.length
                ? `Invalid consultation status transition: ${fromStatus} can only move to ${allowed.join(', ')}`
                : `Invalid consultation status transition: ${fromStatus} is terminal`
        );
        error.statusCode = 400;
        throw error;
    }
};

const requireAssignedDietitian = (request, userId) => {
    if (!request.dietitianId || request.dietitianId.toString() !== userId.toString()) {
        throw new Error('Not authorized: You are not the assigned dietitian for this case');
    }
};

const requireAssignedDoctor = (request, userId) => {
    if (!request.doctorId || request.doctorId.toString() !== userId.toString()) {
        throw new Error('Not authorized: You are not the assigned doctor for this case');
    }
};

// Helper function to auto-assign a dietitian to a pending request
export const autoAssignDietitian = async (request) => {
    // Find all Available Dietitians
    const availableDietitians = await User.find({ role: 'dietitian', availabilityStatus: 'Available' });
    if (availableDietitians.length === 0) {
        request.status = 'Pending';
        await request.save();
        return null;
    }

    // Compute active case loads for each dietitian
    const dietitianLoads = await Promise.all(availableDietitians.map(async (dietitian) => {
        const activeCount = await ConsultationRequest.countDocuments({
            dietitianId: dietitian._id,
            status: { $in: ACTIVE_STATUSES.filter(status => status !== 'Pending') }
        });
        return { dietitian, activeCount };
    }));

    // Sort by case count ascending
    dietitianLoads.sort((a, b) => a.activeCount - b.activeCount);

    // Assign to the dietitian with the lowest workload
    const chosen = dietitianLoads[0].dietitian;
    const assigned = await ConsultationRequest.findOneAndUpdate(
        { _id: request._id, status: 'Pending', dietitianId: null },
        {
            $set: {
                dietitianId: chosen._id,
                assignedAt: new Date(),
                status: 'AssignedToDietitian'
            }
        },
        { new: true }
    );

    if (assigned) {
        request.dietitianId = assigned.dietitianId;
        request.assignedAt = assigned.assignedAt;
        request.status = assigned.status;
    }

    return chosen;
};

// @desc    Create a new consultation request
// @route   POST /api/consultations
// @access  Private (Parent)
export const createRequest = asyncHandler(async (req, res) => {
    const { profileId } = req.body;

    if (!profileId) {
        res.status(400);
        throw new Error('Profile ID is required');
    }

    // 1. Verify child profile exists and belongs to parent
    const profile = await Profile.findById(profileId);
    if (!profile) {
        res.status(404);
        throw new Error('Child Profile not found');
    }

    if (profile.parentId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: This profile does not belong to you');
    }

    // 2. Prevent duplicate active requests
    const activeRequest = await ConsultationRequest.findOne({
        profileId,
        status: { $in: ACTIVE_STATUSES }
    });

    if (activeRequest) {
        res.status(400);
        throw new Error('An active consultation request already exists for this child');
    }

    // 3. Create Consultation Request
    let request;
    try {
        request = await ConsultationRequest.create({
            profileId,
            parentId: req.user._id,
            status: 'Pending'
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            throw new Error('An active consultation request already exists for this child');
        }
        throw error;
    }

    // Try auto-assignment
    const assignedDietitian = await autoAssignDietitian(request);

    res.status(201).json(
        new ApiResponse(201, {
            request,
            assignedDietitian: assignedDietitian ? { _id: assignedDietitian._id, name: assignedDietitian.name } : null
        }, 'Consultation request created successfully')
    );
});

// @desc    Get available Doctors in the Dietitian's pool with case loads
// @route   GET /api/consultations/dietitian/available-doctors/:requestId
// @access  Private (Dietitian)
export const getAvailableDoctorsForDietitian = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    // Check ownership
    if (!request.dietitianId || request.dietitianId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: You are not the assigned dietitian for this case');
    }

    // Fetch Dietitian's Doctor Pool mapping
    const group = await DietitianDoctorGroup.findOne({ dietitianId: req.user._id });
    if (!group || !group.doctorIds || group.doctorIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'No doctors found in your pool'));
    }

    // Filter Doctors in group that are Available
    const availableDoctors = await User.find({
        _id: { $in: group.doctorIds },
        role: 'doctor',
        availabilityStatus: 'Available'
    }).select('name email profileImage doctorProfile availabilityStatus');

    // Compute active case load for each doctor
    const doctorLoads = await Promise.all(availableDoctors.map(async (doc) => {
        const activeCount = await ConsultationRequest.countDocuments({
            doctorId: doc._id,
            status: { $in: DOCTOR_ACTIVE_STATUSES }
        });
        return {
            _id: doc._id,
            name: doc.name,
            email: doc.email,
            profileImage: doc.profileImage,
            doctorProfile: doc.doctorProfile,
            availabilityStatus: doc.availabilityStatus,
            activeCases: activeCount
        };
    }));

    // Sort by active cases ascending
    doctorLoads.sort((a, b) => a.activeCases - b.activeCases);

    res.status(200).json(new ApiResponse(200, doctorLoads));
});

// @desc    Assign a Doctor to the case (supports auto/manual override)
// @route   POST /api/consultations/:requestId/assign-doctor
// @access  Private (Dietitian)
export const assignDoctor = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { doctorId, dietitianNotes } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    if (!request.dietitianId || request.dietitianId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: You are not the assigned dietitian for this case');
    }

    if (request.status !== 'UnderDietitianReview') {
        res.status(400);
        throw new Error('Doctor assignment is allowed only after dietitian review has started');
    }

    // Fetch pool
    const group = await DietitianDoctorGroup.findOne({ dietitianId: req.user._id });
    if (!group || !group.doctorIds || group.doctorIds.length === 0) {
        res.status(400);
        throw new Error('No doctors mapped in your pool. Please contact system admin.');
    }

    let selectedDoctorId = doctorId;

    // Handle Auto Assignment if doctorId is 'auto', omitted, or explicitly requested
    if (!selectedDoctorId || selectedDoctorId === 'auto') {
        const availableDoctors = await User.find({
            _id: { $in: group.doctorIds },
            role: 'doctor',
            availabilityStatus: 'Available'
        });

        if (availableDoctors.length === 0) {
            res.status(400);
            throw new Error('No doctors in your pool are currently Available.');
        }

        const doctorLoads = await Promise.all(availableDoctors.map(async (doc) => {
            const activeCount = await ConsultationRequest.countDocuments({
                doctorId: doc._id,
                status: { $in: DOCTOR_ACTIVE_STATUSES }
            });
            return { id: doc._id, activeCount };
        }));

        doctorLoads.sort((a, b) => a.activeCount - b.activeCount);
        selectedDoctorId = doctorLoads[0].id;
    } else {
        // Manual Selection Validation
        if (!group.doctorIds.map(id => id.toString()).includes(selectedDoctorId.toString())) {
            res.status(400);
            throw new Error('Not authorized: Selected doctor is not in your pool');
        }

        const targetDoctor = await User.findById(selectedDoctorId);
        if (!targetDoctor || targetDoctor.role !== 'doctor' || targetDoctor.availabilityStatus !== 'Available') {
            res.status(400);
            throw new Error('Selected doctor is not available at this time');
        }
    }

    ensureTransition(request.status, 'AssignedToDoctor');
    request.doctorId = selectedDoctorId;
    request.doctorAssignedAt = new Date();
    request.status = 'AssignedToDoctor';

    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Doctor successfully assigned to case'));
});

// @desc    Reassign a Doctor (Dietitian override)
// @route   POST /api/consultations/:requestId/reassign-doctor
// @access  Private (Dietitian)
export const reassignDoctor = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { doctorId, reason, dietitianNotes } = req.body;

    if (!reason) {
        res.status(400);
        throw new Error('Reassignment reason is required');
    }

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    // Check ownership
    if (!request.dietitianId || request.dietitianId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: You are not the assigned dietitian for this case');
    }

    if (!['AssignedToDoctor', 'UnderDoctorReview'].includes(request.status)) {
        res.status(400);
        throw new Error('Doctor reassignment is allowed only before a prescription is issued');
    }

    // Fetch pool
    const group = await DietitianDoctorGroup.findOne({ dietitianId: req.user._id });
    if (!group || !group.doctorIds || group.doctorIds.length === 0) {
        res.status(400);
        throw new Error('No doctors mapped in your pool');
    }

    const previousDoctorId = request.doctorId;
    let selectedDoctorId = doctorId;

    if (!selectedDoctorId || selectedDoctorId === 'auto') {
        const availableDoctors = await User.find({
            _id: { $in: group.doctorIds },
            role: 'doctor',
            availabilityStatus: 'Available'
        });

        if (availableDoctors.length === 0) {
            res.status(400);
            throw new Error('No doctors in your pool are currently Available.');
        }

        const doctorLoads = await Promise.all(availableDoctors.map(async (doc) => {
            const activeCount = await ConsultationRequest.countDocuments({
                doctorId: doc._id,
                status: { $in: DOCTOR_ACTIVE_STATUSES }
            });
            return { id: doc._id, activeCount };
        }));

        doctorLoads.sort((a, b) => a.activeCount - b.activeCount);
        selectedDoctorId = doctorLoads[0].id;
    } else {
        if (!group.doctorIds.map(id => id.toString()).includes(selectedDoctorId.toString())) {
            res.status(400);
            throw new Error('Selected doctor is not in your pool');
        }

        const targetDoctor = await User.findById(selectedDoctorId);
        if (!targetDoctor || targetDoctor.role !== 'doctor' || targetDoctor.availabilityStatus !== 'Available') {
            res.status(400);
            throw new Error('Selected doctor is not available at this time');
        }
    }

    // Update assignment history
    request.doctorReassignmentHistory.push({
        fromDoctorId: previousDoctorId,
        toDoctorId: selectedDoctorId,
        reason,
        reassignedAt: new Date()
    });

    request.doctorId = selectedDoctorId;
    request.doctorAssignedAt = new Date();
    request.status = 'AssignedToDoctor';

    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Doctor successfully reassigned'));
});

// @desc    Transfer Consultation to another dietitian
// @route   POST /api/consultations/:requestId/transfer
// @access  Private (Dietitian)
export const transferConsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { toDietitianId, reason } = req.body;

    if (!toDietitianId || !reason) {
        res.status(400);
        throw new Error('Target Dietitian ID and transfer reason are required');
    }

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    if (!request.dietitianId || request.dietitianId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: You are not the assigned dietitian for this case');
    }

    if (!['AssignedToDietitian', 'UnderDietitianReview'].includes(request.status)) {
        res.status(400);
        throw new Error('Dietitian transfer is allowed only before doctor assignment');
    }

    const targetDietitian = await User.findById(toDietitianId);
    if (!targetDietitian || targetDietitian.role !== 'dietitian' || targetDietitian.availabilityStatus !== 'Available') {
        res.status(400);
        throw new Error('Target dietitian is not available');
    }

    const previousDietitianId = request.dietitianId;

    // Record transfer history
    request.transferHistory.push({
        fromDietitianId: previousDietitianId,
        toDietitianId,
        reason,
        transferredAt: new Date()
    });

    request.dietitianId = toDietitianId;
    request.transferredAt = new Date();
    request.status = 'AssignedToDietitian'; // New dietitian starts their review phase

    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Consultation successfully transferred'));
});

// @desc    Close a Consultation Request
// @route   POST /api/consultations/:requestId/close
// @access  Private (Dietitian/Doctor)
export const closeConsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await ConsultationRequest.findById(requestId).populate('profileId', 'parentId');
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    // Check ownership — dietitian, doctor, OR parent who owns the profile
    const isDietitian = request.dietitianId && request.dietitianId.toString() === req.user._id.toString();
    const isDoctor = request.doctorId && request.doctorId.toString() === req.user._id.toString();
    const isParentOwner = req.user.role === 'parent' &&
        request.profileId &&
        request.profileId.parentId &&
        request.profileId.parentId.toString() === req.user._id.toString();

    if (!isDietitian && !isDoctor && !isParentOwner) {
        res.status(403);
        throw new Error('Not authorized to close this case');
    }

    if (request.status !== 'PrescriptionIssued') {
        res.status(400);
        throw new Error('Consultation can be closed only after a prescription is issued');
    }

    ensureTransition(request.status, 'Closed');
    request.status = 'Closed';
    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Consultation successfully closed'));
});

// @desc    Get active cases for assigned Dietitian
// @route   GET /api/consultations/dietitian/cases
// @access  Private (Dietitian)
export const getDietitianCases = asyncHandler(async (req, res) => {
    const cases = await ConsultationRequest.find({
        dietitianId: req.user._id,
        status: { $in: ACTIVE_STATUSES }
    })
    .populate('profileId', 'name dob gender age height weight avatar')
    .populate('doctorId', 'name email title')
    .populate('prescriptionId', 'title date')
    .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, cases));
});

// @desc    Get active cases for assigned Doctor
// @route   GET /api/consultations/doctor/cases
// @access  Private (Doctor)
export const getDoctorCases = asyncHandler(async (req, res) => {
    const cases = await ConsultationRequest.find({
        doctorId: req.user._id,
        status: { $in: DOCTOR_ACTIVE_STATUSES }
    })
    .populate('profileId', 'name dob gender age height weight avatar')
    .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, cases));
});

// @desc    Get child consultation history (Parent)
// @route   GET /api/consultations/parent/:profileId
// @access  Private (Parent)
export const getParentHistory = asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId);
    if (!profile) {
        res.status(404);
        throw new Error('Child Profile not found');
    }

    if (profile.parentId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized: This profile does not belong to you');
    }

    const history = await ConsultationRequest.find({ profileId })
        .populate('dietitianId', 'name email title')
        .populate('doctorId', 'name email title doctorProfile')
        .populate('prescriptionId')
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, history));
});

// @desc    Get single consultation details
// @route   GET /api/consultations/:requestId
// @access  Private (Parent/Dietitian/Doctor)
export const getConsultationDetails = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await ConsultationRequest.findById(requestId)
        .populate('profileId')
        .populate('dietitianId', 'name email title dietitianProfile')
        .populate('doctorId', 'name email title doctorProfile')
        .populate('prescriptionId');

    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    // Verify access rights
    const isParent = request.parentId.toString() === req.user._id.toString();
    const isDietitian = request.dietitianId && request.dietitianId._id.toString() === req.user._id.toString();
    const isDoctor = request.doctorId && request.doctorId._id.toString() === req.user._id.toString();

    if (!isParent && !isDietitian && !isDoctor) {
        res.status(403);
        throw new Error('Not authorized to access details of this consultation');
    }

    res.status(200).json(new ApiResponse(200, request));
});

// @desc    Get all available dietitians for transfer options
// @route   GET /api/consultations/dietitian/list-available
// @access  Private (Dietitian)
export const getAvailableDietitians = asyncHandler(async (req, res) => {
    const dietitians = await User.find({
        role: 'dietitian',
        availabilityStatus: 'Available',
        _id: { $ne: req.user._id }
    }).select('name email title dietitianProfile');

    res.status(200).json(new ApiResponse(200, dietitians));
});

// @desc    Update case status (Dietitian/Doctor status toggle)
// @route   PATCH /api/consultations/:requestId/status
// @access  Private (Dietitian/Doctor)
export const updateStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    const isDietitian = request.dietitianId && request.dietitianId.toString() === req.user._id.toString();
    const isDoctor = request.doctorId && request.doctorId.toString() === req.user._id.toString();

    if (!isDietitian && !isDoctor) {
        res.status(403);
        throw new Error('Not authorized to modify this case status');
    }

    if (isDietitian && status !== 'UnderDietitianReview') {
        res.status(400);
        throw new Error('Dietitians can only start dietitian review from the status endpoint');
    }

    if (isDoctor && status !== 'UnderDoctorReview') {
        res.status(400);
        throw new Error('Doctors can only start doctor review from the status endpoint');
    }

    ensureTransition(request.status, status);

    request.status = status;
    await request.save();

    res.status(200).json(new ApiResponse(200, request, `Status updated to ${status}`));
});

// @desc    Update dietitian notes without assignment or status transitions
// @route   PATCH /api/consultations/:requestId/dietitian-notes
// @access  Private (Dietitian)
export const updateDietitianNotes = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { notes } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    try {
        requireAssignedDietitian(request, req.user._id);
    } catch (error) {
        res.status(403);
        throw error;
    }

    request.dietitianNotes = notes || '';
    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Dietitian notes updated'));
});

// @desc    Update doctor notes without prescription or status transitions
// @route   PATCH /api/consultations/:requestId/doctor-notes
// @access  Private (Doctor)
export const updateDoctorNotes = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { notes } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    try {
        requireAssignedDoctor(request, req.user._id);
    } catch (error) {
        res.status(403);
        throw error;
    }

    if (!['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued'].includes(request.status)) {
        res.status(400);
        throw new Error('Doctor notes are available only after doctor assignment');
    }

    request.doctorNotes = notes || '';
    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Doctor notes updated'));
});

// @desc    Auto-generate video call summary using Gemini AI from a speech transcript
// @route   POST /api/consultations/:requestId/video-summary
// @access  Protected (parent, doctor, dietitian)
export const generateVideoCallSummary = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { transcript, durationMinutes } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    const newText = transcript ? transcript.trim() : '';
    
    // Find if there is an existing session created in the last 15 minutes
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const now = new Date();
    
    let activeLog = null;
    if (request.videoCallLogs.length > 0) {
        const lastLog = request.videoCallLogs[request.videoCallLogs.length - 1];
        if (now - new Date(lastLog.callDate) < FIFTEEN_MINUTES) {
            activeLog = lastLog;
        }
    }

    let fullTranscript = '';

    if (activeLog) {
        // Append to existing transcript
        if (newText) {
            const currentTranscript = activeLog.transcript || '';
            if (!currentTranscript) {
                activeLog.transcript = newText;
            } else if (!currentTranscript.includes(newText)) {
                // Avoid duplicating the exact same string if sent twice
                activeLog.transcript = `${currentTranscript}\n\n${newText}`.trim();
            }
        }
        activeLog.durationMinutes = Math.max(activeLog.durationMinutes, durationMinutes || 0);
        fullTranscript = activeLog.transcript;
    } else {
        // Create new session
        fullTranscript = newText;
        request.videoCallLogs.push({
            callDate: now,
            durationMinutes: durationMinutes || 0,
            transcript: fullTranscript,
            summary: '', // To be filled
            generatedBy: 'ai',
        });
        activeLog = request.videoCallLogs[request.videoCallLogs.length - 1];
    }

    await request.save();

    res.status(200).json(new ApiResponse(200, {
        log: activeLog,
        totalCalls: request.videoCallLogs.length,
    }, 'Video call transcript saved successfully'));
});

// @desc    Generate AI summary for a specific video call log
// @route   POST /api/consultations/:requestId/video-summary/:logId/generate-ai
// @access  Protected (doctor)
export const generateAiSummary = asyncHandler(async (req, res) => {
    const { requestId, logId } = req.params;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    const log = request.videoCallLogs.id(logId);
    if (!log) {
        res.status(404);
        throw new Error('Video call log not found');
    }

    if (!log.transcript || log.transcript.trim() === '') {
        res.status(400);
        throw new Error('No transcript available to summarize');
    }

    let aiSummary = '';
    try {
        const prompt = `You are a medical assistant summarizing a video consultation between a doctor and a parent.
Below is the raw transcript of the call. Please provide a clear, concise paragraph summarizing what was discussed. Do not output anything else.

Transcript:
"${log.transcript}"`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 250, temperature: 0.3 }
            }
        );

        aiSummary = response.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error?.response?.data || error.message);
        res.status(500);
        throw new Error('Failed to generate AI summary due to API error');
    }

    log.summary = aiSummary;
    log.generatedBy = 'ai';
    await request.save();

    res.status(200).json(new ApiResponse(200, { log }, 'AI summary generated successfully'));
});





// Delete a specific video call log (for cleanup)
export const deleteVideoCallLog = asyncHandler(async (req, res) => {
    const { requestId, logId } = req.params;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    const originalLength = request.videoCallLogs.length;
    request.videoCallLogs = request.videoCallLogs.filter(
        (log) => log._id.toString() !== logId
    );

    if (request.videoCallLogs.length === originalLength) {
        res.status(404);
        throw new Error('Video call log not found');
    }

    await request.save();
    res.status(200).json(new ApiResponse(200, { totalCalls: request.videoCallLogs.length }, 'Video call log deleted'));
});

// Clear ALL video call logs for a consultation (dev/cleanup only)
export const clearAllVideoCallLogs = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Consultation request not found');
    }

    request.videoCallLogs = [];
    await request.save();

    res.status(200).json(new ApiResponse(200, { totalCalls: 0 }, 'All video call logs cleared'));
});

// =========================================================================
// NEW APPOINTMENT-BASED TELECONSULTATION WORKFLOW CONTROLLERS
// =========================================================================

/**
 * 1. Parent requests video consultation
 * POST /api/consultations/teleconsult/request
 * Access: Private (Parent)
 */
export const requestTeleconsultation = asyncHandler(async (req, res) => {
    const { profileId, doctorId, reason, description, preferredDate, preferredTime } = req.body;
    const parentId = req.user._id;

    if (!profileId || !doctorId || !reason) {
        res.status(400);
        throw new Error('Child profile, Doctor, and Reason for consultation are required');
    }

    // 1. Verify child belongs to parent
    const child = await Profile.findOne({ _id: profileId, parentId });
    if (!child) {
        res.status(403);
        throw new Error('Unauthorized: Child profile does not belong to you');
    }

    // 2. Verify doctor exists and has doctor role
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
        res.status(404);
        throw new Error('Selected doctor not found or invalid');
    }

    // 3. Check for existing active teleconsultation
    const existingActive = await ConsultationRequest.findOne({
        profileId,
        doctorId,
        status: { $in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'STARTED', 'IN_PROGRESS'] }
    });

    if (existingActive) {
        res.status(400);
        throw new Error(`An active consultation request (${existingActive.status}) already exists with Dr. ${doctor.name} for ${child.name}`);
    }

    // 4. Create consultation with status REQUESTED
    const consultation = await ConsultationRequest.create({
        profileId,
        parentId,
        doctorId,
        reason: reason.trim(),
        description: description ? description.trim() : '',
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime || '',
        status: 'REQUESTED'
    });

    // 5. Notify doctor
    const notificationMsg = `New video consultation requested for ${child.name} by ${req.user.name}. Reason: "${reason.slice(0, 50)}${reason.length > 50 ? '...' : ''}"`;
    await Notification.create({
        recipientId: doctor._id,
        senderId: parentId,
        type: 'doctor_message',
        message: notificationMsg,
    });

    emitToUser(doctor._id, 'teleconsult-update', {
        type: 'REQUESTED',
        requestId: consultation._id,
        message: notificationMsg
    });

    const populated = await ConsultationRequest.findById(consultation._id)
        .populate('profileId', 'name age gender avatar allergies healthConditions')
        .populate('doctorId', 'name email doctorProfile profileImage');

    res.status(201).json(new ApiResponse(201, populated, 'Video consultation request submitted successfully'));
});

/**
 * 2. Get Doctor's teleconsultations
 * GET /api/consultations/teleconsult/doctor
 * Access: Private (Doctor)
 */
export const getDoctorTeleconsultations = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;

    const consultations = await ConsultationRequest.find({
        doctorId,
        status: { $in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'] }
    })
        .populate('profileId', 'name age gender height weight avatar allergies healthConditions')
        .populate('parentId', 'name email phone parentProfile')
        .sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json(new ApiResponse(200, consultations, 'Doctor teleconsultations retrieved'));
});

/**
 * 3. Get Parent's teleconsultations
 * GET /api/consultations/teleconsult/parent
 * Access: Private (Parent)
 */
export const getParentTeleconsultations = asyncHandler(async (req, res) => {
    const parentId = req.user._id;

    const consultations = await ConsultationRequest.find({
        parentId,
        status: { $in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'] }
    })
        .populate('profileId', 'name age gender height weight avatar allergies healthConditions')
        .populate('doctorId', 'name email doctorProfile profileImage')
        .sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json(new ApiResponse(200, consultations, 'Parent teleconsultations retrieved'));
});

/**
 * 4. Doctor Reviews Request (Accept / Reject)
 * POST /api/consultations/teleconsult/:requestId/review
 * Access: Private (Doctor)
 */
export const reviewTeleconsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { action, rejectionReason } = req.body;
    const doctorId = req.user._id;

    if (!['ACCEPT', 'REJECT'].includes(action)) {
        res.status(400);
        throw new Error('Action must be either ACCEPT or REJECT');
    }

    const consultation = await ConsultationRequest.findOne({ _id: requestId, doctorId })
        .populate('profileId', 'name')
        .populate('doctorId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation request not found or unauthorized');
    }

    if (consultation.status !== 'REQUESTED') {
        res.status(400);
        throw new Error(`Cannot review consultation with status '${consultation.status}'. Must be 'REQUESTED'.`);
    }

    if (action === 'ACCEPT') {
        consultation.status = 'ACCEPTED';
        await consultation.save();

        const msg = `Dr. ${consultation.doctorId.name} accepted your consultation request for ${consultation.profileId.name}. You will be notified once the appointment is scheduled.`;
        await Notification.create({
            recipientId: consultation.parentId,
            senderId: doctorId,
            type: 'appointment_update',
            message: msg
        });

        emitToUser(consultation.parentId, 'teleconsult-update', {
            type: 'ACCEPTED',
            requestId: consultation._id,
            message: msg
        });

        res.status(200).json(new ApiResponse(200, consultation, 'Consultation request accepted. Next: schedule appointment.'));
    } else {
        consultation.status = 'REJECTED';
        consultation.rejectionReason = rejectionReason || 'Doctor unavailable at requested time';
        await consultation.save();

        const msg = `Dr. ${consultation.doctorId.name} declined the consultation request: "${consultation.rejectionReason}".`;
        await Notification.create({
            recipientId: consultation.parentId,
            senderId: doctorId,
            type: 'appointment_update',
            message: msg
        });

        emitToUser(consultation.parentId, 'teleconsult-update', {
            type: 'REJECTED',
            requestId: consultation._id,
            message: msg
        });

        res.status(200).json(new ApiResponse(200, consultation, 'Consultation request rejected'));
    }
});

/**
 * 5. Doctor Schedules Appointment
 * POST /api/consultations/teleconsult/:requestId/schedule
 * Access: Private (Doctor)
 */
export const scheduleTeleconsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { scheduledDate, scheduledTime, scheduledDuration, scheduledNotes } = req.body;
    const doctorId = req.user._id;

    if (!scheduledDate || !scheduledTime) {
        res.status(400);
        throw new Error('Scheduled date and start time are required');
    }

    const consultation = await ConsultationRequest.findOne({ _id: requestId, doctorId })
        .populate('profileId', 'name')
        .populate('doctorId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation not found or unauthorized');
    }

    if (!['ACCEPTED', 'REQUESTED', 'SCHEDULED'].includes(consultation.status)) {
        res.status(400);
        throw new Error(`Cannot schedule consultation in status '${consultation.status}'`);
    }

    // Validate that schedule is not in the past
    // scheduledDate can be "YYYY-MM-DD" and scheduledTime "HH:MM"
    const parsedDate = new Date(`${scheduledDate.split('T')[0]}T${scheduledTime}`);
    if (isNaN(parsedDate.getTime())) {
        res.status(400);
        throw new Error('Invalid date or time format');
    }

    // Allow a 5-minute grace period for immediate schedules
    if (parsedDate.getTime() < Date.now() - 5 * 60 * 1000) {
        res.status(400);
        throw new Error('Scheduled appointment cannot be set in the past');
    }

    // Check for conflicting appointments for the same doctor at the same slot
    const durationMins = Number(scheduledDuration) || 30;
    const slotEnd = new Date(parsedDate.getTime() + durationMins * 60 * 1000);

    const conflict = await ConsultationRequest.findOne({
        _id: { $ne: consultation._id },
        doctorId,
        status: 'SCHEDULED',
        scheduledDate: {
            $gte: new Date(parsedDate.getTime() - 29 * 60 * 1000),
            $lte: slotEnd
        }
    });

    if (conflict) {
        res.status(400);
        throw new Error(`Schedule conflict: You already have another consultation scheduled around this time (${conflict.scheduledTime || 'same slot'}).`);
    }

    consultation.scheduledDate = parsedDate;
    consultation.scheduledTime = scheduledTime;
    consultation.scheduledDuration = durationMins;
    consultation.scheduledNotes = scheduledNotes ? scheduledNotes.trim() : '';
    consultation.status = 'SCHEDULED';
    await consultation.save();

    const formattedDate = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const msg = `Video consultation with Dr. ${consultation.doctorId.name} scheduled for ${formattedDate} at ${scheduledTime} (${durationMins} mins).`;
    await Notification.create({
        recipientId: consultation.parentId,
        senderId: doctorId,
        type: 'appointment_update',
        message: msg
    });

    emitToUser(consultation.parentId, 'teleconsult-update', {
        type: 'SCHEDULED',
        requestId: consultation._id,
        scheduledDate: parsedDate,
        scheduledTime,
        message: msg
    });

    res.status(200).json(new ApiResponse(200, consultation, 'Consultation appointment scheduled successfully'));
});

/**
 * 6. Doctor Starts Video Consultation (Gatekeeper Start)
 * POST /api/consultations/teleconsult/:requestId/start
 * Access: Private (Doctor ONLY)
 */
export const startTeleconsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const doctorId = req.user._id;

    const consultation = await ConsultationRequest.findOne({ _id: requestId, doctorId })
        .populate('profileId', 'name')
        .populate('doctorId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation not found or unauthorized');
    }

    if (!['SCHEDULED', 'STARTED', 'IN_PROGRESS'].includes(consultation.status)) {
        res.status(400);
        throw new Error(`Cannot start consultation in status '${consultation.status}'. Must be 'SCHEDULED'.`);
    }

    // Start Window Validation:
    // Allow doctor to start from 15 minutes before scheduled start time up to duration + 60 minutes after
    if (consultation.scheduledDate) {
        const scheduledStart = new Date(consultation.scheduledDate).getTime();
        const now = Date.now();
        const earlyWindowMs = 15 * 60 * 1000; // 15 mins early
        const lateWindowMs = ((consultation.scheduledDuration || 30) + 60) * 60 * 1000;

        if (now < scheduledStart - earlyWindowMs) {
            const minsLeft = Math.ceil((scheduledStart - now) / 60000);
            res.status(400);
            throw new Error(`Cannot start consultation yet. Appointment is scheduled in ${minsLeft} minutes (${consultation.scheduledTime}). Window opens 15 mins prior.`);
        }
    }

    // Generate room ID if not already generated
    if (!consultation.callRoomId) {
        consultation.callRoomId = `teleconsult-${consultation._id}-${Date.now()}`;
    }

    consultation.status = 'STARTED';
    if (!consultation.startedAt) {
        consultation.startedAt = new Date();
    }
    await consultation.save();

    // Notify parent immediately
    const alertMsg = `🔔 ACTION REQUIRED: Dr. ${consultation.doctorId.name} has started the video consultation for ${consultation.profileId.name}! Click to join now.`;
    await Notification.create({
        recipientId: consultation.parentId,
        senderId: doctorId,
        type: 'doctor_message',
        message: alertMsg
    });

    emitToUser(consultation.parentId, 'consultation-started', {
        requestId: consultation._id,
        callRoomId: consultation.callRoomId,
        doctorName: consultation.doctorId.name,
        childName: consultation.profileId.name,
        message: alertMsg
    });

    emitToUser(consultation.parentId, 'teleconsult-update', {
        type: 'STARTED',
        requestId: consultation._id,
        callRoomId: consultation.callRoomId
    });

    res.status(200).json(new ApiResponse(200, {
        callRoomId: consultation.callRoomId,
        status: consultation.status,
        startedAt: consultation.startedAt,
        consultation
    }, 'Video consultation started successfully. Waiting for parent to join.'));
});

/**
 * 7. Join Video Consultation (Strict Gatekeeper Join)
 * POST /api/consultations/teleconsult/:requestId/join
 * Access: Private (Doctor or Parent belonging to consultation)
 */
export const joinTeleconsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const consultation = await ConsultationRequest.findById(requestId)
        .populate('profileId', 'name')
        .populate('doctorId', 'name')
        .populate('parentId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation not found');
    }

    const isAssignedDoctor = consultation.doctorId?._id?.toString() === userId;
    const isChildParent = consultation.parentId?._id?.toString() === userId;

    if (!isAssignedDoctor && !isChildParent) {
        res.status(403);
        throw new Error('Access Denied: You do not belong to this consultation session');
    }

    // STRICT PARENT JOIN GATE:
    // Parent CANNOT join before Doctor has started the consultation!
    if (userRole === 'parent') {
        if (['REQUESTED', 'ACCEPTED'].includes(consultation.status)) {
            res.status(403);
            throw new Error('Access Denied: This consultation is not scheduled or started yet.');
        }

        if (consultation.status === 'SCHEDULED') {
            res.status(403);
            throw new Error('Access Denied: The doctor has not started the video consultation yet. Please wait until your doctor starts the call.');
        }

        if (['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(consultation.status)) {
            res.status(403);
            throw new Error('Access Denied: This video consultation has already ended or is no longer active.');
        }
    }

    // When parent joins an already STARTED consultation, move to IN_PROGRESS
    if (consultation.status === 'STARTED' && userRole === 'parent') {
        consultation.status = 'IN_PROGRESS';
        await consultation.save();

        emitToUser(consultation.doctorId._id, 'teleconsult-update', {
            type: 'IN_PROGRESS',
            requestId: consultation._id,
            message: `${consultation.parentId.name} has joined the consultation.`
        });
    }

    res.status(200).json(new ApiResponse(200, {
        callRoomId: consultation.callRoomId,
        status: consultation.status,
        consultation
    }, 'Access granted to video consultation'));
});

/**
 * 8. Doctor Ends Consultation
 * POST /api/consultations/teleconsult/:requestId/end
 * Access: Private (Doctor ONLY)
 */
export const endTeleconsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { doctorNotes, summary, recommendations, medicinesDiscussed } = req.body;
    const doctorId = req.user._id;

    const consultation = await ConsultationRequest.findOne({ _id: requestId, doctorId })
        .populate('profileId', 'name')
        .populate('doctorId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation not found or unauthorized');
    }

    if (!['STARTED', 'IN_PROGRESS', 'SCHEDULED'].includes(consultation.status)) {
        res.status(400);
        throw new Error(`Cannot end consultation in status '${consultation.status}'`);
    }

    const now = new Date();
    const durationMs = consultation.startedAt ? now.getTime() - consultation.startedAt.getTime() : 0;
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    consultation.status = 'COMPLETED';
    consultation.endedAt = now;
    consultation.actualDurationMinutes = durationMinutes;
    if (doctorNotes) consultation.doctorNotes = doctorNotes.trim();

    // Also persist into videoCallLogs so all clinical audit logs remain populated
    consultation.videoCallLogs.push({
        callDate: now,
        durationMinutes,
        doctorNotes: doctorNotes || '',
        summary: summary || `Teleconsultation conducted by Dr. ${consultation.doctorId.name} for ${consultation.profileId.name}. Reason: ${consultation.reason}`,
        recommendations: recommendations || [],
        medicinesDiscussed: medicinesDiscussed || [],
        generatedBy: 'Doctor'
    });

    await consultation.save();

    // Emit call-ended to video room via Socket.IO
    if (consultation.callRoomId) {
        emitToRoom(consultation.callRoomId, 'call-ended', {
            notes: doctorNotes || '',
            durationMinutes
        });
    }

    // Notify parent
    const finishMsg = `Your video consultation with Dr. ${consultation.doctorId.name} has concluded. Total duration: ${durationMinutes} mins.`;
    await Notification.create({
        recipientId: consultation.parentId,
        senderId: doctorId,
        type: 'appointment_update',
        message: finishMsg
    });

    emitToUser(consultation.parentId, 'teleconsult-update', {
        type: 'COMPLETED',
        requestId: consultation._id,
        message: finishMsg
    });

    res.status(200).json(new ApiResponse(200, consultation, 'Consultation completed and locked successfully.'));
});

/**
 * 9. Get Live Consultation Status & Permissions
 * GET /api/consultations/teleconsult/:requestId/status
 * Access: Private (Doctor or Parent)
 */
export const getTeleconsultationStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const consultation = await ConsultationRequest.findById(requestId)
        .populate('profileId', 'name avatar')
        .populate('doctorId', 'name doctorProfile profileImage')
        .populate('parentId', 'name');

    if (!consultation) {
        res.status(404);
        throw new Error('Consultation not found');
    }

    const isAssignedDoctor = consultation.doctorId?._id?.toString() === userId;
    const isChildParent = consultation.parentId?._id?.toString() === userId;

    if (!isAssignedDoctor && !isChildParent) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const isStarted = ['STARTED', 'IN_PROGRESS'].includes(consultation.status);
    const canJoin = isStarted || (userRole === 'doctor' && consultation.status === 'SCHEDULED');

    res.status(200).json(new ApiResponse(200, {
        _id: consultation._id,
        status: consultation.status,
        callRoomId: isStarted ? consultation.callRoomId : null,
        isDoctorStarted: isStarted,
        canJoin,
        scheduledDate: consultation.scheduledDate,
        scheduledTime: consultation.scheduledTime,
        scheduledDuration: consultation.scheduledDuration,
        doctorNotes: consultation.doctorNotes,
        rejectionReason: consultation.rejectionReason,
        actualDurationMinutes: consultation.actualDurationMinutes,
        doctor: consultation.doctorId,
        child: consultation.profileId,
        parent: consultation.parentId
    }, 'Status retrieved'));
});

