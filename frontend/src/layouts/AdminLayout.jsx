"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

const AdminLayout = ({ children }) => {
    const { logout, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const profileRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    // Guard: Only allow authenticated users with 'admin' role
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'admin') {
                if (user.role === 'parent') {
                    router.replace('/parent/dashboard');
                } else if (user.role === 'doctor') {
                    router.replace('/doctor/dashboard');
                } else if (user.role === 'dietitian') {
                    router.replace('/dietitian/dashboard');
                } else {
                    router.replace('/login');
                }
            }
        }
    }, [user, loading, router]);

    // Close dropdowns on click outside
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

    const isActive = (path) => {
        if (path === '/admin/dashboard') {
            return pathname === '/admin' || pathname === '/admin/dashboard';
        }
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
        { label: 'All Users', path: '/admin/users', icon: 'group' },
        { label: 'Parents', path: '/admin/parents', icon: 'escalator_warning' },
        { label: 'Doctors', path: '/admin/doctors', icon: 'stethoscope' },
        { label: 'Activity Logs', path: '/admin/activity', icon: 'history' },
        { label: 'Security Settings', path: '/admin/security', icon: 'shield' },
    ];

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-xs font-semibold text-slate-500">Verifying Admin Authorization...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 font-display min-h-screen text-slate-800 dark:text-slate-100 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 md:px-8 py-3.5 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle navigation menu"
                    >
                        <span className="material-symbols-outlined">{showMobileMenu ? 'close' : 'menu'}</span>
                    </button>

                    {/* Logo & Admin Branding */}
                    <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-primary/30">
                            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white text-lg font-black tracking-tight leading-none group-hover:text-primary transition-colors">
                                NutriKid
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                Admin Portal
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Right Header Elements */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Platform Environment Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Platform Operational</span>
                    </div>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                        aria-label="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div
                            className="flex items-center gap-2.5 border-l pl-3 border-slate-200 dark:border-slate-800 cursor-pointer"
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name || 'Admin'}</p>
                                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Super Administrator</span>
                            </div>
                            <div className="flex items-center justify-center size-9 rounded-xl bg-blue-600/10 text-blue-600 font-black text-sm border border-blue-500/20">
                                {user.name ? user.name[0].toUpperCase() : 'A'}
                            </div>
                        </div>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-150 origin-top-right">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                                        Role: Admin
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/admin/security"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg text-slate-500">shield</span>
                                        Security Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/15 rounded-xl transition-all mt-1"
                                    >
                                        <span className="material-symbols-outlined text-lg text-rose-500">logout</span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex w-full">
                {/* Desktop Sidebar */}
                <aside className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto`}>
                    <div className="p-4 flex flex-col justify-between flex-1">
                        <nav className="flex flex-col gap-1.5">
                            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {!sidebarCollapsed ? 'Platform Management' : '•••'}
                            </div>
                            {navItems.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            active
                                                ? 'bg-primary text-white shadow-md shadow-primary/25 font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        <span className={`material-symbols-outlined text-xl ${active ? 'text-white' : 'text-slate-500'}`}>
                                            {item.icon}
                                        </span>
                                        {!sidebarCollapsed && <span>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
                                </span>
                                {!sidebarCollapsed && <span>Collapse Menu</span>}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Navigation Drawer */}
                {showMobileMenu && (
                    <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex">
                        <div className="w-72 bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
                            <div>
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        </div>
                                        <span className="font-extrabold text-slate-900 dark:text-white text-base">Admin Portal</span>
                                    </div>
                                    <button
                                        onClick={() => setShowMobileMenu(false)}
                                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <nav className="flex flex-col gap-1.5">
                                    {navItems.map((item) => {
                                        const active = isActive(item.path);
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                onClick={() => setShowMobileMenu(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                                    active
                                                        ? 'bg-primary text-white shadow-md shadow-primary/25 font-bold'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">logout</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                        <div className="flex-1" onClick={() => setShowMobileMenu(false)}></div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
