import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: String, default: '1 serving' },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    notes: String,
    photoUrl: String
}, { _id: true }); // Keep _id for identifying specific items if needed

const dailyMealLogSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        date: {
            type: String, // Storing as YYYY-MM-DD string for easy querying
            required: true,
            index: true
        },
        breakfast: [foodItemSchema],
        lunch: [foodItemSchema],
        snacks: [foodItemSchema],
        dinner: [foodItemSchema],

        completedMealsCount: {
            type: Number,
            default: 0,
            max: 4
        },

        // Metadata for streak tracking
        isStreakCounted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Compound index to ensure one log per profile per date
dailyMealLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

const MealLog = mongoose.model('MealLog', dailyMealLogSchema);

export default MealLog;
