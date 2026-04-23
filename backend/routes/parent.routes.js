import express from 'express';
import { getParentProfile, updateParentProfile } from '../controllers/parent.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply protection and role check to all routes
router.use(protect, authorize('parent'));

router.get('/me', getParentProfile);
router.patch('/update', upload.single('profileImage'), updateParentProfile);

export default router;
