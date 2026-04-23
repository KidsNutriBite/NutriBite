import express from 'express';
import { getNearbyHospitals } from '../controllers/hospital.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/nearby', protect, authorize('parent'), getNearbyHospitals);

export default router;
