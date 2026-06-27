import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { addGrowthRecord } from '../../api/growth.api';

// --- WHO Approximation Data ---
const WHO_BOY = [
    { m: 0, w3: 2.5, w50: 3.3, w97: 4.3, h3: 46, h50: 50, h97: 54 },
    { m: 12, w3: 7.7, w50: 9.6, w97: 12.0, h3: 71, h50: 76, h97: 81 },
    { m: 24, w3: 9.7, w50: 12.2, w97: 15.3, h3: 82, h50: 88, h97: 94 },
    { m: 36, w3: 11.3, w50: 14.3, w97: 18.3, h3: 89, h50: 96, h97: 104 },
    { m: 48, w3: 12.7, w50: 16.3, w97: 21.2, h3: 95, h50: 103, h97: 112 },
    { m: 60, w3: 14.1, w50: 18.3, w97: 24.2, h3: 100, h50: 110, h97: 120 },
    { m: 72, w3: 15.9, w50: 20.5, w97: 27.5, h3: 106, h50: 116, h97: 127 },
    { m: 84, w3: 17.7, w50: 22.9, w97: 31.0, h3: 111, h50: 122, h97: 134 },
    { m: 96, w3: 19.5, w50: 25.4, w97: 34.5, h3: 116, h50: 127, h97: 140 },
    { m: 108, w3: 21.3, w50: 28.1, w97: 38.5, h3: 121, h50: 133, h97: 146 },
    { m: 120, w3: 23.3, w50: 31.2, w97: 43.0, h3: 125, h50: 138, h97: 152 },
];

const WHO_GIRL = [
    { m: 0, w3: 2.4, w50: 3.2, w97: 4.2, h3: 45, h50: 49, h97: 53 },
    { m: 12, w3: 7.0, w50: 8.9, w97: 11.5, h3: 69, h50: 74, h97: 80 },
    { m: 24, w3: 9.0, w50: 11.5, w97: 14.8, h3: 80, h50: 86, h97: 93 },
    { m: 36, w3: 10.8, w50: 13.9, w97: 18.1, h3: 88, h50: 95, h97: 103 },
    { m: 48, w3: 12.3, w50: 16.1, w97: 21.5, h3: 94, h50: 103, h97: 111 },
    { m: 60, w3: 13.7, w50: 18.2, w97: 24.9, h3: 99, h50: 109, h97: 119 },
    { m: 72, w3: 15.3, w50: 20.2, w97: 28.0, h3: 105, h50: 115, h97: 126 },
    { m: 84, w3: 16.8, w50: 22.4, w97: 31.5, h3: 110, h50: 121, h97: 132 },
    { m: 96, w3: 18.6, w50: 25.0, w97: 35.5, h3: 115, h50: 126, h97: 138 },
    { m: 108, w3: 20.8, w50: 28.2, w97: 40.5, h3: 120, h50: 132, h97: 145 },
    { m: 120, w3: 23.0, w50: 31.9, w97: 46.0, h3: 125, h50: 138, h97: 152 },
];

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

const generateChartData = (gender, growthHistory) => {
    const baseData = gender === 'girl' ? WHO_GIRL : WHO_BOY;
    const chartData = [];
    
    // Generate data for 0 to 120 months
    for (let month = 0; month <= 120; month++) {
        // Find interval
        let lower = baseData[0];
        let upper = baseData[baseData.length - 1];
        
        for (let i = 0; i < baseData.length - 1; i++) {
            if (month >= baseData[i].m && month <= baseData[i+1].m) {
                lower = baseData[i];
                upper = baseData[i+1];
                break;
            }
        }
        
        const t = (month - lower.m) / (upper.m - lower.m || 1);
        
        const dataPoint = {
            month,
            w3: Number(lerp(lower.w3, upper.w3, t).toFixed(1)),
            w50: Number(lerp(lower.w50, upper.w50, t).toFixed(1)),
            w97: Number(lerp(lower.w97, upper.w97, t).toFixed(1)),
            h3: Number(lerp(lower.h3, upper.h3, t).toFixed(1)),
            h50: Number(lerp(lower.h50, upper.h50, t).toFixed(1)),
            h97: Number(lerp(lower.h97, upper.h97, t).toFixed(1)),
            actualWeight: null,
            actualHeight: null
        };
        
        chartData.push(dataPoint);
    }

    // Overlay child's actual history
    if (growthHistory && growthHistory.length > 0) {
        growthHistory.forEach(record => {
            const m = Math.round(record.ageInMonths);
            if (m >= 0 && m <= 120) {
                chartData[m].actualWeight = record.weight;
                chartData[m].actualHeight = record.height;
                chartData[m].actualDate = record.timestamp;
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
                <p className="font-bold text-gray-800 mb-2 border-b pb-1">Age: {Math.floor(label/12)}y {label%12}m</p>
                {data.actualWeight && <p className="font-bold text-green-600">Actual Weight: {data.actualWeight} kg</p>}
                <p className="text-gray-500">Avg Weight: {data.w50} kg</p>
                {data.actualHeight && <p className="font-bold text-blue-600 mt-2">Actual Height: {data.actualHeight} cm</p>}
                <p className="text-gray-500">Avg Height: {data.h50} cm</p>
            </div>
        );
    }
    return null;
};

const InteractiveGrowthTracker = ({ isOpen, onClose, childId, profile, growthHistory, onChanged }) => {
    const [gender, setGender] = useState(profile?.gender || 'boy');
    const [weight, setWeight] = useState(15);
    const [height, setHeight] = useState(90);
    const [ageYears, setAgeYears] = useState(Math.floor((profile?.age || 3)));
    const [ageMonths, setAgeMonths] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const printRef = useRef();

    // Set initial values based on profile or latest history
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

    const handlePrint = () => {
        window.print();
    };

    const handleAddEntry = async () => {
        setLoading(true);
        try {
            await addGrowthRecord(childId, {
                height: Number(height),
                weight: Number(weight),
                notes: `Recorded at age ${ageYears}y ${ageMonths}m`
            });
            onChanged();
            // Automatically scroll down to charts or show success toast
            alert('Growth record saved successfully!');
        } catch (error) {
            console.error('Failed to add growth record:', error);
            alert('Error adding record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Determine results text
    let weightResult = "Weight is not yet recorded.";
    let heightResult = "Height is not yet recorded.";
    let summaryText = "";

    if (growthHistory && growthHistory.length > 0) {
        const latest = growthHistory[growthHistory.length - 1];
        if (latest.riskStatus === 'underweight') {
            weightResult = "Your child's weight is below the average healthy range.";
            summaryText = "Focus on nutrient-dense foods. Growth trend requires monitoring.";
        } else if (latest.riskStatus === 'overweight' || latest.riskStatus === 'obese') {
            weightResult = "Your child's weight is above the average healthy range.";
            summaryText = "Consider increasing physical activity. Growth trend requires monitoring.";
        } else {
            weightResult = "Your child's weight is within the healthy average range.";
            summaryText = "Growth trend is stable and healthy. Keep up the good work!";
        }

        // Height rough check against median
        const currentAgeMonths = Math.round(latest.ageInMonths || (ageYears * 12 + ageMonths));
        if (currentAgeMonths <= 120) {
            const dataAtMonth = chartData[currentAgeMonths];
            if (dataAtMonth) {
                if (latest.height < dataAtMonth.h3) heightResult = "Your child's height is below the expected percentile.";
                else if (latest.height > dataAtMonth.h97) heightResult = "Your child's height is above average.";
                else heightResult = "Your child's height is tracking along the expected average range.";
            }
        }
    }

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed inset-0 z-50 bg-[#eef3f5] overflow-y-auto print:static print:inset-auto print:bg-white print:block print:overflow-visible"
            >
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 relative print:p-0 print:m-0 print:max-w-full" ref={printRef}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 print:mb-6">
                        <div className="print:block">
                            <h1 className="text-3xl font-black text-[#1a365d] print:text-2xl">Pediatric Growth Dashboard</h1>
                            <p className="text-[#4a5568] font-medium print:text-sm">Tracking {profile?.name}'s development</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="print:hidden w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm border border-gray-200"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    {/* Gender Selection */}
                    <div className="text-center mb-10">
                        <h2 className="text-xl font-black text-[#1a365d] mb-4 font-serif">Gender</h2>
                        <div className="flex justify-center gap-6">
                            <button 
                                onClick={() => setGender('boy')}
                                className={`flex flex-col items-center gap-2 transition-transform ${gender === 'boy' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${gender === 'boy' ? 'bg-[#ffedb3] ring-4 ring-[#ffedb3]/50' : 'bg-gray-200'}`}>
                                    <span className="text-3xl">👦</span>
                                </div>
                                <span className="font-bold text-[#1a365d] text-sm">Boy</span>
                            </button>
                            <button 
                                onClick={() => setGender('girl')}
                                className={`flex flex-col items-center gap-2 transition-transform ${gender === 'girl' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${gender === 'girl' ? 'bg-[#ffedb3] ring-4 ring-[#ffedb3]/50' : 'bg-gray-200'}`}>
                                    <span className="text-3xl">👧</span>
                                </div>
                                <span className="font-bold text-[#1a365d] text-sm">Girl</span>
                            </button>
                        </div>
                    </div>

                    {/* Input Panel */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8 relative overflow-hidden print:shadow-none print:border-none print:p-2 print:mb-0" style={{ pageBreakAfter: 'always' }}>
                        
                        {/* Top Labels */}
                        <div className="flex justify-between items-center mb-6 px-4">
                            <div className="text-sm font-medium text-gray-700">
                                Weight <span className="font-bold text-[#eab308] text-lg">{weight}</span> kg
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                Height <span className="font-bold text-[#eab308] text-lg">{height}</span> cm
                            </div>
                        </div>

                        <div className="flex justify-between items-stretch gap-4 h-[320px] px-4 relative">
                            
                            {/* Left: Custom Weight Slider */}
                            <div className="relative w-16 h-full flex justify-center">
                                {/* Visual Ruler Ticks */}
                                <div className="absolute left-0 top-0 bottom-0 w-2 border-r border-gray-300">
                                    {[20, 15, 5, 2].map((tick, i) => (
                                        <div key={i} className="absolute w-2 h-px bg-gray-400" style={{ bottom: `${((tick - 2) / (150 - 2)) * 100}%` }}></div>
                                    ))}
                                    {/* Major ticks manually placed for visual effect to mimic the image */}
                                    <div className="absolute w-3 h-[2px] bg-gray-400" style={{ top: '10%' }}></div>
                                    <div className="absolute w-2 h-[1px] bg-gray-300" style={{ top: '30%' }}></div>
                                    <div className="absolute w-3 h-[2px] bg-gray-400" style={{ top: '50%' }}></div>
                                    <div className="absolute w-2 h-[1px] bg-gray-300" style={{ top: '70%' }}></div>
                                    <div className="absolute w-3 h-[2px] bg-gray-400" style={{ top: '90%' }}></div>
                                </div>
                                
                                {/* Visual Thumb */}
                                <div className="absolute left-1 pointer-events-none z-10 flex flex-col items-center" 
                                     style={{ bottom: `calc(${((weight - 2) / (150 - 2)) * 100}% - 12px)` }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-[#eab308] rounded-full shadow-sm"></div>
                                        <span className="text-[#eab308] font-bold text-sm whitespace-nowrap">{weight}kg</span>
                                    </div>
                                    <div className="mt-1 text-blue-600 bg-white rounded-full shadow-sm border border-blue-100 p-0.5">
                                        <span className="material-symbols-outlined text-[16px]">swipe_vertical</span>
                                    </div>
                                </div>

                                {/* Invisible Native Slider */}
                                <input 
                                    type="range" 
                                    min="2" max="150" step="0.5"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[320px] -rotate-90 opacity-0 cursor-pointer z-20"
                                />
                            </div>

                            {/* Center: Silhouette */}
                            <div className="flex-1 flex flex-col items-center justify-end relative pb-4">
                                <div className={`w-full max-w-[120px] ${gender === 'boy' ? 'text-[#ffedb3]' : 'text-[#ffb3c6]'}`}>
                                    {/* Smooth Scaling SVG */}
                                    <svg 
                                        viewBox="0 0 100 200" 
                                        fill="currentColor" 
                                        className="w-full drop-shadow-md transition-all duration-300 origin-bottom"
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

                            {/* Right: Custom Height Slider */}
                            <div className="relative w-16 h-full flex justify-center">
                                {/* Visual Ruler Ticks */}
                                <div className="absolute right-0 top-0 bottom-0 w-2 border-l border-gray-300">
                                    {/* Major ticks manually placed */}
                                    <div className="absolute right-0 w-3 h-[2px] bg-gray-400" style={{ top: '10%' }}></div>
                                    <div className="absolute right-0 w-2 h-[1px] bg-gray-300" style={{ top: '30%' }}></div>
                                    <div className="absolute right-0 w-3 h-[2px] bg-gray-400" style={{ top: '50%' }}></div>
                                    <div className="absolute right-0 w-2 h-[1px] bg-gray-300" style={{ top: '70%' }}></div>
                                    <div className="absolute right-0 w-3 h-[2px] bg-gray-400" style={{ top: '90%' }}></div>
                                </div>
                                
                                {/* Visual Thumb */}
                                <div className="absolute right-1 pointer-events-none z-10 flex flex-col items-center" 
                                     style={{ bottom: `calc(${((height - 40) / (220 - 40)) * 100}% - 12px)` }}>
                                    <div className="flex items-center flex-row-reverse gap-2">
                                        <div className="w-4 h-4 bg-[#eab308] rounded-full shadow-sm"></div>
                                        <span className="text-[#eab308] font-bold text-sm whitespace-nowrap">{height}cm</span>
                                    </div>
                                    <div className="mt-1 text-blue-600 bg-white rounded-full shadow-sm border border-blue-100 p-0.5">
                                        <span className="material-symbols-outlined text-[16px]">swipe_vertical</span>
                                    </div>
                                </div>

                                {/* Invisible Native Slider */}
                                <input 
                                    type="range" 
                                    min="40" max="220" step="0.5"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[320px] -rotate-90 opacity-0 cursor-pointer z-20"
                                />
                            </div>

                        </div>

                        {/* Year/Month Selectors */}
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase text-center mb-1">Year</label>
                                <select 
                                    value={ageYears} 
                                    onChange={(e) => setAgeYears(Number(e.target.value))}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary print:appearance-none print:border-none print:bg-transparent"
                                >
                                    {[...Array(11)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase text-center mb-1">Month</label>
                                <select 
                                    value={ageMonths} 
                                    onChange={(e) => setAgeMonths(Number(e.target.value))}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary print:appearance-none print:border-none print:bg-transparent"
                                >
                                    {[...Array(12)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Add Entry Button */}
                        <div className="flex justify-center mt-8 print:hidden">
                            <button 
                                onClick={handleAddEntry}
                                disabled={loading}
                                className="bg-[#1a365d] hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:-translate-y-1"
                            >
                                {loading ? 'Saving...' : 'Add entry'}
                            </button>
                        </div>
                    </div>

                    {/* Weight Curve */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 print:shadow-none print:border-none print:break-inside-avoid print:p-0 print:mb-4">
                        <h3 className="font-black text-xl text-[#1a365d] mb-6 font-serif">Weight curve</h3>
                        <div className="h-[250px] w-full print:h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        type="number"
                                        domain={[0, 120]}
                                        tickCount={11}
                                        tickFormatter={(m) => m}
                                        stroke="#a0aec0" 
                                        label={{ value: 'Month', position: 'insideBottom', offset: -15, fill: '#a0aec0', fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke="#a0aec0" 
                                        label={{ value: 'kg', angle: -90, position: 'insideLeft', offset: 10, fill: '#a0aec0', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    {/* Percentiles */}
                                    <Line type="monotone" dataKey="w97" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="97th percentile" />
                                    <Line type="monotone" dataKey="w50" stroke="#63b3ed" strokeWidth={2} strokeDasharray="5 5" dot={false} name="50th percentile" />
                                    <Line type="monotone" dataKey="w3" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="3rd percentile" />
                                    
                                    {/* Actual Data */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="actualWeight" 
                                        stroke="#48bb78" 
                                        strokeWidth={3} 
                                        dot={{ r: 6, fill: '#48bb78', stroke: '#fff', strokeWidth: 2 }} 
                                        connectNulls 
                                        name="Your Child" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Height Curve */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 print:shadow-none print:border-none print:break-inside-avoid print:p-0 print:mb-4">
                        <h3 className="font-black text-xl text-[#1a365d] mb-6 font-serif">Height curve</h3>
                        <div className="h-[250px] w-full print:h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        type="number"
                                        domain={[0, 120]}
                                        tickCount={11}
                                        tickFormatter={(m) => m}
                                        stroke="#a0aec0" 
                                        label={{ value: 'Month', position: 'insideBottom', offset: -15, fill: '#a0aec0', fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke="#a0aec0" 
                                        domain={[40, 'auto']}
                                        label={{ value: 'cm', angle: -90, position: 'insideLeft', offset: 10, fill: '#a0aec0', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    {/* Percentiles */}
                                    <Line type="monotone" dataKey="h97" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="97th percentile" />
                                    <Line type="monotone" dataKey="h50" stroke="#63b3ed" strokeWidth={2} strokeDasharray="5 5" dot={false} name="50th percentile" />
                                    <Line type="monotone" dataKey="h3" stroke="#bee3f8" strokeWidth={1.5} dot={false} name="3rd percentile" />
                                    
                                    {/* Actual Data */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="actualHeight" 
                                        stroke="#eab308" 
                                        strokeWidth={3} 
                                        dot={{ r: 6, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }} 
                                        connectNulls 
                                        name="Your Child" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Results Box */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-10 relative overflow-hidden print:shadow-none print:border-none print:p-2 print:break-inside-avoid">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 print:hidden"></div>
                        <h3 className="font-black text-2xl text-[#1a365d] mb-4 font-serif">Results</h3>
                        
                        <div className="mb-4">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                {ageYears}y {ageMonths}m / {height}cm / {weight}kg
                            </span>
                        </div>

                        <div className="space-y-2 mb-6">
                            <p className="text-[#2d3748] font-medium leading-relaxed">
                                <strong className="text-[#1a365d]">Weight Result:</strong> {weightResult}
                            </p>
                            <p className="text-[#2d3748] font-medium leading-relaxed">
                                <strong className="text-[#1a365d]">Height Result:</strong> {heightResult}
                            </p>
                        </div>

                        {summaryText && (
                            <div className="bg-[#f0f4f8] p-4 rounded-xl border border-[#e2e8f0] mb-6">
                                <p className="text-[#2c5282] font-semibold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xl">insights</span>
                                    {summaryText}
                                </p>
                            </div>
                        )}

                        <p className="text-[#718096] text-sm leading-relaxed mb-4">
                            Each dot on the chart represents your child's measurement entered at a specific age. Multiple dots show how your child's growth changes over time.
                        </p>

                        <p className="text-[#a0aec0] text-xs leading-relaxed italic">
                            Disclaimer: The NutriKids Growth Calculator is for general educational use only and is not a diagnostic tool. It does not replace medical advice or regular growth assessments by a qualified healthcare professional.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-6 print:hidden">
                        <div className="flex gap-4">
                            <button 
                                onClick={handlePrint}
                                className="bg-[#1a365d] hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-full shadow-md flex items-center gap-2 transition"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Download report
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
                                className="bg-[#2b6cb0] hover:bg-[#2c5282] text-white font-bold py-3 px-10 rounded-full shadow-md transition"
                            >
                                Save & Return to Dashboard
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InteractiveGrowthTracker;

