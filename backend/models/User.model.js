import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            enum: ['Mr', 'Ms', 'Mrs'],
            default: 'Mr', // Default for backward compatibility
        },
        profileImage: {
            type: String,
        },
        phone: {
            type: String,
        },
        address: {
            city: String,
            state: String,
            country: String,
        },
        role: {
            type: String,
            enum: ['parent', 'doctor'],
            default: 'parent',
            required: true,
        },
        parentProfile: {
            phoneNumber: { type: String },
            city: { type: String },
            relationToChild: { type: String },
        },
        doctorProfile: {
            specialization: { type: String },
            hospitalName: { type: String },
            experienceYears: { type: Number },
            registrationId: { type: String },
        },
        resetOtp: {
            type: String,
        },
        resetOtpExpiresAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
