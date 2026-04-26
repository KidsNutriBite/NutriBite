import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import { getNutritionalRequirements, calculateNutritionScore } from '../utils/rules.js';
import { foodSuggestions, getExplanation } from '../utils/foodMap.js';

/**
 * Parses iron value from vitamins string or checks item directly.
 * Example vitamins string: "iron: 5mg, vit C: 10mg"
 */
const extractIron = (item) => {
    if (typeof item.iron === 'number') return item.iron;
    if (item.vitamins && typeof item.vitamins === 'string') {
        const match = item.vitamins.toLowerCase().match(/iron[:\s]*(\d+(\.\d+)?)/);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
    }
    return 0; // Default if not found
};

export const analyzeNutrition = async (profileId, sunlightMinutes = 0) => {
    // 1. Fetch Profile
    const profile = await Profile.findById(profileId);
    if (!profile) {
        throw new Error('Profile not found');
    }

    // 2. Define Requirements
    const required = getNutritionalRequirements(profile.age, profile.gender);

    // 3. Fetch Meal Logs (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const logs = await MealLog.find({
        profileId,
        date: { $gte: dateString }
    }).sort({ date: -1 });

    // Aggregate nutrients across logs
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0, totalIron = 0;
    
    // Track daily deficiencies for predictive risk (last 7 days)
    const last7DaysLogs = logs.slice(0, 7);
    let ironDeficientDays = 0;
    let proteinDeficientDays = 0;
    let caloriesDeficientDays = 0;

    // We process each log to calculate averages
    logs.forEach(log => {
        let dailyCalories = 0, dailyProtein = 0, dailyCarbs = 0, dailyFats = 0, dailyIron = 0;

        const mealTypes = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        mealTypes.forEach(meal => {
            if (log[meal] && Array.isArray(log[meal])) {
                log[meal].forEach(item => {
                    dailyCalories += item.calories || 0;
                    dailyProtein += item.protein || 0;
                    dailyCarbs += item.carbs || 0;
                    dailyFats += item.fats || 0;
                    dailyIron += extractIron(item);
                });
            }
        });

        totalCalories += dailyCalories;
        totalProtein += dailyProtein;
        totalCarbs += dailyCarbs;
        totalFats += dailyFats;
        totalIron += dailyIron;

        // Check if this log is within the last 7 days for risk analysis
        if (last7DaysLogs.includes(log)) {
            if (dailyIron < required.iron) ironDeficientDays++;
            if (dailyProtein < required.protein) proteinDeficientDays++;
            if (dailyCalories < required.calories) caloriesDeficientDays++;
        }
    });

    const daysLogged = logs.length || 1; // Prevent division by zero
    
    // Actual Averages
    const avg = {
        calories: totalCalories / daysLogged,
        protein: totalProtein / daysLogged,
        iron: totalIron / daysLogged,
        carbs: totalCarbs / daysLogged,
        fats: totalFats / daysLogged
    };

    // 4. Deficiency Detection Logic
    const deficiencies = [];
    if (avg.calories < required.calories) deficiencies.push({ nutrient: "calories", status: "low", message: "Calorie intake is below recommended level" });
    if (avg.protein < required.protein) deficiencies.push({ nutrient: "protein", status: "low", message: "Protein intake is below recommended level" });
    if (avg.iron < required.iron) deficiencies.push({ nutrient: "iron", status: "low", message: "Iron intake is below recommended level" });
    if (avg.carbs < required.carbs) deficiencies.push({ nutrient: "carbs", status: "low", message: "Carbohydrate intake is below recommended level" });
    if (avg.fats < required.fats) deficiencies.push({ nutrient: "fats", status: "low", message: "Fat intake is below recommended level" });

    // 5. Suggestions and Grocery List & Explanations
    const suggestions = [];
    const grocerySet = new Set();
    const explanations = [];

    deficiencies.forEach(def => {
        const foods = foodSuggestions[def.nutrient];
        if (foods) {
            // Pick top 2-3 foods for suggestion
            const selectedFoods = foods.slice(0, 3);
            suggestions.push({
                nutrient: def.nutrient,
                suggestedFoods: selectedFoods
            });

            selectedFoods.forEach(food => {
                grocerySet.add(food);
                explanations.push(getExplanation(def.nutrient, food));
            });
        }
    });

    // 6. Predictive Risk Logic (5+ days deficient out of last 7)
    const risks = [];
    if (ironDeficientDays >= 5) risks.push("Risk of iron deficiency if current diet continues");
    if (proteinDeficientDays >= 5) risks.push("Risk of protein deficiency if current diet continues");
    if (caloriesDeficientDays >= 5) risks.push("Risk of undernourishment (low calories) if current diet continues");

    // Sunlight tracking
    if (sunlightMinutes < 15) {
        deficiencies.push({ nutrient: "vitaminD", status: "low", message: "Low Vitamin D exposure due to insufficient sunlight" });
        const vitDFoods = foodSuggestions.vitaminD.slice(0, 2);
        suggestions.push({ nutrient: "vitaminD", suggestedFoods: vitDFoods });
        vitDFoods.forEach(food => {
            grocerySet.add(food);
            explanations.push(getExplanation("vitaminD", food));
        });
    }

    // 7. Calculate Score
    const { score, status } = calculateNutritionScore(deficiencies.length);

    // Final Output Format
    return {
        dailyAverages: avg,
        requiredDaily: required,
        deficiencies,
        suggestions,
        risks,
        score: {
            value: score,
            status
        },
        groceryList: Array.from(grocerySet),
        explanations
    };
};
