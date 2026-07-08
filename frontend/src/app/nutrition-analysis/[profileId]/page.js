'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNutritionAnalysis } from '@/api/nutrition.api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const getNutrientIconName = (nutrient) => {
    switch (nutrient?.toLowerCase()) {
        case 'iron': return 'opacity';
        case 'protein': return 'fitness_center';
        case 'calories': return 'bolt';
        case 'carbs': return 'bakery_dining';
        case 'fats': return 'spa';
        case 'vitamind': return 'wb_sunny';
        case 'calcium': return 'shield';
        case 'fiber': return 'eco';
        case 'water': return 'water_drop';
        default: return 'nutrition';
    }
};

const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
            return {
                bg: 'bg-rose-50 dark:bg-rose-950/20',
                border: 'border-rose-200 dark:border-rose-800/40',
                text: 'text-rose-700 dark:text-rose-400',
                badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
                icon: 'error'
            };
        case 'high':
            return {
                bg: 'bg-red-50 dark:bg-red-950/20',
                border: 'border-red-200 dark:border-red-800/40',
                text: 'text-red-700 dark:text-red-400',
                badgeBg: 'bg-red-100 dark:bg-red-900/40',
                icon: 'warning'
            };
        case 'moderate':
            return {
                bg: 'bg-amber-50 dark:bg-amber-950/20',
                border: 'border-amber-200 dark:border-amber-800/40',
                text: 'text-amber-700 dark:text-amber-400',
                badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
                icon: 'warning'
            };
        case 'mild':
            return {
                bg: 'bg-yellow-50 dark:bg-yellow-950/10',
                border: 'border-yellow-200 dark:border-yellow-800/30',
                text: 'text-yellow-700 dark:text-yellow-400',
                badgeBg: 'bg-yellow-100 dark:bg-yellow-900/20',
                icon: 'info'
            };
        default:
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                border: 'border-emerald-200 dark:border-emerald-800/40',
                text: 'text-emerald-700 dark:text-emerald-400',
                badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
                icon: 'check_circle'
            };
    }
};

const GroceryCard = ({ item, isInCart, onCartToggle }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{item.food}</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {item.nutrients.map((n, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs leading-none">{getNutrientIconName(n)}</span>
                                {n}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-lg leading-none">{getNutrientIconName(item.nutrients[0])}</span>
                </div>
            </div>
            
            <div className="mt-auto pt-3">
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {item.explanations[0]}
                </p>
                
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="flex-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors uppercase tracking-wider justify-center py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                        <span>{expanded ? 'Hide Details' : 'Why Buy'}</span>
                    </button>
                    
                    <button
                        onClick={onCartToggle}
                        className={`flex-1 text-[10px] font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all uppercase tracking-wider ${
                            isInCart 
                            ? 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm leading-none">{isInCart ? 'remove_shopping_cart' : 'shopping_cart'}</span>
                        <span>{isInCart ? 'Remove' : 'Add to Cart'}</span>
                    </button>
                </div>
                
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Adding <strong className="text-slate-700 dark:text-slate-200">{item.food}</strong> directly supports target absorption guidelines for {item.nutrients.join(' & ')}. Highly bioavailable source tailored to recent logs.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default function NutritionAnalysisPage() {
    const { profileId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [sunlight, setSunlight] = useState(15);
    const [cart, setCart] = useState([]);

    // Phase 2 Meal Planner local states
    const [swappedMeals, setSwappedMeals] = useState({});
    const [expandedMeal, setExpandedMeal] = useState(null);

    const toggleCart = (item) => {
        setCart(prev => {
            const exists = prev.find(c => c.food === item.food);
            if (exists) {
                return prev.filter(c => c.food !== item.food);
            } else {
                return [...prev, item];
            }
        });
    };

    const downloadCart = () => {
        if (cart.length === 0) {
            toast.error("Your cart is empty!");
            return;
        }
        const titleStr = `NUTRITION INSIGHTS - GROCERY CART LIST\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;
        const content = titleStr + cart.map((item, idx) => `${idx + 1}. ${item.food}\n   Target nutrients: ${item.nutrients.join(', ')}\n   Details: ${item.explanations[0]}`).join('\n\n');
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutrikids-grocery-cart-${profileId}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Grocery list downloaded successfully!");
    };

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

    const handleRefreshMealPlan = () => {
        fetchAnalysis();
        setSwappedMeals({});
        toast.success("Meal plan refreshed and updated!");
    };

    const toggleSwapMeal = (slot) => {
        setSwappedMeals(prev => ({
            ...prev,
            [slot]: !prev[slot]
        }));
        toast.success(`Swapped ingredients for ${slot}!`, { duration: 1500 });
    };

    if (loading && !analysis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-semibold text-slate-400">Analyzing pediatric parameters...</p>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20';
        if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/20';
        return 'bg-rose-50 dark:bg-rose-950/20';
    };

    const overallScore = analysis?.score?.value ?? analysis?.overallScore ?? 50;
    const scoreStatus = analysis?.score?.status ?? analysis?.scoreStatus ?? 'Needs Improvement';
    const subScores = analysis?.subScores ?? {
        nutrition: analysis?.nutritionScore ?? 50,
        deficiency: analysis?.deficiencyScore ?? 50,
        growthRisk: analysis?.growthRiskScore ?? 50,
        hydration: analysis?.hydrationScore ?? 50,
        mealQuality: analysis?.mealQualityScore ?? 50
    };

    const gapsList = analysis?.gaps ? Object.values(analysis.gaps) : [];
    const recommendations = analysis?.recommendations || [];
    const priorityActions = analysis?.priorityActions || [];
    const groceryItems = analysis?.groceryList || [];
    const mealPlan = analysis?.mealPlan || null;
    const mealPlanSummary = analysis?.mealPlanSummary || null;

    const mealSlots = [
        { key: 'breakfast', label: 'Breakfast', time: '8:00 AM', icon: 'brightness_low' },
        { key: 'morningSnack', label: 'Morning Snack', time: '11:00 AM', icon: 'cookie' },
        { key: 'lunch', label: 'Lunch', time: '1:30 PM', icon: 'wb_sunny' },
        { key: 'eveningSnack', label: 'Evening Snack', time: '5:00 PM', icon: 'local_cafe' },
        { key: 'dinner', label: 'Dinner', time: '8:00 PM', icon: 'bedtime' },
        { key: 'bedtime', label: 'Bedtime Snack', time: '9:30 PM', icon: 'nights_stay' }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Back Button */}
                <div className="flex justify-start">
                    <button 
                        onClick={() => router.back()}
                        className="group flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-md hover:shadow-lg cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                        <span>Back to Child Details</span>
                    </button>
                </div>

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-100 dark:border-slate-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                            Nutrition <span className="text-indigo-600 dark:text-indigo-400">Intelligence Engine</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Clinical Health Insights for <span className="text-slate-800 dark:text-slate-200 font-bold">{analysis?.childName || 'Child'}</span> using ICMR RDA and WHO Growth metrics.
                        </p>
                    </div>
                    
                    {/* Sunlight Input (Pediatric D3 Booster) */}
                    <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 max-w-sm">
                        <span className="material-symbols-outlined text-amber-500 text-xl leading-none">wb_sunny</span>
                        <div className="flex flex-col shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sunlight</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sunlight} mins</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="60" 
                            value={sunlight} 
                            onChange={(e) => setSunlight(e.target.value)}
                            className="w-24 h-1 bg-indigo-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {analysis && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Summary row */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                
                                {/* 1. Overall Score Ring Card */}
                                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className={`w-28 h-28 rounded-full ${getScoreBg(overallScore)} flex items-center justify-center mb-4 relative`}>
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="56"
                                                cy="56"
                                                r="50"
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                fill="transparent"
                                                className="text-slate-100 dark:text-slate-800"
                                            />
                                            <circle
                                                cx="56"
                                                cy="56"
                                                r="50"
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                fill="transparent"
                                                strokeDasharray={314}
                                                strokeDashoffset={314 - (314 * overallScore) / 100}
                                                className={`${getScoreColor(overallScore)} transition-all duration-1000 ease-out`}
                                            />
                                        </svg>
                                        <span className={`absolute text-3xl font-black ${getScoreColor(overallScore)}`}>
                                            {overallScore}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{scoreStatus}</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Wellness Health Index</p>
                                </div>

                                {/* 2. Key Priority Actions Card */}
                                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-4 flex items-center gap-1.5 select-none">
                                            <span className="material-symbols-outlined text-base">offline_bolt</span>
                                            Top Priority Actions
                                        </h2>
                                        <div className="space-y-3">
                                            {priorityActions.length > 0 ? (
                                                priorityActions.map((act) => {
                                                    const styles = getSeverityStyles(act.severity);
                                                    return (
                                                        <div key={act.id} className="flex items-start gap-3">
                                                            <span className={`material-symbols-outlined text-lg leading-none shrink-0 ${styles.text}`}>
                                                                {styles.icon}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{act.message}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-500 py-2">
                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                    <p className="text-xs font-bold">No priority deficiencies detected. Maintain active logs!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Dashboard Sub-scores list */}
                                <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                                    <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 select-none">Wellness Diagnostics</h2>
                                    <div className="space-y-3.5">
                                        {[
                                            { label: 'Nutrition Score', value: subScores.nutrition },
                                            { label: 'Deficiency Safety', value: subScores.deficiency },
                                            { label: 'Growth Stature Index', value: subScores.growthRisk },
                                            { label: 'Hydration Rating', value: subScores.hydration },
                                            { label: 'Meal Quality', value: subScores.mealQuality }
                                        ].map((score, sIdx) => (
                                            <div key={sIdx} className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                                    <span>{score.label}</span>
                                                    <span>{score.value}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${score.value}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Detected Gaps Checklist (12-Nutrient RDA breakdown) */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5 select-none">
                                        <span className="material-symbols-outlined text-slate-500">analytics</span>
                                        Smart Gap Analysis
                                    </h2>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dynamic RDA Guidelines (ICMR target vs average daily intake)</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {gapsList.map((gap) => {
                                        const styles = getSeverityStyles(gap.severity);
                                        const pct = gap.metPercent;
                                        return (
                                            <div key={gap.nutrient} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between h-full">
                                                <div className="flex justify-between items-start gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-slate-400 text-lg leading-none">{getNutrientIconName(gap.nutrient)}</span>
                                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{gap.label}</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 ${styles.bg} ${styles.text}`}>
                                                        <span className="material-symbols-outlined text-[10px] leading-none shrink-0">{styles.icon}</span>
                                                        {gap.severity}
                                                    </span>
                                                </div>

                                                <div className="my-4 space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                        <span>Progress</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${
                                                            pct < 40 ? 'bg-rose-500' : (pct < 60 ? 'bg-red-500' : (pct < 75 ? 'bg-orange-500' : (pct < 90 ? 'bg-yellow-500' : 'bg-emerald-500')))
                                                        }`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    <span>In: {gap.consumed}{gap.unit}</span>
                                                    <span>Target: {gap.target}{gap.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Medical Explainable Recommendations Section */}
                            <div className="space-y-6">
                                <div className="mb-2">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5 select-none">
                                        <span className="material-symbols-outlined text-slate-500">medical_services</span>
                                        Personalized Recommendations
                                    </h2>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Medically reasoned food interventions linked to child profile parameters</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recommendations.length > 0 ? (
                                        recommendations.map((rec, rIdx) => {
                                            const styles = getSeverityStyles(rec.severity);
                                            return (
                                                <div key={rIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                                    <div>
                                                        {/* Header: Nutrient, Severity & Priority */}
                                                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-indigo-500 text-xl leading-none">{getNutrientIconName(rec.nutrient)}</span>
                                                                <span className="text-sm font-black text-slate-800 dark:text-slate-155 uppercase tracking-tight">{rec.label} Deficiency</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                                                                    {rec.severity}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`}>
                                                                    Priority {rec.priority}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Core Food Recommendation & Pairing */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Recommended Food</h4>
                                                                <p className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 leading-none">
                                                                    {rec.recommendedFood}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Scientific Rationale</h4>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-1">
                                                                    {rec.whyThisFood}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                                                    <strong>Absorption synergy:</strong> {rec.pairing}
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
                                                                <div>
                                                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Serving Size</h4>
                                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">{rec.servingSuggestion}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Frequency</h4>
                                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">{rec.suggestedFrequency}</p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifestyle Advice</h4>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                                    {rec.lifestyleAdvice}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Evidence & Confidence Footer */}
                                                    <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm leading-none text-slate-400">library_books</span>
                                                            <span>{rec.evidenceSource}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${rec.confidenceLevel === 'High' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                                                                {rec.confidenceLevel} Confidence
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="md:col-span-2 text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <span className="material-symbols-outlined text-emerald-500 text-4xl mb-2">check_circle</span>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Child meets all daily daily RDA targets. No action needed.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Phase 2: Personalized Daily Meal Planner Section */}
                            {mealPlan && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5 select-none">
                                                <span className="material-symbols-outlined text-slate-500">restaurant_menu</span>
                                                Intelligent Daily Meal Planner
                                            </h2>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                                Chronological Indian diet balancing target pediatric deficits
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleRefreshMealPlan}
                                            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">refresh</span>
                                            <span>Refresh Plan</span>
                                        </button>
                                    </div>

                                    {/* Daily plan slots */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {mealSlots.map((slot) => {
                                            const meal = mealPlan[slot.key];
                                            if (!meal) return null;

                                            const isExpanded = expandedMeal === slot.key;
                                            const isSwapped = !!swappedMeals[slot.key];

                                            return (
                                                <div 
                                                    key={slot.key}
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md"
                                                >
                                                    <div>
                                                        {/* Slot header */}
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-slate-400 text-base leading-none">{slot.icon}</span>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                    {slot.label} • {slot.time}
                                                                </span>
                                                            </div>
                                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                                {meal.regionalTag}
                                                            </span>
                                                        </div>

                                                        {/* Meal Title & Swap Indicators */}
                                                        <div className="mb-4">
                                                            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight mb-2">
                                                                {isSwapped ? (meal.substitutions?.[0]?.alternative || meal.name) : meal.name}
                                                            </h3>
                                                            
                                                            {isSwapped && meal.substitutions?.length > 0 && (
                                                                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-200/30 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs leading-none">swap_horiz</span>
                                                                    <span>Using: {meal.substitutions.map(s => s.alternative).join(' & ')} instead</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Targeted nutrients */}
                                                        <div className="flex flex-wrap gap-1 mb-4">
                                                            {meal.nutrientsImproved.map((n, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                                                    <span className="material-symbols-outlined text-[10px] leading-none">{getNutrientIconName(n)}</span>
                                                                    {n}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Small nutrition estimates */}
                                                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 grid grid-cols-3 gap-2 text-center mb-4">
                                                            <div>
                                                                <p className="text-[8px] font-black uppercase text-slate-400">Calories</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{meal.estimatedNutrients.calories} kcal</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black uppercase text-slate-400">Protein</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{meal.estimatedNutrients.protein}g</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black uppercase text-slate-400">Fiber</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{meal.estimatedNutrients.fiber}g</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => setExpandedMeal(isExpanded ? null : slot.key)}
                                                                className="flex-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-all uppercase tracking-wider justify-center py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-sm leading-none">
                                                                    {isExpanded ? 'expand_less' : 'description'}
                                                                </span>
                                                                <span>{isExpanded ? 'Hide Details' : 'View Info'}</span>
                                                            </button>

                                                            {meal.substitutions?.length > 0 && (
                                                                <button 
                                                                    onClick={() => toggleSwapMeal(slot.key)}
                                                                    className="flex-1 text-[10px] font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all uppercase tracking-wider border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm leading-none">swap_horiz</span>
                                                                    <span>{isSwapped ? 'Revert Swap' : 'Swap Food'}</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Expanded details */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4"
                                                                >
                                                                    {/* Description */}
                                                                    <div>
                                                                        <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Clinical Rationale</h4>
                                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                                            {meal.whyThisMeal}
                                                                        </p>
                                                                    </div>

                                                                    {/* Pairing */}
                                                                    <div>
                                                                        <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Synergy Food Pairing</h4>
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                                                                            <strong>{meal.pairing}</strong>: {meal.pairExplanation}
                                                                        </p>
                                                                    </div>

                                                                    {/* Serving suggestion */}
                                                                    <div>
                                                                        <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Portion Guideline</h4>
                                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                                            {meal.servingSuggestion}
                                                                        </p>
                                                                    </div>

                                                                    {/* Substitutions available */}
                                                                    {meal.substitutions?.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">Substitutions Available</h4>
                                                                            <div className="space-y-1.5">
                                                                                {meal.substitutions.map((sub, sIdx) => (
                                                                                    <div key={sIdx} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg text-[10px]">
                                                                                        <p className="font-bold text-slate-700 dark:text-slate-300">
                                                                                            Swap "{sub.ingredient}" for "{sub.alternative}"
                                                                                        </p>
                                                                                        <p className="text-slate-400 font-medium leading-normal mt-0.5">{sub.rationale}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Total Plan Nutrient Summation Card */}
                                    {mealPlanSummary && (
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-indigo-500">done_all</span>
                                                    Planned Meal Plan Nutritional Value
                                                </h3>
                                                <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">
                                                    Sum of the 6 recommended diagnostic meal choices compared against dynamic daily RDA guidelines.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-center">
                                                {[
                                                    { label: 'Calories', val: `${mealPlanSummary.calories} kcal` },
                                                    { label: 'Protein', val: `${mealPlanSummary.protein}g` },
                                                    { label: 'Carbs', val: `${mealPlanSummary.carbs}g` },
                                                    { label: 'Fats', val: `${mealPlanSummary.fats}g` },
                                                    { label: 'Fiber', val: `${mealPlanSummary.fiber}g` }
                                                ].map((sum, sumIdx) => (
                                                    <div key={sumIdx} className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-900 min-w-[90px]">
                                                        <p className="text-[8px] font-black uppercase text-slate-450 tracking-wider mb-0.5">{sum.label}</p>
                                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{sum.val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Smart Grocery List Card */}
                            <div className="bg-slate-900 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-white space-y-6">
                                <div>
                                    <h2 className="text-xl font-black mb-1 flex items-center gap-1.5 select-none text-white">
                                        <span className="material-symbols-outlined text-slate-400">shopping_basket</span>
                                        Smart Grocery Recommendations
                                    </h2>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Specific items to address nutritional deficiencies</p>
                                </div>

                                {groceryItems.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groceryItems.map((item, idx) => (
                                            <GroceryCard 
                                                key={idx} 
                                                item={item} 
                                                isInCart={cart.some(c => c.food === item.food)}
                                                onCartToggle={() => toggleCart(item)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-850/40 rounded-xl border border-slate-800">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Diet checks look complete. No specific items required.</p>
                                    </div>
                                )}
                            </div>

                            {/* Shopping Cart Container */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-805">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-500 text-2xl">shopping_cart</span>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none mb-1">Shopping Cart</h2>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{cart.length} items to purchase</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {cart.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => setCart([])}
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-355 font-bold rounded-lg text-xs border border-slate-200 dark:border-slate-750 uppercase tracking-wider"
                                                >
                                                    Clear
                                                </button>
                                                <button 
                                                    onClick={downloadCart}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                    Download (.txt)
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {cart.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight mb-1">{item.food}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.nutrients.map((n, i) => (
                                                            <span key={i} className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleCart(item)}
                                                    className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <span className="material-symbols-outlined text-sm leading-none">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-955/20 rounded-xl border border-slate-100 dark:border-slate-900">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your cart is empty. Select items from the grocery list above.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
