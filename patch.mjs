import fs from 'fs';
import { execSync } from 'child_process';

const filePath = 'frontend/src/components/parent/chat/NutriGuideChat.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

const newRenderContent = `    // Enhanced Markdown Renderer
    const renderContent = (text) => {
        const parts = text.split('|||DETAILED|||');
        const shortAnswer = parts[0];
        const detailedAnswer = parts[1];

        const parseInline = (text) => {
            if (!text) return null;
            const parts = text.split(/(\\*\\*.*?\\*\\*)/g);
            return parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                }
                const italicParts = part.split(/(\\*.*?\\*)/g);
                return italicParts.map((subPart, k) => {
                    if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                        return <em key={\`\${j}-\${k}\`} className="italic text-slate-600 dark:text-slate-400">{subPart.slice(1, -1)}</em>;
                    }
                    return subPart;
                });
            });
        };

        const formatText = (str) => {
            if (!str) return null;
            return str.split('\\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
                if (trimmed === '---' || trimmed === '***') return <hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />;
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="text-indigo-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(trimmed.substring(2))}</span>
                        </div>
                    );
                }
                if (/^\\d+\\.\\s/.test(trimmed)) {
                    const content = trimmed.replace(/^\\d+\\.\\s/, '');
                    return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                            <span className="font-bold text-indigo-500 text-xs mt-0.5">{trimmed.split('.')[0]}.</span>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{parseInline(content)}</span>
                        </div>
                    );
                }
                return <p key={i} className="mb-1 text-slate-700 dark:text-slate-200 leading-relaxed">{parseInline(line)}</p>;
            });
        };

        const parseSections = (content) => {
            if (!content) return [];
            const sections = [];
            let current = { title: '', lines: [] };
            content.split('\\n').forEach(line => {
                if (line.trim().startsWith('### ') || line.trim().startsWith('#### ')) {
                    if (current.lines.length > 0 || current.title) sections.push(current);
                    current = { title: line.trim().replace(/^#+\\s/, ''), lines: [] };
                } else {
                    current.lines.push(line);
                }
            });
            if (current.lines.length > 0 || current.title) sections.push(current);
            return sections;
        };

        const renderSections = (sections) => {
            return sections.map((sec, idx) => {
                const titleLower = sec.title.toLowerCase();
                
                // Safety Disclaimer
                if (titleLower.includes('safety') || titleLower.includes('alert')) {
                    return (
                        <div key={idx} className="mt-4 mb-2 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-xl">
                            <h4 className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-2">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                {sec.title || "Safety Notice"}
                            </h4>
                            <div className="text-rose-600 dark:text-rose-300 text-sm space-y-1">
                                {formatText(sec.lines.join('\\n'))}
                            </div>
                        </div>
                    );
                }
                
                // Verified Sources
                if (titleLower.includes('source') || titleLower.includes('reference')) {
                    return (
                        <div key={idx} className="mt-4 mb-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm text-emerald-500">verified</span>
                                {sec.title || "Verified Sources"}
                            </h4>
                            <div className="text-slate-600 dark:text-slate-400 text-sm space-y-2">
                                {sec.lines.filter(l => l.trim()).map((line, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="material-symbols-outlined text-[10px] mt-1 text-slate-400">link</span>
                                        <span>{parseInline(line.replace(/^-\\s/, '').replace(/^\\[\\d+\\]\\s/, ''))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                // Personalized Plan / Recommendations (Cards)
                if (titleLower.includes('plan') || titleLower.includes('recommend') || titleLower.includes('quick')) {
                    return (
                        <div key={idx} className="mt-4 mb-2">
                            {sec.title && <h3 className="text-base font-bold text-indigo-700 dark:text-indigo-400 mb-3">{sec.title}</h3>}
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                                {sec.lines.map((line, i) => {
                                    const trimmed = line.trim();
                                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                        return (
                                            <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-sm text-indigo-500">restaurant</span>
                                                </div>
                                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(trimmed.substring(2))}</div>
                                            </div>
                                        );
                                    }
                                    return <div key={i} className="col-span-full">{formatText(line)}</div>;
                                })}
                            </div>
                        </div>
                    );
                }

                // Default Section
                return (
                    <div key={idx} className="mb-4">
                        {sec.title && <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{sec.title}</h3>}
                        <div className="text-slate-700 dark:text-slate-200 space-y-2">
                            {formatText(sec.lines.join('\\n'))}
                        </div>
                    </div>
                );
            });
        };

        const shortSections = parseSections(shortAnswer);
        const detailSections = detailedAnswer ? parseSections(detailedAnswer) : [];

        return (
            <div className="space-y-1">
                <div className="text-slate-800 dark:text-slate-200">
                    {shortSections.length > 0 ? renderSections(shortSections) : formatText(shortAnswer)}
                </div>

                {detailedAnswer && (
                    <DetailsSection 
                        content={detailedAnswer} 
                        formatText={formatText} 
                        renderSections={renderSections} 
                        detailSections={detailSections} 
                    />
                )}
            </div>
        );
    };`;

content = content.replace(/    \/\/ Enhanced Markdown Renderer.*?    return \(\n        <div className="flex flex-col/s, newRenderContent + '\\n\\n    return (\\n        <div className="flex flex-col');

const newDetailsSection = `const DetailsSection = ({ content, formatText, renderSections, detailSections }) => {
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
                    {detailSections.length > 0 ? renderSections(detailSections) : formatText(content)}
                </motion.div>
            )}
        </div>
    );
};`;

content = content.replace(/const DetailsSection = \(\{ content, formatText \}\) => \{.*?\n\};/s, newDetailsSection);

fs.writeFileSync(filePath, content, 'utf-8');
execSync('git add ' + filePath);
execSync('git commit -m "refactor: improve chatbot response rendering structure"');

// --- Commit 3 & 5: Header UX & Trust Indicators ---
content = fs.readFileSync(filePath, 'utf-8');

const headerReplacement = `                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">NutriGuide AI</h2>
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                    <span className="material-symbols-outlined text-[10px]">verified</span> Verified
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                {selectedChild ? \`Pediatric Assistant for: \${selectedChild.name}\` : "General Pediatric Advice Mode"}
                            </p>
                        </div>`;

content = content.replace(/                        <div>\s*<h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">NutriGuide AI<\/h2>\s*<p className="text-xs text-slate-500 font-medium">\s*\{selectedChild \? \`Advising for: \$\{selectedChild.name\}\` : "General Advice Mode"\}\s*<\/p>\s*<\/div>/s, headerReplacement);

fs.writeFileSync(filePath, content, 'utf-8');
execSync('git add ' + filePath);
execSync('git commit -m "feat: redesign chat interface for professional healthcare UX and implement verified source indicators"');

// --- Commit 6: Voice Interaction ---
content = fs.readFileSync(filePath, 'utf-8');

const voiceState = `    const [isTyping, setIsTyping] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);`;

content = content.replace("    const messagesEndRef = useRef(null);", voiceState);

const voiceEffect = `    useEffect(scrollToBottom, [messages, isTyping]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        setInput((prev) => prev + transcript + ' ');
                    } else {
                        currentTranscript += transcript;
                    }
                }
            };
            
            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };`;

content = content.replace("    useEffect(scrollToBottom, [messages, isTyping]);", voiceEffect);

const voiceButton = `                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-3">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={\`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 \${isListening ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}\`}
                    >
                        <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
                    </button>
                    <div className="flex-1 relative">`;

content = content.replace('                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-3">\\n                    <div className="flex-1 relative">', voiceButton);
// Handle windows newlines
content = content.replace('                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-3">\r\n                    <div className="flex-1 relative">', voiceButton);
content = content.replace('                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex gap-3">\n                    <div className="flex-1 relative">', voiceButton);

fs.writeFileSync(filePath, content, 'utf-8');
execSync('git add ' + filePath);
execSync('git commit -m "feat: integrate speech-to-text voice interaction for chat input"');
