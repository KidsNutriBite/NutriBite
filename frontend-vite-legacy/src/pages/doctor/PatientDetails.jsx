import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientDetails, requestFullAccess } from '../../api/doctor.api';
import { getMealFrequency, getPrescriptions, createPrescription } from '../../api/analytics.api';
import MealFrequencyChart from '../../components/charts/MealFrequencyChart';
import toast from 'react-hot-toast';

const PatientDetails = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [meals, setMeals] = useState([]);
    const [status, setStatus] = useState('active');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Analytics Data
    const [chartData, setChartData] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    // Form State
    const [newPrescription, setNewPrescription] = useState({ title: '', instructions: '' });
    const [loading, setLoading] = useState(true);

    // Request Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const detailRes = await getPatientDetails(id);
            setProfile(detailRes.data.profile);
            setMeals(detailRes.data.meals || []);
            setStatus(detailRes.data.status);
            setMessage(detailRes.data.message || '');

            if (detailRes.data.status === 'active') {
                const chartRes = await getMealFrequency(id);
                setChartData(chartRes.data);

                const prescRes = await getPrescriptions(id);
                setPrescriptions(prescRes.data);
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
            setNewPrescription({ title: '', instructions: '' });
            const prescRes = await getPrescriptions(id);
            setPrescriptions(prescRes.data);
            toast.success('Prescription sent!');
        } catch (error) {
            toast.error('Failed to send prescription');
        }
    };

    const handleRequestFullAccess = async (e) => {
        e.preventDefault();
        try {
            setRequestLoading(true);
            await requestFullAccess(id, requestReason);
            toast.success('Request sent to parent!');
            setIsModalOpen(false);
            setRequestReason('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setRequestLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!profile) return null;

    const tabs = status === 'active' ? [
        { id: 'overview', label: 'Clinical Overview', icon: '📊' },
        { id: 'analytics', label: 'Nutrition & Growth', icon: '📈' },
        { id: 'prescriptions', label: 'Prescriptions', icon: '📝' },
    ] : [
        { id: 'consultation', label: 'Consultation', icon: '💬' },
        { id: 'prescriptions', label: 'Initial Advice', icon: '📝' },
    ];

    if (status === 'pending' && activeTab === 'overview') setActiveTab('consultation');

    return (
        <div className="space-y-8">
            {/* Header Card */}
            <div className={`p-8 rounded-[2rem] shadow-sm border flex flex-col md:flex-row items-center md:items-start gap-8 ${status === 'restricted' ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner ${status === 'restricted' ? 'bg-amber-100' : 'bg-blue-50'}`}>
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
                        {status === 'restricted' && (
                            <span className="px-3 py-1 bg-amber-200 text-amber-800 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 w-fit mx-auto md:mx-0">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Restricted View
                            </span>
                        )}
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

                {status === 'restricted' && (
                    <div className="shrink-0 w-full md:w-auto">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center gap-2 justify-center"
                        >
                            <span className="material-symbols-outlined">key</span>
                            Request Detailed Access
                        </button>
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
                                ? status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-primary text-white shadow-lg shadow-blue-200'
                                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
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
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <span className="material-symbols-outlined text-[8rem]">chat</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">forum</span>
                                            Parent's Consultation Message
                                        </h2>
                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 relative z-10">
                                            <p className="text-blue-900 font-medium leading-relaxed italic">
                                                "{message || 'No specific message provided.'}"
                                            </p>
                                        </div>
                                        <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <span className="material-symbols-outlined text-amber-500 shrink-0">info</span>
                                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                                You are currently in <strong>Restricted View</strong>. You can see basic child stats and the parent's message.
                                                Detailed meal logs, nutrition history, and growth charts are hidden until the parent grants full access.
                                                You can still provide initial advice or request more details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                                <p className="font-bold text-gray-900">{meal.foodItems.map(f => f.name).join(', ')}</p>
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
                                </div>
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
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Summary / Diagnosis</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-sm"
                                                    placeholder="e.g. Iron deficiency observation"
                                                    value={newPrescription.title}
                                                    onChange={e => setNewPrescription({ ...newPrescription, title: e.target.value })}
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

            {/* Request Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900">Request Full Access</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                                Explain to the parent why you need detailed access (meal logs, charts, history). They will review your request.
                            </p>

                            <form onSubmit={handleRequestFullAccess} className="space-y-4">
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder="e.g., I need to analyze the meal logs to understand the child's nutrient deficiency better."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px] focus:ring-primary focus:border-primary outline-none font-medium text-sm resize-none"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={requestLoading || !requestReason.trim()}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {requestLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">send</span>
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PatientDetails;
