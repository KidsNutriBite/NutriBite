
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: emailParam }));
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus('error');
            setMessage("Passwords don't match!");
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await axios.post('/auth/reset-password', {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });
            setStatus('success');
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to reset password.');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col lg:flex-row overflow-x-hidden bg-background-light dark:bg-background-dark text-[#0d161b] dark:text-slate-100">
            {/* Left Side: Visuals */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-primary/10 dark:bg-primary/5 p-12 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl relative">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-5xl">key</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-[#0d161b] dark:text-white mb-4">Secure your account</h2>
                        <p className="text-[#4c799a] dark:text-slate-400 text-lg leading-relaxed">
                            Create a new strong password to keep your family's health data safe.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20">
                <div className="w-full max-w-[480px]">
                    <header className="mb-10">
                        <Link to="/login" className="flex items-center gap-2 text-[#4c799a] hover:text-primary transition-colors mb-6 font-bold">
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Login
                        </Link>
                        <h1 className="text-4xl font-black text-[#0d161b] dark:text-white leading-tight mb-2">New Password</h1>
                        <p className="text-[#4c799a] dark:text-slate-400">Enter the OTP sent to your email</p>
                    </header>


                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 mb-6 border-l-4 rounded-r-lg ${status === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}
                        >
                            {message}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[#0d161b] dark:text-slate-200 text-base font-semibold ml-1">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c799a] text-xl">alternate_email</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    readOnly={!!searchParams.get('email')}
                                    required
                                    className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0d161b] dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 ${!!searchParams.get('email') ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. parent@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#0d161b] dark:text-slate-200 text-base font-semibold ml-1">OTP Code</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c799a] text-xl">pin</span>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    required
                                    maxLength={6}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0d161b] dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 tracking-widest font-bold"
                                    placeholder="123456"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#0d161b] dark:text-slate-200 text-base font-semibold ml-1">New Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c799a] text-xl">lock</span>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0d161b] dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="New strong password"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#0d161b] dark:text-slate-200 text-base font-semibold ml-1">Confirm Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c799a] text-xl">lock_reset</span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0d161b] dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
