import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';

// ─── Recommended daily intake for children (average 6-12 years) ──────────────
const DAILY_TARGETS = {
    calories: 1600,
    protein: 40,   // grams
    carbs: 200,    // grams
    fats: 50,      // grams
};

// ─── Custom Calorie Tooltip ──────────────────────────────────────────────────
const CalorieTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const val = payload[0]?.value;
        const pct = Math.round((val / DAILY_TARGETS.calories) * 100);
        const color = pct < 70 ? '#f97316' : pct > 120 ? '#ef4444' : '#10b981';
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                <p className="font-bold text-gray-700 text-xs mb-1">{label}</p>
                <p className="font-black text-lg" style={{ color }}>{val} <span className="text-xs font-bold text-gray-400">kcal</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{pct}% of daily goal ({DAILY_TARGETS.calories} kcal)</p>
            </div>
        );
    }
    return null;
};

// ─── Custom Macro Tooltip ────────────────────────────────────────────────────
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

// ─── Macro stat card ─────────────────────────────────────────────────────────
const MacroCard = ({ label, current, target, color, unit = 'g', icon }) => {
    const pct = Math.min(Math.round((current / target) * 100), 100);
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{icon} {label}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>{pct}%</span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">
                {current}<span className="text-sm font-semibold text-gray-400 ml-1">{unit}</span>
            </p>
            <p className="text-xs text-gray-400">Goal: {target}{unit}/day</p>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = () => (
    <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200 space-y-3">
        <div className="text-5xl">📊</div>
        <p className="text-gray-700 font-bold text-lg">No nutrition data yet</p>
        <p className="text-gray-400 text-sm">Start logging meals to see calorie and macronutrient trends here.</p>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const NutritionTrendsChart = ({ data = [], mealFrequencyData = [] }) => {
    const [activeTab, setActiveTab] = useState('calories');

    if (!data || data.length === 0) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Nutrition Trends</h2>
                {mealFrequencyData.length > 0 && <MealFrequencySection data={mealFrequencyData} />}
                <EmptyState />
            </div>
        );
    }

    // Format date labels
    const chartData = data.map(d => ({
        ...d,
        label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));

    // Latest day totals for macro stat cards
    const latest = data[data.length - 1] || {};
    const avgCalories = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length) : 0;

    // Colour coding calorie bars
    const getBarColor = (value) => {
        const pct = value / DAILY_TARGETS.calories;
        if (pct < 0.7)  return '#f97316'; // under – orange
        if (pct > 1.2)  return '#ef4444'; // over – red
        return '#10b981';                 // good – green
    };

    const tabs = [
        { id: 'calories', label: 'Calories', icon: '🔥' },
        { id: 'macros',   label: 'Macros',   icon: '🥗' },
        { id: 'meals',    label: 'Meal Activity', icon: '🍽️' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Nutrition Trends</h2>
                <span className="text-xs text-gray-400 font-medium">Last {data.length} days with data</span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-orange-50 to-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                    <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Avg Daily Calories</p>
                    <p className="text-3xl font-black text-gray-900">{avgCalories}</p>
                    <p className="text-xs text-gray-400 mt-1">Goal: {DAILY_TARGETS.calories} kcal</p>
                    <div className="mt-2 h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.min((avgCalories / DAILY_TARGETS.calories) * 100, 100)}%` }} />
                    </div>
                </div>
                <MacroCard label="Protein" current={latest.protein || 0} target={DAILY_TARGETS.protein} color="#3b82f6" icon="💪" />
                <MacroCard label="Carbs"   current={latest.carbs   || 0} target={DAILY_TARGETS.carbs}   color="#f59e0b" icon="🌾" />
                <MacroCard label="Fats"    current={latest.fats    || 0} target={DAILY_TARGETS.fats}    color="#a855f7" icon="🥑" />
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Calorie Area Chart ── */}
            {activeTab === 'calories' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Daily Calorie Intake</h3>
                    <p className="text-xs text-gray-400 mb-5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />Green = On target &nbsp;
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />Orange = Under &nbsp;
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />Red = Over
                    </p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CalorieTooltip />} cursor={{ fill: '#f9fafb', radius: 8 }} />
                                {/* Reference line at goal */}
                                <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={44}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.calories)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Daily target: <strong className="text-gray-600">{DAILY_TARGETS.calories} kcal</strong> (approx. for 6–12 yrs)
                    </p>
                </div>
            )}

            {/* ── Macronutrient Stacked Area Chart ── */}
            {activeTab === 'macros' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-1">Macronutrient Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-5">Protein, Carbohydrates, and Fats (grams per day)</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="colorFats" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                                    </linearGradient>
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

            {/* ── Meal Activity (frequency) ── */}
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
                                <Bar dataKey="count" name="Meals Logged" fill="#2b9dee" radius={[6,6,0,0]} maxBarSize={44} animationDuration={1200} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionTrendsChart;
