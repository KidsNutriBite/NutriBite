"use client";
import React, { useState, useRef, useEffect } from 'react';
import { formatAllergy } from './NutriGuideChat';

// ─── Avatar mapping ───────────────────────────────────────────────────────────
const AVATAR_MAP = {
    lion:     { emoji: '🦁', bg: '#EEEDFE', text: '#3C3489' },
    bear:     { emoji: '🐻', bg: '#E1F5EE', text: '#0F6E56' },
    rabbit:   { emoji: '🐰', bg: '#FBEAF0', text: '#993556' },
    tiger:    { emoji: '🐯', bg: '#FAEEDA', text: '#854F0B' },
    elephant: { emoji: '🐘', bg: '#E6F1FB', text: '#185FA5' },
};

function getAvatar(profile) {
    const key = profile.avatar?.toLowerCase();
    if (AVATAR_MAP[key]) return AVATAR_MAP[key];
    // Default: first letter
    return { emoji: null, letter: profile.name?.charAt(0)?.toUpperCase() ?? '?', bg: '#F1EFE8', text: '#5F5E5A' };
}

// ─── Mic icon ─────────────────────────────────────────────────────────────────
const MicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);

// ─── Send icon ────────────────────────────────────────────────────────────────
const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
    </svg>
);

// ─── Shimmer skeleton row ─────────────────────────────────────────────────────
const SkeletonRow = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
        <div className="nutri-shimmer" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="nutri-shimmer" style={{ height: '11px', width: '60%', borderRadius: '6px' }} />
            <div className="nutri-shimmer" style={{ height: '9px', width: '40%', borderRadius: '6px' }} />
        </div>
    </div>
);

// ─── Allergy badge ────────────────────────────────────────────────────────────
const AllergyBadge = ({ label }) => (
    <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 500,
        background: '#FEF3C7', color: '#B45309',
        border: '0.5px solid #FDE68A', borderRadius: '4px',
        padding: '1px 5px', whiteSpace: 'nowrap'
    }}>
        ⚠ {label}
    </span>
);

// ─── Profile row in picker ────────────────────────────────────────────────────
const ProfileRow = ({ profile, onSelect }) => {
    const av = getAvatar(profile);
    const allergies = profile.allergies ?? [];
    const shown = allergies.slice(0, 2);
    const extra = allergies.length - shown.length;

    return (
        <button
            onClick={() => onSelect(profile)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 14px', width: '100%', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', transition: 'background 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            {/* Avatar */}
            <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: av.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: av.emoji ? '17px' : '14px',
                fontWeight: 700, color: av.text, flexShrink: 0
            }}>
                {av.emoji ?? av.letter}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{profile.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        {profile.age}y{profile.weight ? ` · ${profile.weight}kg` : ''}
                    </span>
                </div>
                {shown.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {shown.map(a => <AllergyBadge key={a} label={formatAllergy(a)} />)}
                        {extra > 0 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>+{extra} more</span>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
};

// ─── Main ChatComposer ────────────────────────────────────────────────────────
const ChatComposer = ({
    input, setInput, handleSend,
    profiles = [],
    activeChild, setActiveChild
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef(null);
    const pickerRef = useRef(null);
    const recognitionRef = useRef(null);
    const MAX_CHARS = 500;
    const charCount = input.length;
    const isOverLimit = charCount > 420;

    // ── Speech recognition setup ──────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
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
    }, [setInput]);

    const toggleMic = () => {
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
        else { try { recognitionRef.current?.start(); setIsListening(true); } catch {} }
    };

    // ── Textarea auto-resize ──────────────────────────────────────────────────
    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 22 * 3 + 16)}px`;
    };

    const handleChange = (e) => {
        if (e.target.value.length > MAX_CHARS) return;
        const val = e.target.value;
        setInput(val);
        autoResize();
        // Show picker when @ is typed
        if (val.endsWith('@')) setShowPicker(true);
        else if (!val.includes('@')) setShowPicker(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
        if (e.key === 'Escape') setShowPicker(false);
    };

    const onSend = () => {
        if (!input.trim()) return;
        handleSend(input);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setShowPicker(false);
    };

    // ── Select profile from @ picker ──────────────────────────────────────────
    const handleSelectProfile = (profile) => {
        setActiveChild(profile);
        // Replace trailing @ with @Name
        setInput(prev => prev.replace(/@[^@]*$/, `@${profile.name} `));
        setShowPicker(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div style={{ background: '#FFFFFF', borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '10px 16px 14px', flexShrink: 0, position: 'relative' }}>

            {/* ── @ picker popup ─────────────────────────────────────────────── */}
            {showPicker && (
                <div
                    ref={pickerRef}
                    style={{
                        position: 'absolute', bottom: 'calc(100% + 8px)', left: '16px', right: '16px',
                        background: '#FFFFFF', border: '0.5px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 50
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '8px 14px', background: '#F7F8FA',
                        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>
                        Child profiles
                    </div>

                    {/* Empty state — no profiles yet on this account */}
                    {profiles.length === 0 && (
                        <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>No child profiles yet</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>Add a child from your dashboard</p>
                            <button
                                onClick={() => { handleSend('I want to add a child profile'); setShowPicker(false); }}
                                style={{
                                    fontSize: '12px', fontWeight: 600, color: '#7F77DD',
                                    background: '#EEEDFE', border: '0.5px solid rgba(127,119,221,0.3)',
                                    borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit'
                                }}
                            >
                                + Add first child
                            </button>
                        </div>
                    )}

                    {/* Profile list */}
                    {profiles.length > 0 && (
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {profiles.map(p => (
                                <ProfileRow
                                    key={p._id ?? p.id}
                                    profile={p}
                                    onSelect={handleSelectProfile}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Main input pill ───────────────────────────────────────────── */}
            <div
                className="nutri-input-wrap"
                style={{
                    display: 'flex', alignItems: 'flex-end', gap: '8px',
                    background: '#F3F4F6', border: '1px solid transparent',
                    borderRadius: '14px', padding: '8px 10px 8px 14px',
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
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        resize: 'none', fontSize: '13.5px', color: 'var(--text-primary)',
                        fontFamily: 'inherit', lineHeight: '22px',
                        minHeight: '22px', maxHeight: '82px', overflowY: 'auto', padding: 0
                    }}
                />

                {/* Mic */}
                <button
                    type="button"
                    onClick={toggleMic}
                    style={{
                        background: isListening ? '#EEEDFE' : 'none', border: 'none',
                        cursor: 'pointer', color: isListening ? '#7F77DD' : '#9CA3AF',
                        padding: '5px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s'
                    }}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    <MicIcon />
                </button>

                {/* Send */}
                <button
                    type="button"
                    className="nutri-send-btn"
                    onClick={onSend}
                    disabled={!input.trim()}
                    style={{
                        width: '34px', height: '34px', borderRadius: '50%', border: 'none',
                        background: input.trim() ? '#7F77DD' : '#D1D5DB',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'background 0.15s, transform 0.1s'
                    }}
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
            </div>

            {/* ── Bottom row: hint + char counter ──────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '0 2px' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Type{' '}
                    <code style={{ fontFamily: 'monospace', background: '#F3F4F6', padding: '0 3px', borderRadius: '3px' }}>@</code>
                    {' '}to mention a child profile
                </span>
                <span style={{ fontSize: '11px', color: isOverLimit ? '#F59E0B' : '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                    {charCount} / {MAX_CHARS}
                </span>
            </div>
        </div>
    );
};

export default ChatComposer;
