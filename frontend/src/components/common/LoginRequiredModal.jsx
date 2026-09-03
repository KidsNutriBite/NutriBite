"use client";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const LoginRequiredModal = ({ isOpen, onClose, actionName = 'this feature' }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 overflow-hidden text-center"
                >
                    {/* Background subtle glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Lock Icon */}
                    <div className="relative mx-auto mb-5 size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                    </div>

                    {/* Title & Body */}
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Login Required
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        You are currently exploring NutriKids in <strong className="text-slate-800 dark:text-slate-200">Guest Mode</strong>.
                        To use <strong className="text-primary">{actionName}</strong> and save your child's nutrition records, please log in or create an account.
                    </p>

                    {/* Buttons */}
                    <div className="mt-6 flex flex-col gap-2.5">
                        <Link
                            href="/login"
                            className="w-full py-3 px-5 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Login to Account</span>
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
