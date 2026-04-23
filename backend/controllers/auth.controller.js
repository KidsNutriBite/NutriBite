
import User from '../models/User.model.js';
import generateToken from '../services/jwt.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.schema.js';
import { sendEmail } from '../services/email.service.js';
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
    let profileImage = 'https://avatar.iran.liara.run/public';
    if (title === 'Mr') profileImage = 'https://avatar.iran.liara.run/public/boy';
    else if (['Ms', 'Mrs'].includes(title)) profileImage = 'https://avatar.iran.liara.run/public/girl';

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
        const token = generateToken(user._id, user.role);
        res.json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
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
