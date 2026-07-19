import ConsultationRequest from '../models/ConsultationRequest.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import Prescription from '../models/Prescription.model.js';
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

    const sessionNum = (request.videoCallLogs?.length || 0) + 1;
    const hasTranscript = transcript && transcript.trim().length > 20;

    let summary = 'No transcript was captured for this session.';

    if (hasTranscript) {
        const prompt = `You are a medical assistant. The following is a transcript from a video consultation between a doctor and a patient/parent.

Transcript:
"${transcript}"

Write a clear, concise summary (3-5 sentences) of what was discussed in this call. Focus on what both parties talked about — symptoms mentioned, concerns raised, what the doctor said, and any decisions made.

Respond with ONLY the summary text. No JSON, no headers, no bullet points — just plain paragraph text.`;

        try {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
                    }),
                }
            );

            if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text.trim()) summary = text.trim();
            } else {
                const errBody = await geminiRes.text();
                console.error('Gemini API error:', geminiRes.status, errBody);
            }
        } catch (err) {
            console.error('Gemini AI summarization failed:', err.message);
        }
    }

    request.videoCallLogs.push({
        callDate: new Date(),
        durationMinutes: durationMinutes || 0,
        summary,
        generatedBy: 'AI',
    });
    await request.save();

    res.status(200).json(new ApiResponse(200, {
        log: request.videoCallLogs[request.videoCallLogs.length - 1],
        totalCalls: request.videoCallLogs.length,
    }, 'Video call summary generated successfully'));
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
