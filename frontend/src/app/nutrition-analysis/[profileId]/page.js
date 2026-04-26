'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNutritionAnalysis } from '@/api/nutrition.api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function NutritionAnalysisPage() {
    const { profileId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [sunlight, setSunlight] = useState(15);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const data = await getNutritionAnalysis(profileId, sunlight);
            setAnalysis(data);
        } catch (error) {
            console.error('Error fetching nutrition analysis:', error);
            toast.error('Failed to load nutrition analysis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileId) {
            fetchAnalysis();
        }
    }, [profileId, sunlight]);

    if (loading && !analysis) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBg = (score) => {
        if (score >= 90) return 'bg-emerald-50';
        if (score >= 70) return 'bg-amber-50';
        return 'bg-rose-50';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
                >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Child Details
                </button>

                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Nutrition <span className="text-indigo-600">Insights</span> 🍎
                        </h1>
                        <p className="text-slate-500 text-lg">Rule-based nutritional health assessment for your child.</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Sunlight (mins):</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="60" 
                            value={sunlight} 
                            onChange={(e) => setSunlight(e.target.value)}
                            className="w-32 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="font-bold text-indigo-600 w-8">{sunlight}</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {analysis && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {/* Score Card */}
                            <div className="md:col-span-1 bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 flex flex-col items-center justify-center text-center">
                                <div className={`w-32 h-32 rounded-full ${getScoreBg(analysis.score)} flex items-center justify-center mb-6 relative`}>
                                    <svg className="w-full h-full -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-slate-100"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={364}
                                            strokeDashoffset={364 - (364 * analysis.score) / 100}
                                            className={`${getScoreColor(analysis.score)} transition-all duration-1000 ease-out`}
                                        />
                                    </svg>
                                    <span className={`absolute text-4xl font-black ${getScoreColor(analysis.score)}`}>
                                        {analysis.score}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{analysis.scoreStatus}</h3>
                                <p className="text-slate-500 text-sm">Overall Weekly Nutrition Health Score</p>
                            </div>

                            {/* Deficiencies & Suggestions */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        Detected Gaps <span className="text-rose-500">⚠️</span>
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        {analysis.deficiencies.length > 0 ? (
                                            analysis.deficiencies.map((def, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1 block">Low {def.nutrient}</span>
                                                            <p className="text-slate-700 font-medium">{def.message}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {analysis.suggestions.find(s => s.nutrient === def.nutrient)?.suggestedFoods.map((food, fidx) => (
                                                                <span key={fidx} className="px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded-full text-xs font-bold shadow-sm">
                                                                    {food}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <span className="text-5xl mb-4 block">🌟</span>
                                                <p className="text-emerald-600 font-bold">No deficiencies detected! Great job!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Risks Card */}
                                {analysis.risks.length > 0 && (
                                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200">
                                        <h3 className="text-amber-800 font-black text-sm uppercase tracking-widest mb-4">Long-term Risks 📈</h3>
                                        <ul className="space-y-2">
                                            {analysis.risks.map((risk, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-amber-900 font-semibold">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Grocery List Card */}
                            <div className="md:col-span-3 bg-indigo-600 p-8 rounded-3xl shadow-2xl shadow-indigo-200 text-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black mb-1 italic">Smart Grocery List 🛒</h2>
                                        <p className="text-indigo-100 opacity-80">Deterministic suggestions based on detected nutritional gaps.</p>
                                    </div>
                                    <button 
                                        onClick={() => window.print()}
                                        className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                                    >
                                        Print List
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {analysis.groceryList.map((item, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileHover={{ scale: 1.05 }}
                                            className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3"
                                        >
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                            <span className="font-bold tracking-tight">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-60">Why these items?</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.explanations.slice(0, 6).map((exp, idx) => (
                                            <p key={idx} className="text-sm text-indigo-100 flex items-start gap-2 italic">
                                                <span className="opacity-40">"</span> {exp} <span className="opacity-40">"</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
