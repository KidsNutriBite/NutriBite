"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats } from '../../api/admin.api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getDashboardStats();
            setData(res.data);
        } catch (err) {
            console.error('Error fetching admin dashboard stats:', err);
            toast.error(err.response?.data?.message || 'Failed to load dashboard metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[450px]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-3 text-xs font-semibold text-slate-500">Loading Platform Metrics...</p>
            </div>
        );
    }

    const stats = data?.stats || {
        totalUsers: 0,
        parentsCount: 0,
        doctorsCount: 0,
        dietitiansCount: 0,
        adminsCount: 0,
        activeUsersCount: 0,
        inactiveUsersCount: 0,
        twoFAEnabledCount: 0,
        totalProfilesCount: 0,
    };

    const recentRegistrations = data?.recentRegistrations || [];
    const recentActivity = data?.recentActivity || [];

    // Calculate percentage distribution
    const total = stats.totalUsers || 1;
    const parentPct = Math.round((stats.parentsCount / total) * 100);
    const doctorPct = Math.round((stats.doctorsCount / total) * 100);
    const dietitianPct = Math.round((stats.dietitiansCount / total) * 100);
    const adminPct = Math.round((stats.adminsCount / total) * 100);

    const getActionBadge = (action, status) => {
        if (action.includes('SUCCESS')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Success</span>;
        }
        if (action.includes('FAILED') || status === 'BLOCKED') {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Failed / Blocked</span>;
        }
        if (action.includes('2FA')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">2FA Challenge</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{action}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Platform Overview
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Centralized platform monitoring, user management, and security administration.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        Refresh Data
                    </button>
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">manage_accounts</span>
                        Manage Users
                    </Link>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
                        <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">group</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Registered accounts in database</p>
                    </div>
                </div>

                {/* Parents */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Parents</span>
                        <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">escalator_warning</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.parentsCount}</div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {stats.totalProfilesCount} linked child profiles
                        </p>
                    </div>
                </div>

                {/* Doctors & Dietitians */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinicians</span>
                        <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">stethoscope</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            {stats.doctorsCount + stats.dietitiansCount}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {stats.doctorsCount} Doctors · {stats.dietitiansCount} Dietitians
                        </p>
                    </div>
                </div>

                {/* Administrators */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admins</span>
                        <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">shield_person</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.adminsCount}</div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Platform administrators</p>
                    </div>
                </div>
            </div>

            {/* Middle Section: Role Distribution & Security Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Breakdown Chart Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                            Role Distribution & Demographics
                        </h2>
                        <span className="text-xs font-semibold text-slate-400">Real-time DB Counts</span>
                    </div>

                    {/* Visual Segmented Bar */}
                    <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex my-4">
                        <div style={{ width: `${parentPct}%` }} className="bg-emerald-500 h-full" title={`Parents: ${stats.parentsCount}`} />
                        <div style={{ width: `${doctorPct}%` }} className="bg-blue-500 h-full" title={`Doctors: ${stats.doctorsCount}`} />
                        <div style={{ width: `${dietitianPct}%` }} className="bg-purple-500 h-full" title={`Dietitians: ${stats.dietitiansCount}`} />
                        <div style={{ width: `${adminPct}%` }} className="bg-amber-500 h-full" title={`Admins: ${stats.adminsCount}`} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-emerald-500 shrink-0"></span>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Parents</p>
                                <p className="text-xs text-slate-500">{stats.parentsCount} ({parentPct}%)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-blue-500 shrink-0"></span>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Doctors</p>
                                <p className="text-xs text-slate-500">{stats.doctorsCount} ({doctorPct}%)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-purple-500 shrink-0"></span>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dietitians</p>
                                <p className="text-xs text-slate-500">{stats.dietitiansCount} ({dietitianPct}%)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-amber-500 shrink-0"></span>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Admins</p>
                                <p className="text-xs text-slate-500">{stats.adminsCount} ({adminPct}%)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Health & Security Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">security</span>
                            Security & Health
                        </h2>

                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Active Accounts</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.activeUsersCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Inactive / Suspended</span>
                                <span className="text-xs font-bold text-rose-500">{stats.inactiveUsersCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">2FA Protected</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{stats.twoFAEnabledCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/admin/security"
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all"
                        >
                            <span>View Security Settings</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Registrations & Login Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Registrations Table */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500 text-xl">person_add</span>
                            Recent Registrations
                        </h2>
                        <Link href="/admin/users" className="text-xs font-bold text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {recentRegistrations.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            No registered users found in the database.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentRegistrations.map((u) => (
                                <div key={u._id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                            {u.name ? u.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            u.role === 'doctor' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                                            u.role === 'parent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                            u.role === 'dietitian' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                                            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                        }`}>
                                            {u.role}
                                        </span>
                                        <span className={`size-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={u.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Login & Audit Activity */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-xl">lock_clock</span>
                            Recent Login Activity
                        </h2>
                        <Link href="/admin/activity" className="text-xs font-bold text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            No recent activity recorded yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentActivity.map((log) => (
                                <div key={log._id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {log.name || log.email}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {log.role}
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        {getActionBadge(log.action, log.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
