import api from './axios';

/**
 * Fetch nutrition analysis for a specific child profile.
 * @param {string} profileId - The ID of the child profile.
 * @param {number} sunlight - Sunlight exposure in minutes.
 * @param {number} refresh - Refresh nonce.
 * @param {string} mode - 'daily' | 'weekly'.
 * @param {number} theme - Selected theme index.
 * @returns {Promise<object>} Analysis data from backend.
 */
export const getNutritionAnalysis = async (profileId, sunlight = 0, refresh = 0, mode = 'daily', theme = 0) => {
    const response = await api.get(`/nutrition-analysis/${profileId}?sunlight=${sunlight}&refresh=${refresh}&mode=${mode}&theme=${theme}`);
    return response.data;
};

/**
 * Suggest clinical Indian dishes to fill a blank slot.
 */
export const suggestSlotMeal = async (profileId, slotKey, currentPlan = {}, parentNotes = '') => {
    const response = await api.post(`/nutrition-analysis/plan/suggest-slot`, {
        profileId,
        slotKey,
        currentPlan,
        parentNotes
    });
    return response.data;
};

/**
 * Save customized diet plan for child.
 */
export const saveDietPlan = async (profileId, plan, notes = '') => {
    const response = await api.post(`/nutrition-analysis/plan/save`, {
        profileId,
        plan,
        notes
    });
    return response.data;
};

/**
 * Fetch saved customized diet plan for child.
 */
export const getSavedDietPlan = async (profileId) => {
    const response = await api.get(`/nutrition-analysis/plan/saved/${profileId}`);
    return response.data;
};

