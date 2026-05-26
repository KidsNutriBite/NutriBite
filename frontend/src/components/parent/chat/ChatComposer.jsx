import React, { useState, useRef, useEffect } from 'react';

const MicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
);

const ChatComposer = ({ input, setInput, handleSend, profiles = [], selectedProfile, setSelectedProfile }) => {
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef(null);
    const recognitionRef = useRef(null);
    const MAX_CHARS = 500;
    const charCount = input.length;
    const isOverLimit = charCount > 420;

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SR();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.onresult = (e) => {
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) setInput(p => p + e.results[i][0].transcript + ' ');
                }
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, [setInput]);

    const toggleMic = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try { recognitionRef.current?.start(); setIsListening(true); } catch {}
        }
    };

    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const lineHeight = 22;
        const maxLines = 3;
        el.style.height = `${Math.min(el.scrollHeight, lineHeight * maxLines + 16)}px`;
    };

    const handleChange = (e) => {
        if (e.target.value.length > MAX_CHARS) return;
        setInput(e.target.value);
        autoResize();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const onSend = () => {
        if (!input.trim()) return;
        handleSend(input);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    return (
        <div style={{
            background: '#FFFFFF',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            padding: '10px 16px 14px',
            flexShrink: 0
        }}>
            {/* Child profile selector pills */}
            {profiles.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {profiles.map(p => {
                        const active = p.id === selectedProfile?.id || p.name === selectedProfile?.name;
                        return (
                            <button
                                key={p.id ?? p._id ?? p.name}
                                onClick={() => setSelectedProfile(p)}
                                style={{
                                    padding: '4px 11px',
                                    borderRadius: '99px',
                                    border: active ? '1px solid #7F77DD' : '0.5px solid rgba(0,0,0,0.1)',
                                    background: active ? '#EEEDFE' : 'transparent',
                                    color: active ? '#5B52C8' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: active ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {p.name}{p.age ? `, ${p.age}y` : ''}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main input pill */}
            <div
                className="nutri-input-wrap"
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    background: '#F3F4F6',
                    border: '1px solid transparent',
                    borderRadius: '14px',
                    padding: '8px 10px 8px 14px',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about nutrition, meals, or growth…"
                    rows={1}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        lineHeight: '22px',
                        minHeight: '22px',
                        maxHeight: '82px',
                        overflowY: 'auto',
                        padding: 0
                    }}
                />

                {/* Mic */}
                <button
                    type="button"
                    onClick={toggleMic}
                    style={{
                        background: isListening ? '#EEEDFE' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isListening ? '#7F77DD' : '#9CA3AF',
                        padding: '5px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s'
                    }}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    <MicIcon />
                </button>

                {/* Send button */}
                <button
                    type="button"
                    className="nutri-send-btn"
                    onClick={onSend}
                    disabled={!input.trim()}
                    style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        border: 'none',
                        background: input.trim() ? '#7F77DD' : '#D1D5DB',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.15s, transform 0.1s'
                    }}
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
            </div>

            {/* Bottom hints row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
                paddingLeft: '2px',
                paddingRight: '2px'
            }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Type <code style={{ fontFamily: 'monospace', background: '#F3F4F6', padding: '0 3px', borderRadius: '3px' }}>@</code> to mention a child profile
                </span>
                <span style={{ fontSize: '11px', color: isOverLimit ? '#F59E0B' : '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                    {charCount} / {MAX_CHARS}
                </span>
            </div>
        </div>
    );
};

export default ChatComposer;
