'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNutritionAnalysis, suggestSlotMeal, saveDietPlan, getSavedDietPlan } from '@/api/nutrition.api';
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

export default function NutritionAnalysisPage() {
    const { profileId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [sunlight, setSunlight] = useState(15);
    const [cart, setCart] = useState([]);

    // Phase 2 Meal Planner local states
    const [planMode, setPlanMode] = useState('daily'); // 'daily' | 'weekly'
    const [selectedDay, setSelectedDay] = useState('monday');
    const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
    const [customDietPlan, setCustomDietPlan] = useState({});
    const [customWeeklyPlan, setCustomWeeklyPlan] = useState({});
    const [parentDietNotes, setParentDietNotes] = useState('');
    const [swappedMeals, setSwappedMeals] = useState({});
    const [expandedMeal, setExpandedMeal] = useState(null);
    const [activeAlternativeSlot, setActiveAlternativeSlot] = useState(null);
    const [isSuggestingSlot, setIsSuggestingSlot] = useState(null); // slotKey currently generating AI
    const [slotSuggestions, setSlotSuggestions] = useState({}); // { [slotKey]: suggestions[] }
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    // Phase 3 Grocery Planner local states
    const [grocerySearch, setGrocerySearch] = useState('');
    const [groceryCategory, setGroceryCategory] = useState('All');
    const [groceryDeficiencyFilter, setGroceryDeficiencyFilter] = useState('All');
    const [groceryActionStates, setGroceryActionStates] = useState({});
    const [showCompleted, setShowCompleted] = useState(false);

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
        const content = titleStr + cart.map((item, idx) => `${idx + 1}. ${item.food}\n   Target nutrients: ${item.nutrients.join(', ')}\n   Details: ${item.rationale || item.explanations?.[0]}`).join('\n\n');
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutrikids-grocery-cart-${profileId}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Grocery list downloaded successfully!");
    };

    const [refreshNonce, setRefreshNonce] = useState(0);

    const fetchAnalysis = async (nonce = refreshNonce, mode = planMode, theme = selectedThemeIndex, isRefreshed = false) => {
        try {
            setLoading(true);
            const rawId = Array.isArray(profileId) ? profileId[0] : profileId;
            const data = await getNutritionAnalysis(rawId, sunlight, nonce, mode, theme);
            setAnalysis(data);
            
            // If user explicitly clicked refresh or changed themes, apply the freshly generated plan
            if (isRefreshed || !data.savedPlan) {
                if (data.mealPlan) setCustomDietPlan(data.mealPlan);
                if (data.weeklyPlan) setCustomWeeklyPlan(data.weeklyPlan);
            } else {
                if (data.savedPlan?.dailyPlan && Object.keys(data.savedPlan.dailyPlan).length > 0) {
                    setCustomDietPlan(data.savedPlan.dailyPlan);
                } else if (data.mealPlan) {
                    setCustomDietPlan(data.mealPlan);
                }

                if (data.savedPlan?.weeklyPlan && Object.keys(data.savedPlan.weeklyPlan).length > 0) {
                    setCustomWeeklyPlan(data.savedPlan.weeklyPlan);
                } else if (data.weeklyPlan) {
                    setCustomWeeklyPlan(data.weeklyPlan);
                }
            }
            if (data.customDietNotes) {
                setParentDietNotes(data.customDietNotes);
            }
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
        const nextNonce = Date.now();
        setRefreshNonce(nextNonce);
        fetchAnalysis(nextNonce, planMode, selectedThemeIndex, true);
        setSwappedMeals({});
        setSlotSuggestions({});
        toast.success("Balanced Indian diet plan refreshed using clinical pediatric guidelines!", { icon: '🍛' });
    };

    const handleThemeChange = (themeIdx) => {
        setSelectedThemeIndex(themeIdx);
        fetchAnalysis(refreshNonce, planMode, themeIdx, true);
        toast.success(`Switched to: ${analysis?.planThemes?.[themeIdx]?.name || 'Diet Theme'}`);
    };

    const handleModeChange = (mode) => {
        setPlanMode(mode);
        fetchAnalysis(refreshNonce, mode, selectedThemeIndex);
    };

    const toggleSwapMeal = (slot) => {
        setSwappedMeals(prev => ({
            ...prev,
            [slot]: !prev[slot]
        }));
        toast.success(`Swapped ingredients for ${slot}!`, { duration: 1500 });
    };

    // Swap to a specific alternative dish
    const selectAlternativeDish = (slotKey, alternativeDish) => {
        if (planMode === 'daily') {
            setCustomDietPlan(prev => ({
                ...prev,
                [slotKey]: {
                    ...prev[slotKey],
                    name: alternativeDish.name,
                    regionalTag: alternativeDish.regionalTag || prev[slotKey]?.regionalTag,
                    estimatedNutrients: alternativeDish.estimatedNutrients || prev[slotKey]?.estimatedNutrients,
                    whyThisMeal: alternativeDish.whyThisMeal || prev[slotKey]?.whyThisMeal,
                    nutrientsImproved: alternativeDish.nutrientsImproved || prev[slotKey]?.nutrientsImproved,
                    isCustomAlternative: true
                }
            }));
        } else {
            setCustomWeeklyPlan(prev => {
                const dayObj = prev[selectedDay] || {};
                const slots = { ...(dayObj.slots || {}) };
                slots[slotKey] = {
                    ...slots[slotKey],
                    name: alternativeDish.name,
                    regionalTag: alternativeDish.regionalTag || slots[slotKey]?.regionalTag,
                    estimatedNutrients: alternativeDish.estimatedNutrients || slots[slotKey]?.estimatedNutrients,
                    whyThisMeal: alternativeDish.whyThisMeal || slots[slotKey]?.whyThisMeal,
                    nutrientsImproved: alternativeDish.nutrientsImproved || slots[slotKey]?.nutrientsImproved,
                    isCustomAlternative: true
                };
                return {
                    ...prev,
                    [selectedDay]: { ...dayObj, slots }
                };
            });
        }
        setActiveAlternativeSlot(null);
        toast.success(`Selected alternative: ${alternativeDish.name}`, { icon: '🔄' });
    };

    // Delete or clear a meal slot (leave blank)
    const deleteMealSlot = (slotKey) => {
        if (planMode === 'daily') {
            setCustomDietPlan(prev => {
                const updated = { ...prev };
                delete updated[slotKey];
                return updated;
            });
        } else {
            setCustomWeeklyPlan(prev => {
                const dayObj = prev[selectedDay] || {};
                const slots = { ...(dayObj.slots || {}) };
                delete slots[slotKey];
                return {
                    ...prev,
                    [selectedDay]: { ...dayObj, slots }
                };
            });
        }
        toast.success(`Cleared ${slotKey}. Click suggest to fill missing nutrient targets!`, { icon: '🗑️' });
    };

    // Generate clinical dish suggestions for a blank slot
    const handleSuggestBlankSlot = async (slotKey) => {
        try {
            setIsSuggestingSlot(slotKey);
            const rawId = Array.isArray(profileId) ? profileId[0] : profileId;
            const currentPlan = planMode === 'daily' ? customDietPlan : (customWeeklyPlan[selectedDay]?.slots || {});
            const res = await suggestSlotMeal(rawId, slotKey, currentPlan, parentDietNotes);
            if (res.suggestions && res.suggestions.length > 0) {
                setSlotSuggestions(prev => ({
                    ...prev,
                    [slotKey]: res.suggestions
                }));
                toast.success(`Generated ${res.suggestions.length} recommended Indian dishes!`, { icon: '✨' });
            } else {
                toast.error("Could not generate suggestions for this slot.");
            }
        } catch (err) {
            console.error("Error suggesting slot meal:", err);
            toast.error("Failed to generate slot suggestions.");
        } finally {
            setIsSuggestingSlot(null);
        }
    };

    // Add a suggested dish to the plan
    const addSuggestedDishToSlot = (slotKey, dish) => {
        const newMeal = {
            name: dish.name,
            regionalTag: dish.regionalTag || 'Indian Focus',
            foods: dish.ingredients || [],
            prepTime: dish.prepTime || '15 mins',
            difficulty: dish.difficulty || 'Easy',
            estimatedNutrients: dish.estimatedNutrients || { calories: 250, protein: 8, carbs: 35, fats: 5, fiber: 4 },
            nutrientsImproved: dish.nutrientsImproved || ['Protein', 'Micronutrients'],
            whyThisMeal: dish.whyThisMeal || 'Suggested to target daily pediatric nutrient targets.',
            pairing: dish.pairing || '',
            pairExplanation: dish.pairExplanation || '',
            servingSuggestion: dish.servingSuggestion || '1 standard child portion.',
            substitutions: dish.substitutions || [],
            alternatives: []
        };

        if (planMode === 'daily') {
            setCustomDietPlan(prev => ({
                ...prev,
                [slotKey]: newMeal
            }));
        } else {
            setCustomWeeklyPlan(prev => {
                const dayObj = prev[selectedDay] || {};
                const slots = { ...(dayObj.slots || {}), [slotKey]: newMeal };
                return {
                    ...prev,
                    [selectedDay]: { ...dayObj, slots }
                };
            });
        }

        // Clear suggestions for this slot once picked
        setSlotSuggestions(prev => {
            const updated = { ...prev };
            delete updated[slotKey];
            return updated;
        });

        toast.success(`Added "${dish.name}" to ${slotKey}!`, { icon: '✅' });
    };

    // Save customized diet plan to database
    const handleSaveDietPlan = async () => {
        try {
            setIsSavingPlan(true);
            const rawId = Array.isArray(profileId) ? profileId[0] : profileId;
            const activeDaily = (customDietPlan && Object.keys(customDietPlan).length > 0)
                ? customDietPlan
                : (analysis?.mealPlan || {});
            const activeWeekly = (customWeeklyPlan && Object.keys(customWeeklyPlan).length > 0)
                ? customWeeklyPlan
                : (analysis?.weeklyPlan || {});

            const planToSave = {
                mode: planMode,
                dailyPlan: activeDaily,
                weeklyPlan: activeWeekly,
                selectedTheme: analysis?.planThemes?.[selectedThemeIndex]?.name || 'Custom Plan',
                savedAt: new Date().toISOString()
            };

            await saveDietPlan(rawId, planToSave, parentDietNotes);
            setAnalysis(prev => prev ? ({ ...prev, savedPlan: planToSave, customDietNotes: parentDietNotes }) : prev);
            toast.success("Diet plan and parent notes saved successfully to child profile!", { icon: '💾', duration: 3000 });
        } catch (err) {
            console.error("Error saving diet plan:", err);
            toast.error("Failed to save diet plan. Please check your connection.");
        } finally {
            setIsSavingPlan(false);
        }
    };

    // Phase 3 grocery action handlers
    const updateGroceryAction = (food, actionType) => {
        setGroceryActionStates(prev => {
            const current = prev[food] || { isPurchased: false, isOwned: false, isHidden: false };
            const updated = { ...current };
            
            if (actionType === 'purchase') {
                updated.isPurchased = !updated.isPurchased;
                if (updated.isPurchased) updated.isOwned = false; // mutually exclusive
            } else if (actionType === 'own') {
                updated.isOwned = !updated.isOwned;
                if (updated.isOwned) updated.isPurchased = false; // mutually exclusive
            } else if (actionType === 'hide') {
                updated.isHidden = true;
            } else if (actionType === 'restore') {
                updated.isHidden = false;
                updated.isPurchased = false;
                updated.isOwned = false;
            }

            return {
                ...prev,
                [food]: updated
            };
        });
        toast.success(`Updated ${food} status`, { duration: 1000 });
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
    const mealPlan = analysis?.mealPlan || null;
    const mealPlanSummary = analysis?.mealPlanSummary || null;

    // Phase 3 Optimizer Unpacks
    const groceryPlan = analysis?.groceryPlan || [];
    const groceryPlanSummary = analysis?.groceryPlanSummary || {
        totalItems: 0, criticalItems: 0, highPriorityItems: 0, multiNutrientItems: 0, weeklyImpacts: []
    };
    const groceryPlanInsights = analysis?.groceryPlanInsights || [];

    const deficiencyFilters = [
        { key: 'All', label: 'All Deficiencies', icon: 'all_inclusive' },
        { key: 'iron', label: '🩸 Iron Boosters', icon: 'bloodtype' },
        { key: 'calcium', label: '🥛 Calcium & Bones', icon: 'local_drink' },
        { key: 'protein', label: '💪 Protein & Muscle', icon: 'fitness_center' },
        { key: 'vitaminD', label: '☀️ Vitamin D', icon: 'wb_sunny' },
        { key: 'fiber', label: '🌾 Fiber & Digestion', icon: 'spa' },
        { key: 'vitaminA', label: '👁️ Vitamin A & Vision', icon: 'visibility' },
        { key: 'vitaminC', label: '🍊 Vitamin C & Immunity', icon: 'shield' },
        { key: 'zinc', label: '🛡️ Zinc & Growth', icon: 'bolt' },
        { key: 'water', label: '💧 Hydration', icon: 'water_drop' },
        { key: 'healthyFats', label: '🧠 Brain & Omega-3', icon: 'psychology' }
    ];

    // Filter grocery items based on local search, category, deficiency, & actions
    const allFilteredGroceries = groceryPlan.filter(item => {
        const matchesSearch = item.food.toLowerCase().includes(grocerySearch.toLowerCase()) ||
                              item.nutrients.some(n => n.toLowerCase().includes(grocerySearch.toLowerCase()));
        const matchesCategory = groceryCategory === 'All' || item.category === groceryCategory;
        const matchesDeficiency = groceryDeficiencyFilter === 'All' || item.nutrients.some(n => {
            const cleanN = n.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanFilter = groceryDeficiencyFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanN.includes(cleanFilter) || cleanFilter.includes(cleanN);
        });
        const isHidden = !!groceryActionStates[item.food]?.isHidden;
        
        return matchesSearch && matchesCategory && matchesDeficiency && !isHidden;
    });

    const activeGroceries = allFilteredGroceries.filter(item => {
        const state = groceryActionStates[item.food];
        return !state?.isPurchased && !state?.isOwned;
    });

    const completedGroceries = allFilteredGroceries.filter(item => {
        const state = groceryActionStates[item.food];
        return !!state?.isPurchased || !!state?.isOwned;
    });

    // Dynamic sticky summary calculations
    const remainingCount = activeGroceries.length;
    const criticalRemaining = activeGroceries.filter(i => i.priority === 'Critical').length;
    const highRemaining = activeGroceries.filter(i => i.priority === 'High').length;
    const multiRemaining = activeGroceries.filter(i => i.nutrients.length >= 2).length;

    const groceryCategories = ['All', 'Vegetables', 'Fruits', 'Whole Grains', 'Dairy', 'Protein', 'Healthy Fats', 'Hydration', 'Others'];

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

                            {/* Phase 2: Intelligent Pediatric Daily & Weekly Diet Planner Section */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                                    {/* Header & Controls Bar */}
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-2xl">restaurant_menu</span>
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    Intelligent Pediatric Diet Planner
                                                </h2>
                                                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                                                    Clinical Nutrition Intelligence
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                Authentic Indian recipes balancing longitudinal pediatric deficits with alternative dish choices
                                            </p>
                                        </div>

                                        {/* Action Buttons: Refresh & Save */}
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <button 
                                                onClick={handleRefreshMealPlan}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-base">refresh</span>
                                                <span>Refresh Plan</span>
                                            </button>

                                            <button 
                                                onClick={handleSaveDietPlan}
                                                disabled={isSavingPlan}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-base">
                                                    {isSavingPlan ? 'hourglass_top' : 'save'}
                                                </span>
                                                <span>{isSavingPlan ? 'Saving Plan...' : 'Save & Follow Plan'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Selector Controls Bar: Mode Toggle, Plan Themes & Location Focus */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Daily vs Weekly Toggle */}
                                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 self-start">
                                            <button
                                                onClick={() => handleModeChange('daily')}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                                    planMode === 'daily'
                                                        ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">today</span>
                                                <span>1-Day Daily Plan</span>
                                            </button>

                                            <button
                                                onClick={() => handleModeChange('weekly')}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                                    planMode === 'weekly'
                                                        ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                <span>7-Day Weekly Schedule</span>
                                            </button>
                                        </div>

                                        {/* Regional Location Badge */}
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
                                            <span className="material-symbols-outlined text-base text-amber-500">pin_drop</span>
                                            <span>
                                                {analysis?.location?.city ? `${analysis.location.city}, ${analysis.location.state}` : 'Bengaluru, Karnataka'}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-black">
                                                {analysis?.regionalFocus || 'South Indian Staples'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Multi-Option Plan Themes */}
                                    {analysis?.planThemes && analysis.planThemes.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">tune</span>
                                                Select Diet Plan Focus:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                {analysis.planThemes.map((theme, tIdx) => {
                                                    const isSelected = selectedThemeIndex === tIdx;
                                                    return (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => handleThemeChange(tIdx)}
                                                            className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                                                                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                                                                    {theme.badge}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="material-symbols-outlined text-indigo-600 text-sm">check_circle</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                                                                {theme.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
                                                                {theme.description}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Weekly Day Selector Tabs (Active only in Weekly Mode) */}
                                    {planMode === 'weekly' && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                                Select Day to Customize:
                                            </span>
                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                                    const isDayActive = selectedDay === day;
                                                    const dayData = customWeeklyPlan[day] || analysis?.weeklyPlan?.[day];
                                                    const dayCalories = dayData?.totals?.calories || 0;

                                                    return (
                                                        <button
                                                            key={day}
                                                            onClick={() => setSelectedDay(day)}
                                                            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                                                isDayActive
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <p className="text-xs font-black uppercase tracking-wider">
                                                                {day.slice(0, 3)}
                                                            </p>
                                                            <p className={`text-[10px] font-medium mt-0.5 ${isDayActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                                {dayCalories ? `${dayCalories} kcal` : '6 meals'}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Active Plan Slots Grid */}
                                {(() => {
                                    const activeSlotsData = planMode === 'daily'
                                        ? customDietPlan
                                        : (customWeeklyPlan[selectedDay]?.slots || {});

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {mealSlots.map((slot) => {
                                                const meal = activeSlotsData[slot.key];
                                                const isExpanded = expandedMeal === slot.key;
                                                const isSwapped = !!swappedMeals[slot.key];
                                                const isShowingAlternatives = activeAlternativeSlot === slot.key;
                                                const suggestions = slotSuggestions[slot.key] || [];
                                                const isGeneratingThisSlot = isSuggestingSlot === slot.key;

                                                // BLANK / EMPTY SLOT STATE
                                                if (!meal) {
                                                    return (
                                                        <div 
                                                            key={slot.key}
                                                            className="bg-slate-50/80 dark:bg-slate-950/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm min-h-[340px]"
                                                        >
                                                            <div>
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="material-symbols-outlined text-slate-400 text-base">{slot.icon}</span>
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                            {slot.label} • {slot.time}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[9px] font-black rounded uppercase">
                                                                        Slot Empty
                                                                    </span>
                                                                </div>

                                                                <div className="text-center py-6 space-y-2">
                                                                    <div className="size-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl mx-auto flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                                                    </div>
                                                                    <h3 className="text-sm font-bold text-slate-850 dark:text-white">
                                                                        No dish assigned
                                                                    </h3>
                                                                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                                                        Leave this time blank or click suggest to generate tailored Indian dishes for missing nutrient targets.
                                                                    </p>
                                                                </div>

                                                                {/* Display AI Suggestions if available */}
                                                                {suggestions.length > 0 && (
                                                                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                                                                        <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                                                                            Recommended {slot.label} Options:
                                                                        </p>
                                                                        {suggestions.map((sug, sIdx) => (
                                                                            <div key={sIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2 shadow-sm">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{sug.name}</p>
                                                                                    <p className="text-[10px] text-slate-400">{sug.estimatedNutrients?.calories} kcal • {sug.estimatedNutrients?.protein}g protein</p>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => addSuggestedDishToSlot(slot.key, sug)}
                                                                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase flex-shrink-0 cursor-pointer"
                                                                                >
                                                                                    Add
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800">
                                                                <button
                                                                    onClick={() => handleSuggestBlankSlot(slot.key)}
                                                                    disabled={isGeneratingThisSlot}
                                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">
                                                                        {isGeneratingThisSlot ? 'hourglass_top' : 'auto_awesome'}
                                                                    </span>
                                                                    <span>{isGeneratingThisSlot ? 'Analyzing Nutrient Needs...' : `✨ Suggest Missing ${slot.label}`}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // ACTIVE MEAL CARD STATE
                                                const mealAlternatives = meal.alternatives || [];

                                                return (
                                                    <div 
                                                        key={slot.key}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md"
                                                    >
                                                        <div>
                                                            {/* Slot header */}
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-slate-400 text-base">{slot.icon}</span>
                                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                        {slot.label} • {slot.time}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                                        {meal.regionalTag || 'Indian'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => deleteMealSlot(slot.key)}
                                                                        title="Clear this meal slot"
                                                                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Meal Title & Swap Indicators */}
                                                            <div className="mb-3">
                                                                <h3 className="text-base font-black text-slate-850 dark:text-white leading-tight mb-1.5">
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
                                                            {meal.nutrientsImproved && meal.nutrientsImproved.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-3.5">
                                                                    {meal.nutrientsImproved.map((n, i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                                                            <span className="material-symbols-outlined text-[10px] leading-none">{getNutrientIconName(n)}</span>
                                                                            {n}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Nutrition Estimates */}
                                                            {meal.estimatedNutrients && (
                                                                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-900 grid grid-cols-3 gap-2 text-center mb-4">
                                                                    <div>
                                                                        <p className="text-[8px] font-black uppercase text-slate-400">Calories</p>
                                                                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{meal.estimatedNutrients.calories} kcal</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black uppercase text-slate-400">Protein</p>
                                                                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{meal.estimatedNutrients.protein}g</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black uppercase text-slate-400">Fiber</p>
                                                                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{meal.estimatedNutrients.fiber}g</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Alternative Dishes Dropdown Drawer */}
                                                            {mealAlternatives.length > 0 && (
                                                                <div className="mb-3">
                                                                    <button
                                                                        onClick={() => setActiveAlternativeSlot(isShowingAlternatives ? null : slot.key)}
                                                                        className="w-full py-2 px-3 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                                                                    >
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-sm">swap_calls</span>
                                                                            <span>Select Alternative ({mealAlternatives.length} available)</span>
                                                                        </span>
                                                                        <span className="material-symbols-outlined text-sm">
                                                                            {isShowingAlternatives ? 'expand_less' : 'expand_more'}
                                                                        </span>
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {isShowingAlternatives && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                exit={{ opacity: 0, height: 0 }}
                                                                                className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40"
                                                                            >
                                                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                                                                    Click to Swap Dish:
                                                                                </p>
                                                                                {mealAlternatives.map((alt, aIdx) => (
                                                                                    <div
                                                                                        key={aIdx}
                                                                                        onClick={() => selectAlternativeDish(slot.key, alt)}
                                                                                        className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group"
                                                                                    >
                                                                                        <div className="flex items-center justify-between">
                                                                                            <p className="text-xs font-bold text-slate-850 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                                                                {alt.name}
                                                                                            </p>
                                                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                                                                                {alt.regionalTag}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                                                            {alt.estimatedNutrients?.calories} kcal • {alt.estimatedNutrients?.protein}g protein • {alt.prepTime}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Bottom Action buttons */}
                                                        <div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => setExpandedMeal(isExpanded ? null : slot.key)}
                                                                    className="flex-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-all uppercase tracking-wider justify-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm leading-none">
                                                                        {isExpanded ? 'expand_less' : 'description'}
                                                                    </span>
                                                                    <span>{isExpanded ? 'Hide Details' : 'View Info'}</span>
                                                                </button>

                                                                {meal.substitutions?.length > 0 && (
                                                                    <button 
                                                                        onClick={() => toggleSwapMeal(slot.key)}
                                                                        className="flex-1 text-[10px] font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all uppercase tracking-wider border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm leading-none">swap_horiz</span>
                                                                        <span>{isSwapped ? 'Revert Swap' : 'Quick Swap'}</span>
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
                                                                        className="overflow-hidden mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3.5"
                                                                    >
                                                                        {meal.whyThisMeal && (
                                                                            <div>
                                                                                <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Clinical Rationale</h4>
                                                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                                                    {meal.whyThisMeal}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {meal.pairing && (
                                                                            <div>
                                                                                <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Synergy Food Pairing</h4>
                                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                                                                    <strong>{meal.pairing}</strong>: {meal.pairExplanation}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {meal.servingSuggestion && (
                                                                            <div>
                                                                                <h4 className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Portion Guideline</h4>
                                                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                                                    {meal.servingSuggestion}
                                                                                </p>
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
                                    );
                                })()}

                                {/* Parent Dietary Notes & Custom Instructions Card */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
                                            <span className="material-symbols-outlined text-indigo-500">edit_note</span>
                                            Parent Notes & Preparation Preferences
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-bold">Saved with Child Plan</span>
                                    </div>
                                    <textarea
                                        value={parentDietNotes}
                                        onChange={(e) => setParentDietNotes(e.target.value)}
                                        placeholder="Add custom preferences, e.g.: 'Pack steel tiffin without curd on rainy days; pediatrician advised ghee on evening thepla; child prefers lemon mint dip...'"
                                        rows={2}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>

                                {/* Total Plan Nutrient Summation Card */}
                                {mealPlanSummary && (
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-indigo-500">done_all</span>
                                                Planned Nutritional Target Summation
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">
                                                Sum of the recommended Indian meals across all 6 slots matching pediatric RDA benchmarks.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-center">
                                            {[
                                                { label: 'Calories', val: `${mealPlanSummary.calories} kcal` },
                                                { label: 'Protein', val: `${mealPlanSummary.protein}g` },
                                                { label: 'Carbs', val: `${mealPlanSummary.carbs}g` },
                                                { label: 'Fats', val: `${mealPlanSummary.fats}g` },
                                                { label: 'Fiber', val: `${mealPlanSummary.fiber}g` }
                                            ].map((sum, sumIdx) => (
                                                <div key={sumIdx} className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-900 min-w-[90px]">
                                                    <p className="text-[8px] font-black uppercase text-slate-450 tracking-wider mb-0.5">{sum.label}</p>
                                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{sum.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Phase 3: Smart Grocery Optimizer Section */}
                            {groceryPlan && (
                                <div className="space-y-6">
                                    <div className="mb-2">
                                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5 select-none">
                                            <span className="material-symbols-outlined text-slate-500">shopping_basket</span>
                                            Smart Grocery Optimizer
                                        </h2>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                            Convert pediatric deficiencies and daily meal ingredients into a prioritized shopping list
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                        {/* Left Side: Grocery list, search and category filters */}
                                        <div className="lg:col-span-8 space-y-6">
                                            {/* Search and category filter tray */}
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search shopping items (e.g. spinach, ragi, iron, protein)..."
                                                        value={grocerySearch}
                                                        onChange={(e) => setGrocerySearch(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                                    />
                                                </div>

                                                {/* Deficiency Quick Filter Row */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Filter by Pediatric Deficiency Target:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {deficiencyFilters.map(dFilter => (
                                                            <button 
                                                                key={dFilter.key}
                                                                onClick={() => setGroceryDeficiencyFilter(dFilter.key)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                                                    groceryDeficiencyFilter === dFilter.key
                                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                }`}
                                                            >
                                                                {dFilter.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Grocery Category Filter Row */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Filter by Food Aisle / Category:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {groceryCategories.map(cat => (
                                                            <button 
                                                                key={cat}
                                                                onClick={() => setGroceryCategory(cat)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                                                                    groceryCategory === cat
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                }`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Grocery List Grid */}
                                            {activeGroceries.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {activeGroceries.map((item, idx) => {
                                                        const isCart = cart.some(c => c.food === item.food);
                                                        const styles = getSeverityStyles(item.priority);
                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:shadow-md"
                                                            >
                                                                <div>
                                                                    <div className="flex justify-between items-start gap-2 mb-2">
                                                                        <div>
                                                                            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                                                                                {item.food}
                                                                            </h3>
                                                                            <span className="text-[9px] font-extrabold uppercase text-slate-400">
                                                                                {item.category}
                                                                            </span>
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                                                                            {item.priority}
                                                                        </span>
                                                                    </div>

                                                                    {/* Nutrient chips */}
                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {item.nutrients.map((n, i) => (
                                                                            <span key={i} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded">
                                                                                {n}
                                                                            </span>
                                                                        ))}
                                                                    </div>

                                                                    {/* Meal Usage Indicator */}
                                                                    {item.usedInMeals?.length > 0 && (
                                                                        <div className="mb-3 text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-xs leading-none">restaurant</span>
                                                                            <span>Used in: {item.usedInMeals.join(', ')}</span>
                                                                        </div>
                                                                    )}

                                                                    <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 mb-4">
                                                                        {item.rationale}
                                                                    </p>
                                                                </div>

                                                                {/* Item actions */}
                                                                <div className="space-y-2">
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => toggleCart(item)}
                                                                            className={`flex-1 text-[9px] font-black px-2 py-2 rounded-lg flex items-center justify-center gap-1 transition-all uppercase tracking-wider cursor-pointer ${
                                                                                isCart 
                                                                                ? 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' 
                                                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                                                            }`}
                                                                        >
                                                                            <span className="material-symbols-outlined text-xs leading-none">{isCart ? 'remove_shopping_cart' : 'shopping_cart'}</span>
                                                                            <span>{isCart ? 'Remove' : 'Add to List'}</span>
                                                                        </button>
                                                                        
                                                                        <button 
                                                                            onClick={() => updateGroceryAction(item.food, 'hide')}
                                                                            className="px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
                                                                            title="Hide Item"
                                                                        >
                                                                            <span className="material-symbols-outlined text-xs leading-none">visibility_off</span>
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => updateGroceryAction(item.food, 'purchase')}
                                                                            className="flex-1 text-[9px] font-black px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
                                                                        >
                                                                            <span className="material-symbols-outlined text-xs leading-none text-emerald-500">check_circle</span>
                                                                            <span>Purchased</span>
                                                                        </button>
                                                                        
                                                                        <button 
                                                                            onClick={() => updateGroceryAction(item.food, 'own')}
                                                                            className="flex-1 text-[9px] font-black px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
                                                                        >
                                                                            <span className="material-symbols-outlined text-xs leading-none text-amber-500">home</span>
                                                                            <span>At Home</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">shopping_bag</span>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active shopping items left in this selection.</p>
                                                </div>
                                            )}

                                            {/* Collapsible Completed/Owned Drawer */}
                                            {completedGroceries.length > 0 && (
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                                    <button 
                                                        onClick={() => setShowCompleted(!showCompleted)}
                                                        className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer"
                                                    >
                                                        <span>Completed & Owned Items ({completedGroceries.length})</span>
                                                        <span className="material-symbols-outlined text-sm leading-none">
                                                            {showCompleted ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </button>
                                                    
                                                    <AnimatePresence>
                                                        {showCompleted && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2"
                                                            >
                                                                {completedGroceries.map((item, idx) => {
                                                                    const state = groceryActionStates[item.food];
                                                                    return (
                                                                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 text-xs">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`material-symbols-outlined text-sm ${state?.isPurchased ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                                    {state?.isPurchased ? 'check_circle' : 'home'}
                                                                                </span>
                                                                                <span className="font-bold text-slate-500 dark:text-slate-400 line-through">
                                                                                    {item.food}
                                                                                </span>
                                                                                <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                                                                                    {state?.isPurchased ? 'Bought' : 'At Home'}
                                                                                </span>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => updateGroceryAction(item.food, 'restore')}
                                                                                className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:underline cursor-pointer"
                                                                            >
                                                                                Restore
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Sticky Shopping Summary & Weekly Impact */}
                                        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-6">
                                            {/* Summary metrics card */}
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                                                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-1.5 select-none">
                                                    <span className="material-symbols-outlined text-base">receipt_long</span>
                                                    Shopping Summary
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 text-center">
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Remaining</p>
                                                        <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{remainingCount}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 text-center">
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Critical Left</p>
                                                        <p className="text-2xl font-black text-rose-500 mt-1">{criticalRemaining}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 text-center">
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">High Left</p>
                                                        <p className="text-2xl font-black text-red-500 mt-1">{highRemaining}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900 text-center">
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Multi-Gaps</p>
                                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{multiRemaining}</p>
                                                    </div>
                                                </div>

                                                {/* Estimated Weekly Impact list */}
                                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">
                                                        Weekly Nutritional Impact
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {groceryPlanSummary.weeklyImpacts.map((imp, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                <span className="material-symbols-outlined text-indigo-500 text-base leading-none shrink-0">check_circle</span>
                                                                <span className="leading-snug">{imp}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Shopping insights card */}
                                            {groceryPlanInsights.length > 0 && (
                                                <div className="bg-slate-900 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-sm text-white space-y-4">
                                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 select-none text-white">
                                                        <span className="material-symbols-outlined text-base text-slate-400">lightbulb</span>
                                                        Smart Shopping Insights
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {groceryPlanInsights.map((insight, idx) => (
                                                            <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-350">
                                                                <span className="text-indigo-400 text-xs font-bold leading-none select-none">•</span>
                                                                <p className="font-medium text-slate-300">{insight}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-355 font-bold rounded-lg text-xs border border-slate-200 dark:border-slate-750 uppercase tracking-wider cursor-pointer"
                                                >
                                                    Clear
                                                </button>
                                                <button 
                                                    onClick={downloadCart}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer"
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
                                                    className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
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
