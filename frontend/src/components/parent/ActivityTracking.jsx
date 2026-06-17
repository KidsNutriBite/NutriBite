import React, { useState, useEffect, useMemo } from 'react';
import { logActivity, getDailyActivity, deleteActivity, getActivityHistory } from '../../api/activity.api';

const activityTypesList = [
    'Playing', 'Outdoor Play', 'Sports', 'Walking', 'Cycling', 
    'Running', 'Dancing', 'Swimming', 'Yoga', 'Exercise', 
    'School Physical Education', 'Household Chores', 'Other'
];

const ActivityTracking = ({ profileId, selectedDate, onActivityUpdate }) => {
    const [activityLog, setActivityLog] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ type: 'Playing', duration: 30, notes: '' });

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const [dailyRes, historyRes] = await Promise.all([
                getDailyActivity(profileId, selectedDate),
                getActivityHistory(profileId)
            ]);
            setActivityLog(dailyRes.data);
            setHistory(historyRes.data || []);
            if (onActivityUpdate) onActivityUpdate();
        } catch (error) {
            console.error("Failed to fetch activity", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate physical activity streak (days with > 0 minutes)
    const activityStreak = useMemo(() => {
        if (!history || history.length === 0) return 0;
        
        const activeDates = history
            .filter(entry => entry.totalDuration > 0)
            .map(entry => entry.date);
        const uniqueDays = new Set(activeDates);
        
        let streak = 0;
        let checkDate = new Date();
        const checkDateStr = checkDate.toISOString().split('T')[0];

        let hasToday = uniqueDays.has(checkDateStr);
        let d = new Date(checkDate);

        if (!hasToday) {
            // Check yesterday
            d.setDate(d.getDate() - 1);
            const yesterdayStr = d.toISOString().split('T')[0];
            if (uniqueDays.has(yesterdayStr)) {
                hasToday = true;
            }
        }

        if (hasToday) {
            let currentCheck = new Date(d);
            while (true) {
                const dateStr = currentCheck.toISOString().split('T')[0];
                if (uniqueDays.has(dateStr)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return streak;
    }, [history]);

    useEffect(() => {
        if (profileId && selectedDate) {
            fetchActivity();
        }
    }, [profileId, selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await logActivity(profileId, {
                date: selectedDate,
                activities: [{ ...formData, duration: Number(formData.duration) }]
            });
            setFormData({ type: 'Playing', duration: 30, notes: '' });
            setIsFormOpen(false);
            fetchActivity();
        } catch (error) {
            console.error("Failed to log activity", error);
        }
    };

    const handleDelete = async (activityId) => {
        if (window.confirm("Delete this activity?")) {
            try {
                await deleteActivity(profileId, activityLog._id, activityId);
                fetchActivity();
            } catch (error) {
                console.error("Failed to delete activity", error);
            }
        }
    };

    if (loading) return <div className="text-gray-500 py-4 text-center">Loading activities...</div>;

    const totalDuration = activityLog?.totalDuration || 0;
    const progressPercent = Math.min((totalDuration / 60) * 100, 100);
    const isActive = totalDuration >= 60;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">Daily Activity Tracker</h2>
                    {/* Activity Streak Badge */}
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-2xl text-xs font-bold border border-blue-100 dark:border-blue-800/50 shadow-sm animate-pulse">
                        <span>🔥</span> {activityStreak} Day Streak
                    </div>
                </div>
                <button 
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition"
                >
                    {isFormOpen ? 'Cancel' : '+ Log Activity'}
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                    <h3 className="font-bold text-blue-900 mb-4">Add New Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Activity Type</label>
                            <select 
                                value={formData.type} 
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                            >
                                {activityTypesList.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Duration (minutes)</label>
                            <input 
                                type="number" 
                                min="1"
                                value={formData.duration} 
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.notes} 
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="E.g., Played soccer at the park"
                                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-blue-700">Save Activity</button>
                    </div>
                </form>
            )}

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                {/* Background decorative element */}
                <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl opacity-20 ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>

                <div className="w-full md:w-1/3 text-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                    <p className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-2">Total Activity</p>
                    <h3 className="text-5xl font-black text-gray-900 mb-2">{totalDuration}<span className="text-lg text-gray-500"> mins</span></h3>
                    <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className="material-symbols-outlined text-[16px]">{isActive ? 'check_circle' : 'warning'}</span>
                        {isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <div className="w-full md:w-2/3">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="font-bold text-gray-800">Daily Goal: 60 minutes</p>
                            <p className="text-xs text-gray-500">WHO recommended standard</p>
                        </div>
                        <div className="font-black text-lg text-primary">{Math.round(progressPercent)}%</div>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-4">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isActive ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    
                    {!isActive ? (
                        <p className="text-sm font-semibold text-red-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            Child needs {60 - totalDuration} more minutes to reach healthy levels.
                        </p>
                    ) : (
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">celebration</span>
                            Great job! Healthy activity levels reached today.
                        </p>
                    )}
                </div>
            </div>

            {/* List of Activities */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Activity Log</h3>
                {!activityLog || activityLog.activities.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <span className="text-4xl block mb-2">🏃‍♂️</span>
                        <p className="text-gray-500 font-medium text-sm">No activities logged yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activityLog.activities.map((act) => (
                            <div key={act._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        {act.type.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{act.type}</p>
                                        {act.notes && <p className="text-xs text-gray-500">{act.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-gray-800">{act.duration} min</span>
                                    <button 
                                        onClick={() => handleDelete(act._id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTracking;
