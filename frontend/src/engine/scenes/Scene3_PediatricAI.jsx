"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { MOTION_TOKENS } from '../tokens/motionTokens';
import { textWordVariants } from '../variants/motionVariants';

export default function Scene3_PediatricAI() {
  const { nextScene } = useSceneManager();
  const [step, setStep] = useState(1);
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // 6-Step Narrative Choreography Sequence with Ref-Backed NextScene Execution
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

  // Nutrient Analysis Indicators
  const nutrients = [
    { name: "Protein", status: "Optimal", color: "#22C55E", bg: "#DCFCE7" },
    { name: "Calcium", status: "Attention Needed", color: "#F59E0B", bg: "#FEF3C7" },
    { name: "Iron (Fe)", status: "Attention Needed", color: "#F59E0B", bg: "#FEF3C7" },
    { name: "Vitamin D", status: "Optimal", color: "#22C55E", bg: "#DCFCE7" },
    { name: "Fiber", status: "Optimal", color: "#22C55E", bg: "#DCFCE7" },
  ];

  // Personalized Recommendations
  const recommendations = [
    { text: "Increase calcium-rich foods like paneer and yogurt", icon: "restaurant", color: "#2563EB", bg: "#DBEAFE" },
    { text: "Include more leafy green vegetables in lunch", icon: "eco", color: "#22C55E", bg: "#DCFCE7" },
    { text: "Improve daily protein intake with eggs or lentils", icon: "fitness_center", color: "#F59E0B", bg: "#FEF3C7" },
    { text: "Maintain current fresh fruit intake pattern", icon: "check_circle", color: "#2563EB", bg: "#DBEAFE" },
  ];

  // Meal Plans
  const meals = [
    { title: "Breakfast", item: "Ragi Dosa & Boiled Egg", cal: "310 kcal", icon: "wb_twilight" },
    { title: "Lunch", item: "Dal Tadka, Rice & Spinach Salad", cal: "440 kcal", icon: "light_mode" },
    { title: "Dinner", item: "Paneer Curry & Whole Wheat Roti", cal: "390 kcal", icon: "dark_mode" },
    { title: "Snacks", item: "Roasted Makhana & Fresh Apple", cal: "140 kcal", icon: "cookie" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-12 max-w-6xl mx-auto select-none bg-white text-slate-900">
      
      {/* ── LEFT COLUMN: REAL NUTRIKIDS APP INTERFACE DASHBOARD (STEPS 1 - 6) ── */}
      <div className="relative w-full md:w-1/2 min-h-[340px] md:min-h-[500px] flex flex-col justify-between p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-[0_20px_45px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Child Profile Header Card */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
              AA
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-extrabold text-slate-900">Aarav's Nutrition Profile</span>
              <span className="text-[11px] font-semibold text-slate-500">Age: 5 yrs • Height: 112 cm • Weight: 19.5 kg</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
            Active Tracking
          </span>
        </div>

        {/* Dynamic Card Container for Steps 1 - 6 */}
        <div className="relative my-auto space-y-3 py-2 z-10">
          
          {/* Step 1 & 2: Nutrition Analysis Card */}
          {step >= 1 && step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nutrition Analysis</span>
                <span className="text-[10px] font-bold text-blue-600">Daily Absorbed Log</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {nutrients.map((n, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold"
                    style={{ backgroundColor: n.bg, color: n.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                    {n.name}: {n.status}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 & 4: Personalized Recommendations Cards */}
          {step >= 2 && step < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="space-y-2 text-left"
            >
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                Personalized Recommendations
              </span>
              {recommendations.slice(0, 2).map((rec, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: rec.bg, color: rec.color }}>
                    <span className="material-symbols-outlined text-sm">{rec.icon}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-800">{rec.text}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Step 4 & 5: Integrated AI Nutrition Assistant Chat Response */}
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-left space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-600">smart_toy</span>
                <span className="text-xs font-extrabold text-blue-900">AI Nutrition Assistant</span>
              </div>
              <div className="p-2 rounded-xl bg-white text-xs font-semibold text-slate-700 shadow-sm border border-slate-200/50">
                <strong className="text-blue-600 block mb-0.5">Parent: "What should I pack for tomorrow's lunch?"</strong>
                "Pack Paneer Butter Masala with 1 Roti and sliced cucumbers to boost calcium and protein absorption."
              </div>
            </motion.div>
          )}

          {/* Step 5 & 6: Meal Recommendations Grid */}
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_TOKENS.duration.medium }}
              className="grid grid-cols-2 gap-2 text-left"
            >
              {meals.slice(0, 2).map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase">
                    <span>{m.title}</span>
                    <span className="text-blue-600">{m.cal}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 block mt-1">{m.item}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Footer App Status */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500 font-semibold z-10">
          <span>NutriKids Health Engine</span>
          <span className="text-emerald-600 font-bold">✓ Real-time Guidance Active</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: NARRATIVE TYPOGRAPHY (PERSISTENT & CRISP) ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left mt-8 md:mt-0 pl-0 md:pl-10">
        <span className="inline-block w-fit px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
          Step 03 • Pediatric AI Assistance
        </span>

        {/* Persistent Headline & Subheading */}
        <motion.div
          variants={textWordVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.12] font-display">
            Personalized nutrition guidance <span className="text-blue-600">powered by trusted AI</span>.
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Helping parents make informed, stress-free nutrition decisions every single day with tailored meal plans and real-time guidance.
          </p>
        </motion.div>

        {/* Transition Action Button */}
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
            <span>Explore Medical Trust</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
