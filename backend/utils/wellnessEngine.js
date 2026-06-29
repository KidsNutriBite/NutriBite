import { computeDynamicWellnessScore } from './nutritionIntelligence.js';

/**
 * Child Wellness Intelligence Engine (Wrapper)
 * Delegates calculations to the clinical-grade Pediatric Nutrition Intelligence Engine.
 */
export const computeWellnessAnalysis = (profile, mealLogs = []) => {
    return computeDynamicWellnessScore(profile, mealLogs);
};
