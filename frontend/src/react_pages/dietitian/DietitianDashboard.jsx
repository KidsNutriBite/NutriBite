"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import { toast } from 'react-hot-toast';

const DietitianDashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [availableDietitians, setAvailableDietitians] = useState([]);
    const [transferReason, setTransferReason] = useState('');
    const [targetDietitianId, setTargetDietitianId] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    const fetchCases = async () => {
        try {
            const { data } = await api.get('/consultations/dietitian/cases');
            setCases(data.data || []);
        } catch (error) {
            console.error('Failed to fetch dietitian cases:', error);
            toast.error('Failed to load consultation requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const openTransferModal = async (req) => {
        setSelectedRequest(req);
        setIsTransferModalOpen(true);
        setTransferReason('');
        setTargetDietitianId('');
        try {
            const { data } = await api.get('/consultations/dietitian/list-available');
            setAvailableDietitians(data.data || []);
        } catch (error) {
            console.error('Failed to load available dietitians', error);
            toast.error('Could not load online dietitians');
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        if (!targetDietitianId || !transferReason) {
            toast.error('Please select a dietitian and provide a transfer reason');
            return;
        }

        setTransferLoading(true);
        try {
            await api.post(`/consultations/${selectedRequest._id}/transfer`, {
                toDietitianId: targetDietitianId,
                reason: transferReason
            });
            toast.success('Consultation successfully transferred');
            setIsTransferModalOpen(false);
            // Reload list
            fetchCases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to transfer consultation');
        } finally {
            setTransferLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider";
        switch (status) {
            case 'AssignedToDietitian':
                return `${base} bg-blue-100 text-blue-800`;
            case 'UnderDietitianReview':
                return `${base} bg-indigo-100 text-indigo-800`;
            case 'AssignedToDoctor':
                return `${base} bg-purple-100 text-purple-800`;
            case 'UnderDoctorReview':
                return `${base} bg-pink-100 text-pink-800`;
            case 'PrescriptionIssued':
                return `${base} bg-green-100 text-green-800`;
            default:
                return `${base} bg-slate-100 text-slate-800`;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'AssignedToDietitian': return 'New Case';
            case 'UnderDietitianReview': return 'Reviewing';
            case 'AssignedToDoctor': return 'Escalated to Doctor';
            case 'UnderDoctorReview': return 'Doctor Reviewing';
            case 'PrescriptionIssued': return 'Prescribed';
            default: return status;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assigned Consultations</h1>
                    <p className="text-slate-500 font-medium">Manage and review cases assigned to your queue</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : cases.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="text-6xl mb-6">📋</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Queue is Empty</h3>
                    <p className="text-slate-500 max-w-md mx-auto">You have no active cases assigned to you. Change your availability status to "Available" to receive new consultations.</p>
                </motion.div>
            ) : (
                <div className="grid gap-6">
                    {cases.map((c) => (
                        <motion.div
                            key={c._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow"
                        >
                            {/* Child Demographics Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                    {c.profileId?.avatar === 'lion' && '🦁'}
                                    {c.profileId?.avatar === 'bear' && '🐻'}
                                    {c.profileId?.avatar === 'rabbit' && '🐰'}
                                    {c.profileId?.avatar === 'fox' && '🦊'}
                                    {c.profileId?.avatar === 'cat' && '🐱'}
                                    {c.profileId?.avatar === 'dog' && '🐶'}
                                    {!c.profileId?.avatar && '👶'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">{c.profileId?.name}</h3>
                                        <span className={getStatusBadge(c.status)}>{getStatusLabel(c.status)}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Assigned: {new Date(c.createdAt).toLocaleDateString()} • ID: {c._id.slice(-6)}</p>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">
                                        {c.profileId?.age} Years • {c.profileId?.gender} • {c.profileId?.weight}kg
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => openTransferModal(c)}
                                    className="flex-1 md:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 hover:text-primary font-bold text-sm rounded-xl transition flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">move_item</span>
                                    Transfer
                                </button>
                                <button
                                    onClick={() => navigate(`/dietitian/cases/${c._id}`)}
                                    className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white hover:bg-blue-600 font-bold text-sm rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                    Review Case
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Transfer Modal */}
            <Modal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                title="Transfer Consultation"
            >
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Available Dietitian</label>
                        <select
                            required
                            value={targetDietitianId}
                            onChange={(e) => setTargetDietitianId(e.target.value)}
                            className="w-full border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-sm text-slate-800 dark:text-slate-200"
                        >
                            <option value="">Select Dietitian</option>
                            {availableDietitians.map(d => (
                                <option key={d._id} value={d._id}>{d.name} ({d.dietitianProfile?.specialization || 'Nutritionist'})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reason for Transfer</label>
                        <textarea
                            required
                            rows="4"
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            placeholder="Provide reason (e.g. Specialized clinical expertise required, Shift handover, etc.)"
                            className="w-full border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-sm text-slate-800 dark:text-slate-200"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => setIsTransferModalOpen(false)}
                            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={transferLoading}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-md shadow-blue-100 dark:shadow-none transition flex items-center justify-center gap-1"
                        >
                            {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DietitianDashboard;
