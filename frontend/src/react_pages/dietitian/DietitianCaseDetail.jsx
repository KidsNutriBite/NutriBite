"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const DietitianCaseDetail = () => {
    const { id: requestId } = useParams();
    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dietitianNotes, setDietitianNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    // Doctor Assignment States
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [assignmentMode, setAssignmentMode] = useState('auto'); // 'auto' or 'manual'
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'reports', 'history'

    const fetchConsultationDetails = async () => {
        try {
            const { data } = await api.get(`/consultations/${requestId}`);
            const reqData = data.data;
            setRequest(reqData);
            setDietitianNotes(reqData.dietitianNotes || '');

            // Automatically update status to 'UnderDietitianReview' if it was just 'AssignedToDietitian'
            if (reqData.status === 'AssignedToDietitian') {
                await api.patch(`/consultations/${requestId}/status`, { status: 'UnderDietitianReview' });
                reqData.status = 'UnderDietitianReview';
                setRequest({ ...reqData });
            }
        } catch (error) {
            console.error('Failed to load consultation details:', error);
            toast.error('Failed to load case details');
            navigate('/dietitian/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const { data } = await api.get(`/consultations/dietitian/available-doctors/${requestId}`);
            setAvailableDoctors(data.data || []);
            if (data.data && data.data.length > 0) {
                // Pre-select the recommended doctor (first in sorted list) for manual dropdown default
                setSelectedDoctorId(data.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to load doctors pool:', error);
            toast.error('Could not load doctor pool');
        } finally {
            setLoadingDoctors(false);
        }
    };

    useEffect(() => {
        fetchConsultationDetails();
        fetchAvailableDoctors();
    }, [requestId]);

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await api.post(`/consultations/${requestId}/assign-doctor`, {
                doctorId: request.doctorId ? request.doctorId._id : 'auto', // Keep existing or auto
                dietitianNotes
            });
            toast.success('Internal notes saved');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save notes');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleDoctorAssignment = async (e) => {
        e.preventDefault();
        setAssigning(true);

        const targetDoctorId = assignmentMode === 'auto' ? 'auto' : selectedDoctorId;

        try {
            const endpoint = request.doctorId ? `/consultations/${requestId}/reassign-doctor` : `/consultations/${requestId}/assign-doctor`;
            const payload = {
                dietitianNotes
            };

            if (request.doctorId) {
                payload.doctorId = targetDoctorId;
                payload.reason = assignmentMode === 'auto' 
                    ? 'Reassigned automatically via system load-balancing'
                    : 'Reassigned manually by Dietitian';
            } else {
                payload.doctorId = targetDoctorId;
            }

            const { data } = await api.post(endpoint, payload);
            toast.success(request.doctorId ? 'Doctor successfully reassigned' : 'Doctor successfully assigned');
            navigate('/dietitian/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign doctor');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    const child = request?.profileId;
    const recommendedDoctor = availableDoctors && availableDoctors.length > 0 ? availableDoctors[0] : null;

    return (
        <div className="space-y-8">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/dietitian/dashboard')}
                    className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-800 transition"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">Review Case: {child?.name}</h1>
                    <p className="text-xs text-slate-500">Case ID: {request._id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Child Information Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Child Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Health Records & Reports ({child?.medicalReports?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Timeline & Audits
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                {/* Profile Summary */}
                                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-3xl">
                                        {child?.avatar === 'lion' && '🦁'}
                                        {child?.avatar === 'bear' && '🐻'}
                                        {child?.avatar === 'rabbit' && '🐰'}
                                        {child?.avatar === 'fox' && '🦊'}
                                        {child?.avatar === 'cat' && '🐱'}
                                        {child?.avatar === 'dog' && '🐶'}
                                        {!child?.avatar && '👶'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{child?.name}</h2>
                                        <p className="text-sm font-semibold text-slate-500">
                                            {child?.age} Years ({new Date(child?.dob).toLocaleDateString()}) • {child?.gender}
                                        </p>
                                    </div>
                                </div>

                                {/* Demographics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Height</p>
                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1">{child?.height} cm</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Weight</p>
                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1">{child?.weight} kg</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Blood Group</p>
                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1">{child?.bloodGroup || 'A+'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Activity Level</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1.5">{child?.sportsActivityLevel || 'Moderately Active'}</p>
                                    </div>
                                </div>

                                {/* Goal section */}
                                <div className="space-y-3">
                                    <h3 className="font-extrabold text-slate-800 dark:text-white">Nutrition Goals</h3>
                                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                        <p className="text-xs font-bold text-primary uppercase">Primary Goal</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{child?.goals?.primary}</p>
                                    </div>
                                    {child?.goals?.secondary && child.goals.secondary.length > 0 && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Secondary Concerns</p>
                                            <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 mt-1">
                                                {child.goals.secondary.map((g, idx) => <li key={idx}>{g}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Dietary Preferences */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Favorite Foods</h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{child?.preferences?.favoriteFoods || 'None specified'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Disliked Foods</h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{child?.preferences?.dislikedFoods || 'None specified'}</p>
                                    </div>
                                </div>

                                {/* Health Conditions */}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Medical/Health Conditions</h4>
                                    {child?.healthConditions && child.healthConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {child.healthConditions.map((cond, idx) => (
                                                <span key={idx} className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-bold text-xs px-3 py-1 rounded-full">{cond}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No declared medical conditions</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-slate-800 dark:text-white mb-2">Uploaded Medical Reports & Records</h3>
                                {child?.medicalReports && child.medicalReports.length > 0 ? (
                                    <div className="grid gap-4">
                                        {child.medicalReports.map((report) => (
                                            <div key={report._id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{report.reportName}</h4>
                                                        <p className="text-xs text-slate-400">Date: {new Date(report.reportDate).toLocaleDateString()} • Issued By: {report.doctorName} ({report.hospitalName})</p>
                                                        {report.comments && <p className="text-xs text-slate-500 italic mt-1">Parent Comment: {report.comments}</p>}
                                                    </div>
                                                </div>
                                                <a
                                                    href={report.attachment.startsWith('http') ? report.attachment : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${report.attachment}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary font-bold text-xs rounded-lg shadow-sm transition"
                                                >
                                                    View Report
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_open</span>
                                        <p className="text-sm">No health reports uploaded for this child profile.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <h3 className="font-extrabold text-slate-800 dark:text-white">Audit & Reassignment History</h3>

                                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-4 space-y-8">
                                    {/* Created node */}
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-0 bg-blue-500 text-white rounded-full p-0.5 flex items-center justify-center"><span className="material-symbols-outlined text-xs">add</span></span>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Consultation Initiated</h4>
                                            <p className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Transfers */}
                                    {request.transferHistory && request.transferHistory.map((t, idx) => (
                                        <div key={idx} className="relative">
                                            <span className="absolute -left-[31px] top-0 bg-amber-500 text-white rounded-full p-0.5 flex items-center justify-center"><span className="material-symbols-outlined text-xs">move_item</span></span>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Transferred to another Dietitian</h4>
                                                <p className="text-xs text-slate-400">{new Date(t.transferredAt).toLocaleString()}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-1 inline-block">Reason: {t.reason}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Doctor Reassignments */}
                                    {request.doctorReassignmentHistory && request.doctorReassignmentHistory.map((r, idx) => (
                                        <div key={idx} className="relative">
                                            <span className="absolute -left-[31px] top-0 bg-purple-500 text-white rounded-full p-0.5 flex items-center justify-center"><span className="material-symbols-outlined text-xs">sync</span></span>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Doctor Reassigned</h4>
                                                <p className="text-xs text-slate-400">{new Date(r.reassignedAt).toLocaleString()}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-1 inline-block">Reason: {r.reason}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Prescription Node */}
                                    {request.prescriptionId && (
                                        <div className="relative">
                                            <span className="absolute -left-[31px] top-0 bg-green-500 text-white rounded-full p-0.5 flex items-center justify-center"><span className="material-symbols-outlined text-xs">check</span></span>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Prescription Issued</h4>
                                                <p className="text-xs text-slate-400">{new Date(request.prescriptionId.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Dietitian Internal Notes & Doctor Assignment */}
                <div className="space-y-6">
                    {/* Internal Notes Section */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-md">Internal Dietitian Notes</h3>
                        <textarea
                            rows="6"
                            value={dietitianNotes}
                            onChange={(e) => setDietitianNotes(e.target.value)}
                            placeholder="Write your clinical notes regarding the child profile, reports review, dietary changes suggested, etc."
                            className="w-full border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-xs text-slate-800 dark:text-slate-200"
                        ></textarea>
                        <button
                            type="button"
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-primary font-bold text-xs rounded-xl transition"
                        >
                            {savingNotes ? 'Saving...' : 'Save Draft Notes'}
                        </button>
                    </div>

                    {/* Doctor Assignment Screen */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-md">Escalate to Doctor</h3>
                            <p className="text-xs text-slate-400 mt-1">Assign this case to a doctor from your pool</p>
                        </div>

                        {request.doctorId ? (
                            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-xl space-y-2">
                                <p className="text-xs text-purple-700 font-bold uppercase tracking-wider">Assigned Doctor</p>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${request.doctorId.profileImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}')` }}></div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">Dr. {request.doctorId.name}</p>
                                        <p className="text-xs text-slate-400">{request.doctorId.doctorProfile?.specialization || 'Pediatrician'}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 italic pt-1 border-t border-purple-100/50">Status: {request.status === 'PrescriptionIssued' ? 'Completed (Prescribed)' : 'Pending Doctor Review'}</p>
                            </div>
                        ) : null}

                        {request.status !== 'PrescriptionIssued' && request.status !== 'Closed' && (
                            <form onSubmit={handleDoctorAssignment} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {/* Auto / Manual Selection toggle */}
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setAssignmentMode('auto')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${assignmentMode === 'auto' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Auto Assign (Default)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAssignmentMode('manual')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${assignmentMode === 'manual' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Manual Override
                                    </button>
                                </div>

                                {assignmentMode === 'auto' ? (
                                    recommendedDoctor ? (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">Recommended Doctor</span>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${recommendedDoctor.profileImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}')` }}></div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">Dr. {recommendedDoctor.name}</p>
                                                    <p className="text-xs text-slate-400">{recommendedDoctor.doctorProfile?.specialization || 'Pediatrician'}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                                <span>Active Case load:</span>
                                                <span className="text-slate-700 dark:text-slate-200">{recommendedDoctor.activeCases} active cases</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-amber-500 font-bold p-3 bg-amber-50 rounded-xl">
                                            ⚠️ No doctors are currently Available in your pool.
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Available Doctor</label>
                                        {loadingDoctors ? (
                                            <div className="text-center py-2 text-xs text-slate-400">Loading Doctor pool...</div>
                                        ) : availableDoctors && availableDoctors.length > 0 ? (
                                            <select
                                                value={selectedDoctorId}
                                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                                className="w-full border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                                            >
                                                {availableDoctors.map(doc => (
                                                    <option key={doc._id} value={doc._id}>
                                                        Dr. {doc.name} - {doc.doctorProfile?.specialization || 'Pediatrician'} ({doc.activeCases} Active Cases)
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="text-xs text-amber-500 font-bold p-3 bg-amber-50 rounded-xl">
                                                ⚠️ No doctors in your pool are online.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={assigning || (assignmentMode === 'auto' && !recommendedDoctor) || (assignmentMode === 'manual' && !selectedDoctorId)}
                                    className="w-full py-3 bg-primary text-white hover:bg-blue-600 font-bold text-xs rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                                    {request.doctorId ? 'Confirm Reassignment' : 'Assign to Doctor'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DietitianCaseDetail;
