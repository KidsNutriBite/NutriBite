import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import RiskBadge from '../common/RiskBadge';
import VerifiedTag from '../common/VerifiedTag';
import { motion, AnimatePresence } from 'framer-motion';
import ChildHealthAvatar from './ChildHealthAvatar';

// ─── BMI Reference Data (Pediatric – WHO/CDC approximations) ───────────────
const BMI_REFERENCES = {
    underweight: { range: '< 18.5 (adult) / < 5th percentile', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    normal:      { range: '18.5 – 24.9 (adult) / 5th–85th percentile', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    overweight:  { range: '25 – 29.9 (adult) / 85th–95th percentile', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    obese:       { range: '≥ 30 (adult) / ≥ 95th percentile', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// Recommended waist circumference by age (approximate, in cm) — adapted from IOTF / WHO references
const getWaistRecommendation = (ageInMonths) => {
    const age = ageInMonths ? ageInMonths / 12 : 8;
    if (age < 6)  return { range: '45 – 52 cm', note: 'For children under 6 years' };
    if (age < 9)  return { range: '52 – 57 cm', note: 'For children aged 6–8 years' };
    if (age < 12) return { range: '57 – 63 cm', note: 'For children aged 9–11 years' };
    if (age < 15) return { range: '63 – 70 cm', note: 'For ages 12–14 years' };
    return { range: '70 – 80 cm', note: 'For teenagers 15+ years' };
};

const RISK_ADVICE = {
    underweight: {
        icon: '⚠️',
        title: 'Underweight',
        desc: 'Your child\'s BMI is below the healthy range. Focus on increasing calorie-dense, nutritious foods like nuts, dairy, eggs, legumes, and whole grains. Consult your pediatrician.',
        color: 'border-orange-400 bg-orange-50',
        titleColor: 'text-orange-700',
        descColor: 'text-orange-600',
    },
    normal: {
        icon: '✅',
        title: 'Healthy Weight',
        desc: 'Great! Your child is in the healthy BMI range. Maintain a balanced diet with vegetables, fruits, protein, and whole grains. Keep up with regular physical activity.',
        color: 'border-green-400 bg-green-50',
        titleColor: 'text-green-700',
        descColor: 'text-green-600',
    },
    overweight: {
        icon: '🔶',
        title: 'Overweight',
        desc: 'Your child\'s BMI is above the healthy range. Encourage more physical activity and focus on vegetables, fruits, and lean proteins. Reduce sugary drinks and processed snacks. Consult your pediatrician.',
        color: 'border-yellow-400 bg-yellow-50',
        titleColor: 'text-yellow-700',
        descColor: 'text-yellow-600',
    },
    obese: {
        icon: '🔴',
        title: 'Obese',
        desc: 'Your child\'s BMI is significantly above the healthy range. This requires immediate attention. Please consult your pediatrician for a structured diet and exercise plan tailored to your child.',
        color: 'border-red-400 bg-red-50',
        titleColor: 'text-red-700',
        descColor: 'text-red-600',
    },
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[180px]">
                <p className="font-bold text-gray-900 mb-2 text-sm border-b pb-1">
                    {new Date(data.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="space-y-1.5">
                    {data.height && <p className="text-xs text-gray-600 flex justify-between gap-4"><span className="font-bold text-blue-600">Height</span>{data.height} cm</p>}
                    {data.weight && <p className="text-xs text-gray-600 flex justify-between gap-4"><span className="font-bold text-green-600">Weight</span>{data.weight} kg</p>}
                    {data.waistCircumference && <p className="text-xs text-gray-600 flex justify-between gap-4"><span className="font-bold text-indigo-600">Waist</span>{data.waistCircumference} cm</p>}
                    {data.bmi && <p className="text-xs text-gray-600 flex justify-between gap-4"><span className="font-bold text-purple-600">BMI</span>{data.bmi}</p>}
                    {data.percentile != null && <p className="text-xs text-gray-600 flex justify-between gap-4"><span className="font-bold text-orange-600">Percentile</span>{data.percentile}th</p>}
                    {data.riskStatus && (
                        <div className="mt-2 pt-1 border-t">
                            <RiskBadge risk={data.riskStatus} />
                        </div>
                    )}
                </div>
                {data.notes && (
                    <div className="mt-2 text-xs text-gray-400 italic border-t pt-2">
                        "{data.notes}"
                    </div>
                )}
            </div>
        );
    }
    return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const GrowthTimeline = ({ data, profile, onDelete }) => {
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const formattedData = data.map(record => ({
        ...record,
        date: record.timestamp,
    }));

    const latest = formattedData[formattedData.length - 1];
    const hasWaist = formattedData.some(r => r.waistCircumference);

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 space-y-3">
                <div className="text-5xl">📏</div>
                <p className="text-gray-700 font-bold text-lg">No growth records yet</p>
                <p className="text-gray-400 text-sm">Click "Update Growth" above to record your child's first measurement.</p>
            </div>
        );
    }

    const advice = latest ? RISK_ADVICE[latest.riskStatus] || RISK_ADVICE.normal : null;
    const bmiRef = latest ? BMI_REFERENCES[latest.riskStatus] || BMI_REFERENCES.normal : null;
    const waistRec = latest ? getWaistRecommendation(latest.ageInMonths) : null;

    const handleDeleteClick = (id) => setDeleteConfirmId(id);
    const handleDeleteConfirm = (id) => { onDelete(id); setDeleteConfirmId(null); };
    const handleDeleteCancel = () => setDeleteConfirmId(null);

    return (
        <div className="space-y-6">

            {/* ── Avatar ── */}
            {latest && profile && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-center">
                    <ChildHealthAvatar
                        age={profile.age || (latest.ageInMonths ? latest.ageInMonths / 12 : 5)}
                        gender={profile.gender || 'male'}
                        riskStatus={latest.riskStatus}
                        height={latest.height}
                        bmi={latest.bmi}
                    />
                </div>
            )}

            {/* ── BMI Status Panel ── */}
            {advice && bmiRef && (
                <div className={`rounded-2xl border-l-4 p-5 ${advice.color}`}>
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">{advice.icon}</span>
                        <div className="flex-1">
                            <h4 className={`text-lg font-black mb-1 ${advice.titleColor}`}>{advice.title}</h4>
                            <p className={`text-sm leading-relaxed mb-4 ${advice.descColor}`}>{advice.desc}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={`rounded-xl p-3 border ${bmiRef.border} ${bmiRef.bg}`}>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommended BMI Range</p>
                                    <p className={`font-bold text-sm ${bmiRef.color}`}>{bmiRef.range}</p>
                                </div>
                                {waistRec && (
                                    <div className="rounded-xl p-3 border border-indigo-200 bg-indigo-50">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommended Waist</p>
                                        <p className="font-bold text-sm text-indigo-600">{waistRec.range}</p>
                                        <p className="text-xs text-indigo-400 mt-0.5">{waistRec.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Summary Stat Cards ── */}
            {latest && (
                <div className={`grid gap-4 ${hasWaist ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {/* BMI */}
                    <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-blue-100 rounded-bl-full opacity-40 -mr-2 -mt-2" />
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Current BMI</p>
                        <h3 className="text-3xl font-black text-gray-900">{latest.bmi}</h3>
                        <div className="mt-2 flex gap-2 flex-wrap">
                            <RiskBadge risk={latest.riskStatus} />
                            <span className="text-xs font-bold text-gray-400 self-center">{latest.percentile}th %ile</span>
                        </div>
                    </div>
                    {/* Height */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="text-3xl">📏</div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Height</p>
                            <p className="text-2xl font-black text-gray-900">{latest.height} <span className="text-base font-semibold text-gray-400">cm</span></p>
                        </div>
                    </div>
                    {/* Weight */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="text-3xl">⚖️</div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Weight</p>
                            <p className="text-2xl font-black text-gray-900">{latest.weight} <span className="text-base font-semibold text-gray-400">kg</span></p>
                        </div>
                    </div>
                    {/* Waist (conditional) */}
                    {hasWaist && latest.waistCircumference && (
                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
                            <div className="text-3xl">📐</div>
                            <div>
                                <p className="text-xs text-indigo-500 font-bold uppercase">Waist</p>
                                <p className="text-2xl font-black text-gray-900">{latest.waistCircumference} <span className="text-base font-semibold text-gray-400">cm</span></p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Growth Chart ── */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <span>📈</span> Growth Trends
                </h3>
                <p className="text-xs text-gray-400 mb-5">Weight (kg), BMI{hasWaist ? ', and Waist Circumference (cm)' : ''} over time</p>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={11} dy={10}
                            />
                            <YAxis yAxisId="left" stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={11} domain={['auto', 'auto']} />
                            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={11} domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />

                            {/* Weight line */}
                            <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} name="Weight (kg)" />

                            {/* BMI line */}
                            <Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#8b5cf6" strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#8b5cf6' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} name="BMI" />

                            {/* Waist Circumference line (conditional) */}
                            {hasWaist && (
                                <Line yAxisId="left" type="monotone" dataKey="waistCircumference" stroke="#6366f1" strokeWidth={2.5}
                                    strokeDasharray="8 3"
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} name="Waist (cm)" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── History Records ── */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span>🗓️</span> History Records
                    <span className="text-xs font-normal text-gray-400 ml-1">({formattedData.length} entries)</span>
                </h3>
                {formattedData.slice().reverse().map((record) => (
                    <motion.div
                        key={record._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-4">
                            {/* Left: date and stats */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-gray-900 text-sm">{new Date(record.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <VerifiedTag verified={record.verified} />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">📏 {record.height} cm</span>
                                    <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">⚖️ {record.weight} kg</span>
                                    <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">BMI {record.bmi}</span>
                                    {record.waistCircumference && (
                                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">📐 {record.waistCircumference} cm</span>
                                    )}
                                </div>
                            </div>

                            {/* Right: risk badge + percentile + delete */}
                            <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                                <RiskBadge risk={record.riskStatus} />
                                <span className="text-xs text-gray-400 font-medium">{record.percentile}th percentile</span>
                                {onDelete && deleteConfirmId !== record._id && (
                                    <button
                                        onClick={() => handleDeleteClick(record._id)}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline confirmation row */}
                        <AnimatePresence>
                            {deleteConfirmId === record._id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between"
                                >
                                    <p className="text-xs text-red-600 font-medium">Delete this growth record? This cannot be undone.</p>
                                    <div className="flex gap-2">
                                        <button onClick={handleDeleteCancel} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                                        <button onClick={() => handleDeleteConfirm(record._id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition">Yes, Delete</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default GrowthTimeline;
