import express from 'express';
import {
    requestAccess,
    getMyPatients,
    getPatientDetails,
    getNearbyDoctors,
    updatePatientNotes,
    getDoctorProfile,
    updateDoctorProfile,
    getAllDoctors,
    requestFullAccess
} from '../controllers/doctor.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkDoctorAccess } from '../middlewares/doctor.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public/Parent Routes (Protected by Token)
router.get('/nearby', protect, authorize('parent'), getNearbyDoctors);

// Doctor Routes
router.use(protect);

router.get('/all', getAllDoctors); // Accessible by parents too

router.use(authorize('doctor'));
router.get('/me', getDoctorProfile);
router.patch('/update', upload.single('profileImage'), updateDoctorProfile);
router.post('/request-access', requestAccess);
router.get('/patients', getMyPatients);
router.get('/patients/:id', checkDoctorAccess, getPatientDetails);
router.post('/patients/:id/request-full-access', checkDoctorAccess, requestFullAccess);
router.patch('/patients/:id/notes', checkDoctorAccess, updatePatientNotes);

export default router;
