import mongoose from 'mongoose';

const conversationMemorySchema = new mongoose.Schema({
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
    key: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['food_dislike', 'food_preference', 'dietary_style', 'lifestyle_preference', 'general'],
        default: 'general'
    },
    confidence: {
        type: Number,
        default: 1.0
    },
    source: {
        type: String,
        default: 'parent_conversation'
    }
}, {
    timestamps: true
});

conversationMemorySchema.index({ parentId: 1, profileId: 1, key: 1 });

const ConversationMemory = mongoose.model('ConversationMemory', conversationMemorySchema);

export default ConversationMemory;
