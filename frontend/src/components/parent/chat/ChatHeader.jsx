"use client";
import React from 'react';

const SparkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const ChatHeader = ({ onBack, activeChild, profiles = [], onSelectChild, onToggleSidebar, onNewChat, onOpenSavedPlans }) => {
    return (
        <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3 pb-2 w-full flex justify-center pointer-events-none">
            {/* Floating Glass Pill Navbar */}
            <div className="w-full max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] rounded-full px-3 sm:px-4 py-2 flex items-center justify-between shadow-[0_8px_30px_rgb(0_0_0/0.04)] pointer-events-auto transition-all">
                
                {/* Left: Brand Identity & Back */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                            aria-label="Back to Dashboard"
                            title="Back to Dashboard"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 pl-0.5">
                        <div className="size-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                            <SparkIcon />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                                NutriGuide<span className="text-slate-400 dark:text-slate-500 ml-1 font-normal text-xs">AI</span>
                            </span>
                            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <ShieldCheckIcon />
                                <span>Safety Verified</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center / Right: Child Context & Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Active Child Context Pill */}
                    {profiles && profiles.length > 0 && (
                        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-full p-0.5 border border-black/[0.04] dark:border-white/[0.04]">
                            {profiles.map(child => {
                                const isSelected = child._id === activeChild?._id || child.id === activeChild?.id;
                                return (
                                    <button
                                        key={child._id || child.id}
                                        onClick={() => onSelectChild && onSelectChild(child)}
                                        className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-normal'
                                        }`}
                                    >
                                        <span className="text-xs">👧</span>
                                        <span>{child.name.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Saved Diet Plans Button */}
                    <button
                        onClick={onOpenSavedPlans}
                        className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs active:scale-95 cursor-pointer"
                        title="View Saved Diet Plans"
                    >
                        <span className="material-symbols-outlined text-sm">bookmark</span>
                        <span className="hidden sm:inline">Saved Plans</span>
                    </button>

                    {/* New Chat Pill Button */}
                    <button
                        onClick={onNewChat}
                        className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        title="Start New Chat"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="hidden sm:inline">New Chat</span>
                    </button>

                    {/* Conversation History Drawer Toggle */}
                    <button
                        onClick={onToggleSidebar}
                        className="size-8 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all flex items-center justify-center cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                        title="View Conversation History"
                        aria-label="Conversation History"
                    >
                        <span className="material-symbols-outlined text-base">history</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
