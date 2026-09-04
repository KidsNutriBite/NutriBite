"use client";
import React, { useState } from 'react';

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const DoctorIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

const SourcesIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

// Simple Markdown & Table Parser for Structured AI Output
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
                    <div key={`table-${idx}`} className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {header.map((th, hIdx) => (
                                        <th key={hIdx} className="px-3.5 py-2.5">{parseInlineMarkdown(th)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {body.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">{parseInlineMarkdown(cell)}</td>
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

        // Blockquotes (Executive Summaries / Callouts)
        if (trimmed.startsWith('> ')) {
            elements.push(
                <div key={idx} className="my-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs text-blue-950 dark:text-blue-200 leading-relaxed font-medium">
                    {parseInlineMarkdown(trimmed.slice(2))}
                </div>
            );
            return;
        }

        // Section Headings
        if (trimmed.startsWith('### ')) {
            elements.push(
                <h4 key={idx} className="text-xs font-black uppercase tracking-wider text-primary mt-4 mb-2 flex items-center gap-1.5">
                    {parseInlineMarkdown(trimmed.slice(4))}
                </h4>
            );
        } else if (trimmed.startsWith('## ')) {
            elements.push(
                <h3 key={idx} className="text-sm font-black text-slate-900 dark:text-white mt-4 mb-2">
                    {parseInlineMarkdown(trimmed.slice(3))}
                </h3>
            );
        } else if (trimmed.startsWith('# ')) {
            elements.push(
                <h2 key={idx} className="text-base font-black text-slate-900 dark:text-white mt-4 mb-2">
                    {parseInlineMarkdown(trimmed.slice(2))}
                </h2>
            );
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            elements.push(
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 my-1 pl-1">
                    <span className="text-primary font-black mt-0.5">•</span>
                    <span className="flex-1 leading-relaxed">{parseInlineMarkdown(trimmed.slice(2))}</span>
                </div>
            );
        } else if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\./)[1];
            const content = trimmed.replace(/^\d+\.\s/, '');
            elements.push(
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 my-1 pl-1">
                    <span className="text-primary font-bold min-w-[18px] mt-0.5">{num}.</span>
                    <span className="flex-1 leading-relaxed">{parseInlineMarkdown(content)}</span>
                </div>
            );
        } else {
            elements.push(
                <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
                    {parseInlineMarkdown(trimmed)}
                </p>
            );
        }
    });

    if (inTable && tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1);
        elements.push(
            <div key="table-end" className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {header.map((th, hIdx) => (
                                <th key={hIdx} className="px-3.5 py-2.5">{parseInlineMarkdown(th)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {body.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">{parseInlineMarkdown(cell)}</td>
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

// Inline Markdown Parser: Bold (**...**), Code (`...`), Italic (*...*)
const parseInlineMarkdown = (text) => {
    if (typeof text !== 'string') return text;

    // Split on code backticks and bold tags
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return tokens.map((token, idx) => {
        if (token.startsWith('`') && token.endsWith('`')) {
            return (
                <code key={idx} className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                    {token.slice(1, -1)}
                </code>
            );
        }
        if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>;
        }
        return token;
    });
};

const ChatMessage = ({ msg, onActionClick }) => {
    const isUser = msg.sender === 'user';
    const [showSources, setShowSources] = useState(false);

    // If message is from user
    if (isUser) {
        return (
            <div className="flex justify-end gap-2.5 my-3">
                <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-2.5 max-w-lg shadow-sm text-xs sm:text-sm leading-relaxed">
                    <p>{msg.text}</p>
                    <span className="text-[10px] text-white/70 block text-right mt-1">{msg.time}</span>
                </div>
            </div>
        );
    }

    // AI Message (Clinical Structured Card)
    return (
        <div className="flex items-start gap-3 my-4">
            {/* AI Avatar */}
            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-base">smart_toy</span>
            </div>

            <div className="flex-1 max-w-2xl bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                
                {/* Header Status Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">NutriGuide Clinical Copilot</span>
                        <span className="text-[10px] font-bold text-slate-400">· {msg.time || 'Just now'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheckIcon />
                            <span>Safety Checked</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                            <DoctorIcon />
                            <span>Dr. Rajesh Supervised</span>
                        </span>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <FormattedMarkdown text={msg.text} />
                </div>

                {/* Expandable Sources / References Drawer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
                        >
                            <SourcesIcon />
                            <span>{showSources ? 'Hide Scientific Sources' : 'View ICMR & IFCT Sources'}</span>
                            <span className="text-[10px]">{showSources ? '▲' : '▼'}</span>
                        </button>

                        <span className="text-[10px] text-slate-400">Pediatric Nutrition Protocol v4.2</span>
                    </div>

                    {showSources && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                            <p><strong>1. ICMR-NIN (2020):</strong> Recommended Dietary Allowances for Indian Children (School Age & Toddlers).</p>
                            <p><strong>2. IFCT (Indian Food Composition Tables):</strong> Bioavailability synergy ratios for non-heme iron and ascorbic acid.</p>
                            <p><strong>3. Pediatric Care Plan:</strong> Endorsed by Dr. Rajesh Iyer, MD (Rainbow Children's Hospital).</p>
                        </div>
                    )}
                </div>

                {/* Smart Next Actions (Dynamic Follow-up Chips) */}
                {msg.followUps && msg.followUps.length > 0 && (
                    <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Suggested Next Steps:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((action, aIdx) => (
                                <button
                                    key={aIdx}
                                    onClick={() => onActionClick && onActionClick(action.prompt || action.label)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
                                >
                                    {action.label}
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
