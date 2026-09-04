import { AgentOrchestrator } from '../services/agentOrchestrator.service.js';
import { ConversationManager } from '../services/conversationManager.service.js';
import Conversation from '../models/Conversation.model.js';
import ConversationMemory from '../models/ConversationMemory.model.js';
import Profile from '../models/Profile.model.js';

/**
 * @desc    Ask NutriGuide AI Agent Copilot with Intent-Aware Child Context & Memory
 * @route   POST /api/ai/ask
 * @access  Private (Parent / Doctor)
 */
export const askNutriGuide = async (req, res) => {
    try {
        const { query, question, profileId, conversationId, history } = req.body;
        const textQuery = (query || question || '').trim();

        if (!textQuery) {
            return res.status(400).json({
                success: false,
                message: "A question or query is required"
            });
        }

        const parentId = req.user?._id;

        // Verify child ownership
        if (profileId) {
            const profile = await Profile.findOne({ _id: profileId, parentId });
            if (!profile) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access to child profile"
                });
            }
        }

        // 1. Get or initialize conversation thread
        let activeConversation = null;
        if (profileId) {
            activeConversation = await ConversationManager.getOrCreateConversation({
                conversationId,
                parentId,
                profileId,
                initialQuery: textQuery
            });
        }

        // 2. Extract and store non-sensitive long-term preferences
        if (profileId) {
            ConversationManager.extractAndStoreMemory({
                parentId,
                profileId,
                query: textQuery
            }).catch(err => console.warn("[AI Controller] Memory extraction warning:", err.message));
        }

        // 3. Process 7-stage Agentic Workflow
        const response = await AgentOrchestrator.processAgentWorkflow({
            query: textQuery,
            profileId,
            parentId,
            history: history || []
        });

        // 4. Save to conversation thread
        if (activeConversation) {
            await ConversationManager.appendMessages({
                conversationId: activeConversation._id,
                userText: textQuery,
                aiText: response.answer,
                intent: response.intent,
                toolsUsed: response.toolsUsed,
                followUps: response.followUps
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...response,
                conversationId: activeConversation?._id?.toString() || null,
                conversationTitle: activeConversation?.title || 'Nutrition Consultation'
            }
        });
    } catch (error) {
        console.error("Error in askNutriGuide controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate AI response",
            error: error.message
        });
    }
};

/**
 * @desc    List all conversations for a parent and child
 * @route   GET /api/ai/conversations?profileId=...
 * @access  Private
 */
export const getConversations = async (req, res) => {
    try {
        const { profileId } = req.query;
        const parentId = req.user?._id;

        const query = { parentId, isArchived: false };
        if (profileId) query.profileId = profileId;

        const conversations = await Conversation.find(query)
            .sort({ lastUpdated: -1 })
            .select('title profileId lastUpdated messages createdAt')
            .lean();

        const formatted = conversations.map(c => ({
            id: c._id.toString(),
            profileId: c.profileId?.toString(),
            title: c.title,
            lastUpdated: c.lastUpdated,
            messageCount: c.messages?.length || 0,
            lastMessagePreview: c.messages?.[c.messages.length - 1]?.text?.slice(0, 80) || 'New consultation started'
        }));

        return res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve conversations",
            error: error.message
        });
    }
};

/**
 * @desc    Create a new conversation thread for a child
 * @route   POST /api/ai/conversations
 * @access  Private
 */
export const createConversation = async (req, res) => {
    try {
        const { profileId, title } = req.body;
        const parentId = req.user?._id;

        if (!profileId) {
            return res.status(400).json({ success: false, message: "profileId is required" });
        }

        const profile = await Profile.findOne({ _id: profileId, parentId });
        if (!profile) {
            return res.status(403).json({ success: false, message: "Unauthorized child profile access" });
        }

        const conv = await Conversation.create({
            parentId,
            profileId,
            title: title || `Consultation with ${profile.name.split(' ')[0]}`,
            messages: []
        });

        return res.status(201).json({
            success: true,
            data: {
                id: conv._id.toString(),
                profileId: conv.profileId.toString(),
                title: conv.title,
                messages: []
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create conversation",
            error: error.message
        });
    }
};

/**
 * @desc    Get a single conversation with full message history
 * @route   GET /api/ai/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res) => {
    try {
        const { id } = req.params;
        const parentId = req.user?._id;

        const conv = await Conversation.findOne({ _id: id, parentId, isArchived: false }).lean();
        if (!conv) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: conv._id.toString(),
                profileId: conv.profileId.toString(),
                title: conv.title,
                lastUpdated: conv.lastUpdated,
                messages: (conv.messages || []).map(m => ({
                    id: m._id?.toString() || Date.now(),
                    sender: m.sender,
                    text: m.text,
                    intent: m.intent,
                    toolsUsed: m.toolsUsed || [],
                    followUps: m.followUps || [],
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversation",
            error: error.message
        });
    }
};

/**
 * @desc    Delete a conversation thread
 * @route   DELETE /api/ai/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const parentId = req.user?._id;

        const result = await Conversation.findOneAndDelete({ _id: id, parentId });
        if (!result) {
            return res.status(404).json({ success: false, message: "Conversation not found or unauthorized" });
        }

        return res.status(200).json({
            success: true,
            message: "Conversation deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete conversation",
            error: error.message
        });
    }
};

/**
 * @desc    Get long-term extracted memory preferences for a child
 * @route   GET /api/ai/memory?profileId=...
 * @access  Private
 */
export const getMemories = async (req, res) => {
    try {
        const { profileId } = req.query;
        const parentId = req.user?._id;

        const memories = await ConversationMemory.find({ parentId, profileId }).lean();
        return res.status(200).json({
            success: true,
            data: memories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch memories",
            error: error.message
        });
    }
};
