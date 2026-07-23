"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnifiedDietPlan } from '../../api/profile.api';
import { toast } from 'react-hot-toast';

// Helper to open print window and save as PDF
export const downloadPlanAsPDF = (titleName, plan) => {
    if (!plan || !plan.length) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Please allow popups to download the PDF');
        return;
    }
    
    let mealsHtml = '';
    plan.forEach(dayPlan => {
        mealsHtml += `
            <div style="page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #fafafa; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 1.2rem; color: #1e3a8a; font-family: 'Plus Jakarta Sans', sans-serif;">${dayPlan.day}</h3>
                    <span style="font-size: 0.8rem; font-weight: bold; background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">${dayPlan.focus}</span>
                </div>
                <p style="font-size: 0.85rem; color: #475569; margin-top: 0; margin-bottom: 16px; font-style: italic; font-family: 'Plus Jakarta Sans', sans-serif;"><strong>Why this works:</strong> ${dayPlan.rationale}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <strong style="font-size: 0.8rem; color: #f97316; font-family: 'Plus Jakarta Sans', sans-serif; display: block; margin-bottom: 4px;">🌅 Breakfast</strong>
                        <p style="margin: 0; font-size: 0.85rem; color: #334155; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">${dayPlan.meals.breakfast}</p>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <strong style="font-size: 0.8rem; color: #eab308; font-family: 'Plus Jakarta Sans', sans-serif; display: block; margin-bottom: 4px;">☀️ Lunch</strong>
                        <p style="margin: 0; font-size: 0.85rem; color: #334155; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">${dayPlan.meals.lunch}</p>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <strong style="font-size: 0.8rem; color: #22c55e; font-family: 'Plus Jakarta Sans', sans-serif; display: block; margin-bottom: 4px;">🍃 Snack</strong>
                        <p style="margin: 0; font-size: 0.85rem; color: #334155; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">${dayPlan.meals.snack}</p>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <strong style="font-size: 0.8rem; color: #6366f1; font-family: 'Plus Jakarta Sans', sans-serif; display: block; margin-bottom: 4px;">🌙 Dinner</strong>
                        <p style="margin: 0; font-size: 0.85rem; color: #334155; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">${dayPlan.meals.dinner}</p>
                    </div>
                </div>
            </div>
        `;
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${titleName} - Weekly Diet Plan</title>
            <meta charset="utf-8">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 40px;
                    background-color: #fff;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #2b9dee; padding-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #0f172a; font-size: 2rem; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;">Unified Family Diet Plan</h1>
                    <p style="margin: 6px 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500; font-family: 'Plus Jakarta Sans', sans-serif;">Addressing the combined nutritional deficiencies of all children</p>
                </div>
                <button class="no-print" onclick="window.print()" style="background-color: #2b9dee; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.2s;">Print / Save as PDF</button>
            </div>
            
            ${mealsHtml}
            
            <div style="margin-top: 40px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">
                Generated by NutriKids AI Pediatric Nutrition Platform. Always consult your pediatrician for clinical advice.
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

const FamilyDietPlan = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [weeklyPlan, setWeeklyPlan] = useState([]);
    const [loading, setLoading] = useState(true);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const fetchPlan = async () => {
        try {
            setLoading(true);
            const res = await getUnifiedDietPlan();
            setWeeklyPlan(res.data?.weeklyPlan || res.weeklyPlan || []);
        } catch (error) {
            console.error('Error fetching unified plan:', error);
            toast.error('Failed to generate unified plan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlan();
    }, []);

    const handleDownload = () => {
        if (!weeklyPlan || weeklyPlan.length === 0) {
            toast.error('No plan loaded to download. Please wait.');
            return;
        }
        downloadPlanAsPDF("Unified Family", weeklyPlan);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="max-w-3xl">
                    <div className="flex gap-3 mb-4">
                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Family Oriented
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Holistic Nutrition
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                        Unified Family Diet Plan
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        A single, balanced meal plan designed to address the unique nutritional deficiencies of all your children simultaneously. Because practical parenting means one healthy family meal, not separate dishes.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleDownload}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Download PDF
                    </button>
                    <button 
                        onClick={toggleExpand}
                        disabled={loading}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            keyboard_arrow_down
                        </span>
                        {isExpanded ? 'Hide Plan' : 'View Plan'}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    <p className="text-sm font-bold text-slate-500">Generating unified plan from combined deficiencies...</p>
                </div>
            )}

            <AnimatePresence>
                {isExpanded && !loading && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-8"
                    >
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">This Week's Schedule</h3>
                            
                            <div className="space-y-6">
                                {weeklyPlan.map((dayPlan, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Day & Rationale Info */}
                                            <div className="lg:w-1/3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{dayPlan.day}</h4>
                                                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
                                                        {dayPlan.focus}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Why this works</span>
                                                    {dayPlan.rationale}
                                                </p>
                                            </div>

                                            {/* Meals Breakdown */}
                                            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-orange-500">light_mode</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Breakfast</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.breakfast}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-yellow-500">wb_sunny</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Lunch</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.lunch}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-green-500">eco</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Snack</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.snack}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-indigo-500">dark_mode</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Dinner</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.dinner}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FamilyDietPlan;
