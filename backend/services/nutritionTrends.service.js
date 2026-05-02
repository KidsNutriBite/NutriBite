/**
 * Nutrition Trends Service
 * Handles calculation of daily/weekly nutrition totals and insight generation
 */
import MealLog from '../models/MealLog.model.js';

// Recommended daily intake values (can be adjusted per child age/needs)
const DAILY_RECOMMENDATIONS = {
    protein: 50, // grams
    carbs: 300, // grams
    fats: 65, // grams
    calories: 2000 // kcal
};

/**
 * Calculate total nutrition for all meals in a meal log
 * @param {Object} mealLog - The meal log document
 * @returns {Object} Total nutrition values
 */
export const calculateDailyTotals = (mealLog) => {
    const totals = {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
        fiber: 0,
        water: 0,
        foodItems: []
    };

    if (!mealLog) return totals;

    const mealTypes = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];

    mealTypes.forEach(mealType => {
        if (mealLog[mealType] && Array.isArray(mealLog[mealType])) {
            mealLog[mealType].forEach(foodItem => {
                totals.protein += foodItem.protein || 0;
                totals.carbs += foodItem.carbs || 0;
                totals.fats += foodItem.fats || 0;
                totals.calories += foodItem.calories || 0;
                totals.fiber += foodItem.fiber || 0;
                totals.water += foodItem.water || 0;
                totals.foodItems.push({
                    name: foodItem.name,
                    mealType,
                    protein: foodItem.protein,
                    carbs: foodItem.carbs,
                    fats: foodItem.fats,
                    calories: foodItem.calories
                });
            });
        }
    });

    // Round to 2 decimal places
    totals.protein = Math.round(totals.protein * 100) / 100;
    totals.carbs = Math.round(totals.carbs * 100) / 100;
    totals.fats = Math.round(totals.fats * 100) / 100;
    totals.calories = Math.round(totals.calories * 100) / 100;
    totals.fiber = Math.round(totals.fiber * 100) / 100;
    totals.water = Math.round(totals.water * 100) / 100;

    return totals;
};

/**
 * Get nutrition summary with percentages of daily recommendations
 * @param {Object} totals - Daily nutrition totals
 * @returns {Object} Summary with percentages
 */
export const getNutritionSummary = (totals) => {
    return {
        protein: {
            value: totals.protein,
            recommended: DAILY_RECOMMENDATIONS.protein,
            percentage: Math.round((totals.protein / DAILY_RECOMMENDATIONS.protein) * 100),
            unit: 'g'
        },
        carbs: {
            value: totals.carbs,
            recommended: DAILY_RECOMMENDATIONS.carbs,
            percentage: Math.round((totals.carbs / DAILY_RECOMMENDATIONS.carbs) * 100),
            unit: 'g'
        },
        fats: {
            value: totals.fats,
            recommended: DAILY_RECOMMENDATIONS.fats,
            percentage: Math.round((totals.fats / DAILY_RECOMMENDATIONS.fats) * 100),
            unit: 'g'
        },
        calories: {
            value: totals.calories,
            recommended: DAILY_RECOMMENDATIONS.calories,
            percentage: Math.round((totals.calories / DAILY_RECOMMENDATIONS.calories) * 100),
            unit: 'kcal'
        }
    };
};

/**
 * Generate insights based on nutrition data
 * @param {Object} summary - Nutrition summary
 * @returns {Array} Array of insight messages
 */
export const generateInsights = (summary) => {
    const insights = [];

    // Protein insights
    if (summary.protein.percentage < 60) {
        insights.push({
            type: 'warning',
            nutrient: 'Protein',
            message: `Protein intake is low today (${summary.protein.value}g/${summary.protein.recommended}g). Add more eggs, chicken, or dairy!`,
            severity: 'high'
        });
    } else if (summary.protein.percentage < 80) {
        insights.push({
            type: 'info',
            nutrient: 'Protein',
            message: `Protein intake is below target (${summary.protein.value}g/${summary.protein.recommended}g). Consider adding protein-rich foods.`,
            severity: 'medium'
        });
    } else if (summary.protein.percentage > 120) {
        insights.push({
            type: 'info',
            nutrient: 'Protein',
            message: `Great protein intake! (${summary.protein.value}g)`,
            severity: 'low'
        });
    }

    // Carbs insights
    if (summary.carbs.percentage < 60) {
        insights.push({
            type: 'warning',
            nutrient: 'Carbs',
            message: `Carbs are low today (${summary.carbs.value}g/${summary.carbs.recommended}g). Add whole grains or fruits!`,
            severity: 'high'
        });
    } else if (summary.carbs.percentage > 130) {
        insights.push({
            type: 'info',
            nutrient: 'Carbs',
            message: `Carbs are high this week (${summary.carbs.value}g/${summary.carbs.recommended}g). Balance with proteins and vegetables.`,
            severity: 'medium'
        });
    }

    // Fats insights
    if (summary.fats.percentage < 50) {
        insights.push({
            type: 'info',
            nutrient: 'Fats',
            message: `Fats are below recommended level (${summary.fats.value}g/${summary.fats.recommended}g). Include healthy fats like nuts or avocado.`,
            severity: 'low'
        });
    } else if (summary.fats.percentage > 130) {
        insights.push({
            type: 'warning',
            nutrient: 'Fats',
            message: `Fat intake is high (${summary.fats.value}g/${summary.fats.recommended}g). Opt for leaner options.`,
            severity: 'medium'
        });
    }

    // Calories insights
    if (summary.calories.percentage < 70) {
        insights.push({
            type: 'info',
            nutrient: 'Calories',
            message: `Daily calories are low (${summary.calories.value}kcal/${summary.calories.recommended}kcal). Ensure child is eating enough.`,
            severity: 'medium'
        });
    } else if (summary.calories.percentage > 120) {
        insights.push({
            type: 'warning',
            nutrient: 'Calories',
            message: `Daily calories are high (${summary.calories.value}kcal/${summary.calories.recommended}kcal). Watch portion sizes.`,
            severity: 'medium'
        });
    }

    return insights;
};

/**
 * Get nutrition trends for a week
 * @param {String} profileId - Profile ID
 * @param {String} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Weekly nutrition data
 */
export const getWeeklyTrends = async (profileId, endDate) => {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 6); // Get 7 days including end date

    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    const logs = await MealLog.find({
        profileId,
        date: { $gte: startDateStr, $lte: endDateStr }
    }).sort({ date: 1 });

    const dailyData = {};
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = formatDate(currentDate);
        dailyData[dateStr] = {
            date: dateStr,
            protein: 0,
            carbs: 0,
            fats: 0,
            calories: 0,
            fiber: 0,
            logged: false
        };
    }

    // Fill in actual data
    logs.forEach(log => {
        const totals = calculateDailyTotals(log);
        dailyData[log.date] = {
            date: log.date,
            protein: totals.protein,
            carbs: totals.carbs,
            fats: totals.fats,
            calories: totals.calories,
            fiber: totals.fiber,
            logged: true
        };
    });

    // Calculate weekly averages
    const weeklyData = Object.values(dailyData);
    const loggedDays = weeklyData.filter(d => d.logged).length;

    const averages = {
        protein: loggedDays > 0 ? Math.round((weeklyData.reduce((sum, d) => sum + d.protein, 0) / loggedDays) * 100) / 100 : 0,
        carbs: loggedDays > 0 ? Math.round((weeklyData.reduce((sum, d) => sum + d.carbs, 0) / loggedDays) * 100) / 100 : 0,
        fats: loggedDays > 0 ? Math.round((weeklyData.reduce((sum, d) => sum + d.fats, 0) / loggedDays) * 100) / 100 : 0,
        calories: loggedDays > 0 ? Math.round((weeklyData.reduce((sum, d) => sum + d.calories, 0) / loggedDays) * 100) / 100 : 0,
        fiber: loggedDays > 0 ? Math.round((weeklyData.reduce((sum, d) => sum + d.fiber, 0) / loggedDays) * 100) / 100 : 0
    };

    return {
        week: {
            startDate: startDateStr,
            endDate: endDateStr,
            daysLogged: loggedDays,
            totalDays: 7
        },
        daily: weeklyData,
        averages,
        summary: getNutritionSummary(averages)
    };
};

/**
 * Get nutrition trends for a month
 * @param {String} profileId - Profile ID
 * @param {String} month - Month in format YYYY-MM
 * @returns {Object} Monthly nutrition data
 */
export const getMonthlyTrends = async (profileId, month) => {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    
    // Get last day of month
    const endDateObj = new Date(year, parseInt(monthNum), 0);
    const endDate = endDateObj.toISOString().split('T')[0];

    const logs = await MealLog.find({
        profileId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    let totalProtein = 0,
        totalCarbs = 0,
        totalFats = 0,
        totalCalories = 0,
        totalFiber = 0;
    let daysLogged = 0;
    const dailyBreakdown = [];

    logs.forEach(log => {
        const totals = calculateDailyTotals(log);
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFats += totals.fats;
        totalCalories += totals.calories;
        totalFiber += totals.fiber;
        daysLogged++;

        dailyBreakdown.push({
            date: log.date,
            protein: totals.protein,
            carbs: totals.carbs,
            fats: totals.fats,
            calories: totals.calories,
            fiber: totals.fiber
        });
    });

    const averages = daysLogged > 0 ? {
        protein: Math.round((totalProtein / daysLogged) * 100) / 100,
        carbs: Math.round((totalCarbs / daysLogged) * 100) / 100,
        fats: Math.round((totalFats / daysLogged) * 100) / 100,
        calories: Math.round((totalCalories / daysLogged) * 100) / 100,
        fiber: Math.round((totalFiber / daysLogged) * 100) / 100
    } : {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
        fiber: 0
    };

    return {
        month: {
            year: parseInt(year),
            month: parseInt(monthNum),
            daysLogged,
            startDate,
            endDate
        },
        daily: dailyBreakdown,
        totals: {
            protein: Math.round(totalProtein * 100) / 100,
            carbs: Math.round(totalCarbs * 100) / 100,
            fats: Math.round(totalFats * 100) / 100,
            calories: Math.round(totalCalories * 100) / 100,
            fiber: Math.round(totalFiber * 100) / 100
        },
        averages,
        summary: getNutritionSummary(averages)
    };
};

export default {
    calculateDailyTotals,
    getNutritionSummary,
    generateInsights,
    getWeeklyTrends,
    getMonthlyTrends,
    DAILY_RECOMMENDATIONS
};
