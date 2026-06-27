import MealLog from '../models/MealLog.model.js';
import Profile from '../models/Profile.model.js';
import { computeWellnessAnalysis } from '../utils/wellnessEngine.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import axios from 'axios';
import { calculateFoodNutrition } from '../utils/nutritionEngine.js';
import fs from 'fs';
import AiCorrection from '../models/AiCorrection.model.js';

// @desc    Log or Update a meal for a specific date
// @route   POST /api/meals
// @access  Private (Parent)
export const logMeal = asyncHandler(async (req, res) => {
    const { profileId, date, mealType, foodItems, notes, time, nutrients, analysisResult } = req.body;

    console.log(`[logMeal] Received request for profileId: ${profileId}, mealType: ${mealType}`);

    // Validate Input
    if (!profileId || !date || !mealType || !foodItems) {
        console.error("[logMeal] Missing fields:", { profileId, date, mealType, hasFoodItems: !!foodItems });
        res.status(400);
        throw new Error("Missing required fields: profileId, date, mealType, foodItems");
    }

    // Normalize date format to YYYY-MM-DD
    let normalizedDate = date;
    if (date.includes('-') && date.length === 10) {
        // Check if it's DD-MM-YYYY format
        const parts = date.split('-');
        if (parts[0].length === 2 && parts[2].length === 4) {
            // It's DD-MM-YYYY, convert to YYYY-MM-DD
            normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
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

    // Get child profile to fetch parentId
    const profile = await Profile.findById(profileId);
    const parentId = profile ? profile.parentId : (req.user ? req.user._id : null);

    // Check if a log exists for this date
    let dailyLog = await MealLog.findOne({ profileId, date: normalizedDate });

    if (!dailyLog) {
        // Create new daily log with all meal types initialized
        dailyLog = new MealLog({
            profileId,
            parentId,
            date: normalizedDate,
            breakfast: mealType === 'breakfast' ? parsedFoodItems : [],
            morningSnack: mealType === 'morningSnack' ? parsedFoodItems : [],
            lunch: mealType === 'lunch' ? parsedFoodItems : [],
            afternoonSnack: mealType === 'afternoonSnack' ? parsedFoodItems : [],
            dinner: mealType === 'dinner' ? parsedFoodItems : [],
            eveningSnack: mealType === 'eveningSnack' ? parsedFoodItems : []
        });
    } else {
        // Update existing log - ensure meal type field exists
        if (!dailyLog[mealType]) {
            dailyLog[mealType] = [];
        }
        dailyLog[mealType] = [...dailyLog[mealType], ...parsedFoodItems];
        if (parentId && !dailyLog.parentId) {
            dailyLog.parentId = parentId;
        }
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

    // Save Meal Times
    if (!dailyLog.mealTimes) {
        dailyLog.mealTimes = {};
    }
    if (time) {
        dailyLog.mealTimes[mealType] = time;
    }

    // Save Analysis Results
    if (!dailyLog.analysisResults) {
        dailyLog.analysisResults = {};
    }
    if (analysisResult) {
        try {
            dailyLog.analysisResults[mealType] = typeof analysisResult === 'string' ? JSON.parse(analysisResult) : analysisResult;
        } catch (e) {
            dailyLog.analysisResults[mealType] = analysisResult;
        }
    }

    // Calculate total nutrition for the logged foods using our nutrition engine
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalIron = 0;
    let totalCalcium = 0;
    let totalVitaminC = 0;

    parsedFoodItems.forEach(item => {
        // Calculate nutrition using nutritionEngine based on quantity
        const nut = calculateFoodNutrition(item.name, item.quantity);
        
        // If the item already has custom numbers (edited by parent on review screen), respect them!
        // Otherwise use the calculated value.
        const c = item.calories !== undefined ? Number(item.calories) : nut.calories;
        const p = item.protein !== undefined ? Number(item.protein) : nut.protein;
        const carbsVal = item.carbs !== undefined ? Number(item.carbs) : nut.carbs;
        const f = item.fats !== undefined ? Number(item.fats) : (item.fat !== undefined ? Number(item.fat) : nut.fats);
        
        // Extended values (fiber, iron, calcium, vitamin C)
        const fib = item.fiber !== undefined ? Number(item.fiber) : nut.fiber;
        const ir = item.iron !== undefined ? Number(item.iron) : nut.iron;
        const calc = item.calcium !== undefined ? Number(item.calcium) : nut.calcium;
        const vitC = item.vitaminC !== undefined ? Number(item.vitaminC) : nut.vitaminC;

        // Save back onto the food item to ensure the saved subdocument has them!
        item.calories = c;
        item.protein = p;
        item.carbs = carbsVal;
        item.fats = f;
        item.fiber = fib;
        item.iron = ir;
        item.calcium = calc;
        item.vitaminC = vitC;

        totalCalories += c;
        totalProtein += p;
        totalCarbs += carbsVal;
        totalFat += f;
        totalFiber += fib;
        totalIron += ir;
        totalCalcium += calc;
        totalVitaminC += vitC;
    });

    // Save Meal Macros in daily slots
    if (!dailyLog.mealMacros) {
        dailyLog.mealMacros = {};
    }
    dailyLog.mealMacros[mealType] = {
        calories: Math.round(totalCalories),
        protein: Number(totalProtein.toFixed(2)),
        carbs: Number(totalCarbs.toFixed(2)),
        fat: Number(totalFat.toFixed(2))
    };

    // Store flat root properties for single-meal logs (Step 8 compatibility)
    dailyLog.childId = profileId;
    dailyLog.parentId = parentId;
    dailyLog.mealType = mealType;
    dailyLog.detectedFoods = parsedFoodItems.map(f => f.name);
    dailyLog.nutritionValues = {
        calories: Math.round(totalCalories),
        protein: Number(totalProtein.toFixed(2)),
        carbs: Number(totalCarbs.toFixed(2)),
        fat: Number(totalFat.toFixed(2)),
        fiber: Number(totalFiber.toFixed(2)),
        iron: Number(totalIron.toFixed(2)),
        calcium: Math.round(totalCalcium),
        vitaminC: Number(totalVitaminC.toFixed(2))
    };
    dailyLog.analysisDate = new Date();

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
        dailyLog.mealImage = imageUrl; // Set flat root image!
    }

    await dailyLog.save();

    // Check for AI corrections and record them
    if (analysisResult && parentId) {
        try {
            const original = typeof analysisResult === 'string' ? JSON.parse(analysisResult) : analysisResult;
            if (original && Array.isArray(original.foods)) {
                const originalItems = original.foods;
                if (Array.isArray(parsedFoodItems)) {
                    for (let i = 0; i < originalItems.length; i++) {
                        const orig = originalItems[i];
                        const submitted = parsedFoodItems[i];
                        if (orig && submitted) {
                            const origName = (orig.name || '').toLowerCase().trim();
                            const subName = (submitted.name || '').toLowerCase().trim();
                            const origQty = (orig.quantity || '').toLowerCase().trim();
                            const subQty = (submitted.quantity || '').toLowerCase().trim();

                            if (origName !== subName || origQty !== subQty) {
                                const existing = await AiCorrection.findOne({
                                    parentId,
                                    originalFood: origName,
                                    originalQuantity: origQty,
                                    correctedFood: subName,
                                    correctedQuantity: subQty
                                });

                                if (!existing) {
                                    await AiCorrection.create({
                                        parentId,
                                        originalFood: origName,
                                        originalQuantity: origQty,
                                        correctedFood: subName,
                                        correctedQuantity: subQty
                                    });
                                    console.log(`[Backend] Recorded correction: Originally '${origName}' ('${origQty}') corrected to '${subName}' ('${subQty}')`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("[Backend] Failed to compare/save corrections:", err);
        }
    }

    // Trigger Wellness score reanalysis asynchronously (do not block client response)
    if (profile) {
        try {
            const mealLogs = await MealLog.find({ profileId });
            profile.wellnessAnalysis = computeWellnessAnalysis(profile.toObject(), mealLogs);
            await profile.save();
            console.log(`[logMeal] Automatically updated wellness analysis for child ${profile.name}, score: ${profile.wellnessAnalysis?.score}`);
        } catch (wellnessErr) {
            console.error("[logMeal] Failed to update wellness analysis:", wellnessErr.message);
        }
    }

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

// @desc    Analyze a meal image using the AI Service
// @route   POST /api/meals/analyze-image
// @access  Private (Parent)
export const analyzeMealImage = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error("No image file provided");
    }

    const file = req.files[0];
    
    // Log image received details (Task 3)
    console.log(`[Backend] Image received. Name: ${file.originalname}, Size: ${file.size} bytes`);

    const fileBuffer = fs.readFileSync(file.path);
    const formData = new FormData();
    const fileObject = new File([fileBuffer], file.originalname, { type: file.mimetype });
    formData.append('file', fileObject);

    // Fetch parent corrections and append as form data
    const parentId = req.user ? req.user._id : null;
    if (parentId) {
        try {
            const corrections = await AiCorrection.find({ parentId })
                .sort({ createdAt: -1 })
                .limit(10);
            formData.append('corrections', JSON.stringify(corrections));
            console.log(`[Backend] Appended ${corrections.length} past corrections for parent ${parentId}`);
        } catch (err) {
            console.error("[Backend] Failed to fetch corrections:", err);
        }
    }

    const aiUrl = process.env.FOOD_RECOGNITION_SERVICE_URL || 'http://localhost:8001';
    try {
        console.log("[Backend] Inference Started");
        
        // Query the new food recognition endpoint
        const response = await axios.post(`${aiUrl}/api/food-recognition`, formData);
        
        console.log("[Backend] Inference Completed");
        console.log("[Backend] Prediction Returned:", JSON.stringify(response.data));

        const data = response.data; // { foods, confidence_scores, portion_estimates }
        const foods = data.foods || [];
        const confidenceScores = data.confidence_scores || [];
        const portionEstimates = data.portion_estimates || {};

        // Map food items to detailed nutrition profiles using the Pediatric Nutrition Engine
        const analyzedFoods = foods.map((food, index) => {
            const qty = portionEstimates[food] || "1 serving";
            const nutrition = calculateFoodNutrition(food, qty);
            
            return {
                name: food,
                quantity: qty,
                confidence: confidenceScores[index] !== undefined ? confidenceScores[index] : 1.0,
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fats: nutrition.fats,
                fiber: nutrition.fiber,
                iron: nutrition.iron,
                calcium: nutrition.calcium,
                vitaminC: nutrition.vitaminC
            };
        });

        // Compute total values for the entire plate
        const totals = analyzedFoods.reduce((acc, item) => {
            return {
                calories: acc.calories + item.calories,
                protein: Number((acc.protein + item.protein).toFixed(2)),
                carbs: Number((acc.carbs + item.carbs).toFixed(2)),
                fat: Number((acc.fat + item.fats).toFixed(2)),
                fiber: Number((acc.fiber + item.fiber).toFixed(2)),
                iron: Number((acc.iron + item.iron).toFixed(2)),
                calcium: acc.calcium + item.calcium,
                vitaminC: Number((acc.vitaminC + item.vitaminC).toFixed(2))
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, calcium: 0, vitaminC: 0 });

        const result = {
            foods: analyzedFoods,
            totals: totals,
            confidence_scores: confidenceScores,
            portion_estimates: portionEstimates,
            raw_predictions: data.raw_predictions || []
        };

        res.status(200).json(new ApiResponse(200, result, "Image analyzed successfully"));
    } catch (error) {
        console.error("AI service communication error:", error.message);
        res.status(500);
        throw new Error("AI service failed to analyze the image: " + error.message);
    }
});

// @desc    Debug analysis of a meal image returning raw predictions and time taken
// @route   POST /api/meals/debug-food-analysis or POST /api/debug-food-analysis
// @access  Private (Parent)
export const analyzeMealImageDebug = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error("No image file provided");
    }

    const file = req.files[0];
    console.log(`[Backend] [Debug] Image received. Name: ${file.originalname}, Size: ${file.size} bytes`);

    const fileBuffer = fs.readFileSync(file.path);
    const formData = new FormData();
    const fileObject = new File([fileBuffer], file.originalname, { type: file.mimetype });
    formData.append('file', fileObject);

    // Fetch parent corrections and append as form data
    const parentId = req.user ? req.user._id : null;
    if (parentId) {
        try {
            const corrections = await AiCorrection.find({ parentId })
                .sort({ createdAt: -1 })
                .limit(10);
            formData.append('corrections', JSON.stringify(corrections));
            console.log(`[Backend] [Debug] Appended ${corrections.length} past corrections for parent ${parentId}`);
        } catch (err) {
            console.error("[Backend] [Debug] Failed to fetch corrections:", err);
        }
    }

    const aiUrl = process.env.FOOD_RECOGNITION_SERVICE_URL || 'http://localhost:8001';
    try {
        console.log("[Backend] [Debug] Inference Started");
        const response = await axios.post(`${aiUrl}/api/debug-food-analysis`, formData);
        console.log("[Backend] [Debug] Inference Completed");
        console.log("[Backend] [Debug] Prediction Returned:", JSON.stringify(response.data));
        
        res.status(200).json(new ApiResponse(200, response.data, "Debug image analyzed successfully"));
    } catch (error) {
        console.error("AI service debug communication error:", error.message);
        res.status(500);
        throw new Error("AI service failed debug food analysis: " + error.message);
    }
});
