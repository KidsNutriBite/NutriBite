"use client";
import React, { useState } from 'react';

const SparkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const SourcesIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

// Clean Editorial Markdown & Table Parser
const FormattedMarkdown = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;

    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Table row detection
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
            if (!trimmed.includes('---')) {
                tableRows.push(cells);
            }
            return;
        } else if (inTable) {
            // Render accumulated table
            if (tableRows.length > 0) {
                const header = tableRows[0];
                const body = tableRows.slice(1);
                elements.push(
                    <div key={`table-${idx}`} className="my-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {header.map((th, hIdx) => (
                                        <th key={hIdx} className="px-4 py-2.5 font-bold">{parseInlineMarkdown(th)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {body.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{parseInlineMarkdown(cell)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                tableRows = [];
            }
            inTable = false;
        }

        if (!trimmed) {
            elements.push(<div key={idx} className="h-2" />);
            return;
        }

        // Blockquotes (Callouts / Executive Summaries)
        if (trimmed.startsWith('> ')) {
            const quoteContent = trimmed.slice(2);
            const isSummary = quoteContent.includes('Parent Executive Summary') || quoteContent.includes('📌');
            elements.push(
                <div 
                    key={idx} 
                    className={`my-3.5 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                        isSummary
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 font-semibold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 border-l-4 border-slate-900 dark:border-slate-100 text-slate-800 dark:text-slate-200'
                    }`}
                >
                    <div className="flex items-start gap-2">
                        {isSummary && <span className="text-base shrink-0 mt-0.5">📌</span>}
                        <div className="flex-1">
                            {parseInlineMarkdown(quoteContent.replace(/^📌\s*/, ''))}
                        </div>
                    </div>
                </div>
            );
            return;
        }

        // Section Headings
        if (trimmed.startsWith('### ')) {
            elements.push(
                <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-5 mb-2 flex items-center gap-1.5">
                    {parseInlineMarkdown(trimmed.slice(4))}
                </h4>
            );
        } else if (trimmed.startsWith('## ')) {
            elements.push(
                <h3 key={idx} className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-5 mb-2 tracking-tight">
                    {parseInlineMarkdown(trimmed.slice(3))}
                </h3>
            );
        } else if (trimmed.startsWith('# ')) {
            elements.push(
                <h2 key={idx} className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-5 mb-2 tracking-tight">
                    {parseInlineMarkdown(trimmed.slice(2))}
                </h2>
            );
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            elements.push(
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 my-1.5 pl-1 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                    <span className="flex-1">{parseInlineMarkdown(trimmed.slice(2))}</span>
                </div>
            );
        } else if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\./)[1];
            const content = trimmed.replace(/^\d+\.\s/, '');
            elements.push(
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 my-1.5 pl-1 leading-relaxed">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold min-w-[18px]">{num}.</span>
                    <span className="flex-1">{parseInlineMarkdown(content)}</span>
                </div>
            );
        } else {
            elements.push(
                <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-1.5 font-normal">
                    {parseInlineMarkdown(trimmed)}
                </p>
            );
        }
    });

    if (inTable && tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1);
        elements.push(
            <div key="table-end" className="my-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {header.map((th, hIdx) => (
                                <th key={hIdx} className="px-4 py-2.5 font-bold">{parseInlineMarkdown(th)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {body.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{parseInlineMarkdown(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return <div>{elements}</div>;
};

// Advanced Inline Markdown Parser (Code, Bold, Links)
const parseInlineMarkdown = (text) => {
    if (typeof text !== 'string') return text;

    // Pattern matches `code`, **bold**, and [title](url)
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const tokens = text.split(regex);

    return tokens.map((token, idx) => {
        if (!token) return null;

        if (token.startsWith('`') && token.endsWith('`')) {
            return (
                <code key={idx} className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-bold">
                    {token.slice(1, -1)}
                </code>
            );
        }
        if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, title, url] = linkMatch;
                return (
                    <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-0.5 transition-colors"
                    >
                        <span>{title}</span>
                        <span className="material-symbols-outlined text-[11px] leading-none">open_in_new</span>
                    </a>
                );
            }
        }
        return token;
    });
};

const ChatMessage = ({ msg, onActionClick, onSaveDietPlan }) => {
    const isUser = msg.sender === 'user';
    const [showSources, setShowSources] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);
    const [planSaved, setPlanSaved] = useState(false);

    const handleSavePlanClick = async () => {
        if (!onSaveDietPlan || !msg.dietPlan) return;
        try {
            setIsSavingPlan(true);
            await onSaveDietPlan(msg.dietPlan);
            setPlanSaved(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingPlan(false);
        }
    };

    // 1. User Message
    if (isUser) {
        return (
            <div className="flex justify-end gap-2.5 my-4">
                <div className="bg-[#18181B] dark:bg-slate-800 text-white rounded-3xl rounded-br-lg px-5 py-3 max-w-lg shadow-sm text-xs sm:text-sm leading-relaxed font-normal">
                    <p>{msg.text}</p>
                    <span className="text-[10px] text-white/50 block text-right mt-1.5 tabular-nums">
                        {msg.time}
                    </span>
                </div>
            </div>
        );
    }

    // 2. AI Assistant Message
    return (
        <div className="flex items-start gap-3.5 my-6">
            {/* Minimal Avatar Mark */}
            <div className="size-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <SparkIcon />
            </div>

            <div className="flex-1 max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">NutriGuide AI</span>
                        <span className="text-[11px] text-slate-400 font-normal">· {msg.time || 'Just now'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                            <span className="material-symbols-outlined text-[11px] leading-none text-indigo-600 dark:text-indigo-400">psychology</span>
                            <span>NutriKid Agentic (NVIDIA NIM / Hybrid RAG)</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                            <ShieldCheckIcon />
                            <span>Clinical Safety Verified</span>
                        </span>
                    </div>
                </div>

                {/* Content Body */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    <FormattedMarkdown text={msg.text} />
                </div>

                {/* Interactive Diet Plan Save Card */}
                {msg.dietPlan && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-lg">restaurant_menu</span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {msg.dietPlan.title || "Customized 6-Meal Pediatric Plan"}
                                </h4>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                6 Meals Ready
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Save this customized meal plan directly to your child&apos;s profile to track and follow anytime.
                        </p>
                        <button
                            onClick={handleSavePlanClick}
                            disabled={isSavingPlan || planSaved}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                planSaved
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-98'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm leading-none">
                                {planSaved ? 'check_circle' : (isSavingPlan ? 'hourglass_top' : 'bookmark_add')}
                            </span>
                            <span>{planSaved ? 'Saved to Your Diet Plans!' : (isSavingPlan ? 'Saving Plan...' : 'Save Plan to My Saved Plans')}</span>
                        </button>
                    </div>
                )}

                {/* Expandable Scientific Sources */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            <SourcesIcon />
                            <span>{showSources ? 'Hide Scientific Citations' : 'View ICMR-NIN & WHO Sources'}</span>
                            <span className="text-[9px]">{showSources ? '▲' : '▼'}</span>
                        </button>

                        <span className="text-[10px] text-slate-400 font-mono">ICMR-NIN RDA 2020</span>
                    </div>

                    {showSources && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 animate-in fade-in duration-150">
                            <p><strong>1. NutriKid Agentic RAG Engine:</strong> Hybrid clinical retriever with NVIDIA NIM (DeepSeek V4 Flash) & deterministic pediatric calorie planner.</p>
                            <p><strong>2. ICMR-NIN (2020):</strong> Recommended Dietary Allowances for Indian School-Age Children & Toddlers. <a href="https://www.nin.res.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">nin.res.in</a></p>
                            <p><strong>3. IFCT (Indian Food Composition Tables):</strong> Bioavailability and nutrient synergies for non-heme iron and calcium.</p>
                            <p><strong>4. WHO Pediatric Standards:</strong> Stature velocity and anthropometric percentiles. <a href="https://www.who.int/tools/child-growth-standards" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">who.int</a></p>
                        </div>
                    )}
                </div>

                {/* Contextual Action Pills */}
                {msg.followUps && msg.followUps.length > 0 && (
                    <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Suggested Next Questions & Actions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {msg.followUps.map((action, aIdx) => (
                                <button
                                    key={aIdx}
                                    onClick={() => onActionClick && onActionClick(action.prompt || action.label)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-2xs"
                                >
                                    <span>{action.label}</span>
                                    <span className="material-symbols-outlined text-xs leading-none text-slate-400">arrow_forward</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ChatMessage;
