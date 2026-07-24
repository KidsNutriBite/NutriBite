"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene4_MedicalTrust() {
  const { nextScene } = useSceneManager();
  const [step, setStep] = useState(1);
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // 6-Step Narrative Choreography Sequence with Ref-Backed Execution
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

  // Connected Journey Stages
  const journeyStages = [
    { title: "Nutrition Analysis", desc: "Absorbed Macro/Micro Log", icon: "analytics", color: "#2563EB", bg: "#DBEAFE" },
    { title: "AI Recommendations", desc: "Tailored Food Guidance", icon: "auto_awesome", color: "#22C55E", bg: "#DCFCE7" },
    { title: "Book Consultation", desc: "Certified Pediatricians", icon: "event", color: "#F59E0B", bg: "#FEF3C7" },
    { title: "Doctor Care Plan", desc: "Prescriptions & Notes", icon: "medical_services", color: "#2563EB", bg: "#DBEAFE" },
    { title: "Track Progress", desc: "180-Day Velocity Curve", icon: "trending_up", color: "#22C55E", bg: "#DCFCE7" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-12 max-w-6xl mx-auto select-none bg-white text-slate-900 opacity-100">
      
      {/* ── LEFT COLUMN: NUTRITION REPORT, DOCTOR TELECONSULTATION & DASHBOARD (STEPS 1 - 6) ── */}
      <div className="relative w-full md:w-1/2 min-h-[340px] md:min-h-[500px] flex flex-col justify-between p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-[0_20px_45px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Header Readout */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 font-sans">
              NutriKids Clinical & Doctor Network
            </span>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono">
            HIPAA Compliant
          </span>
        </div>

        {/* Dynamic Card Container for Steps 1 - 6 */}
        <div className="relative my-auto space-y-3 py-2 z-10">
          
          {/* Step 1 & 2: Nutrition Summary Report Card */}
          {step >= 1 && step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 uppercase">Clinical Summary Report</span>
                  <span className="text-[10px] font-semibold text-slate-500">Child: Aarav • Review: July 2026</span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">Verified</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[9px]">GROWTH STATUS</span>
                  <strong className="text-slate-900">55th Percentile (Optimal)</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[9px]">NEXT CLINIC REVIEW</span>
                  <strong className="text-emerald-600">In 28 Days</strong>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 & 3: Doctor Teleconsultation Appointment Module */}
          {step >= 2 && step < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    Dr
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-900">Dr. Sarah Miller, MD</span>
                    <span className="text-[10px] font-semibold text-slate-500">Pediatric Nutrition Specialist</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                  Confirmed
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="material-symbols-outlined text-base text-blue-600">video_camera_front</span>
                  <span>Teleconsultation • Tomorrow, 4:00 PM</span>
                </div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Join Link</span>
              </div>
            </motion.div>
          )}

          {/* Step 4 & 5: Connected Healthcare Journey Horizontal Flow */}
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="space-y-1.5 text-left"
            >
              <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                Connected Care Workflow
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {journeyStages.map((st, idx) => (
                  <div key={idx} className="p-1.5 rounded-xl bg-white border border-slate-200/70 shadow-sm flex flex-col items-center justify-center gap-1">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]" style={{ backgroundColor: st.bg, color: st.color }}>
                      <span className="material-symbols-outlined text-xs">{st.icon}</span>
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-800 leading-tight">{st.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5 & 6: Real Parent Dashboard Layout Preview */}
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left space-y-2"
            >
              <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block">
                Parent Dashboard Hub
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 font-bold">
                  Child Profiles
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 font-bold">
                  Growth Velocity
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 font-bold">
                  Teleconsultations
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer App Status */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500 font-semibold z-10">
          <span>Doctor Connected Platform</span>
          <span className="text-blue-600 font-bold">✓ End-to-End Care Active</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: TRUST HEADLINE & REALISTIC COPY (PERSISTENT & CRISP) ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left mt-8 md:mt-0 pl-0 md:pl-10">
        <span className="inline-block w-fit px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
          Step 04 • Clinical Trust & Care
        </span>

        {/* Persistent Headline & Copy */}
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.12] font-display">
            Your child's nutrition journey, <span className="text-blue-600">all in one trusted platform</span>.
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Personalized nutrition insights, growth tracking, AI guidance and certified pediatrician teleconsultations—designed to help parents make informed decisions with confidence.
          </p>
        </motion.div>

        {/* Transition Button into Scene 5 */}
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
            <span>Explore Kids Universe</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
