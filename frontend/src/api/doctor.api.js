import api from './axios';

export const requestAccess = async (email) => {
    const response = await api.post('/doctor/request-access', { email });
    return response.data;
};

export const getMyPatients = async () => {
    const response = await api.get('/doctor/patients');
    return response.data;
};

export const getPatientDetails = async (id) => {
    const response = await api.get(`/doctor/patients/${id}`);
    return response.data;
};

export const requestFullAccess = async (id, message) => {
    const response = await api.post(`/doctor/patients/${id}/request-full-access`, { message });
    return response.data;
};

export const getNearbyDoctors = async (lat, lng, radius = 10) => {
    const response = await api.get(`/doctor/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
};

export const getEscalations = async () => {
    // Currently this endpoint returns list of EscalationEvents
    // Assuming backend returns simple JSON array
    const response = await api.get('/escalations');
    return response.data;
};

export const resolveEscalation = async (id) => {
    const response = await api.post(`/escalations/${id}/resolve`);
    return response.data;
};
