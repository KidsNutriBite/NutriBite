"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyProfiles, deleteProfile } from '../../api/profile.api';
import Modal from '../../components/common/Modal';
import AddProfileForm from '../../components/parent/AddProfileForm';
import ProfileInfoAndReports from '../../components/parent/ProfileInfoAndReports';
import WellnessInsightsModal from '../../components/parent/WellnessInsightsModal';
import { toast } from 'react-hot-toast';

// Modern Premium Inline SVG Icons
const CalendarIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LocationPinIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <circle cx={12} cy={11} r={3} />
    </svg>
);

const HeightIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6M9 9h3M9 13h6M9 17h3M9 21h6V3H9v18z" />
    </svg>
);

const WeightIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1M21 6l-3 1M12 12V3m0 9v9m-9-9h18M6 12a6 6 0 1112 0 6 6 0 01-12 0z" />
    </svg>
);

const WaistIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16M10 8v8M14 8v8M2 12h20" />
    </svg>
);

const BmiIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
);

const SportsIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-450 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const SleepIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-455 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const HydrationIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-455 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.484 11.2C18.66 8.52 16.04 4.56 12 2c-4.04 2.56-6.66 6.52-7.484 9.2A8 8 0 1019.484 11.2z" />
    </svg>
);

const ScreenIcon = () => (
    <svg className="w-3.5 h-3.5 text-slate-455 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
);

const LikesIcon = () => (
    <svg className="w-3 h-3 text-emerald-500 mr-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const DislikesIcon = () => (
    <svg className="w-3 h-3 text-rose-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx={12} cy={12} r={10} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ActionStatsIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
);

const ActionEditIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const ActionTrashIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const AddChildIcon = () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AlertShieldIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg className="w-3.5 h-3.5 mr-1 shrink-0 text-emerald-600 dark:text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// SVG Radial Score Indicator
const RadialScore = ({ score }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let strokeColor = 'stroke-emerald-500 dark:stroke-emerald-400';
    let textColor = 'text-emerald-600 dark:text-emerald-400';
    let label = 'Excellent';

    if (score < 60) {
        strokeColor = 'stroke-rose-500 dark:stroke-rose-400';
        textColor = 'text-rose-600 dark:text-rose-400';
        label = 'Needs Focus';
    } else if (score < 80) {
        strokeColor = 'stroke-amber-500 dark:stroke-amber-400';
        textColor = 'text-amber-600 dark:text-amber-400';
        label = 'Balanced';
    }

    return (
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2 rounded-2xl shrink-0 shadow-3xs">
            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r={radius}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeWidth="3.5"
                        fill="transparent"
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r={radius}
                        className={`transition-all duration-1000 ease-out ${strokeColor}`}
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-800 dark:text-slate-200">{score}%</span>
            </div>
            <div className="text-left leading-none">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Score</p>
                <p className={`text-[10px] font-extrabold mt-0.5 ${textColor}`}>{label}</p>
            </div>
        </div>
    );
};

// BMI Status Selector Helper
const getBmiDetails = (bmi) => {
    if (!bmi) return { label: 'Unknown', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900', dot: 'bg-slate-400' };
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/30', dot: 'bg-amber-500' };
    if (val < 25.0) return { label: 'Normal Weight', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30', dot: 'bg-emerald-500' };
    return { label: 'Overweight', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/30', dot: 'bg-rose-500' };
};

const MyChildren = () => {
    const router = useRouter();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [insightsProfile, setInsightsProfile] = useState(null);

    const calculateCompletion = (child) => {
        let score = 0;
        const fields = [
            child.name,
            child.dob,
            child.gender,
            child.bloodGroup,
            child.height,
            child.weight,
            child.waistCircumference,
            child.location?.city,
            child.goals?.primary,
            child.preferences?.favoriteFoods,
            child.preferences?.dislikedFoods,
            child.preferences?.sleepDuration
        ];
        fields.forEach(f => {
            if (f !== undefined && f !== null && f !== '') {
                score += 1;
            }
        });
        return Math.round((score / fields.length) * 100);
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await getMyProfiles();
            setProfiles(Array.isArray(res) ? res : res.data || []);
        } catch (error) {
            console.error('Error fetching children profiles:', error);
            toast.error('Failed to load children profiles');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}'s profile? All data and reports will be permanently lost.`)) {
            return;
        }

        try {
            await deleteProfile(id);
            toast.success(`${name}'s profile deleted successfully`);
            fetchChildren();
        } catch (error) {
            toast.error(error.message || 'Failed to delete child profile');
        }
    };

    const selectedChild = profiles.find(p => p._id === selectedChildId);

    const totalChildren = profiles.length;
    const totalReports = profiles.reduce((sum, child) => sum + (child.medicalReports?.length || 0), 0);
    const averageWellnessScore = totalChildren > 0 
        ? Math.round(profiles.reduce((sum, child) => sum + (child.wellnessAnalysis?.score || 100), 0) / totalChildren)
        : 100;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-400 font-bold text-sm">Loading children registry...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-0">
            {/* Professional Stats Overview Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="lg:col-span-2 space-y-2 relative z-10 flex flex-col justify-center">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-blue-200 font-black text-[10px] uppercase tracking-widest rounded-full self-start">
                        Family Registry
                    </span>
                    <h1 className="text-3xl font-black tracking-tight leading-none">Pediatric Directory</h1>
                    <p className="text-slate-300 text-sm max-w-md font-medium leading-relaxed">
                        Track growth parameters, manage clinical laboratory files, and monitor AI-powered wellness insights for your children.
                    </p>
                </div>

                <div className="grid grid-cols-3 lg:col-span-2 gap-4 relative z-10">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                        <span className="text-xl">👶</span>
                        <div>
                            <p className="text-2xl font-black leading-none">{totalChildren}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Children</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                        <span className="text-xl">📄</span>
                        <div>
                            <p className="text-2xl font-black leading-none">{totalReports}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Lab Reports</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                        <span className="text-xl">✨</span>
                        <div>
                            <p className="text-2xl font-black leading-none">{averageWellnessScore}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Avg Score</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
                <h2 className="text-lg font-black text-slate-850 dark:text-white">Active Children Profiles</h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-primary hover:bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center hover:scale-[1.02]"
                >
                    <AddChildIcon /> Add Child Profile
                </button>
            </div>

            {/* List Grid */}
            {profiles.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 max-w-xl mx-auto shadow-sm">
                    <span className="text-5xl mb-4 block">🧸</span>
                    <h3 className="font-extrabold text-lg text-slate-850 dark:text-white mb-1">No Child Profiles Created</h3>
                    <p className="text-sm text-slate-400 mb-6">Create a profile to begin tracking nutrition milestones, automated growth percentiles, and wellness analyses.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-white font-black px-6 py-3 rounded-xl shadow hover:bg-blue-600 transition"
                    >
                        Create First Child Profile
                    </button>
                </div>
            ) : (
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.08
                            }
                        }
                    }}
                >
                    <AnimatePresence>
                        {profiles.map((child) => {
                            const healthConditionsCount = child.healthConditions?.length || 0;
                            const wellnessScore = child.wellnessAnalysis?.score || 100;
                            const completion = calculateCompletion(child);
                            
                            // Select left accent border color based on wellness score
                            let wellnessBorder = 'border-l-[5px] border-l-emerald-500';
                            if (wellnessScore < 60) {
                                wellnessBorder = 'border-l-[5px] border-l-rose-500';
                            } else if (wellnessScore < 80) {
                                wellnessBorder = 'border-l-[5px] border-l-amber-500';
                            }

                            // Parse food preferences arrays
                            const favoriteFoodsList = child.preferences?.favoriteFoods 
                                ? child.preferences.favoriteFoods.split(',').map(s => s.trim()).filter(Boolean) 
                                : [];
                            const dislikedFoodsList = child.preferences?.dislikedFoods 
                                ? child.preferences.dislikedFoods.split(',').map(s => s.trim()).filter(Boolean) 
                                : [];

                            // Height/Weight BMI calculation helper
                            const bmiValue = child.height && child.weight 
                                ? (child.weight / ((child.height / 100) * (child.height / 100))).toFixed(1) 
                                : null;
                            const bmiDetails = getBmiDetails(bmiValue);

                            return (
                                <motion.div
                                    key={child._id}
                                    variants={{
                                        hidden: { opacity: 0, y: 15 },
                                        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                    }}
                                    layout
                                    className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-slate-200/80 dark:hover:border-slate-650/80 transition-all duration-300 relative ${wellnessBorder}`}
                                >
                                    <div className="space-y-5">
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-150/70 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative ring-4 ring-offset-2 ring-primary/5">
                                                    {child.profileImage ? (
                                                        <img src={child.profileImage} alt={child.name} className="w-full h-full object-cover animate-in fade-in duration-300" />
                                                    ) : (
                                                        <span className="text-3xl select-none">
                                                            {child.avatar === 'lion' && '🦁'}
                                                            {child.avatar === 'bear' && '🐻'}
                                                            {child.avatar === 'rabbit' && '🐰'}
                                                            {child.avatar === 'fox' && '🦊'}
                                                            {child.avatar === 'cat' && '🐱'}
                                                            {child.avatar === 'dog' && '🐶'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight truncate">
                                                        {child.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1.5">
                                                        <span className="flex items-center"><CalendarIcon /> {child.age} Yrs</span>
                                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                                        <span className="flex items-center capitalize"><UserIcon /> {child.gender}</span>
                                                    </div>
                                                    {child.location?.city && (
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 flex items-center">
                                                            <LocationPinIcon /> {child.location.city}, {child.location.country}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <RadialScore score={wellnessScore} />
                                        </div>

                                        {/* Profile Completion Indicator */}
                                        <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                                                <span>Profile Completion</span>
                                                <span className={completion === 100 ? 'text-emerald-500' : 'text-amber-500'}>{completion}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${completion}%` }}
                                                ></div>
                                            </div>
                                            {completion < 100 && (
                                                <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold flex items-start gap-1 mt-1 leading-normal">
                                                    <span className="shrink-0 mt-0.5">⚠️</span> 
                                                    <span>Profile incomplete. Click "Edit Info" to fill in food preferences and habits.</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Birth & Medical Indicators */}
                                        <div className="flex flex-wrap gap-2">
                                            {child.prematureBirth?.isPremature ? (
                                                <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-100/30 flex items-center">
                                                    <AlertShieldIcon /> Preterm ({child.prematureBirth.weeksPremature} wks)
                                                </span>
                                            ) : (
                                                <span className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-transparent flex items-center">
                                                    <ShieldCheckIcon /> Full Term Birth
                                                </span>
                                            )}

                                            {healthConditionsCount > 0 ? (
                                                <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-red-100/30 flex items-center">
                                                    <AlertShieldIcon /> {healthConditionsCount} Health Alert{healthConditionsCount > 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-100/30 flex items-center">
                                                    <ShieldCheckIcon /> Vitals Healthy
                                                </span>
                                            )}
                                        </div>

                                        {/* Physical Stats Grid */}
                                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-2.5 tracking-wider">Physical Dimensions</p>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div>
                                                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 font-bold uppercase">
                                                        <HeightIcon /> Ht
                                                    </div>
                                                    <p className="text-xs font-black text-slate-700 dark:text-white mt-1">{child.height || '--'} cm</p>
                                                </div>
                                                <div className="border-l border-slate-200/50 dark:border-slate-800/80">
                                                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 font-bold uppercase">
                                                        <WeightIcon /> Wt
                                                    </div>
                                                    <p className="text-xs font-black text-slate-700 dark:text-white mt-1">{child.weight || '--'} kg</p>
                                                </div>
                                                <div className="border-l border-slate-200/50 dark:border-slate-800/80">
                                                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 font-bold uppercase">
                                                        <WaistIcon /> Wst
                                                    </div>
                                                    <p className="text-xs font-black text-slate-700 dark:text-white mt-1">{child.waistCircumference || '--'} cm</p>
                                                </div>
                                                <div className="border-l border-slate-200/50 dark:border-slate-800/80">
                                                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 font-bold uppercase">
                                                        <BmiIcon /> BMI
                                                    </div>
                                                    <div className="flex flex-col items-center mt-1">
                                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{bmiValue || '--'}</span>
                                                        {bmiValue && (
                                                            <div className={`mt-1 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase leading-none ${bmiDetails.color} flex items-center gap-1`}>
                                                                <span className={`w-1 h-1 rounded-full ${bmiDetails.dot}`}></span>
                                                                <span>{bmiDetails.label.split(' ')[0]}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Food Preferences Tags */}
                                        <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Food Taste Preferences</p>
                                            
                                            <div className="flex flex-col gap-2 text-xs">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/30 shrink-0 flex items-center leading-none mt-0.5">
                                                        <LikesIcon /> Likes
                                                    </span>
                                                    <div className="flex flex-wrap gap-1 min-w-0">
                                                        {favoriteFoodsList.length > 0 ? (
                                                            favoriteFoodsList.slice(0, 4).map((food, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-[10px] font-semibold text-slate-650 dark:text-slate-300 rounded hover:scale-[1.03] transition-transform">
                                                                    {food}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">None logged</span>
                                                        )}
                                                        {favoriteFoodsList.length > 4 && (
                                                            <span className="text-[9px] font-bold text-slate-400 self-center">+{favoriteFoodsList.length - 4} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-100/30 shrink-0 flex items-center leading-none mt-0.5">
                                                        <DislikesIcon /> Aversions
                                                    </span>
                                                    <div className="flex flex-wrap gap-1 min-w-0">
                                                        {dislikedFoodsList.length > 0 ? (
                                                            dislikedFoodsList.slice(0, 4).map((food, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-[10px] font-semibold text-slate-650 dark:text-slate-300 rounded hover:scale-[1.03] transition-transform">
                                                                    {food}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">None logged</span>
                                                        )}
                                                        {dislikedFoodsList.length > 4 && (
                                                            <span className="text-[9px] font-bold text-slate-400 self-center">+{dislikedFoodsList.length - 4} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lifestyle Summary */}
                                        <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Lifestyle Targets</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-300 min-w-0">
                                                    <span className="text-slate-400 flex items-center"><SportsIcon /> Sports:</span>
                                                    <span className="truncate max-w-[80px] font-extrabold text-[11px]">{child.sportsActivityLevel || '--'}</span>
                                                </div>
                                                <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 flex items-center"><SleepIcon /> Sleep:</span>
                                                    <span className="font-extrabold text-[11px]">{child.preferences?.sleepDuration ? `${child.preferences.sleepDuration}h` : '--'} ({child.preferences?.sleepQuality || '--'})</span>
                                                </div>
                                                <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 flex items-center"><HydrationIcon /> Water:</span>
                                                    <span className="font-extrabold text-[11px]">{child.preferences?.waterIntake ? `${child.preferences.waterIntake} ml` : '--'}</span>
                                                </div>
                                                <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 flex items-center"><ScreenIcon /> Screen:</span>
                                                    <span className="font-extrabold text-[11px]">{child.preferences?.screenTime !== undefined && child.preferences?.screenTime !== null && child.preferences?.screenTime !== '' ? `${child.preferences.screenTime} h/day` : '--'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medical Reports Vault */}
                                        <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Medical Reports Vault</span>
                                                <span className="text-[9px] bg-indigo-50 dark:bg-slate-900 border border-indigo-150/40 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-bold">
                                                    {child.medicalReports?.length || 0} Files
                                                </span>
                                            </div>
                                            {child.medicalReports && child.medicalReports.length > 0 ? (
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                    {child.medicalReports.slice(0, 3).map((rep, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50/60 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 shadow-3xs hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors">
                                                            <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[150px] flex items-center gap-1.5 text-[11px]">
                                                                <DocumentIcon /> {rep.reportName}
                                                            </span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border leading-none ${rep.status === 'Reviewed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-transparent dark:text-emerald-400' : 'bg-amber-50 border-amber-250 text-amber-700 dark:bg-amber-950/20 dark:border-transparent dark:text-amber-450'}`}>
                                                                {rep.status || 'Pending'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {child.medicalReports.length > 3 && (
                                                        <p className="text-[9px] text-slate-400 font-black text-right mt-1">+ {child.medicalReports.length - 3} more files in vault</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-450 italic">No medical laboratory reports attached.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                                        <button
                                            onClick={() => router.push(`/parent/child/${child._id}`)}
                                            className="py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center hover:scale-[1.02] duration-200 active:scale-95"
                                        >
                                            <ActionStatsIcon /> View Stats
                                        </button>
                                        <button
                                            onClick={() => setSelectedChildId(child._id)}
                                            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-650 dark:text-slate-250 font-extrabold text-xs rounded-xl transition text-center flex items-center justify-center border border-slate-200/20 hover:scale-[1.02] duration-200 active:scale-95"
                                        >
                                            <ActionEditIcon /> Edit Info
                                        </button>
                                        <button
                                            onClick={() => handleDelete(child._id, child.name)}
                                            className="py-2.5 bg-red-50 hover:bg-red-600 text-red-650 hover:text-white font-extrabold text-xs rounded-xl border border-red-100/30 dark:border-transparent transition text-center flex items-center justify-center hover:scale-[1.02] duration-200 active:scale-95"
                                        >
                                            <ActionTrashIcon /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Staging modal child add */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Child Profile"
                maxWidth="max-w-[95%] md:max-w-[65vw]"
            >
                <AddProfileForm
                    onSuccess={(created) => {
                        setIsAddModalOpen(false);
                        setInsightsProfile(created);
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Child Profile Modal */}
            <Modal
                isOpen={selectedChildId !== null}
                onClose={() => setSelectedChildId(null)}
                title={selectedChild ? `Manage Profile & Reports: ${selectedChild.name}` : "Manage Profile & Reports"}
                maxWidth="max-w-[95%] md:max-w-[85vw]"
            >
                {selectedChild && (
                    <ProfileInfoAndReports
                        profile={selectedChild}
                        onUpdate={() => {
                            fetchChildren(true);
                        }}
                    />
                )}
            </Modal>

            {/* Wellness Insights Modal Sibling */}
            <AnimatePresence>
                {insightsProfile && (
                    <WellnessInsightsModal
                        profile={insightsProfile}
                        onClose={(targetPath) => {
                            setInsightsProfile(null);
                            fetchChildren();
                            if (targetPath) {
                                router.push(targetPath);
                            } else {
                                router.push('/pricing');
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyChildren;
