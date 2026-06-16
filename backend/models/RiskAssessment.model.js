import mongoose from 'mongoose';

const riskAssessmentSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
            index: true,
        },
        riskType: {
            type: String,
            required: true,
        },
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
        },
        predictionWindow: {
            type: String,
            required: true,
        },
        factors: {
            type: [String],
            default: [],
        },
        recommendedIntervention: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

// Grouping queries by profile and sorting by most recent
riskAssessmentSchema.index({ profileId: 1, createdAt: -1 });

const RiskAssessment = mongoose.models.RiskAssessment || mongoose.model('RiskAssessment', riskAssessmentSchema);

export default RiskAssessment;
