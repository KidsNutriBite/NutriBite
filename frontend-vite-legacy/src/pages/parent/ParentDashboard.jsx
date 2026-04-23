
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfiles } from '../../api/profile.api';
import { getPendingRequests, approveRequest, rejectRequest } from '../../api/access.api';
import useAuth from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import AddProfileForm from '../../components/parent/AddProfileForm';
import { motion, AnimatePresence } from 'framer-motion';
import TipCard from '../../components/common/TipCard';
import NutriGuideChat from '../../components/parent/chat/NutriGuideChat';

const ParentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProfileForAccess, setSelectedProfileForAccess] = useState('');
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'chat'

    const getDaysSinceUpdate = (profile) => {
        const lastUpdated = profile.updatedAt || profile.createdAt;
        if (!lastUpdated) return 0;
        return Math.floor((new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24));
    };

    const isBirthdayToday = (dobString) => {
        if (!dobString) return false;
        const dob = new Date(dobString);
        const today = new Date();
        return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    };

    const birthdayProfiles = profiles.filter(p => isBirthdayToday(p.dob));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profilesRes, requestsRes] = await Promise.all([
                getMyProfiles(),
                getPendingRequests()
            ]);
            setProfiles(Array.isArray(profilesRes) ? profilesRes : profilesRes.data || []);
            setRequests(Array.isArray(requestsRes) ? requestsRes : requestsRes.data || []);
            const profileList = Array.isArray(profilesRes) ? profilesRes : profilesRes.data || [];
            if (profileList.length > 0) {
                setSelectedProfileForAccess(profileList[0]._id);
            }
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        if (!selectedProfileForAccess) return;
        try {
            await approveRequest(requestId, selectedProfileForAccess);
            // Refresh requests
            const res = await getPendingRequests();
            setRequests(res.data || []);
        } catch (error) {
            console.error("Error approving request", error);
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await rejectRequest(requestId);
            // Refresh requests
            const res = await getPendingRequests();
            setRequests(res.data || []);
        } catch (error) {
            console.error("Error rejecting request", error);
        }
    };


    // AI Chat View
    if (view === 'chat') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-[100] bg-white dark:bg-slate-900"
            >
                <div className="h-full w-full flex flex-col">
                    <NutriGuideChat onBack={() => setView('dashboard')} profiles={profiles} />
                </div>
            </motion.div>
        );
    }

    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Here's a look at how your little ones are growing today.</p>
                </div>

                <button
                    onClick={() => setView('chat')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white pl-4 pr-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 group"
                >
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined text-2xl text-white">smart_toy</span>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Companion</p>
                        <p className="text-sm font-bold leading-none">Open NutriGuide</p>
                    </div>
                </button>
            </div>

            {/* Birthday Banner */}
            <AnimatePresence>
                {birthdayProfiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-1 rounded-2xl shadow-lg shadow-purple-500/30 overflow-hidden relative"
                    >
                        {/* Decorative floating confetti effect */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>

                        <div className="bg-white/10 backdrop-blur-sm px-6 py-6 md:py-4 rounded-xl flex flex-col md:flex-row items-center justify-between text-white relative z-10 gap-4">
                            <div className="absolute -top-10 -right-10 opacity-20 pointer-events-none rotate-12">
                                <span className="material-symbols-outlined text-[150px]">celebration</span>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="text-5xl animate-bounce">🎂</div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black drop-shadow-md">Happy Birthday, {birthdayProfiles.map(p => p.name).join(' & ')}!</h2>
                                    <p className="opacity-90 font-semibold mt-1">Wishing a fantastic day filled with fun, joy, and healthy treats! 🎈</p>
                                </div>
                            </div>
                            <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-2 whitespace-nowrap">
                                Celebrate <span className="material-symbols-outlined">auto_awesome</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 90-Day Growth Update Reminder Banner */}
            {!loading && (() => {
                const overdueProfiles = profiles.filter(p => getDaysSinceUpdate(p) >= 90);
                if (overdueProfiles.length === 0) return null;
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
                    >
                        <div className="bg-amber-100 dark:bg-amber-800/40 p-3 rounded-xl flex-shrink-0">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">update</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-amber-900 dark:text-amber-200 font-bold text-base mb-1">
                                Growth Stats Update Required
                            </h4>
                            <p className="text-amber-700 dark:text-amber-400 text-sm">
                                The following {overdueProfiles.length > 1 ? 'children need' : 'child needs'} a growth update (height & weight) — it's been over 90 days:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {overdueProfiles.map(p => (
                                    <button
                                        key={p._id}
                                        onClick={() => navigate(`/parent/child/${p._id}`)}
                                        className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-3 py-1 rounded-full text-xs font-bold hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                                    >
                                        {p.name} ({getDaysSinceUpdate(p)} days)
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            })()}

            {/* Doctor Notification Banner */}
            {requests.length > 0 && (
                <div className="mb-12 space-y-4">
                    {requests.map((req) => (
                        <div key={req._id} className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 dark:bg-primary/10">
                            <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                                <div className="bg-primary text-white p-4 rounded-xl shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-3xl">medical_services</span>
                                </div>
                                <div>
                                    <p className="text-slate-900 dark:text-white text-xl font-bold">Doctor Access Request</p>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                                        <span className="font-bold text-primary">Dr. {req.doctor?.name || 'Unknown'}</span> wants to view your child's health data.
                                    </p>
                                    {profiles.length > 1 && (
                                        <div className="mt-2 text-left">
                                            <label className="text-xs font-bold text-slate-500 uppercase mr-2">For:</label>
                                            <select
                                                value={selectedProfileForAccess}
                                                onChange={(e) => setSelectedProfileForAccess(e.target.value)}
                                                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                            >
                                                {profiles.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleRejectRequest(req._id)}
                                    className="flex-1 md:flex-none py-3 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApproveRequest(req._id)}
                                    className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-transform active:scale-95"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Child Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-400">Loading profiles...</div>
                ) : (
                    profiles.map((profile, idx) => (
                        <div key={profile._id} className="group bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                {getDaysSinceUpdate(profile) >= 90 ? (
                                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter bg-amber-100 text-amber-700 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">warning</span> Update Due
                                    </span>
                                ) : (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${idx % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {idx % 2 === 0 ? 'Healthy' : 'Growing'}
                                    </span>
                                )}
                            </div>
                            <div className="mx-auto w-32 h-32 relative mb-6 cursor-pointer" onClick={() => navigate(`/parent/child/${profile._id}`)}>
                                {profile.profileImage ? (
                                    <img
                                        src={profile.profileImage}
                                        alt={profile.name}
                                        className="w-full h-full rounded-full object-cover shadow-sm ring-4 ring-primary/10 group-hover:ring-primary/40 transition-all duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-center bg-gray-100 flex items-center justify-center text-6xl rounded-full ring-4 ring-primary/10 group-hover:ring-primary/40 transition-all duration-300">
                                        {profile.avatar === 'lion' && '🦁'}
                                        {profile.avatar === 'rabbit' && '🐰'}
                                        {profile.avatar === 'bear' && '🐻'}
                                        {profile.avatar === 'fox' && '🦊'}
                                        {profile.avatar === 'cat' && '🐱'}
                                        {profile.avatar === 'dog' && '🐶'}
                                        {!['lion', 'rabbit', 'bear', 'fox', 'cat', 'dog'].includes(profile.avatar) && '👶'}
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg">
                                    <span className="material-symbols-outlined text-lg">electric_bolt</span>
                                </div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-2xl font-extrabold mb-1">{profile.name}</h3>
                            <p className="text-slate-500 font-semibold mb-4">Age {profile.age} • Growing Fast</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-left">
                                    <span className="text-slate-500 font-bold mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Last Pediatrician Checkup</span>
                                    {profile.lastCheckup ? (
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-slate-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span> {new Date(profile.lastCheckup.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[16px] text-primary">schedule</span> {profile.lastCheckup.time}</span>
                                            <span className="col-span-2 flex items-center gap-1 font-bold text-slate-900 dark:text-white mt-1"><span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span> {profile.lastCheckup.doctorName}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-2">
                                            <span className="text-slate-400 italic text-xs">No past checkups found.</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => navigate(`/parent/child/${profile._id}`)} className="mt-2 w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-primary hover:text-white transition-colors">
                                    Manage Health
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Add Child Button */}
                <div onClick={() => setIsAddModalOpen(true)} className="group border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center p-8 transition-all hover:bg-primary/5 cursor-pointer min-h-[400px]">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all size-16 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl">add</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-xl font-bold">Add Child</p>
                    <p className="text-slate-500 text-sm mt-1 text-center">Expand your family profile to track more nutritional health.</p>
                </div>
            </div>

            {/* Nutritional Tips / Directory Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TipCard
                    tip={{
                        text: "Encourage your child to drink water before playing to stay super fast! ⚡",
                        tag: "General Tip",
                        explanation: "Hydration is crucial for energy and cognitive function. Establishing a habit of drinking water before activity prevents dehydration and improves stamina."
                    }}
                    childName={null}
                />
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                    <div className="bg-green-100 text-green-600 dark:bg-green-900/30 p-4 rounded-xl">
                        <span className="material-symbols-outlined text-3xl">local_hospital</span>
                    </div>
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-extrabold">Pediatrician Directory</h4>
                        <p className="text-slate-500 mb-2">Find specialists and nutritionists near you.</p>
                        <button onClick={() => navigate('/parent/directory')} className="text-primary font-bold flex items-center gap-1 text-sm hover:underline bg-transparent border-none p-0 cursor-pointer">
                            Search nearby <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Adding Child */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Child Profile">
                <AddProfileForm
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchData();
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ParentDashboard;
