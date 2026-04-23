import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPendingRequests, approveRequest, rejectRequest, inviteDoctor, getAccessList, revokeAccess, getDoctors } from '../../api/access.api';
import { getMyProfiles } from '../../api/profile.api';
import toast from 'react-hot-toast';

const DoctorAccess = () => {
    // State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeAccess, setActiveAccess] = useState([]);
    const [children, setChildren] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Invite Form State
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedChild, setSelectedChild] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [consultationMessage, setConsultationMessage] = useState('');
    const [expandedMessages, setExpandedMessages] = useState([]); // Track expanded reason blocks

    // Initial Fetch
    const fetchData = async () => {
        try {
            setLoading(true);
            const [pendingRes, activeRes, childrenRes, doctorsRes] = await Promise.all([
                getPendingRequests(),
                getAccessList(),
                getMyProfiles(),
                getDoctors()
            ]);
            setPendingRequests(pendingRes.data || pendingRes || []);
            setActiveAccess(activeRes.data || activeRes || []);
            setChildren(childrenRes.data || childrenRes || []);
            setDoctors(doctorsRes.data || doctorsRes || []);

            // Set default selected child if available
            if ((childrenRes.data || childrenRes || []).length > 0) {
                setSelectedChild((childrenRes.data || childrenRes)[0]._id);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load access settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered Doctors
    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc =>
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.doctorProfile?.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.doctorProfile?.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [doctors, searchQuery]);

    // Handlers
    const handleInvite = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedChild) return;

        try {
            setInviteLoading(true);
            await inviteDoctor(selectedDoctor.email, selectedChild, consultationMessage);
            toast.success('Consultation invitation sent!');
            setSelectedDoctor(null);
            setConsultationMessage('');
            fetchData(); // Refresh lists
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleApprove = async (requestId, profileId) => {
        if (!profileId) return toast.error('Please select a child profile');
        try {
            const loadingToast = toast.loading('Approving...');
            await approveRequest(requestId, profileId);
            toast.dismiss(loadingToast);
            toast.success('Access granted');
            fetchData();
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        try {
            await rejectRequest(requestId);
            toast.success('Request rejected');
            fetchData();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const handleRevoke = async (requestId) => {
        if (!window.confirm('Are you sure you want to revoke access? The doctor will no longer see this child\'s data.')) return;
        try {
            await revokeAccess(requestId);
            toast.success('Access revoked');
            fetchData();
        } catch (error) {
            toast.error('Failed to revoke access');
        }
    };

    const toggleReason = (id) => {
        setExpandedMessages(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 md:px-0">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Doctor Access & Permissions</h1>
                <p className="text-gray-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">verified</span>
                    Securely manage who can view your child's nutritional data and growth progress.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Requests & Access List */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-bold text-gray-800">Pending Requests</h2>
                                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">{pendingRequests.length} New</span>
                            </div>

                            {pendingRequests.map(req => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={req._id}
                                    className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col md:flex-row items-center gap-6"
                                >
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-sm shrink-0">
                                        👨‍⚕️
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <h3 className="font-bold text-lg text-gray-900">{req.doctorId?.name || 'Unknown Doctor'}</h3>
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] uppercase font-bold rounded">Access Request</span>
                                        </div>
                                        <p className="text-gray-500 text-sm">{req.doctorId?.email}</p>
                                        <p className="text-blue-600 text-xs font-bold mt-1">
                                            {req.profileId ? `Requested restricted access to ${req.profileId.name}` : 'Wants to connect with your child profiles'}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto items-center">
                                        {req.profileId ? (
                                            <button
                                                onClick={() => handleApprove(req._id, req.profileId._id)}
                                                className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition shadow-lg shadow-blue-100 whitespace-nowrap"
                                            >
                                                Approve Restricted
                                            </button>
                                        ) : (
                                            <select
                                                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                onChange={(e) => {
                                                    if (e.target.value) handleApprove(req._id, e.target.value);
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Link Child & Approve</option>
                                                {children.map(child => (
                                                    <option key={child._id} value={child._id}>{child.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button
                                            onClick={() => handleReject(req._id)}
                                            className="px-4 py-2 border border-gray-200 text-gray-400 font-bold rounded-xl hover:bg-gray-50 transition text-sm"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Current Access */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="material-symbols-outlined">group</span>
                            Current Access
                        </h2>

                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                            {activeAccess.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">lock_person</span>
                                    <p>No doctors currently have access.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {activeAccess.map(access => (
                                        <div key={access._id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-gray-50/50 transition duration-150">
                                            <div className="col-span-4 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden">
                                                    {access.doctorId?.profileImage ? (
                                                        <img src={access.doctorId.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        access.doctorId?.name?.charAt(0) || 'D'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Dr. {access.doctorId?.name}</p>
                                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-tight">{access.doctorId?.doctorProfile?.specialization || 'Pediatrician'}</p>
                                                </div>
                                            </div>
                                            <div
                                                className="col-span-3 cursor-pointer group"
                                                onClick={() => toggleReason(access._id)}
                                            >
                                                {access.status === 'active' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 group-hover:bg-green-200 transition-colors">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                        Full Access
                                                        {access.doctorMessage && (
                                                            <span className="material-symbols-outlined text-[12px] opacity-60">
                                                                {expandedMessages.includes(access._id) ? 'keyboard_arrow_up' : 'info'}
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors">
                                                        <span className="material-symbols-outlined text-xs">visibility</span>
                                                        Restricted View
                                                        {access.doctorMessage && (
                                                            <span className="material-symbols-outlined text-[12px] opacity-60 ml-0.5">
                                                                {expandedMessages.includes(access._id) ? 'keyboard_arrow_up' : 'info'}
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-sm text-gray-600 font-bold">
                                                {access.profileId?.name}
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <div className="flex flex-col gap-1 items-end">
                                                    {access.status === 'restricted' && access.fullAccessRequested && (
                                                        <button
                                                            onClick={() => handleApprove(access._id, access.profileId._id)}
                                                            className="text-xs bg-primary text-white font-bold px-3 py-1 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                                            Grant Full Access
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRevoke(access._id)}
                                                        className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider hover:underline"
                                                    >
                                                        Revoke Access
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Doctor's Request Reason (Expandable) */}
                                            <AnimatePresence>
                                                {access.doctorMessage && expandedMessages.includes(access._id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="col-span-12 overflow-hidden"
                                                    >
                                                        <div className="mt-4 ml-12 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 relative">
                                                            <div className="absolute -top-2 left-6 bg-white px-2 text-[10px] font-black text-blue-600 uppercase">Doctor's request reason</div>
                                                            <p className="text-sm text-blue-900 font-medium italic">
                                                                "{access.doctorMessage}"
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shared History Prompt */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">history</span>
                            Recent Activity
                        </h3>
                        {activeAccess.length > 0 ? (
                            <div className="space-y-6 pl-4 border-l-2 border-gray-100 relative">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                                    <p className="text-sm font-bold text-gray-900">Permission Granted</p>
                                    <p className="text-xs text-gray-500 mt-0.5">You approved access for {activeAccess[0]?.doctorId?.name}.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No recent history.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Invite Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-50 border border-gray-100 sticky top-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Connect with a Doctor</h2>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Search and select a registered pediatrician to share your family profile.
                        </p>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Child Profile</label>
                                <div className="relative">
                                    <select
                                        value={selectedChild}
                                        onChange={(e) => setSelectedChild(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block p-4 outline-none appearance-none font-bold"
                                        required
                                    >
                                        <option value="" disabled>Select child...</option>
                                        {children.map(child => (
                                            <option key={child._id} value={child._id}>{child.name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-4 text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search Doctor</label>
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block w-full p-4 pl-12 outline-none font-medium placeholder-gray-400"
                                        placeholder="Name, Specialization or Hospital"
                                    />
                                    <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400">search</span>
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {filteredDoctors.length === 0 ? (
                                        <p className="text-center text-xs text-gray-400 py-4">No doctors found</p>
                                    ) : (
                                        filteredDoctors.map(doc => (
                                            <div
                                                key={doc._id}
                                                onClick={() => setSelectedDoctor(doc)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedDoctor?._id === doc._id
                                                    ? 'border-primary bg-blue-50 ring-2 ring-primary/10'
                                                    : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                                                    {doc.profileImage ? (
                                                        <img src={doc.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-400">person</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 truncate">Dr. {doc.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{doc.doctorProfile?.specialization || 'Pediatrician'} • {doc.doctorProfile?.hospitalName || 'Clinic'}</p>
                                                </div>
                                                {selectedDoctor?._id === doc._id && (
                                                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Consultation Message (Optional)</label>
                                <textarea
                                    value={consultationMessage}
                                    onChange={(e) => setConsultationMessage(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block w-full p-4 outline-none font-medium placeholder-gray-400 resize-none h-24"
                                    placeholder="e.g., My child has been picky with vegetables lately..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={inviteLoading || !selectedDoctor || !selectedChild}
                                className="w-full text-white bg-primary hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {inviteLoading ? (
                                    <>
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-600 shrink-0">verified_user</span>
                            <div>
                                <p className="text-xs font-bold text-blue-800 mb-1">SECURE & ENCRYPTED</p>
                                <p className="text-[10px] text-blue-600 leading-relaxed">
                                    NutriKid uses enterprise-grade encryption. Data sharing is fully compliant with medical privacy standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorAccess;
