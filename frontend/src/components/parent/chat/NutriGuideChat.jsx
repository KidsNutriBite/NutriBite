"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [showMentions, setShowMentions] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        setInput((prev) => prev + transcript + ' ');
                    } else {
                        currentTranscript += transcript;
                    }
                }
            };
            
            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    // Handle Input Change for Mentions
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        if (val.trim().endsWith('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const selectChild = (child) => {
        const newInput = input.replace(/@$/, `@${child.name} `);
        setInput(newInput);
        setSelectedChild(child);
        setShowMentions(false);
    };

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
            // Use selected child data or defaults
            const profileData = selectedChild ? {
                age: `${selectedChild.age} years`,
                weight: selectedChild.weight ? `${selectedChild.weight}` : "Unknown",
                conditions: selectedChild.allergies?.join(", ") || "None",
                prescription: "None"
            } : {
                // Default fallback
                age: "5 years",
                weight: "18kg",
                conditions: "None",
                prescription: "None"
            };

            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            const replyMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.answer,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, replyMsg]);

        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I'm having trouble connecting to the nutrition database right now. Please ensure the AI backend is running and try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            clearInterval(loadingInterval);
            setIsTyping(false);
        }
    };

    const suggestedTopics = [
        "Meal ideas for picky eaters",
        "How much protein does a 5yo need?",
        "Healthy snack alternatives"
    ];

    // Enhanced Markdown Renderer
    const renderContent = (text) => {
        const parts = text.split('|||DETAILED|||');
        const shortAnswer = parts[0];
        const detailedAnswer = parts[1];

        const formatText = (str) => {
            if (!str) return null;
            return str.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />; // Spacer for empty lines

                // Headers
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;

                // Horizontal Rule
                if (trimmed === '---' || trimmed === '***') return <hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />;

                // List items (Unordered)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="text-indigo-500">•</span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(trimmed.substring(2))}</span>
                        </div>
                    );
                }

                // List items (Ordered) - Simple check for "1. ", "2. "
                if (/^\d+\.\s/.test(trimmed)) {
                    const content = trimmed.replace(/^\d+\.\s/, '');
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="font-bold text-indigo-500 text-xs mt-1">{trimmed.split('.')[0]}.</span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(content)}</span>
                        </div>
                    );
                }

                // Standard Paragraph
                return (
                    <p key={i} className="mb-1 text-slate-700 dark:text-slate-200 leading-relaxed">
                        {parseInline(line)}
                    </p>
                );
            });
        };

        // Helper to parse bold and italic in a line
        const parseInline = (text) => {
            // Split by bold (**text**)
            const parts = text.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                }
                // Handle italics (*text*) within the non-bold parts
                const italicParts = part.split(/(\*.*?\*)/g);
                return italicParts.map((subPart, k) => {
                    if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                        return <em key={`${j}-${k}`} className="italic text-slate-600 dark:text-slate-400">{subPart.slice(1, -1)}</em>;
                    }
                    return subPart;
                });
            });
        };

        return (
            <div className="space-y-1">
                <div className="text-slate-800 dark:text-slate-200">
                    {formatText(shortAnswer)}
                </div>

                {detailedAnswer && (
                    <DetailsSection content={detailedAnswer} formatText={formatText} />
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-none rounded-none shadow-none">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">NutriGuide AI</h2>
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                    <span className="material-symbols-outlined text-[10px]">verified</span> Verified
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                {selectedChild ? `Pediatric Assistant for: ${selectedChild.name}` : "General Pediatric Advice Mode"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto w-full space-y-6">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end gap-3 max-w-[90%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm border ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-800 text-purple-600 border-slate-200 dark:border-slate-700'}`}>
                                    <span className="material-symbols-outlined text-sm">{msg.sender === 'user' ? 'person' : 'smart_toy'}</span>
                                </div>

                                {/* Bubble */}
                                <div>
                                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                        }`}>
                                        {msg.sender === 'ai' ? renderContent(msg.text) : msg.text}
                                    </div>
                                    <div className={`text-[10px] font-medium text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex items-end gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-sm text-indigo-500 animate-pulse">smart_toy</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 px-5 py-3.5 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                                        {loadingStep === 0 && "Analyzing profile..."}
                                        {loadingStep === 1 && "Retrieving knowledge base..."}
                                        {loadingStep === 2 && "Synthesizing response..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef}></div>
            </div>

            {/* Suggestions */}
            {!input && messages.length < 3 && (
                <div className="px-6 pb-2 flex gap-2 overflow-x-auto custom-scrollbar justify-center bg-slate-50 dark:bg-slate-900/50 pt-2">
                    {suggestedTopics.map((topic, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(topic)}
                            className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300 text-indigo-600 dark:text-indigo-400 text-xs md:text-sm px-4 py-2 rounded-full whitespace-nowrap shadow-sm transition-colors"
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 max-w-5xl mx-auto w-full relative">

                {/* Mentions Popup */}
                <AnimatePresence>
                    {showMentions && profiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20"
                        >
                            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-500 uppercase">Select Child Profile</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {profiles.map(profile => (
                                    <button
                                        key={profile._id}
                                        onClick={() => selectChild(profile)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
                                            {profile.avatar === 'lion' ? '🦁' : '👶'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.name}</p>
                                            <p className="text-[10px] text-slate-500">{profile.age} years • {profile.conditions?.length ? 'Has conditions' : 'Healthy'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-3">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 ${isListening ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask about nutrition (Type '@' to select child)..."
                            className="w-full h-12 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                    </div>
                </form>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    NutriGuide AI can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
};

const DetailsSection = ({ content, formatText, renderSections, detailSections = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-2">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    View Detailed Explanation
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2 border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detailed Analysis</span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    {detailSections.length > 0 ? renderSections(detailSections) : formatText(content)}
                </motion.div>
            )}
        </div>
    );
};

export default NutriGuideChat;
