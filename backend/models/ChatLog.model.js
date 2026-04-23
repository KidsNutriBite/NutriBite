import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const ChatLog = mongoose.model('ChatLog', chatLogSchema);

export default ChatLog;
