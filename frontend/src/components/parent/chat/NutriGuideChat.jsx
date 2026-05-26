"use client";

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import WelcomeHero from './WelcomeHero';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';

// TypingIndicator — inline since it's small
const TypingIndicator = ({ loadingStep }) => (
    <div className="flex justify-start">
        <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-sm text-indigo-500 animate-pulse">smart_toy</span>
            </div>
            <div className="bg-white dark:bg-slate-800 px-5 py-3.5 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                    {loadingStep === 0 && "Analyzing profile..."}
                    {loadingStep === 1 && "Retrieving knowledge base..."}
                    {loadingStep === 2 && "Synthesizing response..."}
                </span>
            </div>
        </div>
    </div>
);

const NutriGuideChat = ({ onBack, profiles = [] }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: "Hello! I'm your NutriGuide Assistant. How can I help you with your family's nutrition today? Type '@' to select a specific child profile for personalized advice!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [selectedChild, setSelectedChild] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const handleSend = async (text) => {
        const msgText = text || input;
        if (!msgText.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'user',
            text: msgText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);
        setLoadingStep(0);

        const loadingInterval = setInterval(() => {
            setLoadingStep(prev => (prev < 2 ? prev + 1 : prev));
        }, 1500);

        try {
            const profileData = selectedChild ? {
                age: `${selectedChild.age} years`,
                weight: selectedChild.weight ? `${selectedChild.weight}` : "Unknown",
                conditions: selectedChild.allergies?.join(", ") || "None",
                prescription: "None"
            } : {
                age: "5 years",
                weight: "18kg",
                conditions: "None",
                prescription: "None"
            };

            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: msgText,
                    history: messages.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        content: msg.text
                    })),
                    ...profileData
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.answer,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I'm having trouble connecting to the nutrition database right now. Please ensure the AI backend is running and try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            clearInterval(loadingInterval);
            setIsTyping(false);
        }
    };

    const handleSuggestionClick = (topic) => {
        setInput(topic);
    };

    // Show welcome hero only when it's the initial state (only the AI greeting exists)
    const showWelcome = messages.length === 1 && messages[0].sender === 'ai';

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Sticky Header */}
            <ChatHeader onBack={onBack} selectedChild={selectedChild} />

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-3xl mx-auto w-full">
                    {showWelcome ? (
                        <WelcomeHero handleSuggestionClick={handleSuggestionClick} />
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    msg={msg}
                                    handleSend={handleSend}
                                />
                            ))}

                            {isTyping && <TypingIndicator loadingStep={loadingStep} />}
                        </div>
                    )}

                    <div ref={messagesEndRef}></div>
                </div>
            </div>

            {/* Quick Suggestion Chips — shown only before first message */}
            <AnimatePresence>
                {!showWelcome && !input && messages.length < 4 && (
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto custom-scrollbar bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 pt-3">
                        {["Healthy snacks 🍎", "Meal plan 📅", "Fever foods 🤒", "Hydration 💧"].map((topic, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(topic.replace(/\s*[^\w\s].*/g, '').trim())}
                                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Composer */}
            <ChatComposer
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                profiles={profiles}
                selectedChild={selectedChild}
                setSelectedChild={setSelectedChild}
            />
        </div>
    );
};

export default NutriGuideChat;
