"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene5_KidsUniverse() {
  const { nextScene } = useSceneManager();
  const [step, setStep] = useState(1);
  const [highlightModule, setHighlightModule] = useState(0);
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // 6-Step Narrative Choreography Sequence
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

  // Handle 1-second Module Highlight Rotation during Step 3
  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setHighlightModule(prev => (prev + 1) % 5);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Real NutriKids Ecosystem Modules
  const platformModules = [
    { title: "Child Profiles", desc: "Age, Height, Weight & Allergies", icon: "person", color: "#2563EB", bg: "#DBEAFE" },
    { title: "Nutrition Analysis", desc: "Absorbed Macro/Micro Log", icon: "analytics", color: "#22C55E", bg: "#DCFCE7" },
    { title: "Growth Monitoring", desc: "180-Day Velocity Trajectory", icon: "trending_up", color: "#F59E0B", bg: "#FEF3C7" },
    { title: "AI Nutrition Assistant", desc: "Real-time Meal Guidance", icon: "smart_toy", color: "#2563EB", bg: "#DBEAFE" },
    { title: "Teleconsultation", desc: "Certified Pediatricians", icon: "video_camera_front", color: "#22C55E", bg: "#DCFCE7" },
    { title: "Resources Library", desc: "Doctor-Approved Guides", icon: "auto_stories", color: "#F59E0B", bg: "#FEF3C7" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-12 max-w-6xl mx-auto select-none bg-white text-slate-900">
      
      {/* ── LEFT COLUMN: REAL NUTRIKIDS PLATFORM ECOSYSTEM (STEPS 1 - 4) ── */}
      <div className="relative w-full md:w-1/2 min-h-[340px] md:min-h-[500px] flex flex-col justify-between p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-[0_20px_45px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Header Readout */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 font-sans">
              All-In-One Pediatric Health Platform
            </span>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-mono">
            Single Ecosystem
          </span>
        </div>

        {/* Dynamic Card Canvas for Steps 1 - 4 */}
        <div className="relative my-auto space-y-3 py-2 z-10">
          
          {/* Step 1 - 3: Staggered Ecosystem Feature Cards Grid */}
          {step < 4 && (
            <div className="grid grid-cols-2 gap-2.5 text-left">
              {platformModules.map((mod, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: step === 3 && highlightModule === idx % 5 ? 1.05 : 1,
                    borderColor: step === 3 && highlightModule === idx % 5 ? mod.color : "#E2E8F0",
                  }}
                  transition={{ duration: MOTION_TOKENS.duration.fast, delay: idx * 0.1 }}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs" style={{ backgroundColor: mod.bg, color: mod.color }}>
                      <span className="material-symbols-outlined text-sm">{mod.icon}</span>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mod.color }} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 leading-tight mt-1">{mod.title}</span>
                  <span className="text-[10px] font-medium text-slate-500 leading-tight">{mod.desc}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Step 4 & 5: Reorganized Master Unified Dashboard */}
          {step >= 4 && step < 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 uppercase">NutriKids Parent Master Hub</span>
                <span className="text-[10px] font-bold text-blue-600">Unified Portal</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-700">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">Profiles</div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">Growth</div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">AI Assistant</div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">Doctors</div>
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">Meal Plans</div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">Reports</div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Centered NutriKids Logo Assembly */}
          {step >= 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-24 h-24 flex items-center justify-center mb-2">
                <img src="/logo.png" alt="NutriKids Logo" className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.12)]" />
              </div>
              <span className="text-lg font-black text-slate-900 font-display">NutriKids</span>
            </motion.div>
          )}
        </div>

        {/* Footer App Status */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500 font-semibold z-10">
          <span>Unified Pediatric Engine</span>
          <span className="text-blue-600 font-bold">✓ Single Platform Solution</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: NARRATIVE TYPOGRAPHY (STEPS 1 - 6) ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left mt-8 md:mt-0 pl-0 md:pl-10">
        <span className="inline-block w-fit px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4">
          Step 05 • Complete Platform Ecosystem
        </span>

        {/* Headline & Subheading */}
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.12] font-display">
            Everything your child's <span className="text-emerald-600">nutrition journey needs</span>.
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Track growth, receive personalized recommendations, connect with healthcare professionals and manage every step in one unified platform.
          </p>
        </motion.div>

        {/* Step 6: Final Narrative Transition Action */}
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
            <span>Complete Journey</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
