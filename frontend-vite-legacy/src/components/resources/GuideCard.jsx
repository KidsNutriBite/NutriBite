import React from 'react';

const GuideCard = ({ title, description, tags, isSaved, onToggleSave, onClick }) => {
    return (
        <div onClick={onClick} className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 dark:border-slate-800 relative flex flex-col h-full cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">menu_book</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    <span className={`material-symbols-outlined ${isSaved ? 'fill-current' : ''}`}>favorite</span>
                </button>
            </div>

            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2 line-clamp-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, index) => (
                    <span key={index} className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                        {tag}
                    </span>
                ))}
            </div>

            <button className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 group-hover:shadow-md">
                Read Guide
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
        </div>
    );
};

export default GuideCard;
