import mongoose from 'mongoose';

const digitalTwinSnapshotSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
            index: true,
        },
        nutritionScore: {
            type: Number,
            required: true,
        },
        riskScore: {
            type: Number,
            required: true,
        },
        radarMetrics: {
            protein: { type: Number, default: 50 },
            calcium: { type: Number, default: 50 },
            iron: { type: Number, default: 50 },
            vitamins: { type: Number, default: 50 },
            hydration: { type: Number, default: 50 },
            consistency: { type: Number, default: 50 },
        },
        predictionData: {
            day30: {
                expectedWeight: { type: Number },
                expectedHeight: { type: Number },
                expectedNutritionScore: { type: Number },
                confidencePct: { type: Number },
                status: { type: String }
            },
            day90: {
                expectedWeight: { type: Number },
                expectedHeight: { type: Number },
                expectedNutritionScore: { type: Number },
                confidencePct: { type: Number },
                status: { type: String }
            },
            day180: {
                expectedWeight: { type: Number },
                expectedHeight: { type: Number },
                expectedNutritionScore: { type: Number },
                confidencePct: { type: Number },
                status: { type: String }
            }
        },
        insights: {
            type: [String],
            default: [],
        }
    },
    { timestamps: true }
);

// Optimize query of historic twin changes over time
digitalTwinSnapshotSchema.index({ profileId: 1, createdAt: -1 });

const DigitalTwinSnapshot = mongoose.model('DigitalTwinSnapshot', digitalTwinSnapshotSchema);

export default DigitalTwinSnapshot;
