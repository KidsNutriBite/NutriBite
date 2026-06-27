import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import { computeDynamicWellnessScore } from '../utils/nutritionIntelligence.js';

export const analyzeNutrition = async (profileId, sunlightMinutes = 0) => {
    // 1. Fetch Profile
    const profile = await Profile.findById(profileId);
    if (!profile) {
        throw new Error('Profile not found');
    }

    // 2. Fetch Meal Logs (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const logs = await MealLog.find({
        profileId,
        date: { $gte: dateString }
    }).sort({ date: -1 });

    // 3. Compute dynamic wellness & nutrition data using new engine
    const analysis = computeDynamicWellnessScore(profile, logs);
    
    // Extrapolate daily averages and target requirements for response
    // The engine's deficits dictionary has consumed and target values for the 12 nutrients.
    const avg = {};
    const required = {};
    const uiDeficiencies = [];
    const uiSuggestions = [];
    const uiExplanations = [];

    const nutrients = ['calories', 'protein', 'carbs', 'fats', 'fiber', 'iron', 'calcium', 'vitaminA', 'vitaminC', 'vitaminD', 'zinc', 'water'];
    
    nutrients.forEach(n => {
        const item = analysis.deficiencies[n];
        avg[n] = item.consumed;
        required[n] = item.target;

        // If nutrient met percentage is below 90% (meaning Yellow/Orange/Red severity)
        if (item.metPercent < 90) {
            uiDeficiencies.push({
                nutrient: n,
                status: "low",
                message: `${n.charAt(0).toUpperCase() + n.slice(1)} intake is below the recommended level (${item.metPercent}% met)`
            });
        }
    });

    // Populate suggestions and explanations based on deficiency findings
    analysis.recommendations.forEach(rec => {
        const rawNutrient = rec.concern.replace('Target Deficiency: ', '').toLowerCase();
        // E.g., rec.solution is "AI Recommended Foods: Eggs, Chicken Breast, Fish Fillet"
        const foods = rec.solution.replace('AI Recommended Foods: ', '').split(', ');
        
        uiSuggestions.push({
            nutrient: rawNutrient,
            suggestedFoods: foods
        });

        foods.forEach(food => {
            uiExplanations.push(`${food} is a premium source of ${rawNutrient} recommended by pediatric guidelines to address this gap.`);
        });
    });

    // Generate predictive risk tags based on growth impacts
    const risks = analysis.growthImpacts.map(i => `${i.nutrient}: ${i.risk}`);

    // Return payload matching the expected shape in nutrition.controller.js
    return {
        dailyAverages: avg,
        requiredDaily: required,
        deficiencies: uiDeficiencies,
        suggestions: uiSuggestions,
        risks,
        score: {
            value: analysis.score,
            status: analysis.score >= 80 ? 'Excellent' : (analysis.score >= 60 ? 'Needs Improvement' : 'Needs Critical Attention')
        },
        groceryList: analysis.groceries,
        explanations: uiExplanations,
        
        // Add sub-scores for enhanced UI display
        nutritionScore: analysis.nutritionScore,
        deficiencyScore: analysis.deficiencyScore,
        growthRiskScore: analysis.growthRiskScore,
        hydrationScore: analysis.hydrationScore,
        mealQualityScore: analysis.mealQualityScore,
        improvementPlan: analysis.improvementPlan,
        growthImpacts: analysis.growthImpacts,
        aiExplanation: analysis.aiExplanation
    };
};
