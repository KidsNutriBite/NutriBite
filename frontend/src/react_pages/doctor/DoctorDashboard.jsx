"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getMyPatients, getEscalations, resolveEscalation } from '../../api/doctor.api';

const DoctorDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Escalation State
    const [escalations, setEscalations] = useState([]);
    const [alertLoading, setAlertLoading] = useState(true);

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
            // Optimistic update
            setEscalations(prev => prev.filter(e => e._id !== id));
        } catch (error) {
            console.error("Failed to resolve:", error);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchEscalations();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchEscalations, 30000);
        return () => clearInterval(interval);
    }, []);



    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assigned Cases</h1>
                    <p className="text-slate-500 font-medium font-sans">Manage cases assigned to your review</p>
                </div>
            </div>

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
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Demographics</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Checkup</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {patients.map((profile) => (
                                    <tr
                                        key={profile._id}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/doctor/patients/${profile._id}`)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                                    {profile.avatar === 'lion' && '🦁'}
                                                    {profile.avatar === 'bear' && '🐻'}
                                                    {profile.avatar === 'rabbit' && '🐰'}
                                                    {profile.avatar === 'fox' && '🦊'}
                                                    {profile.avatar === 'cat' && '🐱'}
                                                    {profile.avatar === 'dog' && '🐶'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg">{profile.name}</p>
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
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                Healthy
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="text-primary font-bold hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm">
                                                Open Checkup →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

        </div>
    );
};

export default DoctorDashboard;
