"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PortionGuide = () => {
    const [selectedAge, setSelectedAge] = useState('preschool'); // toddler, preschool, schooler

    const ageData = {
        toddler: {
            label: "Toddler (1-3 yrs)",
            desc: "Rapid brain growth requires small, nutrient-dense portions rich in healthy fats and proteins.",
            color: "from-amber-400 to-orange-500",
            textColor: "text-amber-600 dark:text-amber-400",
            bgLight: "bg-amber-50 dark:bg-amber-950/20",
            borderLight: "border-amber-100 dark:border-amber-900/30",
            items: [
                { item: 'Rice / Grains', portion: '60g', approx: '≈ 1/2 cup (Cooked)', icon: '🍚', note: 'Energy base' },
                { item: 'Milk', portion: '150 ml', approx: '≈ 3/4 glass', icon: '🥛', note: 'Calcium support' },
                { item: 'Dal / Lentils', portion: '75g', approx: '≈ 1/2 bowl', icon: '🥣', note: 'Protein block' },
                { item: 'Vegetables', portion: '40g', approx: '≈ 1/2 fistful', icon: '🥦', note: 'Vitamins & fiber' },
                { item: 'Meat / Paneer', portion: '30-40g', approx: '≈ Small matchbox size', icon: '🥩', note: 'Muscle building' },
                { item: 'Curd / Yogurt', portion: '75g', approx: '≈ 1/2 cup', icon: '🍦', note: 'Gut health' },
            ]
        },
        preschool: {
            label: "Preschooler (4-6 yrs)",
            desc: "Increasing physical activity calls for balanced macronutrients and consistent daily hydration.",
            color: "from-blue-400 to-indigo-500",
            textColor: "text-blue-600 dark:text-blue-400",
            bgLight: "bg-blue-50/70 dark:bg-blue-950/20",
            borderLight: "border-blue-100/50 dark:border-blue-900/30",
            items: [
                { item: 'Rice / Grains', portion: '100g', approx: '≈ 1 cup (Cooked)', icon: '🍚', note: 'Sustained energy' },
                { item: 'Milk', portion: '200 ml', approx: '≈ 1 glass', icon: '🥛', note: 'Bone density' },
                { item: 'Dal / Lentils', portion: '120g', approx: '≈ 3/4 bowl', icon: '🥣', note: 'Tissue repair' },
                { item: 'Vegetables', portion: '60g', approx: '≈ 3/4 fistful', icon: '🥦', note: 'Immunity shield' },
                { item: 'Meat / Paneer', portion: '60g', approx: '≈ Average palm size', icon: '🥩', note: 'Cell growth' },
                { item: 'Curd / Yogurt', portion: '100g', approx: '≈ 1 small cup', icon: '🍦', note: 'Digestive flora' },
            ]
        },
        schooler: {
            label: "Schooler (7-10 yrs)",
            desc: "High energy demands, cognitive tasks, and growth spurts require larger portion sizes.",
            color: "from-emerald-400 to-teal-500",
            textColor: "text-emerald-600 dark:text-emerald-400",
            bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
            borderLight: "border-emerald-100 dark:border-emerald-900/30",
            items: [
                { item: 'Rice / Grains', portion: '150g', approx: '≈ 1.5 cups (Cooked)', icon: '🍚', note: 'Optimal stamina' },
                { item: 'Milk', portion: '250 ml', approx: '≈ 1.2 glasses', icon: '🥛', note: 'Skeletal strength' },
                { item: 'Dal / Lentils', portion: '150g', approx: '≈ 1 full bowl', icon: '🥣', note: 'Essential amino acids' },
                { item: 'Vegetables', portion: '90g', approx: '≈ 1 full fistful', icon: '🥦', note: 'Mineral enrichment' },
                { item: 'Meat / Paneer', portion: '80g', approx: '≈ Large palm size', icon: '🥩', note: 'Structural protein' },
                { item: 'Curd / Yogurt', portion: '125g', approx: '≈ 1.25 small cups', icon: '🍦', note: 'Daily probiotic' },
            ]
        }
    };

    const currentAgeData = ageData[selectedAge];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300">
            {/* Visual background blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl">
                        <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">info</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">Portion Education</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Visual pediatric serving guide</p>
                    </div>
                </div>

                {/* Age selector buttons */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 max-w-md w-full md:w-auto">
                    {Object.keys(ageData).map((ageKey) => (
                        <button
                            key={ageKey}
                            onClick={() => setSelectedAge(ageKey)}
                            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                selectedAge === ageKey
                                    ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm font-black'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
                            }`}
                        >
                            {ageData[ageKey].label.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    💡 <strong className="text-slate-900 dark:text-white">Guidance for {currentAgeData.label}:</strong> {currentAgeData.desc}
                </p>
            </div>

            <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
                <AnimatePresence mode="popLayout">
                    {currentAgeData.items.map((item, idx) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={item.item}
                            whileHover={{ y: -3 }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/80 transition-all hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/30"
                        >
                            <div className="text-3xl p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">{item.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{item.item}</p>
                                    <span className="text-[9px] font-black uppercase text-indigo-500/80 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded leading-none shrink-0">{item.note}</span>
                                </div>
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {item.portion} 
                                    <span className="text-slate-400 dark:text-slate-500 font-semibold ml-1.5">{item.approx}</span>
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <div className={`mt-6 p-4 rounded-2xl border transition-all ${currentAgeData.bgLight} ${currentAgeData.borderLight}`}>
                <p className={`text-xs ${currentAgeData.textColor} leading-relaxed italic font-medium`}>
                    <strong className="uppercase font-bold tracking-wider mr-1.5">Pro Tip:</strong> 
                    Use your child's hand as a natural metric. A single protein portion is roughly the size and thickness of their own palm, grains should fit their cupped hands, and vegetables match their small closed fist!
                </p>
            </div>
        </div>
    );
};

export default PortionGuide;
