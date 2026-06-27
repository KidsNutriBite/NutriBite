import mongoose from 'mongoose';

const aiCorrectionSchema = new mongoose.Schema(
    {
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        originalFood: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        originalQuantity: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        correctedFood: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        correctedQuantity: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

// Create compound index for faster lookup per parent
aiCorrectionSchema.index({ parentId: 1, originalFood: 1 });

const AiCorrection = mongoose.model('AiCorrection', aiCorrectionSchema);

export default AiCorrection;
