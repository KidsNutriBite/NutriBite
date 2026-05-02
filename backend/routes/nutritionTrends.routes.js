import express from 'express';
import {
    getDailyNutritionSummary,
    getTodayNutritionSummary,
    getWeeklyNutritionTrends,
    getThisWeekNutritionTrends,
    getMonthlyNutritionTrends,
    getThisMonthNutritionTrends,
    compareNutritionPeriods
} from '../controllers/nutritionTrends.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('parent'));

/**
 * @route   GET /api/nutrition-trends/today/:profileId
 * @desc    Get today's nutrition summary with insights
 * @access  Private (Parent)
 */
router.get('/today/:profileId', checkProfileOwnership, getTodayNutritionSummary);

/**
 * @route   GET /api/nutrition-trends/daily/:profileId/:date
 * @desc    Get nutrition summary for a specific date (YYYY-MM-DD)
 * @access  Private (Parent)
 */
router.get('/daily/:profileId/:date', checkProfileOwnership, getDailyNutritionSummary);

/**
 * @route   GET /api/nutrition-trends/weekly/:profileId
 * @desc    Get this week's nutrition trends
 * @access  Private (Parent)
 */
router.get('/weekly/:profileId', checkProfileOwnership, getThisWeekNutritionTrends);

/**
 * @route   GET /api/nutrition-trends/weekly/:profileId/:date
 * @desc    Get weekly nutrition trends ending on specified date (YYYY-MM-DD)
 * @access  Private (Parent)
 */
router.get('/weekly/:profileId/:date', checkProfileOwnership, getWeeklyNutritionTrends);

/**
 * @route   GET /api/nutrition-trends/monthly/:profileId
 * @desc    Get this month's nutrition trends
 * @access  Private (Parent)
 */
router.get('/monthly/:profileId', checkProfileOwnership, getThisMonthNutritionTrends);

/**
 * @route   GET /api/nutrition-trends/monthly/:profileId/:month
 * @desc    Get nutrition trends for specific month (YYYY-MM)
 * @access  Private (Parent)
 */
router.get('/monthly/:profileId/:month', checkProfileOwnership, getMonthlyNutritionTrends);

/**
 * @route   GET /api/nutrition-trends/compare/:profileId/:startDate/:endDate
 * @desc    Compare nutrition between two dates (YYYY-MM-DD)
 * @access  Private (Parent)
 */
router.get('/compare/:profileId/:startDate/:endDate', checkProfileOwnership, compareNutritionPeriods);

export default router;
