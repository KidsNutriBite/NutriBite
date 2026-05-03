import api from './axios';

export const logActivity = async (profileId, data) => {
    const response = await api.post(`/activity/${profileId}/log`, data);
    return response.data;
};

export const getDailyActivity = async (profileId, date) => {
    const response = await api.get(`/activity/${profileId}/daily?date=${date}`);
    return response.data;
};

export const getActivityHistory = async (profileId) => {
    const response = await api.get(`/activity/${profileId}/history`);
    return response.data;
};

export const deleteActivity = async (profileId, logId, activityId) => {
    const response = await axiosInstance.delete(`/activity/${profileId}/${logId}/${activityId}`);
    return response.data;
};
