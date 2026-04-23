import api from './axios';

export const getKidStats = async (profileId) => {
    const response = await api.get(`/game/stats/${profileId}`);
    return response.data;
};

export const chatWithFoodBuddy = async (profileId, message) => {
    // Note: our backend route is POST /api/game/chat/:id
    const response = await api.post(`/game/chat/${profileId}`, { profileId, message });
    return response.data;
};
