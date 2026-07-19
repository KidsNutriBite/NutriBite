import mongoose from 'mongoose';

const consultationRequestSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        dietitianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        status: {
            type: String,
            enum: [
                'Pending',
                'AssignedToDietitian',
                'UnderDietitianReview',
                'AssignedToDoctor',
                'UnderDoctorReview',
                'PrescriptionIssued',
                'Closed'
            ],
            default: 'Pending',
        },
        dietitianNotes: {
            type: String,
            default: '',
        },
        doctorNotes: {
            type: String,
            default: '',
        },
        prescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prescription',
            default: null,
        },
        assignedAt: {
            type: Date,
            default: null,
        },
        doctorAssignedAt: {
            type: Date,
            default: null,
        },
        transferredAt: {
            type: Date,
            default: null,
        },
        transferHistory: [
            {
                fromDietitianId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                toDietitianId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                reason: {
                    type: String,
                    required: true,
                },
                transferredAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        doctorReassignmentHistory: [
            {
                fromDoctorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                toDoctorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                reason: {
                    type: String,
                    required: true,
                },
                reassignedAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        videoCallLogs: [
            {
                callDate: {
                    type: Date,
                    default: Date.now,
                },
                durationMinutes: {
                    type: Number,
                    default: 0,
                },
                summary: {
                    type: String,
                    default: '',
                },
                recommendations: [
                    {
                        type: String,
                    }
                ],
                generatedBy: {
                    type: String,
                    default: 'AI',
                },
            }
        ],
    },
    { timestamps: true }
);

consultationRequestSchema.index(
    { profileId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [
                    'Pending',
                    'AssignedToDietitian',
                    'UnderDietitianReview',
                    'AssignedToDoctor',
                    'UnderDoctorReview',
                    'PrescriptionIssued'
                ]
            }
        }
    }
);

const ConsultationRequest = mongoose.model('ConsultationRequest', consultationRequestSchema);

export default ConsultationRequest;
