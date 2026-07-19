import express from 'express';
import {
    createRequest,
    getAvailableDoctorsForDietitian,
    assignDoctor,
    reassignDoctor,
    transferConsultation,
    closeConsultation,
    getDietitianCases,
    getDoctorCases,
    getParentHistory,
    getConsultationDetails,
    getAvailableDietitians,
    updateStatus,
    updateDietitianNotes,
    updateDoctorNotes,
    generateVideoCallSummary
} from '../controllers/consultation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);

// Parent routes
router.post('/', authorize('parent'), createRequest);
router.get('/parent/:profileId', authorize('parent'), getParentHistory);

// Dietitian routes
router.get('/dietitian/cases', authorize('dietitian'), getDietitianCases);
router.get('/dietitian/list-available', authorize('dietitian'), getAvailableDietitians);
router.get('/dietitian/available-doctors/:requestId', authorize('dietitian'), getAvailableDoctorsForDietitian);
router.post('/:requestId/assign-doctor', authorize('dietitian'), assignDoctor);
router.post('/:requestId/reassign-doctor', authorize('dietitian'), reassignDoctor);
router.post('/:requestId/transfer', authorize('dietitian'), transferConsultation);
router.patch('/:requestId/dietitian-notes', authorize('dietitian'), updateDietitianNotes);

// Doctor routes
router.get('/doctor/cases', authorize('doctor'), getDoctorCases);
router.patch('/:requestId/doctor-notes', authorize('doctor'), updateDoctorNotes);

// Shared dietitian/doctor routes
router.post('/:requestId/close', authorize('parent', 'dietitian', 'doctor'), closeConsultation);
router.patch('/:requestId/status', authorize('dietitian', 'doctor'), updateStatus);

// Shared parent/dietitian/doctor details route
router.get('/:requestId', getConsultationDetails);

// Video call AI summary (accessible to all roles)
router.post('/:requestId/video-summary', authorize('parent', 'doctor', 'dietitian'), generateVideoCallSummary);

export default router;
