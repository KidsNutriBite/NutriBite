"use client";

import { motion } from "framer-motion";

export default function LivingGrowthGraph() {
  const milestones = [
    { day: "Day 30", label: "Iron Absorption +34%", val: "Height +1.8cm", top: "62%", left: "28%" },
    { day: "Day 90", label: "Immunity Milestone", val: "Optimal Velocity", top: "42%", left: "56%" },
    { day: "Day 180", label: "Target Growth Peak", val: "92nd Percentile", top: "18%", left: "82%" },
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] md:min-h-[300px] flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-950/50 border border-sky-500/20 backdrop-blur-md p-5 text-white">
      {/* Background Glow & Digital Twin Image Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/60 via-slate-950/80 to-sky-900/40 pointer-events-none" />
      <img
        src="/digital_twin.png"
        alt="Digital Twin Growth Visual"
        className="absolute right-0 bottom-0 w-44 md:w-56 opacity-25 object-cover pointer-events-none rounded-br-3xl"
      />

      {/* Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
            Digital Twin • 180-Day Predictive Trajectory
          </span>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200">
          AI Growth Engine v2.4
        </span>
      </div>

      {/* Main SVG Graph Container */}
      <div className="relative z-10 my-auto w-full h-40">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 360 140" fill="none">
          <defs>
            <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="0" y1="120" x2="360" y2="120" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="0" y1="80" x2="360" y2="80" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="0" y1="40" x2="360" y2="40" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

          {/* Standard Average Growth Curve (Dashed Baseline) */}
          <path
            d="M 10 115 Q 120 100, 220 85 T 350 70"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="5 5"
            fill="none"
          />

          {/* Animated Area Fill */}
          <motion.path
            d="M 10 115 Q 110 95, 200 60 T 350 20 L 350 130 L 10 130 Z"
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          />

          {/* AI Predicted Growth Velocity Line */}
          <motion.path
            d="M 10 115 Q 110 95, 200 60 T 350 20"
            stroke="url(#growthGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
          />
        </svg>

        {/* Milestone Callouts */}
        {milestones.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + idx * 0.3 }}
            style={{ top: m.top, left: m.left }}
            className="absolute z-20 flex flex-col items-center group cursor-pointer"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_#10b981] animate-bounce" />
            <div className="mt-1 flex flex-col items-center px-2 py-1 rounded-lg bg-slate-900/90 border border-sky-400/30 backdrop-blur-md shadow-lg text-[10px]">
              <span className="font-bold text-sky-300">{m.day}</span>
              <span className="font-semibold text-emerald-400 whitespace-nowrap">{m.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Metrics Bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Baseline Velocity:</span>
          <span className="font-bold text-slate-300">4.2 cm/yr</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">NutriKids AI Predicted:</span>
          <span className="font-black text-emerald-400 text-sm">+6.8 cm/yr (+62%)</span>
        </div>
      </div>
    </div>
  );
}
