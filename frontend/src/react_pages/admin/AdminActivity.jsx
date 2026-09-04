"use client";
import { useState, useEffect } from 'react';
import { getActivityLogs } from '../../api/admin.api';
import { toast } from 'react-hot-toast';

const AdminActivity = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                search,
                action: actionFilter,
                status: statusFilter,
            };
            const res = await getActivityLogs(params);
            setLogs(res.data.logs);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            toast.error(err.response?.data?.message || 'Failed to retrieve activity logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [actionFilter, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const getActionBadge = (action, status) => {
        if (action === 'LOGIN_SUCCESS' || action === '2FA_SUCCESS') {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {action}
                </span>
            );
        }
        if (action.includes('FAILED') || status === 'BLOCKED') {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {action}
                </span>
            );
        }
        if (action.includes('2FA')) {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {action}
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {action}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Login & Security Activity
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Audit trail of platform authentications, 2FA challenges, status modifications, and security events.
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs(pagination.page)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95 self-start md:self-auto"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Refresh Feed
                </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by email, name, IP address, or details..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm shrink-0"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
                    {/* Action Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Action:</span>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
                        >
                            <option value="all">All Actions</option>
                            <option value="LOGIN_SUCCESS">Login Success</option>
                            <option value="LOGIN_FAILED">Login Failed</option>
                            <option value="2FA_REQUESTED">2FA Requested</option>
                            <option value="2FA_SUCCESS">2FA Success</option>
                            <option value="2FA_FAILED">2FA Failed</option>
                            <option value="USER_STATUS_CHANGE">Status Change</option>
                            <option value="USER_DELETED">User Deleted</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Result:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
                        >
                            <option value="all">All Results</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="INFO">Info</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        <p className="text-xs text-slate-500 font-medium">Loading activity audit trail...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined text-2xl">history</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No activity logs recorded</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Authentication events and administrative operations will appear here in real-time.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Timestamp</th>
                                    <th className="px-4 py-3.5">User / Account</th>
                                    <th className="px-4 py-3.5">Role</th>
                                    <th className="px-4 py-3.5">Action</th>
                                    <th className="px-4 py-3.5">Details</th>
                                    <th className="px-4 py-3.5">IP / Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-900 dark:text-white truncate block">{log.name || log.email}</span>
                                                <span className="text-[10px] text-slate-400 truncate block">{log.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="capitalize text-slate-500 text-[11px] font-semibold">
                                                {log.role || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getActionBadge(log.action, log.status)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs truncate" title={log.details}>
                                            {log.details || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-[11px] font-mono">
                                            {log.ipAddress || '127.0.0.1'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivity;
