import express from 'express';
import { getEscalations, resolveEscalation } from '../controllers/escalation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.get('/', getEscalations);
router.post('/:id/resolve', resolveEscalation);

export default router;
