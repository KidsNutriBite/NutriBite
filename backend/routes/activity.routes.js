import express from 'express';
import { logActivity, getDailyActivity, getActivityHistory, deleteActivity } from '../controllers/activity.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/:profileId/log', logActivity);
router.get('/:profileId/daily', getDailyActivity);
router.get('/:profileId/history', getActivityHistory);
router.delete('/:profileId/:logId/:activityId', deleteActivity);

export default router;
