import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
    createAppointment as createAppointmentService,
    getParentAppointments as getParentAppointmentsService,
    cancelAppointment as cancelAppointmentService
} from '../services/appointment.service.js';

// @desc    Book a new appointment
// @route   POST /api/appointments/book
// @access  Private (Parent)
export const bookAppointment = asyncHandler(async (req, res) => {
    const appointment = await createAppointmentService(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, appointment, 'Appointment booked successfully'));
});

// @desc    Get all appointments for parent
// @route   GET /api/appointments
// @access  Private (Parent)
export const getMyAppointments = asyncHandler(async (req, res) => {
    const appointments = await getParentAppointmentsService(req.user._id);
    res.status(200).json(new ApiResponse(200, appointments));
});

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Parent)
export const cancelAppointment = asyncHandler(async (req, res) => {
    const appointment = await cancelAppointmentService(req.user._id, req.params.id);
    res.status(200).json(new ApiResponse(200, appointment, 'Appointment cancelled'));
});
