
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import SimpleNavbar from '../../components/common/SimpleNavbar';

const Register = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        title: '',
        name: '',
        email: '',
        password: '',
        role: 'parent',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam && (roleParam === 'parent' || roleParam === 'doctor')) {
            setFormData(prev => ({ ...prev, role: roleParam }));
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await register(formData);
            if (user.role === 'parent') navigate('/parent/dashboard');
            else if (user.role === 'doctor') navigate('/doctor/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="relative flex h-screen w-full flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark text-[#0d161b] dark:text-slate-100">
            <SimpleNavbar />
            {/* Left Side: Mascot & Brand (Reuse from Login or slightly modified) */}
            <div className="hidden lg:flex w-1/2 h-full flex-col justify-center items-center bg-primary/10 dark:bg-primary/5 p-12 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-green-200/30 dark:bg-green-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-8 flex justify-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 text-primary">
                                <span className="material-symbols-outlined text-4xl">nutrition</span>
                            </div>
                            {/* <h1 className="text-2xl font-black text-primary tracking-tight">NutriKid</h1> */}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl relative mt-12 mb-10">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5iFQF5PvsrBF5KoKLWA0Pab87ovOtRxXtk-paD_POUwT3mSt2bXLFcpL57AVszQ6AAwq4lqrWi7iX_e-TsQw1D66wzy54-s_vRDetO8JqDGJcLFx3tgsxgb6MVwhzxuTbSZhOMgZQ1r7dZX_y8nbWqhoS0Bkvh1JKLwOuxi9qPau02n7KXIIkbI0GNuhl8wPLWsjl4PZ4D6eJZpQhXsKPPqFeXo9mRPa3vgFlLl3sUNzteYIdaVS7tFXnptkfdxAYkLntMvUzYw8')" }}></div>
                        <div className="pt-16">
                            <h2 className="text-3xl font-extrabold text-[#0d161b] dark:text-white mb-4">Join the fun!</h2>
                            <p className="text-[#4c799a] dark:text-slate-400 text-lg leading-relaxed">
                                Create an account to start tracking, learning, and growing healthy habits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-4 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-[420px]">
                    <header className="mb-3 text-center lg:text-left">
                        <h1 className="text-xl font-black text-[#0d161b] dark:text-white leading-tight mb-0.5">Create Account</h1>
                        <p className="text-xs text-[#4c799a] dark:text-slate-400">Choose your account type to get started</p>
                    </header>

                    {error && (
                        <div className="p-2 mb-3 text-xs bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                            {error}
                        </div>
                    )}

                    {/* Role Selector */}
                    <div className="flex p-1 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <label className="flex-1 cursor-pointer group">
                            <input
                                type="radio"
                                name="role"
                                value="parent"
                                checked={formData.role === 'parent'}
                                onChange={() => handleRoleChange('parent')}
                                className="hidden peer"
                            />
                            <div className="flex items-center justify-center gap-2 py-2 rounded-md text-xs text-[#4c799a] dark:text-slate-400 font-semibold transition-all peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm">
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">family_history</span>
                                <span>Parent</span>
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer group">
                            <input
                                type="radio"
                                name="role"
                                value="doctor"
                                checked={formData.role === 'doctor'}
                                onChange={() => handleRoleChange('doctor')}
                                className="hidden peer"
                            />
                            <div className="flex items-center justify-center gap-2 py-2 rounded-md text-xs text-[#4c799a] dark:text-slate-400 font-semibold transition-all peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm">
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">medical_services</span>
                                <span>Doctor</span>
                            </div>
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="space-y-2">
                            {/* Common Fields */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-1 space-y-0.5">
                                    <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Title</label>
                                    <div className="relative">
                                        <select
                                            name="title"
                                            value={formData.title || ''}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-2 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium appearance-none"
                                        >
                                            <option value="" disabled>Title</option>
                                            <option value="Mr">Mr</option>
                                            <option value="Ms">Ms</option>
                                            <option value="Mrs">Mrs</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">expand_more</span>
                                    </div>
                                </div>
                                <div className="col-span-3 space-y-0.5">
                                    <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Full Name</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">person</span>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Email</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">alternate_email</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">lock</span>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="Create a strong password"
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                            {/* Dynamic Fields based on Role */}
                            {formData.role === 'parent' ? (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Phone</label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber || ''}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city || ''}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                placeholder="City"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Relationship</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">
                                                {formData.relationToChild === 'Mother' ? 'female' :
                                                    formData.relationToChild === 'Father' ? 'male' :
                                                        formData.relationToChild === 'Guardian' ? 'shield_person' : 'person'}
                                            </span>
                                            <select
                                                name="relationToChild"
                                                value={formData.relationToChild || ''}
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all font-medium appearance-none"
                                            >
                                                <option value="" disabled>Select Relationship</option>
                                                <option value="Mother">Mother</option>
                                                <option value="Father">Father</option>
                                                <option value="Guardian">Guardian</option>
                                                <option value="Caretaker">Caretaker</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">expand_more</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Specialization</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">stethoscope</span>
                                                <input
                                                    type="text"
                                                    name="specialization"
                                                    value={formData.specialization || ''}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                    placeholder="Pediatrician"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Hospital</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">local_hospital</span>
                                                <input
                                                    type="text"
                                                    name="hospitalName"
                                                    value={formData.hospitalName || ''}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                    placeholder="Hospital"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Exp (Yrs)</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">history_edu</span>
                                                <input
                                                    type="number"
                                                    name="experienceYears"
                                                    value={formData.experienceYears || ''}
                                                    onChange={handleChange}
                                                    required
                                                    min="0"
                                                    className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                    placeholder="5"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[#0d161b] dark:text-slate-200 text-[10px] uppercase font-bold ml-1">Med ID</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4c799a] text-base">badge</span>
                                                <input
                                                    type="text"
                                                    name="registrationId"
                                                    value={formData.registrationId || ''}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border compacted-input border-slate-200 dark:border-slate-700 rounded-lg text-xs text-[#0d161b] dark:text-white focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                    placeholder="ID"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-lg shadow-md shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1">
                            <span>Create Account</span>
                            <span className="material-symbols-outlined text-lg">person_add</span>
                        </button>
                    </form>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs text-[#4c799a] dark:text-slate-400 font-medium">
                            Already have an account?
                            <Link to="/login" className="text-primary font-bold hover:underline ml-1">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
