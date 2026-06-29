'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNutritionAnalysis } from '@/api/nutrition.api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const getNutrientIcon = (nutrient) => {
    switch(nutrient?.toLowerCase()) {
        case 'iron': return '🩸';
        case 'protein': return '🥩';
        case 'calories': return '🔥';
        case 'carbs': return '🍞';
        case 'fats': return '🥑';
        case 'vitamind': return '☀️';
        default: return '✨';
    }
};

const GroceryCard = ({ item, isInCart, onCartToggle }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col h-full shadow-xl shadow-black/5 hover:bg-white/20 transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{item.food}</h3>
                    <div className="flex flex-wrap gap-2">
                        {item.nutrients.map((n, i) => (
                            <span key={i} className="px-3 py-1 bg-indigo-500/50 border border-indigo-300/30 rounded-full text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                {getNutrientIcon(n)} {n}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 rotate-3">
                    {getNutrientIcon(item.nutrients[0])}
                </div>
            </div>
            
            <div className="mt-auto pt-4">
                <p className="text-indigo-50 text-sm font-medium leading-relaxed bg-black/10 p-4 rounded-2xl border border-white/5">
                    {item.explanations[0]}
                </p>
                
                {item.explanations.length > 1 && (
                    <div className="mt-2 space-y-2">
                        {item.explanations.slice(1).map((exp, i) => (
                            <p key={i} className="text-indigo-50 text-sm font-medium leading-relaxed bg-black/10 p-4 rounded-2xl border border-white/5">
                                {exp}
                            </p>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="flex-1 text-xs font-bold text-white/70 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest justify-center py-3 rounded-xl bg-white/5 hover:bg-white/10"
                    >
                        {expanded ? 'Hide Details ↑' : 'Learn More ↓'}
                    </button>
                    
                    <button
                        onClick={onCartToggle}
                        className={`flex-1 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1 transition-all uppercase tracking-widest ${
                            isInCart 
                            ? 'bg-rose-500/80 hover:bg-rose-600 border border-rose-400/30 text-white' 
                            : 'bg-white text-indigo-700 hover:bg-indigo-50 font-black shadow-md'
                        }`}
                    >
                        <span>{isInCart ? '🗑️ Remove' : '🛒 Add to Cart'}</span>
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
                            <div className="pt-4 mt-2 border-t border-white/10">
                                <p className="text-xs text-indigo-100 leading-relaxed">
                                    Adding <strong className="text-white">{item.food}</strong> to your child's meals directly targets their low {item.nutrients.join(' and ')} levels. This recommendation is specifically tailored to bridge the nutritional gaps detected in their recent meal logs.
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

    let groceryItems = [];
    if (analysis && analysis.suggestions) {
        let explanationIndex = 0;
        analysis.suggestions.forEach(suggestion => {
            suggestion.suggestedFoods.forEach(food => {
                const explanation = analysis.explanations[explanationIndex] || `Great source of ${suggestion.nutrient}.`;
                explanationIndex++;
                
                const existing = groceryItems.find(item => item.food === food);
                if (existing) {
                    if (!existing.nutrients.includes(suggestion.nutrient)) {
                        existing.nutrients.push(suggestion.nutrient);
                        existing.explanations.push(explanation);
                    }
                } else {
                    groceryItems.push({
                        food,
                        nutrients: [suggestion.nutrient],
                        explanations: [explanation]
                    });
                }
            });
        });
    }

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

                            {/* 12-Nutrient Target Breakdown Card */}
                            <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        <span>📊</span> Detailed Daily Intake vs ICMR Targets
                                    </h2>
                                    <p className="text-slate-500 text-sm">Real-time comparison of average intake over 30 days against child's RDA guidelines.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { key: 'calories', label: 'Calories', unit: 'kcal' },
                                        { key: 'protein', label: 'Protein', unit: 'g' },
                                        { key: 'carbs', label: 'Carbohydrates', unit: 'g' },
                                        { key: 'fats', label: 'Fats', unit: 'g' },
                                        { key: 'fiber', label: 'Dietary Fiber', unit: 'g' },
                                        { key: 'iron', label: 'Iron', unit: 'mg' },
                                        { key: 'calcium', label: 'Calcium', unit: 'mg' },
                                        { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
                                        { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
                                        { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
                                        { key: 'zinc', label: 'Zinc', unit: 'mg' },
                                        { key: 'water', label: 'Water Intake', unit: 'ml' }
                                    ].map(n => {
                                        const consumed = Number((analysis.dailyAverages?.[n.key] || 0).toFixed(1));
                                        const target = Number((analysis.requiredDaily?.[n.key] || 1).toFixed(1));
                                        const pct = Math.min(100, Math.round((consumed / target) * 100));
                                        const progressColor = pct < 50 ? 'bg-rose-500' : (pct < 70 ? 'bg-orange-500' : (pct < 90 ? 'bg-amber-500' : 'bg-emerald-500'));
                                        const textClass = pct < 50 ? 'text-rose-600' : (pct < 70 ? 'text-orange-600' : (pct < 90 ? 'text-amber-600' : 'text-emerald-600'));
                                        
                                        return (
                                            <div key={n.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span>{n.label}</span>
                                                    <span className={textClass}>{pct}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                                    <span>Consumed: {consumed} {n.unit}</span>
                                                    <span>Target: {target} {n.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grocery List Card */}
                            <div className="md:col-span-3 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-2xl shadow-indigo-200 text-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black mb-2 italic">Smart Grocery List 🛒</h2>
                                        <p className="text-indigo-100 opacity-90 text-lg">Personalized, item-by-item recommendations addressing your child's specific nutritional gaps.</p>
                                    </div>
                                </div>

                                {groceryItems.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                                        <span className="text-5xl block mb-4">🌟</span>
                                        <h3 className="text-xl font-bold text-white mb-2">Diet Looks Great!</h3>
                                        <p className="text-indigo-200">No special grocery recommendations needed at this time.</p>
                                    </div>
                                )}
                            </div>

                            {/* Shopping Cart Container (Vibrant and Premium) */}
                            <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:bg-slate-900 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">🛒</span>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Your Shopping Cart</h2>
                                            <p className="text-slate-500 text-sm font-medium">{cart.length} {cart.length === 1 ? 'item' : 'items'} selected to buy</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {cart.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => setCart([])}
                                                    className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all text-sm border border-slate-200 dark:border-slate-700"
                                                >
                                                    Clear Cart
                                                </button>
                                                <button 
                                                    onClick={downloadCart}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm"
                                                >
                                                    <span>📥</span> Download List (.txt)
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {cart.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{item.food}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.nutrients.map((n, i) => (
                                                            <span key={i} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleCart(item)}
                                                    className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <span className="material-symbols-outlined text-lg leading-none">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-slate-400 font-semibold italic text-sm">Your cart is empty. Add items from the Smart Grocery List above!</p>
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
