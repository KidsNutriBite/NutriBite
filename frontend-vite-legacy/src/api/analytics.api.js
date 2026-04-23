import api from './axios';

export const getMealFrequency = async (profileId) => {
    const response = await api.get(`/analytics/meal-frequency/${profileId}`);
    return response.data;
};

export const getPrescriptions = async (profileId) => {
    const response = await api.get(`/analytics/prescriptions/${profileId}`);
    return response.data;
};

export const createPrescription = async (data) => {
    const response = await api.post('/analytics/prescriptions', data);
    return response.data;
};

export const getNutritionTrends = async (profileId) => {
    const response = await api.get(`/analytics/nutrition-trends/${profileId}`);
    return response.data;
};
