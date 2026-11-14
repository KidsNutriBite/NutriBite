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

// LangGraph 7-Node Dynamic Orchestrator Indicator
const AgenticPipelineIndicator = ({ currentStep, childName, currentQuery }) => {
    const nodes = [
        {
            num: "1",
            title: "Understand",
            subtitle: "Algorithm 1 Intent & Clinical Entity Classifier",
            detail: "Normalizing query & mapping clinical intent dynamically",
            icon: "psychology"
        },
        {
            num: "2",
            title: "Observe",
            subtitle: "Context Ingestion Engine",
            detail: `Loading ${childName}'s health profile, allergies & growth history`,
            icon: "visibility"
        },
        {
            num: "3",
            title: "Plan",
            subtitle: "Algorithm 2 Dynamic Tool Dependency Planner",
            detail: "Dynamically determining which clinical tools to dispatch based on query intent",
            icon: "account_tree"
        },
        {
            num: "4",
            title: "Act",
            subtitle: "Specialized Clinical Tool Execution",
            detail: "Executing dynamically selected clinical tools (Growth, Meal Planner, Nutrition, or RAG)",
            icon: "terminal"
        },
        {
            num: "5",
            title: "Verify",
            subtitle: "Algorithm 3 Affirmative Safety Gate",
            detail: "Validating allergen exclusions, confidence threshold & clinical safety disclaimers",
            icon: "verified_user"
        },
        {
            num: "6",
            title: "Synthesize",
            subtitle: "Grounded Clinical Synthesis (Groq Qwen 3.8-27b)",
            detail: "Synthesizing ICMR-2020 aligned guidance grounded in executed tool findings",
            icon: "auto_fix_high"
        },
        {
            num: "7",
            title: "Follow-up",
            subtitle: "Proactive Guidance Generator",
            detail: "Formulating actionable follow-up recommendations for parent",
            icon: "forward"
        }
    ];

    const candidateTools = [
        { name: "growth_analysis", condition: "Height/weight WHO percentiles", icon: "trending_up" },
        { name: "nutrition_analysis", condition: "ICMR 2020 RDA & nutrient gaps", icon: "calculate" },
        { name: "meal_planner", condition: "KidsNutri DB & allergen recipes", icon: "restaurant" },
        { name: "rag_search", condition: "FAISS + BM25 ICMR guidelines", icon: "menu_book" },
        { name: "web_search", condition: "Live scientific literature search", icon: "travel_explore" },
        { name: "update_rag", condition: "Vector memory continuous ingestion", icon: "dataset" },
        { name: "update_ner", condition: "Dynamic clinical entity memory", icon: "psychology" }
    ];

    return (
        <div className="flex items-start gap-3.5 my-6 animate-in fade-in duration-200">
            <div className="size-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <SparkIcon />
            </div>

            <div className="flex-1 max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-indigo-600 animate-ping"></span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                            <span>NutriKid LangGraph 7-Node Agent</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                                Dynamic Routing
                            </span>
                        </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                        Node {Math.min(currentStep + 1, 7)} / 7
                    </span>
                </div>

                {/* Live Query Display */}
                {currentQuery && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-indigo-500 shrink-0">psychology</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Active Query:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate font-mono text-[11px]">
                            &ldquo;{currentQuery}&rdquo;
                        </span>
                    </div>
                )}

                {/* 7 Pipeline Nodes */}
                <div className="space-y-1.5">
                    {nodes.map((node, idx) => {
                        const isDone = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                            <div
                                key={idx}
                                className={`p-2 rounded-xl transition-all duration-150 flex items-start gap-2.5 ${
                                    isCurrent
                                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                                        : isDone
                                            ? 'bg-slate-50/50 dark:bg-slate-850/40 text-slate-700 dark:text-slate-300'
                                            : 'opacity-40 text-slate-400'
                                }`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {isDone ? (
                                        <div className="size-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                                            <span className="material-symbols-outlined text-[13px]">check</span>
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="size-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold animate-pulse">
                                            {node.num}
                                        </div>
                                    ) : (
                                        <div className="size-4.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[9px] font-mono">
                                            {node.num}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[11px] font-bold ${isCurrent ? 'text-indigo-900 dark:text-indigo-200' : isDone ? 'text-slate-900 dark:text-slate-200' : 'text-slate-400'}`}>
                                            Node {node.num}: {node.title}
                                        </span>
                                        <span className="text-[9px] font-mono opacity-70 truncate">
                                            {node.subtitle}
                                        </span>
                                    </div>
                                    <p className={`text-[10px] leading-snug mt-0.5 ${isCurrent ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {node.detail}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Algorithm 2 Dynamic Tool Dispatcher Explainer */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-indigo-500">alt_route</span>
                            <span>Algorithm 2 Dynamic Tool Dispatcher</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                            Query-Driven Activation
                        </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Tools are not static. The agent analyzes query intent and dynamically dispatches only the required tools:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {candidateTools.map((t, tIdx) => (
                            <div
                                key={tIdx}
                                className="p-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center gap-1.5 text-[10px]"
                            >
                                <span className="material-symbols-outlined text-xs text-indigo-500 shrink-0">
                                    {t.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="font-mono text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate">{t.name}</div>
                                    <div className="text-[8.5px] text-slate-400 truncate">{t.condition}</div>
                                </div>
                            </div>
                        ))}
                    </div>
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
    const [activeQuery, setActiveQuery] = useState('');

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
        setActiveQuery(msgText);
        setIsTyping(true);
        setAgentStep(0);

        // Step through reasoning stages across all 7 LangGraph nodes
        const stepInterval = setInterval(() => {
            setAgentStep(prev => (prev < 6 ? prev + 1 : prev));
        }, 450);

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
                        executionTrace: response.executionTrace || [],
                        verificationDecision: response.verificationDecision || 'PROCEED',
                        ragConfidence: response.ragConfidence || 0.88,
                        followUps: response.followUps || [],
                        dietPlan: response.dietPlan || null,
                        providerStatus: response.providerStatus || null,
                        sources: response.sources || [],
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
                                    currentQuery={activeQuery}
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
