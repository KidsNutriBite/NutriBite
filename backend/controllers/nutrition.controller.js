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

        // Remove the nested score structure to match exactly the required API output format
        // The prompt requested score: 75 instead of score: { value: 75, status: "..." }
        // But also status is helpful. We will just flatten it based on prompt:
        // { ..., score: 75, ... }
        
        const responseData = {
            deficiencies: analysis.deficiencies,
            suggestions: analysis.suggestions,
            risks: analysis.risks,
            score: analysis.score.value,
            scoreStatus: analysis.score.status,
            groceryList: analysis.groceryList,
            explanations: analysis.explanations,
            // Include extra helpful data
            dailyAverages: analysis.dailyAverages,
            requiredDaily: analysis.requiredDaily
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error in getNutritionAnalysis:", error);
        res.status(500).json({ message: "Failed to generate nutrition analysis", error: error.message });
    }
};
