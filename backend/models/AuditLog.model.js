import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        action: {
            type: String,
            enum: ['VIEW_ATTEMPT', 'EDIT_ATTEMPT'],
            required: true,
        },
        status: {
            type: String,
            enum: ['ALLOWED', 'DENIED'],
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Optional extra info
        }
    },
    { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
