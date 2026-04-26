import api from './axios';

/**
 * Fetch nutrition analysis for a specific child profile.
 * @param {string} profileId - The ID of the child profile.
 * @param {number} sunlight - Sunlight exposure in minutes.
 * @returns {Promise<object>} Analysis data from backend.
 */
export const getNutritionAnalysis = async (profileId, sunlight = 0) => {
    const response = await api.get(`/nutrition-analysis/${profileId}?sunlight=${sunlight}`);
    return response.data;
};
