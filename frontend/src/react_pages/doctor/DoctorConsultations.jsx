"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import WebRTCVideoCall from '../../components/video/WebRTCVideoCall';
import {
    getDoctorTeleconsultations,
    reviewTeleconsultation,
    scheduleTeleconsultation,
    startTeleconsultation
} from '../../api/consultation.api';

export default function DoctorConsultations() {
    const { user } = useAuth();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'scheduled' | 'active' | 'completed'

    // Schedule Modal
    const [selectedRequestForSchedule, setSelectedRequestForSchedule] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('10:00 AM');
    const [scheduleDuration, setScheduleDuration] = useState(30);
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [scheduling, setScheduling] = useState(false);

    // Reject Modal
    const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Active WebRTC Video Call State
    const [activeCallSession, setActiveCallSession] = useState(null); // { consultationId, callRoomId, childName }
    const [startingId, setStartingId] = useState(null);

    // Fetch consultations
    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDoctorTeleconsultations();
            setConsultations(data || []);
        } catch (err) {
            console.error('Failed to load doctor consultations:', err);
            toast.error('Failed to load consultations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    // Socket.IO real-time event listener
    useEffect(() => {
        if (!user?._id) return;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            socket.emit('register-user', user._id);
        });

        socket.on('teleconsult-update', (data) => {
            if (data.message) toast.success(data.message, { icon: '🩺' });
            fetchConsultations();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id, fetchConsultations]);

    // Filter consultations by state
    const requestedList = consultations.filter((c) => c.status === 'REQUESTED');
    const acceptedList = consultations.filter((c) => c.status === 'ACCEPTED');
    const scheduledList = consultations.filter((c) => c.status === 'SCHEDULED');
    const activeList = consultations.filter((c) => ['STARTED', 'IN_PROGRESS'].includes(c.status));
    const completedList = consultations.filter((c) => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(c.status));

    // Handle Accept Click -> Open Scheduling Modal
    const handleAcceptClick = (consultation) => {
        setSelectedRequestForSchedule(consultation);
        // Default to preferred date or today
        if (consultation.preferredDate) {
            setScheduleDate(new Date(consultation.preferredDate).toISOString().split('T')[0]);
        } else {
            setScheduleDate(new Date().toISOString().split('T')[0]);
        }
        setScheduleTime(consultation.preferredTime || '10:00 AM');
        setScheduleNotes('');
        setScheduleDuration(30);
    };

    // Handle Schedule Form Submit
    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduleDate || !scheduleTime) {
            toast.error('Date and time are required');
            return;
        }

        setScheduling(true);
        try {
            // First accept if it was REQUESTED
            if (selectedRequestForSchedule.status === 'REQUESTED') {
                await reviewTeleconsultation(selectedRequestForSchedule._id, { action: 'ACCEPT' });
            }

            // Then schedule
            await scheduleTeleconsultation(selectedRequestForSchedule._id, {
                scheduledDate: scheduleDate,
                scheduledTime: scheduleTime,
                scheduledDuration: scheduleDuration,
                scheduledNotes: scheduleNotes
            });

            toast.success('Consultation appointment scheduled and parent notified!');
            setSelectedRequestForSchedule(null);
            fetchConsultations();
            setActiveTab('scheduled');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to schedule consultation');
        } finally {
            setScheduling(false);
        }
    };

    // Handle Reject Submit
    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        setRejecting(true);
        try {
            await reviewTeleconsultation(selectedRequestForReject._id, {
                action: 'REJECT',
                rejectionReason
            });
            toast.success('Consultation request declined');
            setSelectedRequestForReject(null);
            setRejectionReason('');
            fetchConsultations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setRejecting(false);
        }
    };

    // Check if appointment is within start window (15 mins prior to end of slot)
    const isWithinStartWindow = (consultation) => {
        if (!consultation.scheduledDate) return true;
        const scheduledTimeMs = new Date(consultation.scheduledDate).getTime();
        const now = Date.now();
        const earlyLimit = scheduledTimeMs - 15 * 60 * 1000; // 15 mins before
        const lateLimit = scheduledTimeMs + ((consultation.scheduledDuration || 30) + 60) * 60 * 1000;
        return now >= earlyLimit && now <= lateLimit;
    };

    // Doctor Starts Video Call
    const handleStartConsultation = async (consultation) => {
        setStartingId(consultation._id);
        try {
            const res = await startTeleconsultation(consultation._id);
            toast.success('Consultation started! Notification sent to parent.');
            setActiveCallSession({
                consultationId: consultation._id,
                callRoomId: res.callRoomId,
                childName: consultation.profileId?.name || 'Child'
            });
            fetchConsultations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start consultation');
        } finally {
            setStartingId(null);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-indigo-400 text-2xl">medical_services</span>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Pediatric Telehealth Center</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black">Consultation Appointments</h1>
                    <p className="text-slate-300 text-sm mt-1 max-w-xl">
                        Review incoming patient consultation requests, schedule clinical appointment slots, and launch secure one-on-one video sessions.
                    </p>
                </div>

                <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0">
                    <div className="px-4 py-2 text-center border-r border-white/10">
                        <p className="text-[10px] uppercase font-bold text-slate-300">Requests</p>
                        <p className="text-lg font-black">{requestedList.length}</p>
                    </div>
                    <div className="px-4 py-2 text-center border-r border-white/10">
                        <p className="text-[10px] uppercase font-bold text-slate-300">Upcoming</p>
                        <p className="text-lg font-black">{scheduledList.length}</p>
                    </div>
                    <div className="px-4 py-2 text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-400">Live</p>
                        <p className="text-lg font-black text-emerald-300">{activeList.length}</p>
                    </div>
                </div>
            </div>

            {/* LIVE ACTIVE CONSULTATION BANNER (Doctor side) */}
            {activeList.length > 0 && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl animate-pulse">
                            📹
                        </div>
                        <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-emerald-800">
                                Call Active
                            </span>
                            <h3 className="font-black text-base mt-1">
                                Video Consultation with {activeList[0].profileId?.name} is in progress
                            </h3>
                            <p className="text-xs text-emerald-100">
                                Parent: {activeList[0].parentId?.name} · Room: <span className="font-mono">{activeList[0].callRoomId}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            setActiveCallSession({
                                consultationId: activeList[0]._id,
                                callRoomId: activeList[0].callRoomId,
                                childName: activeList[0].profileId?.name || 'Child'
                            })
                        }
                        className="px-6 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">meeting_room</span>
                        Enter Video Room
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                        activeTab === 'requests'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <span>Consultation Requests</span>
                    {requestedList.length > 0 && (
                        <span className="size-5 rounded-full bg-white text-indigo-600 text-[10px] flex items-center justify-center font-bold">
                            {requestedList.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                        activeTab === 'scheduled'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <span>Scheduled Appointments</span>
                    {scheduledList.length > 0 && (
                        <span className="size-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {scheduledList.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                        activeTab === 'active'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <span>Active Sessions</span>
                    {activeList.length > 0 && (
                        <span className="size-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold animate-pulse">
                            {activeList.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                        activeTab === 'completed'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                >
                    <span>Completed</span>
                    <span className="text-[10px] text-slate-400">({completedList.length})</span>
                </button>
            </div>

            {/* TAB CONTENT: REQUESTS */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {requestedList.length === 0 && acceptedList.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <span className="text-4xl">📬</span>
                            <h3 className="font-bold text-slate-800 dark:text-white mt-3">No Pending Requests</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                All patient consultation inquiries have been addressed. New requests submitted by parents will show up here immediately.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...requestedList, ...acceptedList].map((c) => (
                                <div
                                    key={c._id}
                                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                                    👶
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                                                        {c.profileId?.name} ({c.profileId?.age}y, {c.profileId?.gender})
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        Parent: {c.parentId?.name} · {c.parentId?.phone || c.parentId?.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                c.status === 'ACCEPTED'
                                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                            }`}>
                                                {c.status === 'ACCEPTED' ? 'Accepted' : 'Requested'}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">
                                                Reason: <span className="font-normal text-slate-600 dark:text-slate-300">{c.reason}</span>
                                            </p>
                                            {c.description && (
                                                <p className="text-slate-500 italic">"{c.description}"</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                            <span>
                                                Requested on: {new Date(c.createdAt).toLocaleDateString()}
                                            </span>
                                            {c.preferredTime && (
                                                <span className="font-bold text-indigo-500">
                                                    Prefers: {c.preferredTime}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedRequestForReject(c)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                                        >
                                            Decline
                                        </button>

                                        <button
                                            onClick={() => handleAcceptClick(c)}
                                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-base">event</span>
                                            {c.status === 'ACCEPTED' ? 'Set Schedule' : 'Accept & Schedule'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: SCHEDULED APPOINTMENTS */}
            {activeTab === 'scheduled' && (
                <div className="space-y-4">
                    {scheduledList.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <span className="text-4xl">🗓️</span>
                            <h3 className="font-bold text-slate-800 dark:text-white mt-3">No Upcoming Appointments</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Once you accept requests and assign dates/times, appointments will show up here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {scheduledList.map((c) => {
                                const inWindow = isWithinStartWindow(c);
                                return (
                                    <div
                                        key={c._id}
                                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                        Confirmed Slot
                                                    </span>
                                                    <h4 className="font-black text-slate-900 dark:text-white text-base mt-2">
                                                        {c.profileId?.name} ({c.profileId?.age}y)
                                                    </h4>
                                                    <p className="text-xs text-slate-400">Parent: {c.parentId?.name}</p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white">
                                                        {new Date(c.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-indigo-600 font-extrabold">{c.scheduledTime}</p>
                                                    <p className="text-[10px] text-slate-400">{c.scheduledDuration || 30} mins</p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                                                <p className="font-bold text-slate-800 dark:text-slate-200">Reason:</p>
                                                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{c.reason}</p>
                                                {c.scheduledNotes && (
                                                    <p className="text-indigo-500 italic mt-1.5">Note: {c.scheduledNotes}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Doctor Controlled Start Button */}
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">
                                                {inWindow ? (
                                                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                                                        <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                                                        Ready to Start
                                                    </span>
                                                ) : (
                                                    'Window opens 15m prior'
                                                )}
                                            </span>

                                            <button
                                                onClick={() => handleStartConsultation(c)}
                                                disabled={startingId === c._id}
                                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-base">video_call</span>
                                                {startingId === c._id ? 'Starting...' : 'Start Video Consultation'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: ACTIVE */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    {activeList.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <span className="text-4xl">📹</span>
                            <h3 className="font-bold text-slate-800 dark:text-white mt-3">No Active Consultations</h3>
                            <p className="text-xs text-slate-400 mt-1">Start a scheduled appointment above to open an active session.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeList.map((c) => (
                                <div
                                    key={c._id}
                                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 animate-pulse">
                                                Session In Progress
                                            </span>
                                            <h4 className="font-black text-slate-900 dark:text-white text-base mt-2">
                                                {c.profileId?.name}
                                            </h4>
                                            <p className="text-xs text-slate-400">Parent: {c.parentId?.name}</p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setActiveCallSession({
                                                    consultationId: c._id,
                                                    callRoomId: c.callRoomId,
                                                    childName: c.profileId?.name || 'Child'
                                                })
                                            }
                                            className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-base">meeting_room</span>
                                            Join Call
                                        </button>
                                    </div>

                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs">
                                        <p className="font-mono text-slate-500">Room: {c.callRoomId}</p>
                                        <p className="text-slate-600 mt-1">Reason: {c.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: COMPLETED */}
            {activeTab === 'completed' && (
                <div className="space-y-4">
                    {completedList.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <span className="text-4xl">📋</span>
                            <h3 className="font-bold text-slate-800 dark:text-white mt-3">No Past Consultations</h3>
                            <p className="text-xs text-slate-400 mt-1">Completed teleconsultations and doctor notes will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {completedList.map((c) => (
                                <div
                                    key={c._id}
                                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                c.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                                {c.status}
                                            </span>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                                {c.profileId?.name} · Parent: {c.parentId?.name}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500">Inquiry: {c.reason}</p>
                                        {c.doctorNotes && (
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                                Clinical Notes: "{c.doctorNotes}"
                                            </p>
                                        )}
                                        {c.rejectionReason && (
                                            <p className="text-xs text-rose-500 italic">
                                                Decline Reason: {c.rejectionReason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0 text-xs text-slate-400">
                                        <p>{c.endedAt ? new Date(c.endedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}</p>
                                        {c.actualDurationMinutes > 0 && (
                                            <p className="text-[11px] text-slate-500">{c.actualDurationMinutes} mins duration</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SCHEDULING MODAL */}
            <AnimatePresence>
                {selectedRequestForSchedule && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6"
                        >
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white">
                                        Schedule Consultation
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Patient: {selectedRequestForSchedule.profileId?.name} · Reason: {selectedRequestForSchedule.reason}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedRequestForSchedule(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleScheduleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Appointment Date
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Start Time
                                        </label>
                                        <select
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                                            required
                                        >
                                            <option value="09:00 AM">09:00 AM</option>
                                            <option value="09:30 AM">09:30 AM</option>
                                            <option value="10:00 AM">10:00 AM</option>
                                            <option value="10:30 AM">10:30 AM</option>
                                            <option value="11:00 AM">11:00 AM</option>
                                            <option value="11:30 AM">11:30 AM</option>
                                            <option value="02:00 PM">02:00 PM</option>
                                            <option value="02:30 PM">02:30 PM</option>
                                            <option value="03:00 PM">03:00 PM</option>
                                            <option value="04:00 PM">04:00 PM</option>
                                            <option value="05:00 PM">05:00 PM</option>
                                            <option value="06:00 PM">06:00 PM</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Duration (Minutes)
                                        </label>
                                        <select
                                            value={scheduleDuration}
                                            onChange={(e) => setScheduleDuration(Number(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value={15}>15 Minutes</option>
                                            <option value={30}>30 Minutes</option>
                                            <option value={45}>45 Minutes</option>
                                            <option value={60}>60 Minutes</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Notes for Parent (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={scheduleNotes}
                                        onChange={(e) => setScheduleNotes(e.target.value)}
                                        placeholder="e.g. Please have recent meal logs and growth records ready."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequestForSchedule(null)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={scheduling}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
                                    >
                                        {scheduling ? 'Saving...' : 'Confirm Appointment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* REJECT MODAL */}
            <AnimatePresence>
                {selectedRequestForReject && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
                        >
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">
                                Decline Consultation Request
                            </h3>
                            <p className="text-xs text-slate-500">
                                Please provide a reason to inform the parent why this consultation cannot be accepted.
                            </p>

                            <textarea
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Schedule currently full / please book emergency clinic visit"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequestForReject(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={rejecting}
                                    onClick={handleRejectSubmit}
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition disabled:opacity-50"
                                >
                                    {rejecting ? 'Declining...' : 'Confirm Decline'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LIVE WebRTC Video Call Stage (Doctor Host) */}
            <AnimatePresence>
                {activeCallSession && (
                    <WebRTCVideoCall
                        consultationId={activeCallSession.consultationId}
                        callRoomId={activeCallSession.callRoomId}
                        userRole="doctor"
                        userName={user?.name ? 'Dr. ' + user.name : 'Doctor'}
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
