import { useState, useEffect } from 'react';
import api from '../../api/axios';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const { data } = await api.get('/appointments');
            setAppointments(data.data || []);
        } catch (err) {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await api.patch(`/appointments/${id}/cancel`);
            fetchAppointments(); // Refresh list
        } catch (err) {
            alert('Failed to cancel appointment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Appointments</h1>

            {loading && <div className="text-center py-10">Loading appointments...</div>}

            {!loading && appointments.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">No appointments scheduled.</p>
                </div>
            )}

            <div className="grid gap-6">
                {appointments.map(apt => (
                    <div key={apt._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{apt.hospitalName}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-semibold">Child:</span> {apt.profileId?.name}</p>
                                <p><span className="font-semibold">Date:</span> {new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                                <p><span className="font-semibold">Reason:</span> {apt.reason}</p>
                            </div>
                        </div>

                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                                onClick={() => handleCancel(apt._id)}
                                className="px-5 py-2.5 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyAppointments;
