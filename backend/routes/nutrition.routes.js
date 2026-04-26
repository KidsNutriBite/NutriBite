import express from 'express';
import { getNutritionAnalysis } from '../controllers/nutrition.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @route   GET /api/nutrition-analysis/:id
 * @desc    Get rule-based nutrition analysis, deficiencies, and grocery list
 * @access  Private (Parent/Doctor)
 */
router.get('/:id', checkProfileOwnership, getNutritionAnalysis);

export default router;
