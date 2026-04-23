import mongoose from 'mongoose';

const doctorAccessSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Optional: filled when parent approves the request for a specific child
        // If null, it's a general request to the parent (which the parent then links to a profile)
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'restricted', 'active', 'rejected'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            default: null, // Null means no expiration
        },
        message: {
            type: String,
            default: '',
        },
        doctorMessage: {
            type: String,
            default: '',
        },
        fullAccessRequested: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent duplicate requests for the same doctor-parent-profile combination
// If profileId is null (initial request), uniqueness is on doctor+parent
doctorAccessSchema.index({ doctorId: 1, parentId: 1, profileId: 1 }, { unique: true });

const DoctorAccess = mongoose.model('DoctorAccess', doctorAccessSchema);

export default DoctorAccess;
