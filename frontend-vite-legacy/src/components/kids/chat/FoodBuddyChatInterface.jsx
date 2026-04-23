import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FoodBuddyChatInterface = ({ onBack, profile }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'buddy',
            text: "Hi there, superstar! I'm feeling extra crunchy today! 🥦 Have you eaten any colorful fruits or veggies yet? They give you super powers!",
            time: '10:05 AM'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const handleSend = async (text) => {
        const msgText = text || input;
        if (!msgText.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'me',
            text: msgText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: msgText,
                    history: messages.map(msg => ({
                        role: msg.sender === 'me' ? 'user' : 'model',
                        content: msg.text
                    })),
                    // Use profile data if available, otherwise defaults
                    age: profile?.age ? `${profile.age} years` : "5 years",
                    weight: profile?.weight ? `${profile.weight}kg` : "20kg",
                    conditions: profile?.allergies?.join(", ") || "None",
                    prescription: "None",
                    audience: "kid"
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            const replyMsg = {
                id: Date.now() + 1,
                sender: 'buddy',
                text: data.answer,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, replyMsg]);

        } catch (error) {
            console.error("Food Buddy Error:", error);
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'buddy',
                text: "Oh no! My brain is fuzzy. 😵‍💫 Can you ask a grown-up to check my connection?",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const quickReplies = [
        "Yes, tell me! 🤩",
        "Tell me a story! 📖",
        "Tell me a joke! 😂"
    ];

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] relative overflow-hidden">
            {/* Header */}
            <header className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex items-center justify-between shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                    <div className="relative">
                        <div className="w-12 h-12 bg-green-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-2xl overflow-hidden">
                            🥦
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800">Food Buddy</h1>
                        <p className="text-xs font-bold text-slate-400 italic">"I love snacks! Ask me anything!"</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-2 rounded-full cursor-pointer hover:bg-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-slate-500">volume_up</span>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-full text-blue-600 font-black text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">star</span> 42 Points
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative">
                <div className="sticky top-0 flex justify-center mb-6 z-0 pointer-events-none">
                    <span className="bg-slate-100/80 backdrop-blur-sm text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Today</span>
                </div>

                {/* Background Wallpaper */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group`}
                    >
                        <div className={`flex items-end gap-3 max-w-[80%] md:max-w-[60%] ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm border border-white ${msg.sender === 'me' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                {msg.sender === 'me' ? (profile?.avatar === 'lion' ? '🦁' : '👤') : '🥦'}
                            </div>

                            {/* Bubble */}
                            <div>
                                <div className={`px-6 py-4 rounded-3xl shadow-sm text-sm md:text-base leading-relaxed ${msg.sender === 'me'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                    }`}>
                                    {msg.sender === 'buddy' ? (
                                        <div className="space-y-2">
                                            {msg.text.split('\n').map((line, i) => {
                                                const trimmed = line.trim();
                                                if (!trimmed) return <div key={i} className="h-1" />;

                                                // Simple list handling
                                                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                                                    return (
                                                        <div key={i} className="flex gap-2 ml-1">
                                                            <span className="text-green-500 font-bold">•</span>
                                                            <span className="flex-1">{trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</span>
                                                        </div>
                                                    );
                                                }

                                                // Paragraphs with bold support
                                                return (
                                                    <p key={i} dangerouslySetInnerHTML={{
                                                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                    }} />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                                <div className={`text-[10px] font-bold text-slate-300 mt-1 ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                                    {msg.time}
                                    {msg.sender === 'me' && <span className="material-symbols-outlined text-[10px] ml-1 align-middle">done_all</span>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="flex items-end gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm shrink-0 border border-white">🥦</div>
                            <div className="bg-white px-4 py-3 rounded-3xl rounded-bl-none shadow-sm border border-slate-100 flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                            <span className="text-xs text-slate-400 font-bold italic">Food Buddy is thinking...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef}></div>
            </div>

            {/* Quick Replies */}
            {!input && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto justify-center">
                    {quickReplies.map((reply, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(reply)}
                            className="bg-white border-2 border-primary/20 hover:border-primary text-primary font-bold text-xs md:text-sm px-4 py-2 rounded-full whitespace-nowrap shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            {reply}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="max-w-4xl mx-auto relative flex gap-3">
                    <button type="button" className="w-12 h-12 flex items-center justify-center bg-orange-50 text-orange-400 rounded-full hover:bg-orange-100 transition-colors">
                        <span className="material-symbols-outlined">mic</span>
                    </button>
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-2xl">sentiment_satisfied</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type to Food Buddy..."
                            className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-full focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] font-bold text-slate-300 uppercase flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">shield</span>
                        I'm a robot buddy. Always ask a grown-up before trying new recipes or snacks!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FoodBuddyChatInterface;
