import MealLog from '../models/MealLog.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

// @desc    Log or Update a meal for a specific date
// @route   POST /api/meals
// @access  Private (Parent)
export const logMeal = asyncHandler(async (req, res) => {
    const { profileId, date, mealType, foodItems, notes } = req.body;

    // Validate Input
    if (!profileId || !date || !mealType || !foodItems) {
        res.status(400);
        throw new Error("Missing required fields: profileId, date, mealType, foodItems");
    }

    // Parse foodItems if string (FormData)
    let parsedFoodItems = foodItems;
    if (typeof foodItems === 'string') {
        try {
            parsedFoodItems = JSON.parse(foodItems);
        } catch (e) {
            parsedFoodItems = [];
        }
    }

    // Check if a log exists for this date
    let dailyLog = await MealLog.findOne({ profileId, date });

    if (!dailyLog) {
        // Create new daily log
        dailyLog = new MealLog({
            profileId,
            date,
            [mealType]: parsedFoodItems
        });
    } else {
        // Update existing log
        // We append to the existing list for that meal type
        dailyLog[mealType] = [...dailyLog[mealType], ...parsedFoodItems];
    }

    // Calculate Completed Meals Count
    let count = 0;
    if (dailyLog.breakfast && dailyLog.breakfast.length > 0) count++;
    if (dailyLog.morningSnack && dailyLog.morningSnack.length > 0) count++;
    if (dailyLog.lunch && dailyLog.lunch.length > 0) count++;
    if (dailyLog.afternoonSnack && dailyLog.afternoonSnack.length > 0) count++;
    if (dailyLog.dinner && dailyLog.dinner.length > 0) count++;
    if (dailyLog.eveningSnack && dailyLog.eveningSnack.length > 0) count++;

    dailyLog.completedMealsCount = count;
    dailyLog.lastMealAt = new Date();

    // Handle Image Upload
    if (req.files && req.files.length > 0) {
        const file = req.files[0];
        const imageUrl = `/uploads/${file.filename}`;
        
        // Ensure images object exists
        if (!dailyLog.images) {
            dailyLog.images = {
                breakfast: '',
                morningSnack: '',
                lunch: '',
                afternoonSnack: '',
                dinner: '',
                eveningSnack: ''
            };
        }
        
        dailyLog.images[mealType] = imageUrl;
    }

    await dailyLog.save();

    res.status(200).json(new ApiResponse(200, dailyLog, "Meal logged successfully"));
});

// @desc    Get meal history (last 30 days)
// @route   GET /api/meals/history/:id
export const getMealHistory = asyncHandler(async (req, res) => {
    const { id } = req.params; // Profile ID

    const logs = await MealLog.find({ profileId: id })
        .sort({ date: -1 })
        .limit(30);

    // Calculate Streak (Simplified)
    let streak = 0;
    // ... logic to calculate streak based on completedMealsCount ...

    res.status(200).json(new ApiResponse(200, { logs, streak }, "Meal history fetched"));
});

// @desc    Get specific date log
// @route   GET /api/meals/by-date/:id/:date
export const getMealsByDate = asyncHandler(async (req, res) => {
    const { id, date } = req.params;

    const log = await MealLog.findOne({ profileId: id, date });

    if (!log) {
        // Return empty structure for frontend to render "empty" state
        return res.status(200).json(new ApiResponse(200, { 
            date, 
            breakfast: [], 
            morningSnack: [],
            lunch: [], 
            afternoonSnack: [],
            dinner: [],
            eveningSnack: []
        }, "No logs found (Empty)"));
    }

    res.status(200).json(new ApiResponse(200, log, "Daily meals fetched"));
});

// @desc    Delete a specific food item from a meal slot
// @route   DELETE /api/meals/item
export const deleteFoodItem = asyncHandler(async (req, res) => {
    const { logId, mealType, itemId } = req.body;

    const log = await MealLog.findById(logId);
    if (!log) {
        res.status(404);
        throw new Error("Log not found");
    }

    if (log[mealType]) {
        log[mealType] = log[mealType].filter(item => item._id.toString() !== itemId);
        await log.save();
    }

    res.status(200).json(new ApiResponse(200, log, "Item removed"));
});

// @desc    Get the time since the last meal
// @route   GET /api/meals/last-meal/:id
// @access  Private
export const getLastMealTime = asyncHandler(async (req, res) => {
    const { id } = req.params; // Profile ID

    const lastLog = await MealLog.findOne({ profileId: id, lastMealAt: { $exists: true } })
        .sort({ lastMealAt: -1 });

    if (!lastLog || !lastLog.lastMealAt) {
        return res.status(200).json(new ApiResponse(200, { 
            lastMealAt: null, 
            timeGap: "No meals logged yet" 
        }, "No meal logs found"));
    }

    const lastMealTime = new Date(lastLog.lastMealAt);
    const now = new Date();
    const diffInMs = now - lastMealTime;
    
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    let timeGap = "";
    if (diffInDays > 0) {
        timeGap = `Last meal: ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
        timeGap = `Last meal: ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMins > 0) {
        timeGap = `Last meal: ${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    } else {
        timeGap = "Last meal: just now";
    }

    res.status(200).json(new ApiResponse(200, { 
        lastMealAt: lastLog.lastMealAt, 
        timeGap 
    }, "Last meal time fetched"));
});
