import api from './axios';

/**
 * Parent requests a new teleconsultation
 */
export const requestTeleconsultation = async (payload) => {
    const res = await api.post('/consultations/teleconsult/request', payload);
    return res.data?.data || res.data;
};

/**
 * Get all teleconsultations for the logged-in parent
 */
export const getParentTeleconsultations = async () => {
    const res = await api.get('/consultations/teleconsult/parent');
    return res.data?.data || [];
};

/**
 * Get all teleconsultations for the logged-in doctor
 */
export const getDoctorTeleconsultations = async () => {
    const res = await api.get('/consultations/teleconsult/doctor');
    return res.data?.data || [];
};

/**
 * Doctor reviews a consultation request (Accept or Reject)
 */
export const reviewTeleconsultation = async (requestId, { action, rejectionReason }) => {
    const res = await api.post(`/consultations/teleconsult/${requestId}/review`, { action, rejectionReason });
    return res.data?.data || res.data;
};

/**
 * Doctor schedules an accepted consultation
 */
export const scheduleTeleconsultation = async (requestId, { scheduledDate, scheduledTime, scheduledDuration, scheduledNotes }) => {
    const res = await api.post(`/consultations/teleconsult/${requestId}/schedule`, {
        scheduledDate,
        scheduledTime,
        scheduledDuration,
        scheduledNotes
    });
    return res.data?.data || res.data;
};

/**
 * Doctor starts the consultation (Generates call room & unlocks parent join)
 */
export const startTeleconsultation = async (requestId) => {
    const res = await api.post(`/consultations/teleconsult/${requestId}/start`);
    return res.data?.data || res.data;
};

/**
 * Join consultation session (Strict gatekeeping)
 */
export const joinTeleconsultation = async (requestId) => {
    const res = await api.post(`/consultations/teleconsult/${requestId}/join`);
    return res.data?.data || res.data;
};

/**
 * Doctor ends the consultation and saves clinical notes
 */
export const endTeleconsultation = async (requestId, payload = {}) => {
    const res = await api.post(`/consultations/teleconsult/${requestId}/end`, payload);
    return res.data?.data || res.data;
};

/**
 * Get live status of consultation
 */
export const getTeleconsultationStatus = async (requestId) => {
    const res = await api.get(`/consultations/teleconsult/${requestId}/status`);
    return res.data?.data || res.data;
};
