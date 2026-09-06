"use client";
import React from 'react';

const SparkIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
    </svg>
);

const WelcomeHero = ({ onChipClick, activeChild, parentName = 'Parent' }) => {
    const childName = activeChild?.name ? activeChild.name.split(' ')[0] : 'your child';
    const childAge = activeChild?.age ? `${activeChild.age} years` : '7 years';
    const allergies = activeChild?.healthConditions?.length > 0
        ? activeChild.healthConditions.join(', ')
        : (activeChild?.allergies?.length > 0 ? activeChild.allergies.join(', ') : null);

    const promptPills = [
        {
            label: "Review this week's nutrition",
            prompt: `Review ${childName}'s recent 7-day meal history and provide a concise summary of macronutrient and micronutrient balance.`
        },
        {
            label: "Plan tomorrow's 6 meals",
            prompt: `Generate a chronological 6-meal Indian pediatric plan for ${childName} that addresses iron and Vitamin D targets.`
        },
        {
            label: "What nutrients may be missing?",
            prompt: `Based on ${childName}'s dietary logs, identify any potential dietary gaps compared against ICMR-NIN RDA benchmarks.`
        },
        {
            label: "Can my child eat this?",
            prompt: `Evaluate if a snack of roasted makhana and fruit yogurt is safe and nutritionally balanced for ${childName}.`
        },
        {
            label: "Analyze recent growth",
            prompt: `Evaluate ${childName}'s height and weight progression against WHO pediatric growth percentiles.`
        },
        {
            label: "Create a grocery checklist",
            prompt: `Generate a focused grocery shopping list to bridge ${childName}'s current nutrient gaps.`
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12 sm:py-20 px-4 space-y-8 animate-in fade-in duration-300">
            
            {/* Center Geometric Icon */}
            <div className="size-14 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                <SparkIcon />
            </div>

            {/* Editorial Title & Subtitle */}
            <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.04]">
                    <ShieldCheckIcon />
                    <span>ICMR-NIN & WHO Clinical Pediatric Framework</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    NutriGuide AI
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-md mx-auto">
                    Personalized nutrition guidance for your child.
                </p>

                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                    Meals · Nutrition · Growth · Food Safety
                </p>
            </div>

            {/* Compact Active Child Context Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                <span>Context active for <strong className="text-slate-900 dark:text-white font-medium">{childName}</strong> ({childAge})</span>
                {allergies && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 border-l border-slate-200 dark:border-slate-800 pl-2">
                        ⚠ {allergies}
                    </span>
                )}
            </div>

            {/* Quick Prompt Pills Grid */}
            <div className="w-full pt-2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                    {promptPills.map((pill, idx) => (
                        <button
                            key={idx}
                            onClick={() => onChipClick(pill.prompt)}
                            className="px-4 py-2.5 rounded-full bg-[#F4F4F4] hover:bg-[#EAEAEA] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-normal border border-black/[0.04] dark:border-white/[0.04] transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default WelcomeHero;
