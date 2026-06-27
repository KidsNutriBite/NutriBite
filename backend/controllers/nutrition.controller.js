import { analyzeNutrition } from '../services/nutritionService.js';

/**
 * Controller to handle nutrition analysis request
 * GET /api/nutrition-analysis/:childId
 */
export const getNutritionAnalysis = async (req, res) => {
    try {
        const profileId = req.params.id;
        const sunlightMinutes = req.query.sunlight ? parseInt(req.query.sunlight, 10) : 0;

        const analysis = await analyzeNutrition(profileId, sunlightMinutes);
        
        const responseData = {
            deficiencies: analysis.deficiencies,
            suggestions: analysis.suggestions,
            risks: analysis.risks,
            score: analysis.score.value,
            scoreStatus: analysis.score.status,
            groceryList: analysis.groceryList,
            explanations: analysis.explanations,
            dailyAverages: analysis.dailyAverages,
            requiredDaily: analysis.requiredDaily,
            
            // Expose the advanced sub-scores and plans
            nutritionScore: analysis.nutritionScore,
            deficiencyScore: analysis.deficiencyScore,
            growthRiskScore: analysis.growthRiskScore,
            hydrationScore: analysis.hydrationScore,
            mealQualityScore: analysis.mealQualityScore,
            improvementPlan: analysis.improvementPlan,
            growthImpacts: analysis.growthImpacts,
            aiExplanation: analysis.aiExplanation
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error in getNutritionAnalysis:", error);
        res.status(500).json({ message: "Failed to generate nutrition analysis", error: error.message });
    }
};
