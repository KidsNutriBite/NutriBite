import mongoose from 'mongoose';

const missedMealEventSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner'], // Not tracking snacks for missed alerts usually
        required: true
    },
    notifiedParent: {
        type: Boolean,
        default: false
    },
    notifiedDoctor: {
        type: Boolean,
        default: false
    },
    notes: String
}, { timestamps: true });

const MissedMealEvent = mongoose.model('MissedMealEvent', missedMealEventSchema);

export default MissedMealEvent;
