import api from './axios';

// Existing
export const getPendingRequests = async () => {
    const response = await api.get('/access/requests');
    return response.data;
};

export const approveRequest = async (requestId, profileId) => {
    const response = await api.put(`/access/approve/${requestId}`, { profileId });
    return response.data;
};

export const rejectRequest = async (requestId) => {
    const response = await api.put(`/access/reject/${requestId}`);
    return response.data;
};

// New Access Management
export const inviteDoctor = async (email, profileId, message) => {
    const response = await api.post('/access/invite', { email, profileId, message });
    return response.data;
};

export const getAccessList = async () => {
    const response = await api.get('/access/list');
    return response.data;
};


export const revokeAccess = async (requestId) => {
    const response = await api.put(`/access/revoke/${requestId}`);
    return response.data;
};

export const getDoctors = async () => {
    const response = await api.get('/doctor/all');
    return response.data;
};
