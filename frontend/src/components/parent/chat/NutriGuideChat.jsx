"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import WelcomeHero from './WelcomeHero';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import { getMyProfiles } from '../../../api/profile.api';

const TypingIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#7F77DD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
                <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
            </svg>
        </div>
        <div style={{
            background: '#fff', border: '0.5px solid #E5E7EB',
            borderRadius: '4px 12px 12px 12px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '5px'
        }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#7F77DD',
                    animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`
                }} />
            ))}
        </div>
    </div>
);

const NutriGuideChat = ({ onBack }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    // Dynamic child profiles state
    const [profiles, setProfiles] = useState([]);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [profilesError, setProfilesError] = useState(null);
    const [activeChild, setActiveChild] = useState(null); // full profile object

    const messagesEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(scrollToBottom, [messages, isTyping, scrollToBottom]);

    // Fetch profiles from real backend on mount
    const fetchProfiles = useCallback(async () => {
        setProfilesLoading(true);
        setProfilesError(null);
        try {
            const data = await getMyProfiles();
            // Normalize: API may return array directly or wrapped in { profiles: [] }
            setProfiles(Array.isArray(data) ? data : (data.profiles ?? []));
        } catch (err) {
            console.error('Failed to load profiles:', err);
            setProfilesError('Couldn\'t load profiles');
        } finally {
            setProfilesLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

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
        setLoadingStep(0);

        const interval = setInterval(() => setLoadingStep(p => p < 2 ? p + 1 : p), 1500);

        try {
            // Build request body — use real child data if selected, else empty strings
            const requestBody = activeChild ? {
                question: msgText,
                age: `${activeChild.age} years`,
                weight: `${activeChild.weight ?? ''}kg`,
                conditions: (activeChild.allergies ?? []).join(', '),
                audience: 'parent',
                history: messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    content: m.text
                }))
            } : {
                question: msgText,
                age: '',
                weight: '',
                conditions: '',
                audience: 'parent',
                history: messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    content: m.text
                }))
            };

            const res = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
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
    }, [input, messages, activeChild]);

    const showWelcome = messages.length === 0;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
                @keyframes shimmer {
                    0% { background-position: -200px 0; }
                    100% { background-position: calc(200px + 100%) 0; }
                }
                .nutri-chat-root * { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
                .nutri-chat-root {
                    --purple: #7F77DD;
                    --purple-light: #EEEDFE;
                    --purple-dark: #3C3489;
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
                .nutri-shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200px 100%;
                    animation: shimmer 1.4s infinite;
                }
            `}</style>
            <div
                className="nutri-chat-root"
                style={{
                    display: 'flex', flexDirection: 'column',
                    height: '620px', maxWidth: '680px', width: '100%', margin: '0 auto',
                    background: '#FFFFFF', border: '0.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px', overflow: 'hidden'
                }}
            >
                <ChatHeader onBack={onBack} />

                {/* Chat body */}
                <div
                    className="nutri-scroll"
                    style={{
                        flex: 1, overflowY: 'auto',
                        background: 'var(--bg-page)',
                        padding: showWelcome ? '24px 20px' : '16px 20px',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                    }}
                >
                    {showWelcome ? (
                        <WelcomeHero onChipClick={handleSend} />
                    ) : (
                        <>
                            {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
                            {isTyping && <TypingIndicator />}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Active child context bar */}
                {activeChild && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 16px', background: '#EEEDFE',
                        borderTop: '0.5px solid rgba(127,119,221,0.2)',
                        fontSize: '12px', color: '#3C3489', fontWeight: 500
                    }}>
                        <span>
                            Answering for <strong>{activeChild.name}</strong>, {activeChild.age}y
                            {activeChild.allergies?.length > 0 && (
                                <span style={{ color: '#B45309' }}>
                                    {' · ⚠ '}{activeChild.allergies.slice(0, 2).map(a => formatAllergy(a)).join(', ')}
                                    {activeChild.allergies.length > 2 && ` +${activeChild.allergies.length - 2} more`}
                                </span>
                            )}
                        </span>
                        <button
                            onClick={() => setActiveChild(null)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#7F77DD', fontSize: '14px', lineHeight: 1, padding: '2px 4px',
                                fontFamily: 'inherit'
                            }}
                            aria-label="Clear active child"
                        >✕</button>
                    </div>
                )}

                <ChatComposer
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    profiles={profiles}
                    profilesLoading={profilesLoading}
                    profilesError={profilesError}
                    onRetryProfiles={fetchProfiles}
                    activeChild={activeChild}
                    setActiveChild={setActiveChild}
                />
            </div>
        </>
    );
};

// Allergy label formatter (shared utility — also used in ChatComposer)
export function formatAllergy(raw) {
    const map = {
        egg_protein: 'Egg', peanut: 'Peanut', dairy: 'Dairy',
        gluten: 'Gluten', soy: 'Soy', shellfish: 'Shellfish', tree_nut: 'Tree Nut'
    };
    return map[raw] ?? (raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' '));
}

export default NutriGuideChat;
