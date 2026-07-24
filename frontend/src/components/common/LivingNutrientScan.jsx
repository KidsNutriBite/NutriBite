"use client";

import { motion } from "framer-motion";

export default function LivingNutrientScan() {
  const nutrients = [
    { label: "Iron (Fe)", status: "Gap Detected", color: "#EF4444", delay: 0.6, top: "18%", left: "12%" },
    { label: "Zinc (Zn)", status: "Sub-optimal", color: "#F59E0B", delay: 0.9, top: "68%", left: "16%" },
    { label: "Vitamin D3", status: "Absorbed 42%", color: "#3B82F6", delay: 1.2, top: "25%", left: "68%" },
    { label: "Calcium", status: "Optimal", color: "#10B981", delay: 1.5, top: "74%", left: "64%" },
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] md:min-h-[300px] flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950/40 border border-sky-500/20 backdrop-blur-md p-4">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-sky-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Base Food Image */}
      <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-2 border-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
        <img
          src="/indian_food.jpg"
          alt="Indian Thali Meal Scan"
          className="w-full h-full object-cover scale-105"
        />
        {/* Semi-transparent Overlay Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      {/* Radar Scanning Line */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        className="absolute w-60 h-60 md:w-68 md:h-68 rounded-full border border-sky-400/20 pointer-events-none flex items-center justify-center"
      >
        <div className="w-1/2 h-1/2 bg-gradient-to-tr from-sky-400/30 to-transparent origin-bottom-right rounded-tl-full" />
      </motion.div>

      {/* Concentric Scan Rings */}
      <motion.div
        animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full border border-sky-400/30 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 0.5 }}
        className="absolute w-60 h-60 md:w-68 md:h-68 rounded-full border border-dashed border-sky-300/25 pointer-events-none"
      />

      {/* Dynamic Nutrient Badge Floating Markers */}
      {nutrients.map((n, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.6, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: n.delay },
            scale: { duration: 0.5, delay: n.delay },
            y: { duration: 3, ease: "easeInOut", repeat: Infinity, delay: n.delay },
          }}
          style={{ top: n.top, left: n.left }}
          className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 shadow-xl backdrop-blur-md"
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: n.color }}
          />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-white leading-none">{n.label}</span>
            <span className="text-[9px] font-semibold text-slate-300 leading-tight" style={{ color: n.color }}>
              {n.status}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Floating Scanning Particle Orbs */}
      <motion.div
        animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 left-12 w-3 h-3 rounded-full bg-sky-400/70 blur-[1px] shadow-[0_0_12px_#38bdf8]"
      />
      <motion.div
        animate={{ y: [12, -12, 12], x: [6, -6, 6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 right-12 w-4 h-4 rounded-full bg-emerald-400/70 blur-[1px] shadow-[0_0_14px_#34d399]"
      />
    </div>
  );
}
