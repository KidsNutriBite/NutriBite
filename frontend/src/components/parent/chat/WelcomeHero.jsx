import React from 'react';
import { motion } from 'framer-motion';

const WelcomeHero = ({ handleSuggestionClick }) => {
    const heroSuggestions = [
        { icon: "🍎", text: "Healthy Snacks" },
        { icon: "📈", text: "Growth Support" },
        { icon: "📅", text: "Meal Planning" },
        { icon: "🤒", text: "Fever Nutrition" },
        { icon: "💧", text: "Hydration" },
        { icon: "🛡️", text: "Immunity Support" }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 w-full"
        >
            <div className="w-20 h-20 mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 relative">
                <span className="material-symbols-outlined text-4xl">smart_toy</span>
                <div className="absolute -bottom-2 -right-2 bg-emerald-400 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-slate-900"></div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white text-center mb-3">
                Your Pediatric Nutrition AI Assistant
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-10 text-sm md:text-base leading-relaxed">
                Personalized, evidence-based nutrition guidance for your child. Ask me anything about diet, growth, and wellness!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {heroSuggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{suggestion.text}</span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default WelcomeHero;
