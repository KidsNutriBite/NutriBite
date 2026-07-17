
import User from '../models/User.model.js';
import generateToken from '../services/jwt.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verify2FASchema, resend2FASchema } from '../validators/auth.schema.js';
import { sendEmail } from '../services/email.service.js';
import { sendSMS } from '../services/sms.service.js';
import env from '../config/env.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400);
        const errorMessages = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(errorMessages);
    }

    const { name, email, password, role, title, ...roleData } = validation.data;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Default Avatar Logic
    let profileImage = '';

    // Construct user object based on role
    const userData = {
        name,
        email,
        password,
        role,
        title,
        profileImage,
        phone: roleData.phoneNumber || '', // Sync phone to root
    };

    if (role === 'parent') {
        userData.parentProfile = {
            phoneNumber: roleData.phoneNumber,
            city: roleData.city,
            relationToChild: roleData.relationToChild,
        };
    } else if (role === 'doctor') {
        userData.doctorProfile = {
            specialization: roleData.specialization,
            hospitalName: roleData.hospitalName,
            experienceYears: roleData.experienceYears,
            registrationId: roleData.registrationId,
        };
    } else if (role === 'dietitian') {
        userData.dietitianProfile = {
            specialization: roleData.specialization,
            experienceYears: roleData.experienceYears,
            registrationId: roleData.registrationId,
        };
    }

    const user = await User.create(userData);

    if (user) {
        const token = generateToken(user._id, user.role);
        res.status(201).json(
            new ApiResponse(201, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    availabilityStatus: user.availabilityStatus,
                },
                token,
            })
        );
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Check account lockout
        if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
            const waitTime = Math.ceil((user.accountLockedUntil - Date.now()) / 1000 / 60);
            res.status(403);
            throw new Error(`Account locked due to multiple failed OTP attempts. Please try again in ${waitTime} minutes.`);
        }

        // Determine if 2FA is required
        const isDoctor = user.role === 'doctor';
        const isParentMandatory = user.role === 'parent' && env.PARENT_2FA_MANDATORY === 'true';
        const isParentEnabled = user.role === 'parent' && user.is2FAEnabled;
        const requires2FA = isDoctor || isParentMandatory || isParentEnabled;

        if (requires2FA) {
            // Generate 6 digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Hash OTP
            const salt = await bcrypt.genSalt(10);
            user.loginOTPHash = await bcrypt.hash(otp, salt);
            user.loginOTPExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
            user.loginOTPAttempts = 0;
            user.loginOTPLastSentAt = Date.now();
            await user.save();

            // Send OTP via Email
            const emailMessage = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4c799a;">NutriKid Login Verification</h2>
                    <p>To complete your login, please enter the following verification code:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4c799a; background: #f0f7fc; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                    <p>This code is valid for <strong>5 minutes</strong>. If you did not request this code, please secure your account.</p>
                </div>
            `;
            await sendEmail(user.email, 'NutriKid - 2FA Login Code', emailMessage);

            // Send OTP via SMS (if phone is set)
            const phoneNum = user.phone || (user.role === 'parent' ? user.parentProfile?.phoneNumber : null);
            if (phoneNum) {
                const smsMessage = `Your NutriKid login verification code is ${otp}. Valid for 5 minutes.`;
                await sendSMS(phoneNum, smsMessage);
            }

            return res.status(200).json(
                new ApiResponse(200, {
                    twoFactorRequired: true,
                    email: user.email,
                    message: 'Two-factor verification code sent successfully.'
                })
            );
        }

        // Standard direct login (if 2FA is not required)
        const token = generateToken(user._id, user.role);
        res.json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    availabilityStatus: user.availabilityStatus,
                },
                token,
            })
        );
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(new ApiResponse(200, user));
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });

    if (user) {
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        user.resetOtp = await bcrypt.hash(otp, salt);

        // Use configured expiry or default to 10 minutes
        const otpExpiresSeconds = parseInt(process.env.OTP_EXPIRES_SECONDS) || 600;
        user.resetOtpExpiresAt = Date.now() + otpExpiresSeconds * 1000;

        await user.save();

        const message = `
            <h1>Password Reset Request</h1>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
        `;

        await sendEmail(user.email, 'NutriKid - Password Reset OTP', message);
    }

    // Always return success to prevent email enumeration
    res.status(200).json(new ApiResponse(200, { message: 'If email exists, OTP sent' }));
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const { email, otp, newPassword } = validation.data;
    const user = await User.findOne({
        email,
        resetOtpExpiresAt: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);

    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid OTP');
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetOtp = undefined;
    user.resetOtpExpiresAt = undefined;

    await user.save();

    res.status(200).json(new ApiResponse(200, { message: 'Password reset successful' }));
});

// @desc    Verify Two-Factor Authentication (2FA) OTP
// @route   POST /api/auth/verify-2fa
// @access  Public
export const verify2FA = asyncHandler(async (req, res) => {
    const validation = verify2FASchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const { email, otp } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error('Invalid request');
    }

    // Check account lockout
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
        const waitTime = Math.ceil((user.accountLockedUntil - Date.now()) / 1000 / 60);
        res.status(403);
        throw new Error(`Account is locked due to multiple failed verification attempts. Please try again in ${waitTime} minutes.`);
    }

    // Check if OTP exists and is not expired
    if (!user.loginOTPHash || !user.loginOTPExpiresAt || user.loginOTPExpiresAt < Date.now()) {
        res.status(400);
        throw new Error('Verification code has expired or is invalid. Please request a new code.');
    }

    // Compare code
    const isMatch = await bcrypt.compare(otp, user.loginOTPHash);

    if (!isMatch) {
        user.loginOTPAttempts += 1;
        
        if (user.loginOTPAttempts >= 5) {
            user.accountLockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
            user.loginOTPHash = undefined;
            user.loginOTPExpiresAt = undefined;
            await user.save();
            res.status(403);
            throw new Error('Too many failed attempts. Your account has been locked for 15 minutes.');
        }

        await user.save();
        res.status(400);
        throw new Error(`Invalid verification code. ${5 - user.loginOTPAttempts} attempts remaining.`);
    }

    // Success: Reset OTP and Lockout fields
    user.loginOTPHash = undefined;
    user.loginOTPExpiresAt = undefined;
    user.loginOTPAttempts = 0;
    user.accountLockedUntil = undefined;
    await user.save();

    // Generate JWT
    const token = generateToken(user._id, user.role);

    res.status(200).json(
        new ApiResponse(200, {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                availabilityStatus: user.availabilityStatus,
            },
            token,
        }, 'Login successful.')
    );
});

// @desc    Resend Two-Factor Authentication (2FA) OTP
// @route   POST /api/auth/resend-2fa
// @access  Public
export const resend2FA = asyncHandler(async (req, res) => {
    const validation = resend2FASchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
        // Return 200 to prevent email enumeration
        return res.status(200).json(
            new ApiResponse(200, { message: 'If the email exists, a new verification code has been sent.' })
        );
    }

    // Check account lockout
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
        const waitTime = Math.ceil((user.accountLockedUntil - Date.now()) / 1000 / 60);
        res.status(403);
        throw new Error(`Account is locked. Please try again in ${waitTime} minutes.`);
    }

    // Check send cooldown (60 seconds)
    if (user.loginOTPLastSentAt && (Date.now() - user.loginOTPLastSentAt) < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - (Date.now() - user.loginOTPLastSentAt)) / 1000);
        res.status(429);
        throw new Error(`Please wait ${waitTime} seconds before requesting a new verification code.`);
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    user.loginOTPHash = await bcrypt.hash(otp, salt);
    user.loginOTPExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.loginOTPAttempts = 0;
    user.loginOTPLastSentAt = Date.now();
    await user.save();

    // Send OTP via Email
    const emailMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4c799a;">NutriKid Login Verification</h2>
            <p>To complete your login, please enter the following verification code:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4c799a; background: #f0f7fc; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
            <p>This code is valid for <strong>5 minutes</strong>. If you did not request this code, please secure your account.</p>
        </div>
    `;
    await sendEmail(user.email, 'NutriKid - 2FA Login Code', emailMessage);

    // Send OTP via SMS (if phone is set)
    const phoneNum = user.phone || (user.role === 'parent' ? user.parentProfile?.phoneNumber : null);
    if (phoneNum) {
        const smsMessage = `Your NutriKid login verification code is ${otp}. Valid for 5 minutes.`;
        await sendSMS(phoneNum, smsMessage);
    }

    res.status(200).json(
        new ApiResponse(200, { message: 'If the email exists, a new verification code has been sent.' })
    );
});

// @desc    Update user availability status
// @route   PATCH /api/auth/availability
// @access  Private (Doctor/Dietitian)
export const updateAvailabilityStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['Available', 'Busy', 'Offline'].includes(status)) {
        res.status(400);
        throw new Error('Invalid availability status. Must be Available, Busy, or Offline.');
    }

    if (!['doctor', 'dietitian'].includes(req.user.role)) {
        res.status(403);
        throw new Error('Only Doctors and Dietitians can update availability status.');
    }

    const user = await User.findById(req.user._id);
    user.availabilityStatus = status;
    await user.save();

    // If a Dietitian changes status to Available, process the Pending queue!
    if (req.user.role === 'dietitian' && status === 'Available') {
        const ConsultationRequest = (await import('../models/ConsultationRequest.model.js')).default;
        
        // Find all Pending requests, oldest first
        const pendingRequests = await ConsultationRequest.find({ status: 'Pending' }).sort({ createdAt: 1 });
        
        for (const request of pendingRequests) {
            // Find all Available Dietitians
            const availableDietitians = await User.find({ role: 'dietitian', availabilityStatus: 'Available' });
            if (availableDietitians.length === 0) break;
            
            // For each available dietitian, compute active cases
            const dietitianLoads = await Promise.all(availableDietitians.map(async (dietitian) => {
                const activeCount = await ConsultationRequest.countDocuments({
                    dietitianId: dietitian._id,
                    status: { $in: ['AssignedToDietitian', 'UnderDietitianReview', 'AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued'] }
                });
                return { dietitian, activeCount };
            }));
            
            // Sort by active cases count ascending
            dietitianLoads.sort((a, b) => a.activeCount - b.activeCount);
            
            // Assign to the dietitian with the lowest count
            const chosen = dietitianLoads[0].dietitian;
            
            request.dietitianId = chosen._id;
            request.assignedAt = new Date();
            request.status = 'AssignedToDietitian';
            await request.save();
        }
    }

    res.status(200).json(new ApiResponse(200, { availabilityStatus: user.availabilityStatus }, 'Availability status updated successfully'));
});
