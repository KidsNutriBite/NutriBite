import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'ai', 'system'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    intent: {
        type: String,
        default: null
    },
    toolsUsed: [{
        type: String
    }],
    followUps: [{
        label: String,
        prompt: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Nutrition Consultation',
        trim: true
    },
    summary: {
        type: String,
        default: ''
    },
    messages: [messageSchema],
    lastUpdated: {
        type: Date,
        default: Date.now,
        index: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Composite index for fast parent + child scoped queries
conversationSchema.index({ parentId: 1, profileId: 1, lastUpdated: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
