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
                // Primary Teleconsultation States
                'REQUESTED',
                'ACCEPTED',
                'SCHEDULED',
                'STARTED',
                'IN_PROGRESS',
                'COMPLETED',
                'REJECTED',
                'CANCELLED',
                'EXPIRED',
                // Legacy Clinical States (backward compatible)
                'Pending',
                'AssignedToDietitian',
                'UnderDietitianReview',
                'AssignedToDoctor',
                'UnderDoctorReview',
                'PrescriptionIssued',
                'Closed'
            ],
            default: 'REQUESTED',
        },
        // Teleconsultation Request Details
        isEmergency: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: String,
            enum: ['ROUTINE', 'EMERGENCY'],
            default: 'ROUTINE',
        },
        reason: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        preferredDate: {
            type: Date,
            default: null,
        },
        preferredTime: {
            type: String,
            default: '',
        },
        // Teleconsultation Scheduling Details
        scheduledDate: {
            type: Date,
            default: null,
        },
        scheduledTime: {
            type: String,
            default: '',
        },
        scheduledDuration: {
            type: Number,
            default: 30, // in minutes
        },
        scheduledNotes: {
            type: String,
            default: '',
        },
        rejectionReason: {
            type: String,
            default: '',
        },
        // Active Call Session Details
        callRoomId: {
            type: String,
            default: null,
            index: true,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        actualDurationMinutes: {
            type: Number,
            default: 0,
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
                diseaseOrCondition: {
                    type: String,
                    default: '',
                },
                medicinesDiscussed: [
                    { type: String }
                ],
                transcript: {
                    type: String,
                    default: '',
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
                    'REQUESTED',
                    'ACCEPTED',
                    'SCHEDULED',
                    'STARTED',
                    'IN_PROGRESS',
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
