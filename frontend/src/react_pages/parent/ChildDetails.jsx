"use client";
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileById as getProfile } from '../../api/profile.api';
import { logMeal, deleteFoodItem } from '../../api/meal.api';
import { getMealFrequency, getPrescriptions, getNutritionTrends } from '../../api/analytics.api';
import { getGrowthHistory, deleteGrowthRecord } from '../../api/growth.api'; // Import API
import { getSleepHistory, getSleepByDate } from '../../api/sleep.api';
import MealLogForm from '../../components/parent/MealLogForm';
import SleepLogForm from '../../components/parent/SleepLogForm';
import Modal from '../../components/common/Modal';
import MealFrequencyChart from '../../components/charts/MealFrequencyChart';
import NutritionTrendsChart from '../../components/charts/NutritionTrendsChart';
import TipCard from '../../components/common/TipCard';
import GrowthTimeline from '../../components/growth/GrowthTimeline'; // Import Component
import InteractiveGrowthTracker from '../../components/growth/InteractiveGrowthTracker'; // Import Component
import DailyMealCard from '../../components/meal/DailyMealCard';
import DateTimeline from '../../components/meal/DateTimeline';
import { getMealsByDate, getMealHistory, getLastMealTime } from '../../api/meal.api'; // Updated imports
import ActivityTracking from '../../components/parent/ActivityTracking'; // Import Component
import DigitalTwinView from '../../components/parent/DigitalTwinView';
import ProfileInfoAndReports from '../../components/parent/ProfileInfoAndReports';
import WellnessAnalysis from './WellnessAnalysis';

const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ChildDetails = () => {
    const { id } = useParams();
    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    // State
    const [profile, setProfile] = useState(null);
    const [meals, setMeals] = useState([]);
    const [growthRecords, setGrowthRecords] = useState([]); // Growth State
    const [sleepHistory, setSleepHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab');

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Analytics
    const [chartData, setChartData] = useState([]);
    const [nutritionTrends, setNutritionTrends] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [modalInitialData, setModalInitialData] = useState(null);

    const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false); // Growth Modal State

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, historyRes, dailyRes, chartRes, prescRes, growthRes, nutritionRes, lastMealRes, sleepHistoryRes, sleepDayRes] = await Promise.all([
                getProfile(id),
                getMealHistory(id),
                getMealsByDate(id, selectedDate),
                getMealFrequency(id),
                getPrescriptions(id),
                getGrowthHistory(id),
                getNutritionTrends(id),
                getLastMealTime(id),
                getSleepHistory(id),
                getSleepByDate(id, selectedDate)
            ]);
            setProfile(profileRes.data || profileRes);
            // historyRes.data.logs might be the array, depends on API struct
            // If getMealHistory returns { logs: [], streak: 0 }
            const histData = historyRes.data || historyRes;
            setMeals(histData.logs || []);
            // We use standard "meals" state for history, and a new one for daily?
            // Actually, let's keep "meals" as the DAILY log object for the selected date
            // And maybe a separate "history" state for timeline dots?

            // Correction: Previous code used `meals` as a list of recent logs.
            // New design: `meals` should probably be the daily log object for `DailyMealCard`.
            // Let's create `dailyLog` state.

            setDailyLog(dailyRes.data || dailyRes);
            setHistory(histData.logs || []);
            setStreak(histData.streak || 0);

            setChartData(chartRes.data || chartRes || []);
            setPrescriptions(prescRes.data || prescRes || []);
            setGrowthRecords(growthRes.data || growthRes || []);
            setNutritionTrends(nutritionRes.data || nutritionRes || []);
            setLastMealStatus(lastMealRes.data || lastMealRes);
            setSleepHistory(sleepHistoryRes.data || sleepHistoryRes || []);
            setSleepLog(sleepDayRes.data || sleepDayRes);

        } catch (error) {
            console.error(error);
            // navigate('/parent/dashboard'); // Don't redirect on error to allow retry or partial load
        } finally {
            setLoading(false);
        }
    };

    // Additional state for new logic
    const [dailyLog, setDailyLog] = useState(null);
    const [history, setHistory] = useState([]);
    const [streak, setStreak] = useState(0);
    const [lastMealStatus, setLastMealStatus] = useState(null);
    const [sleepLog, setSleepLog] = useState(null);

    // Sleep streak calculator
    const sleepStreak = useMemo(() => {
        if (!sleepHistory || sleepHistory.length === 0) return 0;
        
        // Find dates that have logs and filter them
        const loggedDates = sleepHistory.map(entry => (entry.date || '').split('T')[0]);
        const uniqueDays = new Set(loggedDates);
        
        let streak = 0;
        let checkDate = new Date();
        const checkDateStr = getLocalDateString(checkDate);

        let hasToday = uniqueDays.has(checkDateStr);
        let d = new Date(checkDate);

        if (!hasToday) {
            // Check yesterday
            d.setDate(d.getDate() - 1);
            const yesterdayStr = getLocalDateString(d);
            if (uniqueDays.has(yesterdayStr)) {
                hasToday = true;
            }
        }

        if (hasToday) {
            let currentCheck = new Date(d);
            while (true) {
                const dateStr = getLocalDateString(currentCheck);
                if (uniqueDays.has(dateStr)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return streak;
    }, [sleepHistory]);

    // Checkup history countdown timer calculator
    const checkupTimer = useMemo(() => {
        if (!prescriptions || prescriptions.length === 0) return null;
        
        // Find the latest prescription/checkup
        const latest = prescriptions[0];
        const createdDate = new Date(latest.createdAt || latest.date || Date.now());
        const daysInterval = latest.nextCheckupDays || 90;
        
        const targetDate = new Date(createdDate.getTime() + daysInterval * 24 * 60 * 60 * 1000);
        const today = new Date();
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            daysLeft: diffDays,
            targetDate: targetDate.toLocaleDateString(),
            isDue: diffDays <= 0,
            daysInterval
        };
    }, [prescriptions]);

    // Water streak calculator (target: >= 1.5L water per day)
    const waterStreak = useMemo(() => {
        if (!meals || meals.length === 0) return 0;

        const getDailyWater = (m) => {
            const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
            return slots.reduce((total, slot) => {
                const items = m[slot] || [];
                return total + items.reduce((sum, item) => sum + (item.water || 0), 0);
            }, 0);
        };

        const getLogDateStr = (dateVal) => {
            if (!dateVal) return '';
            return typeof dateVal === 'string' ? dateVal.split('T')[0] : new Date(dateVal).toISOString().split('T')[0];
        };

        // Find dates that met the water target (>= 1500ml)
        const targetMetDates = new Set(
            meals
                .filter(m => getDailyWater(m) >= 1500)
                .map(m => getLogDateStr(m.date))
        );

        let streak = 0;
        let checkDate = new Date();
        const checkDateStr = getLocalDateString(checkDate);

        let hasToday = targetMetDates.has(checkDateStr);
        let d = new Date(checkDate);

        if (!hasToday) {
            // Check yesterday
            d.setDate(d.getDate() - 1);
            const yesterdayStr = getLocalDateString(d);
            if (targetMetDates.has(yesterdayStr)) {
                hasToday = true;
            }
        }

        if (hasToday) {
            let currentCheck = new Date(d);
            while (true) {
                const dateStr = getLocalDateString(currentCheck);
                if (targetMetDates.has(dateStr)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return streak;
    }, [meals]);

    const handleQuickAddWater = async () => {
        try {
            const todayStr = getLocalDateString();
            const mealType = 'morningSnack';
            
            const waterItem = {
                name: "Water",
                quantity: "1 glass (250ml)",
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
                fiber: 0,
                water: 250,
                vitamins: ""
            };

            const data = new FormData();
            data.append('profileId', id);
            data.append('date', todayStr);
            data.append('mealType', mealType);
            data.append('foodItems', JSON.stringify([waterItem]));
            data.append('nutrients', JSON.stringify({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 250 }));

            await logMeal(data);
            fetchData();
        } catch (err) {
            console.error("Failed to quick log water", err);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id, selectedDate]);

    const refreshGrowth = async () => {
        const res = await getGrowthHistory(id);
        setGrowthRecords(res.data || res || []);
        // Re-fetch profile to update header height/weight
        const profRes = await getProfile(id);
        setProfile(profRes.data || profRes);
    };

    const handleMealLogged = () => {
        setIsLogModalOpen(false);
        fetchData();
    };

    const handleDeleteItem = async (logId, mealType, itemId) => {
        if (!window.confirm("Remove this item?")) return;
        try {
            await deleteFoodItem(logId, mealType, itemId);
            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const handleGrowthDelete = async (recordId) => {
        if (window.confirm('Are you sure you want to delete this growth record?')) {
            try {
                await deleteGrowthRecord(recordId);
                refreshGrowth();
            } catch (error) {
                console.error('Failed to delete growth record:', error);
                alert("Failed to delete. You can only delete records you created.");
            }
        }
    };

    // Analytics Calculations
    const stats = useMemo(() => {
        const todayStr = getLocalDateString();

        if (!meals || meals.length === 0) return { meals: 0, avgCal: 0, water: 0, streak: 0 };

        const getLogDateStr = (dateVal) => {
            if (!dateVal) return '';
            return typeof dateVal === 'string' ? dateVal.split('T')[0] : new Date(dateVal).toISOString().split('T')[0];
        };

        const uniqueDays = new Set(meals.map(m => getLogDateStr(m.date)));

        const getDailyCals = (m) => {
            const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
            return slots.reduce((total, slot) => {
                const items = m[slot] || [];
                return total + items.reduce((sum, item) => sum + (item.calories || 0), 0);
            }, 0);
        };

        const getDailyWater = (m) => {
            const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
            return slots.reduce((total, slot) => {
                const items = m[slot] || [];
                return total + items.reduce((sum, item) => sum + (item.water || 0), 0);
            }, 0);
        };

        // Avg Calories (Daily Average)
        const totalCals = meals.reduce((acc, m) => acc + getDailyCals(m), 0);
        const avgCal = uniqueDays.size > 0 ? Math.round(totalCals / uniqueDays.size) : 0;

        // Water (Today)
        const waterToday = meals
            .filter(m => getLogDateStr(m.date) === todayStr)
            .reduce((acc, m) => acc + getDailyWater(m), 0);

        // Streak Calculation
        let streak = 0;
        let checkDate = new Date();
        const checkDateStr = getLocalDateString(checkDate);

        let hasToday = uniqueDays.has(checkDateStr);
        let d = new Date(checkDate);

        if (!hasToday) {
            // Check yesterday
            d.setDate(d.getDate() - 1);
            const yesterdayStr = getLocalDateString(d);
            if (uniqueDays.has(yesterdayStr)) {
                hasToday = true;
            }
        }

        if (hasToday) {
            let currentCheck = new Date(d);
            while (true) {
                const dateStr = getLocalDateString(currentCheck);
                if (uniqueDays.has(dateStr)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return { meals: meals.length, avgCal, water: (waterToday / 1000).toFixed(1), streak };
    }, [meals]);

    const sleepSummary = useMemo(() => {
        if (!sleepLog || !sleepLog.sleepTime) {
            return { status: 'No data', tone: 'bg-gray-50 text-gray-500 border-gray-100', message: 'No sleep log for the selected day.' };
        }
        const hours = sleepLog.totalSleepHours || 0;
        if (hours < 8) {
            return { status: 'Poor Sleep', tone: 'bg-red-50 text-red-600 border-red-100', message: 'Child is not getting enough sleep' };
        }
        if (hours <= 10) {
            return { status: 'Healthy', tone: 'bg-green-50 text-green-600 border-green-100', message: 'Sleep pattern is healthy' };
        }
        return { status: 'Oversleep', tone: 'bg-amber-50 text-amber-600 border-amber-100', message: 'Child is oversleeping' };
    }, [sleepLog]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!profile) return null;

    const tabs = [
        { id: 'overview', label: 'Overview & Logs', icon: '📊' },
        { id: 'profileInfo', label: 'Profile Info & Reports', icon: '📝' },
        { id: 'wellness', label: 'Wellness Analysis', icon: '✨' },
        { id: 'twin', label: 'Digital Twin', icon: '🤖' },
        { id: 'growth', label: 'Growth Timeline', icon: '📏' }, // New Tab
        { id: 'analytics', label: 'Nutrition Trends', icon: '📈' },
        { id: 'sleep', label: 'Sleep Tracking', icon: '😴' },
        { id: 'activity', label: 'Activity Tracking', icon: '🏃‍♂️' },
        { id: 'prescriptions', label: 'Checkup History', icon: '🩺' },
    ];

    return (
        <>
            <div className={`space-y-8 ${isGrowthModalOpen ? 'print:hidden' : ''}`}>
            {/* Header / Profile Summary */}
            <div className="glass-panel p-8 rounded-[2rem] relative overflow-hidden">
                <div className="blob-bg top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white/50 overflow-hidden">
                        {profile.profileImage ? (
                            <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-6xl">
                                {profile.avatar === 'lion' && '🦁'}
                                {profile.avatar === 'bear' && '🐻'}
                                {profile.avatar === 'rabbit' && '🐰'}
                                {profile.avatar === 'fox' && '🦊'}
                                {profile.avatar === 'cat' && '🐱'}
                                {profile.avatar === 'dog' && '🐶'}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-gray-900">{profile.name}</h1>
                            <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wider rounded-full self-center md:self-auto">Healthy</span>
                            {lastMealStatus?.timeGap && (
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-wider rounded-full self-center md:self-auto flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {lastMealStatus.timeGap}
                                </span>
                            )}
                        </div>

                        <p className="text-gray-500 font-medium mb-6">Level {profile.level || 1} Explorer • {profile.xp || 0} XP</p>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <div className="bg-white/50 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-white/60 shadow-sm">
                                🎂 {profile.age} Years
                            </div>
                            <div className="bg-white/50 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-white/60 shadow-sm">
                                {profile.height} cm
                            </div>
                            <div className="bg-white/50 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-white/60 shadow-sm">
                                {profile.weight} kg
                            </div>
                        </div>
                    </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate(`/kids/${profile._id}/dashboard`)}
                                className="bg-gradient-to-r from-blue-400 to-green-500 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 transform hover:scale-105 transition-all flex items-center gap-3 border-2 border-white/20"
                            >
                                <div>
                                    <div className="text-xs font-bold opacity-90 uppercase tracking-wider">Switch to</div>
                                    <div className="text-lg leading-none">Kids Mode</div>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate(`/nutrition-analysis/${profile._id}`)}
                                className="bg-white text-indigo-600 font-black py-3 px-8 rounded-2xl shadow-md border-2 border-indigo-50 hover:bg-indigo-50 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🍎</span>
                                <span>Nutrition Insights</span>
                            </button>
                        </div>
                </div>
            </div>

            {/* Pediatrician Escalation Banner */}
            {(() => {
                const latestRecord = growthRecords[growthRecords.length - 1];
                let alertMessage = null;
                
                if (latestRecord) {
                    if (latestRecord.riskStatus === 'obese') {
                        alertMessage = "BMI category indicates Obese.";
                    } else if (latestRecord.riskStatus === 'underweight') {
                        alertMessage = "BMI category indicates Severely Underweight.";
                    }
                }
                
                // Mock condition for severe nutrient deficiency 
                // (could be derived from nutritionTrends or meals if implemented, using average calories check as fallback)
                if (!alertMessage && stats.avgCal > 0 && stats.avgCal < 800 && history.length > 5) {
                    alertMessage = "Severe nutrient deficiency detected over multiple days.";
                }

                if (alertMessage) {
                    return (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
                            <div className="bg-red-100 text-red-500 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-red-800 font-bold mb-1">Consult Pediatrician Immediately</h4>
                                <p className="text-red-600 text-sm">
                                    {alertMessage} This is an automated safety alert. Please schedule a checkup for professional medical advice.
                                </p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* 90-Day Growth Reminder Banner */}
            {(() => {
                const latestRecord = growthRecords[growthRecords.length - 1];
                const daysSinceRecord = latestRecord 
                    ? Math.floor((new Date() - new Date(latestRecord.timestamp)) / (1000 * 60 * 60 * 24))
                    : Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24));
                
                if (daysSinceRecord >= 90) {
                    return (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-4">
                            <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
                            <div className="flex-1">
                                <h4 className="text-red-800 font-bold mb-1">Update Required: Growth Stats</h4>
                                <p className="text-red-600 text-sm">
                                    It's been {daysSinceRecord} days since {profile.name}'s growth details were last updated. 
                                    Please <button onClick={() => { setActiveTab('growth'); setIsGrowthModalOpen(true); }} className="font-bold underline hover:text-red-800">update their height and weight</button> to ensure accurate health tracking.
                                </p>
                            </div>
                        </div>
                    );
                } else if (daysSinceRecord >= 85) {
                    const daysLeft = 90 - daysSinceRecord;
                    return (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm flex items-start gap-4">
                            <span className="material-symbols-outlined text-orange-500 mt-0.5">schedule</span>
                            <div className="flex-1">
                                <h4 className="text-orange-800 font-bold mb-1">Upcoming Growth Update</h4>
                                <p className="text-orange-700 text-sm">
                                    Reminder: {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to update {profile.name}’s growth details. 
                                    Please <button onClick={() => { setActiveTab('growth'); setIsGrowthModalOpen(true); }} className="font-bold underline hover:text-orange-800">update their height and weight</button> soon.
                                </p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Column: Vertical Navigation */}
                <div className="lg:col-span-1 space-y-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-4 ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-slate-200/80 dark:border-slate-700'
                                : 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/20'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}

                    {/* Streak Widget */}
                    <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 hidden lg:block">
                        <h4 className="font-bold text-blue-900 mb-4">Weekly Streak</h4>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <div className="text-3xl font-black text-blue-600">{stats.streak} Days</div>
                                <div className="text-xs text-blue-400 font-bold uppercase">Target: 5 Days</div>
                            </div>
                            <div className="text-4xl">🔥</div>
                        </div>
                        <div className="w-full bg-blue-200 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.streak / 5) * 100, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Hydration Streak Widget */}
                    <div className="mt-4 bg-cyan-50 rounded-2xl p-6 border border-cyan-100 hidden lg:block">
                        <h4 className="font-bold text-cyan-900 mb-4">Hydration Streak</h4>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <div className="text-3xl font-black text-cyan-600">{waterStreak} Days</div>
                                <div className="text-xs text-cyan-400 font-bold uppercase">Target: 1.5L / Day</div>
                            </div>
                            <div className="text-4xl">💧</div>
                        </div>
                        <div className="w-full bg-cyan-200 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((waterStreak / 5) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tab Content */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    {/* Daily Tip */}
                                    <div className="w-full">
                                        <TipCard tip={profile.tips?.[0]} childName={profile.name} />
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined">restaurant</span>
                                            </div>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Meals Logged</p>
                                            <p className="text-3xl font-black text-gray-800">{stats.meals}</p>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined">local_fire_department</span>
                                            </div>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Avg Calories</p>
                                            <p className="text-3xl font-black text-gray-800">{stats.avgCal}</p>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors relative">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined">water_drop</span>
                                            </div>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Water Intake</p>
                                            <p className="text-3xl font-black text-gray-800 flex items-end gap-1">
                                                {stats.water}<span className="text-lg font-bold text-gray-400 mb-1">L</span>
                                            </p>
                                            <button 
                                                onClick={handleQuickAddWater}
                                                className="mt-3 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-black flex items-center gap-1 transition-all"
                                            >
                                                <span>+ 250ml Glass</span>
                                            </button>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${sleepSummary.tone.split(' ')[0]}`}>
                                                <span className="material-symbols-outlined">bedtime</span>
                                            </div>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Sleep</p>
                                            <p className="text-3xl font-black text-gray-800">{sleepLog?.sleepTime ? `${sleepLog.totalSleepHours}h` : '--'}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{sleepSummary.status}</p>
                                        </div>
                                    </div>



                                    {/* Date Timeline & Meal Card */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-bold text-gray-900">Daily Log</h2>
                                            {/* Streak Badge Small */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-xs font-bold border border-cyan-100">
                                                    <span>💧</span> {waterStreak} Day Hydration Streak
                                                </div>
                                                <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                                                    <span>🔥</span> {streak} Day Streak
                                                </div>
                                            </div>
                                        </div>

                                        {/* Generate last 14 days for timeline */}
                                        <DateTimeline
                                            dates={Array.from({ length: 14 }).map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - i);
                                                const dStr = getLocalDateString(d);
                                                // Find completion count in history
                                                const log = history.find(h => (h.date || '').split('T')[0] === dStr);
                                                return {
                                                    date: dStr,
                                                    completedCount: log ? log.completedMealsCount : 0
                                                };
                                            }).reverse()}
                                            selectedDate={selectedDate}
                                            onSelect={setSelectedDate}
                                            streak={streak}
                                        />

                                        <DailyMealCard
                                            date={selectedDate}
                                            log={dailyLog}
                                            onAdd={(type) => {
                                                setModalInitialData({ date: selectedDate, mealType: type });
                                                setIsLogModalOpen(true);
                                            }}
                                            onEdit={(type) => {
                                                setModalInitialData({ date: selectedDate, mealType: type });
                                                setIsLogModalOpen(true);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profileInfo' && (
                                <div className="space-y-12">
                                    <ProfileInfoAndReports 
                                        profile={profile} 
                                        onUpdate={fetchData} 
                                    />
                                    <div className="border-t pt-8">
                                        <div className="mb-6 text-center md:text-left">
                                            <h2 className="text-2xl font-black text-gray-900">Latest Wellness Analysis</h2>
                                            <p className="text-gray-500 text-sm font-bold mt-1">
                                                Computed automatically from the child's latest metrics, habits, and clinical settings.
                                            </p>
                                        </div>
                                        <WellnessAnalysis 
                                            profileId={id} 
                                            profileData={profile} 
                                            onUpdate={fetchData} 
                                            hideHeader={true} 
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wellness' && (
                                <WellnessAnalysis 
                                    profileData={profile} 
                                    onUpdate={fetchData}
                                    hideHeader={true} 
                                />
                            )}

                            {activeTab === 'twin' && (
                                <DigitalTwinView profileId={id} profile={profile} />
                            )}

                            {activeTab === 'growth' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-900">Growth Timeline</h2>
                                        <button
                                            onClick={() => setIsGrowthModalOpen(true)}
                                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-blue-600 transition flex items-center gap-2"
                                        >
                                            <span>📏</span> Update Growth
                                        </button>
                                    </div>
                                    <GrowthTimeline data={growthRecords} profile={profile} onDelete={handleGrowthDelete} />
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <NutritionTrendsChart
                                    data={nutritionTrends}
                                    mealFrequencyData={chartData}
                                />
                            )}

                             {activeTab === 'sleep' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-900">Sleep Tracking</h2>
                                        {/* Sleep Streak Badge */}
                                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-2xl text-sm font-bold border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-pulse">
                                            <span>🔥</span> {sleepStreak} Day Sleep Streak
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4">Log Sleep</h3>
                                        <SleepLogForm
                                            profileId={id}
                                            initialData={{
                                                date: selectedDate,
                                                sleepTime: sleepLog?.sleepTime || '21:00',
                                                wakeUpTime: sleepLog?.wakeUpTime || '06:00',
                                                notes: sleepLog?.notes || '',
                                            }}
                                            onSuccess={fetchData}
                                            showCancel={false}
                                        />
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4">Recent Sleep Logs</h3>
                                        {sleepHistory.length === 0 ? (
                                            <p className="text-sm text-gray-500">No sleep logs found yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sleepHistory.slice(0, 7).map((entry) => (
                                                    <div key={entry._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{entry.date}</p>
                                                            <p className="text-xs text-gray-500">{entry.sleepTime} - {entry.wakeUpTime}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-gray-900">{entry.totalSleepHours} hrs</p>
                                                            <p className={`text-xs font-bold ${entry.status === 'healthy' ? 'text-green-600' : entry.status === 'poor' ? 'text-red-600' : 'text-amber-600'}`}>
                                                                {entry.status === 'healthy' ? 'Healthy' : entry.status === 'poor' ? 'Poor Sleep' : 'Oversleep'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <ActivityTracking 
                                    profileId={id} 
                                    selectedDate={selectedDate} 
                                />
                            )}

                             {activeTab === 'prescriptions' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-900">Checkup History</h2>
                                    </div>

                                    {checkupTimer && (
                                        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-sm ${checkupTimer.isDue ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/50 dark:to-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200'}`}>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${checkupTimer.isDue ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                                                    🩺
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-lg">Next Pediatrician Checkup</h3>
                                                    <p className="text-sm opacity-90">
                                                        {checkupTimer.isDue 
                                                            ? `A routine checkup is due now! (Scheduled every ${checkupTimer.daysInterval} days)` 
                                                            : `Still ${checkupTimer.daysLeft} days left for next checkup (Target: ${checkupTimer.targetDate})`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            {!checkupTimer.isDue && (
                                                <div className="px-5 py-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                                                    <p className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest leading-none mb-1">Countdown</p>
                                                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{checkupTimer.daysLeft} Days</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {prescriptions.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500 font-medium">No past checkups found.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {prescriptions.map(p => (
                                                <div key={p._id} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-primary relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Checkup Details</span>
                                                            <span className="text-sm text-gray-400 font-medium">{new Date(p.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{p.title}</h3>
                                                        {p.diagnosis && <p className="text-gray-800 mb-2 font-semibold">Diagnosis: <span className="font-normal text-gray-700">{p.diagnosis}</span></p>}
                                                        <div className="bg-gray-50 p-4 rounded-xl mb-3">
                                                            <p className="text-sm font-bold text-gray-700 mb-1">Prescription</p>
                                                            <p className="text-gray-600 leading-relaxed">{p.instructions}</p>
                                                        </div>
                                                        {p.notes && (
                                                            <div className="mb-3 pl-3 border-l-2 border-gray-200">
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Doctor's Notes</p>
                                                                <p className="text-gray-600 italic text-sm">{p.notes}</p>
                                                            </div>
                                                        )}
                                                        <div className="mt-4 flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">👨‍⚕️</div>
                                                            <p className="text-sm font-bold text-gray-700">Dr. {p.doctorId?.name || 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            </div>

            {/* Log Meal Modal */}
            <Modal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                title={`Log Meal for ${profile.name}`}
                maxWidth="max-w-5xl"
            >
                <MealLogForm
                    profileId={id}
                    initialData={modalInitialData}
                    onSuccess={handleMealLogged}
                    onCancel={() => setIsLogModalOpen(false)}
                />
            </Modal>

            {/* Interactive Growth Tracker Dashboard Modal */}
            <InteractiveGrowthTracker
                isOpen={isGrowthModalOpen}
                onClose={() => setIsGrowthModalOpen(false)}
                childId={id}
                profile={profile}
                growthHistory={growthRecords}
                onChanged={refreshGrowth}
            />
        </>
    );
};

export default ChildDetails;
