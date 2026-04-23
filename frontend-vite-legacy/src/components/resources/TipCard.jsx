import React from 'react';

const TipCard = ({ title, preview, isSaved, onToggleSave, onClick }) => {
    return (
        <div onClick={onClick} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-lg transition-all flex items-start gap-4 cursor-pointer">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>

            <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-slate-900 dark:text-white font-bold text-lg">{title}</h4>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                        className={`text-slate-300 hover:text-red-500 transition-colors ${isSaved ? 'text-red-500' : ''}`}
                    >
                        <span className={`material-symbols-outlined text-xl ${isSaved ? 'fill-current' : ''}`}>favorite</span>
                    </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">{preview}</p>
                <button className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    Read More
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default TipCard;
