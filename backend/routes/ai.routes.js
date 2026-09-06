import express from 'express';
import {
    askNutriGuide,
    getConversations,
    createConversation,
    getConversationById,
    deleteConversation,
    getMemories
} from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected AI Copilot routes
router.post('/ask', protect, askNutriGuide);

// Conversation Thread Management
router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/conversations/:id', protect, getConversationById);
router.delete('/conversations/:id', protect, deleteConversation);

// Long-Term Memory
router.get('/memory', protect, getMemories);

export default router;
