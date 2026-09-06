import Conversation from '../models/Conversation.model.js';
import ConversationMemory from '../models/ConversationMemory.model.js';
import Profile from '../models/Profile.model.js';

export class ConversationManager {

    /**
     * Extracts useful, non-sensitive preferences from parent statements
     */
    static async extractAndStoreMemory({ parentId, profileId, query }) {
        if (!parentId || !profileId || !query) return;

        const q = query.toLowerCase();

        // 1. Dislike detection
        if (q.includes("doesn't like") || q.includes("dislikes") || q.includes("hate") || q.includes("refuses to eat")) {
            const match = query.match(/(?:doesn't like|dislikes|hate|refuses to eat)\s+([a-zA-Z\s]+)/i);
            if (match && match[1]) {
                const food = match[1].trim().replace(/[.,!?]$/, '');
                await ConversationMemory.findOneAndUpdate(
                    { parentId, profileId, key: `dislike_${food.toLowerCase()}` },
                    {
                        parentId,
                        profileId,
                        key: `dislike_${food.toLowerCase()}`,
                        value: `Dislikes ${food}`,
                        category: 'food_dislike',
                        confidence: 0.95
                    },
                    { upsert: true, new: true }
                );

                // Sync with Profile.preferences.dislikedFoods
                const profile = await Profile.findById(profileId);
                if (profile) {
                    const existing = (profile.preferences?.dislikedFoods || '').split(',').map(s => s.trim()).filter(Boolean);
                    if (!existing.includes(food.toLowerCase())) {
                        existing.push(food.toLowerCase());
                        if (!profile.preferences) profile.preferences = {};
                        profile.preferences.dislikedFoods = existing.join(', ');
                        await profile.save();
                    }
                }
            }
        }

        // 2. Preference detection
        if (q.includes("prefers") || q.includes("favorite food is") || q.includes("loves eating")) {
            const match = query.match(/(?:prefers|favorite food is|loves eating)\s+([a-zA-Z\s]+)/i);
            if (match && match[1]) {
                const item = match[1].trim().replace(/[.,!?]$/, '');
                await ConversationMemory.findOneAndUpdate(
                    { parentId, profileId, key: `pref_${item.toLowerCase()}` },
                    {
                        parentId,
                        profileId,
                        key: `pref_${item.toLowerCase()}`,
                        value: `Prefers ${item}`,
                        category: 'food_preference',
                        confidence: 0.90
                    },
                    { upsert: true, new: true }
                );
            }
        }
    }

    /**
     * Generates a concise title from the user query
     */
    static generateTitleFromQuery(query = '') {
        const clean = query.trim().replace(/[?.,!]$/, '');
        if (clean.length <= 40) return clean;
        const words = clean.split(' ').slice(0, 6).join(' ');
        return `${words}...`;
    }

    /**
     * Retrieves or creates an active conversation thread for the child
     */
    static async getOrCreateConversation({ conversationId, parentId, profileId, initialQuery }) {
        if (conversationId) {
            const conv = await Conversation.findOne({ _id: conversationId, parentId, profileId });
            if (conv) return conv;
        }

        const title = initialQuery ? this.generateTitleFromQuery(initialQuery) : 'New Consultation';
        return await Conversation.create({
            parentId,
            profileId,
            title,
            messages: []
        });
    }

    /**
     * Appends user & AI messages to the conversation
     */
    static async appendMessages({ conversationId, userText, aiText, intent, toolsUsed, followUps }) {
        if (!conversationId) return null;

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $push: {
                    messages: [
                        { sender: 'user', text: userText, createdAt: new Date() },
                        { sender: 'ai', text: aiText, intent, toolsUsed, followUps, createdAt: new Date() }
                    ]
                },
                $set: { lastUpdated: new Date() }
            },
            { new: true }
        );

        return updated;
    }

    /**
     * Retrieves recent messages for short-term context without unbounded token growth
     */
    static async getRecentContext({ conversationId, limit = 8 }) {
        if (!conversationId) return [];
        const conv = await Conversation.findById(conversationId).lean();
        if (!conv || !conv.messages) return [];

        const recent = conv.messages.slice(-limit);
        return recent.map(m => ({
            sender: m.sender,
            text: m.text,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    }
}
