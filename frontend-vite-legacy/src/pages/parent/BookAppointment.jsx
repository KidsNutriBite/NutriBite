import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const BookAppointment = () => {
    const { hospitalId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [profiles, setProfiles] = useState([]);
    const [hospitalName, setHospitalName] = useState('Hospital'); // Ideally fetch this details
    const [formData, setFormData] = useState({
        profileId: '',
        date: '',
        time: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch User Profiles
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Profiles
                const profileRes = await api.get('/profiles');
                setProfiles(profileRes.data.data);
                if (profileRes.data.data.length > 0) {
                    setFormData(prev => ({ ...prev, profileId: profileRes.data.data[0]._id }));
                }

                // 2. Fetch Hospital Details (Optional, for now just use ID or pass via state)
                // We'll rely on the user knowing where they clicked, or fetch if we had a single hospital endpoint.
                // For MVP optimization, we can just say "Book Appointment"
            } catch (err) {
                console.error(err);
                setError('Failed to load profiles');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/appointments/book', {
                ...formData,
                hospitalId,
                hospitalName: hospitalName // In real app, fetch/verify name
            });
            navigate('/parent/my-appointments');
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    // Calculate min date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Book Appointment</h1>
                    <p className="text-gray-600">Schedule a visit for your child.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Child Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child</label>
                        <select
                            name="profileId"
                            value={formData.profileId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
                            required
                        >
                            {profiles.map(profile => (
                                <option key={profile._id} value={profile._id}>
                                    {profile.name} ({profile.age} years)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <input
                                type="date"
                                name="date"
                                min={minDate}
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time</label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Visit</label>
                        <textarea
                            name="reason"
                            rows="4"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Describe symptoms or reason for checkup..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
                            required
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Confirming...' : 'Confirm Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointment;
