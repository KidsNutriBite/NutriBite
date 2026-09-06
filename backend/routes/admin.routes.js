import express from 'express';
import {
    getAdminDashboardStats,
    getAdminUsers,
    getAdminUserDetails,
    updateAdminUserStatus,
    toggleUser2FA,
    deleteAdminUser,
    getAdminActivityLogs,
    getAdminSecurityOverview,
} from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Enforce authentication AND admin role for all routes in this router
router.use(protect);
router.use(authorize('admin'));

// Dashboard metrics
router.get('/dashboard', getAdminDashboardStats);

// User management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserDetails);
router.patch('/users/:id/status', updateAdminUserStatus);
router.patch('/users/:id/2fa', toggleUser2FA);
router.delete('/users/:id', deleteAdminUser);

// Activity / Audit logs
router.get('/activity', getAdminActivityLogs);

// Security overview
router.get('/security', getAdminSecurityOverview);

export default router;
