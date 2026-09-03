"use client";
import React from 'react';

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const ChatHeader = ({ onBack, activeChild, profiles = [], onSelectChild, onToggleSidebar, onNewChat }) => {
    return (
        <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-sm">
            {/* Left: Back Button & History Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                        aria-label="Back to Parent Dashboard"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        <span className="hidden md:inline">Dashboard</span>
                    </button>
                )}

                {/* History Drawer Toggle Button */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
                    title="Open Consultations Drawer"
                >
                    <span className="material-symbols-outlined text-base">forum</span>
                    <span className="hidden sm:inline">Threads</span>
                </button>

                {/* New Chat Quick Button */}
                <button
                    onClick={onNewChat}
                    className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm"
                    title="Start Fresh Consultation"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span className="hidden sm:inline">New Chat</span>
                </button>

                {/* Branding & Status */}
                <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-emerald-500 text-white flex items-center justify-center shadow-md shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">smart_toy</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                NutriGuide Clinical Copilot
                            </h1>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheckIcon />
                                <span>Verified</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Active Child Selector */}
            <div className="flex items-center gap-2">
                {profiles && profiles.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        {profiles.map(child => {
                            const isSelected = child._id === activeChild?._id || child.id === activeChild?.id;
                            return (
                                <button
                                    key={child._id || child.id}
                                    onClick={() => onSelectChild && onSelectChild(child)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isSelected
                                            ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>👶</span>
                                    <span>{child.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </header>
    );
};

export default ChatHeader;
