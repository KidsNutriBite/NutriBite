"use client";
import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line,
} from 'recharts';

// ─── Age-based recommended daily intake ──────────────────────────────────────
const getTargets = (age = 8) => {
    if (age <= 3)  return { calories: 1200, protein: 16,  carbs: 130, fats: 40,  fiber: 19, water: 1300 };
    if (age <= 6)  return { calories: 1400, protein: 24,  carbs: 160, fats: 44,  fiber: 22, water: 1600 };
    if (age <= 9)  return { calories: 1600, protein: 28,  carbs: 200, fats: 50,  fiber: 25, water: 1900 };
    if (age <= 13) return { calories: 1800, protein: 34,  carbs: 230, fats: 56,  fiber: 26, water: 2100 };
    return              { calories: 2000, protein: 46,  carbs: 260, fats: 65,  fiber: 28, water: 2400 };
};

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CalorieTooltip = ({ active, payload, label, target }) => {
    if (active && payload && payload.length) {
        const val = payload[0]?.value ?? 0;
        const pct = Math.round((val / target) * 100);
        const color = pct < 70 ? '#f97316' : pct > 120 ? '#ef4444' : '#10b981';
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 min-w-[160px]">
                <p className="font-bold text-gray-700 text-xs mb-1">{label}</p>
                <p className="font-black text-lg" style={{ color }}>{val} <span className="text-xs font-bold text-gray-400">kcal</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{pct}% of {target} kcal goal</p>
            </div>
        );
    }
    return null;
};

const MacroTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                <p className="font-bold text-gray-700 text-xs mb-2">{label}</p>
                {payload.map(p => (
                    <p key={p.name} className="text-xs text-gray-700 flex justify-between gap-6">
                        <span className="font-bold" style={{ color: p.color }}>{p.name}</span>
                        <span className="font-semibold">{p.value} g</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const GapTooltip = ({ active, payload, label, target }) => {
    if (active && payload && payload.length) {
        const val = payload[0]?.value ?? 0;
        const isOver = val > 0;
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 min-w-[180px]">
                <p className="font-bold text-gray-700 text-xs mb-1">{label}</p>
                <p className={`font-black text-base ${isOver ? 'text-red-600' : 'text-blue-600'}`}>
                    {isOver ? '+' : ''}{val} kcal
                </p>
                <p className="text-xs text-gray-400">{isOver ? 'Above' : 'Below'} target of {target} kcal</p>
            </div>
        );
    }
    return null;
};

// ─── Macro stat card ──────────────────────────────────────────────────────────
const MacroCard = ({ label, current, target, color, unit = 'g', icon }) => {
    const pct = Math.min(Math.round((current / target) * 100), 100);
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{icon} {label}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>{pct}%</span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">{current}<span className="text-sm font-semibold text-gray-400 ml-1">{unit}</span></p>
            <p className="text-xs text-gray-400">Goal: {target}{unit}/day</p>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

// ─── Weekly Nutrition Heatmap ─────────────────────────────────────────────────
const NutritionHeatmap = ({ data, targets }) => {
    const nutrients = [
        { key: 'calories', label: 'Calories', target: targets.calories, unit: 'kcal' },
        { key: 'protein',  label: 'Protein',  target: targets.protein,  unit: 'g' },
        { key: 'carbs',    label: 'Carbs',    target: targets.carbs,    unit: 'g' },
        { key: 'fats',     label: 'Fats',     target: targets.fats,     unit: 'g' },
        { key: 'fiber',    label: 'Fiber',    target: targets.fiber,    unit: 'g' },
    ];

    const last7 = data.slice(-7);

    const getCellColor = (value, target) => {
        if (!value || value === 0) return { bg: 'bg-gray-100', text: 'text-gray-300' };
        const pct = (value / target) * 100;
        if (pct >= 90 && pct <= 130) return { bg: 'bg-emerald-500', text: 'text-white' };
        if (pct >= 70 && pct < 90)  return { bg: 'bg-amber-400',   text: 'text-white' };
        if (pct > 130)               return { bg: 'bg-red-500',     text: 'text-white' };
        return { bg: 'bg-red-200', text: 'text-red-800' };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span className="font-bold text-gray-700">Legend:</span>
                {[
                    { bg: 'bg-emerald-500', label: '90–130% (On target)' },
                    { bg: 'bg-amber-400',   label: '70–89% (Under)' },
                    { bg: 'bg-red-200',     label: '<70% (Deficit)' },
                    { bg: 'bg-red-500',     label: '>130% (Excess)' },
                    { bg: 'bg-gray-100',    label: 'No data' },
                ].map(({ bg, label }) => (
                    <span key={label} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded ${bg} inline-block`} />
                        {label}
                    </span>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="text-left text-gray-400 font-bold py-1 pr-3 min-w-[80px]">Nutrient</th>
                            {last7.map((d, i) => (
                                <th key={i} className="text-center text-gray-400 font-bold py-1 px-1 min-w-[60px]">
                                    {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {nutrients.map(({ key, label, target, unit }) => (
                            <tr key={key}>
                                <td className="text-gray-600 font-bold py-1 pr-3 whitespace-nowrap">{label}</td>
                                {last7.map((d, i) => {
                                    const val = d[key] || 0;
                                    const { bg, text } = getCellColor(val, target);
                                    return (
                                        <td key={i} className="text-center py-1 px-1">
                                            <div className={`${bg} ${text} rounded-lg py-2 px-1 font-black text-[10px] transition-all hover:scale-105 cursor-default`}
                                                title={`${label}: ${val}${unit} (target: ${target}${unit})`}>
                                                {val ? Math.round(val) : '—'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Radar Chart for Macro Balance ───────────────────────────────────────────
const MacroRadar = ({ data, targets }) => {
    const last7 = data.slice(-7);
    const avg = (key) => last7.length ? Math.round(last7.reduce((s, d) => s + (d[key] || 0), 0) / last7.length) : 0;

    const radarData = [
        { subject: 'Calories', actual: Math.min(Math.round((avg('calories') / targets.calories) * 100), 150), fullMark: 100 },
        { subject: 'Protein',  actual: Math.min(Math.round((avg('protein')  / targets.protein)  * 100), 150), fullMark: 100 },
        { subject: 'Carbs',    actual: Math.min(Math.round((avg('carbs')    / targets.carbs)    * 100), 150), fullMark: 100 },
        { subject: 'Fats',     actual: Math.min(Math.round((avg('fats')     / targets.fats)     * 100), 150), fullMark: 100 },
        { subject: 'Fiber',    actual: Math.min(Math.round((avg('fiber')    / targets.fiber)    * 100), 150), fullMark: 100 },
    ];

    const CustomRadarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0];
            return (
                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                    <p className="font-bold text-xs text-gray-700 mb-1">{d.payload.subject}</p>
                    <p className="font-black text-sm text-indigo-600">{d.value}% of daily goal</p>
                    <p className="text-xs text-gray-400">{d.value >= 90 && d.value <= 110 ? '✅ On target' : d.value < 90 ? '⚠️ Under target' : '🔴 Excess'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-400">Average % of daily target met (last 7 days). 100% = exactly on target. Ideal shape is a balanced pentagon touching 100%.</p>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 130]}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickCount={4}
                        />
                        <Radar
                            name="Daily Average"
                            dataKey="actual"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.25}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                        />
                        {/* Ideal reference at 100% */}
                        <Radar
                            name="Ideal Target (100%)"
                            dataKey="fullMark"
                            stroke="#10b981"
                            fill="transparent"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                        />
                        <Tooltip content={<CustomRadarTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {/* Mini cards */}
            <div className="grid grid-cols-5 gap-2">
                {radarData.map(({ subject, actual }) => {
                    const color = actual >= 90 && actual <= 110 ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                        : actual < 90 ? 'text-amber-600 bg-amber-50 border-amber-100'
                        : 'text-red-600 bg-red-50 border-red-100';
                    return (
                        <div key={subject} className={`p-2 rounded-xl border text-center ${color}`}>
                            <p className="text-[10px] font-black uppercase">{subject}</p>
                            <p className="text-base font-black">{actual}%</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Calorie Gap Analysis ────────────────────────────────────────────────────
const CalorieGapChart = ({ data, targets }) => {
    const gapData = data.map(d => ({
        label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        gap: Math.round((d.calories || 0) - targets.calories),
        calories: d.calories || 0,
    }));

    const avgGap = gapData.length ? Math.round(gapData.reduce((s, d) => s + d.gap, 0) / gapData.length) : 0;
    const daysOver = gapData.filter(d => d.gap > 0).length;
    const daysUnder = gapData.filter(d => d.gap < 0).length;

    return (
        <div className="space-y-4">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Avg Daily Gap</p>
                    <p className={`text-xl font-black ${avgGap > 0 ? 'text-red-600' : avgGap < 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {avgGap > 0 ? '+' : ''}{avgGap} kcal
                    </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Days Over Target</p>
                    <p className="text-xl font-black text-red-600">{daysOver} days</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Days Under Target</p>
                    <p className="text-xl font-black text-blue-600">{daysUnder} days</p>
                </div>
            </div>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gapData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<GapTooltip target={targets.calories} />} cursor={{ fill: '#f9fafb', radius: 8 }} />
                        <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#9ca3af' }} />
                        <Bar dataKey="gap" radius={[5, 5, 0, 0]} maxBarSize={40} name="Calorie Gap">
                            {gapData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.gap > 0 ? '#ef4444' : entry.gap < -300 ? '#3b82f6' : '#60a5fa'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-center">
                🔴 Red = exceeded daily target · 🔵 Blue = below target · Target: <strong className="text-gray-600">{targets.calories} kcal/day</strong>
            </p>
        </div>
    );
};

// ─── Doctor Summary Panel ────────────────────────────────────────────────────
const DoctorSummary = ({ data, targets }) => {
    const last7 = data.slice(-7);
    if (last7.length === 0) return null;

    const avg = (key) => Math.round(last7.reduce((s, d) => s + (d[key] || 0), 0) / last7.length);
    const avgCals   = avg('calories');
    const avgProt   = avg('protein');
    const avgCarbs  = avg('carbs');
    const avgFats   = avg('fats');
    const daysLogged = last7.filter(d => (d.calories || 0) > 0).length;

    const calStatus  = avgCals >= targets.calories * 0.85 && avgCals <= targets.calories * 1.2 ? '✅ On target' : avgCals < targets.calories * 0.85 ? '⚠️ Under' : '🔴 Excess';
    const protStatus = avgProt >= targets.protein * 0.85 ? '✅ Adequate' : '⚠️ Deficit';

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕️</span>
                <div>
                    <h4 className="font-black text-sm">Clinical Summary (Last 7 Days)</h4>
                    <p className="text-slate-400 text-xs">For doctor/parent review — generated from meal logs</p>
                </div>
                <span className="ml-auto bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">{daysLogged}/7 days logged</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Avg Calories',  val: `${avgCals} kcal`,  target: `${targets.calories} kcal`, status: calStatus,  color: 'text-orange-400' },
                    { label: 'Avg Protein',   val: `${avgProt} g`,     target: `${targets.protein} g`,    status: protStatus, color: 'text-blue-400' },
                    { label: 'Avg Carbs',     val: `${avgCarbs} g`,    target: `${targets.carbs} g`,      status: Math.abs(avgCarbs - targets.carbs) < targets.carbs * 0.2 ? '✅ On target' : '⚠️ Monitor', color: 'text-yellow-400' },
                    { label: 'Avg Fats',      val: `${avgFats} g`,     target: `${targets.fats} g`,       status: Math.abs(avgFats - targets.fats) < targets.fats * 0.25 ? '✅ On target' : '⚠️ Monitor', color: 'text-purple-400' },
                ].map(({ label, val, target, status, color }) => (
                    <div key={label} className="bg-slate-800 rounded-xl p-3">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-lg font-black ${color}`}>{val}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">Target: {target}</p>
                        <p className="text-[11px] font-bold mt-1">{status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
    <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200 space-y-3">
        <div className="text-5xl">📊</div>
        <p className="text-gray-700 font-bold text-lg">No nutrition data yet</p>
        <p className="text-gray-400 text-sm">Start logging meals to see calorie and macronutrient trends here.</p>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const NutritionTrendsChart = ({ data = [], mealFrequencyData = [], profile }) => {
    const [activeTab, setActiveTab] = useState('calories');

    const targets = useMemo(() => getTargets(profile?.age || 8), [profile]);

    if (!data || data.length === 0) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Nutrition Trends</h2>
                {mealFrequencyData.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Weekly Meal Activity</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mealFrequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" name="Meals Logged" fill="#2b9dee" radius={[6, 6, 0, 0]} maxBarSize={44} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                <EmptyState />
            </div>
        );
    }

    const chartData = data.map(d => ({
        ...d,
        label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));

    const latest = data[data.length - 1] || {};
    const avgCalories = data.length ? Math.round(data.reduce((s, d) => s + (d.calories || 0), 0) / data.length) : 0;

    const getBarColor = (value) => {
        const pct = value / targets.calories;
        if (pct < 0.7)  return '#f97316';
        if (pct > 1.2)  return '#ef4444';
        return '#10b981';
    };

    const tabs = [
        { id: 'calories',  label: 'Calories',        icon: '🔥' },
        { id: 'macros',    label: 'Macros',           icon: '🥗' },
        { id: 'radar',     label: 'Balance Radar',    icon: '🎯' },
        { id: 'gap',       label: 'Calorie Gap',      icon: '📉' },
        { id: 'heatmap',   label: 'Nutrient Heatmap', icon: '🗓️' },
        { id: 'meals',     label: 'Meal Activity',    icon: '🍽️' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Nutrition Trends</h2>
                <span className="text-xs text-gray-400 font-medium">Last {data.length} days · Age {profile?.age || 8}yr targets</span>
            </div>

            {/* Doctor Summary */}
            <DoctorSummary data={data} targets={targets} />

            {/* Summary Macro Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-orange-50 to-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                    <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Avg Daily Calories</p>
                    <p className="text-3xl font-black text-gray-900">{avgCalories}</p>
                    <p className="text-xs text-gray-400 mt-1">Goal: {targets.calories} kcal</p>
                    <div className="mt-2 h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.min((avgCalories / targets.calories) * 100, 100)}%` }} />
                    </div>
                </div>
                <MacroCard label="Protein"  current={latest.protein || 0} target={targets.protein} color="#3b82f6" icon="💪" />
                <MacroCard label="Carbs"    current={latest.carbs   || 0} target={targets.carbs}   color="#f59e0b" icon="🌾" />
                <MacroCard label="Fats"     current={latest.fats    || 0} target={targets.fats}    color="#a855f7" icon="🥑" />
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all flex-1 justify-center md:flex-none ${
                            activeTab === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Calorie Bar Chart ── */}
            {activeTab === 'calories' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Daily Calorie Intake</h3>
                    <p className="text-xs text-gray-400 mb-5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />On target &nbsp;
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />Under &nbsp;
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />Over
                    </p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CalorieTooltip target={targets.calories} />} cursor={{ fill: '#f9fafb', radius: 8 }} />
                                <ReferenceLine y={targets.calories} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5}
                                    label={{ value: `Target: ${targets.calories}`, position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
                                <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={44}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.calories)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Daily target: <strong className="text-gray-600">{targets.calories} kcal</strong> (age-adjusted for {profile?.age || 8} yrs)
                    </p>
                </div>
            )}

            {/* ── Macronutrient Stacked Area Chart ── */}
            {activeTab === 'macros' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Macronutrient Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-5">Protein, Carbohydrates and Fats (grams per day)</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    {[['Protein','#3b82f6'],['Carbs','#f59e0b'],['Fats','#a855f7']].map(([name, color]) => (
                                        <linearGradient key={name} id={`color${name}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<MacroTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorProtein)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="carbs"   name="Carbs (g)"   stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorCarbs)"   dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="fats"    name="Fats (g)"    stroke="#a855f7" strokeWidth={2.5} fill="url(#colorFats)"    dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Radar Balance Chart ── */}
            {activeTab === 'radar' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Macro Balance Radar</h3>
                    <MacroRadar data={data} targets={targets} />
                </div>
            )}

            {/* ── Calorie Gap Analysis ── */}
            {activeTab === 'gap' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Calorie Gap Analysis</h3>
                    <p className="text-xs text-gray-400 mb-5">Daily surplus or deficit vs. the age-adjusted calorie target</p>
                    <CalorieGapChart data={data} targets={targets} />
                </div>
            )}

            {/* ── Nutrient Heatmap ── */}
            {activeTab === 'heatmap' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Weekly Nutrient Heatmap</h3>
                    <p className="text-xs text-gray-400 mb-5">Color-coded daily nutrient targets — useful for spotting consistent deficiencies</p>
                    <NutritionHeatmap data={data} targets={targets} />
                </div>
            )}

            {/* ── Meal Activity ── */}
            {activeTab === 'meals' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Weekly Meal Activity</h3>
                    <p className="text-xs text-gray-400 mb-5">Number of meal entries logged per day</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mealFrequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6', radius: 8 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <ReferenceLine y={3} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5}
                                    label={{ value: 'Min 3 meals', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
                                <Bar dataKey="count" name="Meals Logged" fill="#2b9dee" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={1200} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionTrendsChart;
