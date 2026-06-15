"use client";
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 transition-colors">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight text-primary dark:text-blue-400">NutriKid</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 flex items-center justify-center"
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>

                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:text-primary dark:hover:text-blue-400"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 text-sm font-bold text-white transition rounded-full bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
