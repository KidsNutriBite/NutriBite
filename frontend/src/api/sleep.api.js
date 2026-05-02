import api from './axios';

export const logSleep = async (sleepData) => {
    const response = await api.post('/sleep', sleepData);
    return response.data;
};

export const getSleepHistory = async (profileId) => {
    const response = await api.get(`/sleep/history/${profileId}`);
    return response.data;
};

export const getSleepByDate = async (profileId, date) => {
    const response = await api.get(`/sleep/${profileId}/${date}`);
    return response.data;
};
