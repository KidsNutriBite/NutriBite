import express from 'express';
import { bookAppointment, getMyAppointments, cancelAppointment } from '../controllers/appointment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Apply protection and role check
router.use(protect);
router.use(authorize('parent'));

router.post('/book', bookAppointment);
router.get('/', getMyAppointments);
router.patch('/:id/cancel', cancelAppointment);

export default router;
