"use client";
import React, { useState, useRef, useEffect } from 'react';
import { formatAllergy } from './NutriGuideChat';

// Avatar mapping
const AVATAR_MAP = {
    lion:     { emoji: '🦁', bg: '#eff6ff', text: '#1e40af' },
    bear:     { emoji: '🐻', bg: '#f0fdf4', text: '#166534' },
    rabbit:   { emoji: '🐰', bg: '#fdf2f8', text: '#9d174d' },
    tiger:    { emoji: '🐯', bg: '#fffbeb', text: '#92400e' },
    elephant: { emoji: '🐘', bg: '#f0f9ff', text: '#075985' },
};

function getAvatar(profile) {
    const key = profile?.avatar?.toLowerCase();
    if (AVATAR_MAP[key]) return AVATAR_MAP[key];
    const isFemale = profile?.gender === 'female';
    return {
        emoji: isFemale ? '👧' : '👦',
        bg: isFemale ? '#fdf2f8' : '#eff6ff',
        text: isFemale ? '#9d174d' : '#1e40af'
    };
}

const AllergyBadge = ({ label }) => (
    <span className="inline-block text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 whitespace-nowrap">
        ⚠ {label}
    </span>
);

const ProfileRow = ({ profile, onSelect }) => {
    const av = getAvatar(profile);
    const allergies = profile.allergies ?? [];
    const shown = allergies.slice(0, 2);
    const extra = allergies.length - shown.length;

    return (
        <button
            onClick={() => onSelect(profile)}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-none"
        >
            <div className="size-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-slate-100 dark:bg-slate-800">
                {av.emoji}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{profile.name}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                        {profile.age}y {profile.weight ? `· ${profile.weight}kg` : ''}
                    </span>
                </div>
                {shown.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {shown.map(a => <AllergyBadge key={a} label={formatAllergy(a)} />)}
                        {extra > 0 && (
                            <span className="text-[10px] text-slate-400 self-center">+{extra} more</span>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
};

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

    // Speech recognition setup
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
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch {}
        }
    };

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
        if (val.endsWith('@')) setShowPicker(true);
        else if (!val.includes('@')) setShowPicker(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
        if (e.key === 'Escape') setShowPicker(false);
    };

    const onSend = () => {
        if (!input.trim()) return;
        handleSend(input);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setShowPicker(false);
    };

    const handleSelectProfile = (profile) => {
        setActiveChild(profile);
        setInput(prev => prev.replace(/@[^@]*$/, `@${profile.name} `));
        setShowPicker(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative w-full">
            {/* Profile Mention Popup */}
            {showPicker && (
                <div
                    ref={pickerRef}
                    className="absolute bottom-full mb-2 left-0 right-0 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Select Child Profile
                    </div>

                    <div className="max-h-52 overflow-y-auto">
                        {profiles.map(p => (
                            <ProfileRow
                                key={p._id ?? p.id}
                                profile={p}
                                onSelect={handleSelectProfile}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Input Pill Container */}
            <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-850 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about nutrition, 6-meal plans, or growth for ${activeChild?.name ? activeChild.name.split(' ')[0] : 'your child'}...`}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed min-h-[24px] max-h-[88px] overflow-y-auto px-2 py-1"
                />

                {/* Voice Input Mic Button */}
                <button
                    type="button"
                    onClick={toggleMic}
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isListening
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                    aria-label={isListening ? 'Stop recording' : 'Record voice query'}
                >
                    <span className="material-symbols-outlined text-lg">
                        {isListening ? 'mic' : 'mic_none'}
                    </span>
                </button>

                {/* Send Button */}
                <button
                    type="button"
                    onClick={onSend}
                    disabled={!input.trim()}
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
                        input.trim()
                            ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer active:scale-95'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                    aria-label="Send query"
                >
                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                </button>
            </div>

            {/* Bottom Counter & Quick Hint */}
            <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-slate-400">
                <span>
                    Type <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">@</code> to switch child context
                </span>
                <span className={`tabular-nums ${isOverLimit ? 'text-amber-500 font-bold' : ''}`}>
                    {charCount} / {MAX_CHARS}
                </span>
            </div>
        </div>
    );
};

export default ChatComposer;
