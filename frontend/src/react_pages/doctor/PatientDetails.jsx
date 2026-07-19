"use client";
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getMealFrequency, getPrescriptions, createPrescription } from '../../api/analytics.api';
import MealFrequencyChart from '../../components/charts/MealFrequencyChart';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import DoctorTwinView from '../../components/doctor/DoctorTwinView';
import GrowthVelocityCenter from '../../components/doctor/GrowthVelocityCenter';
import { getGrowthVelocity } from '../../api/doctor.api';
import VideoCall from '../../components/video/VideoCall';
import { useAuth } from '../../context/AuthContext';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
};

const PatientDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [meals, setMeals] = useState([]);
    const [status, setStatus] = useState('active');
    const [consultationRequestId, setConsultationRequestId] = useState('');
    const [doctorNotes, setDoctorNotes] = useState('');
    const [savingDoctorNotes, setSavingDoctorNotes] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeCall, setActiveCall] = useState(false);
    const [videoCallLogs, setVideoCallLogs] = useState([]);

    // Clinician Specialization Check
    const [clinician, setClinician] = useState(null);

    // Analytics Data
    const [chartData, setChartData] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    // Growth Velocity
    const [growthVelocityData, setGrowthVelocityData] = useState(null);
    const [growthVelocityLoading, setGrowthVelocityLoading] = useState(false);

    // Form State
    const [newPrescription, setNewPrescription] = useState({ title: '', instructions: '', nextCheckupDays: 90 });
    const [loading, setLoading] = useState(true);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const detailRes = await api.get(`/doctor/child/${id}`);
            setProfile(detailRes.data.data.profile);
            setMeals(detailRes.data.data.meals || []);
            setStatus(detailRes.data.data.status);
            setConsultationRequestId(detailRes.data.data.consultationRequestId || '');
            setDoctorNotes(detailRes.data.data.doctorNotes || '');
            setVideoCallLogs(detailRes.data.data.videoCallLogs || []);

            // Fetch clinician details to check specialization
            try {
                const clinRes = await api.get('/doctor/me');
                setClinician(clinRes.data.data);
            } catch (err) {
                console.error("Failed to load clinician profile:", err);
            }

            if (detailRes.data.data && detailRes.data.data.status === 'active') {
                const chartRes = await getMealFrequency(id);
                setChartData(chartRes.data);

                const prescRes = await getPrescriptions(id);
                setPrescriptions(prescRes.data);

                // Fetch growth velocity
                setGrowthVelocityLoading(true);
                getGrowthVelocity(id)
                    .then(res => setGrowthVelocityData(res.data))
                    .catch(err => console.error('Growth velocity fetch failed:', err))
                    .finally(() => setGrowthVelocityLoading(false));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load patient details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handlePrescribe = async (e) => {
        e.preventDefault();
        try {
            await createPrescription({ profileId: id, ...newPrescription });
            setNewPrescription({ title: '', instructions: '', nextCheckupDays: 90 });
            const prescRes = await getPrescriptions(id);
            setPrescriptions(prescRes.data);
            toast.success(isDietitian ? 'Meal Plan advice sent!' : 'Prescription sent!');
        } catch (error) {
            toast.error('Failed to send record');
        }
    };

    const handleSaveDoctorNotes = async () => {
        if (!consultationRequestId) return;
        try {
            setSavingDoctorNotes(true);
            await api.patch(`/consultations/${consultationRequestId}/doctor-notes`, { notes: doctorNotes });
            toast.success('Doctor notes saved');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save doctor notes');
        } finally {
            setSavingDoctorNotes(false);
        }
    };

    const handleJoinVideoCall = () => {
        if (!consultationRequestId) {
            toast.error('No active consultation linked to this patient.');
            return;
        }
        setActiveCall(true);
    };

    // Determine clinician role dynamically
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const isDietitian = useMemo(() => {
        const spec = clinician?.doctorProfile?.specialization?.toLowerCase() || '';
        return spec.includes('diet') || spec.includes('nutrition') || spec.includes('dietetic');
    }, [clinician]);

    // Compute dynamic tabs based on status and clinician role
    const tabs = useMemo(() => {
        if (status !== 'active') {
            return [
                { id: 'consultation', label: 'Consultation', icon: '💬' },
                { id: 'prescriptions', label: 'Initial Advice', icon: '📝' },
            ];
        }

        if (isDietitian) {
            return [
                { id: 'overview',        label: 'Nutrition Intake',     icon: '🥗' },
                { id: 'detected-foods',  label: 'Detected Foods',      icon: '🍳' },
                { id: 'meal-patterns',   label: 'Meal Patterns',       icon: '📊' },
                { id: 'suggested-plans', label: 'Suggested Meal Plans', icon: '📋' },
                { id: 'growth-velocity', label: 'Growth Velocity',      icon: '📈' },
                { id: 'twin',            label: 'Digital Twin View',    icon: '🤖' },
                { id: 'video-calls',     label: 'Video Consultations',  icon: '📹' },
            ];
        } else {
            return [
                { id: 'overview',        label: 'Clinical Overview',    icon: '📊' },
                { id: 'growth-velocity', label: 'Growth Velocity',      icon: '📈' },
                { id: 'twin',            label: 'Digital Twin View',    icon: '🤖' },
                { id: 'nutrition-trends',label: 'Nutrition Trends',     icon: '📈' },
                { id: 'food-patterns',   label: 'Food Patterns',        icon: '🍉' },
                { id: 'deficiency-risks',label: 'Deficiency Risks',     icon: '⚠️' },
                { id: 'prescriptions',   label: 'Prescriptions',        icon: '📝' },
                { id: 'video-calls',     label: 'Video Consultations',  icon: '📹' },
            ];
        }
    }, [status, isDietitian]);

    // Computed Dietitian Intake Stats
    const dietitianStats = useMemo(() => {
        if (!meals || meals.length === 0) {
            return {
                calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
                iron: 0, calcium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, zinc: 0, water: 0
            };
        }
        let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, totalFib = 0, totalIr = 0, totalCalc = 0, totalA = 0, totalC_vit = 0, totalD = 0, totalZn = 0, totalW = 0;
        const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        
        meals.forEach(m => {
            slots.forEach(slot => {
                const macros = m.mealMacros?.[slot] || {};
                totalCal += macros.calories || 0;
                totalP += macros.protein || 0;
                totalC += macros.carbs || 0;
                totalF += (macros.fat || macros.fats || 0);

                const items = m[slot] || [];
                items.forEach(item => {
                    totalFib += item.fiber || 0;
                    totalIr += item.iron || 0;
                    totalCalc += item.calcium || 0;
                    totalC_vit += item.vitaminC || 0;
                    totalA += item.vitaminA || 0;
                    totalD += item.vitaminD || 0;
                    totalZn += item.zinc || 0;
                    totalW += item.water || 0;
                });
            });
        });

        const days = Math.max(1, meals.length);
        return {
            calories: totalCal / days,
            protein: totalP / days,
            carbs: totalC / days,
            fat: totalF / days,
            fiber: totalFib / days,
            iron: totalIr / days,
            calcium: totalCalc / days,
            vitaminA: totalA / days,
            vitaminC: totalC_vit / days,
            vitaminD: totalD / days,
            zinc: totalZn / days,
            water: totalW / days
        };
    }, [meals]);

    // Recommended Nutrition targets for dietitians view
    const targets = useMemo(() => {
        if (profile?.wellnessAnalysis?.rdas) {
            return {
                calories: profile.wellnessAnalysis.rdas.calories,
                protein: profile.wellnessAnalysis.rdas.protein,
                carbs: profile.wellnessAnalysis.rdas.carbs,
                fat: profile.wellnessAnalysis.rdas.fat || profile.wellnessAnalysis.rdas.fats || 50,
                fiber: profile.wellnessAnalysis.rdas.fiber || 20,
                iron: profile.wellnessAnalysis.rdas.iron || 11,
                calcium: profile.wellnessAnalysis.rdas.calcium || 600,
                vitaminA: profile.wellnessAnalysis.rdas.vitaminA || 500,
                vitaminC: profile.wellnessAnalysis.rdas.vitaminC || 40,
                vitaminD: profile.wellnessAnalysis.rdas.vitaminD || 15,
                zinc: profile.wellnessAnalysis.rdas.zinc || 7,
                water: profile.wellnessAnalysis.rdas.water || 1500
            };
        }
        const age = Number(profile?.age || 0);
        return {
            calories: age <= 3 ? 1200 : (age <= 8 ? 1600 : 2000),
            protein: age <= 3 ? 15 : (age <= 8 ? 25 : 30),
            carbs: age <= 3 ? 130 : (age <= 8 ? 150 : 180),
            fat: age <= 3 ? 35 : (age <= 8 ? 45 : 55),
            fiber: age <= 3 ? 15 : (age <= 8 ? 20 : 25),
            iron: age <= 3 ? 9 : (age <= 8 ? 11 : 15),
            calcium: age <= 3 ? 500 : (age <= 8 ? 550 : 650),
            vitaminA: age <= 3 ? 390 : (age <= 8 ? 510 : 630),
            vitaminC: age <= 3 ? 35 : (age <= 8 ? 40 : 45),
            vitaminD: 15,
            zinc: age <= 3 ? 5 : (age <= 8 ? 7 : 8.5),
            water: age <= 3 ? 1200 : (age <= 8 ? 1500 : 1800)
        };
    }, [profile]);

    // Dietitian Scanned Foods list
    const allDetectedFoods = useMemo(() => {
        const list = [];
        const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        meals.forEach(m => {
            slots.forEach(slot => {
                const items = m[slot] || [];
                const slotImage = m.images?.[slot];
                items.forEach(item => {
                    list.push({
                        ...item,
                        date: m.date,
                        slotName: slot.charAt(0).toUpperCase() + slot.slice(1),
                        imageUrl: slotImage
                    });
                });
            });
        });
        return list;
    }, [meals]);

    // Doctor common food patterns
    const commonFoods = useMemo(() => {
        const counts = {};
        const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        meals.forEach(m => {
            slots.forEach(slot => {
                const items = m[slot] || [];
                items.forEach(item => {
                    counts[item.name] = (counts[item.name] || 0) + 1;
                });
            });
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [meals]);

    useEffect(() => {
        if (status === 'pending' && activeTab === 'overview') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab('consultation');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!profile) return null;


    return (
        <div className="space-y-8">
            {/* Video Call Modal */}
            <AnimatePresence>
                {activeCall && consultationRequestId && (
                    <VideoCall
                        consultationId={consultationRequestId}
                        userRole="doctor"
                        userName={user?.name || 'Doctor'}
                        onClose={() => {
                            setActiveCall(false);
                            fetchAllData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header Card */}
            <div className={`p-8 rounded-[2rem] shadow-sm border flex flex-col md:flex-row items-center md:items-start gap-8 ${status === 'restricted' ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner overflow-hidden ${status === 'restricted' ? 'bg-amber-100' : 'bg-blue-50'}`}>
                    {profile.profileImage ? (
                        <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span>
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
                        <h1 className="text-3xl font-black text-gray-900">{profile.name}</h1>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 w-fit mx-auto md:mx-0">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            {isDietitian ? 'Dietitian Dashboard (Read-Only)' : 'Doctor View Mode (Read-Only)'}
                        </span>
                    </div>
                    <p className="text-gray-500 font-medium mb-4">Patient ID: {profile._id} • Clinician Role: {isDietitian ? 'Dietitian' : 'Pediatric Specialist'}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="bg-white/60 px-4 py-2 rounded-xl border border-white shadow-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase">Age</p>
                            <p className="font-bold text-gray-900">{profile.age} Years</p>
                        </div>
                        <div className="bg-white/60 px-4 py-2 rounded-xl border border-white shadow-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase">Height</p>
                            <p className="font-bold text-gray-900">{profile.height} cm</p>
                        </div>
                        <div className="bg-white/60 px-4 py-2 rounded-xl border border-white shadow-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase">Weight</p>
                            <p className="font-bold text-gray-900">{profile.weight} kg</p>
                        </div>
                    </div>
                </div>

                {/* Video Call Button */}
                {status === 'active' && consultationRequestId && (
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleJoinVideoCall}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition flex items-center gap-2 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">video_call</span>
                            Video Call with Patient
                        </button>
                        <p className="text-[10px] text-gray-400 font-medium">Built-in secure video call</p>
                    </div>
                )}
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
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
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'consultation' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">forum</span>
                                            Parent&apos;s Consultation Message
                                        </h2>
                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 relative z-10">
                                            <p className="text-blue-900 font-medium leading-relaxed italic">
                                                &ldquo;{message || 'No specific message provided.'}&rdquo;
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Nutrition Intake (Dietitian Overview) */}
                            {activeTab === 'overview' && isDietitian && status === 'active' && (
                                <div className="space-y-6">
                                    {/* Child Growth Progression Details */}
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-500">monitoring</span>
                                                Child Growth Progression Details
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">Current child anthropometrics and growth indicators recorded in the system.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border rounded-2xl flex items-center gap-3">
                                                <span className="text-2xl">📏</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Height</p>
                                                    <p className="font-extrabold text-slate-800 dark:text-white">{profile.height} cm</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border rounded-2xl flex items-center gap-3">
                                                <span className="text-2xl">⚖️</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Weight</p>
                                                    <p className="font-extrabold text-slate-800 dark:text-white">{profile.weight} kg</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border rounded-2xl flex items-center gap-3">
                                                <span className="text-2xl">📊</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Body Mass Index (BMI)</p>
                                                    <p className="font-extrabold text-slate-800 dark:text-white">
                                                        {profile.height && profile.weight ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : '--'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Nutrition Intake Evaluation</h3>
                                            <p className="text-xs text-gray-500 mt-1">Average daily intake calculated from logged meals vs targets based on pediatric guidelines.</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-center">
                                                <p className="text-[10px] font-black text-orange-600 uppercase">Avg Calories</p>
                                                <p className="text-xl font-black text-gray-950 mt-1">{Math.round(dietitianStats.calories)} kcal</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Target: {targets.calories} kcal</p>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
                                                <p className="text-[10px] font-black text-blue-600 uppercase">Avg Protein</p>
                                                <p className="text-xl font-black text-gray-950 mt-1">{Math.round(dietitianStats.protein * 10) / 10}g</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Target: {targets.protein}g</p>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl text-center">
                                                <p className="text-[10px] font-black text-yellow-600 uppercase">Avg Carbs</p>
                                                <p className="text-xl font-black text-gray-950 mt-1">{Math.round(dietitianStats.carbs * 10) / 10}g</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Target: {targets.carbs}g</p>
                                            </div>
                                            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-center">
                                                <p className="text-[10px] font-black text-green-600 uppercase">Avg Fats</p>
                                                <p className="text-xl font-black text-gray-950 mt-1">{Math.round(dietitianStats.fat * 10) / 10}g</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Target: {targets.fat}g</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <h4 className="font-bold text-sm text-gray-800">Target Comparison Percentiles (12 Pediatric Nutrients)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'calories', label: 'Calories', unit: 'kcal' },
                                                    { key: 'protein', label: 'Protein', unit: 'g' },
                                                    { key: 'carbs', label: 'Carbs', unit: 'g' },
                                                    { key: 'fat', label: 'Fats', unit: 'g' },
                                                    { key: 'fiber', label: 'Fiber', unit: 'g' },
                                                    { key: 'iron', label: 'Iron', unit: 'mg' },
                                                    { key: 'calcium', label: 'Calcium', unit: 'mg' },
                                                    { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
                                                    { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
                                                    { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
                                                    { key: 'zinc', label: 'Zinc', unit: 'mg' },
                                                    { key: 'water', label: 'Water Intake', unit: 'ml' }
                                                ].map(n => {
                                                    const current = dietitianStats[n.key] || 0;
                                                    const target = targets[n.key] || 1;
                                                    const pct = Math.min(100, Math.round((current / target) * 100));
                                                    return (
                                                        <div key={n.key} className="space-y-1">
                                                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                                                <span>{n.label}</span>
                                                                <span>{pct}% ({current.toFixed(1)} / {target.toFixed(1)} {n.unit})</span>
                                                            </div>
                                                            <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${pct < 50 ? 'bg-red-500' : pct < 70 ? 'bg-orange-500' : pct < 90 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Food Recommendations */}
                                        {profile.wellnessAnalysis?.recommendations && profile.wellnessAnalysis.recommendations.length > 0 && (
                                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                                <h4 className="font-black text-sm text-gray-800 uppercase tracking-wider">Suggested Food Recommendations</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {profile.wellnessAnalysis.recommendations.map((rec, idx) => (
                                                        <div key={idx} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                                                            <span className="text-xl shrink-0">{rec.icon}</span>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-xs">{rec.concern}</p>
                                                                <p className="text-xs text-indigo-950 font-bold mt-1">{rec.solution}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{rec.expectedImprovement}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grocery List suggestions */}
                                        {profile.wellnessAnalysis?.groceries && profile.wellnessAnalysis.groceries.length > 0 && (
                                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                                <h4 className="font-black text-sm text-gray-800 uppercase tracking-wider">Grocery Suggestions</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.wellnessAnalysis.groceries.map((item, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                                                            🛒 {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Meal Planning Opportunities */}
                                        {profile.wellnessAnalysis?.improvementPlan && (
                                            <div className="pt-6 border-t border-gray-105 space-y-4">
                                                <h4 className="font-black text-sm text-gray-800 uppercase tracking-wider">Meal Planning Opportunities</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {[
                                                        { phase: 'day7', title: '7-Day Setup' },
                                                        { phase: 'day30', title: '30-Day Portion' },
                                                        { phase: 'day90', title: '90-Day Maintenance' }
                                                    ].map((item, idx) => {
                                                        const phaseDetails = profile.wellnessAnalysis.improvementPlan.phases?.[item.phase] || { action: 'Stabilize nutrition logs' };
                                                        return (
                                                            <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                                                                <p className="text-[9px] font-black text-indigo-600 uppercase">{item.title}</p>
                                                                <p className="text-xs font-semibold text-gray-700 leading-relaxed">{phaseDetails.action}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: Detected Foods (Dietitian Only) */}
                            {activeTab === 'detected-foods' && isDietitian && status === 'active' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">AI Scanned Food Registry</h3>
                                        {allDetectedFoods.length === 0 ? (
                                            <p className="text-gray-500 italic">No foods logged/scanned recently.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {allDetectedFoods.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-gray-55/40 border border-gray-100 rounded-2xl flex gap-4">
                                                        {item.imageUrl && (
                                                            <img 
                                                                src={getImageUrl(item.imageUrl)} 
                                                                alt="" 
                                                                className="w-16 h-16 object-cover rounded-xl border" 
                                                            />
                                                        )}
                                                        <div className="flex-1 space-y-1">
                                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{item.slotName} • {new Date(item.date).toLocaleDateString()}</p>
                                                            <div className="flex gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded w-fit">
                                                                <span>{item.calories || 0} Cal</span>
                                                                <span>•</span>
                                                                <span>{item.protein || 0}g P</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4">Doctor Notes</h2>
                                        <textarea
                                            value={doctorNotes}
                                            onChange={(e) => setDoctorNotes(e.target.value)}
                                            rows="5"
                                            className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                            placeholder="Write consultation notes for this case..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveDoctorNotes}
                                            disabled={savingDoctorNotes || !consultationRequestId}
                                            className="mt-3 px-5 py-2.5 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                        >
                                            {savingDoctorNotes ? 'Saving...' : 'Save Notes'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Meal Patterns (Dietitian Only) */}
                            {activeTab === 'meal-patterns' && isDietitian && status === 'active' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                        <h3 className="text-xl font-bold text-gray-900">Meal Frequency & Timings</h3>
                                        <MealFrequencyChart data={chartData} />
                                        
                                        <div className="pt-4 border-t border-gray-100 space-y-3">
                                            <h4 className="font-bold text-sm text-gray-800">Timing Breakdowns</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Breakfast', normal: '8:00 AM' },
                                                    { label: 'Morning Snack', normal: '11:00 AM' },
                                                    { label: 'Lunch', normal: '1:00 PM' },
                                                    { label: 'Afternoon Snack', normal: '4:00 PM' },
                                                    { label: 'Evening Snack', normal: '6:00 PM' },
                                                    { label: 'Dinner', normal: '8:00 PM' }
                                                ].map(slot => (
                                                    <div key={slot.label} className="p-3 bg-gray-50 border rounded-xl">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{slot.label}</p>
                                                        <p className="text-xs font-black text-gray-700 mt-0.5">Average: {slot.normal}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Suggested Meal Plans (Dietitian Only) */}
                            {activeTab === 'suggested-plans' && isDietitian && status === 'active' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-gray-900">Dietitian Advices & Meal Plans</h3>
                                        <div className="space-y-4">
                                            {prescriptions.length === 0 && (
                                                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                    <p className="text-gray-400 italic">No previous meal plans recorded.</p>
                                                </div>
                                            )}
                                            {prescriptions.map(p => (
                                                <div key={p._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-900">{p.title}</h4>
                                                        <span className="text-xs font-bold text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-650 text-sm leading-relaxed whitespace-pre-line">{p.instructions}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Create Suggested Meal Plan</h3>
                                        <form onSubmit={handlePrescribe} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Plan Summary</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                                    placeholder="e.g. Low carb high protein dietary plan"
                                                    value={newPrescription.title}
                                                    onChange={e => setNewPrescription({ ...newPrescription, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Days to Next Plan Review</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                                    placeholder="e.g. 90"
                                                    value={newPrescription.nextCheckupDays || ''}
                                                    onChange={e => setNewPrescription({ ...newPrescription, nextCheckupDays: parseInt(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Meal Guidelines / Suggested Plan</label>
                                                <textarea
                                                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium h-40 resize-none text-sm"
                                                    placeholder="Breakfast: Dosa + sambar&#10;Lunch: Dal rice + green beans&#10;Snack: Milk + apple"
                                                    value={newPrescription.instructions}
                                                    onChange={e => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <button className="w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 shadow-blue-100">
                                                <span className="material-symbols-outlined">send</span>
                                                Share Suggested Plan
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Clinical Overview (Doctor Only) */}
                            {activeTab === 'overview' && !isDietitian && status === 'active' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Meal History Logs</h2>
                                        {meals.length === 0 ? (
                                            <p className="text-gray-500 italic">No meals logged recently.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {meals.map(meal => (
                                                    <div key={meal._id} className="flex justify-between items-center p-4 bg-gray-55/30 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-orange-50 text-orange-500">
                                                                🍳
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{(meal.breakfast?.concat(meal.morningSnack, meal.lunch, meal.afternoonSnack, meal.dinner, meal.eveningSnack) || []).filter(Boolean).map(f => f.name).join(', ') || 'Meals logged'}</p>
                                                                <p className="text-xs text-gray-500">{new Date(meal.date).toLocaleDateString()} • completed: {meal.completedMealsCount || 0} meals</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-gray-900">{meal.breakfast?.concat(meal.morningSnack, meal.lunch, meal.afternoonSnack, meal.dinner, meal.eveningSnack).filter(Boolean).reduce((a, b) => a + (b.calories || 0), 0)} kcal</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: Nutrition Trends (Doctor Only) */}
                            {activeTab === 'nutrition-trends' && !isDietitian && status === 'active' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Calorie and Meal Frequency Trends</h2>
                                        <MealFrequencyChart data={chartData} />
                                    </div>
                                </div>
                            )}

                            {/* TAB: Food Patterns (Doctor Only) */}
                            {activeTab === 'food-patterns' && !isDietitian && status === 'active' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Common Logged Foods</h2>
                                        {commonFoods.length === 0 ? (
                                            <p className="text-gray-500 italic">No food data logged.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {commonFoods.map((f, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                        <span className="font-bold text-gray-800">{f.name}</span>
                                                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full">{f.count} times logged</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: Deficiency Risks (Doctor Only) */}
                            {activeTab === 'deficiency-risks' && !isDietitian && status === 'active' && (
                                <div className="space-y-6 animate-in fade-in">
                                    {/* Clinical Sub-scores */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                        <h2 className="text-xl font-bold text-gray-900 font-black uppercase text-xs tracking-widest text-gray-400">Clinical Wellness Sub-Scores</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {[
                                                { title: 'Nutrition Score', val: profile.wellnessAnalysis?.nutritionScore ?? 100, icon: '🥗', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                                { title: 'Deficiency Score', val: profile.wellnessAnalysis?.deficiencyScore ?? 100, icon: '⚠️', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                                                { title: 'Growth Risk Score', val: profile.wellnessAnalysis?.growthRiskScore ?? 100, icon: '📈', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                                                { title: 'Hydration Score', val: profile.wellnessAnalysis?.hydrationScore ?? 100, icon: '💧', color: 'text-sky-600 bg-sky-50 border-sky-100' },
                                                { title: 'Meal Quality Score', val: profile.wellnessAnalysis?.mealQualityScore ?? 100, icon: '🥦', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' }
                                            ].map((sub, i) => (
                                                <div key={i} className={`p-4 rounded-xl border text-center ${sub.color}`}>
                                                    <span className="text-xl mb-1 block">{sub.icon}</span>
                                                    <p className="text-[9px] font-black uppercase text-gray-500 leading-none">{sub.title}</p>
                                                    <p className="text-xl font-black mt-2 leading-none">{sub.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Active Deficiencies & Risks */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Active Deficiencies & Severity</h2>
                                        
                                        {profile.wellnessAnalysis?.deficiencies ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'].map(nut => {
                                                    const record = profile.wellnessAnalysis.deficiencies[nut] || { metPercent: 100, consumed: 0, target: 0, severity: 'GREEN' };
                                                    const badgeColors = {
                                                        GREEN: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                        YELLOW: 'bg-amber-50 text-amber-700 border-amber-100',
                                                        ORANGE: 'bg-orange-50 text-orange-700 border-orange-100',
                                                        RED: 'bg-red-50 text-red-700 border-red-100'
                                                    };
                                                    return (
                                                        <div key={nut} className={`p-4 rounded-xl border flex justify-between items-center ${badgeColors[record.severity]}`}>
                                                            <div>
                                                                <p className="font-extrabold text-sm uppercase">{nut}</p>
                                                                <p className="text-xs opacity-80 mt-1">Consumed: {record.consumed} / {record.target}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black">{record.metPercent}% met</p>
                                                                <span className="text-[9px] font-bold uppercase tracking-wider">{record.severity}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No deficiency metrics calculated yet.</p>
                                        )}
                                    </div>

                                    {/* Growth & Development Impacts */}
                                    {profile.wellnessAnalysis?.growthImpacts && (
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                            <h2 className="text-xl font-bold text-gray-900 font-black uppercase text-xs tracking-widest text-gray-400">WHO Developmental Growth Risks</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {profile.wellnessAnalysis.growthImpacts.map((impact, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">{impact.nutrient} Deficit</span>
                                                        <h4 className="font-bold text-sm text-gray-900 leading-snug pt-1">{impact.risk}</h4>
                                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">{impact.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'video-calls' && status === 'active' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 flex-wrap gap-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-indigo-500">video_camera_front</span>
                                                    Video Consultation Sessions
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">Chronological timeline of video call summaries and recommendations generated by AI.</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">
                                                    {videoCallLogs.length} Total Calls
                                                </span>
                                                {videoCallLogs.length > 0 && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm(`Delete ALL ${videoCallLogs.length} sessions? This cannot be undone.`)) return;
                                                            try {
                                                                await api.delete(`/consultations/${consultationRequestId}/video-summary`);
                                                                setVideoCallLogs([]);
                                                                toast.success('All sessions cleared.');
                                                            } catch (e) {
                                                                toast.error('Failed to clear sessions.');
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-full transition"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {videoCallLogs.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-250">
                                                <span className="material-symbols-outlined text-4xl text-gray-300">video_chat</span>
                                                <p className="text-sm font-medium text-gray-500 mt-2">No video consultations have been conducted yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {videoCallLogs.map((log, idx) => (
                                                    <div key={log._id || idx} className="p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 relative">
                                                        {/* Delete single session button */}
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm(`Delete Session ${idx + 1}?`)) return;
                                                                try {
                                                                    await api.delete(`/consultations/${consultationRequestId}/video-summary/${log._id}`);
                                                                    setVideoCallLogs(prev => prev.filter(l => l._id !== log._id));
                                                                    toast.success(`Session ${idx + 1} deleted.`);
                                                                } catch (e) {
                                                                    toast.error('Failed to delete session.');
                                                                }
                                                            }}
                                                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition"
                                                            title="Delete this session"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>

                                                        <div className="flex justify-between items-center flex-wrap gap-2 pr-8">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="font-extrabold text-slate-800 dark:text-white text-base">
                                                                    Video Call Session #{idx + 1}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                                                {log.durationMinutes > 0 && (
                                                                    <span>⏱ {log.durationMinutes} min</span>
                                                                )}
                                                                <span>{new Date(log.callDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-[10px]">AI Generated</span>
                                                            </div>
                                                        </div>

                                                        {/* Summary only */}
                                                        {log.summary && (
                                                            <div className="space-y-1.5">
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Call Summary</h4>
                                                                <p className="text-sm text-gray-700 leading-relaxed">{log.summary}</p>
                                                            </div>
                                                        )}

                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'twin' && status === 'active' && (
                                <DoctorTwinView profileId={id} profile={profile} />
                            )}

                            {activeTab === 'growth-velocity' && status === 'active' && (
                                <GrowthVelocityCenter
                                    data={growthVelocityData}
                                    profile={profile}
                                    loading={growthVelocityLoading}
                                />
                            )}

                            {activeTab === 'analytics' && status === 'active' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Nutrition Analytics</h2>
                                    <MealFrequencyChart data={chartData} />
                                </div>
                            )}

                            {activeTab === 'prescriptions' && !isDietitian && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-gray-900">Medical History</h3>
                                        <div className="space-y-4">
                                            {prescriptions.length === 0 && (
                                                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                    <p className="text-gray-400 italic">No previous prescriptions recorded.</p>
                                                </div>
                                            )}
                                            {prescriptions.map(p => (
                                                <div key={p._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-900">{p.title}</h4>
                                                        <span className="text-xs font-bold text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-650 text-sm leading-relaxed">{p.instructions}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Create Prescription</h3>
                                        <form onSubmit={handlePrescribe} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Summary / Diagnosis</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                                    placeholder="e.g. Iron deficiency observation"
                                                    value={newPrescription.title}
                                                    onChange={e => setNewPrescription({ ...newPrescription, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Days to Next Checkup</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                                    placeholder="e.g. 90"
                                                    value={newPrescription.nextCheckupDays || ''}
                                                    onChange={e => setNewPrescription({ ...newPrescription, nextCheckupDays: parseInt(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Instructions</label>
                                                <textarea
                                                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium h-40 resize-none text-sm"
                                                    placeholder="Medical advice or next steps..."
                                                    value={newPrescription.instructions}
                                                    onChange={e => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <button className="w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 shadow-blue-100">
                                                <span className="material-symbols-outlined">send</span>
                                                Send Prescription
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;
