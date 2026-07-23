"use client";

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useProfile } from '../context/ProfileContext';
import FeedbackModal from '../components/parent/FeedbackModal';
import { useTheme } from '../context/ThemeContext';

const ParentLayout = ({ children }) => {
    const { logout, user, loading } = useAuth();
    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showChildDropdown, setShowChildDropdown] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    const { profiles, selectedProfileId, selectedProfile, changeProfile } = useProfile();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'parent') {
                if (user.role === 'doctor') {
                    router.replace('/doctor/dashboard');
                } else if (user.role === 'dietitian') {
                    router.replace('/dietitian/dashboard');
                } else {
                    router.replace('/login');
                }
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (sessionStorage.getItem('disclaimerClosed') === 'true') {
            setShowDisclaimer(false);
        }
    }, []);

    const handleCloseDisclaimer = () => {
        setShowDisclaimer(false);
        sessionStorage.setItem('disclaimerClosed', 'true');
    };


    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const childRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifDropdown(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (childRef.current && !childRef.current.contains(event.target)) {
                setShowChildDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data.notifications);
            setUnreadCount(data.data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Poll for notifications
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pathname = usePathname();
    const location = { pathname };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    if (loading || !user || user.role !== 'parent') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen text-slate-800 dark:text-slate-200">
            {/* Top Navbar */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 md:px-20 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span className="material-symbols-outlined">{showMobileMenu ? 'close' : 'menu'}</span>
                    </button>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/40">
                        <span className="material-symbols-outlined">nutrition</span>
                    </div>
                    <Link href="/parent/dashboard" className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight hidden sm:block">NutriKid</Link>
                    <Link href="/parent/dashboard" className="text-slate-900 dark:text-white text-xl font-extrabold tracking-tight sm:hidden">NutriKid</Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-2">
                    <Link
                        href="/parent/dashboard"
                        className={isActive('/parent/dashboard')
                            ? "bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 transition-all"
                            : "text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary px-5 py-2.5 transition-colors"}
                    >
                        Home
                    </Link>
                    <Link
                        href="/parent/resources"
                        className={isActive('/parent/resources')
                            ? "bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 transition-all"
                            : "text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary px-5 py-2.5 transition-colors"}
                    >
                        Resources
                    </Link>
                    <Link
                        href="/parent/consultations"
                        className={isActive('/parent/consultations')
                            ? "bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 transition-all"
                            : "text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary px-5 py-2.5 transition-colors"}
                    >
                        Consultations
                    </Link>
                </nav>

                <div className="flex items-center gap-4">


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
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifDropdown && (
                            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
                                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif._id}
                                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                                className={`p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                    <div>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{notif.message}</p>
                                                        <span className="text-xs text-gray-400 mt-1 block">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div
                            className="flex items-center gap-3 border-l pl-4 border-slate-200 dark:border-slate-800 cursor-pointer"
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none">{user?.name || 'Parent'}</p>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{user?.role}</span>
                            </div>
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20"
                                style={{ backgroundImage: `url('${user?.profileImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}')` }}
                            ></div>
                        </div>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-4 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in zoom-in duration-200 origin-top-right">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/parent/profile"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-lg">person</span>
                                        </div>
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/parent/my-children"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group mt-1"
                                    >
                                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-lg">child_care</span>
                                        </div>
                                        My Children
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all mt-1 group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-[73px] z-40 shadow-lg">
                    <nav className="flex flex-col gap-2">
                        <Link
                            href="/parent/dashboard"
                            onClick={() => setShowMobileMenu(false)}
                            className={isActive('/parent/dashboard') ? "bg-primary/10 text-primary font-bold px-4 py-3 rounded-xl" : "text-slate-600 dark:text-slate-400 font-medium px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">home</span>
                                Home
                            </div>
                        </Link>
                        <Link
                            href="/parent/resources"
                            onClick={() => setShowMobileMenu(false)}
                            className={isActive('/parent/resources') ? "bg-primary/10 text-primary font-bold px-4 py-3 rounded-xl" : "text-slate-600 dark:text-slate-400 font-medium px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">library_books</span>
                                Resources
                            </div>
                        </Link>
                        <Link
                            href="/parent/consultations"
                            onClick={() => setShowMobileMenu(false)}
                            className={isActive('/parent/consultations') ? "bg-primary/10 text-primary font-bold px-4 py-3 rounded-xl" : "text-slate-600 dark:text-slate-400 font-medium px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">chat_bubble</span>
                                Consultations
                            </div>
                        </Link>
                    </nav>
                </div>
            )}

            <main className="max-w-[1200px] mx-auto w-full px-6 py-8 pb-24">
                {children}
            </main>

            {/* Persistent Medical Disclaimer & Feedback Button */}
            {showDisclaimer && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[90%] md:w-auto min-w-[320px] bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 py-3 px-4 md:px-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 transition-all duration-300 animate-in slide-in-from-bottom-8">
                    <p className="text-[13px] font-medium tracking-wide flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-amber-500 drop-shadow-sm">warning</span>
                        <span className="dark:text-slate-200"><strong className="text-slate-900 dark:text-white font-bold">Disclaimer:</strong> Not a substitute for medical advice. Always consult a pediatrician.</span>
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsFeedbackOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-primary/20 hover:shadow-md"
                        >
                            <span className="material-symbols-outlined text-[14px]">rate_review</span>
                            Feedback
                        </button>
                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600"></div>
                        <button 
                            onClick={handleCloseDisclaimer}
                            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 flex items-center justify-center"
                            aria-label="Close disclaimer"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
    );
};

export default ParentLayout;
