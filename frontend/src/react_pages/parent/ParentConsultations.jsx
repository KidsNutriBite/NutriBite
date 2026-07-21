"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import VideoCall from '../../components/video/VideoCall';

const VIDEO_CALL_STATUSES = ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued'];

const ParentConsultations = () => {
    const { selectedProfileId, selectedProfile } = useProfile();
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [closingId, setClosingId] = useState(null);
    const [activeCall, setActiveCall] = useState(null); // { consultationId }

    const fetchHistory = async () => {
        if (!selectedProfileId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/consultations/parent/${selectedProfileId}`);
            setHistory(data.data || []);
        } catch (error) {
            console.error('Failed to fetch consultation history:', error);
            toast.error('Failed to load consultation history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedProfileId]);

    const handleConsultDoctor = async () => {
        if (!selectedProfileId) return;
        setSubmitting(true);
        try {
            await api.post('/consultations', { profileId: selectedProfileId });
            toast.success('Consultation request created. Dietitian is being assigned.');
            fetchHistory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request consultation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseConsultation = async (requestId) => {
        if (!window.confirm('Are you sure you want to close this consultation? This action cannot be undone.')) return;
        setClosingId(requestId);
        try {
            await api.post(`/consultations/${requestId}/close`);
            toast.success('Consultation closed successfully.');
            fetchHistory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close consultation');
        } finally {
            setClosingId(null);
        }
    };

    const handleJoinVideoCall = (consultationId) => {
        setActiveCall({ consultationId });
    };

    const getStatusStep = (status) => {
        const steps = ['Pending', 'AssignedToDietitian', 'UnderDietitianReview', 'AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'];
        return steps.indexOf(status);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Pending': return 'In Waiting Queue';
            case 'AssignedToDietitian': return 'Dietitian Assigned';
            case 'UnderDietitianReview': return 'Dietitian Reviewing';
            case 'AssignedToDoctor': return 'Escalated to Doctor';
            case 'UnderDoctorReview': return 'Doctor Reviewing';
            case 'PrescriptionIssued': return 'Prescription Issued';
            case 'Closed': return 'Consultation Closed';
            default: return status;
        }
    };

    const hasActiveRequest = history.some(h => h.status !== 'Closed');

    return (
        <div className="space-y-8">
            {/* Video Call Modal */}
            <AnimatePresence>
                {activeCall && (
                    <VideoCall
                        consultationId={activeCall.consultationId}
                        userRole="parent"
                        userName={user?.name || 'Parent'}
                        onClose={async (transcript, durationMinutes) => {
                            setActiveCall(null);
                            if (transcript && transcript.length > 0) {
                                try {
                                    await api.post(`/consultations/${activeCall.consultationId}/video-summary`, {
                                        transcript,
                                        durationMinutes,
                                    });
                                } catch (err) {
                                    console.error('Failed to save parent transcript:', err);
                                }
                            }
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Doctor Consultations</h1>
                    <p className="text-slate-500 font-medium">
                        Request and track medical consultations for <strong className="text-slate-800 dark:text-white">{selectedProfile?.name || 'your child'}</strong>
                    </p>
                </div>
                {selectedProfileId && (
                    <button
                        onClick={handleConsultDoctor}
                        disabled={submitting || hasActiveRequest}
                        className="w-full md:w-auto px-6 py-3 bg-primary text-white hover:bg-blue-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 font-bold rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transition flex items-center justify-center gap-2 active:scale-95 disabled:pointer-events-none"
                    >
                        <span className="material-symbols-outlined text-lg">medical_services</span>
                        {hasActiveRequest ? 'Consultation In Progress' : 'Consult Doctor'}
                    </button>
                )}
            </div>

            {!selectedProfileId ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 font-medium">Please select a child profile to manage consultations.</p>
                </div>
            ) : loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : history.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="text-6xl mb-6">🩺</div>
                    <h3 className="text-xl font-bold text-slateate-800 dark:text-white mb-2">No Consultation History</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create a consultation request to get a customized nutrition plan and prescription from a registered pediatrician.</p>
                    <button
                        onClick={handleConsultDoctor}
                        disabled={submitting}
                        className="px-8 py-3 bg-white dark:bg-slate-950 border-2 border-primary text-primary font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-primary/10 transition"
                    >
                        Request Consultation
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    {history.map((c) => {
                        const currentStep = getStatusStep(c.status);
                        const canVideoCall = VIDEO_CALL_STATUSES.includes(c.status) && c.doctorId;
                        const canClose = c.status === 'PrescriptionIssued';
                        return (
                            <motion.div
                                key={c._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6"
                            >
                                {/* Case Metadata & Status */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Consultation Request</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'Closed' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' : 'bg-blue-50 dark:bg-blue-950/20 text-primary'}`}>
                                                {getStatusLabel(c.status)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Requested: {new Date(c.createdAt).toLocaleString()} • ID: {c._id.slice(-6)}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        {/* Video Call Button */}
                                        {canVideoCall && (
                                            <button
                                                onClick={() => handleJoinVideoCall(c._id)}
                                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition flex items-center gap-1.5 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">video_call</span>
                                                Join Video Call
                                            </button>
                                        )}

                                        {/* View Prescription Button */}
                                        {c.prescriptionId && (
                                            <button
                                                onClick={() => {
                                                    toast(
                                                        (t) => (
                                                            <div className="space-y-2 text-slate-800 dark:text-slate-100">
                                                                <h4 className="font-bold border-b pb-1">Prescription Details</h4>
                                                                <p className="text-xs font-semibold">Title: {c.prescriptionId.title}</p>
                                                                <p className="text-xs">Diagnosis: {c.prescriptionId.diagnosis || 'General Advice'}</p>
                                                                <p className="text-xs">Instructions: {c.prescriptionId.instructions}</p>
                                                                <p className="text-xs italic text-slate-400">Doctor Notes: {c.prescriptionId.notes}</p>
                                                                <button
                                                                    onClick={() => toast.dismiss(t.id)}
                                                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg w-full mt-2"
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                        ),
                                                        { duration: 10000, position: 'top-center' }
                                                    );
                                                }}
                                                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-green-100 dark:shadow-none transition flex items-center gap-1.5 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">prescriptions</span>
                                                View Prescription
                                            </button>
                                        )}

                                        {/* Close Consultation Button */}
                                        {canClose && (
                                            <button
                                                onClick={() => handleCloseConsultation(c._id)}
                                                disabled={closingId === c._id}
                                                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md dark:shadow-none transition flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
                                            >
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                {closingId === c._id ? 'Closing...' : 'Close Consultation'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Allocation Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-blue-100 text-primary flex items-center justify-center text-lg">👩‍⚕️</div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Dietitian</p>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{c.dietitianId?.name || 'Pending assignment...'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg">🩺</div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Doctor</p>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                {c.doctorId ? `Dr. ${c.doctorId.name} (${c.doctorId.doctorProfile?.specialization || 'Pediatrician'})` : 'Waiting for dietitian referral...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Call Info Banner — shown when doctor is assigned */}
                                {canVideoCall && (
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-xl">video_camera_front</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Video Consultation Available</p>
                                            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
                                                You can join a secure video call with Dr. {c.doctorId?.name}. Click "Join Video Call" above to connect.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleJoinVideoCall(c._id)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition active:scale-95 flex-shrink-0 flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">video_call</span>
                                            Join Now
                                        </button>
                                    </div>
                                )}

                                {/* Status Progress Timeline Visualizer */}
                                <div className="py-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Consultation Progress</p>
                                    <div className="relative flex justify-between items-center w-full">
                                        {/* Background connection bar */}
                                        <div className="absolute left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 top-1/2 -translate-y-1/2 z-0"></div>
                                        {/* Filled connection bar */}
                                        <div
                                            className="absolute left-0 h-1 bg-primary top-1/2 -translate-y-1/2 z-0 transition-all duration-500"
                                            style={{ width: `${(Math.max(0, currentStep) / 6) * 100}%` }}
                                        ></div>

                                        {['Initiated', 'Dietitian Assigned', 'Dietitian Review', 'Doctor Assigned', 'Doctor Review', 'Prescribed', 'Closed'].map((label, stepIdx) => {
                                            const isActive = stepIdx <= currentStep;
                                            return (
                                                <div key={stepIdx} className="relative z-10 flex flex-col items-center">
                                                    <div className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition ${isActive ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                                                        {isActive ? '✓' : stepIdx + 1}
                                                    </div>
                                                    <span className={`text-[10px] font-bold mt-2 text-center max-w-[80px] hidden sm:block ${isActive ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notes if any */}
                                {(c.doctorNotes || c.prescriptionId?.instructions) && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-2 border-l-4 border-primary">
                                        <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">Medical Notes & Advice</h4>
                                        {c.prescriptionId?.diagnosis && (
                                            <p className="text-xs text-slate-700 dark:text-slate-300"><strong>Diagnosis:</strong> {c.prescriptionId.diagnosis}</p>
                                        )}
                                        {c.prescriptionId?.instructions && (
                                            <p className="text-xs text-slate-700 dark:text-slate-300"><strong>Dietary Advice:</strong> {c.prescriptionId.instructions}</p>
                                        )}
                                        {c.doctorNotes && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">" {c.doctorNotes} "</p>
                                        )}
                                    </div>
                                )}

                                {/* Video Call Logs */}
                                {c.videoCallLogs && c.videoCallLogs.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-indigo-500 text-lg">video_camera_front</span>
                                            <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                                Video Consultations ({c.videoCallLogs.length} {c.videoCallLogs.length === 1 ? 'Session' : 'Sessions'})
                                            </h4>
                                        </div>
                                        {c.videoCallLogs.map((log, logIdx) => (
                                            <div key={log._id || logIdx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                                                {/* Call Header */}
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                                                            {logIdx + 1}
                                                        </span>
                                                        <span className="text-xs font-bold text-indigo-800">Session {logIdx + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                        {log.durationMinutes > 0 && <span>⏱ {log.durationMinutes} min</span>}
                                                        <span>{new Date(log.callDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">{log.summary ? 'AI Generated' : 'Transcript Log'}</span>
                                                    </div>
                                                </div>

                                                {!log.summary && log.transcript && (
                                                    <div className="mt-1">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    toast.loading('Generating AI summary...', { id: 'ai-summary' });
                                                                    const res = await api.post(`/consultations/${c._id}/video-summary/${log._id}/generate-ai`);
                                                                    setHistory(prev => prev.map(req => {
                                                                        if (req._id === c._id) {
                                                                            return { ...req, videoCallLogs: req.videoCallLogs.map(l => l._id === log._id ? res.data.data.log : l) };
                                                                        }
                                                                        return req;
                                                                    }));
                                                                    toast.success('AI summary generated!', { id: 'ai-summary' });
                                                                } catch (err) {
                                                                    toast.error('Failed to generate AI summary.', { id: 'ai-summary' });
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-bold rounded-lg transition"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                                            Generate AI Summary
                                                        </button>
                                                    </div>
                                                )}

                                                {log.summary && (
                                                    <div className="mb-2">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">smart_toy</span> AI Summary</p>
                                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{log.summary}</p>
                                                    </div>
                                                )}
                                                {log.transcript && (
                                                    <div className="p-3 bg-slate-50 rounded-lg">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Raw Transcript</p>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed italic">{log.transcript}</p>
                                                    </div>
                                                )}
                                            </div>

                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ParentConsultations;
