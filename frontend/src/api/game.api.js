import api from './axios';

export const getKidStats = async (profileId) => {
    const response = await api.get(`/game/stats/${profileId}`);
    return response.data;
};

export const chatWithFoodBuddy = async (profileId, message) => {
    const response = await api.post(`/game/chat/${profileId}`, { profileId, message });
    return response.data;
};

export const logMealKid = async (profileId, mealType, foodName, calories = 150, protein = 5) => {
    const response = await api.post(`/game/log-meal-kid/${profileId}`, { profileId, mealType, foodName, calories, protein });
    return response.data;
};

export const equipCompanion = async (profileId, companionName) => {
    const response = await api.post(`/game/equip/${profileId}`, { profileId, companionName });
    return response.data;
};
