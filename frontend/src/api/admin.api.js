import api from './axios';

export const getDashboardStats = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

export const getUsers = async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
};

export const getUserDetails = async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const updateUserStatus = async (id, status) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
};

export const toggleUser2FA = async (id, is2FAEnabled) => {
    const response = await api.patch(`/admin/users/${id}/2fa`, { is2FAEnabled });
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const getActivityLogs = async (params = {}) => {
    const response = await api.get('/admin/activity', { params });
    return response.data;
};

export const getSecurityOverview = async () => {
    const response = await api.get('/admin/security');
    return response.data;
};
