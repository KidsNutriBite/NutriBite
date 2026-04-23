import api from './axios';

// LOG/UPDATE Meal
export const logMeal = async (mealData) => {
    // If mealData is FormData, let axios set content-type
    const response = await api.post('/meals', mealData);
    return response.data;
};

// GET HISTORY (Last 30 Days)
export const getMealHistory = async (profileId) => {
    const response = await api.get(`/meals/history/${profileId}`);
    return response.data;
};

// GET BY DATE
export const getMealsByDate = async (profileId, date) => {
    const response = await api.get(`/meals/by-date/${profileId}/${date}`);
    return response.data;
};

// DELETE ITEM
export const deleteFoodItem = async (logId, mealType, itemId) => {
    const response = await api.delete('/meals/item', {
        data: { logId, mealType, itemId }
    });
    return response.data;
};
