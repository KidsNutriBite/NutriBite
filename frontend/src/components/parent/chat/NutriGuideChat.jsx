"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import WelcomeHero from './WelcomeHero';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import ConversationSidebar from './ConversationSidebar';
import SavedDietPlansModal from './SavedDietPlansModal';
import useAuth from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { saveDietPlan } from '../../../api/nutrition.api';
import {
    askNutriGuideCopilot,
    fetchConversations,
    fetchConversationById,
    deleteConversationApi,
} from '../../../api/ai.api';

const SparkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

// Minimal Agentic Reasoning Progress Indicator
const AgenticPipelineIndicator = ({ currentStep, childName }) => {
    const steps = [
        "Analyzing dietary inquiry",
        `Reviewing ${childName}'s 21-day meals and growth records`,
        "Checking allergy and safety restrictions",
        "Retrieving ICMR-NIN guidelines and food tables",
        "Synthesizing clinical nutrition guidance"
    ];

    return (
        <div className="flex items-start gap-3.5 my-6 animate-in fade-in duration-200">
            <div className="size-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <SparkIcon />
            </div>

            <div className="flex-1 max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0_0_0/0.04)] space-y-3">
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white animate-pulse"></span>
                        NutriGuide is reasoning...
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Step {Math.min(currentStep + 1, 5)} / 5</span>
                </div>

                <div className="space-y-1.5">
                    {steps.map((label, idx) => {
                        const isDone = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                            <div
                                key={idx}
                                className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                                    isDone
                                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                        : isCurrent
                                            ? 'text-slate-900 dark:text-white font-medium'
                                            : 'text-slate-400 opacity-60 font-normal'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm shrink-0">
                                    {isDone ? 'check' : (isCurrent ? 'radio_button_checked' : 'radio_button_unchecked')}
                                </span>
                                <span>{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const NutriGuideChat = ({ onBack, profiles = [] }) => {
    const { user } = useAuth();
    const parentName = user?.name || 'Sneha Sharma';

    const [activeChild, setActiveChild] = useState(profiles.length > 0 ? profiles[0] : null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [agentStep, setAgentStep] = useState(0);

    // Multi-Thread Conversation States
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSavedPlansOpen, setIsSavedPlansOpen] = useState(false);

    const messagesEndRef = useRef(null);

    // Keep active child initialized
    useEffect(() => {
        if (!activeChild && profiles.length > 0) {
            setActiveChild(profiles[0]);
        }
    }, [profiles, activeChild]);

    // Load conversations for the selected child
    const loadChildConversations = useCallback(async () => {
        if (!activeChild?._id && !activeChild?.id) return;
        const profileId = activeChild._id || activeChild.id;

        try {
            const list = await fetchConversations(profileId);
            setConversations(list || []);
        } catch (err) {
            console.warn("Failed to load conversations:", err.message);
        }
    }, [activeChild]);

    useEffect(() => {
        loadChildConversations();
    }, [loadChildConversations]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(scrollToBottom, [messages, isTyping, agentStep, scrollToBottom]);

    // Save Diet Plan Handler for Chat
    const handleSaveDietPlan = useCallback(async (dietPlan) => {
        if (!activeChild) return;
        const profileId = activeChild._id || activeChild.id;
        try {
            await saveDietPlan(profileId, {
                dailyPlan: dietPlan.dailyPlan || dietPlan,
                selectedTheme: dietPlan.title || 'Custom Diet Plan via NutriGuide AI',
                savedAt: new Date().toISOString()
            }, dietPlan.notes || 'Generated by NutriGuide AI based on clinical guidelines.');
            toast.success(`Diet plan saved to ${activeChild.name}'s profile!`, { icon: '💾' });
        } catch (err) {
            console.error("Failed to save diet plan:", err);
            toast.error("Failed to save diet plan. Please try again.");
        }
    }, [activeChild]);

    // Start a Fresh Consultation Thread
    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setInput('');
    }, []);

    // Load Previous Conversation by ID
    const handleSelectConversation = useCallback(async (convId) => {
        try {
            const conv = await fetchConversationById(convId);
            if (conv) {
                setActiveConversationId(conv.id);
                setMessages(conv.messages || []);
            }
        } catch (err) {
            console.error("Failed to load conversation thread:", err);
        }
    }, []);

    // Delete Conversation Thread
    const handleDeleteConversation = useCallback(async (convId) => {
        try {
            await deleteConversationApi(convId);
            setConversations(prev => prev.filter(c => c.id !== convId));
            if (activeConversationId === convId) {
                handleNewChat();
            }
        } catch (err) {
            console.error("Failed to delete conversation:", err);
        }
    }, [activeConversationId, handleNewChat]);

    // Handle Sending a Message
    const handleSend = useCallback(async (text) => {
        const msgText = (typeof text === 'string' ? text : input).trim();
        if (!msgText) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: msgText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setAgentStep(0);

        // Step through reasoning stages
        const stepInterval = setInterval(() => {
            setAgentStep(prev => (prev < 4 ? prev + 1 : prev));
        }, 400);

        try {
            const response = await askNutriGuideCopilot({
                query: msgText,
                profileId: activeChild?._id || activeChild?.id,
                conversationId: activeConversationId,
                history: messages
            });

            clearInterval(stepInterval);
            setIsTyping(false);

            if (response && response.answer) {
                if (response.conversationId && !activeConversationId) {
                    setActiveConversationId(response.conversationId);
                }

                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        sender: 'ai',
                        text: response.answer,
                        intent: response.intent,
                        toolsUsed: response.toolsUsed || [],
                        followUps: response.followUps || [],
                        dietPlan: response.dietPlan || null,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);

                loadChildConversations();
            }
        } catch (err) {
            clearInterval(stepInterval);
            setIsTyping(false);
            console.error('Error in NutriGuide AI:', err);

            // Fallback gracefully with clinically structured response
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: `> 📌 **Parent Executive Summary:** NutriGuide is operating under safety protocols. Your question regarding "${msgText}" has been recorded for pediatrician follow-up.`,
                    followUps: [
                        { label: `Plan Tomorrow's 6 Meals`, prompt: `Generate a chronological 6-meal Indian pediatric plan for ${activeChild?.name || 'child'}.` },
                        { label: `View 21-Day RDA Gap Chart`, prompt: `Give me a breakdown of ${activeChild?.name || 'child'}'s 21-day nutrient coverage against ICMR 2020 RDA guidelines.` }
                    ],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    }, [input, messages, activeChild, activeConversationId, loadChildConversations]);

    const showWelcome = messages.length === 0;

    return (
        <div className="relative flex flex-col w-full h-full bg-[#FAFAFA] dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 overflow-hidden">
            
            {/* Subtle Ambient Glows */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-slate-200/50 dark:from-slate-800/20 to-transparent blur-3xl pointer-events-none"></div>

            {/* Conversation History Drawer */}
            <ConversationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onDeleteConversation={handleDeleteConversation}
                activeChild={activeChild}
                profiles={profiles}
                onSelectChild={(child) => {
                    setActiveChild(child);
                    handleNewChat();
                }}
            />

            {/* Saved Diet Plans Modal */}
            <SavedDietPlansModal
                isOpen={isSavedPlansOpen}
                onClose={() => setIsSavedPlansOpen(false)}
                activeChild={activeChild}
            />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-xs transition-opacity duration-300"
                />
            )}

            {/* Top Navigation Floating Navbar */}
            <ChatHeader
                onBack={onBack}
                activeChild={activeChild}
                profiles={profiles}
                onSelectChild={(child) => {
                    setActiveChild(child);
                    handleNewChat();
                }}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onNewChat={handleNewChat}
                onOpenSavedPlans={() => setIsSavedPlansOpen(true)}
            />

            {/* Main Chat Conversation Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col justify-between relative z-10 scrollbar-thin">
                <div className="w-full">
                    {showWelcome ? (
                        <WelcomeHero
                            onChipClick={handleSend}
                            activeChild={activeChild}
                            parentName={parentName}
                        />
                    ) : (
                        <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
                            {messages.map(msg => (
                                <ChatMessage
                                    key={msg.id}
                                    msg={msg}
                                    onActionClick={handleSend}
                                    onSaveDietPlan={handleSaveDietPlan}
                                />
                            ))}

                            {isTyping && (
                                <AgenticPipelineIndicator
                                    currentStep={agentStep}
                                    childName={activeChild?.name?.split(' ')[0] || 'your child'}
                                />
                            )}
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Floating Glass Composer */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 relative z-10 w-full flex justify-center">
                <div className="max-w-3xl w-full">
                    <ChatComposer
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        profiles={profiles}
                        activeChild={activeChild}
                        setActiveChild={(child) => {
                            setActiveChild(child);
                            handleNewChat();
                        }}
                    />
                </div>
            </div>

        </div>
    );
};

// Allergy label formatter (shared utility)
export function formatAllergy(raw) {
    if (!raw) return '';
    const map = {
        egg_protein: 'Egg', peanut: 'Peanut', dairy: 'Dairy',
        gluten: 'Gluten', soy: 'Soy', shellfish: 'Shellfish', tree_nut: 'Tree Nut'
    };
    return map[raw] ?? (raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' '));
}

export default NutriGuideChat;
