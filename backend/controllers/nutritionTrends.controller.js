import MealLog from '../models/MealLog.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
    calculateDailyTotals,
    getNutritionSummary,
    generateInsights,
    getWeeklyTrends,
    getMonthlyTrends
} from '../services/nutritionTrends.service.js';

/**
 * @desc    Get daily nutrition summary for a specific date
 * @route   GET /api/nutrition-trends/daily/:profileId/:date
 * @access  Private (Parent)
 */
export const getDailyNutritionSummary = asyncHandler(async (req, res) => {
    const { profileId, date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400);
        throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const mealLog = await MealLog.findOne({ profileId, date });

    if (!mealLog) {
        return res.status(200).json(
            new ApiResponse(200, {
                date,
                totals: {
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    calories: 0,
                    fiber: 0,
                    water: 0,
                    foodItems: []
                },
                summary: {
                    protein: { value: 0, recommended: 50, percentage: 0, unit: 'g' },
                    carbs: { value: 0, recommended: 300, percentage: 0, unit: 'g' },
                    fats: { value: 0, recommended: 65, percentage: 0, unit: 'g' },
                    calories: { value: 0, recommended: 2000, percentage: 0, unit: 'kcal' }
                },
                insights: [
                    {
                        type: 'info',
                        message: 'No meals logged for this date. Start adding meals to see nutrition insights!',
                        severity: 'low'
                    }
                ]
            }, "No meals logged for this date")
        );
    }

    const totals = calculateDailyTotals(mealLog);
    const summary = getNutritionSummary(totals);
    const insights = generateInsights(summary);

    res.status(200).json(
        new ApiResponse(200, {
            date,
            totals,
            summary,
            insights,
            mealsLogged: mealLog.completedMealsCount
        }, "Daily nutrition summary fetched successfully")
    );
});

/**
 * @desc    Get today's nutrition summary
 * @route   GET /api/nutrition-trends/today/:profileId
 * @access  Private (Parent)
 */
export const getTodayNutritionSummary = asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const mealLog = await MealLog.findOne({ profileId, date: todayStr });

    if (!mealLog) {
        return res.status(200).json(
            new ApiResponse(200, {
                date: todayStr,
                totals: {
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    calories: 0,
                    fiber: 0,
                    water: 0,
                    foodItems: []
                },
                summary: {
                    protein: { value: 0, recommended: 50, percentage: 0, unit: 'g' },
                    carbs: { value: 0, recommended: 300, percentage: 0, unit: 'g' },
                    fats: { value: 0, recommended: 65, percentage: 0, unit: 'g' },
                    calories: { value: 0, recommended: 2000, percentage: 0, unit: 'kcal' }
                },
                insights: [
                    {
                        type: 'info',
                        message: 'No meals logged yet today. Start adding meals to see nutrition insights!',
                        severity: 'low'
                    }
                ]
            }, "No meals logged for today")
        );
    }

    const totals = calculateDailyTotals(mealLog);
    const summary = getNutritionSummary(totals);
    const insights = generateInsights(summary);

    res.status(200).json(
        new ApiResponse(200, {
            date: todayStr,
            totals,
            summary,
            insights,
            mealsLogged: mealLog.completedMealsCount
        }, "Today's nutrition summary fetched successfully")
    );
});

/**
 * @desc    Get weekly nutrition trends
 * @route   GET /api/nutrition-trends/weekly/:profileId/:date
 * @access  Private (Parent)
 * @param   date - End date in YYYY-MM-DD format (defaults to today)
 */
export const getWeeklyNutritionTrends = asyncHandler(async (req, res) => {
    const { profileId, date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400);
        throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const weeklyData = await getWeeklyTrends(profileId, date);

    res.status(200).json(
        new ApiResponse(200, weeklyData, "Weekly nutrition trends fetched successfully")
    );
});

/**
 * @desc    Get this week's nutrition trends
 * @route   GET /api/nutrition-trends/weekly/:profileId
 * @access  Private (Parent)
 */
export const getThisWeekNutritionTrends = asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const weeklyData = await getWeeklyTrends(profileId, todayStr);

    res.status(200).json(
        new ApiResponse(200, weeklyData, "This week's nutrition trends fetched successfully")
    );
});

/**
 * @desc    Get monthly nutrition trends
 * @route   GET /api/nutrition-trends/monthly/:profileId/:month
 * @access  Private (Parent)
 * @param   month - Month in YYYY-MM format
 */
export const getMonthlyNutritionTrends = asyncHandler(async (req, res) => {
    const { profileId, month } = req.params;

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
        res.status(400);
        throw new Error("Invalid month format. Use YYYY-MM");
    }

    const monthlyData = await getMonthlyTrends(profileId, month);

    res.status(200).json(
        new ApiResponse(200, monthlyData, "Monthly nutrition trends fetched successfully")
    );
});

/**
 * @desc    Get this month's nutrition trends
 * @route   GET /api/nutrition-trends/monthly/:profileId
 * @access  Private (Parent)
 */
export const getThisMonthNutritionTrends = asyncHandler(async (req, res) => {
    const { profileId } = req.params;

    // Get current month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    const monthlyData = await getMonthlyTrends(profileId, monthStr);

    res.status(200).json(
        new ApiResponse(200, monthlyData, "This month's nutrition trends fetched successfully")
    );
});

/**
 * @desc    Compare nutrition between two dates or periods
 * @route   GET /api/nutrition-trends/compare/:profileId/:startDate/:endDate
 * @access  Private (Parent)
 */
export const compareNutritionPeriods = asyncHandler(async (req, res) => {
    const { profileId, startDate, endDate } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        res.status(400);
        throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const logs = await MealLog.find({
        profileId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    if (logs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, {
                period: { startDate, endDate, daysLogged: 0 },
                totals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
                averages: { protein: 0, carbs: 0, fats: 0, calories: 0 }
            }, "No data for this period")
        );
    }

    let totalProtein = 0,
        totalCarbs = 0,
        totalFats = 0,
        totalCalories = 0;

    const dailyData = logs.map(log => {
        const totals = calculateDailyTotals(log);
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFats += totals.fats;
        totalCalories += totals.calories;

        return {
            date: log.date,
            ...totals
        };
    });

    const daysLogged = logs.length;
    const averages = {
        protein: Math.round((totalProtein / daysLogged) * 100) / 100,
        carbs: Math.round((totalCarbs / daysLogged) * 100) / 100,
        fats: Math.round((totalFats / daysLogged) * 100) / 100,
        calories: Math.round((totalCalories / daysLogged) * 100) / 100
    };

    res.status(200).json(
        new ApiResponse(200, {
            period: { startDate, endDate, daysLogged },
            daily: dailyData,
            totals: {
                protein: Math.round(totalProtein * 100) / 100,
                carbs: Math.round(totalCarbs * 100) / 100,
                fats: Math.round(totalFats * 100) / 100,
                calories: Math.round(totalCalories * 100) / 100
            },
            averages
        }, "Period comparison fetched successfully")
    );
});

export default {
    getDailyNutritionSummary,
    getTodayNutritionSummary,
    getWeeklyNutritionTrends,
    getThisWeekNutritionTrends,
    getMonthlyNutritionTrends,
    getThisMonthNutritionTrends,
    compareNutritionPeriods
};
