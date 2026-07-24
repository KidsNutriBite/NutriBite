"use client";

import { motion } from "framer-motion";

export default function LivingDNAConnections() {
  const nodes = [
    { title: "Peanut Allergen Filter", status: "Active Lock", color: "#EF4444", icon: "shield_with_heart", top: "16%", left: "12%" },
    { title: "Pediatrician Linked", status: "Dr. Sharma Verified", color: "#10B981", icon: "verified_user", top: "22%", left: "62%" },
    { title: "Clinical Risk Scan", status: "Zero Anomalies", color: "#3B82F6", icon: "medical_services", top: "68%", left: "18%" },
    { title: "Dosage Protocol", status: "Automated Tracking", color: "#8B5CF6", icon: "medication", top: "72%", left: "66%" },
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] md:min-h-[300px] flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950/50 border border-emerald-500/20 backdrop-blur-md p-4">
      {/* Glow Backdrop */}
      <div className="absolute inset-0 bg-radial from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Doctor Safety Image Overlay */}
      <img
        src="/doctor_safety.png"
        alt="Doctor Safety Verification"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none rounded-3xl"
      />

      {/* Center DNA Helix & Medical Pulse Ring */}
      <div className="relative z-10 w-44 h-44 md:w-52 md:h-52 flex items-center justify-center">
        {/* Pulsing Concentric Aura */}
        <motion.div
          animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
        />

        {/* Outer Rotating Medical Matrix Circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border border-dashed border-emerald-300/30"
        />

        {/* Animated DNA Strand Illustration */}
        <svg className="w-32 h-32 md:w-36 md:h-36" viewBox="0 0 100 100" fill="none">
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 15 + i * 10;
            return (
              <g key={i}>
                <motion.line
                  x1="25"
                  y1={y}
                  x2="75"
                  y2={y}
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
                <motion.circle
                  cx="25"
                  cy={y}
                  r="3.5"
                  fill="#38bdf8"
                  animate={{ cx: [25, 75, 25] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                />
                <motion.circle
                  cx="75"
                  cy={y}
                  r="3.5"
                  fill="#10b981"
                  animate={{ cx: [75, 25, 75] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Medical Trust Floating Node Cards */}
      {nodes.map((node, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.7, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: 0.4 + idx * 0.2 },
            scale: { duration: 0.5, delay: 0.4 + idx * 0.2 },
            y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 },
          }}
          style={{ top: node.top, left: node.left }}
          className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-xl"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: `${node.color}33`, border: `1px solid ${node.color}` }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: node.color }}>
              {node.icon}
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-white leading-none">{node.title}</span>
            <span className="text-[9px] font-semibold text-slate-300 leading-tight" style={{ color: node.color }}>
              {node.status}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Floating Sparkles */}
      <motion.div
        animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute top-6 right-8 text-emerald-400 font-bold text-xs"
      >
        ✦ Clinical Verification
      </motion.div>
    </div>
  );
}
