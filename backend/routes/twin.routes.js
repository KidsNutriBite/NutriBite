import express from 'express';
import { getDigitalTwin } from '../controllers/twin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';

const router = express.Router();

// Apply auth protection middleware to all endpoints
router.use(protect);

/**
 * @route   GET /api/twin/:id
 * @desc    Fetch child's digital twin status, predictions, insights and radar metrics
 * @access  Private (Parent/Doctor)
 */
router.get('/:id', checkProfileOwnership, getDigitalTwin);

export default router;
