"use client";

import { useState, useEffect } from 'react';
import {  useRouter,    } from 'next/navigation';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth';
import { resend2FA } from '../../api/auth.api';
import { motion } from 'framer-motion';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // 2FA state variables
    const [is2faPending, setIs2faPending] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const { login, verify2FA } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);

    // Prevent landing page from running initial animations on back navigation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('has_loaded', 'true');
        }
    }, []);

    // Resend countdown timer
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        try {
            const result = await login(email, password, rememberMe);
            if (result && result.twoFactorRequired) {
                setIs2faPending(true);
                setPendingEmail(result.email);
                setResendCooldown(60);
            } else if (result) {
                if (result.role === 'parent') navigate('/parent/dashboard');
                else if (result.role === 'doctor') navigate('/doctor/dashboard');
                else if (result.role === 'dietitian') navigate('/dietitian/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setVerifying(true);
        try {
            const user = await verify2FA(pendingEmail, otp, rememberMe);
            if (user.role === 'parent') navigate('/parent/dashboard');
            else if (user.role === 'doctor') navigate('/doctor/dashboard');
            else if (user.role === 'dietitian') navigate('/dietitian/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setSuccessMessage('');
        setResending(true);
        try {
            await resend2FA(pendingEmail);
            setSuccessMessage('A new verification code has been sent.');
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark text-[#0d161b] dark:text-slate-100">
            {/* Back to Home Button at Top Left */}
            <div className="absolute top-6 left-6 z-30">
                <Link href="/" className="group flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#4c799a] dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800 rounded-full px-3 md:px-4 py-2 shadow-md">
                    <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    <span>Back to Home</span>
                </Link>
            </div>



            {/* Left Side: Mascot & Brand (Playful) */}
            <div className="hidden lg:flex w-1/2 h-full flex-col justify-center items-center bg-primary/10 dark:bg-primary/5 p-8 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-green-200/30 dark:bg-green-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-md flex flex-col items-center">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl relative mt-10 mb-8">
                        {/* Restored Picture Mascot */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5iFQF5PvsrBF5KoKLWA0Pab87ovOtRxXtk-paD_POUwT3mSt2bXLFcpL57AVszQ6AAwq4lqrWi7iX_e-TsQw1D66wzy54-s_vRDetO8JqDGJcLFx3tgsxgb6MVwhzxuTbSZhOMgZQ1r7dZX_y8nbWqhoS0Bkvh1JKLwOuxi9qPau02n7KXIIkbI0GNuhl8wPLWsjl4PZ4D6eJZpQhXsKPPqFeXo9mRPa3vgFlLl3sUNzteYIdaVS7tFXnptkfdxAYkLntMvUzYw8')" }}></div>
                        <div className="pt-12">
                            <h2 className="text-2xl font-extrabold text-[#0d161b] dark:text-white mb-2">Welcome back!</h2>
                            <p className="text-[#4c799a] dark:text-slate-400 text-sm leading-relaxed">
                                Ready for another healthy day? Let's make nutrition a fun adventure together.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form (Clean & Soft with Glass Finish) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center px-4 py-12 md:py-20 lg:py-8 overflow-y-auto scrollbar-hide relative bg-slate-50/50 dark:bg-slate-950/10">
                {/* Background glowing gradients behind glass card for premium effect */}
                <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-[440px] bg-white/40 dark:bg-slate-900/45 backdrop-blur-xl p-8 rounded-[2rem] border border-white/25 dark:border-slate-800/55 shadow-2xl relative z-10 my-auto">

                    <header className="mb-6 lg:hidden">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Link href="/?loader=true">
                                <img src="/logo.png" alt="NutriKids Logo" className="h-16 w-auto object-contain" />
                            </Link>
                        </div>
                        <h1 className="text-2xl font-black text-[#0d161b] dark:text-white leading-tight text-center">
                            {is2faPending ? 'Security Verification' : 'Nice to see you again!'}
                        </h1>
                    </header>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 mb-4 text-xs bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg"
                        >
                            {error}
                        </motion.div>
                    )}

                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 mb-4 text-xs bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg"
                        >
                            {successMessage}
                        </motion.div>
                    )}

                    {is2faPending ? (
                        <>
                            <div className="hidden lg:block mb-6">
                                <h1 className="text-3xl font-black text-[#0d161b] dark:text-white leading-tight mb-1">Verification</h1>
                                <p className="text-sm text-[#4c799a] dark:text-slate-400">Please enter the 6-digit authentication code sent to your registered credentials.</p>
                            </div>

                            <form onSubmit={handleVerifyOTP} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[#0d161b] dark:text-slate-200 text-xs font-bold ml-1">Verification Code</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c799a] text-lg">security</span>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-lg text-center tracking-[0.5em] font-black text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 placeholder:tracking-normal font-medium"
                                            placeholder="000000"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#4c799a] dark:text-slate-400 ml-1">
                                        Code sent to: <strong className="text-slate-700 dark:text-slate-200">{pendingEmail}</strong>
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={verifying || otp.length !== 6}
                                    className={`w-full py-3 text-white font-bold text-base rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 ${
                                        otp.length === 6 
                                            ? 'bg-primary hover:bg-primary/90 shadow-primary/25' 
                                            : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    <span>{verifying ? 'Verifying...' : 'Let\'s Go!'}</span>
                                    {!verifying && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                                </button>

                                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                                    {resendCooldown > 0 ? (
                                        <span className="text-xs text-[#4c799a] dark:text-slate-400 font-medium">
                                            Resend code in <strong className="text-primary">{resendCooldown}s</strong>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={resending}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            {resending ? 'Sending...' : 'Resend Verification Code'}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIs2faPending(false);
                                            setOtp('');
                                            setError('');
                                            setSuccessMessage('');
                                        }}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors mt-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Back to sign in
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="hidden lg:block mb-6">
                                <h1 className="text-3xl font-black text-[#0d161b] dark:text-white leading-tight mb-1">Sign In</h1>
                                <p className="text-sm text-[#4c799a] dark:text-slate-400">Enter your details to access your account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[#0d161b] dark:text-slate-200 text-xs font-bold ml-1">Email Address</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c799a] text-lg">alternate_email</span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-sm text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="e.g. happy_parent@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[#0d161b] dark:text-slate-200 text-xs font-bold">Password</label>
                                        <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c799a] text-lg">lock</span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-sm text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                            onMouseDown={() => setShowPassword(true)}
                                            onMouseUp={() => setShowPassword(false)}
                                            onMouseLeave={() => setShowPassword(false)}
                                            onBlur={() => setShowPassword(false)}
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {showPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-1">
                                    <input 
                                        type="checkbox" 
                                        id="remember" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20" 
                                    />
                                    <label htmlFor="remember" className="text-xs font-medium text-[#4c799a] dark:text-slate-400 select-none cursor-pointer">Stay logged in to receive health updates and reminders for your child.</label>
                                </div>

                                <button type="submit" className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                                    <span>Let's Go!</span>
                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs text-[#4c799a] dark:text-slate-400 font-medium">
                            New to the NutriKid family?
                            <Link href="/register" className="text-primary font-bold hover:underline ml-1">Create an account</Link>
                        </p>
                    </div>

                    <footer className="mt-6 flex justify-center gap-6 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-primary transition-colors">Support</a>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default Login;
