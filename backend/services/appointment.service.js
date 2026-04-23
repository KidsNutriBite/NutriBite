import Appointment from '../models/Appointment.model.js';
import Profile from '../models/Profile.model.js';

export const createAppointment = async (parentId, appointmentData) => {
    const { profileId, hospitalId, hospitalName, date, time, reason, medicalReport } = appointmentData;

    // 1. Validate Parent owns Profile
    const profile = await Profile.findOne({ _id: profileId, parentId });
    if (!profile) {
        throw new Error('Profile not found or unauthorized');
    }

    // 2. Validate Future Date
    const appointmentDate = new Date(date);
    if (appointmentDate < new Date()) {
        throw new Error('Appointment date must be in the future');
    }

    // 3. Validate Duplicate Booking (Handled by DB index, but acceptable to check logic)
    // We leverage DB unique index on { profileId, hospitalId, date, time }

    // 4. Create
    const appointment = await Appointment.create({
        parentId,
        profileId,
        hospitalId,
        hospitalName,
        date: appointmentDate,
        time,
        reason,
        medicalReport
    });

    return appointment;
};

export const getParentAppointments = async (parentId) => {
    return await Appointment.find({ parentId })
        .populate('profileId', 'name avatar')
        .sort({ date: 1 });
};

export const cancelAppointment = async (parentId, appointmentId) => {
    const appointment = await Appointment.findOne({ _id: appointmentId, parentId });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
        throw new Error('Appointment is already cancelled');
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return appointment;
};
