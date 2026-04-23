import express from 'express';
import { getKidStats, chatWithFoodBuddy, getChatHistory } from '../controllers/game.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';

const router = express.Router();

router.use(protect);

// Strictly Parent Only + Own Profile
const parentAccess = [authorize('parent'), checkProfileOwnership];

router.get('/stats/:id', ...parentAccess, getKidStats);
router.get('/chat/:id', ...parentAccess, getChatHistory);

// Chat POST needs body validation for ownership too
// checkProfileOwnership expects req.params.id usually. 
// We can use a middleware adapter or just pass profileId in params for consistency, 
// OR check body.profileId.
// For simplicity and consistency with existing middleware, let's use /chat/:id for the POST as well, 
// or extract profileId from body and set req.params.id manually before the check.

const setPidFromid = (req, res, next) => {
    // Controller expects profileId in body, but middleware checks params.id
    // Let's enforce the POST endpoint to be /chat/:id
    next();
};

router.post('/chat/:id', ...parentAccess, chatWithFoodBuddy);

export default router;
