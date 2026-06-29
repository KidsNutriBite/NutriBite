"use client";
import { useState, useEffect } from 'react';
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

            if (detailRes.data.data && detailRes.data.data.status === 'active') {
                const chartRes = await getMealFrequency(id);
                setChartData(chartRes.data);

                const prescRes = await getPrescriptions(id);
                setPrescriptions(prescRes.data);

                // Fetch growth velocity (non-blocking — loads separately)
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
        fetchAllData();
    }, [id]);

    const handlePrescribe = async (e) => {
        e.preventDefault();
        try {
            await createPrescription({ profileId: id, ...newPrescription });
            setNewPrescription({ title: '', instructions: '', nextCheckupDays: 90 });
            const prescRes = await getPrescriptions(id);
            setPrescriptions(prescRes.data);
            toast.success('Prescription sent!');
        } catch (error) {
            toast.error('Failed to send prescription');
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

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!profile) return null;

    const tabs = status === 'active' ? [
        { id: 'overview',        label: 'Clinical Overview',    icon: '📊' },
        { id: 'growth-velocity', label: 'Growth Velocity',      icon: '📈' },
        { id: 'twin',            label: 'Digital Twin View',    icon: '🤖' },
        { id: 'analytics',       label: 'Nutrition & Growth',   icon: '🥗' },
        { id: 'prescriptions',   label: 'Prescriptions',        icon: '📝' },
    ] : [
        { id: 'prescriptions', label: 'Prescriptions', icon: '📝' },
    ];

    return (
        <div className="space-y-8">
            {/* Video Call Modal */}
            <AnimatePresence>
                {activeCall && consultationRequestId && (
                    <VideoCall
                        consultationId={consultationRequestId}
                        userRole="doctor"
                        userName={user?.name || 'Doctor'}
                        onClose={() => setActiveCall(false)}
                    />
                )}
            </AnimatePresence>

            {/* Header Card */}
            <div className="p-8 rounded-[2rem] shadow-sm border flex flex-col md:flex-row items-center md:items-start gap-8 bg-white border-gray-100">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner bg-blue-50">
                    {profile.profileImage ? (
                        <img src={profile.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
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
                            Doctor View Mode (Read-Only)
                        </span>
                    </div>
                    <p className="text-gray-500 font-medium mb-4">Patient ID: {profile._id}</p>
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
                            {activeTab === 'overview' && status === 'active' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Clinical History</h2>
                                        {meals.length === 0 ? (
                                            <p className="text-gray-500 italic">No meals logged recently.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {meals.map(meal => (
                                                    <div key={meal._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${meal.mealType === 'Breakfast' ? 'bg-orange-100 text-orange-600' :
                                                                meal.mealType === 'Lunch' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {meal.mealType === 'Breakfast' ? '🍳' : meal.mealType === 'Lunch' ? '🥗' : '🍲'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{(meal.foodItems || meal.items || []).map(f => f?.name || f?.foodName || 'Unknown').join(', ') || 'Meal logged'}</p>
                                                                <p className="text-xs text-gray-500">{new Date(meal.date).toLocaleDateString()} • {meal.mealType}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-gray-900">{meal.nutrients?.calories || 0} kcal</p>
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

                            {activeTab === 'prescriptions' && (
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
                                                    <p className="text-gray-600 text-sm leading-relaxed">{p.instructions}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Create {status === 'active' ? 'Prescription' : 'Initial Advice'}</h3>
                                        <form onSubmit={handlePrescribe} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Summary / Diagnosis</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-medium text-sm dark:text-white"
                                                    placeholder="e.g. Iron deficiency observation"
                                                    value={newPrescription.title}
                                                    onChange={e => setNewPrescription({ ...newPrescription, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Days to Next Checkup</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    className="w-full border-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-medium text-sm dark:text-white"
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
                                            <button className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${status === 'active' ? 'bg-primary hover:bg-blue-600 shadow-blue-100' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'}`}>
                                                <span className="material-symbols-outlined">send</span>
                                                {status === 'active' ? 'Send Prescription' : 'Share Advice'}
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
