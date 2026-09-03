"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';
import { DEMO_CHILD_PROFILE } from '../../data/demoChildData';

const GuestDashboard = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('overview'); 
    // Tabs: 'overview' | 'profile' | 'growth' | 'nutrition' | 'hydration' | 'sleep' | 'activity' | 'medical'
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('this action');

    const handleLockedAction = (action) => {
        setModalAction(action);
        setModalOpen(true);
    };

    const demo = DEMO_CHILD_PROFILE;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-display flex flex-col selection:bg-primary/20">
            {/* Top Guest Mode Banner */}
            <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-center sm:text-left">
                        <div className="size-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                        </div>
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <span className="font-black text-xs md:text-sm tracking-wide uppercase">Guest Mode — Viewing Demo Child</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white">Simulated Profile</span>
                            </div>
                            <p className="text-[11px] md:text-xs text-amber-100 leading-tight">
                                You're viewing simulated data. Login or create an account to manage health information.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/login"
                            className="px-3.5 py-1.5 rounded-xl bg-white text-amber-700 hover:bg-amber-50 text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-3.5 py-1.5 rounded-xl bg-amber-900/40 hover:bg-amber-900/60 border border-white/30 text-white text-xs font-bold transition-all active:scale-95"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-[58px] z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center group -my-4">
                            <img src="/logo.png" alt="NutriKids" className="h-20 w-auto object-contain transition-transform group-hover:scale-105" />
                        </Link>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Manage Health (Demo)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>

                        <button
                            onClick={() => handleLockedAction('NutriGuide AI Companion')}
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                            <span>NutriGuide AI</span>
                            <span className="material-symbols-outlined text-xs opacity-75">lock</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Child Profile Hero Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="size-20 sm:size-24 rounded-3xl bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 p-1 shadow-lg shadow-pink-500/20">
                                    <div className="w-full h-full rounded-[22px] bg-white dark:bg-slate-800 flex items-center justify-center text-4xl">
                                        👧
                                    </div>
                                </div>
                                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-white"></span>
                                    Demo
                                </span>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {demo.name}
                                    </h1>
                                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                        {demo.age} Years
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                        Allergy: Peanuts
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Parent: <strong className="text-slate-700 dark:text-slate-300">{demo.parentName}</strong> · Blood Group: <strong className="text-slate-700 dark:text-slate-300">{demo.bloodGroup}</strong> · Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{demo.bmiCategory}</span>
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons (All Marked as Locked with Modal Handlers) */}
                        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                            <button
                                onClick={() => handleLockedAction('Adding a New Child Profile')}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                                <span>Add Child</span>
                                <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                            </button>

                            <button
                                onClick={() => handleLockedAction('Editing Child Profile')}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                                <span>Edit Profile</span>
                                <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                            </button>

                            <button
                                onClick={() => handleLockedAction('Exporting Health Report PDF')}
                                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">download</span>
                                <span>Export Report</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>
                    </div>

                    {/* Vitals Quick Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current Height</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{demo.height} <span className="text-xs font-semibold text-slate-400">cm</span></p>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">58th Percentile (WHO)</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current Weight</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{demo.weight} <span className="text-xs font-semibold text-slate-400">kg</span></p>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">55th Percentile (WHO)</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Calculated BMI</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{demo.bmi} <span className="text-xs font-semibold text-slate-400">kg/m²</span></p>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Normal Range (14-17)</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Daily Hydration</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{demo.hydrationCurrent} / {demo.hydrationTarget} <span className="text-xs font-semibold text-slate-400">ml</span></p>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">73% Goal Met</span>
                        </div>
                    </div>
                </div>

                {/* Manage Health Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Health Overview', icon: 'dashboard' },
                        { id: 'profile', label: 'Child Profile', icon: 'person' },
                        { id: 'growth', label: 'Growth & Charts', icon: 'trending_up' },
                        { id: 'nutrition', label: 'Nutrition & Food Journal', icon: 'restaurant_menu' },
                        { id: 'hydration', label: 'Hydration Tracking', icon: 'water_drop' },
                        { id: 'sleep', label: 'Sleep Tracking', icon: 'bedtime' },
                        { id: 'activity', label: 'Activity Tracking', icon: 'directions_run' },
                        { id: 'medical', label: 'Medical & Allergies', icon: 'medical_services' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* TAB 1: HEALTH OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-200">
                        {/* Summary Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Daily Energy & Calorie Goal */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">local_fire_department</span>
                                            Daily Energy Target
                                        </h3>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            82% On Track
                                        </span>
                                    </div>
                                    <div className="text-center py-4">
                                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {demo.dailyCaloriesConsumed}
                                            <span className="text-sm font-semibold text-slate-400"> / {demo.dailyCalorieTarget} kcal</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Balanced intake for active 7-year-old child</p>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mt-4 overflow-hidden">
                                            <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full" style={{ width: '82%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleLockedAction('Logging Meals')}
                                    className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span>Log Food</span>
                                    <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                </button>
                            </div>

                            {/* Macronutrients */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
                                        Macronutrient Distribution
                                    </h3>
                                    <span className="text-xs text-slate-400">Today's Daily Totals</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Protein</span>
                                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{demo.macros.protein.current}g / {demo.macros.protein.target}g</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${demo.macros.protein.pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Carbs</span>
                                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{demo.macros.carbs.current}g / {demo.macros.carbs.target}g</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${demo.macros.carbs.pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Healthy Fats</span>
                                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{demo.macros.fats.current}g / {demo.macros.fats.target}g</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${demo.macros.fats.pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Fiber</span>
                                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{demo.macros.fiber.current}g / {demo.macros.fiber.target}g</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${demo.macros.fiber.pct}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-500 mb-2">Essential Micronutrient Absorption:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {demo.micros.slice(0, 6).map(m => (
                                            <div key={m.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs">
                                                <span className="material-symbols-outlined text-primary text-base">{m.icon}</span>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                                                    <p className="text-[10px] text-slate-400">{m.current} {m.unit} ({m.pct}%)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Pediatric Health Insights Card */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-primary/10 border border-purple-200/50 dark:border-purple-800/40 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        AI Clinical Nutrition Insights
                                    </h3>
                                </div>
                                <button
                                    onClick={() => handleLockedAction('Saving AI Recommendations')}
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                >
                                    <span>Save Insights</span>
                                    <span className="material-symbols-outlined text-xs">lock</span>
                                </button>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{demo.aiInsights.headline}</p>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                {demo.aiInsights.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* TAB 2: CHILD PROFILE */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Demographics & Profile Information</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Verified personal records and registered clinical milestones.</p>
                            </div>
                            <button
                                onClick={() => handleLockedAction('Modifying Child Profile')}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                                <span>Edit Demographics</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            {/* General Details */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h4 className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">Personal Information</h4>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Full Name</span><strong className="text-slate-900 dark:text-white">{demo.name}</strong></div>
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Date of Birth</span><strong className="text-slate-900 dark:text-white">March 15, 2019</strong></div>
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Chronological Age</span><strong className="text-slate-900 dark:text-white">{demo.age} Years</strong></div>
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Biological Gender</span><strong className="text-slate-900 dark:text-white capitalize">{demo.gender}</strong></div>
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Blood Group</span><strong className="text-slate-900 dark:text-white">{demo.bloodGroup}</strong></div>
                                </div>
                            </div>

                            {/* Location & Goals */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h4 className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px]">Family & Registered Health Goals</h4>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Primary Guardian</span><strong className="text-slate-900 dark:text-white">{demo.parentName}</strong></div>
                                    <div className="py-2.5 flex justify-between"><span className="text-slate-400">Location</span><strong className="text-slate-900 dark:text-white">{demo.location.city}, {demo.location.country}</strong></div>
                                    <div className="py-2.5 flex flex-col gap-1">
                                        <span className="text-slate-400">Primary Health Goal</span>
                                        <span className="font-bold text-primary">{demo.goals.primary}</span>
                                    </div>
                                    <div className="py-2.5 flex flex-col gap-1">
                                        <span className="text-slate-400">Secondary Health Goal</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{demo.goals.secondary}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: GROWTH TRACKING & CHARTS */}
                {activeTab === 'growth' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pediatric Growth Chart (WHO Trajectory)</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Historical height & weight curves mapped against WHO percentile benchmarks.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleLockedAction('Adding New Physical Measurement')}
                                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">straighten</span>
                                    <span>Add Measurement</span>
                                    <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Recharts Growth Chart */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-base">show_chart</span>
                                Height Progression Curve (cm) vs Age
                            </h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={demo.growthHistory}>
                                        <defs>
                                            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis dataKey="ageYears" tickFormatter={(v) => `${v} yrs`} tick={{ fontSize: 11 }} />
                                        <YAxis domain={[100, 125]} tick={{ fontSize: 11 }} unit=" cm" />
                                        <Tooltip 
                                            formatter={(value) => [`${value} cm`, 'Height']}
                                            labelFormatter={(label) => `Age: ${label} Years`}
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="height" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#growthGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Measurements History Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Clinical Measurements Record</h4>
                                <span className="text-xs text-slate-400">Total Entries: {demo.growthHistory.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3">Logged Date</th>
                                            <th className="px-4 py-3">Age</th>
                                            <th className="px-4 py-3">Height</th>
                                            <th className="px-4 py-3">Weight</th>
                                            <th className="px-4 py-3">BMI</th>
                                            <th className="px-4 py-3">WHO Percentile</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                        {demo.growthHistory.map((g, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="px-5 py-3 text-slate-900 dark:text-white font-bold">{g.date}</td>
                                                <td className="px-4 py-3">{g.ageYears} yrs</td>
                                                <td className="px-4 py-3">{g.height} cm</td>
                                                <td className="px-4 py-3">{g.weight} kg</td>
                                                <td className="px-4 py-3">{g.bmi} kg/m²</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        {g.percentile}th Percentile (Healthy)
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleLockedAction('Editing Growth Record')}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleLockedAction('Deleting Growth Record')}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors ml-1"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: NUTRITION & FOOD JOURNAL */}
                {activeTab === 'nutrition' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Pediatric Food Journal</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Nutritional analysis, allergen check, and caloric log.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleLockedAction('Adding New Food Item')}
                                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">add_circle</span>
                                    <span>Add Food</span>
                                    <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                </button>
                                <button
                                    onClick={() => handleLockedAction('Generating AI Meal Plan')}
                                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                                    <span>AI Meal Generator</span>
                                    <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                </button>
                            </div>
                        </div>

                        {/* Today's Meals Stream */}
                        <div className="space-y-3">
                            {demo.todayMeals.map(meal => (
                                <div key={meal.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-2xl">{meal.icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-xs text-primary">{meal.mealType}</span>
                                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                                <span className="text-xs text-slate-400">{meal.time}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{meal.name}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {meal.calories} kcal · {meal.macros.p}g Protein · {meal.macros.c}g Carbs · {meal.macros.f}g Fats
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        {meal.tags.map(t => (
                                            <span key={t} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {t}
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => handleLockedAction('Editing Food Item')}
                                            className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleLockedAction('Deleting Food Item')}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: HYDRATION TRACKING */}
                {activeTab === 'hydration' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Hydration & Fluid Intake</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Daily target: {demo.hydrationTarget} ml based on 21.4 kg body weight & activity level.</p>
                            </div>
                            <button
                                onClick={() => handleLockedAction('Logging Water Intake')}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-base">water_drop</span>
                                <span>Log Water (250ml)</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Glass Visualizer */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Today's Progress</span>
                                <p className="text-5xl font-black text-blue-600 dark:text-blue-400">{demo.hydrationCurrent} <span className="text-base font-semibold text-slate-400">/ {demo.hydrationTarget} ml</span></p>
                                <p className="text-xs text-slate-500 mt-1">4 of 6 glasses consumed · 400 ml remaining</p>
                                
                                <div className="flex gap-2 mt-6">
                                    {[1, 2, 3, 4, 5, 6].map((cup, i) => (
                                        <div
                                            key={cup}
                                            className={`size-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                                i < 4
                                                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">local_drink</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logs Timeline */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Today's Time Logs</h4>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {demo.waterLogs.map((log, idx) => (
                                        <div key={idx} className="py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500 text-base">check</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{log.amount} ml</span>
                                                <span className="text-slate-400">({log.note})</span>
                                            </div>
                                            <span className="text-slate-400 text-[11px] font-mono">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: SLEEP TRACKING */}
                {activeTab === 'sleep' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sleep Consistency & Recovery</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Recommended pediatric rest: 9.0 – 11.0 hours for neurological development.</p>
                            </div>
                            <button
                                onClick={() => handleLockedAction('Logging Sleep Schedule')}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-base">bedtime</span>
                                <span>Log Sleep</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Last Night's Sleep</span>
                                <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400">9.25 <span className="text-base font-semibold text-slate-400">Hours</span></p>
                                <p className="text-xs text-emerald-600 font-bold mt-1">Deep & Restful (94% Efficiency)</p>
                                <div className="mt-4 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500">
                                    Bedtime: <strong className="text-slate-800 dark:text-slate-200">09:00 PM</strong> · Wake time: <strong className="text-slate-800 dark:text-slate-200">06:15 AM</strong>
                                </div>
                            </div>

                            {/* Multi-Day Sleep Records */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Historical Sleep Logs</h4>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {demo.sleepHistory.map((s, idx) => (
                                        <div key={idx} className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{s.date} · {s.duration} hrs</p>
                                                <p className="text-[11px] text-slate-400">{s.bedtime} to {s.wakeTime}</p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                {s.quality}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: ACTIVITY TRACKING */}
                {activeTab === 'activity' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Physical Activity & Exercise Logs</h3>
                                <p className="text-xs text-slate-500 mt-0.5">WHO guideline: Minimum 60 minutes moderate-to-vigorous daily physical activity.</p>
                            </div>
                            <button
                                onClick={() => handleLockedAction('Logging Physical Activity')}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-base">directions_run</span>
                                <span>Add Activity</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {demo.activityLogs.map((act, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-2xl">{act.icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-xs text-emerald-600">{act.date}</span>
                                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                                <span className="text-xs text-slate-400">{act.duration} Minutes</span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{act.type}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Intensity: {act.intensity} · ~{act.caloriesBurned} Calories Burned</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLockedAction('Editing Activity Record')}
                                        className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 8: MEDICAL BACKGROUND & ALLERGIES */}
                {activeTab === 'medical' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Medical Background, Allergies & Specialist Care</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Clinical health records, verified vaccinations, and allergy profiles.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleLockedAction('Adding New Allergy Record')}
                                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">add_alert</span>
                                    <span>Add Allergy</span>
                                    <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                </button>
                                <button
                                    onClick={() => handleLockedAction('Booking Pediatric Consultation')}
                                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">calendar_month</span>
                                    <span>Book Consultation</span>
                                    <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Active Allergies */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Registered Allergies</h4>
                                <div className="space-y-3">
                                    {demo.allergies.map(a => (
                                        <div key={a.id} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs">
                                            <div className="flex items-center justify-between">
                                                <strong className="text-rose-700 dark:text-rose-300 font-black">{a.allergen}</strong>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">{a.severity}</span>
                                            </div>
                                            <p className="text-rose-600 dark:text-rose-400 mt-1">Reaction: {a.reaction}</p>
                                            <p className="text-slate-500 mt-1 text-[11px]"><strong className="text-slate-700 dark:text-slate-300">Action Plan:</strong> {a.actionPlan}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Connected Pediatrician */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Primary Pediatrician</h4>
                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <strong className="text-blue-900 dark:text-blue-200 font-black text-sm">{demo.medicalBackground.pediatrician.name}</strong>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Verified MD</span>
                                    </div>
                                    <p className="text-blue-700 dark:text-blue-300">{demo.medicalBackground.pediatrician.specialization} · {demo.medicalBackground.pediatrician.hospital}</p>
                                    <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                            "{demo.medicalBackground.pediatrician.notes}"
                                        </p>
                                    </div>
                                </div>

                                {/* Vaccinations summary */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Vaccination History</h4>
                                    <div className="space-y-1.5 text-xs">
                                        {demo.medicalBackground.vaccinations.map(v => (
                                            <div key={v.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{v.name}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold">{v.status} ({v.date})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Reusable Login Required Modal */}
            <LoginRequiredModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                actionName={modalAction}
            />
        </div>
    );
};

export default GuestDashboard;
