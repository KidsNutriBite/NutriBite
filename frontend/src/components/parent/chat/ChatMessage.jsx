import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DetailsSection = ({ content, formatText, detailSections = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-2">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    View Detailed Explanation
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2 border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detailed Analysis</span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    {detailSections.length > 0 ? content : formatText(content)}
                </motion.div>
            )}
        </div>
    );
};

const ChatMessage = ({ msg, handleSend }) => {
    // Enhanced Markdown Renderer
    const renderContent = (text) => {
        if (!text) return null;
        
        const parts = text.split('|||DETAILED|||');
        const shortAnswer = parts[0];
        const detailedAnswer = parts.length > 1 ? parts[1] : null;

        const formatText = (str) => {
            if (!str) return null;
            return str.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />; // Spacer for empty lines

                // Headers
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;

                // Horizontal Rule
                if (trimmed === '---' || trimmed === '***') return <hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />;

                // List items (Unordered)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="text-indigo-500">•</span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(trimmed.substring(2))}</span>
                        </div>
                    );
                }

                // List items (Ordered)
                if (/^\d+\.\s/.test(trimmed)) {
                    const content = trimmed.replace(/^\d+\.\s/, '');
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="font-bold text-indigo-500 text-xs mt-1">{trimmed.split('.')[0]}.</span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(content)}</span>
                        </div>
                    );
                }

                // Standard Paragraph
                return (
                    <p key={i} className="mb-1 text-slate-700 dark:text-slate-200 leading-relaxed">
                        {parseInline(line)}
                    </p>
                );
            });
        };

        const parseInline = (text) => {
            const parts = text.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                }
                const italicParts = part.split(/(\*.*?\*)/g);
                return italicParts.map((subPart, k) => {
                    if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                        return <em key={`${j}-${k}`} className="italic text-slate-600 dark:text-slate-400">{subPart.slice(1, -1)}</em>;
                    }
                    return subPart;
                });
            });
        };

        return (
            <div className="space-y-1">
                <div className="text-slate-800 dark:text-slate-200">
                    {formatText(shortAnswer)}
                </div>

                {detailedAnswer && (
                    <DetailsSection content={detailedAnswer} formatText={formatText} />
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex items-end gap-3 max-w-[90%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm border ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-800 text-purple-600 border-slate-200 dark:border-slate-700'}`}>
                    <span className="material-symbols-outlined text-sm">{msg.sender === 'user' ? 'person' : 'smart_toy'}</span>
                </div>

                {/* Bubble */}
                <div>
                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}>
                        {msg.sender === 'ai' ? renderContent(msg.text) : msg.text}
                    </div>
                    
                    {/* Toolbar for AI messages */}
                    {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2 mt-2 ml-2">
                            <button 
                                onClick={() => navigator.clipboard.writeText(msg.text)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center justify-center"
                                title="Copy"
                            >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                            <button 
                                onClick={() => handleSend("Can you explain this in a different way?")}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center justify-center"
                                title="Explain More"
                            >
                                <span className="material-symbols-outlined text-[16px]">psychology</span>
                            </button>
                            <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <button 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center justify-center"
                                title="Helpful"
                            >
                                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                            </button>
                            <button 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors flex items-center justify-center"
                                title="Not Helpful"
                            >
                                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                            </button>
                        </div>
                    )}

                    <div className={`text-[10px] font-medium text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left ml-2'}`}>
                        {msg.time}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ChatMessage;
