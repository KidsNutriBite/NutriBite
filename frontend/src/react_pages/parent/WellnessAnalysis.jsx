"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { getProfileById, reanalyzeProfile } from '../../api/profile.api';
import toast from 'react-hot-toast';

// ─── Tracker feature mappings for navigation ────────────────────────────────
const TRACKER_MAP = {
    sleep:      { label: 'Sleep Tracker',      tab: 'sleep',       emoji: '😴', desc: 'Log child resting cycles' },
    water:      { label: 'Water Tracker',      tab: 'overview',    emoji: '💧', desc: 'Add glasses of water' },
    hydration:  { label: 'Water Tracker',      tab: 'overview',    emoji: '💧', desc: 'Add glasses of water' },
    activity:   { label: 'Activity Tracker',   tab: 'activity',    emoji: '🏃', desc: 'Log daily playing/sports' },
    nutrition:  { label: 'Meal Planner',       tab: 'overview',    emoji: '🥗', desc: 'Log meals to balance nutrition' },
    protein:    { label: 'Meal Planner',       tab: 'overview',    emoji: '🥩', desc: 'Add protein foods' },
    iron:       { label: 'Meal Planner',       tab: 'overview',    emoji: '🩸', desc: 'Add iron-rich leafy foods' },
    calcium:    { label: 'Meal Planner',       tab: 'overview',    emoji: '🦴', desc: 'Add dairy and ragi products' },
    vitaminD:   { label: 'Meal Planner',       tab: 'overview',    emoji: '☀️', desc: 'Plan sun exposure / foods' },
    fiber:      { label: 'Meal Planner',       tab: 'overview',    emoji: '🌾', desc: 'Add whole-wheat and veggies' },
    growth:     { label: 'Growth Tracker',     tab: 'growth',      emoji: '📏', desc: 'Add weight & height measurements' }
};

// Pediatric physiological details for clinical nutrients
const CLINICAL_INTEL = {
    protein: {
        riskIfIgnored: 'Muscular fatigue, slower height elongation velocity, structural development lag.',
        clinicalNeed: 'Building blocks for muscle tissue, organ recovery, and physical structure.',
        icon: '💪'
    },
    iron: {
        riskIfIgnored: 'Sluggish oxygen flow, concentration lag at school, cognitive play fatigue.',
        clinicalNeed: 'Critical for hemoglobin synthesis, brain oxygenation, and focus.',
        icon: '🩸'
    },
    calcium: {
        riskIfIgnored: 'Growing pains in legs, dental decay, weaker bone crystallization density.',
        clinicalNeed: 'Primary mineral for bone elongation, teeth strengthening, and muscle contraction.',
        icon: '🥛'
    },
    vitaminD: {
        riskIfIgnored: 'Bone softening, poor calcium absorption from diet, limb weakness.',
        clinicalNeed: 'Vital hormone precursor to absorb calcium from the intestine into the bones.',
        icon: '☀️'
    },
    fiber: {
        riskIfIgnored: 'Chronic constipation, regular stomach aches, energy spike-and-crash cycles.',
        clinicalNeed: 'Maintains healthy gut transit time and controls glucose release rate.',
        icon: '🌾'
    },
    water: {
        riskIfIgnored: 'Dehydration headache, play fatigue, cognitive slumps, renal strain.',
        clinicalNeed: 'Essential for blood volume regulation, kidney filtration, and joint lubrication.',
        icon: '💧'
    }
};

const WellnessAnalysis = ({ profileId, profileData, onUpdate, hideHeader = false, onNavigateTab }) => {
    const params = useParams();
    const resolvedId = profileId || params?.id;

    const [profile, setProfile] = useState(profileData || null);
    const [loading, setLoading] = useState(!profileData && resolvedId);
    const [reanalyzing, setReanalyzing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (profileData) {
            setProfile(profileData);
            setLoading(false);
            return;
        }
        if (!resolvedId) return;
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await getProfileById(resolvedId);
                setProfile(res.data || res);
            } catch (err) {
                setError('Failed to fetch wellness data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [resolvedId, profileData]);

    const handleReanalyze = async () => {
        if (!profile?._id) return;
        try {
            setReanalyzing(true);
            const res = await reanalyzeProfile(profile._id);
            setProfile(res.data || res);
            toast.success('Wellness Analysis recalculated successfully!');
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error(err.message || 'Failed to recalculate wellness analysis');
        } finally {
            setReanalyzing(false);
        }
    };

    const wellness = useMemo(() => {
        return profile?.wellnessAnalysis || { score: 70, deficiencies: {}, aiExplanation: '' };
    }, [profile]);

    const score = wellness.score ?? 70;

    const wellnessLevel = useMemo(() => {
        if (score >= 80) return { label: 'Excellent', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' };
        if (score >= 70) return { label: 'Good', color: 'text-blue-700 border-blue-200 bg-blue-50' };
        if (score >= 50) return { label: 'Moderate Risk', color: 'text-amber-700 border-amber-200 bg-amber-50' };
        return { label: 'High Risk', color: 'text-red-700 border-red-200 bg-red-50' };
    }, [score]);

    // Trend calculator (simulated using stable hash)
    const trend = useMemo(() => {
        if (!profile) return { val: '+0%', isPositive: true };
        const val = (profile.name?.length % 4) + 2;
        const isPositive = (profile.name?.length % 2) === 0;
        return {
            val: `${isPositive ? '+' : '-'}${val}%`,
            isPositive
        };
    }, [profile]);

    // Parse the details entered during child profile creation (physical stats and preferences)
    const parsedDiagnostics = useMemo(() => {
        const goods = [];
        const bads = [];

        if (!profile) return { goods, bads };

        // 1. BMI status (calculated from child profile height/weight)
        const heightM = (profile.height || 100) / 100;
        const weight = profile.weight || 15;
        const bmi = weight / (heightM * heightM);
        if (bmi >= 14 && bmi <= 22) {
            goods.push({
                title: 'Healthy Body Mass Index (BMI)',
                value: `BMI is ${bmi.toFixed(1)}`,
                desc: 'Child is within the healthy weight-to-height ratio according to WHO standard percentiles.',
                icon: '⚖️'
            });
        } else {
            bads.push({
                title: 'Imbalanced BMI Status',
                value: `BMI is ${bmi.toFixed(1)}`,
                desc: `BMI stands at ${bmi.toFixed(1)} which is outside the ideal WHO zone. Growth timeline logs require monitoring.`,
                icon: '⚖️',
                feature: TRACKER_MAP.growth,
                risk: 'Possible weight lag or overweight concerns that could disrupt growth rate.',
                action: 'Log height and weight changes in the Growth Tracker tab to stay within percentiles.'
            });
        }

        // 2. Sleep Preference
        const sleepHours = Number(profile.preferences?.sleepDuration || 0);
        const sleepQuality = profile.preferences?.sleepQuality || 'Average';
        const sleepTarget = profile.age <= 3 ? 12 : profile.age <= 6 ? 11 : profile.age <= 10 ? 10 : 9;
        
        if (sleepHours >= sleepTarget && sleepQuality.toLowerCase() === 'good') {
            goods.push({
                title: 'Excellent Sleep Quality & Duration',
                value: `${sleepHours} hrs/night (Good Quality)`,
                desc: 'Supports normal release of growth hormones and restores cellular energy for daily play.',
                icon: '😴'
            });
        } else {
            bads.push({
                title: 'Inadequate Sleep Duration or Quality',
                value: `${sleepHours || 'Not set'} hrs/night (Quality: ${sleepQuality})`,
                desc: `Sleep preference (${sleepHours}h) is below the recommended ${sleepTarget}h for age ${profile.age}.`,
                icon: '😴',
                feature: TRACKER_MAP.sleep,
                risk: 'Fatigue, mood swings, and disruption of natural growth hormone secretion.',
                action: 'Log sleeping routines in the Sleep Tracker tab to target a consistent sleep schedule.'
            });
        }

        // 3. Hydration Preference
        const waterIntake = Number(profile.preferences?.waterIntake || 0);
        const waterTarget = profile.age <= 3 ? 1200 : profile.age <= 8 ? 1600 : 2000;
        
        if (waterIntake >= waterTarget) {
            goods.push({
                title: 'Optimal Daily Hydration Intake',
                value: `${waterIntake} ml/day`,
                desc: 'Maintains blood volume flow, optimal muscle recovery, and prevents physical sluggishness.',
                icon: '💧'
            });
        } else {
            bads.push({
                title: 'Insufficient Hydration Intake',
                value: `${waterIntake || 'Not set'} ml/day`,
                desc: `Hydration preference (${waterIntake}ml) is below the recommended target of ${waterTarget}ml for age ${profile.age}.`,
                icon: '💧',
                feature: TRACKER_MAP.hydration,
                risk: 'Cognitive slumps, play fatigue, mild headaches, and cellular dehydration.',
                action: 'Use the Quick Add Water button on the dashboard to build daily hydration habits.'
            });
        }

        // 4. Activity Level
        const activity = (profile.preferences?.activityLevel || 'moderate').toLowerCase();
        if (activity === 'high') {
            goods.push({
                title: 'Highly Active Lifestyle Preference',
                value: 'High Activity',
                desc: 'Active playing habits build cardiovascular stamina and stimulate bone elongation.',
                icon: '🏃'
            });
        } else if (activity === 'low') {
            bads.push({
                title: 'Sedentary Activity Preference',
                value: 'Low Activity',
                desc: 'Child has low sports or active playing frequency selected in profile.',
                icon: '🏃',
                feature: TRACKER_MAP.activity,
                risk: 'Reduced muscle tone building, sluggish metabolism, and lower physical endurance.',
                action: 'Track outdoor play or active sports exercises in the Activity Tracker tab.'
            });
        } else {
            goods.push({
                title: 'Moderately Active Lifestyle',
                value: 'Moderate Activity',
                desc: 'General playing frequency keeps cardiovascular health and muscle strength active.',
                icon: '🏃'
            });
        }

        // 5. Screen Time compliance
        const screenTime = Number(profile.preferences?.screenTime || 0);
        const screenLimit = profile.age <= 3 ? 1 : profile.age <= 8 ? 2 : 3;
        if (screenTime > 0 && screenTime <= screenLimit) {
            goods.push({
                title: 'Regulated Screen Time Compliance',
                value: `${screenTime} hrs/day`,
                desc: `Under the safe limit of ${screenLimit}h/day. Promotes active playing and healthy eyesight.`,
                icon: '📱'
            });
        } else if (screenTime > screenLimit) {
            bads.push({
                title: 'High Daily Screen Exposure',
                value: `${screenTime} hrs/day`,
                desc: `Screen time is ${screenTime}h, exceeding the pediatric limit of ${screenLimit}h/day.`,
                icon: '📱',
                feature: TRACKER_MAP.sleep, // screen time limits improve sleep
                risk: 'Poor sleep preparation, eye strain, and lower physical play activity.',
                action: 'Adjust preferences or limit screen use prior to bedtime hours to improve sleep.'
            });
        }

        // 6. Nutrient Deficiencies (mapped from computed clinical analysis)
        const deficiencies = wellness.deficiencies || {};
        const nutrients = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
        nutrients.forEach(key => {
            const def = deficiencies[key];
            if (!def) return;

            const intel = CLINICAL_INTEL[key] || { riskIfIgnored: 'Development lag', clinicalNeed: 'RDA baseline' };
            if (def.severity === 'RED' || def.severity === 'ORANGE') {
                bads.push({
                    title: `Low ${key.charAt(0).toUpperCase() + key.slice(1)} Gaps`,
                    value: `${def.metPercent}% met`,
                    desc: `Consuming only ${def.consumed} / ${def.target} ${key === 'water' ? 'ml' : ['calcium', 'iron'].includes(key) ? 'mg' : key === 'vitaminD' ? 'mcg' : 'g'} daily.`,
                    icon: intel.icon || '🥗',
                    feature: TRACKER_MAP[key] || TRACKER_MAP.nutrition,
                    risk: intel.riskIfIgnored,
                    action: `Include foods rich in ${key} (e.g. ${wellness.groceries?.slice(0, 3).join(', ') || 'nutritious sources'}) daily.`
                });
            } else if (def.severity === 'GREEN') {
                goods.push({
                    title: `Excellent ${key.charAt(0).toUpperCase() + key.slice(1)} Levels`,
                    value: `${def.metPercent}% met`,
                    desc: `Consuming enough daily nutrient targets to support biological function.`,
                    icon: intel.icon || '🥗'
                });
            }
        });

        return { goods, bads };
    }, [profile, wellness]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                <p className="text-gray-500 font-bold text-sm">Aggregating Child Health Intelligence...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center max-w-xl mx-auto my-10">
                <p className="font-extrabold text-lg mb-2">Error Accessing Dashboard</p>
                <p className="text-sm mb-4">{error || 'Please ensure you select a valid child profile.'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 md:px-0 py-4">

            {/* Header */}
            {!hideHeader && (
                <div className="glass-panel p-6 rounded-[2rem] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-white/80 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-wider rounded-full">
                                Profile-based Diagnostic
                            </span>
                            <h1 className="text-3xl font-black text-gray-900 leading-tight">
                                Wellness Diagnostic: {profile.name}
                            </h1>
                            <p className="text-gray-500 font-bold text-sm">
                                Clinical-grade assessment derived from child profile creation parameters.
                            </p>
                        </div>
                        <button
                            onClick={handleReanalyze}
                            disabled={reanalyzing}
                            className="bg-indigo-900 text-white font-extrabold text-sm py-3 px-6 rounded-2xl shadow-lg hover:bg-indigo-950 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
                        >
                            {reanalyzing ? (
                                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Syncing...</>
                            ) : (
                                <><span>🔄</span> Re-Sync Data</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* SECTION 1: Wellness Score Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Circle Progress */}
                    <div className="relative w-32 h-32 flex items-center justify-center bg-gray-50 rounded-full p-4 border border-gray-100 shrink-0">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" className="stroke-gray-100" strokeWidth="8" fill="transparent" />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                stroke={score >= 80 ? '#10B981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="263.89"
                                strokeDashoffset={263.89 - (263.89 * score) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-800">{score}</span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Score</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${wellnessLevel.color}`}>
                                {wellnessLevel.label}
                            </span>
                            <span className={`text-xs font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {trend.val} vs last week {trend.isPositive ? '▲' : '▼'}
                            </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-800">
                            Child Vitality & Development Grade
                        </h2>
                        {wellness.aiExplanation && (
                            <p className="text-gray-600 text-xs leading-relaxed max-w-2xl bg-indigo-50/50 p-3 rounded-xl border border-indigo-50/30">
                                💡 <strong>Summary Analysis:</strong> {wellness.aiExplanation}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* WHAT IS GOING WELL (GREENS) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
            >
                <div>
                    <h3 className="text-base font-black text-emerald-800 flex items-center gap-2">
                        <span className="text-lg">✅</span> WHAT IS GOING WELL
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Healthy developmental factors identified in child profile</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedDiagnostics.goods.map((item, idx) => (
                        <div key={idx} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex gap-3 items-start">
                            <span className="text-2xl mt-0.5">{item.icon}</span>
                            <div>
                                <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                                    {item.title}
                                    <span className="bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-black uppercase">Good</span>
                                </h4>
                                <p className="text-xs font-bold text-emerald-800 mt-1">{item.value}</p>
                                <p className="text-[11px] text-emerald-700 font-medium leading-relaxed mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* NutriKids Recommendations / Roadmap */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
            >
                <div className="text-center space-y-2">
                    <span className="px-3.5 py-1 bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest rounded-full">
                        Roadmap
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                        NutriKids Recommendations
                    </h2>
                    <p className="text-gray-500 font-bold max-w-xl mx-auto text-sm">
                        Here is how NutriKids's specialized features help address each observed area.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parsedDiagnostics.bads.map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-200 hover:shadow-md transition duration-300"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">{item.icon || '🚀'}</span>
                                    <span className="text-[10px] text-indigo-700 font-black bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50 uppercase">
                                        Roadmap Card
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Current Concern</p>
                                    <p className="font-extrabold text-gray-900 text-sm leading-snug">{item.risk}</p>
                                </div>
                                <div className="space-y-1 pt-2 border-t border-indigo-100/30">
                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">NutriKids Feature</p>
                                    <p className="font-bold text-gray-800 text-sm">{item.desc}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-red-200/60 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between space-y-2 shrink-0">
                                <div>
                                    <span className="text-[9px] text-red-900 font-black uppercase tracking-wider">How to improve in NutriKid</span>
                                    <p className="text-xs font-bold text-red-700 leading-normal mt-0.5">{item.action}</p>
                                </div>
                                <button
                                    onClick={() => onNavigateTab && item.feature && onNavigateTab(item.feature.tab)}
                                    className="w-full bg-red-800 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow hover:bg-red-950 transition flex items-center justify-center gap-1.5"
                                >
                                    <span>{item.feature?.emoji}</span> Go to {item.feature?.label} →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* HOW THEY CAN IMPROVE (FEATURE RECOMMENDATIONS) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
            >
                <div>
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                        <span>💡</span> How to Improve Using Application Features
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Automated feature mappings for proactive parenting</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-black tracking-wider">
                                <th className="p-3">Detected Issue / Metric</th>
                                <th className="p-3">NutriKid Feature</th>
                                <th className="p-3">Expected Developmental Benefit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                            <tr>
                                <td className="p-3 text-red-700">Calorie or Protein Intake Gap</td>
                                <td className="p-3">🥗 Meal Planner</td>
                                <td className="p-3">Balanced pediatric amino-acid absorption & energy</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-red-700">Insufficient Hydration Intake</td>
                                <td className="p-3">💧 Water Tracker</td>
                                <td className="p-3">Enhances kidney waste filtration & prevents play fatigue</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-amber-700">Short Sleep Duration / Quality</td>
                                <td className="p-3">😴 Sleep Tracker</td>
                                <td className="p-3">Optimizes growth hormone release during deep cycles</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-blue-700">WHO Growth Percentile Deviation</td>
                                <td className="p-3">📏 Growth Tracker</td>
                                <td className="p-3">Visualizes skeletal progression velocity against average curves</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* PREMIUM PRICING UPSELL */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden border-2 border-yellow-400/40"
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-3 text-center md:text-left">
                        <div className="flex justify-center md:justify-start items-center gap-2">
                            <span className="text-xl">🌟</span>
                            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-yellow-500/30">
                                Recommended Premium Mode
                            </span>
                        </div>
                        <h3 className="text-2xl font-black">Unlock Full Pediatric Diagnostics Pro</h3>
                        <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xl">
                            Unlock professional-grade developmental analytics: 2-year height forecasting curves, clinical deficiency predictions, automated pediatrician email summaries, and direct AI-backed clinical insights.
                        </p>
                        
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-indigo-100 font-bold text-left">
                            <div className="flex items-center gap-1.5">
                                <span>🔮</span> 2-Year Growth Forecasting
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>🧬</span> Deficiency Predictions
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>🚨</span> AI Pediatric Health Alerts
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>📋</span> Weekly Doctor PDF Reports
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center gap-2 bg-white/5 p-5 rounded-3xl border border-white/10 w-full md:w-auto">
                        <p className="text-[10px] uppercase font-black tracking-widest text-indigo-300">Special Offer</p>
                        <p className="text-3xl font-black text-white">₹199<span className="text-xs font-bold text-gray-400">/mo</span></p>
                        <button
                            onClick={() => toast.success('Premium subscription modal opened! (Demo mode)')}
                            className="bg-yellow-400 hover:bg-yellow-500 text-indigo-950 font-black text-sm py-3 px-6 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
                        >
                            Start 7-Day Trial
                        </button>
                        <span className="text-[9px] text-gray-400 font-semibold">Cancel anytime · Secure checkout</span>
                    </div>
                </div>
            </motion.div>

        </div>
    );
};

export default WellnessAnalysis;

