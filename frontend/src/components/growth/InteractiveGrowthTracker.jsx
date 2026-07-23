import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { addGrowthRecord } from '../../api/growth.api';
import toast from 'react-hot-toast';

// --- WHO Approximation Data ---
const WHO_BOY = [
    { m: 0,   w3: 2.5,  w50: 3.3,  w97: 4.3,  h3: 46,  h50: 50,  h97: 54 },
    { m: 12,  w3: 7.7,  w50: 9.6,  w97: 12.0, h3: 71,  h50: 76,  h97: 81 },
    { m: 24,  w3: 9.7,  w50: 12.2, w97: 15.3, h3: 82,  h50: 88,  h97: 94 },
    { m: 36,  w3: 11.3, w50: 14.3, w97: 18.3, h3: 89,  h50: 96,  h97: 104 },
    { m: 48,  w3: 12.7, w50: 16.3, w97: 21.2, h3: 95,  h50: 103, h97: 112 },
    { m: 60,  w3: 14.1, w50: 18.3, w97: 24.2, h3: 100, h50: 110, h97: 120 },
    { m: 72,  w3: 15.9, w50: 20.5, w97: 27.5, h3: 106, h50: 116, h97: 127 },
    { m: 84,  w3: 17.7, w50: 22.9, w97: 31.0, h3: 111, h50: 122, h97: 134 },
    { m: 96,  w3: 19.5, w50: 25.4, w97: 34.5, h3: 116, h50: 127, h97: 140 },
    { m: 108, w3: 21.3, w50: 28.1, w97: 38.5, h3: 121, h50: 133, h97: 146 },
    { m: 120, w3: 23.3, w50: 31.2, w97: 43.0, h3: 125, h50: 138, h97: 152 },
];

const WHO_GIRL = [
    { m: 0,   w3: 2.4,  w50: 3.2,  w97: 4.2,  h3: 45,  h50: 49,  h97: 53 },
    { m: 12,  w3: 7.0,  w50: 8.9,  w97: 11.5, h3: 69,  h50: 74,  h97: 80 },
    { m: 24,  w3: 9.0,  w50: 11.5, w97: 14.8, h3: 80,  h50: 86,  h97: 93 },
    { m: 36,  w3: 10.8, w50: 13.9, w97: 18.1, h3: 88,  h50: 95,  h97: 103 },
    { m: 48,  w3: 12.3, w50: 16.1, w97: 21.5, h3: 94,  h50: 103, h97: 111 },
    { m: 60,  w3: 13.7, w50: 18.2, w97: 24.9, h3: 99,  h50: 109, h97: 119 },
    { m: 72,  w3: 15.3, w50: 20.2, w97: 28.0, h3: 105, h50: 115, h97: 126 },
    { m: 84,  w3: 16.8, w50: 22.4, w97: 31.5, h3: 110, h50: 121, h97: 132 },
    { m: 96,  w3: 18.6, w50: 25.0, w97: 35.5, h3: 115, h50: 126, h97: 138 },
    { m: 108, w3: 20.8, w50: 28.2, w97: 40.5, h3: 120, h50: 132, h97: 145 },
    { m: 120, w3: 23.0, w50: 31.9, w97: 46.0, h3: 125, h50: 138, h97: 152 },
];

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

const generateChartData = (gender, growthHistory) => {
    const baseData = gender === 'girl' ? WHO_GIRL : WHO_BOY;
    const chartData = [];

    for (let month = 0; month <= 120; month++) {
        let lower = baseData[0];
        let upper = baseData[baseData.length - 1];
        for (let i = 0; i < baseData.length - 1; i++) {
            if (month >= baseData[i].m && month <= baseData[i + 1].m) {
                lower = baseData[i];
                upper = baseData[i + 1];
                break;
            }
        }
        const t = (month - lower.m) / (upper.m - lower.m || 1);
        chartData.push({
            month,
            w3:  Number(lerp(lower.w3,  upper.w3,  t).toFixed(1)),
            w50: Number(lerp(lower.w50, upper.w50, t).toFixed(1)),
            w97: Number(lerp(lower.w97, upper.w97, t).toFixed(1)),
            h3:  Number(lerp(lower.h3,  upper.h3,  t).toFixed(1)),
            h50: Number(lerp(lower.h50, upper.h50, t).toFixed(1)),
            h97: Number(lerp(lower.h97, upper.h97, t).toFixed(1)),
            actualWeight: null,
            actualHeight: null,
        });
    }

    if (growthHistory && growthHistory.length > 0) {
        growthHistory.forEach(record => {
            const m = Math.round(record.ageInMonths);
            if (m >= 0 && m <= 120) {
                chartData[m].actualWeight = record.weight;
                chartData[m].actualHeight = record.height;
                chartData[m].actualDate   = record.timestamp;
            }
        });
    }
    return chartData;
};

const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100 text-sm">
                <p className="font-bold text-gray-800 mb-2 border-b pb-1">Age: {Math.floor(label / 12)}y {label % 12}m</p>
                {data.actualWeight && <p className="font-bold text-green-600">Actual Weight: {data.actualWeight} kg</p>}
                <p className="text-gray-500">Avg Weight: {data.w50} kg</p>
                {data.actualHeight && <p className="font-bold text-blue-600 mt-2">Actual Height: {data.actualHeight} cm</p>}
                <p className="text-gray-500">Avg Height: {data.h50} cm</p>
            </div>
        );
    }
    return null;
};

// ─── Styled Number Input with +/- ──────────────────────────────────────────
const NumberStepper = ({ label, value, onChange, min, max, step = 0.5, unit, color = '#eab308' }) => {
    const handleChange = (newVal) => {
        const clamped = Math.min(Math.max(Number(newVal), min), max);
        onChange(Number(clamped.toFixed(1)));
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide text-center">{label}</label>
            <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-gray-100 shadow-sm px-3 py-2 justify-between">
                <button
                    type="button"
                    onClick={() => handleChange(Number(value) - step)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-black text-lg transition active:scale-95"
                >
                    −
                </button>
                <div className="flex flex-col items-center">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        className="w-20 text-center font-black text-xl outline-none bg-transparent"
                        style={{ color }}
                    />
                    <span className="text-xs text-gray-400 font-bold -mt-1">{unit}</span>
                </div>
                <button
                    type="button"
                    onClick={() => handleChange(Number(value) + step)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-black text-lg transition active:scale-95"
                >
                    +
                </button>
            </div>
        </div>
    );
};

// ─── Vertical Slider with overflow fix ────────────────────────────────────
const VerticalSlider = ({ value, onChange, min, max, step = 0.5, label, unit, side = 'left', color = '#eab308' }) => {
    const pct = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative w-16 h-full flex justify-center overflow-visible">
            {/* Ruler track */}
            <div className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} top-0 bottom-0 w-2 ${side === 'left' ? 'border-r' : 'border-l'} border-gray-200`}>
                {[10, 30, 50, 70, 90].map(pos => (
                    <div key={pos} className="absolute w-2 h-px bg-gray-300" style={{ top: `${pos}%` }} />
                ))}
            </div>

            {/* Thumb indicator */}
            <div
                className={`absolute ${side === 'left' ? 'left-1' : 'right-1'} pointer-events-none z-10`}
                style={{ bottom: `calc(${pct}% - 12px)` }}
            >
                <div className={`flex items-center gap-1.5 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-4 h-4 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: color }} />
                    <span className="text-[11px] font-black whitespace-nowrap" style={{ color: color }}>
                        {value}{unit}
                    </span>
                </div>
            </div>

            {/* Native invisible slider */}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translateX(-50%) translateY(-50%) rotate(-90deg)',
                    width: '300px',
                    height: '32px',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 20,
                }}
            />
        </div>
    );
};

const InteractiveGrowthTracker = ({ isOpen, onClose, childId, profile, growthHistory, onChanged }) => {
    const [gender, setGender]       = useState(profile?.gender || 'boy');
    const [weight, setWeight]       = useState(15);
    const [height, setHeight]       = useState(90);
    const [ageYears, setAgeYears]   = useState(Math.floor(profile?.age || 3));
    const [ageMonths, setAgeMonths] = useState(0);
    const [loading, setLoading]     = useState(false);
    const printRef = useRef();

    useEffect(() => {
        if (profile) setGender(profile.gender || 'boy');
        if (growthHistory && growthHistory.length > 0) {
            const latest = growthHistory[growthHistory.length - 1];
            setWeight(latest.weight || 15);
            setHeight(latest.height || 90);
            if (latest.ageInMonths) {
                setAgeYears(Math.floor(latest.ageInMonths / 12));
                setAgeMonths(latest.ageInMonths % 12);
            }
        }
    }, [profile, growthHistory, isOpen]);

    const chartData = useMemo(() => generateChartData(gender, growthHistory), [gender, growthHistory]);

    const handleAddEntry = async () => {
        setLoading(true);
        try {
            await addGrowthRecord(childId, {
                height: Number(height),
                weight: Number(weight),
                notes: `Recorded at age ${ageYears}y ${ageMonths}m`,
            });
            onChanged();
            toast.success('Growth record saved successfully!');
        } catch (error) {
            toast.error('Error adding record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Result strings
    let weightResult = 'Weight is not yet recorded.';
    let heightResult = 'Height is not yet recorded.';
    let summaryText  = '';

    if (growthHistory && growthHistory.length > 0) {
        const latest = growthHistory[growthHistory.length - 1];
        if (latest.riskStatus === 'underweight') {
            weightResult = "Your child's weight is below the average healthy range.";
            summaryText  = 'Focus on nutrient-dense foods. Growth trend requires monitoring.';
        } else if (latest.riskStatus === 'overweight' || latest.riskStatus === 'obese') {
            weightResult = "Your child's weight is above the average healthy range.";
            summaryText  = 'Consider increasing physical activity. Growth trend requires monitoring.';
        } else {
            weightResult = "Your child's weight is within the healthy average range.";
            summaryText  = 'Growth trend is stable and healthy. Keep up the good work!';
        }
        const currentAgeMonths = Math.round(latest.ageInMonths || (ageYears * 12 + ageMonths));
        if (currentAgeMonths <= 120) {
            const d = chartData[currentAgeMonths];
            if (d) {
                if (latest.height < d.h3)  heightResult = "Your child's height is below the expected percentile.";
                else if (latest.height > d.h97) heightResult = "Your child's height is above average.";
                else heightResult = "Your child's height is tracking along the expected average range.";
            }
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#eef3f5] rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                    ref={printRef}
                >
                    {/* Modal Header — sticky */}
                    <div className="flex justify-between items-center px-8 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200 shrink-0">
                        <div>
                            <h1 className="text-2xl font-black text-[#1a365d]">Pediatric Growth Dashboard</h1>
                            <p className="text-[#4a5568] text-sm font-medium">Tracking {profile?.name}'s development</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div
                        className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8 py-6 space-y-6"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                    >
                        {/* Gender */}
                        <div className="text-center">
                            <h2 className="text-sm font-black text-[#1a365d] mb-3 uppercase tracking-widest">Select Gender</h2>
                            <div className="flex justify-center gap-6">
                                {['boy', 'girl'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className={`flex flex-col items-center gap-2 transition-all ${gender === g ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${gender === g ? 'bg-[#ffedb3] ring-4 ring-[#ffedb3]/60' : 'bg-gray-200'}`}>
                                            <span className="text-2xl">{g === 'boy' ? '👦' : '👧'}</span>
                                        </div>
                                        <span className="font-bold text-[#1a365d] text-sm capitalize">{g}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Measurement Input Panel ── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-[#1a365d] text-sm uppercase tracking-widest mb-5 text-center">Update Measurements</h3>

                            {/* Visual slider + avatar silhouette combo */}
                            <div className="flex flex-col items-center gap-6 mb-6">
                                {/* The main Avatar display area */}
                                <div className="flex justify-between items-stretch gap-4 h-[320px] w-full max-w-md mx-auto px-4 relative bg-[#f7fafc] rounded-2xl border border-gray-100 p-4 overflow-hidden">
                                    
                                    {/* LEFT: Vertical Weight Slider */}
                                    <div className="flex flex-col items-center justify-between py-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Weight</span>
                                        <VerticalSlider
                                            value={weight}
                                            onChange={setWeight}
                                            min={2}
                                            max={150}
                                            step={0.5}
                                            label="Weight"
                                            unit="kg"
                                            side="left"
                                            color="#eab308"
                                        />
                                    </div>

                                    {/* CENTER: SVG Silhouette Avatar */}
                                    <div className="flex-1 flex flex-col items-center justify-end relative pb-4">
                                        <div className="absolute top-2 text-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Scaling Preview</span>
                                            <span className="text-sm font-black text-[#1a365d] bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 inline-block mt-1">
                                                {Number(weight).toFixed(1)} kg · {Number(height).toFixed(1)} cm
                                            </span>
                                        </div>
                                        <div 
                                            className="w-full max-w-[120px] transition-all duration-300 origin-bottom"
                                            style={{
                                                color: gender === 'boy' ? '#93c5fd' : '#f9a8d4', // boy = pastel blue, girl = pastel pink
                                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                                            }}
                                        >
                                            <svg 
                                                viewBox="0 0 100 200" 
                                                fill="currentColor"
                                                className="w-full origin-bottom"
                                                style={{
                                                    transform: `
                                                      scaleX(${Math.min(1.3, Math.max(0.8, 1 + (weight - 15) / 150))})
                                                      scaleY(${Math.min(1.2, Math.max(0.8, 1 + (height - 90) / 200))})
                                                    `
                                                }}
                                            >
                                                <path d="M50 20C42 20 36 26 36 34C36 42 42 48 50 48C58 48 64 42 64 34C64 26 58 20 50 20ZM34 54C26 54 20 60 20 68V100C20 104 24 108 28 108H32V180C32 185 36 190 42 190H46C49 190 52 187 52 184V110H54V184C54 187 57 190 60 190H64C70 190 74 185 74 180V108H78C82 108 86 104 86 100V68C86 60 80 54 72 54H34Z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* RIGHT: Vertical Height Slider */}
                                    <div className="flex flex-col items-center justify-between py-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Height</span>
                                        <VerticalSlider
                                            value={height}
                                            onChange={setHeight}
                                            min={40}
                                            max={220}
                                            step={0.5}
                                            label="Height"
                                            unit="cm"
                                            side="right"
                                            color="#3b82f6"
                                        />
                                    </div>
                                </div>

                                {/* Precise Steppers Row */}
                                <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                                    <NumberStepper
                                        label="Weight"
                                        value={weight}
                                        onChange={setWeight}
                                        min={2}
                                        max={150}
                                        step={0.5}
                                        unit="kg"
                                        color="#eab308"
                                    />
                                    <NumberStepper
                                        label="Height"
                                        value={height}
                                        onChange={setHeight}
                                        min={40}
                                        max={220}
                                        step={0.5}
                                        unit="cm"
                                        color="#3b82f6"
                                    />
                                </div>
                            </div>

                            {/* Age selectors */}
                            <div className="border-t pt-5">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Child's Age at Measurement</h4>
                                <div className="flex justify-center items-center gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Years</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setAgeYears(y => Math.max(0, y - 1))}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-black text-gray-700 flex items-center justify-center">−</button>
                                            <select value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))}
                                                className="bg-gray-50 border border-gray-200 text-gray-900 font-black rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-center">
                                                {[...Array(11)].map((_, i) => <option key={i} value={i}>{i} yr</option>)}
                                            </select>
                                            <button onClick={() => setAgeYears(y => Math.min(10, y + 1))}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-black text-gray-700 flex items-center justify-center">+</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Months</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setAgeMonths(m => Math.max(0, m - 1))}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-black text-gray-700 flex items-center justify-center">−</button>
                                            <select value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))}
                                                className="bg-gray-50 border border-gray-200 text-gray-900 font-black rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-center">
                                                {[...Array(12)].map((_, i) => <option key={i} value={i}>{i} mo</option>)}
                                            </select>
                                            <button onClick={() => setAgeMonths(m => Math.min(11, m + 1))}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-black text-gray-700 flex items-center justify-center">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={handleAddEntry}
                                    disabled={loading}
                                    className="bg-[#1a365d] hover:bg-blue-900 disabled:opacity-50 text-white font-black py-3 px-10 rounded-full shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-3"
                                >
                                    {loading ? (
                                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-lg">save</span> Save Growth Record</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── WHO Weight Curve ── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-xl text-[#1a365d] mb-4">Weight Curve (WHO)</h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 15 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" type="number" domain={[0, 120]} tickCount={11}
                                            stroke="#a0aec0"
                                            label={{ value: 'Age (months)', position: 'insideBottom', offset: -12, fill: '#a0aec0', fontSize: 11 }} />
                                        <YAxis stroke="#a0aec0" label={{ value: 'kg', angle: -90, position: 'insideLeft', offset: 10, fill: '#a0aec0', fontSize: 11 }} />
                                        <Tooltip content={<CustomChartTooltip />} />
                                        <Line type="monotone" dataKey="w97" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="97th %" />
                                        <Line type="monotone" dataKey="w50" stroke="#63b3ed" strokeWidth={2} strokeDasharray="5 5" dot={false} name="50th %" />
                                        <Line type="monotone" dataKey="w3"  stroke="#bee3f8" strokeWidth={1.5} dot={false} name="3rd %" />
                                        <Line type="monotone" dataKey="actualWeight" stroke="#48bb78" strokeWidth={3}
                                            dot={{ r: 5, fill: '#48bb78', stroke: '#fff', strokeWidth: 2 }} connectNulls name="Your Child" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ── WHO Height Curve ── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-xl text-[#1a365d] mb-4">Height Curve (WHO)</h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 15 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" type="number" domain={[0, 120]} tickCount={11}
                                            stroke="#a0aec0"
                                            label={{ value: 'Age (months)', position: 'insideBottom', offset: -12, fill: '#a0aec0', fontSize: 11 }} />
                                        <YAxis stroke="#a0aec0" domain={[40, 'auto']}
                                            label={{ value: 'cm', angle: -90, position: 'insideLeft', offset: 10, fill: '#a0aec0', fontSize: 11 }} />
                                        <Tooltip content={<CustomChartTooltip />} />
                                        <Line type="monotone" dataKey="h97" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="97th %" />
                                        <Line type="monotone" dataKey="h50" stroke="#63b3ed" strokeWidth={2} strokeDasharray="5 5" dot={false} name="50th %" />
                                        <Line type="monotone" dataKey="h3"  stroke="#bee3f8" strokeWidth={1.5} dot={false} name="3rd %" />
                                        <Line type="monotone" dataKey="actualHeight" stroke="#eab308" strokeWidth={3}
                                            dot={{ r: 5, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }} connectNulls name="Your Child" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ── Results ── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-black text-xl text-[#1a365d]">Growth Assessment</h3>
                            <div className="bg-gray-50 rounded-xl px-4 py-2 inline-flex">
                                <span className="text-gray-600 font-bold text-sm">{ageYears}y {ageMonths}m · {height}cm · {weight}kg</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[#2d3748] font-medium leading-relaxed text-sm">
                                    <strong className="text-[#1a365d]">Weight: </strong>{weightResult}
                                </p>
                                <p className="text-[#2d3748] font-medium leading-relaxed text-sm">
                                    <strong className="text-[#1a365d]">Height: </strong>{heightResult}
                                </p>
                            </div>

                        <p className="text-[#718096] text-sm leading-relaxed mb-4">
                            Each dot on the chart represents your child's measurement entered at a specific age. Multiple dots show how your child's growth changes over time.
                        </p>

                        <p className="text-[#a0aec0] text-xs leading-relaxed italic">
                            Disclaimer: The NutriKids Growth Calculator is for general educational use only and is not a diagnostic tool. It does not replace medical advice or regular growth assessments by a qualified healthcare professional.
                        </p>
                    </div>

                        {/* ── Actions ── */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-4">
                            <button
                                onClick={() => window.print()}
                                className="bg-[#1a365d] hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center gap-2 transition"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Download Report
                            </button>
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `NutriKids Growth Report for ${profile?.name}`,
                                            text: `Check out ${profile?.name}'s latest growth statistics!`,
                                            url: window.location.href,
                                        });
                                    } else {
                                        alert('Share functionality is not supported on this browser.');
                                    }
                                }}
                                className="bg-white border-2 border-[#1a365d] text-[#1a365d] hover:bg-gray-50 font-bold py-3 px-6 rounded-full shadow-sm flex items-center gap-2 transition"
                            >
                                <span className="material-symbols-outlined text-lg">share</span>
                                Share report
                            </button>
                        </div>

                        <div className="text-center mt-4 border-t border-gray-200 pt-6 w-full max-w-md">
                            <p className="text-[#1a365d] font-bold mb-3">Keep monitoring your baby's growth timeline to earn Daily Wellness Points</p>
                            <button 
                                onClick={onClose}
                                className="bg-white border-2 border-[#1a365d] text-[#1a365d] hover:bg-gray-50 font-bold py-3 px-6 rounded-full flex items-center gap-2 transition"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InteractiveGrowthTracker;

