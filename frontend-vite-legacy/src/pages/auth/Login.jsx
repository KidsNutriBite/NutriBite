
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import SimpleNavbar from '../../components/common/SimpleNavbar';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(email, password, rememberMe);
            if (user.role === 'parent') navigate('/parent/dashboard');
            else if (user.role === 'doctor') navigate('/doctor/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="relative flex h-screen w-full flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark text-[#0d161b] dark:text-slate-100">
            <SimpleNavbar />
            {/* Left Side: Mascot & Brand (Playful) */}
            <div className="hidden lg:flex w-1/2 h-full flex-col justify-center items-center bg-primary/10 dark:bg-primary/5 p-8 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-green-200/30 dark:bg-green-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-6 flex justify-center">
                        {/* Logo Component */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 text-primary">
                                <span className="material-symbols-outlined text-4xl">nutrition</span>
                            </div>
                            {/* <h1 className="text-2xl font-black text-primary tracking-tight">NutriKid</h1> */}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl relative mt-10 mb-8">
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

            {/* Right Side: Auth Form (Clean & Soft) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[420px]">
                    <header className="mb-6 lg:hidden pt-12">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-8 h-8 text-primary">
                                <span className="material-symbols-outlined text-3xl">nutrition</span>
                            </div>
                            <h2 className="text-xl font-bold text-primary">NutriKid</h2>
                        </div>
                        <h1 className="text-2xl font-black text-[#0d161b] dark:text-white leading-tight text-center">Nice to see you again!</h1>
                    </header>

                    <div className="hidden lg:block mb-6">
                        <h1 className="text-3xl font-black text-[#0d161b] dark:text-white leading-tight mb-1">Sign In</h1>
                        <p className="text-sm text-[#4c799a] dark:text-slate-400">Enter your details to access your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 mb-4 text-xs bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
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

                        <div className="space-y-1">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[#0d161b] dark:text-slate-200 text-xs font-bold">Password</label>
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
                        <div className="flex justify-end px-1">
                            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                Forgot password?
                            </Link>
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

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs text-[#4c799a] dark:text-slate-400 font-medium">
                            New to the NutriKid family?
                            <Link to="/register" className="text-primary font-bold hover:underline ml-1">Create an account</Link>
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
