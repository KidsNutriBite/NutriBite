import api from './axios';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const verify2FA = async (email, otp) => {
    const response = await api.post('/auth/verify-2fa', { email, otp });
    return response.data;
};

export const resend2FA = async (email) => {
    const response = await api.post('/auth/resend-2fa', { email });
    return response.data;
};