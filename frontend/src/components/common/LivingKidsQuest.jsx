"use client";

import { motion } from "framer-motion";

export default function LivingKidsQuest() {
  const foodItems = [
    { name: "Crispy Broccoli", xp: "+50 XP", icon: "🥦", color: "#22C55E", top: "14%", left: "14%", delay: 0.2 },
    { name: "Sweet Carrot", xp: "+40 XP", icon: "🥕", color: "#F97316", top: "68%", left: "18%", delay: 0.4 },
    { name: "Juicy Apple", xp: "+35 XP", icon: "🍎", color: "#EF4444", top: "18%", left: "68%", delay: 0.6 },
    { name: "Super Milk", xp: "+60 XP", icon: "🥛", color: "#3B82F6", top: "72%", left: "64%", delay: 0.8 },
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] md:min-h-[300px] flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950/50 border border-amber-500/20 backdrop-blur-md p-4">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Gamified Kids Image Backdrop */}
      <img
        src="/gamified_kids.png"
        alt="Gamified Kids Experience"
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none rounded-3xl"
      />

      {/* Mascot Companion Hero Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-900/90 border border-amber-400/30 backdrop-blur-md shadow-2xl"
      >
        <motion.div
          animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
        >
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 p-1 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
            <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-3xl md:text-4xl">🦸‍♂️</span>
              <span className="text-xs font-black text-amber-300 mt-1">Sprout Shield</span>
            </div>
          </div>

          {/* Floating XP Crest */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full bg-emerald-500 border border-white text-[10px] font-black text-white shadow-lg"
          >
            LVL 12 • 1,450 XP
          </motion.div>
        </motion.div>

        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-bold text-amber-200">
          <span>🏆 Daily Quest Unlocked!</span>
        </div>
      </motion.div>

      {/* Floating Animated Food Quest Tokens */}
      {foodItems.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: item.delay },
            scale: { duration: 0.4, delay: item.delay },
            y: { duration: 3 + idx * 0.5, repeat: Infinity, ease: "easeInOut", delay: item.delay },
          }}
          style={{ top: item.top, left: item.left }}
          className="absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-xl hover:scale-110 transition-transform cursor-pointer"
        >
          <span className="text-xl md:text-2xl">{item.icon}</span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold text-white leading-none">{item.name}</span>
            <span className="text-[9px] font-bold text-emerald-400 leading-tight">{item.xp}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
