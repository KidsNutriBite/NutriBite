"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import WelcomeHero from './WelcomeHero';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';

const TypingIndicator = () => (
    <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-[#7F77DD] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1" fill="white" stroke="none"/>
            </svg>
        </div>
        <div style={{
            background: '#fff',
            border: '0.5px solid #E5E7EB',
            borderRadius: '12px 12px 12px 4px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    display: 'block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#7F77DD',
                    animation: `bounce 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`
                }} />
            ))}
        </div>
    </div>
);

const DEFAULT_PROFILES = [
    { id: 'general', name: 'General', age: null },
];

const NutriGuideChat = ({ onBack, profiles = [] }) => {
    const allProfiles = profiles.length > 0
        ? [...profiles, { id: 'general', name: 'General', age: null }]
        : DEFAULT_PROFILES;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [selectedProfile, setSelectedProfile] = useState(allProfiles[allProfiles.length - 1]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(scrollToBottom, [messages, isTyping, scrollToBottom]);

    const handleSend = useCallback(async (text) => {
        const msgText = (text ?? input).trim();
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
        setLoadingStep(0);

        const interval = setInterval(() => setLoadingStep(p => p < 2 ? p + 1 : p), 1500);

        try {
            const profileData = selectedProfile.id !== 'general' ? {
                age: `${selectedProfile.age} years`,
                weight: selectedProfile.weight ?? 'Unknown',
                conditions: selectedProfile.allergies?.join(', ') ?? 'None',
                prescription: 'None'
            } : { age: '5 years', weight: '18kg', conditions: 'None', prescription: 'None' };

            const res = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: msgText,
                    history: messages.map(m => ({
                        role: m.sender === 'user' ? 'user' : 'model',
                        content: m.text
                    })),
                    ...profileData
                })
            });

            if (!res.ok) throw new Error('API error');
            const data = await res.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.answer,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I'm having trouble connecting right now. Please make sure the AI backend is running and try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            clearInterval(interval);
            setIsTyping(false);
        }
    }, [input, messages, selectedProfile]);

    const showWelcome = messages.length === 0;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
                .nutri-chat-root * {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                }
                .nutri-chat-root {
                    --purple: #7F77DD;
                    --purple-light: #EEEDFE;
                    --green-online: #1D9E75;
                    --text-primary: #1A1A2E;
                    --text-secondary: #6B7280;
                    --text-muted: #9CA3AF;
                    --border: rgba(0,0,0,0.08);
                    --bg-page: #F7F8FA;
                    --bg-white: #FFFFFF;
                }
                .nutri-scroll::-webkit-scrollbar { width: 4px; }
                .nutri-scroll::-webkit-scrollbar-track { background: transparent; }
                .nutri-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
                .nutri-send-btn:active { transform: scale(0.94); }
                .nutri-chip:hover { border-color: var(--purple) !important; background: var(--purple-light) !important; }
                .nutri-input-wrap:focus-within { 
                    border-color: var(--purple) !important;
                    box-shadow: 0 0 0 3px rgba(127,119,221,0.15) !important;
                }
            `}</style>
            <div
                className="nutri-chat-root"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '620px',
                    maxWidth: '680px',
                    width: '100%',
                    margin: '0 auto',
                    background: '#FFFFFF',
                    border: '0.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}
            >
                <ChatHeader onBack={onBack} />

                {/* Chat body */}
                <div
                    className="nutri-scroll"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        background: 'var(--bg-page)',
                        padding: showWelcome ? '24px 20px' : '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    {showWelcome ? (
                        <WelcomeHero onChipClick={handleSend} />
                    ) : (
                        <>
                            {messages.map(msg => (
                                <ChatMessage key={msg.id} msg={msg} />
                            ))}
                            {isTyping && <TypingIndicator />}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <ChatComposer
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    profiles={allProfiles}
                    selectedProfile={selectedProfile}
                    setSelectedProfile={setSelectedProfile}
                />
            </div>
        </>
    );
};

export default NutriGuideChat;
