import express from 'express';
import { getDietitianProfile, updateDietitianProfile } from '../controllers/dietitian.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(authorize('dietitian'));

router.get('/me', getDietitianProfile);
router.patch('/update', upload.single('profileImage'), updateDietitianProfile);

export default router;
