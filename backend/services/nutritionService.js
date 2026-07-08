import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import { computeDynamicWellnessScore } from '../utils/nutritionIntelligence.js';
import { ResponseBuilder } from './nutritionIntelligenceEngine.js';

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

    // 3. Compute dynamic wellness using the new modular engine
    const analysis = ResponseBuilder.build(profile, logs);
    
    // Extrapolate daily averages and target requirements for response
    const avg = {};
    const required = {};
    const uiDeficiencies = [];
    const uiSuggestions = [];
    const uiExplanations = [];

    Object.keys(analysis.gaps).forEach(n => {
        const item = analysis.gaps[n];
        avg[n] = item.consumed;
        required[n] = item.target;

        if (item.severity !== 'Normal') {
            uiDeficiencies.push({
                nutrient: n,
                status: "low",
                message: `${item.label} intake is below the recommended level (${item.metPercent}% met)`
            });
        }
    });

    // Populate suggestions and explanations based on deficiency findings
    analysis.recommendations.forEach(rec => {
        uiSuggestions.push({
            nutrient: rec.nutrient,
            suggestedFoods: [rec.recommendedFood]
        });
        uiExplanations.push(rec.whyThisFood);
    });

    const risks = analysis.growthImpacts.map(i => `${i.nutrient}: ${i.risk}`);

    // Return payload matching the expected shape in nutrition.controller.js with new features
    return {
        dailyAverages: avg,
        requiredDaily: required,
        deficiencies: uiDeficiencies,
        suggestions: uiSuggestions,
        risks,
        score: {
            value: analysis.overallScore,
            status: analysis.scoreStatus
        },
        groceryList: analysis.groceryList,
        explanations: uiExplanations,
        
        // Add sub-scores for enhanced UI display
        nutritionScore: analysis.subScores.nutrition,
        deficiencyScore: analysis.subScores.deficiency,
        growthRiskScore: analysis.subScores.growthRisk,
        hydrationScore: analysis.subScores.hydration,
        mealQualityScore: analysis.subScores.mealQuality,
        improvementPlan: generateLegacyPlan(analysis.overallScore, analysis.gaps),
        growthImpacts: analysis.growthImpacts,
        aiExplanation: analysis.aiExplanation,

        // Expose new modular engine payload directly for advanced frontend features
        priorityActions: analysis.priorityActions,
        recommendations: analysis.recommendations,
        gaps: analysis.gaps
    };
};

// Private legacy plan helper for backwards compatibility
const generateLegacyPlan = (currentWellnessScore, gaps) => {
    let worstDeficit = 'protein';
    let maxGap = 0;
    
    const coreNutrients = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
    coreNutrients.forEach(nut => {
        const gapVal = gaps[nut] ? (100 - gaps[nut].metPercent) : 0;
        if (gapVal > maxGap) {
            maxGap = gapVal;
            worstDeficit = nut;
        }
    });

    return {
        currentWellnessScore,
        targetWellnessScore: Math.min(95, currentWellnessScore + Math.round(maxGap * 0.4)),
        expectedDurationDays: maxGap > 50 ? 90 : (maxGap > 30 ? 45 : 30),
        worstDeficit,
        phases: {
            day7: {
                title: "7-Day Foundation Setup",
                action: `Introduce 1 serving of ${worstDeficit === 'water' ? 'extra water glass' : 'rich food like Paneer/Spinach/Ragi'} daily. Keep complete logs of all meals.`,
                improvement: `Sub-scores should show active stabilization and hydration score increases by +15%.`
            },
            day30: {
                title: "30-Day Portion Consolidation",
                action: `Balance portion counters to meet at least 70% (Yellow status) for all active deficiencies. Introduce healthy snacks.`,
                improvement: `Overall Wellness Score targets +10 points increase. Parent logs should show zero red alert days.`
            },
            day90: {
                title: "90-Day Clinical Maintenance",
                action: `Steady RDA target met (>= 90% Green status). Height/weight verification checking.`,
                improvement: `Full potential growth curve tracking.`
            }
        }
    };
};
