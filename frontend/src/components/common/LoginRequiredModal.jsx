"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const LoginRequiredModal = ({ isOpen, onClose, actionName = 'this feature', featureDescription }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 overflow-hidden text-center selection:bg-primary/20"
                >
                    {/* Background subtle radial ambient glows */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>

                    {/* Lock Badge Icon */}
                    <div className="relative mx-auto mb-4 size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shadow-inner ring-1 ring-primary/20">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                        </span>
                    </div>

                    {/* Title & Body */}
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2">
                        Guest Mode Preview
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        Unlock {actionName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {featureDescription || (
                            <>
                                You are currently exploring NutriKid in <strong className="text-slate-800 dark:text-slate-200">Guest Mode</strong>.
                                Sign in or create a parent account to save your child’s health records, get tailored dietary plans, and consult doctors.
                            </>
                        )}
                    </p>

                    {/* Quick Feature Perks */}
                    <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                            <span>Track multiple children with WHO growth curves</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                            <span>AI-powered clinical deficiency analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                            <span>Direct pediatric & dietitian telehealth consultations</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5">
                        <Link
                            href="/login"
                            className="w-full py-3 px-5 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Sign In to Account</span>
                            <span className="material-symbols-outlined text-base">login</span>
                        </Link>

                        <Link
                            href="/register"
                            className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <span>Create Free Account</span>
                            <span className="material-symbols-outlined text-base">person_add</span>
                        </Link>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 transition-colors"
                        >
                            Continue Exploring Demo
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LoginRequiredModal;
