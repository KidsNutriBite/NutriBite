"use client";
import React, { useState, useRef, useEffect } from 'react';
import { formatAllergy } from './NutriGuideChat';

const ProfileRow = ({ profile, onSelect }) => {
    const allergies = profile.allergies ?? [];
    const shown = allergies.slice(0, 2);
    const extra = allergies.length - shown.length;

    return (
        <button
            onClick={() => onSelect(profile)}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left transition-colors hover:bg-[#F4F4F4] dark:hover:bg-slate-800 cursor-pointer border-b border-black/[0.04] dark:border-white/[0.04] last:border-none"
        >
            <div className="size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-slate-100 dark:bg-slate-800">
                👧
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{profile.name}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                        {profile.age}y {profile.weight ? `· ${profile.weight}kg` : ''}
                    </span>
                </div>
                {shown.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {shown.map(a => (
                            <span key={a} className="text-[10px] font-normal text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                                ⚠ {formatAllergy(a)}
                            </span>
                        ))}
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

    const childName = activeChild?.name ? activeChild.name.split(' ')[0] : 'your child';

    return (
        <div className="relative w-full">
            {/* Child Mention Popup */}
            {showPicker && (
                <div
                    ref={pickerRef}
                    className="absolute bottom-full mb-3 left-0 right-0 max-w-sm bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-white/[0.08] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                    <div className="px-4 py-2.5 bg-[#F8F8F8] dark:bg-slate-800/70 border-b border-black/[0.04] dark:border-white/[0.04] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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

            {/* Floating Glass Input Capsule */}
            <div className="flex items-end gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-2.5 sm:p-3 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] focus-within:border-black/30 dark:focus-within:border-white/30 transition-all shadow-[0_8px_30px_rgb(0_0_0/0.04)]">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about nutrition, meals, growth, or food choices for ${childName}...`}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed min-h-[26px] max-h-[96px] overflow-y-auto px-3 py-1 font-normal"
                />

                {/* Voice Mic Button */}
                <button
                    type="button"
                    onClick={toggleMic}
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isListening
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse'
                            : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                    aria-label={isListening ? 'Stop recording' : 'Voice input'}
                    title={isListening ? 'Stop recording' : 'Voice input'}
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
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        input.trim()
                            ? 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm cursor-pointer active:scale-95'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
            </div>

            {/* Micro Details & Type @ Mention Indicator */}
            <div className="flex justify-between items-center mt-2 px-3 text-[11px] text-slate-400 font-normal">
                <span className="flex items-center gap-1">
                    Type <code className="px-1.5 py-0.5 rounded-full bg-[#F0F0F0] dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">@</code> to select child context
                </span>
                <span className={`tabular-nums ${isOverLimit ? 'text-amber-600 font-medium' : ''}`}>
                    {charCount} / {MAX_CHARS}
                </span>
            </div>
        </div>
    );
};

export default ChatComposer;
