import mongoose from 'mongoose';

const loginAuditSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        name: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            default: 'unknown',
        },
        action: {
            type: String,
            enum: [
                'LOGIN_SUCCESS',
                'LOGIN_FAILED',
                'LOGOUT',
                '2FA_REQUESTED',
                '2FA_SUCCESS',
                '2FA_FAILED',
                'USER_STATUS_CHANGE',
                'USER_DELETED',
            ],
            required: true,
        },
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILED', 'BLOCKED', 'INFO'],
            default: 'SUCCESS',
        },
        ipAddress: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
        details: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

loginAuditSchema.index({ createdAt: -1 });
loginAuditSchema.index({ email: 1 });
loginAuditSchema.index({ action: 1 });

const LoginAudit = mongoose.model('LoginAudit', loginAuditSchema);

export default LoginAudit;
