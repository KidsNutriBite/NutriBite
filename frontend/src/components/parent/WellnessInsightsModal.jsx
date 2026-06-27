"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const WellnessInsightsModal = ({ profile, onClose }) => {
    const router = useRouter();
    const analysis = profile?.wellnessAnalysis || { score: 100, concerns: [], monitor: [], strengths: [], recommendations: [] };

    // Circular progress math
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

    const handleRedirect = () => {
        if (onClose) {
            onClose('/pricing');
        } else {
            router.push('/pricing');
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-xl flex justify-center items-center p-4 md:p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 w-[90vw] h-[90vh] md:w-[85vw] md:h-[85vh] max-w-[90vw] max-h-[90vh] md:max-w-[85vw] md:max-h-[85vh] flex flex-col relative overflow-hidden"
            >
                {/* Visual blob decorations for modern design */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-red-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                {/* Sticky Header */}
                <div className="shrink-0 p-6 md:p-8 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                    <button
                        onClick={() => {
                            if (onClose) onClose();
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="space-y-2 text-center md:text-left">
                        <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest rounded-full">
                            Diagnostic Intelligence
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                            Child Wellness Analysis
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold max-w-lg">
                            Based on the information provided, here are the key health insights for <span className="text-primary font-black">{profile.name}</span>.
                        </p>
                        
                        {/* Navigation Buttons Row */}
                        <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                            <button
                                onClick={() => {
                                    if (onClose) {
                                        onClose('/parent/dashboard');
                                    } else {
                                        router.push('/parent/dashboard');
                                    }
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700 cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Back to Home
                            </button>
                            <button
                                onClick={() => {
                                    if (onClose) {
                                        onClose(`/parent/child/${profile._id}`);
                                    } else {
                                        router.push(`/parent/child/${profile._id}`);
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-655 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Go to Child Profile
                            </button>
                        </div>
                    </div>

                    {/* Animated Score Ring */}
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                stroke="rgba(226, 232, 240, 0.5)"
                                strokeWidth="10"
                                fill="transparent"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r={radius}
                                stroke="url(#scoreGradient)"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-800 dark:text-white">{analysis.score}</span>
                            <span className="text-[10px] text-gray-400 font-black uppercase">Wellness Index</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    {/* Score Alert Message */}
                    <div className="text-center bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50">
                        <p className="text-indigo-950 dark:text-indigo-200 text-sm font-semibold leading-relaxed">
                            We detected <strong className="text-red-600 dark:text-red-400 font-black">{analysis.concerns.length} key areas requiring attention</strong>. 
                            We recommend addressing these lifestyle and diet markers early to maximize growth potential.
                        </p>
                    </div>

                    {/* Main insights sections */}
                    <div className="space-y-6">
                        {/* 1. RED SECTION: Areas Requiring Attention */}
                        {analysis.concerns && analysis.concerns.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <span>⚠️</span> Areas Requiring Attention
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.concerns.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-red-50/40 dark:bg-red-950/10 border border-red-100 dark:border-red-900/50 rounded-2xl p-5 flex flex-col justify-between"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-extrabold text-red-950 dark:text-red-200 text-sm">{item.issue}</h4>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40'}`}>
                                                        {item.priority} Priority
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                                                    <strong className="text-red-800/80 dark:text-red-300 font-bold uppercase text-[9px] block">Why it matters</strong>
                                                    {item.whyItMatters}
                                                </p>
                                                <p className="text-xs text-red-900 dark:text-red-300/80 leading-relaxed font-medium pt-1.5 border-t border-red-100 dark:border-red-900/20">
                                                    <strong className="text-red-800/80 dark:text-red-300 font-bold uppercase text-[9px] block">Potential health impact</strong>
                                                    {item.healthImpact}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. YELLOW SECTION: Monitor Closely */}
                        {analysis.monitor && analysis.monitor.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                    <span>🔍</span> Monitor Closely
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.monitor.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-5"
                                        >
                                            <h4 className="font-extrabold text-amber-950 dark:text-amber-200 text-sm mb-1">{item.issue}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold mb-2">
                                                <strong className="text-amber-800/80 dark:text-amber-300 font-bold uppercase text-[9px] block">Why it matters</strong>
                                                {item.whyItMatters}
                                            </p>
                                            {item.healthImpact && (
                                                <p className="text-xs text-amber-900/80 dark:text-amber-400 leading-relaxed font-medium pt-1.5 border-t border-amber-100 dark:border-amber-900/20">
                                                    <strong className="text-amber-800/80 dark:text-amber-300 font-bold uppercase text-[9px] block">Details</strong>
                                                    {item.healthImpact}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. GREEN SECTION: Child Strengths */}
                        {analysis.strengths && analysis.strengths.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <span>✨</span> Child Strengths
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.strengths.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-green-50/40 dark:bg-green-950/10 border border-green-100 dark:border-green-900/50 rounded-2xl p-5"
                                        >
                                            <h4 className="font-extrabold text-green-950 dark:text-green-200 text-sm mb-1">{item.strength}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold mb-2">
                                                <strong className="text-green-800/80 dark:text-green-300 font-bold uppercase text-[9px] block">Benefit</strong>
                                                {item.benefit}
                                            </p>
                                            <p className="text-xs text-green-900 dark:text-green-400 leading-relaxed font-bold pt-1.5 border-t border-green-100 dark:border-green-900/20">
                                                <strong className="text-green-800/80 dark:text-green-300 font-bold uppercase text-[9px] block">Recommendation</strong>
                                                {item.recommendation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NutriKids ROADMAP */}
                    <div className="space-y-4 pt-4 border-t border-gray-150 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🚀</span> How NutriKids Can Help
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {analysis.recommendations && analysis.recommendations.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl">{rec.icon}</span>
                                            <span className="text-[9px] bg-white dark:bg-slate-900 text-gray-450 dark:text-gray-400 font-black uppercase px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Concern</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Concern</p>
                                            <p className="font-extrabold text-slate-800 dark:text-white text-sm">{rec.concern}</p>
                                        </div>
                                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2">
                                            <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">NutriKids Feature</p>
                                            <p className="font-extrabold text-indigo-950 dark:text-indigo-300 text-sm">{rec.solution}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 bg-indigo-50/50 dark:bg-indigo-900/10 px-3 py-1.5 rounded-xl border border-indigo-100/30">
                                        <p className="text-[10px] text-indigo-500 font-black uppercase">Expected Result</p>
                                        <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{rec.expectedImprovement}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PARENT CONVERSION SECTION */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-750 text-white rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl"></div>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black">Unlock Advanced Support</h3>
                                <p className="text-indigo-150 text-sm font-semibold max-w-md">
                                    Get access to specialized clinical collaboration, smart guides, and personalized menu structures to accelerate improvement.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {['AI Nutrition Assistant', 'Personalized Meal Plans', 'Growth Tracking', 'Food Buddy', 'Dietitian Support'].map((feat) => (
                                    <span key={feat} className="flex items-center gap-1.5 text-xs font-bold text-indigo-100">
                                        <span className="text-emerald-400">✓</span> {feat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleRedirect}
                            className="bg-white hover:bg-slate-50 text-indigo-700 font-black py-4 px-8 rounded-2xl shadow-lg hover:shadow-indigo-800/30 transition-all hover:scale-[1.03] active:scale-95 text-base shrink-0 border-2 border-white relative z-10 cursor-pointer"
                        >
                            View Plans
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WellnessInsightsModal;

