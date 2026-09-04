"use client";
import { useState, useEffect } from 'react';
import { getSecurityOverview, toggleUser2FA } from '../../api/admin.api';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const AdminSecurity = () => {
    const { user: currentAdmin } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [admin2FA, setAdmin2FA] = useState(currentAdmin?.is2FAEnabled || false);
    const [toggling, setToggling] = useState(false);

    const fetchSecurityData = async () => {
        try {
            setLoading(true);
            const res = await getSecurityOverview();
            setData(res.data);
            if (res.data?.currentAdmin) {
                setAdmin2FA(res.data.currentAdmin.is2FAEnabled);
            }
        } catch (err) {
            console.error('Error fetching security overview:', err);
            toast.error(err.response?.data?.message || 'Failed to load security settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const handleToggleAdmin2FA = async () => {
        if (!currentAdmin) return;
        try {
            setToggling(true);
            const nextState = !admin2FA;
            await toggleUser2FA(currentAdmin._id, nextState);
            setAdmin2FA(nextState);
            toast.success(`Admin Two-Factor Verification ${nextState ? 'Enabled' : 'Disabled'}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update 2FA configuration');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-3 text-xs text-slate-500 font-semibold">Loading security telemetry...</p>
            </div>
        );
    }

    const overview = data?.overview || {
        totalUsers: 0,
        twoFAEnabledCount: 0,
        twoFAAdoptionRate: 0,
        lockedAccountsCount: 0,
        recentFailedLogins24h: 0,
        recentSuccessfulLogins24h: 0,
        parent2FAMandatory: false,
        smsProvider: 'console',
        jwtExpire: '30d',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Security & Authentication Settings
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Platform-wide identity protection, 2FA policies, session tokens, and threat monitoring.
                    </p>
                </div>
                <button
                    onClick={fetchSecurityData}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95 self-start md:self-auto"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Refresh Telemetry
                </button>
            </div>

            {/* Security Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2FA Adoption</span>
                    <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {overview.twoFAAdoptionRate}%
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{overview.twoFAEnabledCount} of {overview.totalUsers} accounts protected</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Locked Accounts</span>
                    <div className="mt-2 text-2xl font-black text-rose-500">
                        {overview.lockedAccountsCount}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Locked by brute-force protection</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed Logins (24h)</span>
                    <div className="mt-2 text-2xl font-black text-amber-500">
                        {overview.recentFailedLogins24h}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rejected credential attempts</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Successful Logins (24h)</span>
                    <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                        {overview.recentSuccessfulLogins24h}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Authenticated sessions established</p>
                </div>
            </div>

            {/* Admin Two-Factor Authentication Control Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-2xl">phonelink_lock</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Administrator Two-Step Verification
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                                When enabled, your administrator logins will require entering a one-time verification code dispatched to your registered credentials (Email / SMS) in addition to your password.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        <span className={`text-xs font-bold ${admin2FA ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {admin2FA ? 'Active & Enabled' : 'Disabled'}
                        </span>
                        <button
                            onClick={handleToggleAdmin2FA}
                            disabled={toggling}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                admin2FA
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                                    : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                            }`}
                        >
                            {toggling ? 'Updating...' : admin2FA ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Platform Security Policies Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role 2FA Enforcement Matrix */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg">policy</span>
                        Role Verification Policy
                    </h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">Doctor Accounts</p>
                                <p className="text-[11px] text-slate-400">Clinical oversight verification</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Enabled
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">Parent Accounts</p>
                                <p className="text-[11px] text-slate-400">
                                    {overview.parent2FAMandatory ? 'Mandatory for all parents' : 'User opt-in enabled'}
                                </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {overview.parent2FAMandatory ? 'Mandatory' : 'Supported'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">Admin Accounts</p>
                                <p className="text-[11px] text-slate-400">Administrative privileged access</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                Supported
                            </span>
                        </div>
                    </div>
                </div>

                {/* Session & Hardening Configurations */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">lock</span>
                        Hardening & Session Rules
                    </h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">JWT Session Validity</p>
                                <p className="text-[11px] text-slate-400">Signed with HMAC-SHA256</p>
                            </div>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{overview.jwtExpire}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">Brute-Force Lockout</p>
                                <p className="text-[11px] text-slate-400">Auto-lock after 5 invalid attempts</p>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">15 min lock</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">OTP Expiration Window</p>
                                <p className="text-[11px] text-slate-400">Bcrypt hashed challenge code</p>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">5 Minutes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSecurity;
