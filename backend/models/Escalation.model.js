import mongoose from 'mongoose';

const escalationSchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    risk_level: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    ai_message: {
        type: String,
        required: true
    },
    detected_keywords: {
        type: [String],
        default: []
    },
    resolved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Escalation', escalationSchema);
