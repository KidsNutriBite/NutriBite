"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';
import FeedbackModal from '../../components/parent/FeedbackModal';
import {
    DEMO_CHILDREN,
    DEMO_DIRECTORY_DOCTORS,
    DEMO_CONSULTATIONS,
    DEMO_RESOURCES_DATA,
    DEMO_NOTIFICATIONS
} from '../../data/demoChildData';

const GuestDashboard = () => {
    const { theme, toggleTheme } = useTheme();

    // Main navigation views: 'home' | 'child' | 'resources' | 'consultations' | 'directory' | 'ai'
    const [mainView, setMainView] = useState('home');

    // Selected child profile (default: Ananya Sharma, 7yo)
    const [selectedChildId, setSelectedChildId] = useState(DEMO_CHILDREN[0]._id);
    const selectedChild = DEMO_CHILDREN.find(c => c._id === selectedChildId) || DEMO_CHILDREN[0];

    // Child Details Hub Tab (when mainView === 'child')
    const [childTab, setChildTab] = useState('overview');

    // Resources View Tab: 'guides' | 'recipes' | 'portions'
    const [resourceTab, setResourceTab] = useState('guides');
    const [selectedGuideModal, setSelectedGuideModal] = useState(null);

    // AI Hub View Tab: 'chat' | 'plate_scan' | 'diet_plan'
    const [aiTab, setAiTab] = useState('chat');
    const [plateScanSimulated, setPlateScanSimulated] = useState(false);

    // Directory View Search & Filter
    const [directorySearch, setDirectorySearch] = useState('');
    const [directorySpecialty, setDirectorySpecialty] = useState('All');

    // UI state for dropdowns & modals
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('this feature');
    const [modalDesc, setModalDesc] = useState('');
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    // Notifications state
    const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // AI Chat Messages State
    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'ai',
            text: `Hello! I'm NutriGuide AI. I can analyze food plates from photos, design personalized diet plans to fix nutrient gaps, and answer pediatric health questions. What would you like to explore today?`,
            time: 'Just now'
        }
    ]);
    const [chatInput, setChatInput] = useState('');

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifDropdown(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLockedAction = (action, description = '') => {
        setModalAction(action);
        setModalDesc(description);
        setModalOpen(true);
    };

    const markNotificationRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    // When user types in NutriGuide AI chat, show a prompt and trigger login request
    const handleSendChat = (e) => {
        e?.preventDefault();
        if (!chatInput.trim()) return;
        const userText = chatInput.trim();
        setChatMessages(prev => [
            ...prev,
            { sender: 'user', text: userText, time: 'Just now' }
        ]);
        setChatInput('');

        setTimeout(() => {
            setChatMessages(prev => [
                ...prev,
                {
                    sender: 'ai',
                    text: `To receive real-time, personalized AI clinical answers, save dietary histories, and tailor meal plans for your child, please sign in or create an account.`,
                    time: 'Just now',
                    isLockedPrompt: true
                }
            ]);
            handleLockedAction('NutriGuide AI Real-Time Consultation', 'Sign in to ask unlimited pediatric nutrition questions and receive tailored dietary advice.');
        }, 500);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen text-slate-800 dark:text-slate-200 selection:bg-primary/20 flex flex-col">
            
            {/* Top Clean Slim Notice Bar */}
            <div className="bg-slate-900 text-white text-xs border-b border-slate-800">
                <div className="max-w-[1200px] mx-auto px-6 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-bold transition-colors bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px]"
                            title="Return to Main Landing Page"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            <span>Home Page</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="inline-block size-2 rounded-full bg-primary"></span>
                            <span className="font-semibold text-slate-300">Guest Demo Mode</span>
                            <span className="hidden sm:inline text-slate-400">· Exploring NutriKid with simulated data</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-primary hover:text-white font-bold transition-colors"
                        >
                            Sign In
                        </Link>
                        <span className="text-slate-600">|</span>
                        <Link
                            href="/register"
                            className="text-slate-300 hover:text-white font-semibold transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>

            {/* Clean, Spacious Top Navbar (Matches ParentLayout exactly without congestion) */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 md:px-12 py-3.5 sticky top-0 z-40">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    {/* Left: Brand */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Toggle navigation menu"
                        >
                            <span className="material-symbols-outlined">{showMobileMenu ? 'close' : 'menu'}</span>
                        </button>

                        <button
                            onClick={() => setMainView('home')}
                            className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer text-left"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30">
                                <span className="material-symbols-outlined text-2xl">nutrition</span>
                            </div>
                            <span className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight">NutriKid</span>
                        </button>
                    </div>

                    {/* Center: Desktop Navigation (Clean, Spacious) */}
                    <nav className="hidden md:flex items-center gap-1.5">
                        <button
                            onClick={() => setMainView('home')}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                mainView === 'home' || mainView === 'child'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-primary'
                            }`}
                        >
                            Home
                        </button>

                        <button
                            onClick={() => setMainView('resources')}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                mainView === 'resources'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-primary'
                            }`}
                        >
                            Resources
                        </button>

                        <button
                            onClick={() => setMainView('consultations')}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                mainView === 'consultations'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-primary'
                            }`}
                        >
                            Consultations
                        </button>

                        <button
                            onClick={() => setMainView('directory')}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                mainView === 'directory'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-primary'
                            }`}
                        >
                            Directory
                        </button>

                        <button
                            onClick={() => setMainView('ai')}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
                                mainView === 'ai'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                            <span>NutriKid AI</span>
                        </button>
                    </nav>

                    {/* Right: Theme, Notifications, Profile */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 transition-all active:scale-95"
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 transition-colors relative"
                                aria-label="Notifications"
                            >
                                <span className="material-symbols-outlined text-xl">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifDropdown && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
                                        <span className="text-xs text-slate-500">{unreadCount} unread</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markNotificationRead(notif.id)}
                                                className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                                                    !notif.isRead ? 'bg-primary/5' : ''
                                                }`}
                                            >
                                                <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">{notif.message}</p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">
                                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <div
                                className="flex items-center gap-3 border-l pl-3 border-slate-200 dark:border-slate-800 cursor-pointer"
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">Guest Parent</p>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Demo Mode</span>
                                </div>
                                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm border border-slate-300 dark:border-slate-700">
                                    GP
                                </div>
                            </div>

                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 p-2">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Guest Account</p>
                                        <p className="text-xs text-slate-500">Sign in to save real children</p>
                                    </div>
                                    <div className="p-1 space-y-1">
                                        <Link
                                            href="/login"
                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">login</span>
                                            <span>Sign In</span>
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">person_add</span>
                                            <span>Create Free Account</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {showMobileMenu && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-[57px] z-30 shadow-lg">
                    <nav className="flex flex-col gap-1.5">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors mb-2"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span>Back to Landing Page</span>
                        </Link>
                        <button
                            onClick={() => { setMainView('home'); setShowMobileMenu(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                                mainView === 'home' || mainView === 'child' ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined">home</span>
                            <span>Home</span>
                        </button>
                        <button
                            onClick={() => { setMainView('resources'); setShowMobileMenu(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                                mainView === 'resources' ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined">library_books</span>
                            <span>Resources</span>
                        </button>
                        <button
                            onClick={() => { setMainView('consultations'); setShowMobileMenu(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                                mainView === 'consultations' ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span>Consultations</span>
                        </button>
                        <button
                            onClick={() => { setMainView('directory'); setShowMobileMenu(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                                mainView === 'directory' ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined">local_hospital</span>
                            <span>Pediatric Directory</span>
                        </button>
                        <button
                            onClick={() => { setMainView('ai'); setShowMobileMenu(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                                mainView === 'ai' ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined">smart_toy</span>
                            <span>NutriKid AI</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Application Container */}
            <main className="max-w-[1200px] mx-auto w-full px-6 py-8 pb-28 flex-1">

                {/* ========================================================================= */}
                {/* VIEW 1: HOME (PARENT FAMILY DASHBOARD)                                    */}
                {/* ========================================================================= */}
                {mainView === 'home' && (
                    <div className="space-y-8 animate-in fade-in duration-150">
                        {/* Welcome Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight mb-2">
                                    Welcome back, Parent! 👋
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-base">
                                    Here's a look at how your little ones are growing today.
                                </p>
                            </div>

                            <button
                                onClick={() => setMainView('ai')}
                                className="bg-primary hover:bg-primary/90 text-white pl-4 pr-6 py-3 rounded-2xl shadow-lg shadow-primary/25 flex items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 self-start md:self-auto"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl text-white">smart_toy</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Companion</p>
                                    <p className="text-sm font-bold leading-none">Open NutriKid AI</p>
                                </div>
                            </button>
                        </div>

                        {/* Birthday Banner (Clean & Subdued, No loud saturated multi-colors) */}
                        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <div className="text-4xl">🎂</div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Happy Birthday Month to Ananya!
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Wishing a fantastic day filled with fun, joy, and healthy treats! 🎈
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMainView('resources')}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold hover:border-primary transition-all shadow-sm"
                            >
                                Browse Birthday Recipes
                            </button>
                        </div>

                        {/* 90-Day Growth Update Reminder */}
                        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 flex items-start gap-4">
                            <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl text-amber-700 dark:text-amber-300 shrink-0">
                                <span className="material-symbols-outlined text-2xl">update</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-amber-900 dark:text-amber-200 font-bold text-sm mb-1">
                                    Quarterly Growth Stats Update
                                </h4>
                                <p className="text-amber-800 dark:text-amber-300/90 text-xs leading-relaxed">
                                    Ananya Sharma needs a quarterly growth update (height & weight) to keep WHO percentiles accurate.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedChildId(DEMO_CHILDREN[0]._id);
                                            setMainView('child');
                                            setChildTab('growth');
                                        }}
                                        className="bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-300 transition-colors"
                                    >
                                        View Growth Chart
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Children Profiles Grid (Clean neutral emojis, no saturated gradients) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {DEMO_CHILDREN.map((child, idx) => (
                                <div
                                    key={child._id}
                                    className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-200/80 dark:border-slate-800 text-center relative flex flex-col justify-between"
                                >
                                    <div className="absolute top-4 right-4">
                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase ${
                                            idx === 0
                                                ? 'bg-blue-50 text-primary dark:bg-blue-950/50'
                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50'
                                        }`}>
                                            {child.bmiCategory}
                                        </span>
                                    </div>

                                    {/* Pure clean emoji avatar in neutral circle (No loud gradient background) */}
                                    <div
                                        className="mx-auto size-28 relative my-4 cursor-pointer"
                                        onClick={() => {
                                            setSelectedChildId(child._id);
                                            setMainView('child');
                                        }}
                                    >
                                        <div className="size-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-5xl border border-slate-200 dark:border-slate-700 group-hover:border-primary/50 transition-colors">
                                            {child.avatar === 'girl' ? '👧' : '👦'}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-slate-900 dark:text-white text-xl font-extrabold mb-1">{child.name}</h3>
                                        <p className="text-slate-500 text-xs font-semibold mb-4">Age {child.age} Years • Growing Fast</p>

                                        {/* Last Pediatrician Checkup */}
                                        <div className="flex flex-col text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl text-left border border-slate-100 dark:border-slate-800 mb-4 space-y-1">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] pb-1 border-b border-slate-200 dark:border-slate-700">Last Pediatrician Checkup</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 pt-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-primary text-base">stethoscope</span>
                                                {child.lastCheckup.doctorName}
                                            </p>
                                            <p className="text-slate-500 text-[11px]">{child.lastCheckup.date} · {child.lastCheckup.clinic}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedChildId(child._id);
                                            setMainView('child');
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-primary hover:text-white transition-colors text-xs"
                                    >
                                        Manage Health
                                    </button>
                                </div>
                            ))}

                            {/* Add Child Card */}
                            <div
                                onClick={() => handleLockedAction('Adding a New Child Profile', 'Track multiple children with individual growth milestones and personalized meal journals.')}
                                className="group border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer min-h-[340px] text-center"
                            >
                                <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all size-16 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl">add</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <p className="text-slate-900 dark:text-white text-lg font-bold">Add Child</p>
                                    <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                </div>
                                <p className="text-slate-500 text-xs mt-1 text-center max-w-xs">
                                    Expand your family profile to track more nutritional health.
                                </p>
                            </div>
                        </div>

                        {/* Tips & Directory Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Nutritional Tip</span>
                                    <h4 className="text-slate-900 dark:text-white font-bold text-base mt-1">
                                        Encourage your child to drink water before playing to stay super fast! ⚡
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        Hydration is crucial for energy and cognitive function. Establishing a habit of drinking water before activity prevents dehydration.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setMainView('resources')}
                                    className="text-primary font-bold text-xs hover:underline flex items-center gap-1 mt-4 self-start"
                                >
                                    <span>Learn more in Resources</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-5">
                                <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 p-4 rounded-xl shrink-0">
                                    <span className="material-symbols-outlined text-3xl">local_hospital</span>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 dark:text-white font-bold text-base">Pediatrician Directory</h4>
                                    <p className="text-xs text-slate-500 mt-1">Find specialists and pediatric dietitians near you.</p>
                                    <button
                                        onClick={() => setMainView('directory')}
                                        className="text-primary font-bold flex items-center gap-1 text-xs hover:underline mt-2"
                                    >
                                        <span>Search nearby</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 2: CHILD HEALTH & VITALS DEEP-DIVE                                   */}
                {/* ========================================================================= */}
                {mainView === 'child' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        {/* Back to Home & Child Switcher Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <button
                                onClick={() => setMainView('home')}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm self-start"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                <span>Back to Home</span>
                            </button>

                            {/* Child switcher pills */}
                            <div className="flex items-center gap-2">
                                {DEMO_CHILDREN.map(child => (
                                    <button
                                        key={child._id}
                                        onClick={() => setSelectedChildId(child._id)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            child._id === selectedChild._id
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary'
                                        }`}
                                    >
                                        <span>{child.avatar === 'girl' ? '👧' : '👦'}</span>
                                        <span>{child.name} ({child.age}y)</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Child Profile Hero Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    {/* Clean pure emoji circular avatar (No loud multi-color gradients) */}
                                    <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl border border-slate-200 dark:border-slate-700 shrink-0">
                                        {selectedChild.avatar === 'girl' ? '👧' : '👦'}
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                                {selectedChild.name}
                                            </h1>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                                {selectedChild.age} Years
                                            </span>
                                            {selectedChild.allergies.map(a => (
                                                <span key={a.id} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                                                    Allergy: {a.allergen}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Parent: <strong className="text-slate-700 dark:text-slate-300">{selectedChild.parentName}</strong> · Blood Group: <strong className="text-slate-700 dark:text-slate-300">{selectedChild.bloodGroup}</strong> · Status: <span className="text-emerald-600 font-bold">{selectedChild.bmiCategory}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start lg:self-auto">
                                    <button
                                        onClick={() => handleLockedAction('Editing Profile Demographics')}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        <span>Edit</span>
                                        <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                    </button>
                                    <button
                                        onClick={() => handleLockedAction('Exporting Health Report PDF')}
                                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-base">download</span>
                                        <span>Export PDF</span>
                                        <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                    </button>
                                </div>
                            </div>

                            {/* Vitals Quick Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Current Height</span>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedChild.height} cm</p>
                                    <span className="text-[10px] text-emerald-600 font-bold">{selectedChild.bmiPercentile}th Percentile</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Current Weight</span>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedChild.weight} kg</p>
                                    <span className="text-[10px] text-emerald-600 font-bold">Normal Range</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Calculated BMI</span>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedChild.bmi} kg/m²</p>
                                    <span className="text-[10px] text-emerald-600 font-bold">Healthy</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Daily Hydration</span>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedChild.hydrationCurrent} / {selectedChild.hydrationTarget} ml</p>
                                    <span className="text-[10px] text-primary font-bold">Goal on Track</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
                            {[
                                { id: 'overview', label: 'Overview & Logs', icon: 'dashboard' },
                                { id: 'growth', label: 'Growth Chart', icon: 'straighten' },
                                { id: 'wellness', label: 'Nutrient Analysis', icon: 'analytics' },
                                { id: 'medical', label: 'Medical & Allergies', icon: 'medical_services' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setChildTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        childTab === tab.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Child Sub-Tab 1: Overview */}
                        {childTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Energy Intake */}
                                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Energy Intake</h3>
                                                <span className="text-xs font-bold text-emerald-600">82% of Target</span>
                                            </div>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                {selectedChild.dailyCaloriesConsumed} <span className="text-xs font-medium text-slate-400">/ {selectedChild.dailyCalorieTarget} kcal</span>
                                            </p>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                                                <div className="bg-primary h-full rounded-full" style={{ width: '82%' }}></div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleLockedAction('Logging Meals & Food Items')}
                                            className="w-full mt-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-base">add</span>
                                            <span>Log Food</span>
                                            <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                        </button>
                                    </div>

                                    {/* Macronutrients */}
                                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Macronutrient Distribution</h3>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="text-slate-400 font-bold uppercase text-[10px]">Protein</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedChild.macros.protein.current}g / {selectedChild.macros.protein.target}g</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="text-slate-400 font-bold uppercase text-[10px]">Carbs</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedChild.macros.carbs.current}g / {selectedChild.macros.carbs.target}g</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="text-slate-400 font-bold uppercase text-[10px]">Healthy Fats</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedChild.macros.fats.current}g / {selectedChild.macros.fats.target}g</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="text-slate-400 font-bold uppercase text-[10px]">Fiber</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedChild.macros.fiber.current}g / {selectedChild.macros.fiber.target}g</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Today's Meals */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Meal Stream</h3>
                                    {selectedChild.todayMeals.map(meal => (
                                        <div key={meal.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div>
                                                <span className="font-bold text-primary">{meal.mealType} · {meal.time}</span>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{meal.name}</h4>
                                                <p className="text-slate-500 mt-0.5">{meal.calories} kcal · {meal.macros.p}g P · {meal.macros.c}g C · {meal.macros.f}g F</p>
                                            </div>
                                            <div className="flex gap-1.5 self-start sm:self-auto">
                                                {meal.tags.map(t => (
                                                    <span key={t} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Child Sub-Tab 2: Growth */}
                        {childTab === 'growth' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Height Progression Curve (cm) vs Age</h4>
                                        <button
                                            onClick={() => handleLockedAction('Adding New Physical Measurement')}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <span>+ Add Measurement</span>
                                            <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                        </button>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedChild.growthHistory}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                <XAxis dataKey="ageYears" tickFormatter={(v) => `${v} yrs`} tick={{ fontSize: 11 }} />
                                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit=" cm" />
                                                <Tooltip 
                                                    formatter={(value) => [`${value} cm`, 'Height']}
                                                    labelFormatter={(label) => `Age: ${label} Years`}
                                                />
                                                <Area type="monotone" dataKey="height" stroke="#2b9dee" fill="#2b9dee" fillOpacity={0.15} strokeWidth={2.5} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Child Sub-Tab 3: Wellness */}
                        {childTab === 'wellness' && (
                            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Nutrient Gap Matrix</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    {Object.entries(selectedChild.wellnessDeficiencies).map(([key, val]) => (
                                        <div key={key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <strong className="text-slate-900 dark:text-white capitalize font-bold">{key}</strong>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    val.severity === 'GREEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                                                }`}>
                                                    {val.level}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[11px]">{val.advice}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Child Sub-Tab 4: Medical */}
                        {childTab === 'medical' && (
                            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Allergies & Pediatrician Notes</h3>
                                <div className="space-y-3 text-xs">
                                    {selectedChild.allergies.map(a => (
                                        <div key={a.id} className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                                            <p className="font-bold text-rose-700 dark:text-rose-300">{a.allergen} ({a.severity})</p>
                                            <p className="text-slate-600 dark:text-slate-400 mt-0.5">Reaction: {a.reaction}</p>
                                            <p className="text-slate-500 text-[11px] mt-1">Action: {a.actionPlan}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 3: RESOURCES LIBRARY                                                 */}
                {/* ========================================================================= */}
                {mainView === 'resources' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Resources & Nutrition Library
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Nutritional guides, allergen-safe recipes, and child portion rules.
                                </p>
                            </div>
                        </div>

                        {/* Resource Sub-tabs */}
                        <div className="flex items-center gap-2">
                            {[
                                { id: 'guides', label: 'Nutritional Guides', icon: 'menu_book' },
                                { id: 'recipes', label: 'Healthy Kid Recipes', icon: 'restaurant' },
                                { id: 'portions', label: 'Portion Sizing Guide', icon: 'pie_chart' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setResourceTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        resourceTab === tab.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Guides */}
                        {resourceTab === 'guides' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {DEMO_RESOURCES_DATA.guides.map(g => (
                                    <div
                                        key={g.id}
                                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                                {g.category}
                                            </span>
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                                                {g.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">{g.summary}</p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedGuideModal(g)}
                                            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-colors text-xs flex items-center justify-center gap-1"
                                        >
                                            <span>Read Guide</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recipes */}
                        {resourceTab === 'recipes' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {DEMO_RESOURCES_DATA.recipes.map(r => (
                                    <div
                                        key={r.id}
                                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-emerald-600 font-bold">⏱ {r.prepTime}</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{r.calories}</span>
                                            </div>
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{r.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{r.ingredients.join(', ')}</p>
                                        </div>

                                        <button
                                            onClick={() => handleLockedAction('Saving Recipe to Favorites')}
                                            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">bookmark</span>
                                            <span>Save Recipe</span>
                                            <span className="material-symbols-outlined text-xs text-amber-500">lock</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Portion Sizing */}
                        {resourceTab === 'portions' && (
                            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Child's Hand Rule Portion Sizing</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                    {DEMO_RESOURCES_DATA.portionGuide.map((p, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{p.icon}</span>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{p.group}</h4>
                                                    <span className="text-[10px] text-primary font-bold">{p.dailyServing}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-[11px] pt-1"><strong>Rule:</strong> {p.childPalmRule}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 4: CONSULTATIONS HUB                                                 */}
                {/* ========================================================================= */}
                {mainView === 'consultations' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Consultations & Telehealth
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Track pediatrician reviews and digital prescriptions.
                                </p>
                            </div>
                            <button
                                onClick={() => handleLockedAction('Requesting Pediatrician Consultation')}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span className="material-symbols-outlined text-base">video_call</span>
                                <span>Request Consultation</span>
                                <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                            </button>
                        </div>

                        {DEMO_CONSULTATIONS.map(cons => (
                            <div key={cons.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40">
                                            Prescription Issued
                                        </span>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{cons.chiefComplaint}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleLockedAction('Joining Telehealth Video Session')}
                                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-bold flex items-center gap-1"
                                    >
                                        <span>Join Video</span>
                                        <span className="material-symbols-outlined text-xs">lock</span>
                                    </button>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{cons.doctorName} (Findings):</p>
                                    <p className="text-slate-600 dark:text-slate-400">{cons.doctorNotes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 5: PEDIATRIC DIRECTORY                                               */}
                {/* ========================================================================= */}
                {mainView === 'directory' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                        <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                Pediatric Directory
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Verified pediatricians and child nutritionists near you.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-400 pl-2">search</span>
                            <input
                                type="text"
                                placeholder="Search by specialist or clinic..."
                                value={directorySearch}
                                onChange={(e) => setDirectorySearch(e.target.value)}
                                className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {DEMO_DIRECTORY_DOCTORS
                                .filter(d => !directorySearch || d.name.toLowerCase().includes(directorySearch.toLowerCase()))
                                .map(doc => (
                                    <div
                                        key={doc.id}
                                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                                                {doc.name.split(' ')[1]?.[0] || 'D'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-slate-900 dark:text-white">{doc.name}</h3>
                                                <p className="text-xs text-primary font-semibold">{doc.specialization}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{doc.hospital} · ⭐ {doc.rating}</p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Fee: {doc.fee}</span>
                                            <button
                                                onClick={() => handleLockedAction(`Booking Appointment with ${doc.name}`)}
                                                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1"
                                            >
                                                <span>Book</span>
                                                <span className="material-symbols-outlined text-xs">lock</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 6: NUTRIKID AI (CHAT, FOOD PLATE RECOGNITION & DIET PLAN GENERATOR)   */}
                {/* ========================================================================= */}
                {mainView === 'ai' && (
                    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
                        
                        {/* NutriKid AI Top Showcase Navigation Tabs */}
                        <div className="flex items-center justify-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <button
                                onClick={() => setAiTab('chat')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    aiTab === 'chat'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">chat</span>
                                <span>AI Assistant Chat</span>
                            </button>

                            <button
                                onClick={() => setAiTab('plate_scan')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    aiTab === 'plate_scan'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">photo_camera</span>
                                <span>AI Food Plate Scanner</span>
                            </button>

                            <button
                                onClick={() => setAiTab('diet_plan')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    aiTab === 'diet_plan'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">restaurant_menu</span>
                                <span>AI Generated Diet Plan</span>
                            </button>
                        </div>

                        {/* AI SUB-TAB 1: CHAT (Asks to Login on Typing) */}
                        {aiTab === 'chat' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[580px]">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">smart_toy</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">NutriGuide AI Assistant</h3>
                                            <p className="text-[11px] text-slate-400">Context: {selectedChild.name} ({selectedChild.age} yrs)</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                        Demo Mode
                                    </span>
                                </div>

                                {/* Chat Messages Body */}
                                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40 text-xs sm:text-sm">
                                    {chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {msg.sender === 'ai' && (
                                                <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                                                </div>
                                            )}
                                            <div className={`p-4 rounded-2xl max-w-md leading-relaxed ${
                                                msg.sender === 'user'
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : msg.isLockedPrompt
                                                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-bl-none'
                                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                                            }`}>
                                                <p>{msg.text}</p>
                                                {msg.isLockedPrompt && (
                                                    <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-800 flex gap-2">
                                                        <Link
                                                            href="/login"
                                                            className="px-3 py-1 rounded-lg bg-primary text-white font-bold text-xs"
                                                        >
                                                            Sign In
                                                        </Link>
                                                        <Link
                                                            href="/register"
                                                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                                                        >
                                                            Create Free Account
                                                        </Link>
                                                    </div>
                                                )}
                                                <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                                                    {msg.time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleSendChat} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask any pediatric nutrition or growth question..."
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        className="size-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">send</span>
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* AI SUB-TAB 2: AI FOOD PLATE IDENTIFICATION / IMAGE RECOGNITION DEMO */}
                        {aiTab === 'plate_scan' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">photo_camera</span>
                                                AI Food Plate Scanner & Recognition
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Upload or snap a meal plate photo — our computer vision models identify ingredients and calculate exact macros.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setPlateScanSimulated(!plateScanSimulated)}
                                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                                        >
                                            {plateScanSimulated ? 'Reset Scan Demo' : 'Run Demo Plate Scan'}
                                        </button>
                                    </div>
                                </div>

                                {/* Interactive Visual Food Plate Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    {/* Food Plate Visual Box */}
                                    <div className="relative rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
                                        <div className="size-36 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-5xl relative">
                                            🥗
                                            {plateScanSimulated && (
                                                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white animate-pulse">
                                                    100% Scanned
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-4">
                                            {plateScanSimulated ? 'Sample Balanced Kids Thali Plate' : 'Ready to analyze your meal plate'}
                                        </p>
                                        <button
                                            onClick={() => handleLockedAction('Uploading Meal Plate Image for AI Vision Analysis', 'Upload photos of your child’s breakfast, lunch, or dinner plate to auto-calculate nutrition and log meals.')}
                                            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-base">upload_file</span>
                                            <span>Upload My Real Plate Photo</span>
                                            <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                        </button>
                                    </div>

                                    {/* AI Recognition Breakdown Cards */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">AI Detected Food Items</h4>
                                            <span className="text-[10px] text-emerald-600 font-bold">Accuracy 96.4%</span>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            {[
                                                { name: 'Moong Dal Tadka (Yellow Lentils)', portion: '1 Small Bowl (150g)', cals: '160 kcal', protein: '9g', icon: '🍲' },
                                                { name: 'Whole Wheat Phulka Roti', portion: '2 Rotis with ghee drops', cals: '180 kcal', protein: '5g', icon: '🫓' },
                                                { name: 'Steamed Spinach & Sweet Corn', portion: '1/2 Cup (80g)', cals: '45 kcal', protein: '2g', icon: '🥦' },
                                                { name: 'Fresh Homemade Cow Milk Curd', portion: '100g', cals: '65 kcal', protein: '4g', icon: '🥣' }
                                            ].map((food, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xl">{food.icon}</span>
                                                        <div>
                                                            <strong className="text-slate-900 dark:text-white font-bold">{food.name}</strong>
                                                            <p className="text-[11px] text-slate-500">{food.portion}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{food.cals}</span>
                                                        <span className="text-[10px] text-primary block">{food.protein} Prot</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total Plate Computed Values */}
                                        <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                                            <span>Total Plate Nutrients:</span>
                                            <span className="text-primary">450 kcal · 20g Protein · 6.5g Fiber · 3.8mg Iron</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI SUB-TAB 3: AI DIET PLAN GENERATOR FROM INSIGHTS */}
                        {aiTab === 'diet_plan' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-primary tracking-wider">AI Diet Generation</span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Targeted 7-Day Pediatric Diet Plan
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Synthesized automatically based on {selectedChild.name}'s iron gap, vitamin D needs, and allergen safety.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleLockedAction('Exporting AI Customized Diet Plan PDF', 'Generate and download complete weekly meal schedules with grocery shopping lists.')}
                                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                                    >
                                        <span className="material-symbols-outlined text-base">download</span>
                                        <span>Download Full Plan PDF</span>
                                        <span className="material-symbols-outlined text-xs opacity-80">lock</span>
                                    </button>
                                </div>

                                {/* Meal Plan Daily Slots */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    {[
                                        { slot: 'Breakfast (08:30 AM)', meal: 'Sprouted Ragi Idlis + Coconut Chutney + Orange Wedges', reason: 'Maximizes non-heme iron + Vitamin C synergy', cals: '310 kcal' },
                                        { slot: 'Lunch (01:00 PM)', meal: 'Palak Paneer Gravy + Whole Wheat Roti + Homemade Curd', reason: 'High bioavailable calcium & complete milk protein', cals: '440 kcal' },
                                        { slot: 'Afternoon Snack (04:45 PM)', meal: 'Roasted Jaggery Foxnuts (Makhana) + Apple Slices', reason: 'Sustained cognitive energy without synthetic sugar', cals: '170 kcal' },
                                        { slot: 'Dinner (07:45 PM)', meal: 'Yellow Moong Khichdi + Steamed Carrots + Cow Ghee', reason: 'Easy nighttime digestion & restorative sleep balance', cals: '390 kcal' },
                                    ].map((plan, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-primary">{plan.slot}</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{plan.cals}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{plan.meal}</h4>
                                            <p className="text-[11px] text-slate-500"><strong>Clinical Rationale:</strong> {plan.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </main>

            {/* Persistent Medical Disclaimer */}
            {showDisclaimer && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] md:w-auto min-w-[320px] bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 py-3 px-4 md:px-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 transition-all animate-in slide-in-from-bottom-8">
                    <p className="text-[12px] font-medium tracking-wide flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
                        <span><strong className="text-slate-900 dark:text-white font-bold">Disclaimer:</strong> Not a substitute for medical advice. Always consult a pediatrician.</span>
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsFeedbackOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all"
                        >
                            Feedback
                        </button>
                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600"></div>
                        <button 
                            onClick={() => setShowDisclaimer(false)}
                            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Close disclaimer"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Guide Reader Modal */}
            {selectedGuideModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
                    onClick={(e) => e.target === e.currentTarget && setSelectedGuideModal(null)}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4">
                        <button
                            onClick={() => setSelectedGuideModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {selectedGuideModal.category} · {selectedGuideModal.readTime}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {selectedGuideModal.title}
                        </h2>
                        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                            {selectedGuideModal.sections.map((sec, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sec.title}</h4>
                                    <p className="whitespace-pre-line">{sec.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setSelectedGuideModal(null)}
                                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs"
                            >
                                Done Reading
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reusable Login Required Modal */}
            <LoginRequiredModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                actionName={modalAction}
                featureDescription={modalDesc}
            />

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </div>
    );
};

export default GuestDashboard;
