import React from 'react';

const ChatHeader = ({ onBack, selectedChild }) => {
    return (
        <header className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">NutriGuide AI</h2>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 shadow-sm">
                                <span className="material-symbols-outlined text-[10px]">health_and_safety</span> Safety Checked
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                            {selectedChild ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active Profile: {selectedChild.name} &bull; Age {selectedChild.age} &bull; {selectedChild.conditions?.length ? selectedChild.conditions.join(', ') : 'Healthy'}
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    General Pediatric Advice Mode
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
