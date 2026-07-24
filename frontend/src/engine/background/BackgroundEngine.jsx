"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function BackgroundEngine() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white">
      {/* Pristine Clean Base Canvas */}
      <div className="absolute inset-0 w-full h-full bg-slate-50/50" />

      {/* Soft Ambient Warm Light Glow (Light Blue Pastel) */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-100/60 blur-[120px]"
      />

      {/* Soft Ambient Nutrition Glow (Light Green Pastel) */}
      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-emerald-100/60 blur-[130px]"
      />

      {/* Soft Ambient Warmth Glow (Light Orange Pastel) */}
      <motion.div
        animate={{
          scale: [0.95, 1.15, 0.95],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-amber-100/50 blur-[110px]"
      />

      {/* Subtle Clean Micro Pattern Overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#2563eb 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
