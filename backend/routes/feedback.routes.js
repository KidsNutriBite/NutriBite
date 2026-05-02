import express from 'express';
import { submitFeedback } from '../controllers/feedback.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, submitFeedback);

export default router;
