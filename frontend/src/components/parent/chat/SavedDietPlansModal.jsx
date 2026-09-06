"use client";
import React, { useState, useEffect } from 'react';
import { getSavedDietPlan } from '../../../api/nutrition.api';
import toast from 'react-hot-toast';

const mealSlotsConfig = [
    { key: 'breakfast', label: 'Breakfast', time: '8:00 AM', icon: 'brightness_low', color: 'text-amber-500' },
    { key: 'morningSnack', label: 'Morning Snack', time: '11:00 AM', icon: 'cookie', color: 'text-orange-500' },
    { key: 'lunch', label: 'Lunch', time: '1:30 PM', icon: 'wb_sunny', color: 'text-emerald-500' },
    { key: 'eveningSnack', label: 'Evening Snack', time: '5:00 PM', icon: 'local_cafe', color: 'text-sky-500' },
    { key: 'dinner', label: 'Dinner', time: '8:00 PM', icon: 'bedtime', color: 'text-indigo-500' },
    { key: 'bedtime', label: 'Bedtime Snack', time: '9:30 PM', icon: 'nights_stay', color: 'text-purple-500' }
];

const SavedDietPlansModal = ({ isOpen, onClose, activeChild }) => {
    const [loading, setLoading] = useState(true);
    const [savedPlanData, setSavedPlanData] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen || !activeChild) return;
        const profileId = activeChild._id || activeChild.id;

        const loadPlan = async () => {
            try {
                setLoading(true);
                const res = await getSavedDietPlan(profileId);
                setSavedPlanData(res?.savedPlan || null);
                setNotes(res?.customDietNotes || '');
            } catch (err) {
                console.error("Failed to load saved diet plan:", err);
                toast.error("Could not load saved diet plan.");
            } finally {
                setLoading(false);
            }
        };

        loadPlan();
    }, [isOpen, activeChild]);

    if (!isOpen) return null;

    const childName = activeChild?.name || 'Child';
    const dailySlots = savedPlanData?.dailyPlan || {};

    const handleDownload = () => {
        if (!savedPlanData) return;
        const textLines = [
            `NUTRIKID - SAVED PEDIATRIC DIET PLAN`,
            `Child: ${childName}`,
            `Saved On: ${savedPlanData.savedAt ? new Date(savedPlanData.savedAt).toLocaleDateString() : 'Active Plan'}`,
            `Plan Focus: ${savedPlanData.selectedTheme || 'Custom Balanced Plan'}`,
            `\n--- DAILY 6-MEAL SCHEDULE ---`
        ];

        mealSlotsConfig.forEach(slot => {
            const m = dailySlots[slot.key];
            if (m) {
                const dishName = typeof m === 'string' ? m : (m.dish || m.name || JSON.stringify(m));
                const cals = m.calories ? ` (${m.calories} kcal, ${m.protein || ''})` : '';
                textLines.push(`• ${slot.label} [${slot.time}]: ${dishName}${cals}`);
            }
        });

        if (notes) {
            textLines.push(`\n--- PARENT & CLINICAL NOTES ---`);
            textLines.push(notes);
        }

        const blob = new Blob([textLines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutrikid-diet-plan-${childName.toLowerCase().replace(/\s+/g, '-')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Diet plan downloaded successfully!", { icon: '📥' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined text-lg">bookmark</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                Saved Diet Plans for {childName}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Active personalized pediatric meal schedules and directives
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <span className="material-symbols-outlined text-3xl animate-spin text-indigo-500">progress_activity</span>
                            <p className="text-xs font-semibold">Loading saved diet plan...</p>
                        </div>
                    ) : !savedPlanData ? (
                        <div className="py-12 text-center space-y-3">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">restaurant_menu</span>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No Saved Diet Plan Yet</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                You can ask NutriGuide AI to plan meals (e.g. <em>&quot;Plan tomorrow&apos;s 6 meals for {childName}&quot;</em>) and click <strong>&quot;Save Plan&quot;</strong> right from the chat or Nutrition Insights!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Plan Metadata Badge */}
                            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                        Current Active Schedule
                                    </span>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        {savedPlanData.selectedTheme || 'Custom 6-Meal Clinical Schedule'}
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block font-medium">Last Saved:</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {savedPlanData.savedAt ? new Date(savedPlanData.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                    </span>
                                </div>
                            </div>

                            {/* 6 Meal Slots Breakdown */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Chronological Daily Meal Slots:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {mealSlotsConfig.map(slot => {
                                        const meal = dailySlots[slot.key];
                                        const dishTitle = typeof meal === 'string' 
                                            ? meal 
                                            : (meal?.dish || meal?.name || 'Standard balanced serving');
                                        const cals = meal?.calories ? `${meal.calories} kcal` : '';
                                        const protein = meal?.protein ? `${meal.protein}` : '';

                                        return (
                                            <div 
                                                key={slot.key}
                                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                        <span className={`material-symbols-outlined text-xs ${slot.color}`}>{slot.icon}</span>
                                                        {slot.label} ({slot.time})
                                                    </span>
                                                    {(cals || protein) && (
                                                        <span className="text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                                            {[cals, protein].filter(Boolean).join(' · ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                                    {dishTitle}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Parent / Doctor Notes */}
                            {notes && (
                                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">notes</span>
                                        Special Dietary Directives & Allergies:
                                    </span>
                                    <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                                        {notes}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                        Close
                    </button>

                    {savedPlanData && (
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Download Plan (.txt)</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SavedDietPlansModal;
