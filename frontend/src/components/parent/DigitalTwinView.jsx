"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';
import { getDigitalTwin } from '../../api/twin.api';
import toast from 'react-hot-toast';

const DigitalTwinView = ({ profileId, profile }) => {
    const [twinData, setTwinData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTimeline, setSelectedTimeline] = useState('day30'); // 'day30' | 'day90' | 'day180'

    // Interactive simulator sliders (deviation percentage from baseline: -50% to +50%)
    const [sliders, setSliders] = useState({
        protein: 0,
        vegetables: 0,
        hydration: 0,
        sugaryFoods: 0,
        fastFood: 0
    });

    const fetchTwin = async () => {
        try {
            setLoading(true);
            const data = await getDigitalTwin(profileId);
            setTwinData(data);
        } catch (error) {
            console.error("Failed to load digital twin data", error);
            toast.error("Unable to query Twin engine. Using fallback details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileId) {
            fetchTwin();
        }
    }, [profileId]);

    // Reset simulator sliders
    const handleResetSliders = () => {
        setSliders({
            protein: 0,
            vegetables: 0,
            hydration: 0,
            sugaryFoods: 0,
            fastFood: 0
        });
        toast.success("Simulator reset to baseline habits!");
    };

    // Calculate active metrics and predictions dynamically based on slider values
    const simulatedData = useMemo(() => {
        if (!twinData) return null;

        const baseRadar = twinData.radarMetrics;
        const clamp = (val) => Math.min(100, Math.max(0, Math.round(val)));

        // Helper calculations based on interactive slider adjustments
        const protein = clamp(baseRadar.protein + sliders.protein * 0.4);
        const hydration = clamp(baseRadar.hydration + sliders.hydration * 0.5);
        const vitamins = clamp(baseRadar.vitamins + sliders.vegetables * 0.4 - sliders.fastFood * 0.2);
        const calcium = clamp(baseRadar.calcium + sliders.protein * 0.1 + sliders.hydration * 0.1);
        const iron = clamp(baseRadar.iron + sliders.protein * 0.2 + sliders.vegetables * 0.3 - sliders.sugaryFoods * 0.1);
        const consistency = clamp(baseRadar.consistency + Math.round((sliders.protein + sliders.vegetables + sliders.hydration) / 6));

        // Simulated overall nutrition score
        const nutritionScore = Math.round((protein + hydration + vitamins + calcium + iron + consistency) / 6);

        // Simulated risk score (decreases with good habits, increases with bad ones)
        let riskScore = twinData.riskScore;
        const habitDelta = (sliders.protein + sliders.vegetables + sliders.hydration) * 0.3 - (sliders.sugaryFoods + sliders.fastFood) * 0.4;
        riskScore = clamp(riskScore - habitDelta);

        // Simulated predictions
        const days = {
            day30: { ...twinData.predictions.day30 },
            day90: { ...twinData.predictions.day90 },
            day180: { ...twinData.predictions.day180 }
        };

        // Simulated growth outputs
        const applyGrowthShift = (timelineKey, months) => {
            const basePred = twinData.predictions[timelineKey];
            const weightShift = (sliders.protein * 0.005 + sliders.fastFood * 0.015 + sliders.sugaryFoods * 0.01) * months;
            const heightShift = (sliders.protein * 0.008 + sliders.vegetables * 0.006) * months;

            // Clamping projections
            days[timelineKey].expectedWeight = parseFloat((basePred.expectedWeight + weightShift).toFixed(2));
            days[timelineKey].expectedHeight = parseFloat((basePred.expectedHeight + heightShift).toFixed(2));
            days[timelineKey].expectedNutritionScore = clamp(basePred.expectedNutritionScore + (nutritionScore - twinData.nutritionScore));
            
            // Adjust prediction confidence based on simulated changes
            const sliderAbsSum = Object.values(sliders).reduce((acc, val) => acc + Math.abs(val), 0);
            days[timelineKey].confidencePct = Math.max(30, basePred.confidencePct - Math.round(sliderAbsSum * 0.15));

            if (days[timelineKey].expectedNutritionScore >= 85) {
                days[timelineKey].status = "Excellent healthy trajectory";
            } else if (days[timelineKey].expectedNutritionScore >= 70) {
                days[timelineKey].status = "Stable progression";
            } else {
                days[timelineKey].status = "High risk of deficit";
            }
        };

        applyGrowthShift('day30', 1);
        applyGrowthShift('day90', 3);
        applyGrowthShift('day180', 6);

        // Dynamic Insights based on simulator
        const insights = [...twinData.insights];
        if (sliders.vegetables > 20 && !insights.some(i => i.includes("vegetables"))) {
            insights.unshift("Simulated: Daily vitamin adequacy improves by 12% with increased vegetables.");
        }
        if (sliders.sugaryFoods > 20 && !insights.some(i => i.includes("Sugar"))) {
            insights.push("Warning: Simulated high sugar intake increases cavities and hyper-activity risks.");
        }
        if (sliders.protein > 30) {
            insights.unshift("Simulated: Protein enrichment accelerates skeletal muscle repair index.");
        }

        // Format for Recharts
        const radarChartData = [
            { subject: 'Protein', value: protein, fullMark: 100 },
            { subject: 'Calcium', value: calcium, fullMark: 100 },
            { subject: 'Iron', value: iron, fullMark: 100 },
            { subject: 'Vitamins', value: vitamins, fullMark: 100 },
            { subject: 'Hydration', value: hydration, fullMark: 100 },
            { subject: 'Consistency', value: consistency, fullMark: 100 },
        ];

        return {
            nutritionScore,
            riskScore,
            radarChartData,
            predictions: days,
            insights,
            summary: nutritionScore >= 85 ? "Healthy Growth" : nutritionScore >= 70 ? "Good, Monitor Protein" : "Needs Attention"
        };
    }, [twinData, sliders]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse py-8">
                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl col-span-1"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl col-span-2"></div>
                </div>
                <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>
            </div>
        );
    }

    if (!twinData || !simulatedData) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[2rem] shadow-sm">
                <span className="text-6xl mb-4 inline-block">🤖</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Twin Engine Unavailable</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">Could not compute the digital twin status. Please ensure meal logs and growth stats are updated and try again.</p>
                <button onClick={fetchTwin} className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/30">Retry Engine</button>
            </div>
        );
    }

    const currentPrediction = simulatedData.predictions[selectedTimeline];

    return (
        <div className="space-y-8 font-sans">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20 mb-2">Live AI Projection</span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Child's Digital Twin</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Continuous learning representation based on physical stats, logs, and medical guidelines.</p>
                </div>
                
                {/* Reset button for Simulator */}
                {Object.values(sliders).some(v => v !== 0) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleResetSliders}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">restart_alt</span>
                        Reset Simulator
                    </motion.button>
                )}
            </div>

            {/* Grid Row 1: Living Avatar & Radar Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3D-inspired living avatar card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[420px] text-white border border-white/10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent-green/10 rounded-full blur-3xl opacity-60"></div>

                    {/* Top status */}
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Digital Replica</span>
                            <h2 className="text-2xl font-black">{profile.name}</h2>
                        </div>
                        <span className={`px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-full ${
                            simulatedData.summary === 'Healthy Growth' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            simulatedData.summary.includes('Monitor') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                            {simulatedData.summary}
                        </span>
                    </div>

                    {/* Avatar Showcase */}
                    <div className="relative z-10 flex flex-col items-center justify-center py-6">
                        <motion.div 
                            animate={{ 
                                y: [0, -10, 0],
                                rotate: [0, 1, -1, 0]
                            }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 6,
                                ease: "easeInOut"
                            }}
                            className="w-36 h-36 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/20 shadow-2xl flex items-center justify-center backdrop-blur-md relative group hover:scale-105 transition-all"
                        >
                            {/* Inner ambient ring */}
                            <div className="absolute inset-2.5 rounded-full border border-dashed border-white/10 animate-spin-slow"></div>
                            
                            <span className="text-7xl select-none select-none drop-shadow-[0_15px_15px_rgba(255,255,255,0.1)]">
                                {profile.avatar === 'lion' && '🦁'}
                                {profile.avatar === 'bear' && '🐻'}
                                {profile.avatar === 'rabbit' && '🐰'}
                                {profile.avatar === 'fox' && '🦊'}
                                {profile.avatar === 'cat' && '🐱'}
                                {profile.avatar === 'dog' && '🐶'}
                            </span>
                        </motion.div>
                        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/5 backdrop-blur-xl">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Continuous Sync Active
                        </span>
                    </div>

                    {/* Core Health stats */}
                    <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nutrition Score</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black">{simulatedData.nutritionScore}</span>
                                <span className="text-slate-400 font-bold text-xs">/100</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Indicator</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black">{simulatedData.riskScore}</span>
                                <span className="text-slate-400 font-bold text-xs">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nutrition health radar chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Diagnostics</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nutrition Health Radar</h3>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Target Area: 100 max
                        </div>
                    </div>

                    {/* Recharts container */}
                    <div className="w-full flex items-center justify-center" style={{ height: 288 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={simulatedData.radarChartData}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                                <Radar
                                    name="Nutritional Sufficiency"
                                    dataKey="value"
                                    stroke="#2b9dee"
                                    fill="#2b9dee"
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Grid Row 2: Future Projections & Simulator Sliders */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Future Projections Section */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Simulated Outcomes</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Future Trajectory</h3>
                        </div>

                        {/* Switch Timeline Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2 w-full">
                            {[
                                { id: 'day30', label: '30 Days' },
                                { id: 'day90', label: '90 Days' },
                                { id: 'day180', label: '180 Days' },
                            ].map((timeline) => (
                                <button
                                    key={timeline.id}
                                    onClick={() => setSelectedTimeline(timeline.id)}
                                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all ${
                                        selectedTimeline === timeline.id
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {timeline.label}
                                </button>
                            ))}
                        </div>

                        {/* Projection Metrics */}
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Expected Weight</span>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{currentPrediction.expectedWeight} kg</span>
                            </div>
                            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Expected Height</span>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{currentPrediction.expectedHeight} cm</span>
                            </div>
                            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Expected Score</span>
                                <span className={`text-lg font-black ${
                                    currentPrediction.expectedNutritionScore >= 80 ? 'text-emerald-500' :
                                    currentPrediction.expectedNutritionScore >= 65 ? 'text-amber-500' : 'text-rose-500'
                                }`}>{currentPrediction.expectedNutritionScore} / 100</span>
                            </div>
                        </div>
                    </div>

                    {/* Confidence percentage and timeline verdict status */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span>Projection Confidence</span>
                            <span className="text-slate-700 dark:text-slate-200 font-extrabold">{currentPrediction.confidencePct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-primary to-accent-green h-full rounded-full transition-all duration-300"
                                style={{ width: `${currentPrediction.confidencePct}%` }}
                            ></div>
                        </div>
                        <p className="text-xs font-semibold italic text-slate-400 text-center">
                            " {currentPrediction.status} "
                        </p>
                    </div>
                </div>

                {/* Future Habit Simulator Card */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Actionable Playground</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Future Habit Simulator</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Modify habits relative to current patterns to dynamically simulate child growth and future twin state.</p>
                    </div>

                    {/* Sliders loop */}
                    <div className="space-y-5">
                        {[
                            { key: 'protein', label: 'Protein Intake', minLabel: 'Less Lentils/Eggs', maxLabel: 'More Protein', color: 'accent-green' },
                            { key: 'vegetables', label: 'Vegetable & Micronutrient Intake', minLabel: 'Less Greens', maxLabel: 'More Greens', color: 'emerald-500' },
                            { key: 'hydration', label: 'Hydration Intake', minLabel: 'Less Water', maxLabel: 'More Water', color: 'primary' },
                            { key: 'sugaryFoods', label: 'Sugary Snacks & Sweets', minLabel: 'Healthy Limits', maxLabel: 'Excessive Sugar', color: 'rose-500' },
                            { key: 'fastFood', label: 'Fast Food Frequency', minLabel: 'Home Cooked', maxLabel: 'Frequent Fast Food', color: 'orange-400' },
                        ].map((item) => (
                            <div key={item.key} className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                        sliders[item.key] > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                        sliders[item.key] < 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {sliders[item.key] > 0 ? `+${sliders[item.key]}%` : `${sliders[item.key]}%`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    step="5"
                                    value={sliders[item.key]}
                                    onChange={(e) => setSliders({ ...sliders, [item.key]: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span>{item.minLabel}</span>
                                    <span>{item.maxLabel}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Row 3: Actionable AI Insights */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-[2rem] shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    Pediatric Twin Insights
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simulatedData.insights.map((insight, idx) => {
                        const isWarning = insight.toLowerCase().includes("warning") || insight.toLowerCase().includes("deficient") || insight.toLowerCase().includes("sugary") || insight.toLowerCase().includes("risk");
                        const isSimulated = insight.toLowerCase().includes("simulated");
                        
                        return (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-2xl flex gap-3 border ${
                                    isWarning ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/30' :
                                    isSimulated ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/30' :
                                    'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/30'
                                }`}
                            >
                                <span className={`material-symbols-outlined shrink-0 mt-0.5 ${
                                    isWarning ? 'text-rose-500' :
                                    isSimulated ? 'text-indigo-500' : 'text-emerald-500'
                                }`}>
                                    {isWarning ? 'warning' : isSimulated ? 'science' : 'check_circle'}
                                </span>
                                <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed font-semibold">
                                    {insight}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DigitalTwinView;
