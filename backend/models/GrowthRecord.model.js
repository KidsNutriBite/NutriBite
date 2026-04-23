import mongoose from 'mongoose';

const growthRecordSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChildProfile', // Assuming ChildProfile is the model name for children
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    waistCircumference: {
        type: Number
    },
    bmi: {
        type: Number
        // Auto-calculated
    },
    percentile: {
        type: Number
    },
    riskStatus: {
        type: String,
        enum: ['underweight', 'normal', 'overweight', 'obese'],
        default: 'normal'
    },
    ageInMonths: {
        type: Number
    },
    recordedByRole: {
        type: String,
        enum: ['parent', 'doctor'],
        required: true
    },
    recordedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying of a child's growth history
growthRecordSchema.index({ childId: 1, timestamp: -1 });

const GrowthRecord = mongoose.model('GrowthRecord', growthRecordSchema);

export default GrowthRecord;
