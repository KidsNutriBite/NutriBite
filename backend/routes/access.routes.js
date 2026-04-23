import express from 'express';
import {
    getPendingRequests,
    approveRequest,
    rejectRequest,
    inviteDoctor,
    getAccessList,
    revokeAccess
} from '../controllers/access.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('parent'));

// Existing routes
router.get('/requests', getPendingRequests);
router.put('/approve/:requestId', approveRequest);
router.put('/reject/:requestId', rejectRequest);

// New routes for Doctor Access Management
router.post('/invite', inviteDoctor);
router.get('/list', getAccessList);
router.put('/revoke/:requestId', revokeAccess);

export default router;
