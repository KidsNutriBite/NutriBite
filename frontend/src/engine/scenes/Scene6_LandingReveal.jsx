"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene6_LandingReveal() {
  const { onCompleteOnboarding } = useSceneManager();
  const [step, setStep] = useState(1);
  const onCompleteRef = useRef(onCompleteOnboarding);

  useEffect(() => {
    onCompleteRef.current = onCompleteOnboarding;
  }, [onCompleteOnboarding]);

  // 7-Step Grand Finale Reveal Sequence
  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 1800);
    const t2 = setTimeout(() => setStep(3), 3800);
    const t3 = setTimeout(() => setStep(4), 6000);
    const t4 = setTimeout(() => setStep(5), 8200);
    const t5 = setTimeout(() => setStep(6), 11000);
    const t7 = setTimeout(() => {
      if (typeof onCompleteRef.current === 'function') {
        onCompleteRef.current();
      }
    }, 13000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t7);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-white text-slate-900 overflow-hidden">
      
      {/* ── CELEBRATION DRIFTING PARTICLES (STEP 6) ── */}
      {step >= 5 && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "100vh", opacity: 0 }}
              animate={{ y: "-20vh", opacity: [0, 0.4, 0] }}
              transition={{
                duration: 6 + (i % 4),
                ease: "easeOut",
                delay: i * 0.2,
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${(i * 5.5) % 95}%`,
                backgroundColor: i % 3 === 0 ? "#2563EB" : i % 3 === 1 ? "#22C55E" : "#F59E0B",
              }}
            />
          ))}
        </div>
      )}

      {/* ── LOGO SCALE DOWN & SHIFT UPWARD (STEPS 1 - 3) ── */}
      <motion.div
        animate={{
          scale: step >= 3 ? 0.75 : step >= 1 ? 0.9 : 1,
          y: step >= 3 ? -35 : 0,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center justify-center mb-4"
      >
        <div className="w-24 sm:w-28 md:w-32 aspect-square flex items-center justify-center">
          <img
            src="/logo.png"
            alt="NutriKids Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.12)]"
          />
        </div>
      </motion.div>

      {/* ── PRODUCT IDENTITY & TAGLINE REVEAL (STEP 2) ── */}
      {step >= 2 && (
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="relative z-10 space-y-3 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight font-display">
            NutriKids
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Helping parents build healthier futures through personalized nutrition.
          </p>
        </motion.div>
      )}

      {/* ── LANDING PAGE HERO PREVIEW & CTAs (STEPS 4 & 5) ── */}
      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-10 flex flex-col items-center gap-6 max-w-xl mx-auto"
        >
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => typeof onCompleteRef.current === 'function' && onCompleteRef.current()}
              className="flex items-center gap-2 px-9 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_10px_25px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => typeof onCompleteRef.current === 'function' && onCompleteRef.current()}
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-extrabold text-xs uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore Features</span>
            </button>
          </div>

          {/* Settle Readout */}
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            Welcome to NutriKids • Live Application Ready
          </span>
        </motion.div>
      )}

    </div>
  );
}
