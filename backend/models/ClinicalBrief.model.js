import mongoose from 'mongoose';

const clinicalBriefSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
            unique: true,
            index: true,
        },
        overallStatus: {
            type: String,
            default: 'Good',
        },
        riskLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Low',
        },
        scores: {
            nutritionScore: { type: Number, default: 70 },
            growthScore: { type: Number, default: 70 },
            adherenceScore: { type: Number, default: 70 },
            riskScore: { type: Number, default: 20 },
            attentionScore: { type: Number, default: 10 }
        },
        summary: {
            type: String,
            default: '',
        },
        risks: {
            type: [String],
            default: [],
        },
        insights: {
            positive: { type: [String], default: [] },
            negative: { type: [String], default: [] }
        },
        recommendations: {
            type: [String],
            default: [],
        },
        suggestedFollowUp: {
            type: String,
            default: '',
        }
    },
    { timestamps: true }
);

const ClinicalBrief = mongoose.models.ClinicalBrief || mongoose.model('ClinicalBrief', clinicalBriefSchema);

export default ClinicalBrief;
