"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import WebRTCVideoCall from '../../components/video/WebRTCVideoCall';
import {
    requestTeleconsultation,
    getParentTeleconsultations,
    joinTeleconsultation
} from '../../api/consultation.api';

const QUICK_REASONS = [
    'Growth Velocity & Stagnation',
    'Dietary Iron & Energy Deficiency',
    'Food Allergies & Intolerance Advice',
    'Pediatric Nutrition & Meal Balance',
    'Fever Recovery & Appetite Loss',
    'General Pediatric Wellness Checkup'
];

export default function ParentConsultations() {
    const { selectedProfileId, selectedProfile, profiles } = useProfile();
    const { user } = useAuth();

    const [consultations, setConsultations] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [activeCallSession, setActiveCallSession] = useState(null);
    const [joiningId, setJoiningId] = useState(null);

    // Child-wise Filtering State ('ALL' or child profile _id)
    const [selectedChildFilter, setSelectedChildFilter] = useState('ALL');

    // Request Form State
    const [targetProfileId, setTargetProfileId] = useState('');
    const [targetDoctorId, setTargetDoctorId] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('10:00 AM');
    const [submitting, setSubmitting] = useState(false);

    // Fetch consultations
    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getParentTeleconsultations();
            setConsultations(data || []);
        } catch (error) {
            console.error('Failed to fetch teleconsultations:', error);
            toast.error('Failed to load consultation history');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch available pediatricians
    const fetchDoctors = async () => {
        try {
            const res = await api.get('/doctor/all');
            setDoctors(res.data?.data || res.data || []);
        } catch (err) {
            console.warn('Could not fetch doctor list:', err);
        }
    };

    useEffect(() => {
        fetchConsultations();
        fetchDoctors();
    }, [fetchConsultations]);

    // Keep child filter in sync with selected Profile from top navbar
    useEffect(() => {
        if (selectedProfileId) {
            setSelectedChildFilter(selectedProfileId);
            setTargetProfileId(selectedProfileId);
        } else if (profiles && profiles.length > 0) {
            setTargetProfileId(profiles[0]._id);
        }
    }, [selectedProfileId, profiles]);

    // Helper: Find Assigned Doctor for a specific child profile
    const getAssignedDoctorForChild = useCallback((childId) => {
        if (!childId) return null;
        // 1. Check existing consultations for this child to find assigned doctor
        const existing = consultations.find((c) => {
            const pid = c.profileId?._id || c.profileId;
            return pid === childId && c.doctorId;
        });
        if (existing?.doctorId) {
            const docObj = existing.doctorId;
            const docId = docObj._id || docObj;
            return doctors.find(d => d._id === docId) || (typeof docObj === 'object' ? docObj : null);
        }
        // 2. Default to first available pediatrician if none assigned yet
        return doctors[0] || null;
    }, [consultations, doctors]);

    // Auto-select doctor whenever targetProfileId changes in request modal
    useEffect(() => {
        if (targetProfileId) {
            const assignedDoc = getAssignedDoctorForChild(targetProfileId);
            if (assignedDoc?._id) {
                setTargetDoctorId(assignedDoc._id);
            } else if (doctors.length > 0) {
                setTargetDoctorId(doctors[0]._id);
            }
        }
    }, [targetProfileId, getAssignedDoctorForChild, doctors]);

    // Socket.IO real-time event listener
    useEffect(() => {
        if (!user?._id) return;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            socket.emit('register-user', user._id);
        });

        socket.on('consultation-started', (data) => {
            toast.success(data.message || 'Dr. has started your video consultation! Click Join.', {
                duration: 8000,
                icon: '📹'
            });
            fetchConsultations();
        });

        socket.on('teleconsult-update', (data) => {
            if (data.message) toast.success(data.message);
            fetchConsultations();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id, fetchConsultations]);

    // Submit Request
    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!targetProfileId || !targetDoctorId || !reason.trim()) {
            toast.error('Please select child, doctor, and consultation reason');
            return;
        }

        setSubmitting(true);
        try {
            await requestTeleconsultation({
                profileId: targetProfileId,
                doctorId: targetDoctorId,
                reason,
                description,
                preferredDate: preferredDate || null,
                preferredTime
            });
            toast.success('Consultation request sent directly to assigned doctor!');
            setIsRequestModalOpen(false);
            setReason('');
            setDescription('');
            fetchConsultations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit consultation request');
        } finally {
            setSubmitting(false);
        }
    };

    // Parent Join Action (Strictly Gated)
    const handleJoinClick = async (consultation) => {
        setJoiningId(consultation._id);
        try {
            const res = await joinTeleconsultation(consultation._id);
            setActiveCallSession({
                consultationId: consultation._id,
                callRoomId: res.callRoomId,
                childName: consultation.profileId?.name || 'Child',
                doctorName: consultation.doctorId?.name || 'Doctor'
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cannot join consultation. Doctor has not started it yet.');
        } finally {
            setJoiningId(null);
        }
    };

    // Filter consultations by child selection
    const childFilteredConsultations = selectedChildFilter === 'ALL'
        ? consultations
        : consultations.filter((c) => {
            const pid = c.profileId?._id || c.profileId;
            return pid === selectedChildFilter;
        });

    // Categorize filtered consultations by state
    const activeConsultations = childFilteredConsultations.filter((c) => ['STARTED', 'IN_PROGRESS'].includes(c.status));
    const scheduledConsultations = childFilteredConsultations.filter((c) => c.status === 'SCHEDULED');
    const pendingConsultations = childFilteredConsultations.filter((c) => ['REQUESTED', 'ACCEPTED', 'Pending', 'AssignedToDoctor'].includes(c.status));
    const completedConsultations = childFilteredConsultations.filter((c) => ['COMPLETED', 'Closed', 'PrescriptionIssued', 'REJECTED', 'CANCELLED'].includes(c.status));

    const selectedTargetProfile = profiles.find(p => p._id === targetProfileId);
    const assignedDoctorForTarget = getAssignedDoctorForChild(targetProfileId);

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header with Request Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="material-symbols-outlined text-indigo-400 text-2xl">telehealth</span>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Child-Wise Pediatric Consultation</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black">Video Teleconsultations</h1>
                    <p className="text-slate-300 text-sm mt-1 max-w-xl">
                        Schedule and attend video consultations assigned specifically to each of your children's pediatricians.
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (selectedChildFilter && selectedChildFilter !== 'ALL') {
                            setTargetProfileId(selectedChildFilter);
                        }
                        setIsRequestModalOpen(true);
                    }}
                    className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition active:scale-95 text-sm shrink-0"
                >
                    <span className="material-symbols-outlined text-xl">add_circle</span>
                    Request Video Consultation
                </button>
            </div>

            {/* CHILD FILTER TABS */}
            {profiles && profiles.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">filter_alt</span>
                            Child:
                        </span>
                        <button
                            onClick={() => setSelectedChildFilter('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                                selectedChildFilter === 'ALL'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            <span>👥 All Children</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                                {consultations.length}
                            </span>
                        </button>

                        {profiles.map((p) => {
                            const count = consultations.filter(c => (c.profileId?._id || c.profileId) === p._id).length;
                            return (
                                <button
                                    key={p._id}
                                    onClick={() => setSelectedChildFilter(p._id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                                        selectedChildFilter === p._id
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>👦 {p.name}</span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedChildFilter !== 'ALL' && (
                        <div className="text-xs text-indigo-500 font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0">
                            Showing consultations for: <span className="underline">{profiles.find(p => p._id === selectedChildFilter)?.name}</span>
                        </div>
                    )}
                </div>
            )}

            {/* LIVE ACTIVE CONSULTATION ALERT (If Doctor has started) */}
            {activeConsultations.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <span className="size-3 rounded-full bg-emerald-500 animate-ping"></span>
                        <h3 className="text-xs font-black uppercase tracking-wider">Live Video Session Available</h3>
                    </div>

                    {activeConsultations.map((c) => (
                        <motion.div
                            key={c._id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
                                    📹
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white animate-pulse">
                                            Doctor Started Call
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">Child: {c.profileId?.name}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                        Dr. {c.doctorId?.name || 'Pediatric Specialist'} is waiting in room
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Reason: {c.reason} · Room ID: <span className="font-mono">{c.callRoomId}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleJoinClick(c)}
                                disabled={joiningId === c._id}
                                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 transition active:scale-95 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-xl">video_call</span>
                                {joiningId === c._id ? 'Connecting...' : 'Join Video Consultation'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* SECTION: SCHEDULED APPOINTMENTS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500 text-lg">event_available</span>
                        Scheduled Appointments ({scheduledConsultations.length})
                    </h3>
                </div>

                {scheduledConsultations.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 font-medium">No appointments currently scheduled for this selection.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scheduledConsultations.map((c) => (
                            <div
                                key={c._id}
                                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                            Status: Scheduled
                                        </span>
                                        <h4 className="font-black text-base text-slate-900 dark:text-white mt-2">
                                            Dr. {c.doctorId?.name || 'Assigned Doctor'}
                                        </h4>
                                        <p className="text-xs text-slate-500">Child: <span className="font-bold text-slate-700 dark:text-slate-300">{c.profileId?.name}</span> ({c.profileId?.age}y)</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            {c.scheduledDate ? new Date(c.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date Pending'}
                                        </p>
                                        <p className="text-xs text-indigo-600 font-bold">{c.scheduledTime || 'Time TBD'}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{c.scheduledDuration || 30} Minutes</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">Reason:</p>
                                    <p className="mt-0.5">{c.reason}</p>
                                    {c.scheduledNotes && (
                                        <p className="mt-2 text-indigo-500 italic">Dr. Note: {c.scheduledNotes}</p>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                                        <span className="material-symbols-outlined text-amber-500 text-sm">lock_clock</span>
                                        Waiting for Dr. {c.doctorId?.name?.split(' ')[0] || 'Doctor'} to start
                                    </span>

                                    <button
                                        disabled
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
                                    >
                                        Join Locked
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION: PENDING REQUESTS */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">pending_actions</span>
                    Pending Requests ({pendingConsultations.length})
                </h3>

                {pendingConsultations.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 font-medium">No pending consultation requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingConsultations.map((c) => (
                            <div
                                key={c._id}
                                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                            {c.status === 'ACCEPTED' ? 'Accepted — Awaiting Schedule' : 'Awaiting Doctor Review'}
                                        </span>
                                        <h4 className="font-black text-base text-slate-900 dark:text-white mt-2">
                                            Target Doctor: Dr. {c.doctorId?.name || 'Pediatric Consultant'}
                                        </h4>
                                        <p className="text-xs text-slate-500">Child: <span className="font-bold text-slate-700 dark:text-slate-300">{c.profileId?.name}</span></p>
                                    </div>
                                    <div className="text-right text-[11px] text-slate-400">
                                        <p>Preferred Date:</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">
                                            {c.preferredDate ? new Date(c.preferredDate).toLocaleDateString() : 'Flexible'}
                                        </p>
                                        <p className="text-indigo-500 font-semibold">{c.preferredTime}</p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Reason: </span>
                                    {c.reason}
                                    {c.description && <p className="mt-1 text-slate-500 italic">"{c.description}"</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION: PAST / COMPLETED CONSULTATIONS */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                    Consultation History ({completedConsultations.length})
                </h3>

                {completedConsultations.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 font-medium">No past consultations recorded.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedConsultations.map((c) => (
                            <div
                                key={c._id}
                                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 opacity-90"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                                        }`}>
                                            {c.status}
                                        </span>
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                                            Dr. {c.doctorId?.name || 'Pediatrician'}
                                        </h4>
                                        <p className="text-xs text-slate-500">Child: {c.profileId?.name}</p>
                                    </div>
                                    <div className="text-right text-[11px] text-slate-400">
                                        <p>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'Past Session'}</p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                                    <p className="font-bold">Topic: {c.reason}</p>
                                    {c.doctorNotes && <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">Clinical Summary: {c.doctorNotes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* REQUEST CONSULTATION MODAL */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white">
                                        Request Video Consultation
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Your request is automatically routed to the child's assigned pediatrician.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleRequestSubmit} className="space-y-4">
                                {/* Child Picker */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Select Child
                                    </label>
                                    <select
                                        value={targetProfileId}
                                        onChange={(e) => setTargetProfileId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">-- Choose Child Profile --</option>
                                        {profiles.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                👦 {p.name} ({p.age} yrs, {p.gender})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* AUTO-ASSIGNED DOCTOR NOTICE & PICKER */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Assigned Pediatrician
                                    </label>

                                    {assignedDoctorForTarget && (
                                        <div className="p-3.5 mb-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                👨‍⚕️
                                            </div>
                                            <div className="text-xs">
                                                <div className="flex items-center gap-1.5 font-black text-indigo-900 dark:text-indigo-200">
                                                    <span>Direct Route to Assigned Doctor:</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-800 text-[10px]">
                                                        Auto-Assigned
                                                    </span>
                                                </div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                    Dr. {assignedDoctorForTarget.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {assignedDoctorForTarget.doctorProfile?.specialization || 'Pediatric Care'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <select
                                        value={targetDoctorId}
                                        onChange={(e) => setTargetDoctorId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">-- Select Pediatrician --</option>
                                        {doctors.map((d) => (
                                            <option key={d._id} value={d._id}>
                                                Dr. {d.name} — {d.doctorProfile?.specialization || 'Pediatric Consultant'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quick Reason Pills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Primary Reason for Consultation
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {QUICK_REASONS.map((qr) => (
                                            <button
                                                type="button"
                                                key={qr}
                                                onClick={() => setReason(qr)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                                                    reason === qr
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                }`}
                                            >
                                                {qr}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Or enter custom consultation topic..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                {/* Additional Details */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Additional Symptoms / Description (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe symptoms or concerns for the assigned doctor to review..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Preferred Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Preferred Date
                                        </label>
                                        <input
                                            type="date"
                                            value={preferredDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setPreferredDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Preferred Time Slot
                                        </label>
                                        <select
                                            value={preferredTime}
                                            onChange={(e) => setPreferredTime(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="09:00 AM">09:00 AM – 10:00 AM</option>
                                            <option value="10:00 AM">10:00 AM – 11:00 AM</option>
                                            <option value="11:30 AM">11:30 AM – 12:30 PM</option>
                                            <option value="02:00 PM">02:00 PM – 03:00 PM</option>
                                            <option value="04:00 PM">04:00 PM – 05:00 PM</option>
                                            <option value="06:00 PM">06:00 PM – 07:00 PM</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsRequestModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Send Request to Doctor'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LIVE WebRTC Video Call Stage */}
            <AnimatePresence>
                {activeCallSession && (
                    <WebRTCVideoCall
                        consultationId={activeCallSession.consultationId}
                        callRoomId={activeCallSession.callRoomId}
                        userRole="parent"
                        userName={user?.name || 'Parent'}
                        userId={user?._id}
                        childName={activeCallSession.childName}
                        onClose={() => {
                            setActiveCallSession(null);
                            fetchConsultations();
                        }}
                        onCallEnded={() => {
                            setActiveCallSession(null);
                            fetchConsultations();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
