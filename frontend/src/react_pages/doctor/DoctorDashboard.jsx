"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getMyPatients, getEscalations, resolveEscalation } from '../../api/doctor.api';
import { getDoctorTeleconsultations } from '../../api/consultation.api';

const avatarMap = { lion: '🦁', bear: '🐻', rabbit: '🐰', fox: '🦊', cat: '🐱', dog: '🐶' };

const DoctorDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Escalation State
    const [escalations, setEscalations] = useState([]);
    const [alertLoading, setAlertLoading] = useState(true);

    // Teleconsultations State
    const [consultations, setConsultations] = useState([]);

    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    const fetchPatients = async () => {
        try {
            const res = await getMyPatients();
            setPatients(res.data || res || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEscalations = async () => {
        try {
            const data = await getEscalations();
            setEscalations(data || []);
        } catch (error) {
            console.error("Failed to fetch escalations:", error);
        } finally {
            setAlertLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await resolveEscalation(id);
            setEscalations(prev => prev.filter(e => e._id !== id));
        } catch (error) {
            console.error("Failed to resolve:", error);
        }
    };

    const fetchConsultations = async () => {
        try {
            const data = await getDoctorTeleconsultations();
            setConsultations(data || []);
        } catch (e) {
            console.warn("Could not fetch teleconsultations:", e);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchEscalations();
        fetchConsultations();

        const interval = setInterval(() => {
            fetchEscalations();
            fetchConsultations();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // ── Split patients by access type ──────────────────────────────────────────
    const clinicalPatients = patients.filter(p => p.accessType === 'clinical' || !p.accessType);
    const familyPatients   = patients.filter(p => p.accessType === 'direct_invite');

    const PatientRow = ({ profile }) => (
        <tr
            key={profile._id}
            className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
            onClick={() => navigate(`/doctor/patients/${profile._id}`)}
        >
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                        {avatarMap[profile.avatar] || '👦'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-lg">{profile.name}</p>
                            {profile.accessType === 'direct_invite' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-black uppercase rounded-full tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                    Family Access
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">ID: {profile._id.slice(-6)}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="text-sm font-medium text-gray-700">
                    {profile.age} Years • {profile.gender}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {profile.height}cm • {profile.weight}kg
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="text-sm font-semibold text-slate-600">
                    {profile.lastCheckupDate
                        ? new Date(profile.lastCheckupDate).toLocaleDateString()
                        : 'No past checkups'
                    }
                </div>
            </td>
            <td className="px-8 py-5">
                {profile.accessType === 'direct_invite' ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${profile.accessLevel === 'Full Access' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${profile.accessLevel === 'Full Access' ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        {profile.accessLevel || 'Restricted View'}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {profile.consultationStatus || 'Active'}
                    </span>
                )}
            </td>
            <td className="px-8 py-5 text-right">
                <button className="text-primary font-bold hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm">
                    Open Checkup →
                </button>
            </td>
        </tr>
    );

    const PatientTable = ({ list, label }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <h2 className="text-base font-black text-gray-900">{label}</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{list.length}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Demographics</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Checkup</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status / Access</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {list.map((profile) => <PatientRow key={profile._id} profile={profile} />)}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Cases & Patients</h1>
                    <p className="text-slate-500 font-medium font-sans">Clinical assignments and family-invited profiles</p>
                </div>

                <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2.5 transition active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">video_camera_front</span>
                    <span>Video Consultations</span>
                    {consultations.filter(c => c.status === 'REQUESTED').length > 0 && (
                        <span className="size-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                            {consultations.filter(c => c.status === 'REQUESTED').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Active Teleconsultation Banner */}
            {consultations.some(c => ['STARTED', 'IN_PROGRESS'].includes(c.status)) && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="size-3 rounded-full bg-white animate-ping"></span>
                        <p className="font-black text-sm">A video consultation session is currently active.</p>
                    </div>
                    <button
                        onClick={() => navigate('/doctor/appointments')}
                        className="px-4 py-2 bg-white text-emerald-800 font-bold rounded-xl text-xs hover:bg-emerald-50 transition"
                    >
                        Enter Consultation
                    </button>
                </div>
            )}

            {/* Escalation Alerts Panel */}
            {escalations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm ring-4 ring-red-50"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl animate-pulse">
                            🚨
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Medical Risk Alerts</h2>
                            <p className="text-red-500 font-bold text-sm">{escalations.length} unresolved high-risk interactions detected</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {escalations.map((alert) => (
                            <div key={alert._id} className="bg-red-50/50 border border-red-100 p-5 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:shadow-md transition duration-200">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-gray-800 text-lg">Child ID: {alert.child_id}</span>
                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm shadow-red-200">
                                            {alert.risk_level} Risk
                                        </span>
                                    </div>
                                    <p className="text-gray-900 font-medium mb-1">
                                        <span className="text-gray-500">Analysis:</span> {alert.ai_message}
                                    </p>
                                    {alert.detected_keywords && alert.detected_keywords.length > 0 && (
                                        <p className="text-red-600 text-sm font-semibold bg-red-100/50 inline-block px-2 py-1 rounded-md">
                                            Keywords: {alert.detected_keywords.join(", ")}
                                        </p>
                                    )}
                                    <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
                                        <span>⏰</span> {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleResolve(alert._id)}
                                        className="w-full md:w-auto px-5 py-2.5 bg-white text-gray-700 font-bold border-2 border-gray-100 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <span>✅</span> Resolve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {loading ? (
                <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></div>
            ) : patients.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="text-6xl mb-6 grayscale opacity-50">🩺</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No active cases</h3>
                    <p className="text-slate-500 max-w-md mx-auto">You do not have any active consultation cases assigned to you at this time.</p>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    {/* ── Clinical patients (assigned via dietitian workflow) ── */}
                    {clinicalPatients.length > 0 && (
                        <PatientTable list={clinicalPatients} label="🩺 Clinical Cases (Assigned)" />
                    )}

                    {/* ── Family / Outside doctor patients (invited by parent) ── */}
                    {familyPatients.length > 0 && (
                        <>
                            {/* Info banner */}
                            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                                <span className="text-2xl">👨‍👩‍👧</span>
                                <div>
                                    <p className="font-bold text-violet-800 text-sm">Family Access Patients</p>
                                    <p className="text-violet-600 text-xs mt-0.5">
                                        These children's profiles were shared with you directly by a parent.
                                        Access level is controlled by the parent and may be restricted to read-only view.
                                    </p>
                                </div>
                            </div>
                            <PatientTable list={familyPatients} label="👨‍👩‍👧 Family-Invited Profiles" />
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default DoctorDashboard;
