"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    // Handle background opacity on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            // Scroll section highlighting (only on homepage)
            if (pathname === '/') {
                const sections = ['home', 'how-it-works', 'features'];
                const scrollPosition = window.scrollY + 200; // Offset

                for (const section of sections) {
                    const el = document.getElementById(section);
                    if (el) {
                        const top = el.offsetTop;
                        const height = el.offsetHeight;
                        if (scrollPosition >= top && scrollPosition < top + height) {
                            setActiveSection(section);
                            break;
                        }
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Handle hash links / smooth scroll
    const handleNavClick = (e, targetId) => {
        if (pathname === '/') {
            e.preventDefault();
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(targetId);
                setIsMobileMenuOpen(false);
            }
        } else {
            // Let normal Link navigation handle it, which will load '/' with '#targetId'
            setIsMobileMenuOpen(false);
        }
    };

    const isLinkActive = (href, targetSection) => {
        if (pathname === '/about' && href === '/about') return true;
        if (pathname === '/pricing' && href === '/pricing') return true;
        if (pathname === '/' && href === '/') {
            if (targetSection) {
                return activeSection === targetSection;
            }
            return activeSection === 'home';
        }
        return false;
    };

    // Navigation links configurations
    const navItems = [
        { label: 'Home', href: '/', sectionId: 'home' },
        { label: 'Features', href: '/#features', sectionId: 'features' },
        { label: 'About Us', href: '/about' },
        { label: 'Pricing', href: '/pricing' }
    ];

    return (
        <header className="fixed top-0 z-50 w-full px-4 py-4 md:px-8 lg:px-16 transition-all duration-300">
            <nav className={`mx-auto max-w-7xl flex items-center justify-between rounded-full border border-white/20 px-6 py-3 shadow-lg transition-all duration-300 ${
                scrolled 
                ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50' 
                : 'bg-white/60 dark:bg-slate-950/60 backdrop-blur-lg border-white/20 dark:border-white/10'
            }`}>
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 transition-transform group-hover:rotate-12 duration-300">
                        <span className="material-symbols-outlined text-[20px] font-bold">nutrition</span>
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white transition-colors duration-200 group-hover:text-primary">
                        NutriBite
                    </span>
                </Link>

                {/* Desktop Navigation Menu */}
                <div className="hidden md:flex flex-1 justify-center gap-8 lg:gap-10">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={item.sectionId ? (e) => handleNavClick(e, item.sectionId) : undefined}
                            className={`relative text-sm font-semibold transition-colors duration-300 py-1 ${
                                isLinkActive(item.href, item.sectionId)
                                    ? 'text-primary'
                                    : 'text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary'
                            }`}
                        >
                            {item.label}
                            {isLinkActive(item.href, item.sectionId) && (
                                <motion.span 
                                    layoutId="activeNavIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Side Buttons: Theme Toggle & Login/Register */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90 flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        aria-label="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>

                    <Link 
                        href="/login" 
                        className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                        Login
                    </Link>

                    <Link 
                        href="/register" 
                        className="flex min-w-[110px] cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        Register
                    </Link>
                </div>

                {/* Mobile Menu Actions (Theme toggle & Hamburger icon) */}
                <div className="flex md:hidden items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-600 dark:text-slate-300 rounded-full transition-all active:scale-90 flex items-center justify-center"
                        aria-label="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        aria-label="Toggle Mobile Menu"
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-4 right-4 mt-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col gap-5 z-40 md:hidden"
                    >
                        <div className="flex flex-col gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={item.sectionId ? (e) => handleNavClick(e, item.sectionId) : () => setIsMobileMenuOpen(false)}
                                    className={`text-base font-semibold py-2 px-3 rounded-xl transition-all duration-200 ${
                                        isLinkActive(item.href, item.sectionId)
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-primary'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex h-11 items-center justify-center rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Register
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
