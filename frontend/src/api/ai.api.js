import api from './axios';
import axios from 'axios';

// AI Service is running on port 8000 (FastAPI)
const AI_URL = 'http://localhost:8000';

export const analyzeNutrition = async (age, gender, meals = []) => {
    try {
        const formattedMeals = (meals || []).map(m => {
            let mealName = 'Nutritious Meal';
            if (typeof m === 'string') {
                mealName = m;
            } else if (m?.name) {
                mealName = m.name;
            } else if (Array.isArray(m?.foodItems) && m.foodItems.length > 0) {
                mealName = m.foodItems.map(f => (typeof f === 'string' ? f : f?.name || '')).filter(Boolean).join(', ');
            }
            return {
                name: mealName,
                portion: m?.quantity || m?.portion || '1 serving'
            };
        });

        const response = await axios.post(`${AI_URL}/analyze`, {
            age: parseInt(age) || 5,
            gender: gender || 'neutral',
            meals: formattedMeals
        }, { timeout: 15000 });
        return response.data;
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
};

/**
 * Enterprise NutriGuide AI Copilot Call (Server-side Orchestrator with RAG + Gemini fallback & Conversation Tracking)
 */
export const askNutriGuideCopilot = async ({ query, profileId, conversationId, history = [] }) => {
    try {
        const response = await api.post('/ai/ask', {
            query,
            profileId,
            conversationId,
            history
        });
        return response.data?.data || response.data;
    } catch (error) {
        console.warn("Backend AI Orchestrator API call failed, falling back gracefully:", error.message);
        throw error;
    }
};

/**
 * List all saved conversation threads for a child
 */
export const fetchConversations = async (profileId) => {
    const res = await api.get(`/ai/conversations?profileId=${profileId || ''}`);
    return res.data?.data || [];
};

/**
 * Start a new conversation thread
 */
export const createNewConversation = async (profileId, title) => {
    const res = await api.post('/ai/conversations', { profileId, title });
    return res.data?.data;
};

/**
 * Fetch a single conversation by ID
 */
export const fetchConversationById = async (conversationId) => {
    const res = await api.get(`/ai/conversations/${conversationId}`);
    return res.data?.data;
};

/**
 * Delete a conversation thread
 */
export const deleteConversationApi = async (conversationId) => {
    const res = await api.delete(`/ai/conversations/${conversationId}`);
    return res.data;
};

/**
 * Fetch extracted long-term child preferences
 */
export const fetchChildMemories = async (profileId) => {
    const res = await api.get(`/ai/memory?profileId=${profileId || ''}`);
    return res.data?.data || [];
};
