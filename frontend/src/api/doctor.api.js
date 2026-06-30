import api from './axios';

export const getMyPatients = async () => {
    const response = await api.get('/doctor/patients');
    return response.data;
};

export const getPatientDetails = async (id) => {
    const response = await api.get(`/doctor/patients/${id}`);
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

export const getGrowthVelocity = async (profileId) => {
    const response = await api.get(`/doctor/patients/${profileId}/growth-velocity`);
    return response.data;
};

