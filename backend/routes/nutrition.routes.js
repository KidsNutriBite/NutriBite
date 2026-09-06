import express from 'express';
import { getNutritionAnalysis, suggestSlot, saveDietPlan, getSavedDietPlan } from '../controllers/nutrition.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @route   POST /api/nutrition-analysis/plan/suggest-slot
 * @desc    Suggest Gemini AI dishes for a blank/empty slot
 * @access  Private (Parent/Doctor)
 */
router.post('/plan/suggest-slot', suggestSlot);

/**
 * @route   POST /api/nutrition-analysis/plan/save
 * @desc    Save customized diet plan for child profile
 * @access  Private (Parent)
 */
router.post('/plan/save', saveDietPlan);

/**
 * @route   GET /api/nutrition-analysis/plan/saved/:id
 * @desc    Get saved customized diet plan for child profile
 * @access  Private (Parent/Doctor)
 */
router.get('/plan/saved/:id', getSavedDietPlan);

/**
 * @route   GET /api/nutrition-analysis/:id
 * @desc    Get rule-based nutrition analysis, deficiencies, grocery list, and daily/weekly plan
 * @access  Private (Parent/Doctor)
 */
router.get('/:id', checkProfileOwnership, getNutritionAnalysis);

export default router;
