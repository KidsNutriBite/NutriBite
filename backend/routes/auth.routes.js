import express from 'express';
import { registerUser, loginUser, getMe, forgotPassword, resetPassword, verify2FA, resend2FA } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FA);

export default router;
