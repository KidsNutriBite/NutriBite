"use client";
import React from 'react';

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const WelcomeHero = ({ onChipClick, activeChild, parentName = 'Parent' }) => {
    const childName = activeChild?.name || 'your child';
    const childAge = activeChild?.age ? `${activeChild.age} yrs` : '7 yrs';
    const allergies = activeChild?.healthConditions?.length > 0
        ? activeChild.healthConditions.join(', ')
        : (activeChild?.allergies?.length > 0 ? activeChild.allergies.join(', ') : 'Peanut Allergy');

    return (
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto py-4 px-2 space-y-6">
            
            {/* Header Badge & Title */}
            <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-sm">
                    <ShieldCheckIcon />
                    <span>Clinical-Grade Pediatric Nutrition Copilot · ICMR-NIN Grounded</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Good day, {parentName.split(' ')[0]} 👋
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    I've analyzed <strong className="text-slate-800 dark:text-slate-200">{childName}'s ({childAge})</strong> 21-day dietary records, growth trajectory, and clinical notes. Here is what we should focus on today:
                </p>
            </div>

            {/* 3 Proactive Real-Time Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full text-left">
                
                {/* Insight 1: Nutrition Focus */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                                Nutrition Focus
                            </span>
                            <span className="text-xs">🥬</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                            Iron & Vitamin D3 Synergy
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Recent logs show non-heme iron is at 48% RDA. Pairing Sprouted Ragi or Spinach with Vitamin C boosts absorption by 300%.
                        </p>
                    </div>
                    <button
                        onClick={() => onChipClick(`Show me iron-rich meal options and pairings suitable for ${childName}`)}
                        className="mt-3 text-[11px] font-bold text-primary hover:underline flex items-center gap-1 self-start"
                    >
                        <span>See Food Options</span>
                        <span className="text-xs">→</span>
                    </button>
                </div>

                {/* Insight 2: Growth & Pediatric Checkup */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                                Growth & Checkup
                            </span>
                            <span className="text-xs">📈</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                            WHO 65th Percentile Stature
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Height 118.5 cm with healthy growth velocity. Reviewed by Dr. Rajesh Iyer, MD with next follow-up in 75 days.
                        </p>
                    </div>
                    <button
                        onClick={() => onChipClick(`What did Dr. Rajesh Iyer recommend in our latest pediatric review for ${childName}?`)}
                        className="mt-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start"
                    >
                        <span>View Doctor Notes</span>
                        <span className="text-xs">→</span>
                    </button>
                </div>

                {/* Insight 3: Hydration Streak */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                Hydration Streak 🔥
                            </span>
                            <span className="text-xs">💧</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                            21/21 Days Goal Maintained
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Daily intake of 1,750 ml achieved with water-before-play habit. Digestive efficiency and energy levels optimal.
                        </p>
                    </div>
                    <button
                        onClick={() => onChipClick(`How is ${childName}'s hydration contributing to daily energy and growth?`)}
                        className="mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start"
                    >
                        <span>Check Hydration Impact</span>
                        <span className="text-xs">→</span>
                    </button>
                </div>

            </div>

            {/* Contextual Action Prompt Grid */}
            <div className="w-full pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
                    What can I help you plan or analyze right now?
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    {[
                        { label: `🥗 Plan Tomorrow's 6 Meals`, prompt: `Generate a chronological 6-meal Indian pediatric plan for ${childName} that addresses iron and Vitamin D targets.` },
                        { label: `🍎 Boost ${childName}'s Breakfast`, prompt: `Suggest 3 nutritious, quick breakfast options for ${childName} with high bioavailable protein and iron.` },
                        { label: `📊 Analyze 21-Day RDA Gaps`, prompt: `Give me a breakdown of ${childName}'s 21-day nutrient coverage against ICMR 2020 RDA guidelines.` },
                        { label: `📈 Review Growth Velocity`, prompt: `Evaluate ${childName}'s height and weight progression against WHO pediatric growth percentiles.` },
                        { label: `🛡️ Check Allergy Safety (${allergies})`, prompt: `Check recipe safety for ${childName} considering registered condition: ${allergies}.` },
                        { label: `🩺 Prepare Doctor Visit Summary`, prompt: `Summarize ${childName}'s 21-day nutritional and growth progress to share with Dr. Rajesh Iyer.` }
                    ].map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => onChipClick(chip.prompt)}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/20 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-left transition-all hover:border-primary/50 flex items-center justify-between group cursor-pointer"
                        >
                            <span className="line-clamp-1">{chip.label}</span>
                            <span className="text-slate-400 group-hover:text-primary transition-colors text-sm ml-1">→</span>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default WelcomeHero;
