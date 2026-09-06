"use client";
import React, { useState } from 'react';

const SparkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

const ConversationSidebar = ({
    isOpen,
    onClose,
    conversations = [],
    activeConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    activeChild,
    profiles = [],
    onSelectChild
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(c => 
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessagePreview || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const childName = activeChild?.name ? activeChild.name.split(' ')[0] : 'Child';

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08] transform transition-transform duration-300 ease-out flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.06)] ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Header Area */}
            <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06] flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
                            <SparkIcon />
                        </div>
                        <div>
                            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Conversations</h3>
                            <p className="text-[11px] text-slate-400 font-normal">History for {childName}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="size-7 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer"
                        title="Close Sidebar"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                {/* New Chat Primary Button */}
                <button
                    onClick={() => {
                        onNewChat();
                        onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>New Consultation</span>
                </button>

                {/* Search Input */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#F4F4F4] dark:bg-slate-800 border border-black/[0.04] dark:border-white/[0.04] rounded-full outline-none focus:border-black/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-normal"
                    />
                </div>
            </div>

            {/* Multi-Child Selector Tabs */}
            {profiles.length > 1 && (
                <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-slate-850/50 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Child Context</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {profiles.map(p => {
                            const isSelected = p._id === activeChild?._id || p.id === activeChild?.id;
                            return (
                                <button
                                    key={p._id || p.id}
                                    onClick={() => onSelectChild(p)}
                                    className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-black/[0.06] dark:border-white/[0.06] hover:bg-slate-50'
                                    }`}
                                >
                                    <span>👧</span>
                                    <span>{p.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <span className="material-symbols-outlined text-2xl mb-2 opacity-40">chat_bubble_outline</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No conversations yet</p>
                        <p className="text-[11px] mt-1 text-slate-400">Your nutrition conversations will appear here.</p>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const isActive = conv.id === activeConversationId;
                        const formattedDate = new Date(conv.lastUpdated).toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                            <div
                                key={conv.id}
                                className={`group relative p-3.5 rounded-2xl transition-all border cursor-pointer ${
                                    isActive
                                        ? 'bg-[#F4F4F4] dark:bg-slate-800 border-black/[0.08] dark:border-white/[0.08] shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-slate-700 dark:text-slate-300'
                                }`}
                                onClick={() => {
                                    onSelectConversation(conv.id);
                                    onClose();
                                }}
                            >
                                <div className="flex items-start justify-between gap-2 pr-6">
                                    <h4 className="text-xs font-medium text-slate-900 dark:text-white truncate leading-snug">{conv.title}</h4>
                                    <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">{formattedDate}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1 font-normal">{conv.lastMessagePreview}</p>

                                {/* Delete Action Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete conversation "${conv.title}"?`)) {
                                            onDeleteConversation(conv.id);
                                        }
                                    }}
                                    className="absolute top-3 right-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition"
                                    title="Delete conversation"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Status Footer */}
            <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.06] bg-[#FAFAFA] dark:bg-slate-900 text-[11px] text-slate-400 flex items-center justify-between font-normal">
                <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Context active for {childName}</span>
                </span>
                <span className="font-mono text-[10px]">NutriGuide v2</span>
            </div>
        </aside>
    );
};

export default ConversationSidebar;
