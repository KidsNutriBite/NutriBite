"use client";
import { useEffect, useMemo, useState } from 'react';
import { logSleep } from '../../api/sleep.api';

const SleepLogForm = ({ profileId, initialData, onSuccess, onCancel, showCancel = true }) => {
    const [formData, setFormData] = useState(() => ({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        sleepTime: initialData?.sleepTime || '21:00',
        wakeUpTime: initialData?.wakeUpTime || '06:00',
        notes: initialData?.notes || '',
    }));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const totalSleepHours = useMemo(() => {
        if (!formData.sleepTime || !formData.wakeUpTime) return 0;

        const [sleepHours, sleepMinutes] = formData.sleepTime.split(':').map(Number);
        const [wakeHours, wakeMinutes] = formData.wakeUpTime.split(':').map(Number);

        const sleepStart = new Date();
        sleepStart.setHours(sleepHours, sleepMinutes, 0, 0);
        const wakeUp = new Date();
        wakeUp.setHours(wakeHours, wakeMinutes, 0, 0);

        let diffInMs = wakeUp - sleepStart;
        if (diffInMs < 0) diffInMs += 24 * 60 * 60 * 1000;

        return Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100;
    }, [formData.sleepTime, formData.wakeUpTime]);

    const status = useMemo(() => {
        if (totalSleepHours < 8) return { label: 'Poor Sleep', tone: 'text-red-600 bg-red-50 border-red-100' };
        if (totalSleepHours <= 10) return { label: 'Healthy', tone: 'text-green-600 bg-green-50 border-green-100' };
        return { label: 'Oversleep', tone: 'text-amber-600 bg-amber-50 border-amber-100' };
    }, [totalSleepHours]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date || new Date().toISOString().split('T')[0],
                sleepTime: initialData.sleepTime || '21:00',
                wakeUpTime: initialData.wakeUpTime || '06:00',
                notes: initialData.notes || '',
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await logSleep({ profileId, ...formData });
            onSuccess?.();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to log sleep');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sleep Time</label>
                    <input
                        type="time"
                        value={formData.sleepTime}
                        onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Wake-Up Time</label>
                    <input
                        type="time"
                        value={formData.wakeUpTime}
                        onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${status.tone}`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Sleep Status</p>
                        <p className="text-lg font-black">{status.label}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Total Sleep</p>
                        <p className="text-2xl font-black">{totalSleepHours} hrs</p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Optional sleep notes"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {showCancel && (
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60">
                    {loading ? 'Saving...' : 'Save Sleep Log'}
                </button>
            </div>
        </form>
    );
};

export default SleepLogForm;
