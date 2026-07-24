import GrowthVelocityCenter from '../../components/doctor/GrowthVelocityCenter';
import DoctorTwinView from '../../components/doctor/DoctorTwinView';
import { getGrowthVelocity } from '../../api/doctor.api';

const DietitianCaseDetail = () => {
    const { id: requestId } = useParams();
    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dietitianNotes, setDietitianNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    // Growth Progression & Doctor Tracking States
    const [growthVelocityData, setGrowthVelocityData] = useState(null);
    const [growthVelocityLoading, setGrowthVelocityLoading] = useState(false);
    const [growthRecords, setGrowthRecords] = useState([]);
    const [growthRecordsLoading, setGrowthRecordsLoading] = useState(false);
    const [showRawTranscripts, setShowRawTranscripts] = useState({});
    const [growthViewMode, setGrowthViewMode] = useState('velocity'); // 'velocity', 'twin', 'history'

    // Doctor Assignment States
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [assignmentMode, setAssignmentMode] = useState('auto'); // 'auto' or 'manual'
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'growth', 'doctor-care', 'reports', 'history'

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

            // Fetch growth velocity and growth records for dietitian insight
            if (reqData?.profileId?._id) {
                const childId = reqData.profileId._id;

                setGrowthVelocityLoading(true);
                getGrowthVelocity(childId)
                    .then(res => setGrowthVelocityData(res?.data || res))
                    .catch(err => console.error('Failed to load growth velocity for dietitian:', err))
                    .finally(() => setGrowthVelocityLoading(false));

                setGrowthRecordsLoading(true);
                api.get(`/growth/${childId}`)
                    .then(res => {
                        const recs = Array.isArray(res.data) ? res.data : (res.data?.records || []);
                        setGrowthRecords(recs);
                    })
                    .catch(err => console.error('Failed to load growth records for dietitian:', err))
                    .finally(() => setGrowthRecordsLoading(false));
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
                    <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-none">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Child Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('growth')}
                            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'growth' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <span>📈</span> Growth & Velocity
                        </button>
                        <button
                            onClick={() => setActiveTab('doctor-care')}
                            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'doctor-care' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <span>🩺</span> Doctor Care & Follow-Up
                            {(request?.doctorNotes || request?.prescriptionId) && (
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Reports ({child?.medicalReports?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
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

                        {activeTab === 'growth' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span>📈</span> Growth Progression & Velocity Intelligence
                                        </h3>
                                        <p className="text-xs text-slate-500">Analyze height/weight velocity, WHO percentile stability, and AI digital twin trajectory for {child?.name}.</p>
                                    </div>
                                    {/* View Mode Selector */}
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                                        <button
                                            onClick={() => setGrowthViewMode('velocity')}
                                            className={`px-3 py-1.5 rounded-lg transition ${growthViewMode === 'velocity' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Velocity Analytics
                                        </button>
                                        <button
                                            onClick={() => setGrowthViewMode('twin')}
                                            className={`px-3 py-1.5 rounded-lg transition ${growthViewMode === 'twin' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Digital Twin AI
                                        </button>
                                        <button
                                            onClick={() => setGrowthViewMode('history')}
                                            className={`px-3 py-1.5 rounded-lg transition ${growthViewMode === 'history' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Logs ({growthRecords.length})
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Growth Highlights */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Current Height</p>
                                        <p className="text-xl font-black text-indigo-950 dark:text-indigo-200 mt-1">{child?.height || '--'} cm</p>
                                        <p className="text-[11px] font-semibold text-indigo-600/80 mt-0.5">Recorded in profile</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Current Weight</p>
                                        <p className="text-xl font-black text-emerald-950 dark:text-emerald-200 mt-1">{child?.weight || '--'} kg</p>
                                        <p className="text-[11px] font-semibold text-emerald-600/80 mt-0.5">Recorded in profile</p>
                                    </div>
                                    <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Growth Entries</p>
                                        <p className="text-xl font-black text-purple-950 dark:text-purple-200 mt-1">{growthRecords.length} Logs</p>
                                        <p className="text-[11px] font-semibold text-purple-600/80 mt-0.5">Logged over time</p>
                                    </div>
                                    <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Percentile Drift</p>
                                        <p className="text-xl font-black text-amber-950 dark:text-amber-200 mt-1">
                                            {growthVelocityData?.velocityMetrics?.bmiPercentile ? `${Math.round(growthVelocityData.velocityMetrics.bmiPercentile)}th %ile` : 'WHO Standard'}
                                        </p>
                                        <p className="text-[11px] font-semibold text-amber-600/80 mt-0.5">{growthVelocityData?.percentileDrift?.direction || 'STABLE'}</p>
                                    </div>
                                </div>

                                {/* Active Sub View */}
                                {growthViewMode === 'velocity' && (
                                    <GrowthVelocityCenter
                                        data={growthVelocityData}
                                        profile={child}
                                        loading={growthVelocityLoading}
                                    />
                                )}

                                {growthViewMode === 'twin' && (
                                    <DoctorTwinView
                                        profileId={child?._id}
                                        profile={child}
                                    />
                                )}

                                {growthViewMode === 'history' && (
                                    <div className="space-y-4">
                                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Child Growth Milestone Logs</h4>
                                        {growthRecordsLoading ? (
                                            <div className="text-center py-8 text-xs text-slate-400">Loading growth history...</div>
                                        ) : growthRecords.length > 0 ? (
                                            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                        <tr>
                                                            <th className="p-3">Date</th>
                                                            <th className="p-3">Height (cm)</th>
                                                            <th className="p-3">Weight (kg)</th>
                                                            <th className="p-3">BMI</th>
                                                            <th className="p-3">Percentile</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                                                        {growthRecords.map((rec, idx) => (
                                                            <tr key={rec._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                                <td className="p-3 font-semibold">{new Date(rec.timestamp || rec.date || rec.createdAt).toLocaleDateString()}</td>
                                                                <td className="p-3">{rec.height} cm</td>
                                                                <td className="p-3">{rec.weight} kg</td>
                                                                <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{rec.bmi ? rec.bmi.toFixed(1) : '--'}</td>
                                                                <td className="p-3">
                                                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-[10px]">
                                                                        {rec.percentile ? `${Math.round(rec.percentile)}th` : '--'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-slate-400 text-xs italic">
                                                No previous historical growth entries logged. Current height and weight are captured from baseline profile.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'doctor-care' && (
                            <div className="space-y-6">
                                {/* Top Care Timeline Pipeline */}
                                <div className="p-5 bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-blue-900/10 dark:from-purple-950/40 dark:to-blue-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                <span>🩺</span> Post-Assignment Doctor Care Tracker
                                            </h3>
                                            <p className="text-xs text-slate-500">Track doctor notes, diagnosis, prescriptions, and video consultation logs after escalation.</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            request.status === 'PrescriptionIssued' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                            request.status === 'UnderDoctorReview' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' :
                                            request.status === 'AssignedToDoctor' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {request.status === 'PrescriptionIssued' ? 'Prescription Issued ✅' :
                                             request.status === 'UnderDoctorReview' ? 'Doctor Reviewing 🔍' :
                                             request.status === 'AssignedToDoctor' ? 'Assigned to Doctor 🩺' : request.status}
                                        </span>
                                    </div>

                                    {/* Step pipeline indicator */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-[10px] font-bold">
                                        <div className="p-2 rounded-xl bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20">
                                            1. Dietitian Review ✓
                                        </div>
                                        <div className={`p-2 rounded-xl border ${request.doctorId ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'}`}>
                                            2. Doctor Assigned {request.doctorId ? '✓' : ''}
                                        </div>
                                        <div className={`p-2 rounded-xl border ${request.doctorNotes || request.status === 'UnderDoctorReview' || request.status === 'PrescriptionIssued' ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'}`}>
                                            3. Clinical Findings {request.doctorNotes ? '✓' : ''}
                                        </div>
                                        <div className={`p-2 rounded-xl border ${request.prescriptionId ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'}`}>
                                            4. Prescription Issued {request.prescriptionId ? '✓' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Assigned Doctor Card */}
                                {request.doctorId ? (
                                    <div className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-cover bg-center border-2 border-purple-200 dark:border-purple-800 shadow-sm" style={{ backgroundImage: `url('${request.doctorId.profileImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}')` }}></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-extrabold text-base text-slate-800 dark:text-white">Dr. {request.doctorId.name}</h4>
                                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold">Assigned Pediatrician</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {request.doctorId.doctorProfile?.specialization || 'Pediatric Care Specialist'} • {request.doctorId.email}
                                                </p>
                                                {request.doctorId.doctorProfile?.licenseId && (
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">License ID: {request.doctorId.doctorProfile.licenseId}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                        <span className="text-3xl mb-2 inline-block">📋</span>
                                        <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">Not Yet Assigned to Doctor</h4>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 max-w-md mx-auto mt-1">Use the panel on the right to assign or auto-recommend a doctor for this child.</p>
                                    </div>
                                )}

                                {/* Doctor Clinical Notes */}
                                <div className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500 text-lg">edit_note</span>
                                            Doctor's Clinical Findings & Notes
                                        </h4>
                                        {request.doctorNotes && <span className="text-[10px] font-bold text-slate-400">Updated by Doctor</span>}
                                    </div>
                                    {request.doctorNotes ? (
                                        <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{request.doctorNotes}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No notes added by doctor yet.</p>
                                    )}
                                </div>

                                {/* Issued Prescription & Medication Details */}
                                <div className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-500 text-lg">prescriptions</span>
                                            Issued Medical Prescription & Advice
                                        </h4>
                                        {request.prescriptionId && (
                                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 font-bold text-[10px]">
                                                Issued on {new Date(request.prescriptionId.date || request.prescriptionId.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {request.prescriptionId ? (
                                        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                                            <div>
                                                <h5 className="font-bold text-xs text-slate-800 dark:text-white">{request.prescriptionId.title || 'Pediatric Clinical Advice'}</h5>
                                                {request.prescriptionId.instructions && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                                        <strong>Instructions:</strong> {request.prescriptionId.instructions}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Prescribed Medicines */}
                                            {request.prescriptionId.medicines && request.prescriptionId.medicines.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prescribed Medicines ({request.prescriptionId.medicines.length})</p>
                                                    <div className="grid gap-2">
                                                        {request.prescriptionId.medicines.map((med, idx) => (
                                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-white">{med.name || med.medicineName}</p>
                                                                    <p className="text-[11px] text-slate-500">{med.dosage} • {med.frequency}</p>
                                                                </div>
                                                                {med.duration && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">{med.duration}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No formal prescription issued yet for this case.</p>
                                    )}
                                </div>

                                {/* Doctor Video Consultations & AI Call Summaries */}
                                <div className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-500 text-lg">video_camera_front</span>
                                        Doctor Video Consultations & AI Logs ({request.videoCallLogs?.length || 0})
                                    </h4>

                                    {request.videoCallLogs && request.videoCallLogs.length > 0 ? (
                                        <div className="space-y-3">
                                            {request.videoCallLogs.map((log, logIdx) => (
                                                <div key={log._id || logIdx} className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Session #{logIdx + 1}</span>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                            {log.durationMinutes > 0 && <span>⏱ {log.durationMinutes} mins</span>}
                                                            <span>{new Date(log.callDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    {log.summary && (
                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">AI Consultation Summary</p>
                                                            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{log.summary}</p>
                                                        </div>
                                                    )}

                                                    {log.transcript && (
                                                        <div>
                                                            <button
                                                                onClick={() => setShowRawTranscripts(prev => ({ ...prev, [log._id || logIdx]: !prev[log._id || logIdx] }))}
                                                                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                                                            >
                                                                {showRawTranscripts[log._id || logIdx] ? 'Hide Raw Call Transcript' : 'View Raw Call Transcript'}
                                                            </button>
                                                            {showRawTranscripts[log._id || logIdx] && (
                                                                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 italic">
                                                                    {log.transcript}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No video consultation sessions recorded for this case.</p>
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
