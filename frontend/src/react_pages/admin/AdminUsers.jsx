"use client";
import { useState, useEffect } from 'react';
import { getUsers, getUserDetails, updateUserStatus, toggleUser2FA, deleteUser } from '../../api/admin.api';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const AdminUsers = ({ defaultRoleFilter = 'all', pageTitle = 'User Management', pageSubtitle = 'Search, monitor, filter, and administer platform user accounts.' }) => {
    const { user: currentAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState(defaultRoleFilter);
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                search,
                role: roleFilter,
                status: statusFilter,
            };
            const res = await getUsers(params);
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Error fetching users:', err);
            toast.error(err.response?.data?.message || 'Failed to retrieve users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, [roleFilter, statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const handleViewUser = async (userId) => {
        try {
            setUserDetailsLoading(true);
            setShowDetailModal(true);
            const res = await getUserDetails(userId);
            setSelectedUser(res.data);
        } catch (err) {
            console.error('Error fetching user details:', err);
            toast.error(err.response?.data?.message || 'Failed to load user details');
            setShowDetailModal(false);
        } finally {
            setUserDetailsLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            await updateUserStatus(userId, newStatus);
            toast.success(`User status updated to ${newStatus}`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: newStatus } : u));
            if (selectedUser && selectedUser._id === userId) {
                setSelectedUser(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleToggle2FA = async (userId, currentState) => {
        try {
            const nextState = !currentState;
            await toggleUser2FA(userId, nextState);
            toast.success(`Two-factor authentication ${nextState ? 'enabled' : 'disabled'}`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, is2FAEnabled: nextState } : u));
            if (selectedUser && selectedUser._id === userId) {
                setSelectedUser(prev => ({ ...prev, is2FAEnabled: nextState }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle 2FA');
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            setDeleting(true);
            await deleteUser(userToDelete._id);
            toast.success('User account removed safely');
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {pageTitle}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {pageSubtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        Total: <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> accounts
                    </span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email address..."
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
                    {/* Role Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
                        >
                            <option value="all">All Roles</option>
                            <option value="parent">Parents</option>
                            <option value="doctor">Doctors</option>
                            <option value="dietitian">Dietitians</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        <p className="text-xs text-slate-500 font-medium">Fetching registered users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined text-2xl">search_off</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No users found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Try adjusting your search criteria or role/status filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-4 py-3.5">Role</th>
                                    <th className="px-4 py-3.5">Linked Records</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">2FA</th>
                                    <th className="px-4 py-3.5">Registered</th>
                                    <th className="px-4 py-3.5">Last Login</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                                {users.map((u) => {
                                    const isSelf = currentAdmin?._id === u._id;
                                    return (
                                        <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                            {/* User Info */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
                                                        {u.name ? u.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 dark:text-white truncate">{u.name}</span>
                                                            {isSelf && (
                                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 truncate block">{u.email}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-4 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    u.role === 'doctor' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                                                    u.role === 'parent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                                    u.role === 'dietitian' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>

                                            {/* Linked Domain Records */}
                                            <td className="px-4 py-3.5 text-slate-500">
                                                {u.role === 'parent' && <span>{u.childCount ?? 0} Children</span>}
                                                {u.role === 'doctor' && <span>{u.connectionCount ?? 0} Patients</span>}
                                                {u.role === 'dietitian' && <span>{u.caseCount ?? 0} Active Cases</span>}
                                                {u.role === 'admin' && <span className="text-slate-400">System Admin</span>}
                                            </td>

                                            {/* Status Dropdown */}
                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={u.status || 'Active'}
                                                    disabled={isSelf}
                                                    onChange={(e) => handleStatusChange(u._id, e.target.value)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border focus:outline-none cursor-pointer ${
                                                        u.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                                                            : u.status === 'Suspended'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="Suspended">Suspended</option>
                                                </select>
                                            </td>

                                            {/* 2FA Toggle */}
                                            <td className="px-4 py-3.5">
                                                <button
                                                    onClick={() => handleToggle2FA(u._id, u.is2FAEnabled)}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                                        u.is2FAEnabled
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {u.is2FAEnabled ? 'Enabled' : 'Disabled'}
                                                </button>
                                            </td>

                                            {/* Registered Date */}
                                            <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>

                                            {/* Last Login */}
                                            <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Never'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleViewUser(u._id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                                        title="View user details"
                                                    >
                                                        <span className="material-symbols-outlined text-base">visibility</span>
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => {
                                                                setUserToDelete(u);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                            title="Delete user account"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">account_circle</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Administrative User Profile</h3>
                                    <p className="text-xs text-slate-400">Non-sensitive platform credentials & metadata</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {userDetailsLoading || !selectedUser ? (
                                <div className="p-12 text-center text-xs text-slate-500">Loading user profile...</div>
                            ) : (
                                <>
                                    {/* Summary Card */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs">
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Name</span>
                                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedUser.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Role</span>
                                            <p className="font-bold text-primary capitalize mt-0.5">{selectedUser.role}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Account Status</span>
                                            <p className={`font-bold mt-0.5 ${selectedUser.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {selectedUser.status || 'Active'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">2FA Verified</span>
                                            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                                {selectedUser.is2FAEnabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role Context Details */}
                                    {selectedUser.role === 'parent' && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-emerald-500 text-sm">child_care</span>
                                                Registered Children ({selectedUser.children?.length || 0})
                                            </h4>
                                            {selectedUser.children?.length === 0 ? (
                                                <p className="text-xs text-slate-400 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">No children linked to this parent.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {selectedUser.children?.map(child => (
                                                        <div key={child._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                                                            <p className="font-bold text-slate-800 dark:text-slate-200">{child.name}</p>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                Age: {child.age} yrs · {child.gender} · {child.currentWeight}kg / {child.currentHeight}cm
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedUser.role === 'doctor' && (
                                        <div className="space-y-3">
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                                                <p><strong className="text-slate-400">Specialization:</strong> {selectedUser.doctorProfile?.specialization || 'N/A'}</p>
                                                <p><strong className="text-slate-400">Hospital:</strong> {selectedUser.doctorProfile?.hospitalName || 'N/A'}</p>
                                                <p><strong className="text-slate-400">Experience:</strong> {selectedUser.doctorProfile?.experienceYears || 0} Years</p>
                                                <p><strong className="text-slate-400">License ID:</strong> {selectedUser.doctorProfile?.registrationId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Activity Stream */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-amber-500 text-sm">history</span>
                                            Recent Authentication & Security Events
                                        </h4>
                                        {selectedUser.recentActivity?.length === 0 ? (
                                            <p className="text-xs text-slate-400 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">No recent activity logged for this user.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                                {selectedUser.recentActivity?.map(log => (
                                                    <div key={log._id} className="p-2.5 flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                                                            <p className="text-[10px] text-slate-400">{log.details || 'Standard transaction'}</p>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in duration-150">
                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Confirm User Deletion</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{userToDelete.name}</strong> ({userToDelete.email})?
                            This action will remove the user account and unbind associated data.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/20"
                            >
                                {deleting ? 'Deleting...' : 'Delete User Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
