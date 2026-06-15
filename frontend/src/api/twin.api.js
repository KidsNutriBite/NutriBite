import api from './axios';

/**
 * Fetch the child's Digital Twin details (baseline state, predictions, and insights).
 * @param {string} profileId - The child's profile ID.
 * @returns {Promise<object>} Twin analysis payload.
 */
export const getDigitalTwin = async (profileId) => {
    const response = await api.get(`/twin/${profileId}`);
    return response.data;
};
