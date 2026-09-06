import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import LoginAudit from '../models/LoginAudit.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import logAuditEvent from '../utils/auditLogger.js';

// @desc    Get Admin Dashboard Stats & Overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
    // Aggregated user counts by role
    const totalUsers = await User.countDocuments();
    const parentsCount = await User.countDocuments({ role: 'parent' });
    const doctorsCount = await User.countDocuments({ role: 'doctor' });
    const dietitiansCount = await User.countDocuments({ role: 'dietitian' });
    const adminsCount = await User.countDocuments({ role: 'admin' });

    // Status counts
    const activeUsersCount = await User.countDocuments({ status: 'Active' });
    const inactiveUsersCount = await User.countDocuments({ status: { $in: ['Inactive', 'Suspended'] } });
    const twoFAEnabledCount = await User.countDocuments({ is2FAEnabled: true });

    // Total child profiles tracked
    const totalProfilesCount = await Profile.countDocuments();

    // Recent user registrations (last 6)
    const recentRegistrations = await User.find({})
        .select('name email role status is2FAEnabled createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .limit(6);

    // Recent login/security activity (last 8)
    const recentActivity = await LoginAudit.find({})
        .sort({ createdAt: -1 })
        .limit(8);

    res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalUsers,
                parentsCount,
                doctorsCount,
                dietitiansCount,
                adminsCount,
                activeUsersCount,
                inactiveUsersCount,
                twoFAEnabledCount,
                totalProfilesCount,
            },
            recentRegistrations,
            recentActivity,
        }, 'Admin dashboard metrics loaded successfully')
    );
});

// @desc    Get all users with search, role, status filters and pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAdminUsers = asyncHandler(async (req, res) => {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;

    const query = {};

    if (role && role !== 'all') {
        query.role = role.toLowerCase();
    }

    if (status && status !== 'all') {
        query.status = status;
    }

    if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageSize;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password -loginOTPHash -resetOtp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

    // Enhance users with related child/patient counts
    const enhancedUsers = await Promise.all(
        users.map(async (u) => {
            const userObj = u.toObject();
            if (u.role === 'parent') {
                userObj.childCount = await Profile.countDocuments({ parentId: u._id });
            } else if (u.role === 'doctor') {
                userObj.connectionCount = await DoctorAccess.countDocuments({ doctorId: u._id, status: 'Active' });
            } else if (u.role === 'dietitian') {
                userObj.caseCount = await ConsultationRequest.countDocuments({ dietitianId: u._id });
            }
            return userObj;
        })
    );

    res.status(200).json(
        new ApiResponse(200, {
            users: enhancedUsers,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / pageSize) || 1,
                limit: pageSize,
            },
        }, 'Users retrieved successfully')
    );
});

// @desc    Get single user details for administrative inspection
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getAdminUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -loginOTPHash -resetOtp');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const userObj = user.toObject();

    // Attach contextual domain records
    if (user.role === 'parent') {
        userObj.children = await Profile.find({ parentId: user._id })
            .select('name age gender avatar currentWeight currentHeight createdAt');
    } else if (user.role === 'doctor') {
        userObj.connectedPatients = await DoctorAccess.find({ doctorId: user._id })
            .populate('profileId', 'name age')
            .populate('parentId', 'name email');
    } else if (user.role === 'dietitian') {
        userObj.assignedCases = await ConsultationRequest.find({ dietitianId: user._id })
            .populate('childId', 'name age')
            .populate('parentId', 'name email')
            .limit(10);
    }

    // Recent login audit history for this specific user
    userObj.recentActivity = await LoginAudit.find({
        $or: [{ userId: user._id }, { email: user.email }]
    })
        .sort({ createdAt: -1 })
        .limit(10);

    res.status(200).json(new ApiResponse(200, userObj, 'User details retrieved successfully'));
});

// @desc    Update user status (Active / Inactive / Suspended)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
export const updateAdminUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const targetUserId = req.params.id;

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status. Must be Active, Inactive, or Suspended.');
    }

    // Prevent admin from deactivating/suspending own account
    if (req.user._id.toString() === targetUserId && status !== 'Active') {
        res.status(400);
        throw new Error('You cannot deactivate or suspend your own administrator account.');
    }

    const user = await User.findById(targetUserId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await logAuditEvent({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        action: 'USER_STATUS_CHANGE',
        status: 'SUCCESS',
        details: `Updated ${user.email} (${user.role}) status from ${oldStatus} to ${status}`,
        req,
    });

    res.status(200).json(
        new ApiResponse(200, {
            _id: user._id,
            email: user.email,
            status: user.status,
        }, `User account status updated to ${status}`)
    );
});

// @desc    Toggle 2FA for a user (or admin)
// @route   PATCH /api/admin/users/:id/2fa
// @access  Private (Admin)
export const toggleUser2FA = asyncHandler(async (req, res) => {
    const { is2FAEnabled } = req.body;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.is2FAEnabled = Boolean(is2FAEnabled);
    await user.save();

    await logAuditEvent({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        action: 'USER_STATUS_CHANGE',
        status: 'SUCCESS',
        details: `Set 2FA status to ${user.is2FAEnabled} for ${user.email}`,
        req,
    });

    res.status(200).json(
        new ApiResponse(200, {
            _id: user._id,
            email: user.email,
            is2FAEnabled: user.is2FAEnabled,
        }, `Two-factor verification ${user.is2FAEnabled ? 'enabled' : 'disabled'} successfully`)
    );
});

// @desc    Delete user account safely
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteAdminUser = asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;

    // Guardrail: Cannot delete yourself
    if (req.user._id.toString() === targetUserId) {
        res.status(400);
        throw new Error('You cannot delete your own logged-in administrator account.');
    }

    const user = await User.findById(targetUserId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Guardrail: Ensure system always retains at least one active Admin
    if (user.role === 'admin') {
        const remainingAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } });
        if (remainingAdmins === 0) {
            res.status(400);
            throw new Error('Cannot delete this administrator because at least one active admin is required.');
        }
    }

    // Clean up or cascade related records safely
    if (user.role === 'parent') {
        await Profile.deleteMany({ parentId: user._id });
        await DoctorAccess.deleteMany({ parentId: user._id });
    } else if (user.role === 'doctor') {
        await DoctorAccess.deleteMany({ doctorId: user._id });
    }

    await User.findByIdAndDelete(targetUserId);

    await logAuditEvent({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        action: 'USER_DELETED',
        status: 'SUCCESS',
        details: `Deleted user ${user.email} (${user.name}, ${user.role})`,
        req,
    });

    res.status(200).json(new ApiResponse(200, null, 'User and associated data removed safely'));
});

// @desc    Get Platform Activity / Login Audit Logs
// @route   GET /api/admin/activity
// @access  Private (Admin)
export const getAdminActivityLogs = asyncHandler(async (req, res) => {
    const { search = '', action = '', status = '', page = 1, limit = 25 } = req.query;

    const query = {};

    if (action && action !== 'all') {
        query.action = action;
    }

    if (status && status !== 'all') {
        query.status = status;
    }

    if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ email: regex }, { name: regex }, { details: regex }, { ipAddress: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageSize;

    const total = await LoginAudit.countDocuments(query);
    const logs = await LoginAudit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

    res.status(200).json(
        new ApiResponse(200, {
            logs,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / pageSize) || 1,
                limit: pageSize,
            },
        }, 'Activity logs retrieved successfully')
    );
});

// @desc    Get Security Overview & Configuration Status
// @route   GET /api/admin/security
// @access  Private (Admin)
export const getAdminSecurityOverview = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const twoFAEnabledCount = await User.countDocuments({ is2FAEnabled: true });
    const lockedAccountsCount = await User.countDocuments({ accountLockedUntil: { $gt: new Date() } });
    const recentFailedLogins = await LoginAudit.countDocuments({
        action: { $in: ['LOGIN_FAILED', '2FA_FAILED'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const recentSuccessfulLogins = await LoginAudit.countDocuments({
        action: 'LOGIN_SUCCESS',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.status(200).json(
        new ApiResponse(200, {
            overview: {
                totalUsers,
                twoFAEnabledCount,
                twoFAAdoptionRate: totalUsers > 0 ? Math.round((twoFAEnabledCount / totalUsers) * 100) : 0,
                lockedAccountsCount,
                recentFailedLogins24h: recentFailedLogins,
                recentSuccessfulLogins24h: recentSuccessfulLogins,
                parent2FAMandatory: process.env.PARENT_2FA_MANDATORY === 'true',
                smsProvider: process.env.SMS_PROVIDER || 'console',
                jwtExpire: process.env.JWT_EXPIRE || '30d',
            },
            currentAdmin: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                is2FAEnabled: req.user.is2FAEnabled,
                lastLoginAt: req.user.lastLoginAt,
            }
        }, 'Security overview loaded successfully')
    );
});
