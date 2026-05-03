import mongoose from 'mongoose';

const activityItemSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: [
            'Playing', 'Outdoor Play', 'Sports', 'Walking', 'Cycling', 
            'Running', 'Dancing', 'Swimming', 'Yoga', 'Exercise', 
            'School Physical Education', 'Household Chores', 'Other'
        ]
    },
    duration: { 
        type: Number, // in minutes
        required: true,
        min: 1
    },
    notes: {
        type: String,
        default: ''
    }
}, { _id: true });

const activityLogSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        date: {
            type: String, // Storing as YYYY-MM-DD
            required: true,
            index: true
        },
        activities: [activityItemSchema],
        totalDuration: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Inactive'
        }
    },
    { timestamps: true }
);

// Compound index to ensure one log per profile per date
activityLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

// Pre-save hook to calculate totalDuration and status
activityLogSchema.pre('save', function(next) {
    this.totalDuration = this.activities.reduce((total, activity) => total + activity.duration, 0);
    this.status = this.totalDuration >= 60 ? 'Active' : 'Inactive';
    next();
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
