import api from './axios';

export const createProfile = async (profileData) => {
    const response = await api.post('/profiles', profileData);
    return response.data;
};

export const getMyProfiles = async () => {
    const response = await api.get('/profiles');
    return response.data;
};

export const getProfileById = async (id) => {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
};
