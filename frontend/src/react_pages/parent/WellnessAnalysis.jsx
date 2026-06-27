"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { getProfileById, reanalyzeProfile } from '../../api/profile.api';
import toast from 'react-hot-toast';

const WellnessAnalysis = ({ profileId, profileData, onUpdate, hideHeader = false }) => {
    const params = useParams();
    const router = useRouter();
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
                console.error("Error loading profile for wellness analysis:", err);
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
            const updatedProfile = res.data || res;
            setProfile(updatedProfile);
            toast.success("Wellness Analysis recalculated!");
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error("Failed to reanalyze profile:", err);
            toast.error(err.message || "Failed to recalculate wellness analysis");
        } finally {
            setReanalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-500 font-bold text-sm">Loading Wellness Analysis...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 text-center max-w-xl mx-auto my-10">
                <p className="font-extrabold text-lg mb-2">Error Accessing Analysis</p>
                <p className="text-sm mb-4">{error || 'Please ensure you select a valid child profile.'}</p>
                <button
                    onClick={() => router.push('/parent/dashboard')}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const wellness = profile.wellnessAnalysis || {
        score: 100,
        concerns: [],
        monitor: [],
        strengths: [],
        recommendations: []
    };

    const score = wellness.score ?? 100;
    const strokeDashoffset = 251.2 - (251.2 * score) / 100;

    const getScoreColor = (val) => {
        if (val >= 80) return { stroke: '#10B981', text: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' };
        if (val >= 60) return { stroke: '#F59E0B', text: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' };
        return { stroke: '#EF4444', text: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' };
    };

    const scoreVibe = getScoreColor(score);

    return (
        <div className="space-y-10 max-w-6xl mx-auto px-4 md:px-0">
            {/* Header / Top Card */}
            {!hideHeader && (
                <div className="glass-panel p-8 rounded-[2rem] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-white/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest rounded-full">
                                Growth & Habits Diagnostic
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                                Wellness Analysis: {profile.name}
                            </h1>
                            <p className="text-gray-500 font-bold">
                                Based on the information provided, here are the key health insights for your child.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push(`/parent/child/${profile._id}`)}
                            className="bg-white hover:bg-gray-50 text-gray-800 font-extrabold py-3.5 px-7 rounded-2xl shadow-md border border-gray-100 transition duration-300 flex items-center gap-2 text-sm shrink-0"
                        >
                            <span>📊</span> Go to Child Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* Score and Recalculate Panel */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="space-y-3 flex-1 text-center md:text-left">
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                        <span>✨</span> Overall Child Wellness Score
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                        This composite intelligence score is derived by evaluating height-weight-age percentiles, physical activity logs, sleep patterns, dietary preferences, water intake, screen time limits, and clinical backgrounds.
                    </p>
                    <div className="flex justify-center md:justify-start pt-2">
                        <button
                            onClick={handleReanalyze}
                            disabled={reanalyzing}
                            className="px-5 py-2.5 bg-primary text-white font-extrabold text-sm rounded-xl shadow-md hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {reanalyzing ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Recalculating...
                                </>
                            ) : (
                                <>
                                    <span>🔄</span> Recalculate Wellness Analysis
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className={`${scoreVibe.bg} border-2 border-white rounded-[2rem] p-6 text-center shadow-inner md:w-64 w-full shrink-0 flex flex-col items-center justify-center`}>
                    <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" className="stroke-gray-100" strokeWidth="8" fill="transparent" />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="transition-all duration-1000 ease-out"
                                stroke={scoreVibe.stroke}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="251.2"
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-black ${scoreVibe.text}`}>{score}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Points</span>
                        </div>
                    </div>
                    <p className={`text-base font-black ${scoreVibe.text} mb-1`}>
                        {score >= 80 ? 'Excellent Standing' : score >= 60 ? 'Moderate standing' : 'Attention Advised'}
                    </p>
                </div>
            </motion.div>

            {/* Concerns, Monitor, Strengths */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Concerns (Red) */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl font-bold shadow-sm">
                            ⚠️
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Current Concerns</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase">Areas Requiring Attention</p>
                        </div>
                    </div>

                    {wellness.concerns.length === 0 ? (
                        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-3xl p-8 text-center text-gray-500">
                            <span className="text-3xl mb-3 block">🎉</span>
                            <p className="font-extrabold text-emerald-800 text-sm">No Concerns Found</p>
                            <p className="text-[11px] text-gray-400 mt-1">Your child currently meets all growth and habit targets.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wellness.concerns.map((concern, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-gradient-to-br from-red-50/30 to-red-100/10 border border-red-100 rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition duration-300"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-black text-red-950 text-base leading-snug">
                                                {concern.issue}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${concern.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {concern.priority}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider mb-0.5">Why It Matters</p>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                {concern.whyItMatters}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-red-200/20">
                                            <p className="text-[10px] text-red-900 font-bold uppercase tracking-wider mb-0.5">Potential Impact</p>
                                            <p className="text-xs text-red-950 leading-relaxed font-bold">
                                                {concern.healthImpact}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* 2. Monitor Closely (Yellow) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl font-bold shadow-sm">
                            👀
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Monitor Closely</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase">Moderate Indicators</p>
                        </div>
                    </div>

                    {wellness.monitor.length === 0 ? (
                        <div className="bg-gray-50 border rounded-3xl p-8 text-center text-gray-500">
                            <span className="text-3xl mb-3 block">✅</span>
                            <p className="font-extrabold text-gray-700 text-sm">Nothing to Monitor</p>
                            <p className="text-[11px] text-gray-400 mt-1">There are no borderline health parameters at present.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wellness.monitor.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-gradient-to-br from-amber-50/30 to-amber-100/10 border border-amber-100 rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition duration-300"
                                >
                                    <div className="space-y-2">
                                        <h3 className="font-black text-amber-950 text-base leading-snug">
                                            {item.issue}
                                        </h3>
                                        <div>
                                            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-0.5">Observation</p>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                {item.whyItMatters}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* 3. Strengths (Green) */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl font-bold shadow-sm">
                            💪
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Strengths</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase">Healthy Habits & Metrics</p>
                        </div>
                    </div>

                    {wellness.strengths.length === 0 ? (
                        <div className="bg-gray-50 border rounded-3xl p-8 text-center text-gray-500">
                            <span className="text-3xl mb-3 block">🌱</span>
                            <p className="font-extrabold text-gray-700 text-sm">No Strengths Tracked</p>
                            <p className="text-[11px] text-gray-400 mt-1">Strengths appear as daily logs and measurements improve.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wellness.strengths.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-gradient-to-br from-emerald-50/30 to-emerald-100/10 border border-emerald-100 rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition duration-300"
                                >
                                    <div className="space-y-3">
                                        <h3 className="font-black text-emerald-950 text-base leading-snug">
                                            {item.strength}
                                        </h3>
                                        <div>
                                            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-0.5">Benefit</p>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                {item.benefit}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-emerald-200/20">
                                            <p className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider mb-0.5">Recommendation to Maintain</p>
                                            <p className="text-xs text-emerald-950 leading-relaxed font-bold">
                                                {item.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* NutriKids Recommendations / Roadmap */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-6"
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
                    {wellness.recommendations.map((rec, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-200 hover:shadow-md transition duration-300"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">{rec.icon || '🚀'}</span>
                                    <span className="text-[10px] text-indigo-700 font-black bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50 uppercase">
                                        Roadmap Card
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Current Concern</p>
                                    <p className="font-extrabold text-gray-900 text-sm leading-snug">{rec.concern}</p>
                                </div>
                                <div className="space-y-1 pt-2 border-t border-indigo-100/30">
                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">NutriKids Feature</p>
                                    <p className="font-bold text-gray-800 text-sm">{rec.solution}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Expected Improvement</p>
                                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{rec.expectedImprovement}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Parent Conversion Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-indigo-650 to-blue-700 text-white rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 mt-12"
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="space-y-4 relative z-10 text-center md:text-left max-w-xl">
                    <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md text-white font-black text-xs uppercase tracking-widest rounded-full">
                        Unlock Advanced Support
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black leading-tight">
                        Power up with Premium Features
                    </h3>
                    <p className="text-indigo-100 text-sm font-semibold leading-relaxed">
                        Get advanced, clinical-grade nutrition monitoring and customized interactive food buddy assistants for your children.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs font-bold text-indigo-100">
                        <span className="flex items-center gap-1">✨ AI Nutrition Assistant</span>
                        <span className="flex items-center gap-1">✨ Personalized Meal Plans</span>
                        <span className="flex items-center gap-1">✨ Growth Tracking</span>
                        <span className="flex items-center gap-1">✨ Food Buddy</span>
                        <span className="flex items-center gap-1">✨ Dietitian Support</span>
                    </div>
                </div>

                <div className="relative z-10 shrink-0 w-full md:w-auto text-center">
                    <button
                        onClick={() => router.push('/pricing')}
                        className="w-full md:w-auto px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        View Plans
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default WellnessAnalysis;

