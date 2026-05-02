import mongoose from 'mongoose';

const sleepLogSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        date: {
            type: String,
            required: true,
            index: true,
        },
        sleepTime: {
            type: String,
            required: true,
        },
        wakeUpTime: {
            type: String,
            required: true,
        },
        totalSleepHours: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ['poor', 'healthy', 'oversleep'],
            required: true,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

sleepLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

const SleepLog = mongoose.model('SleepLog', sleepLogSchema);

export default SleepLog;
