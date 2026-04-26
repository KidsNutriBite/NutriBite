"use client";
import React from 'react';
import { motion } from 'framer-motion';

const PortionGuide = () => {
    const guides = [
        { item: 'Rice / Grains', portion: '100g', approx: '≈ 1 cup (Cooked)', icon: '🍚' },
        { item: 'Milk', portion: '1 glass', approx: '≈ 250 ml', icon: '🥛' },
        { item: 'Dal / Lentils', portion: '1 bowl', approx: '≈ 150g', icon: '🥣' },
        { item: 'Vegetables', portion: '1 fistful', approx: '≈ 80g', icon: '🥦' },
        { item: 'Meat / Paneer', portion: 'Palm size', approx: '≈ 60-80g', icon: '🥩' },
        { item: 'Curd / Yogurt', portion: '1 small cup', approx: '≈ 100g', icon: '🍦' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">info</span>
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">Portion Education</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Visual Guide for Parents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guides.map((guide, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -2 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-md"
                    >
                        <div className="text-3xl">{guide.icon}</div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{guide.item}</p>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">{guide.portion} <span className="text-slate-400 dark:text-slate-500 mx-1">{guide.approx}</span></p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed italic">
                    <span className="font-bold">Pro Tip:</span> Use your child's palm as a guide. A child's portion is roughly the size of their own fist or palm!
                </p>
            </div>
        </div>
    );
};

export default PortionGuide;
