
import { useState } from 'react';
import { chatWithFoodBuddy } from '../../api/game.api';

const FoodBuddyChat = ({ profileId }) => {
    const [messages, setMessages] = useState([{ sender: 'bot', text: "Hey there, Hero! 🍎🥦 Have you eaten a crunchy carrot today?" }]);
    const [inputMsg, setInputMsg] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim()) return;

        const userText = inputMsg;
        setInputMsg('');
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setChatLoading(true);

        try {
            const res = await chatWithFoodBuddy(profileId, userText);
            const botResponse = res.data?.response || res.response || "Yum! That sounds properly delicious!";
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Oops, I fell asleep! Try again." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[2rem] shadow-2xl w-full flex flex-col border-4 border-primary/20 shrink-0 z-50 min-h-[280px]">
            {/* Bubble Tail - Properly positioned to not get clipped */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-white dark:border-t-slate-800 filter drop-shadow-sm"></div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-2 mb-3 custom-scrollbar min-h-[150px]">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm md:text-base font-bold shadow-sm ${msg.sender === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {chatLoading && <div className="text-slate-400 italic font-bold text-xs pl-2">Food Buddy is thinking... 💭</div>}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 relative z-50">
                <input
                    type="text"
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-primary/30 rounded-xl px-4 py-3 font-bold text-sm md:text-base focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Type here..."
                />
                <button
                    type="submit"
                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 shadow-md flex items-center justify-center aspect-square"
                    aria-label="Send Message"
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </form>
        </div>
    );
};

export default FoodBuddyChat;
