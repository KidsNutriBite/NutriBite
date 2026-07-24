"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene1_HiddenReality() {
  const { nextScene } = useSceneManager();
  const [step, setStep] = useState(1);
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // 5-Step Choreography Sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1800);
    const timer2 = setTimeout(() => setStep(3), 3800);
    const timer3 = setTimeout(() => setStep(4), 6000);
    const timer4 = setTimeout(() => setStep(5), 8500);
    const timer5 = setTimeout(() => {
      if (nextSceneRef.current) {
        nextSceneRef.current();
      }
    }, 11500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  const nutrients = [
    { name: "Protein", status: "Optimal Level", color: "#22C55E", isGap: false, top: "20%", left: "18%", bg: "#DCFCE7", delay: 0.2 },
    { name: "Calcium", status: "85% Absorbed", color: "#2563EB", isGap: false, top: "68%", left: "22%", bg: "#DBEAFE", delay: 0.4 },
    { name: "Iron (Fe)", status: "Hidden Gap", color: "#64748B", isGap: true, top: "24%", left: "68%", bg: "#F1F5F9", delay: 0.6 },
    { name: "Vitamin D3", status: "Sub-optimal", color: "#F59E0B", isGap: true, top: "72%", left: "62%", bg: "#FEF3C7", delay: 0.8 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-14 max-w-6xl mx-auto select-none bg-white text-slate-900">
      {/* ── LEFT COLUMN: HEALTHY MEAL & SOFT MEDICAL SCAN (STEPS 1 - 3) ── */}
      <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-[440px] flex items-center justify-center">
        {/* Step 1: Warm Comfortable Meal Graphic Container */}
        <motion.div
          animate={{
            scale: step === 1 ? [1, 1.03, 1] : 1,
            opacity: step === 5 ? 0.4 : 1,
          }}
          transition={{ duration: MOTION_TOKENS.duration.slow, ease: MOTION_TOKENS.easing.bioIn }}
          className="relative w-64 h-64 md:w-84 md:h-84 rounded-full overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] bg-slate-50"
        >
          <img
            src="/indian_food.jpg"
            alt="Healthy Indian Thali Meal"
            className="w-full h-full object-cover scale-105"
          />
        </motion.div>

        {/* Step 2: Soft Light Blue Medical Scan Beam */}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{
              opacity: { duration: MOTION_TOKENS.duration.medium },
              rotate: { duration: 7, ease: "linear", repeat: Infinity },
            }}
            className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full border border-blue-200 pointer-events-none flex items-center justify-center"
          >
            <div className="w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/20 via-blue-500/05 to-transparent origin-bottom-right rounded-tl-full" />
          </motion.div>
        )}

        {/* Step 3: Green Nutrients, Orange Vitamins & Grey Deficiencies */}
        {step >= 3 && nutrients.map((n, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8, y: 14 }}
            animate={{
              opacity: step === 5 ? 0.6 : 1,
              scale: 1,
              y: [0, -5, 0],
            }}
            transition={{
              opacity: { duration: MOTION_TOKENS.duration.medium, delay: n.delay },
              scale: { duration: MOTION_TOKENS.duration.medium, delay: n.delay },
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: n.delay },
            }}
            style={{ top: n.top, left: n.left }}
            className="absolute z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
          >
            <span
              className="w-3 h-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: n.bg }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-extrabold text-slate-900 leading-none">{n.name}</span>
              <span className="text-[10px] font-bold leading-tight mt-0.5" style={{ color: n.color }}>
                {n.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── RIGHT COLUMN: CLEAN NARRATIVE TYPOGRAPHY (PERSISTENT & CRISP) ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left mt-8 md:mt-0 pl-0 md:pl-10">
        <span className="inline-block w-fit px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
          Step 01 • The Hidden Reality
        </span>

        {/* Persistent Typography */}
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.12] font-display">
            What if full plates still leave <span className="text-blue-600">hidden gaps</span>?
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Most parents track what their child eats. Very few know what their child’s body is actually absorbing at a bio-nutritional level.
          </p>
        </motion.div>

        {/* Continuous Journey Auto-Advance Action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION_TOKENS.duration.medium, delay: 0.3 }}
          className="mt-8 flex items-center gap-4"
        >
          <button
            onClick={() => nextSceneRef.current && nextSceneRef.current()}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Continue Journey</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
