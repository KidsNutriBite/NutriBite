"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

const DoctorTwinView = ({ profileId, profile }) => {
    const [twinData, setTwinData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTwinData = async () => {
        try {
            setLoading(true);
            const data = await getDigitalTwin(profileId);
            setTwinData(data);
        } catch (error) {
            console.error("Doctor Twin request failed", error);
            toast.error("Unable to load patient digital twin details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileId) {
            fetchTwinData();
        }
    }, [profileId]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse py-6 font-sans">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    if (!twinData) {
        return (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[2rem] shadow-sm">
                <span className="text-5xl mb-3 inline-block">🩺</span>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">Twin Diagnostics Offline</h4>
                <p className="text-slate-500 max-w-sm mx-auto text-sm mt-1">Unable to compile patient twin logs. Please verify their record completeness.</p>
            </div>
        );
    }

    const radarChartData = [
        { subject: 'Protein', value: twinData.radarMetrics.protein, fullMark: 100 },
        { subject: 'Calcium', value: twinData.radarMetrics.calcium, fullMark: 100 },
        { subject: 'Iron', value: twinData.radarMetrics.iron, fullMark: 100 },
        { subject: 'Vitamins', value: twinData.radarMetrics.vitamins, fullMark: 100 },
        { subject: 'Hydration', value: twinData.radarMetrics.hydration, fullMark: 100 },
        { subject: 'Consistency', value: twinData.radarMetrics.consistency, fullMark: 100 },
    ];

    return (
        <div className="space-y-8 font-sans">
            {/* Header info */}
            <div>
                <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/20 mb-2">Clinical Diagnostics</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Patient Twin Diagnostics</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Read-only digital health replica aggregating growth logs, nutrition indices, and predicted risks.</p>
            </div>

            {/* Diagnostic Core Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Status</span>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-1">{twinData.summary}</h4>
                    <p className="text-xs text-slate-500">Based on recent dietary intake and metrics.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nutritional Adequacy</span>
                    <h4 className="text-3xl font-black text-slate-800 dark:text-white mt-2 mb-1">{twinData.nutritionScore} <span className="text-slate-400 text-sm font-bold">/100</span></h4>
                    <p className="text-xs text-slate-500">Combined micronutrient & consistency score.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Future Deficit Risk</span>
                    <h4 className="text-3xl font-black text-rose-500 mt-2 mb-1">{twinData.riskScore}%</h4>
                    <p className="text-xs text-slate-500">AI computed probability of clinical gaps.</p>
                </div>
            </div>

            {/* Diagnostics details row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Clinical Radar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nutrient Gaps Map</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                                <Radar
                                    name="Nutrient Score"
                                    dataKey="value"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth and weight predictions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Projected Growth Trajectory</h3>
                    <div className="space-y-4">
                        {[
                            { key: 'day30', label: '30 Days Projection', val: twinData.predictions.day30 },
                            { key: 'day90', label: '90 Days Projection', val: twinData.predictions.day90 },
                            { key: 'day180', label: '180 Days Projection', val: twinData.predictions.day180 },
                        ].map((t) => (
                            <div key={t.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-150 text-sm">{t.label}</p>
                                    <p className="text-xs text-slate-400 mt-1 italic">"{t.val.status}" (Conf: {t.val.confidencePct}%)</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 dark:text-white text-sm">Weight: {t.val.expectedWeight} kg</p>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Height: {t.val.expectedHeight} cm</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Diagnostic bullet insights */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-[2rem] shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">assignment_turned_in</span>
                    Diagnostic Summary & Observations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {twinData.insights.map((insight, idx) => {
                        const isWarning = insight.toLowerCase().includes("warning") || insight.toLowerCase().includes("deficient") || insight.toLowerCase().includes("sugary") || insight.toLowerCase().includes("risk");
                        
                        return (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-xl flex gap-3 border ${
                                    isWarning ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/30' :
                                    'bg-slate-50/40 dark:bg-slate-850/40 border-slate-100 dark:border-slate-800'
                                }`}
                            >
                                <span className={`material-symbols-outlined shrink-0 text-lg ${
                                    isWarning ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                                }`}>
                                    {isWarning ? 'warning_amber' : 'check_circle'}
                                </span>
                                <p className="text-slate-600 dark:text-slate-350 text-xs font-semibold leading-relaxed">
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

export default DoctorTwinView;
