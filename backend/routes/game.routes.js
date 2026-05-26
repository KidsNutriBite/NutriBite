import express from 'express';
import { getKidStats, chatWithFoodBuddy, getChatHistory, logMealKid, equipCompanion } from '../controllers/game.controller.js';
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
router.post('/chat/:id', ...parentAccess, chatWithFoodBuddy);

// Kid Mode Game Log & Superhero Equip Endpoints
router.post('/log-meal-kid/:id', ...parentAccess, logMealKid);
router.post('/equip/:id', ...parentAccess, equipCompanion);

export default router;
