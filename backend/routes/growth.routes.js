import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { addGrowthRecord, getGrowthHistory, deleteGrowthRecord } from '../controllers/growth.controller.js';

const router = express.Router();

// Routes
// POST /growth/update/:childId - Add new growth record (Parent or Doctor)
router.post('/update/:childId', protect, addGrowthRecord);

// GET /growth/:childId - Get history
router.get('/:childId', protect, getGrowthHistory);

// DELETE /growth/:recordId - Delete record
router.delete('/:recordId', protect, deleteGrowthRecord);

export default router;
