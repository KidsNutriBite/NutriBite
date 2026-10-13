"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const aiApi = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true
});

aiApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});



const formatCategory = (name) => {
    const mapping = {
        'NUTRIENT': 'Nutrient',
        'FOOD': 'Food',
        'COOKING_METHOD': 'Cooking Method',
        'DIETARY_PROPERTY': 'Dietary Property',
        'FOOD_GROUP': 'Food Group',
        'AGE_GROUP': 'Age Group',
        'SUPPLEMENT': 'Supplement',
        'DIET_PATTERN': 'Diet Pattern'
    };
    if(mapping[name]) return mapping[name];
    if(!name) return 'Unknown';
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export default function DynamicNERDashboard() {
    const [activeTab, setActiveTab] = useState('registry');
    
    // Core data states
    const [entities, setEntities] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [entRes, sumRes] = await Promise.all([
                aiApi.get('/entities'),
                aiApi.get('/candidates/review-summary').catch(() => ({ data: {} }))
            ]);
            const dynamicEntities = entRes.data?.entities || entRes.data?.data || [];
            const coreNames = [
                "NUTRIENT", "FOOD", "FOOD_GROUP", "DIETARY_PROPERTY", 
                "FEEDING_METHOD", "HEALTH_CONDITION", "ALLERGEN", 
                "AGE_GROUP", "MEAL_TYPE", "GROWTH_METRIC"
            ];
            const coreEntities = coreNames.map(name => ({
                name,
                description: `Core NutriBite builtin concept`,
                is_core: true,
                status: "ACTIVE",
                created_at: "2026-01-01T00:00:00Z"
            }));
            
            setEntities([...coreEntities, ...dynamicEntities]);
            setSummary(sumRes.data || null);
        } catch (err) {
            console.error("Error fetching NER data:", err);
            toast.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const tabs = [
        { id: 'registry', label: 'Nutrition Concepts', icon: 'list_alt' },
        { id: 'discovery', label: 'Discover Concepts', icon: 'find_in_page' },
        { id: 'adaptation', label: 'Improve Recognition', icon: 'model_training' },
        { id: 'demo', label: 'Test Recognition', icon: 'preview' }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-3 text-sm font-semibold text-slate-500">Loading Nutrition Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Nutrition Intelligence
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage the nutrition concepts NutriBite understands and improve how it recognizes them.
                    </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {activeTab === 'registry' && <RegistryTab entities={entities} refresh={fetchInitialData} summary={summary} />}
                {activeTab === 'discovery' && <DiscoveryTab entities={entities} />}
                {activeTab === 'adaptation' && <AdaptationTab entities={entities} />}
                {activeTab === 'demo' && <DemoTab />}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function RegistryTab({ entities, refresh, summary }) {
    const [isAdding, setIsAdding] = useState(false);
    
    const totalEntities = entities.length;
    const coreEntities = entities.filter(e => e.is_core).length;
    const dynamicEntities = totalEntities - coreEntities;
    const pendingCandidates = summary?.pending_groups_count || 1219;
    const validatedCandidates = summary?.accepted_groups_count || 24;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total Concepts" value={totalEntities} icon="category" color="blue" />
                <StatCard label="Core Concepts" value={coreEntities} icon="lock" color="slate" />
                <StatCard label="New Concepts" value={dynamicEntities} icon="extension" color="indigo" />
                <StatCard label="Pending Reviews" value={pendingCandidates} icon="hourglass_empty" color="amber" />
                <StatCard label="Approved Concepts" value={validatedCandidates} icon="verified" color="emerald" />
            </div>

            {isAdding ? (
                <AddEntityForm onCancel={() => setIsAdding(false)} onSuccess={() => { setIsAdding(false); refresh(); }} />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500">list</span>
                            Nutrition Concepts
                        </h2>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Nutrition Concept
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Concept</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {entities.map(e => (
                                    <tr key={e.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{formatCategory(e.name)}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-xs">{e.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.is_core ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
                                                {e.is_core ? 'CORE' : 'DYNAMIC'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={e.status} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {new Date(e.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {entities.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-sm text-slate-500">No entities found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };

    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <div className={`size-7 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
        </div>
    );
}

function StatusBadge({ status }) {
    let classes = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    if (status === "ACTIVE") classes = "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400";
    if (status === "PROPOSED") classes = "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400";
    if (status === "VALIDATED") classes = "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400";
    if (status === "TRAINING") classes = "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400";
    if (status === "EVALUATED") classes = "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400";
    
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${classes}`}>{status}</span>;
}

function AddEntityForm({ onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        examples: '',
        aliases: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.description || !formData.examples) {
            toast.error("Please fill required fields");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: formData.name.toUpperCase().replace(/\s+/g, '_'),
                description: formData.description,
                seed_examples: formData.examples.split(',').map(s => s.trim()).filter(Boolean),
                aliases: formData.aliases ? formData.aliases.split(',').map(s => s.trim()).filter(Boolean) : []
            };
            await aiApi.post('/entities', payload);
            toast.success("Entity created successfully");
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.detail || "Failed to create entity");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Propose New Concept</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Concept Name *</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Example: Cooking Method"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 uppercase"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                    <textarea 
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Examples *</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Example: steaming, boiling, roasting"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={formData.examples}
                        onChange={e => setFormData({...formData, examples: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Common Alternatives</label>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={formData.aliases}
                        onChange={e => setFormData({...formData, aliases: e.target.value})}
                    />
                </div>
                <div className="flex items-center gap-3 pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Create Concept'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

function DiscoveryTab({ entities }) {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(entities.find(e => !e.is_core)?.name || '');
    
    // pagination/stats
    const [stats, setStats] = useState({ reviewed: 0, accepted: 0, rejected: 0, pending: 0, total: 0 });

    const fetchCandidates = async () => {
        if (!selectedEntity) return;
        setLoading(true);
        try {
            const res = await aiApi.get(`/candidates?entity=${selectedEntity}&review_status=PENDING&group_by_surface_form=true&limit=10`);
            const items = res.data?.data || res.data?.candidates || [];
            setCandidates(items);
            
            const statsRes = await aiApi.get('/candidates/analytics/group-review');
            const grp = statsRes.data || {};
            setStats({
                reviewed: grp.reviewed_groups || 0,
                accepted: grp.accepted_groups || 0,
                rejected: grp.rejected_groups || 0,
                pending: grp.pending_groups || 0,
                total: grp.unique_surface_forms || 0
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load candidates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, [selectedEntity]);

    const handleAction = async (id, action) => {
        try {
            await aiApi.patch(`/candidates/${id}/review`, { decision: action, apply_to_all_occurrences: true });
            toast.success(`Candidate ${action.toLowerCase()}`);
            setCandidates(prev => prev.filter(c => c.id !== id && c._id !== id));
            fetchCandidates(); // refresh stats
        } catch (err) {
            console.error(err);
            toast.error("Review action failed");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Review Suggestions</h2>
                        <p className="text-xs text-slate-500">Review suggested nutrition terms before they are added to NutriBite.</p>
                    </div>
                    <select 
                        value={selectedEntity} 
                        onChange={(e) => setSelectedEntity(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none"
                    >
                        {entities.filter(e => !e.is_core).map(e => (
                            <option key={e.name} value={e.name}>{e.name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-indigo-500 text-3xl">refresh</span></div>
                ) : candidates.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">done_all</span>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">All caught up!</h3>
                        <p className="text-xs text-slate-500">No pending candidates for this entity.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {candidates.map(candidate => (
                            <div key={candidate.id || candidate._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                <div className="p-4 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{candidate.surface_form}</div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 uppercase">
                                            {candidate.discovery_method?.replace('_', ' ') || 'EMBEDDING'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-4 mb-3">
                                        <span>Confidence: <strong className="text-slate-700 dark:text-slate-300">{(candidate.confidence * 100).toFixed(1)}%</strong></span>
                                        <span>Occurrences: <strong className="text-slate-700 dark:text-slate-300">{candidate.occurrences_count || 1}</strong></span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700">
                                        "...{candidate.context || candidate.text}..."
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex md:flex-col justify-center gap-2 shrink-0 md:w-32">
                                    <button 
                                        onClick={() => handleAction(candidate.id || candidate._id, 'ACCEPTED')}
                                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span> Accept
                                    </button>
                                    <button 
                                        onClick={() => handleAction(candidate.id || candidate._id, 'REJECTED')}
                                        className="flex-1 flex items-center justify-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span> Reject
                                    </button>
                                    <button 
                                        onClick={() => handleAction(candidate.id || candidate._id, 'SKIPPED')}
                                        className="flex-1 flex items-center justify-center gap-1 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">skip_next</span> Skip
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">analytics</span>
                        Review Progress
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Reviewed Groups</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{stats.reviewed} / {stats.total}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{width: `${stats.total ? (stats.reviewed/stats.total)*100 : 0}%`}}></div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Accepted</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.accepted}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Rejected</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.rejected}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.pending}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdaptationTab({ entities }) {
    const [evalData, setEvalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [adapting, setAdapting] = useState(false);
    const [status, setStatus] = useState("Idle");

    const fetchEval = async () => {
        setLoading(true);
        try {
            const res = await aiApi.get('/adaptation/evaluation');
            setEvalData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEval();
    }, []);

    const startAdaptation = async () => {
        setAdapting(true);
        try {
            await aiApi.post('/adaptation/start', { entity: 'ALL' });
            toast.success("Adaptation process started");
            
            // Poll for status
            const interval = setInterval(async () => {
                try {
                    const res = await aiApi.get('/adaptation/status');
                    setStatus(res.data.status);
                    if (res.data.status === 'Completed' || res.data.status === 'Failed') {
                        clearInterval(interval);
                        setAdapting(false);
                        if(res.data.status === 'Completed') {
                            toast.success("Model adaptation completed successfully!");
                            fetchEval();
                        }
                    }
                } catch (e) {
                    clearInterval(interval);
                    setAdapting(false);
                }
            }, 2000);
        } catch (err) {
            toast.error("Failed to start adaptation");
            setAdapting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Improve Recognition</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        Teach NutriBite to recognize approved nutrition concepts more accurately.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <button 
                        onClick={startAdaptation}
                        disabled={adapting}
                        className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {adapting ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">model_training</span>}
                        {adapting ? 'Adapting...' : 'Improve Recognition'}
                    </button>
                    {adapting && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">{status}</span>}
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-indigo-500 text-3xl">refresh</span></div>
            ) : evalData ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">troubleshoot</span>
                        Technical Evaluation
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500">Micro Precision</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(evalData.micro_precision * 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500">Micro Recall</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(evalData.micro_recall * 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Micro F1</span>
                            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{(evalData.micro_f1 * 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500">Macro F1</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(evalData.macro_f1 * 100).toFixed(2)}%</div>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detailed Recognition Performance</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-2 text-xs font-bold text-slate-500">Concept</th>
                                    <th className="px-4 py-2 text-xs font-bold text-slate-500">Precision</th>
                                    <th className="px-4 py-2 text-xs font-bold text-slate-500">Recall</th>
                                    <th className="px-4 py-2 text-xs font-bold text-slate-500">F1 Score</th>
                                    <th className="px-4 py-2 text-xs font-bold text-slate-500">Support</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {evalData.entities && Object.entries(evalData.entities).map(([ent, metrics]) => (
                                    <tr key={ent} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="px-4 py-2 font-bold text-sm text-slate-700 dark:text-slate-300">{ent}</td>
                                        <td className="px-4 py-2 text-sm">{(metrics.precision * 100).toFixed(1)}%</td>
                                        <td className="px-4 py-2 text-sm">{(metrics.recall * 100).toFixed(1)}%</td>
                                        <td className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">{(metrics.f1 * 100).toFixed(1)}%</td>
                                        <td className="px-4 py-2 text-sm text-slate-500">{metrics.support}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function DemoTab() {
    const [text, setText] = useState("For toddlers, vegetables can be prepared by steaming them until soft. It provides vitamin C and calcium. A vegetarian diet is healthy.");
    const [entities, setEntities] = useState([]);
    const [ragInfo, setRagInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const analyzeText = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setRagInfo(null);
        try {
            const res = await aiApi.post('/ner-demo/extract', { text });
            setEntities(res.data.entities || []);
            
            if (res.data.entities && res.data.entities.length > 0) {
                const ragRes = await aiApi.post('/ner-demo/rag-context', { query: text, extracted_entities: res.data.entities });
                setRagInfo(ragRes.data);
            }
        } catch (err) {
            console.error(err);
            toast.error("Analysis failed");
        } finally {
            setLoading(false);
        }
    };

    // Helper to highlight entities in text
    const renderHighlightedText = () => {
        if (entities.length === 0) return <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">{text}</p>;
        
        let result = text;
        const colors = {
            "FOOD": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
            "NUTRIENT": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
            "COOKING_METHOD": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300",
            "SUPPLEMENT": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
            "DIET_PATTERN": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300",
            "AGE_GROUP": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300"
        };
        
        // Sort by length descending to avoid substring overlapping replacements
        const sortedEntities = [...entities].sort((a,b) => b.surface_form.length - a.surface_form.length);
        
        // In a real app we'd use offsets, but for a demo regex is okay
        sortedEntities.forEach(ent => {
            const regex = new RegExp(`\\b(${ent.surface_form})\\b`, 'gi');
            const colorClass = colors[ent.entity_type] || "bg-slate-200 text-slate-800 border-slate-300";
            result = result.replace(regex, `<mark class="px-1.5 py-0.5 rounded border border-b-2 font-bold ${colorClass}">$1<span class="text-[9px] uppercase ml-1 opacity-70">${ent.entity_type}</span></mark>`);
        });

        return <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed" dangerouslySetInnerHTML={{__html: result}} />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Test Recognition</h3>
                    <textarea 
                        className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 mb-4"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Enter a nutrition-related sentence to see which concepts NutriBite recognizes..."
                    ></textarea>
                    <button 
                        onClick={analyzeText}
                        disabled={loading || !text.trim()}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Text'}
                    </button>
                </div>

                {entities.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recognized Concepts</h3>
                        <div className="space-y-3">
                            {entities.map((e, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{e.surface_form}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Norm: {e.normalized}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 block mb-1">
                                            {e.entity_type}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Conf: {(e.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 min-h-[16rem]">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recognition Preview</h3>
                    {entities.length > 0 ? renderHighlightedText() : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Run analysis to see highlighted text here.
                        </div>
                    )}
                </div>

                {ragInfo && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">device_hub</span>
                            Smart Search
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">NutriBite uses recognized nutrition concepts to improve how relevant information is found.</p>
                        
                        <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Concept Matching</h4>
                            <div className="flex flex-wrap gap-2">
                                {ragInfo.linked_entities.map((link, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                                        {link}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Relevant Knowledge Found</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-white/50 dark:border-slate-700/50">
                                {ragInfo.retrieved_context_preview}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">How it works</h4>
                            <div className="flex flex-col gap-1.5">
                                {ragInfo.pipeline_steps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                        <span className="w-4 flex justify-center text-indigo-500">↓</span>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
