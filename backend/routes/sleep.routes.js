import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';
import { logSleep, getSleepByDate, getSleepHistory } from '../controllers/sleep.controller.js';

const router = express.Router();

router.use(protect);
router.use(authorize('parent'));

router.post('/', checkProfileOwnership, logSleep);
router.get('/history/:id', checkProfileOwnership, getSleepHistory);
router.get('/:id/:date', checkProfileOwnership, getSleepByDate);

export default router;
