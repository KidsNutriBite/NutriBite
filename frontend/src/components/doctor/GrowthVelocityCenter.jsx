"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, LineChart, Line, ComposedChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend, Scatter, ScatterChart
} from 'recharts';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
    <div className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse rounded-xl ${className}`} />
);

const CardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-16 w-full" />
    </div>
);

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    HEALTHY:             { color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: '✓' },
    ABOVE_EXPECTED:      { color: '#3b82f6', bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',    icon: '↑' },
    SLIGHTLY_BELOW:      { color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   icon: '↓' },
    BELOW_EXPECTED:      { color: '#f97316', bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700',  icon: '⚠' },
    CRITICALLY_LOW:      { color: '#ef4444', bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',       icon: '!' },
    RAPID_ACCELERATING:  { color: '#8b5cf6', bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700',  icon: '↑↑' },
    UNKNOWN:             { color: '#6b7280', bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-500',    badge: 'bg-gray-100 text-gray-500',     icon: '?' },
};

const RISK_LABEL = {
    HEIGHT_PLATEAU:             { label: 'Height Plateau',          color: 'bg-red-100 text-red-700' },
    WEIGHT_PLATEAU:             { label: 'Weight Plateau',          color: 'bg-red-100 text-red-700' },
    BMI_SPIKE:                  { label: 'BMI Spike',               color: 'bg-violet-100 text-violet-700' },
    UNEXPECTED_WEIGHT_DROP:     { label: 'Unexpected Weight Drop',   color: 'bg-red-100 text-red-700' },
    GROWTH_REVERSAL:            { label: 'Growth Reversal',         color: 'bg-red-100 text-red-700' },
    GROWTH_STAGNATION:          { label: 'Growth Stagnation',       color: 'bg-orange-100 text-orange-700' },
    SIGNIFICANT_PERCENTILE_DROP:{ label: 'Significant Percentile Drop', color: 'bg-red-100 text-red-700' },
    MILD_PERCENTILE_DROP:       { label: 'Mild Percentile Drop',    color: 'bg-amber-100 text-amber-700' },
    RAPID_WEIGHT_GAIN:          { label: 'Rapid Weight Gain',       color: 'bg-violet-100 text-violet-700' },
};

// ─── Score Gauge ──────────────────────────────────────────────────────────────
const ScoreGauge = ({ score, label, colorStops }) => {
    const safeScore = score ?? 0;
    const [color] = colorStops.filter(([threshold]) => safeScore <= threshold).slice(0, 1);
    const gaugeColor = color?.[1] ?? colorStops[colorStops.length - 1][1];

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={gaugeColor} strokeWidth="3"
                        strokeDasharray={`${safeScore} 100`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-gray-900">{safeScore}</span>
                </div>
            </div>
            <p className="text-xs font-bold text-gray-500 text-center">{label}</p>
        </div>
    );
};

// ─── Velocity Card ────────────────────────────────────────────────────────────
const VelocityCard = ({ title, icon, actual, expected, unit, status, display, delay = 0 }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
    const pct = expected > 0 ? Math.min(150, Math.round((actual / expected) * 100)) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className={`relative overflow-hidden rounded-2xl p-6 border ${cfg.border} ${cfg.bg} shadow-sm`}
        >
            {/* Decorative arc */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10" style={{ background: cfg.color }} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">{actual?.toFixed(2) ?? '—'}</span>
                        <span className="text-sm text-gray-500 font-medium">{unit}</span>
                    </div>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Expected: {expected} {unit}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${cfg.badge}`}>
                        {cfg.icon} {display?.label ?? status}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full"
                        style={{ background: cfg.color }}
                    />
                </div>
                <p className="text-xs text-gray-400">{pct}% of expected velocity</p>
            </div>
        </motion.div>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl text-xs">
            <p className="font-bold text-gray-700 mb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-gray-600">{entry.name}:</span>
                    <span className="font-bold text-gray-900">
                        {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── No Data State ────────────────────────────────────────────────────────────
const NoDataState = ({ reason }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
    >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <span className="text-4xl">📏</span>
        </div>
        <h3 className="text-xl font-black text-gray-700 mb-2">Insufficient Growth Data</h3>
        <p className="text-gray-500 text-sm max-w-md leading-relaxed">{reason}</p>
        <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl max-w-sm">
            <p className="text-xs text-blue-700 font-medium">
                Record at least 2 height/weight measurements to enable velocity analysis.
            </p>
        </div>
    </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const GrowthVelocityCenter = ({ data, profile, loading }) => {

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    if (!data) return null;

    const { insufficientData, insufficientDataReason, fastApiUnavailable } = data;
    if (insufficientData) return <NoDataState reason={insufficientDataReason} />;

    const { velocityMetrics = {}, velocityTimeline = [], growthTimeline = [],
            percentileDrift = {}, stabilityScore, riskScore,
            riskIndicators = [], insights = [], recommendations = [],
            currentMetrics = {}, recordCount, verifiedRecordCount } = data;

    const { heightVelocity, weightVelocity, bmiVelocity } = velocityMetrics;

    const driftConfig = {
        DECLINING: { color: '#ef4444', icon: '↘', label: 'Declining' },
        RISING:    { color: '#10b981', icon: '↗', label: 'Rising' },
        STABLE:    { color: '#6b7280', icon: '→', label: 'Stable' },
    }[percentileDrift.direction] || { color: '#6b7280', icon: '→', label: 'Stable' };

    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">📈</div>
                    <div>
                        <h2 className="text-xl font-black">Growth Velocity Center</h2>
                        <p className="text-blue-100 text-sm">
                            {recordCount} measurements • {verifiedRecordCount ?? 0} clinically verified
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ScoreGauge
                        score={stabilityScore}
                        label="Stability"
                        colorStops={[[30, '#ef4444'], [60, '#f59e0b'], [100, '#10b981']]}
                    />
                    <ScoreGauge
                        score={riskScore}
                        label="Risk"
                        colorStops={[[30, '#10b981'], [60, '#f59e0b'], [100, '#ef4444']]}
                    />
                </div>
            </motion.div>

            {fastApiUnavailable && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    <span className="text-lg">⚠️</span>
                    <p>AI velocity engine is temporarily offline. Raw growth data is shown below. Velocity calculations will resume when the AI service reconnects.</p>
                </div>
            )}

            {/* ── Velocity Summary Cards ────────────────────────────────────── */}
            {heightVelocity && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <VelocityCard
                        title="Height Velocity"
                        icon="📏"
                        actual={heightVelocity.actual}
                        expected={heightVelocity.expected}
                        unit="cm/mo"
                        status={heightVelocity.status}
                        display={heightVelocity.display}
                        delay={0}
                    />
                    <VelocityCard
                        title="Weight Velocity"
                        icon="⚖️"
                        actual={weightVelocity?.actual}
                        expected={weightVelocity?.expected}
                        unit="kg/mo"
                        status={weightVelocity?.status}
                        display={weightVelocity?.display}
                        delay={0.1}
                    />
                    <VelocityCard
                        title="BMI Velocity"
                        icon="🧮"
                        actual={bmiVelocity?.actual}
                        expected={bmiVelocity?.expected}
                        unit="BMI/mo"
                        status={bmiVelocity?.status}
                        display={bmiVelocity?.display}
                        delay={0.2}
                    />
                </div>
            )}

            {/* ── Risk Indicators Row ───────────────────────────────────────── */}
            {riskIndicators.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-red-50 border border-red-100"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <h3 className="font-bold text-red-800 text-sm uppercase tracking-wider">Risk Indicators Detected</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {riskIndicators.map(risk => {
                            const r = RISK_LABEL[risk] || { label: risk, color: 'bg-gray-100 text-gray-700' };
                            return (
                                <span key={risk} className={`px-3 py-1 rounded-full text-xs font-bold ${r.color}`}>
                                    {r.label}
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Growth Trend Chart ────────────────────────────────────────── */}
            {growthTimeline.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-base">📊</div>
                        <div>
                            <h3 className="font-bold text-gray-900">Growth Trend</h3>
                            <p className="text-xs text-gray-400">Height & Weight over time</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={growthTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                            <YAxis yAxisId="h" orientation="left" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="cm" domain={['auto', 'auto']} />
                            <YAxis yAxisId="w" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="kg" domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area yAxisId="h" type="monotone" dataKey="height" name="Height (cm)"
                                stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            <Line yAxisId="w" type="monotone" dataKey="weight" name="Weight (kg)"
                                stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* ── Velocity Trend Chart ──────────────────────────────────────── */}
            {velocityTimeline.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base">⚡</div>
                        <div>
                            <h3 className="font-bold text-gray-900">Velocity Trend</h3>
                            <p className="text-xs text-gray-400">cm/month and kg/month over time — WHO bands shown as reference</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={velocityTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                            <YAxis yAxisId="h" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="cm" />
                            <YAxis yAxisId="w" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="kg" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            {/* WHO expected velocity reference lines */}
                            {heightVelocity && (
                                <ReferenceLine yAxisId="h" y={heightVelocity.expected}
                                    stroke="#3b82f6" strokeDasharray="6 3" strokeWidth={1.5}
                                    label={{ value: `WHO H: ${heightVelocity.expected}`, position: 'insideTopRight', fontSize: 10, fill: '#3b82f6' }} />
                            )}
                            {weightVelocity && (
                                <ReferenceLine yAxisId="w" y={weightVelocity.expected}
                                    stroke="#10b981" strokeDasharray="6 3" strokeWidth={1.5}
                                    label={{ value: `WHO W: ${weightVelocity.expected}`, position: 'insideTopLeft', fontSize: 10, fill: '#10b981' }} />
                            )}
                            <Line yAxisId="h" type="monotone" dataKey="heightVelocity" name="Height Vel. (cm/mo)"
                                stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="w" type="monotone" dataKey="weightVelocity" name="Weight Vel. (kg/mo)"
                                stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* ── Percentile Movement Chart ─────────────────────────────────── */}
            {growthTimeline.some(t => t.percentile) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-base">🎯</div>
                            <div>
                                <h3 className="font-bold text-gray-900">Percentile Movement</h3>
                                <p className="text-xs text-gray-400">Growth percentile trajectory over time</p>
                            </div>
                        </div>
                        {/* Drift badge */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ borderColor: driftConfig.color + '40', background: driftConfig.color + '10' }}>
                            <span className="text-lg font-black" style={{ color: driftConfig.color }}>{driftConfig.icon}</span>
                            <div>
                                <p className="text-xs font-bold" style={{ color: driftConfig.color }}>{driftConfig.label}</p>
                                {percentileDrift.magnitude > 0 && (
                                    <p className="text-xs text-gray-400">{percentileDrift.magnitude} pts drift</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={growthTimeline.filter(t => t.percentile)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={[0, 100]} unit="th" />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Reference percentile bands */}
                            <ReferenceLine y={5}  stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: '5th', position: 'insideRight', fontSize: 9, fill: '#ef4444' }} />
                            <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} label={{ value: '25th', position: 'insideRight', fontSize: 9, fill: '#f59e0b' }} />
                            <ReferenceLine y={50} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: '50th', position: 'insideRight', fontSize: 9, fill: '#10b981' }} />
                            <ReferenceLine y={75} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1} label={{ value: '75th', position: 'insideRight', fontSize: 9, fill: '#3b82f6' }} />
                            <ReferenceLine y={95} stroke="#8b5cf6" strokeDasharray="4 4" strokeWidth={1} label={{ value: '95th', position: 'insideRight', fontSize: 9, fill: '#8b5cf6' }} />
                            <Area type="monotone" dataKey="percentile" name="Percentile"
                                stroke={driftConfig.color} fill={driftConfig.color + '20'}
                                strokeWidth={2.5} dot={{ r: 5, fill: driftConfig.color }} activeDot={{ r: 7 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    {percentileDrift.insight && (
                        <p className="mt-3 text-xs text-gray-500 italic px-2">💬 {percentileDrift.insight}</p>
                    )}
                </motion.div>
            )}

            {/* ── AI Insights Panel ─────────────────────────────────────────── */}
            {insights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-base">🤖</div>
                        <div>
                            <h3 className="font-bold text-gray-900">Growth Insights</h3>
                            <p className="text-xs text-gray-400">Clinical intelligence from WHO-referenced velocity analysis</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {insights.map((insight, i) => {
                            const isWarning = insight.toLowerCase().includes('below') || insight.toLowerCase().includes('slow') || insight.toLowerCase().includes('⚠');
                            const isCritical = insight.toLowerCase().includes('critical') || insight.toLowerCase().includes('urgent');
                            const bgClass = isCritical ? 'bg-red-50 border-red-100' : isWarning ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100';
                            const dotColor = isCritical ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-blue-400';
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.65 + i * 0.07 }}
                                    className={`flex gap-3 p-4 rounded-xl border ${bgClass}`}
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                    <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Recommendations Panel ─────────────────────────────────────── */}
            {recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm p-6"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-base">💊</div>
                        <div>
                            <h3 className="font-bold text-gray-900">Clinical Recommendations</h3>
                            <p className="text-xs text-gray-500">Based on velocity analysis and WHO standards</p>
                        </div>
                    </div>
                    <ol className="space-y-3">
                        {recommendations.map((rec, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.75 + i * 0.06 }}
                                className="flex items-start gap-3"
                            >
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                            </motion.li>
                        ))}
                    </ol>
                </motion.div>
            )}

            {/* ── Current Metrics Footer ────────────────────────────────────── */}
            {currentMetrics.height && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                    {[
                        { label: 'Height', value: `${currentMetrics.height} cm`, icon: '📏' },
                        { label: 'Weight', value: `${currentMetrics.weight} kg`, icon: '⚖️' },
                        { label: 'BMI', value: currentMetrics.bmi?.toFixed(1) ?? '—', icon: '🧮' },
                        { label: 'Percentile', value: currentMetrics.percentile ? `${Math.round(currentMetrics.percentile)}th` : '—', icon: '🎯' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                            <p className="text-xl mb-1">{icon}</p>
                            <p className="text-lg font-black text-gray-900">{value}</p>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default GrowthVelocityCenter;
