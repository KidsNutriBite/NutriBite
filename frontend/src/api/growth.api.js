import axios from './axios';

export const getGrowthHistory = (childId) => {
    return axios.get(`/growth/${childId}`);
};

export const addGrowthRecord = (childId, data) => {
    return axios.post(`/growth/update/${childId}`, data);
};

export const deleteGrowthRecord = (recordId) => {
    return axios.delete(`/growth/${recordId}`);
};
