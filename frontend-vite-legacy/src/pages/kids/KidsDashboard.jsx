import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfileById } from '../../api/profile.api';
import { getKidStats } from '../../api/game.api';
import { motion, AnimatePresence } from 'framer-motion';
import KidsModal from '../../components/common/KidsModal';

// Dashboard Components
import ProfileCard from '../../components/kids/dashboard/ProfileCard';
import DailyMission from '../../components/kids/dashboard/DailyMission';
import DailyQuests from '../../components/kids/dashboard/DailyQuests';
import BadgeCollection from '../../components/kids/dashboard/BadgeCollection';
import RecentWins from '../../components/kids/dashboard/RecentWins';
import FoodBuddyChatInterface from '../../components/kids/chat/FoodBuddyChatInterface';

const KidsDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'chat'

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', icon: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [profRes, statsRes] = await Promise.all([
                    getProfileById(id),
                    getKidStats(id)
                ]);
                setProfile(profRes.data || profRes);
                setStats(statsRes.data || statsRes);
            } catch (error) {
                console.error("Error loading kids data", error);
            }
        };
        loadData();
    }, [id]);

    const openModal = (title, message, icon) => {
        setModalConfig({ isOpen: true, title, message, icon });
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    if (!profile || !stats) return <div className="text-center text-primary text-3xl font-black mt-20 animate-pulse">Loading adventure... 🚀</div>;

    const currentXP = stats.currentXP || 0;
    const level = Math.floor(currentXP / 100) + 1;
    const progress = currentXP % 100;

    // Chat View
    if (view === 'chat') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-screen w-full bg-white relative z-50"
            >
                <FoodBuddyChatInterface
                    profile={profile}
                    onBack={() => setView('dashboard')}
                />
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full relative z-10 bg-background-light overflow-hidden">
            <KidsModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                icon={modalConfig.icon}
            />

            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-slate-100 py-3 px-6 md:px-12 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-500 p-2 rounded-xl text-white">
                        <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
                    </div>
                    <h1 className="text-xl font-black text-blue-500 uppercase tracking-tight">NutriKid</h1>
                </div>

                <div className="flex-1 max-w-2xl mx-12 hidden md:block">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        <span>Level {level}</span>
                        <span>{currentXP} / {(level * 100)} XP</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full"></div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 text-yellow-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">star</span>
                        0 Stars
                    </div>
                    <button onClick={() => navigate('/parent/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50">
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Parent Mode
                    </button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Profile & Friends (3 cols) */}
                    <div className="lg:col-span-3 space-y-8">
                        <ProfileCard profile={profile} level={level} currentXP={currentXP} />

                        {/* Talk to Food Buddy Call-to-Action */}
                        <div className="relative group cursor-pointer" onClick={() => setView('chat')}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-xl flex flex-col md:flex-row lg:flex-col xl:flex-row items-center gap-4 border border-white/50 text-center md:text-left lg:text-center xl:text-left">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white">
                                        🥦
                                    </div>
                                    <div className="absolute top-0 right-0 w-5 h-5 bg-green-400 border-2 border-white rounded-full animate-bounce"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI COMPANION</p>
                                    <h3 className="text-xl font-black text-slate-800 leading-none mb-1">Food Buddy</h3>
                                    <p className="text-xs font-bold text-blue-500">Online • Ready!</p>
                                </div>
                                <button className="bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Middle Column: Mission & Quests (5 cols) */}
                    <div className="lg:col-span-5 space-y-8">
                        <DailyMission onAccept={() => openModal("Mission Accepted!", "Good luck on your Veggie Voyager quest!", "rocket_launch")} />
                        <DailyQuests quests={stats.dailyQuests} />
                        <div className="md:hidden">
                            <RecentWins />
                        </div>
                    </div>

                    {/* Right Column: Badges & Chat (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="hidden md:block">
                            <BadgeCollection badges={stats.badges} />
                        </div>

                        <div className="hidden md:block">
                            <RecentWins />
                        </div>


                    </div>
                </div>
            </main>
        </div>
    );
};

export default KidsDashboard;
