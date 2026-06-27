"use client";
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

const SimpleNavbar = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="fixed top-0 z-50 w-full px-4 py-4 md:px-20 lg:px-40 pointer-events-none">
            <nav className="glass-nav inline-flex items-center gap-4 rounded-full border border-white/20 px-6 py-3 shadow-lg dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl pointer-events-auto transition-colors">
                <a href="/?loader=true" className="flex items-center -my-8" style={{ transform: 'translateY(-10px)' }}>
                    <img src="/logo.png" alt="NutriKids Logo" className="h-28 w-auto object-contain transition-transform hover:scale-105 duration-300" />
                </a>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <button
                    onClick={toggleTheme}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 flex items-center justify-center"
                    aria-label="Toggle Theme"
                >
                    <span className="material-symbols-outlined text-lg">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>
            </nav>
        </header>
    );
};

export default SimpleNavbar;
