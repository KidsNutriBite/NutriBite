import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import User from '../models/User.model.js';

// @desc    Get pending access requests
// @route   GET /api/access/requests
// @access  Private (Parent)
export const getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await DoctorAccess.find({
        parentId: req.user._id,
        status: 'pending'
    }).populate('doctorId', 'name email')
        .populate('profileId', 'name');

    res.status(200).json(new ApiResponse(200, requests));
});

// @desc    Approve access request
// @route   PUT /api/access/approve/:requestId
// @access  Private (Parent)
export const approveRequest = asyncHandler(async (req, res) => {
    const { profileId } = req.body;
    const requestId = req.params.requestId;

    const request = await DoctorAccess.findOne({
        _id: requestId,
        parentId: req.user._id,
        status: { $in: ['pending', 'restricted'] }
    });

    if (!request) {
        res.status(404);
        throw new Error('Request not found or already processed');
    }

    if (request.status === 'pending') {
        if (!profileId) {
            res.status(400);
            throw new Error('Please select a child profile to share');
        }
        // Initial approval: Pending -> Restricted
        request.status = 'restricted';
        request.profileId = profileId;
    } else if (request.status === 'restricted' && request.fullAccessRequested) {
        // Upgrading: Restricted -> Active (Full Access)
        request.status = 'active';
    } else {
        res.status(400);
        throw new Error('Invalid request or full access already granted');
    }

    // Clear request flag but keep message for history
    request.fullAccessRequested = false;
    await request.save();

    res.status(200).json(new ApiResponse(200, request, `Access ${request.status === 'active' ? 'upgraded to full' : 'granted'} successfully`));
});

// @desc    Reject access request
// @route   PUT /api/access/reject/:requestId
// @access  Private (Parent)
export const rejectRequest = asyncHandler(async (req, res) => {
    const request = await DoctorAccess.findOne({
        _id: req.params.requestId,
        parentId: req.user._id,
        status: 'pending'
    });

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    request.status = 'rejected';
    await request.save();

    res.status(200).json(new ApiResponse(200, null, 'Request rejected'));
});

// @desc    Invite/Grant Access to a Doctor
// @route   POST /api/access/invite
// @access  Private (Parent)
export const inviteDoctor = asyncHandler(async (req, res) => {
    const { email, profileId, message } = req.body;

    if (!email || !profileId) {
        res.status(400);
        throw new Error('Doctor email and Child Profile are required');
    }

    // 1. Find Doctor by email
    const doctor = await User.findOne({ email: email.toLowerCase(), role: 'doctor' });

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found with this email');
    }

    // 2. Check if access already exists
    const existingAccess = await DoctorAccess.findOne({
        doctorId: doctor._id,
        parentId: req.user._id,
        profileId: profileId
    });

    if (existingAccess) {
        if (existingAccess.status === 'active') {
            res.status(400);
            throw new Error('Doctor already has full access to this child');
        }

        // Even if re-inviting or reactivating, start with RESTRICTED access
        existingAccess.status = 'restricted';
        existingAccess.message = message || existingAccess.message || '';
        existingAccess.profileId = profileId; // Ensure it's linked to the correct profile
        existingAccess.fullAccessRequested = false;
        existingAccess.doctorMessage = '';

        await existingAccess.save();
        return res.status(200).json(new ApiResponse(200, existingAccess, 'Invitation sent. Access is limited to basic details until full access is granted.'));
    }

    // 3. Create new Access Record (Pending with Consultation Message)
    const newAccess = await DoctorAccess.create({
        doctorId: doctor._id,
        parentId: req.user._id,
        profileId: profileId,
        message: message || '',
        status: 'restricted'
    });

    res.status(201).json(new ApiResponse(201, newAccess, 'Consultation invitation sent. Waiting for doctor to view.'));
});

// @desc    Get list of doctors with active access
// @route   GET /api/access/list
// @access  Private (Parent)
export const getAccessList = asyncHandler(async (req, res) => {
    const accessList = await DoctorAccess.find({
        parentId: req.user._id,
        status: { $in: ['active', 'restricted'] },
        profileId: { $ne: null }
    })
        .populate('doctorId', 'name email doctorProfile')
        .populate('profileId', 'name avatar');

    res.status(200).json(new ApiResponse(200, accessList));
});

// @desc    Revoke access
// @route   PUT /api/access/revoke/:requestId
// @access  Private (Parent)
export const revokeAccess = asyncHandler(async (req, res) => {
    const access = await DoctorAccess.findOne({
        _id: req.params.requestId,
        parentId: req.user._id
    });

    if (!access) {
        res.status(404);
        throw new Error('Access record not found');
    }

    // Instead of deleting, we set to rejected/revoked to keep history if needed
    // Or we can just delete. Let's start with hard delete for cleaner state or use 'rejected' as revoked.
    // The requirement says "revoke", so let's remove permissions.

    // Option A: Delete
    // await access.deleteOne();

    // Option B: Set status to rejected (soft delete)
    access.status = 'rejected';
    await access.save();

    res.status(200).json(new ApiResponse(200, null, 'Access revoked successfully'));
});
