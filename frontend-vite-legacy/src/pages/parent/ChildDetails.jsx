import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileById as getProfile } from '../../api/profile.api';
import { logMeal, deleteFoodItem } from '../../api/meal.api';
import { getMealFrequency, getPrescriptions, getNutritionTrends } from '../../api/analytics.api';
import { getGrowthHistory, deleteGrowthRecord } from '../../api/growth.api'; // Import API
import MealLogForm from '../../components/parent/MealLogForm';
import Modal from '../../components/common/Modal';
import MealFrequencyChart from '../../components/charts/MealFrequencyChart';
import NutritionTrendsChart from '../../components/charts/NutritionTrendsChart';
import TipCard from '../../components/common/TipCard';
import GrowthTimeline from '../../components/growth/GrowthTimeline'; // Import Component
import UpdateGrowthModal from '../../components/growth/UpdateGrowthModal'; // Import Component
import NutritionGaps from '../../components/parent/NutritionGaps'; // Import Component
import DailyMealCard from '../../components/meal/DailyMealCard';
import DateTimeline from '../../components/meal/DateTimeline';
import { getMealsByDate, getMealHistory } from '../../api/meal.api'; // Updated imports

const ChildDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [profile, setProfile] = useState(null);
    const [meals, setMeals] = useState([]);
    const [growthRecords, setGrowthRecords] = useState([]); // Growth State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Analytics
    const [chartData, setChartData] = useState([]);
    const [nutritionTrends, setNutritionTrends] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalInitialData, setModalInitialData] = useState(null);

    const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false); // Growth Modal State

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, historyRes, dailyRes, chartRes, prescRes, growthRes, nutritionRes] = await Promise.all([
                getProfile(id),
                getMealHistory(id),
                getMealsByDate(id, selectedDate),
                getMealFrequency(id),
                getPrescriptions(id),
                getGrowthHistory(id),
                getNutritionTrends(id)
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
        const todayStr = new Date().toISOString().split('T')[0];

        if (!meals || meals.length === 0) return { meals: 0, avgCal: 0, water: 0, streak: 0 };

        const uniqueDays = new Set(meals.map(m => new Date(m.date).toISOString().split('T')[0]));

        // Avg Calories (Daily Average)
        const totalCals = meals.reduce((acc, m) => acc + (m.nutrients?.calories || 0), 0);
        const avgCal = uniqueDays.size > 0 ? Math.round(totalCals / uniqueDays.size) : 0;

        // Water (Today)
        const waterToday = meals
            .filter(m => new Date(m.date).toISOString().split('T')[0] === todayStr)
            .reduce((acc, m) => acc + (m.waterIntake || 0), 0);

        // Streak Calculation
        let streak = 0;
        let checkDate = new Date();
        const checkDateStr = checkDate.toISOString().split('T')[0];

        let hasToday = uniqueDays.has(checkDateStr);
        let d = new Date(checkDate);

        if (!hasToday) {
            // Check yesterday
            d.setDate(d.getDate() - 1);
            const yesterdayStr = d.toISOString().split('T')[0];
            if (uniqueDays.has(yesterdayStr)) {
                hasToday = true;
            }
        }

        if (hasToday) {
            // Reset date to start checking backwards
            let currentCheck = new Date(d);
            // If we started from yesterday, currentCheck is yesterday. 
            // If we started from today, currentCheck is today.

            // Loop backwards
            while (true) {
                const dateStr = currentCheck.toISOString().split('T')[0];
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

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!profile) return null;

    const tabs = [
        { id: 'overview', label: 'Overview & Logs', icon: '📊' },
        { id: 'growth', label: 'Growth Timeline', icon: '📏' }, // New Tab
        { id: 'analytics', label: 'Nutrition Trends', icon: '📈' },
        { id: 'prescriptions', label: 'Checkup History', icon: '🩺' },
    ];

    return (
        <div className="space-y-8">
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

                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={() => navigate(`/kids/${profile._id}/dashboard`)}
                            className="bg-gradient-to-r from-blue-400 to-green-500 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 transform hover:scale-105 transition-all flex items-center gap-3 border-2 border-white/20"
                        >
                            <div>
                                <div className="text-xs font-bold opacity-90 uppercase tracking-wider">Switch to</div>
                                <div className="text-lg leading-none">Kids Mode</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

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
                                ? 'bg-white text-primary shadow-md border border-gray-50'
                                : 'text-gray-500 hover:bg-white/60 hover:text-gray-900'
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

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined">water_drop</span>
                                            </div>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Water Intake</p>
                                            <p className="text-3xl font-black text-gray-800 flex items-end gap-1">
                                                {stats.water}<span className="text-lg font-bold text-gray-400 mb-1">L</span>
                                            </p>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('growth')}
                                            className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white flex flex-col items-center text-center cursor-pointer hover:bg-indigo-700 transition-all transform hover:scale-105"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                                                <span className="material-symbols-outlined">monitor_weight</span>
                                            </div>
                                            <p className="text-indigo-200 font-bold text-xs uppercase tracking-wider mb-1">Current BMI</p>
                                            <p className="text-3xl font-black">{growthRecords.length > 0 ? growthRecords[growthRecords.length - 1].bmi : 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Nutrition Gaps AI Detector */}
                                    <div className="w-full">
                                        <NutritionGaps profile={profile} meals={meals} />
                                    </div>

                                    {/* Date Timeline & Meal Card */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-bold text-gray-900">Daily Log</h2>
                                            {/* Streak Badge Small */}
                                            <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                                                <span>🔥</span> {streak} Day Streak
                                            </div>
                                        </div>

                                        {/* Generate last 14 days for timeline */}
                                        <DateTimeline
                                            dates={Array.from({ length: 14 }).map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - i);
                                                const dStr = d.toISOString().split('T')[0];
                                                // Find completion count in history
                                                const log = history.find(h => h.date.split('T')[0] === dStr);
                                                // If backend returns date as string YYYY-MM-DD
                                                // const log = history.find(h => h.date === dStr);
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

                            {activeTab === 'prescriptions' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Checkup History</h2>
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

            {/* Update Growth Modal */}
            <UpdateGrowthModal
                isOpen={isGrowthModalOpen}
                onClose={() => setIsGrowthModalOpen(false)}
                childId={id}
                onChanged={refreshGrowth}
            />
        </div >
    );
};

export default ChildDetails;
