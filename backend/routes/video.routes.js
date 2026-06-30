import express from 'express';
import { getOrCreateRoom } from '../controllers/video.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All authenticated users (parent, doctor, dietitian) can start a call
router.post('/room', protect, getOrCreateRoom);

export default router;
