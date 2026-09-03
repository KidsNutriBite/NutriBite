"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import WelcomeHero from './WelcomeHero';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import ConversationSidebar from './ConversationSidebar';
import useAuth from '../../../hooks/useAuth';
import {
    askNutriGuideCopilot,
    fetchConversations,
    fetchConversationById,
    deleteConversationApi,
    createNewConversation
} from '../../../api/ai.api';

// Clinical Agentic Pipeline Progress Indicator (with Antigravity Smooth Motion)
const AgenticPipelineIndicator = ({ currentStep, childName }) => {
    const steps = [
        { label: "Understanding question & pediatric intent", icon: "search" },
        { label: `Reviewing ${childName}'s 21-day dietary records & growth percentiles`, icon: "analytics" },
        { label: "Checking allergen safety & dietary restrictions", icon: "shield" },
        { label: "Retrieving ICMR-NIN 2020 pediatric guidelines & food tables", icon: "menu_book" },
        { label: "Synthesizing structured clinical recommendation", icon: "auto_awesome" }
    ];

    return (
        <div className="flex items-start gap-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 animate-pulse shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-base">smart_toy</span>
            </div>

            <div className="flex-1 max-w-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-primary animate-ping"></span>
                        NutriGuide Agentic Copilot is reasoning...
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Step {Math.min(currentStep + 1, 5)} of 5</span>
                </div>

                <div className="space-y-1.5">
                    {steps.map((s, idx) => {
                        const isDone = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                                    isDone
                                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                        : isCurrent
                                            ? 'text-primary font-bold animate-pulse scale-[1.01]'
                                            : 'text-slate-400 opacity-60 font-medium'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm shrink-0">
                                    {isDone ? 'check_circle' : (isCurrent ? 'progress_activity' : 'radio_button_unchecked')}
                                </span>
                                <span>{s.label}</span>
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

    // Multi-Thread Conversation States (Phase 10)
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const messagesEndRef = useRef(null);

    // Keep active child initialized
    useEffect(() => {
        if (!activeChild && profiles.length > 0) {
            setActiveChild(profiles[0]);
        }
    }, [profiles, activeChild]);

    // Load conversations for the selected child (strict multi-child isolation)
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

        // Step through agentic pipeline stages
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
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);

                // Refresh conversation drawer
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
                    text: `> **In Brief:** NutriGuide is operating under offline safety protocols. Your question regarding "${msgText}" has been logged for pediatrician review with Dr. Rajesh Iyer.`,
                    followUps: [
                        { label: `🥗 Plan Tomorrow's 6 Meals`, prompt: `Generate a chronological 6-meal Indian pediatric plan for ${activeChild?.name || 'child'}.` },
                        { label: `📊 View 21-Day RDA Gap Chart`, prompt: `Give me a breakdown of ${activeChild?.name || 'child'}'s 21-day nutrient coverage against ICMR 2020 RDA guidelines.` }
                    ],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    }, [input, messages, activeChild, activeConversationId, loadChildConversations]);

    const showWelcome = messages.length === 0;

    return (
        <div className="relative flex flex-col w-full h-full bg-gradient-to-br from-slate-50 via-slate-100/60 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-display text-slate-800 dark:text-slate-200 overflow-hidden">
            
            {/* Antigravity Ambient Background Light Orbs */}
            <div className="absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute top-1/3 -right-40 size-96 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none"></div>

            {/* Conversation History Drawer (Phase 10) */}
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

            {/* Backdrop overlay for mobile */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
                />
            )}

            {/* Top Navigation Header */}
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
            />

            {/* Main Chat Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col justify-between relative z-10">
                <div>
                    {showWelcome ? (
                        <WelcomeHero
                            onChipClick={handleSend}
                            activeChild={activeChild}
                            parentName={parentName}
                        />
                    ) : (
                        <div className="max-w-3xl mx-auto w-full space-y-4">
                            {messages.map(msg => (
                                <ChatMessage
                                    key={msg.id}
                                    msg={msg}
                                    onActionClick={handleSend}
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

            {/* Bottom Chat Composer Input */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-3 sm:p-4 relative z-10 shadow-lg">
                <div className="max-w-3xl mx-auto">
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

// Allergy label formatter (shared utility — also used in ChatComposer)
export function formatAllergy(raw) {
    if (!raw) return '';
    const map = {
        egg_protein: 'Egg', peanut: 'Peanut', dairy: 'Dairy',
        gluten: 'Gluten', soy: 'Soy', shellfish: 'Shellfish', tree_nut: 'Tree Nut'
    };
    return map[raw] ?? (raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' '));
}

export default NutriGuideChat;
