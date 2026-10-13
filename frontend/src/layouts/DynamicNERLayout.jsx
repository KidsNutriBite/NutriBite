"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

const DynamicNERLayout = ({ children }) => {
    const { logout, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'admin' && user.role !== 'dietitian') {
                router.replace('/login'); // unauthorized
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
        toast.success('Logged out successfully');
    };

    if (loading || !user || (user.role !== 'admin' && user.role !== 'dietitian')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-xs font-semibold text-slate-500">Verifying Authorization...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 font-display min-h-screen text-slate-800 dark:text-slate-100 flex flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 md:px-8 py-3.5 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href={`/${user.role}/dashboard`} className="flex items-center gap-2.5 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30">
                            <span className="material-symbols-outlined text-2xl">memory</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white text-lg font-black tracking-tight leading-none group-hover:text-indigo-500 transition-colors">
                                NutriBite NER
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
                                Dynamic Engine
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>

                    <div className="relative" ref={profileRef}>
                        <div
                            className="flex items-center gap-2.5 border-l pl-3 border-slate-200 dark:border-slate-800 cursor-pointer"
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">{user.role}</span>
                            </div>
                            <div className="flex items-center justify-center size-9 rounded-xl bg-indigo-500/10 text-indigo-600 font-black text-sm border border-indigo-500/20">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                        </div>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href={`/${user.role}/dashboard`}
                                        className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">dashboard</span>
                                        Return to Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/15 rounded-xl transition-all mt-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default DynamicNERLayout;
