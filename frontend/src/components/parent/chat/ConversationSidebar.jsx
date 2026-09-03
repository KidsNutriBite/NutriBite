"use client";
import React, { useState } from 'react';

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

    const childName = activeChild?.name?.split(' ')[0] || 'Child';

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Top Header & New Chat Button */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 text-white flex items-center justify-center shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-lg">forum</span>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Consultation History</h3>
                            <p className="text-[10px] font-bold text-slate-400">{childName}'s Isolated Threads</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Close History Sidebar"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* New Chat Primary Action Button */}
                <button
                    onClick={() => {
                        onNewChat();
                        onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>New Consultation Thread</span>
                </button>

                {/* Instant Real-Time Search Input */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search consultations..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl outline-none focus:border-primary/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Child Profile Quick Switcher */}
            {profiles.length > 1 && (
                <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Child Focus</label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {profiles.map(p => {
                            const isSelected = p._id === activeChild?._id || p.id === activeChild?.id;
                            return (
                                <button
                                    key={p._id || p.id}
                                    onClick={() => onSelectChild(p)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                    }`}
                                >
                                    <span>👶</span>
                                    <span>{p.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <span className="material-symbols-outlined text-3xl mb-2 opacity-50">chat_bubble_outline</span>
                        <p className="text-xs font-bold">No consultation threads found</p>
                        <p className="text-[10px] mt-1 text-slate-400">Start a new consultation to track pediatric recommendations</p>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const isActive = conv.id === activeConversationId;
                        const formattedDate = new Date(conv.lastUpdated).toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                            <div
                                key={conv.id}
                                className={`group relative p-3 rounded-xl transition-all border cursor-pointer ${
                                    isActive
                                        ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 text-primary shadow-sm'
                                        : 'bg-white/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                                }`}
                                onClick={() => {
                                    onSelectConversation(conv.id);
                                    onClose();
                                }}
                            >
                                <div className="flex items-start justify-between gap-2 pr-6">
                                    <h4 className="text-xs font-bold truncate leading-snug">{conv.title}</h4>
                                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{formattedDate}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate mt-1">{conv.lastMessagePreview}</p>

                                {/* Quick Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete conversation "${conv.title}"?`)) {
                                            onDeleteConversation(conv.id);
                                        }
                                    }}
                                    className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                    title="Delete thread"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Memory Status Indicator */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Memory Shield Active
                </span>
                <span>Isolated to {childName}</span>
            </div>
        </aside>
    );
};

export default ConversationSidebar;
