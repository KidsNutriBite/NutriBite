import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatComposer = ({ 
    input, 
    setInput, 
    handleSend, 
    profiles, 
    selectedChild, 
    setSelectedChild 
}) => {
    const [showMentions, setShowMentions] = useState(false);
    const [voiceState, setVoiceState] = useState('idle'); // idle, listening, paused
    const recognitionRef = useRef(null);
    const textareaRef = useRef(null);

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
                setVoiceState('idle');
            };
            
            recognitionRef.current.onend = () => {
                setVoiceState(prev => prev === 'paused' ? 'paused' : 'idle');
            };
        }
    }, [setInput]);

    const toggleListening = () => {
        if (voiceState === 'listening') {
            recognitionRef.current?.stop();
            setVoiceState('paused');
        } else {
            try {
                recognitionRef.current?.start();
                setVoiceState('listening');
            } catch(e) {
                setVoiceState('listening');
            }
        }
    };
    
    const stopListening = () => {
        recognitionRef.current?.stop();
        setVoiceState('idle');
    };

    // Auto-expand textarea helper
    const expandTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    };

    // Handle input change & mentions
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        if (val.trim().endsWith('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
        expandTextarea();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const selectChild = (child) => {
        const newInput = input.replace(/@$/, `@${child.name} `);
        setInput(newInput);
        setSelectedChild(child);
        setShowMentions(false);
        expandTextarea();
    };

    const onSubmit = () => {
        if (!input.trim()) return;
        handleSend(input);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // reset height
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 max-w-5xl mx-auto w-full relative">
            {/* Mentions Popup */}
            <AnimatePresence>
                {showMentions && profiles?.length > 0 && (
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
                                    type="button"
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

            {/* Voice Controls Tooltip */}
            <AnimatePresence>
                {voiceState !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-3 z-30 border border-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            {voiceState === 'listening' ? (
                                <>
                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Listening...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-sm font-medium">Paused</span>
                                </>
                            )}
                        </div>
                        <div className="h-4 w-px bg-slate-700 mx-1"></div>
                        <button onClick={stopListening} type="button" className="text-xs font-bold text-slate-300 hover:text-white transition-colors">
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="relative flex gap-3 items-end">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 mb-0 ${voiceState === 'listening' ? 'bg-rose-100 text-rose-500 animate-pulse' : voiceState === 'paused' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                    <span className="material-symbols-outlined">{voiceState === 'listening' ? 'pause' : 'mic'}</span>
                </button>
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about nutrition (Type '@' to select child)..."
                        className="w-full min-h-[48px] max-h-[150px] py-3 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none custom-scrollbar"
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 bottom-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20"
                    >
                        <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                </div>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-2">
                NutriGuide AI can make mistakes. Consider checking important information.
            </p>
        </div>
    );
};

export default ChatComposer;
