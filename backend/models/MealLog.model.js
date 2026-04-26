import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: String, default: '1 serving' },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    vitamins: { type: String, default: '' },
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
        morningSnack: [foodItemSchema],
        lunch: [foodItemSchema],
        afternoonSnack: [foodItemSchema],
        dinner: [foodItemSchema],
        eveningSnack: [foodItemSchema],

        completedMealsCount: {
            type: Number,
            default: 0,
            max: 6
        },

        // Metadata for streak tracking
        isStreakCounted: { type: Boolean, default: false },

        // Time tracking
        lastMealAt: { type: Date },

        // Meal Images
        images: {
            breakfast: String,
            morningSnack: String,
            lunch: String,
            afternoonSnack: String,
            dinner: String,
            eveningSnack: String
        }
    },
    { timestamps: true }
);

// Compound index to ensure one log per profile per date
dailyMealLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

const MealLog = mongoose.model('MealLog', dailyMealLogSchema);

export default MealLog;
