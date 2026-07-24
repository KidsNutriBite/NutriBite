"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene2_GrowthIntelligence() {
  const { nextScene } = useSceneManager();
  const [step, setStep] = useState(1);
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // 6-Step Narrative Choreography
  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 1800);
    const t2 = setTimeout(() => setStep(3), 3800);
    const t3 = setTimeout(() => setStep(4), 6000);
    const t4 = setTimeout(() => setStep(5), 8500);
    const t5 = setTimeout(() => setStep(6), 11000);
    const t6 = setTimeout(() => {
      if (nextSceneRef.current) {
        nextSceneRef.current();
      }
    }, 14000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const milestones = [
    { label: "Height Velocity", val: "+6.8 cm", icon: "straighten", color: "#2563EB", bg: "#DBEAFE", delay: 0.1 },
    { label: "Weight Balance", val: "Optimal 55th %", icon: "monitor_weight", color: "#22C55E", bg: "#DCFCE7", delay: 0.3 },
    { label: "Daily Energy", status: "Peak Vitality", icon: "bolt", color: "#F59E0B", bg: "#FEF3C7", delay: 0.5 },
    { label: "Immunity Defense", status: "Strong Reserve", icon: "shield", color: "#2563EB", bg: "#DBEAFE", delay: 0.7 },
    { label: "Cognitive Focus", status: "Enhanced Learning", icon: "psychology", color: "#22C55E", bg: "#DCFCE7", delay: 0.9 },
    { label: "Child Confidence", status: "Active & Happy", icon: "sentiment_very_satisfied", color: "#F59E0B", bg: "#FEF3C7", delay: 1.1 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-14 max-w-6xl mx-auto select-none bg-white text-slate-900">
      
      {/* ── LEFT COLUMN: 180-DAY LIVING GROWTH TRAJECTORY CANVAS (STEPS 1 - 4) ── */}
      <div className="relative w-full md:w-1/2 min-h-[320px] md:min-h-[460px] flex flex-col justify-between p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        
        {/* Header Readout */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 font-sans">
              180-Day Personalized Growth Trajectory
            </span>
          </div>
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-mono">
            Day {step >= 4 ? 180 : Math.min(180, step * 45)}
          </span>
        </div>

        {/* Dynamic SVG Growth Path Overlay */}
        <div className="relative w-full h-52 my-auto z-10">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 360 140" fill="none">
            <defs>
              <linearGradient id="nutriGrowthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="60%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            {/* Grid Line Marks */}
            <line x1="0" y1="120" x2="360" y2="120" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="0" y1="70" x2="360" y2="70" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="0" y1="20" x2="360" y2="20" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />

            {/* Step 3: Unmonitored Grey Growth Path (Slow, Uneven) */}
            {step >= 3 && (
              <motion.path
                d="M 10 115 Q 120 105, 220 90 T 350 80"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            )}

            {/* Step 3 & 4: NutriKids Personalized Growth Ribbon (Vibrant Blue & Green Curve) */}
            {step >= 2 && (
              <motion.path
                d="M 10 115 Q 110 90, 200 50 T 350 15"
                stroke="url(#nutriGrowthGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </svg>

          {/* Step 4: Day 180 Growth Milestone Callouts */}
          {step >= 4 && (
            <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-2 pointer-events-none p-2">
              {milestones.slice(0, 3).map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: MOTION_TOKENS.duration.fast, delay: m.delay }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm"
                >
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: m.bg, color: m.color }}>
                    <span className="material-symbols-outlined text-sm">{m.icon}</span>
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-500 leading-none">{m.label}</span>
                    <span className="text-[11px] font-extrabold text-slate-900 leading-tight mt-0.5">{m.val || m.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Trajectory Legend */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-1 bg-slate-400 rounded-full" />
            <span className="text-slate-500 font-semibold">Standard Path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" />
            <span className="text-blue-600 font-extrabold">NutriKids AI Path (+62%)</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: NARRATIVE TYPOGRAPHY (PERSISTENT & CRISP) ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left mt-8 md:mt-0 pl-0 md:pl-10">
        <span className="inline-block w-fit px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4">
          Step 02 • Growth Intelligence
        </span>

        {/* Persistent Headline & Subheading */}
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.12] font-display">
            Small nutrition choices create <span className="text-emerald-600">lifelong growth</span>.
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Every recommendation adapts to your child's unique biological needs, converting daily meal logs into 180-day growth velocity.
          </p>
        </motion.div>

        {/* Milestone Badges Grid (Height, Weight, Energy, Immunity, Learning, Confidence) */}
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_TOKENS.duration.medium, delay: 0.3 }}
            className="grid grid-cols-2 gap-2.5 mt-6"
          >
            {milestones.slice(3).map((m, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
                  <span className="material-symbols-outlined text-base">{m.icon}</span>
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-500 leading-none">{m.label}</span>
                  <span className="text-[11px] font-extrabold text-slate-900 leading-tight mt-0.5">{m.status}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Transition Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION_TOKENS.duration.medium, delay: 0.4 }}
          className="mt-8 flex items-center gap-4"
        >
          <button
            onClick={() => nextSceneRef.current && nextSceneRef.current()}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_8px_20px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Explore Pediatric AI</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
