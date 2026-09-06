"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GrowthChartGuide = () => {
    const [activeSection, setActiveSection] = useState('percentiles'); // percentiles, velocity, targetHeight, boneHealth
    const [calcGender, setCalcGender] = useState('female');
    const [fatherHeight, setFatherHeight] = useState(175);
    const [motherHeight, setMotherHeight] = useState(160);

    // Mid-Parental Height Calculation (Tanner Formula)
    const calculateTargetHeight = () => {
        const f = Number(fatherHeight) || 175;
        const m = Number(motherHeight) || 160;
        if (calcGender === 'male') {
            return Math.round(((f + m + 13) / 2) * 10) / 10;
        } else {
            return Math.round(((f + m - 13) / 2) * 10) / 10;
        }
    };

    const targetHeight = calculateTargetHeight();

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 rounded-3xl p-6 md:p-8 border border-teal-100 dark:border-teal-900/40 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                📏 Clinical Growth Science
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                WHO & ICMR-NIN Benchmarks
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                            Parent's Guide to Pediatric Growth Charts & Velocity
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-medium">
                            A single height or weight reading only captures a single point in time. Understanding <strong>growth velocity curves</strong>, <strong>percentile bands</strong>, and <strong>nutritional bone mineral synergies</strong> ensures your child achieves their full genetic stature potential.
                        </p>
                    </div>
                </div>

                {/* Sub-navigation pill selector */}
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-teal-200/60 dark:border-slate-800">
                    {[
                        { id: 'percentiles', label: '1. Reading Percentiles', icon: 'timeline' },
                        { id: 'velocity', label: '2. Growth Velocity & Benchmarks', icon: 'speed' },
                        { id: 'targetHeight', label: '3. Mid-Parental Height Calculator', icon: 'straighten' },
                        { id: 'boneHealth', label: '4. Bone Mineralization & Foods', icon: 'nutrition' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeSection === tab.id
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 1: Reading Percentiles */}
            {activeSection === 'percentiles' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* What is a percentile card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <span className="material-symbols-outlined text-xl">analytics</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    What Does "Percentile" Really Mean?
                                </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                Growth percentiles compare your child's height and weight against a standard reference cohort of 100 healthy children of the exact same age and gender:
                            </p>
                            <div className="space-y-2.5">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-800 dark:text-white">
                                        🌟 50th Percentile = The Population Average (Median)
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Exactly half of children are taller/heavier, and half are shorter/lighter.
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-800 dark:text-white">
                                        📈 65th Percentile (Example: Ananya Sharma)
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Your child is taller than 65% of children her age, and shorter than 35%.
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-800 dark:text-white">
                                        🎯 The Golden Rule: Consistency Beats High Numbers
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        A child at the 25th percentile following a steady, upward curve is just as healthy as a child at the 75th percentile. Rapid crossing of lines (up or down) is what warrants pediatric review.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Percentile Bands Table */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <span className="material-symbols-outlined text-xl">bar_chart</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    WHO Growth Percentile Ranges
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                                            <th className="pb-2 font-black">Percentile Band</th>
                                            <th className="pb-2 font-black">Clinical Interpretation</th>
                                            <th className="pb-2 font-black">Parent Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <td className="py-2.5 font-bold text-red-600 dark:text-red-400">&lt; 3rd Percentile</td>
                                            <td className="py-2.5">Significantly low stature / weight</td>
                                            <td className="py-2.5 font-bold">Consult Pediatrician</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-amber-600 dark:text-amber-400">3rd – 15th</td>
                                            <td className="py-2.5">Mildly low stature band</td>
                                            <td className="py-2.5">Boost energy & iron density</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">15th – 85th</td>
                                            <td className="py-2.5"><strong>Ideal Healthy Range</strong></td>
                                            <td className="py-2.5">Maintain balanced 6-meal rhythm</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-amber-600 dark:text-amber-400">85th – 97th</td>
                                            <td className="py-2.5">High weight / stature band</td>
                                            <td className="py-2.5">Increase outdoor free play</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-red-600 dark:text-red-400">&gt; 97th Percentile</td>
                                            <td className="py-2.5">Significantly elevated mass</td>
                                            <td className="py-2.5 font-bold">Review with Dietitian</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Section 2: Growth Velocity */}
            {activeSection === 'velocity' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
                >
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-600">speed</span>
                            Pediatric Height & Weight Velocity Standards (ICMR-NIN)
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Growth velocity measures how many centimeters and kilograms your child gains each year. This is the gold standard used by pediatricians to verify endocrine and nutritional health.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                age: "Toddler (1 - 3 yrs)",
                                heightVelocity: "8 - 12 cm / year",
                                weightVelocity: "2.0 - 2.5 kg / year",
                                milestones: "Brain myelinization, walking, primary teeth completion",
                                icon: "child_care",
                                color: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
                            },
                            {
                                age: "Preschool (4 - 6 yrs)",
                                heightVelocity: "6.0 - 8.0 cm / year",
                                weightVelocity: "1.8 - 2.2 kg / year",
                                milestones: "Linear leg elongation, fine motor coordination",
                                icon: "directions_run",
                                color: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20"
                            },
                            {
                                age: "School Age (7 - 10 yrs)",
                                heightVelocity: "5.0 - 6.5 cm / year",
                                weightVelocity: "2.5 - 3.5 kg / year",
                                milestones: "Steady pre-pubertal bone mineralization, permanent teeth",
                                icon: "school",
                                color: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"
                            },
                            {
                                age: "Pre-Teen & Teen (11 - 15 yrs)",
                                heightVelocity: "7.0 - 10.0 cm / year",
                                weightVelocity: "4.0 - 6.0 kg / year",
                                milestones: "Pubertal growth spurt (Peak Height Velocity)",
                                icon: "sports_handball",
                                color: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border ${item.color} space-y-3`}>
                                <div className="flex items-center justify-between">
                                    <span className="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-200">{item.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                        ICMR 2024
                                    </span>
                                </div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white">{item.age}</h4>
                                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    <p><strong>Height Gain:</strong> <span className="text-teal-600 dark:text-teal-400 font-bold">{item.heightVelocity}</span></p>
                                    <p><strong>Weight Gain:</strong> <span className="text-blue-600 dark:text-blue-400 font-bold">{item.weightVelocity}</span></p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">{item.milestones}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0 mt-0.5">help</span>
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            <strong className="text-slate-900 dark:text-white">Growth Spurts & "Growing Pains":</strong> During rapid growth phases (such as ages 4.5 to 7), bone length extends faster than adjacent tendon-muscle elasticity, frequently causing evening calf or thigh aching. Hydrate well (1,500-1,750 ml), offer warm turmeric milk before bed, and supply dietary calcium from ragi and paneer.
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Section 3: Mid-Parental Height Calculator */}
            {activeSection === 'targetHeight' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
                >
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">straighten</span>
                            Mid-Parental Target Height Calculator (Tanner-Whitehouse Method)
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pediatricians use the Tanner formula to estimate adult target genetic height range (± 5 cm) based on biological parental heights.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                                    Child's Gender
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCalcGender('female')}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                            calcGender === 'female'
                                                ? 'bg-pink-600 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                        }`}
                                    >
                                        👧 Girl
                                    </button>
                                    <button
                                        onClick={() => setCalcGender('male')}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                            calcGender === 'male'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                        }`}
                                    >
                                        👦 Boy
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                                        Father's Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={fatherHeight}
                                        onChange={(e) => setFatherHeight(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                                        min="120"
                                        max="220"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                                        Mother's Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={motherHeight}
                                        onChange={(e) => setMotherHeight(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                                        min="120"
                                        max="220"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Result Panel */}
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-100">
                                    Projected Adult Target Height
                                </p>
                                <p className="text-4xl font-black">{targetHeight} <span className="text-lg font-bold">cm</span></p>
                                <p className="text-xs text-indigo-100 font-medium">
                                    Target Stature Range: <strong>{targetHeight - 5} cm – {targetHeight + 5} cm</strong>
                                </p>
                            </div>

                            <div className="pt-4 border-t border-indigo-400/50 text-[11px] text-indigo-100 leading-relaxed font-medium">
                                💡 Nutrition, adequate sleep (9-10h), and micronutrient balance determine whether a child reaches the upper boundary of their genetic potential!
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Section 4: Bone Mineralization & Superfoods */}
            {activeSection === 'boneHealth' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
                >
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">nutrition</span>
                            Pediatric Bone Mineralization & Stature Synergy Matrix
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Linear height velocity requires four interconnected biological nutrients working in unison.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                            <span className="text-2xl">🥛</span>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">1. Bioavailable Calcium</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Forms hydroxyapatite bone crystal matrix.
                            </p>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                🥣 Ragi (344mg/100g), Fresh Paneer, Set Curd (Dahi), Sesame seeds.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
                            <span className="text-2xl">☀️</span>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">2. Vitamin D3 & Sunlight</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Facilitates gut absorption of calcium and phosphorus.
                            </p>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                🏃 20-30 mins morning outdoor active play (8:00 - 9:30 AM), fortified cow milk.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                            <span className="text-2xl">💪</span>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">3. High Biological Protein</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Triggers hepatic IGF-1 (Insulin-like Growth Factor) synthesis for bone growth plates.
                            </p>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                🍳 Moong dal cheela, cereal-pulse 3:1 khichdi, eggs, paneer bhurji.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                            <span className="text-2xl">🌰</span>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">4. Zinc & Magnesium</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Essential enzymatic cofactors for osteoblast (bone-building cells) division.
                            </p>
                            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                🍿 Roasted Foxnuts (Makhana), Bajra roti, pumpkin seeds, soaked almonds.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default GrowthChartGuide;
