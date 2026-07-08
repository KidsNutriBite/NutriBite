"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthTransition = ({ type = 'login', onComplete }) => {
    const [phase, setPhase] = useState('rolling'); // rolling -> eating -> finished
    
    const isLogin = type === 'login';
    
    // Fruit and Kid details
    const fruitEmoji = isLogin ? '🍊' : '🍎';
    const fruitBorder = isLogin ? 'border-orange-400' : 'border-rose-400';
    const fruitBg = isLogin ? 'bg-orange-100 dark:bg-orange-950/40' : 'bg-rose-100 dark:bg-rose-950/40';
    
    const kidBg = isLogin ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-rose-50 dark:bg-rose-950/20';
    const kidBorder = isLogin ? 'border-orange-300' : 'border-rose-300';
    const kidText = isLogin ? 'text-orange-500' : 'text-rose-500';
    const kidLabel = isLogin ? 'text-orange-600' : 'text-rose-600';

    useEffect(() => {
        // Timeline:
        // 0.8s: Fruit rolls and hits kid.
        // 0.8s -> 1.2s (0.4s): Kid bounces/eats the fruit.
        // 1.2s -> 1.6s (0.4s): Entire overlay fades out.
        const timer1 = setTimeout(() => {
            setPhase('eating');
        }, 800);

        const timer2 = setTimeout(() => {
            setPhase('finished');
        }, 1200);

        const timer3 = setTimeout(() => {
            if (onComplete) onComplete();
        }, 1600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase !== 'finished' && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
                >
                    <div className="relative flex items-center justify-center w-full max-w-md h-40">
                        {/* The Rolling Fruit */}
                        {phase === 'rolling' && (
                            <motion.div
                                initial={{ x: '-50vw', rotate: 0 }}
                                animate={{ x: -20, rotate: 720 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`absolute w-16 h-16 ${fruitBg} rounded-full flex items-center justify-center border-2 ${fruitBorder} shadow-lg`}
                            >
                                <span className="text-3xl select-none">{fruitEmoji}</span>
                            </motion.div>
                        )}

                        {/* The Kid Avatar */}
                        <motion.div
                            initial={{ scale: 1 }}
                            animate={phase === 'eating' ? { scale: [1, 1.25, 0.95, 1.05, 1] } : { scale: 1 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className={`absolute left-[calc(50%+20px)] w-20 h-20 ${kidBg} rounded-full flex flex-col items-center justify-center border-2 border-dashed ${kidBorder} shadow-md`}
                        >
                            <span className={`material-symbols-outlined text-4xl ${kidText} select-none`}>
                                {phase === 'eating' ? 'mood' : 'child_care'}
                            </span>
                            <span className={`text-[10px] font-black uppercase mt-0.5 tracking-wider ${kidLabel} select-none`}>
                                {isLogin ? 'Login' : 'Join'}
                            </span>
                        </motion.div>
                    </div>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.6, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 tracking-wide uppercase select-none"
                    >
                        {isLogin ? 'Preparing your adventure...' : 'Creating your adventure...'}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AuthTransition;
