
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await axios.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(`We've sent a password reset OTP to ${email} if an account exists.`);
            // Optional: Auto redirect to reset page after a delay
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col lg:flex-row overflow-x-hidden bg-background-light dark:bg-background-dark text-[#0d161b] dark:text-slate-100">
            {/* Left Side: Visuals */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-primary/10 dark:bg-primary/5 p-12 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl relative">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                            <span className="material-symbols-outlined text-5xl">lock_reset</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-[#0d161b] dark:text-white mb-4">Forgot Password?</h2>
                        <p className="text-[#4c799a] dark:text-slate-400 text-lg leading-relaxed">
                            Don't worry! It happens. Enter your email and we'll help you get back to your healthy journey.
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
                        <h1 className="text-4xl font-black text-[#0d161b] dark:text-white leading-tight mb-2">Reset Password</h1>
                        <p className="text-[#4c799a] dark:text-slate-400">Enter your registered email address</p>
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[#0d161b] dark:text-slate-200 text-base font-semibold ml-1">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c799a] text-xl">alternate_email</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0d161b] dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="e.g. parent@email.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {status === 'loading' ? (
                                <span>Sending...</span>
                            ) : (
                                <>
                                    <span>Send OTP</span>
                                    <span className="material-symbols-outlined">send</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
