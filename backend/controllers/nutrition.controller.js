import { analyzeNutrition, suggestBlankSlotMeal, saveChildDietPlan } from '../services/nutritionService.js';
import Profile from '../models/Profile.model.js';

/**
 * Controller to handle nutrition analysis request
 * GET /api/nutrition-analysis/:childId
 */
export const getNutritionAnalysis = async (req, res) => {
    try {
        const profileId = req.params.id;
        const sunlightMinutes = req.query.sunlight ? parseInt(req.query.sunlight, 10) : 0;
        const refreshNonce = req.query.refresh ? parseInt(req.query.refresh, 10) : (req.query.nonce ? parseInt(req.query.nonce, 10) : 0);
        const mode = req.query.mode || 'daily';
        const themeIndex = req.query.theme ? parseInt(req.query.theme, 10) : 0;

        const analysis = await analyzeNutrition(profileId, sunlightMinutes, refreshNonce, mode, themeIndex);
        
        const responseData = {
            deficiencies: analysis.deficiencies,
            suggestions: analysis.suggestions,
            risks: analysis.risks,
            score: analysis.score,
            scoreStatus: analysis.scoreStatus || analysis.score.status,
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
            aiExplanation: analysis.aiExplanation,

            // Expose Phase 1 modular outputs
            priorityActions: analysis.priorityActions,
            recommendations: analysis.recommendations,
            gaps: analysis.gaps,

            // Expose Phase 2 Meal Planner outputs (Daily & Weekly)
            mealPlan: analysis.mealPlan,
            weeklyPlan: analysis.weeklyPlan,
            mealPlanSummary: analysis.mealPlanSummary,
            planThemes: analysis.planThemes,
            selectedTheme: analysis.selectedTheme,
            location: analysis.location,
            regionalFocus: analysis.regionalFocus,
            savedPlan: analysis.savedPlan,
            customDietNotes: analysis.customDietNotes,

            // Expose Phase 3 Grocery Optimizer outputs
            groceryPlan: analysis.groceryPlan,
            groceryPlanSummary: analysis.groceryPlanSummary,
            groceryPlanInsights: analysis.groceryPlanInsights
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error in getNutritionAnalysis:", error);
        res.status(500).json({ message: "Failed to generate nutrition analysis", error: error.message });
    }
};

/**
 * Controller to suggest dishes for a blank/empty slot
 * POST /api/nutrition-analysis/plan/suggest-slot
 */
export const suggestSlot = async (req, res) => {
    try {
        const { profileId, slotKey, currentPlan, parentNotes } = req.body;
        if (!profileId || !slotKey) {
            return res.status(400).json({ message: "profileId and slotKey are required" });
        }

        const suggestions = await suggestBlankSlotMeal(profileId, slotKey, currentPlan, parentNotes);
        res.status(200).json({ success: true, slotKey, suggestions });
    } catch (error) {
        console.error("Error in suggestSlot:", error);
        res.status(500).json({ message: "Failed to suggest slot meal", error: error.message });
    }
};

/**
 * Controller to save a customized diet plan for a child
 * POST /api/nutrition-analysis/plan/save
 */
export const saveDietPlan = async (req, res) => {
    try {
        const { profileId, plan, notes } = req.body;
        if (!profileId || !plan) {
            return res.status(400).json({ message: "profileId and plan are required" });
        }

        const result = await saveChildDietPlan(profileId, plan, notes);
        res.status(200).json({ success: true, message: "Diet plan saved successfully!", data: result });
    } catch (error) {
        console.error("Error in saveDietPlan:", error);
        res.status(500).json({ message: "Failed to save diet plan", error: error.message });
    }
};

/**
 * Controller to fetch saved diet plan for a child
 * GET /api/nutrition-analysis/plan/saved/:id
 */
export const getSavedDietPlan = async (req, res) => {
    try {
        const profileId = req.params.id;
        const profile = await Profile.findById(profileId);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({
            success: true,
            savedPlan: profile.savedDietPlan || null,
            customDietNotes: profile.customDietNotes || ''
        });
    } catch (error) {
        console.error("Error in getSavedDietPlan:", error);
        res.status(500).json({ message: "Failed to fetch saved diet plan", error: error.message });
    }
};

