"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';
import { useAssetPreloader } from '../preloader/useAssetPreloader';

export default function Scene0_Splash() {
  const { activeScene, nextScene } = useSceneManager();
  const { progress, isReady } = useAssetPreloader(activeScene?.assets || []);
  const [splashState, setSplashState] = useState('assembling');
  const nextSceneRef = useRef(nextScene);

  useEffect(() => {
    nextSceneRef.current = nextScene;
  }, [nextScene]);

  // Sequence Timeline
  useEffect(() => {
    const t1 = setTimeout(() => setSplashState('breathing'), 900);
    const t2 = setTimeout(() => setSplashState('tagline'), 2100);
    const t3 = setTimeout(() => setSplashState('loading'), 4300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Auto-transition when bowl is filled
  useEffect(() => {
    if (splashState === 'loading' && (isReady || progress >= 90)) {
      const tComplete = setTimeout(() => {
        setSplashState('complete');
        const tNext = setTimeout(() => {
          if (nextSceneRef.current) nextSceneRef.current();
        }, 800);
        return () => clearTimeout(tNext);
      }, 3500);
      return () => clearTimeout(tComplete);
    }
  }, [splashState, isReady, progress]);

  const ingredients = [
    { icon: "🍊", label: "Orange", color: "#F59E0B", delay: 0.2, x: -35, y: -10 },
    { icon: "🫐", label: "Berries", color: "#6366F1", delay: 0.8, x: -15, y: -5 },
    { icon: "🥬", label: "Leafy Greens", color: "#22C55E", delay: 1.4, x: 10, y: -8 },
    { icon: "🥜", label: "Nuts", color: "#D97706", delay: 2.0, x: 30, y: -12 },
    { icon: "🌾", label: "Grains", color: "#EAB308", delay: 2.6, x: 0, y: -18 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-white text-slate-900">
      
      {/* ── HERO LOGO PRESENTATION (35-45% VIEWPORT WIDTH) ── */}
      <div className="relative flex flex-col items-center justify-center">
        <motion.div
          animate={{
            scale: splashState === 'breathing' ? [1, 1.03, 1] : 1,
            y: splashState === 'loading' || splashState === 'complete' ? -20 : 0,
          }}
          transition={{
            scale: { duration: 2.4, ease: "easeInOut", repeat: splashState === 'breathing' ? Infinity : 0 },
            y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          }}
          className="relative z-10 flex flex-col items-center justify-center"
        >
          {/* Logo Mark: Occupies ~40vw on Desktop */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="w-[280px] sm:w-[340px] md:w-[420px] max-w-[90vw] aspect-square flex items-center justify-center"
          >
            <img
              src="/logo.png"
              alt="NutriKids Hero Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_32px_rgba(37,99,235,0.12)]"
            />
          </motion.div>
        </motion.div>

        {/* ── BRAND NAME & TAGLINE ── */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: splashState === 'loading' || splashState === 'complete' ? -15 : 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 font-display mt-2"
        >
          NutriKids
        </motion.h1>

        <div className="h-10 mt-2 flex items-center justify-center overflow-hidden">
          <AnimatePresence>
            {splashState !== 'assembling' && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.22em] text-blue-600 font-sans"
              >
                AI-Powered Pediatric Nutrition Intelligence
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BRANDED NUTRITION BOWL FILLING ANIMATION (PROGRESS INDICATOR) ── */}
      <div className="h-44 mt-6 flex flex-col items-center justify-center">
        <AnimatePresence>
          {(splashState === 'loading' || splashState === 'complete') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center"
            >
              {/* Bowl SVG Base */}
              <div className="relative w-40 h-24 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 160 90" fill="none">
                  <ellipse cx="80" cy="82" rx="60" ry="6" fill="#E2E8F0" opacity="0.7" />
                  <path
                    d="M 20 20 C 25 75, 135 75, 140 20 Z"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 20 20 C 50 28, 110 28, 140 20"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    fill="none"
                  />
                </svg>

                {ingredients.map((ing, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: -60, opacity: 0, scale: 0.5, rotate: -30 }}
                    animate={{
                      y: ing.y,
                      x: ing.x,
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                    }}
                    transition={{
                      duration: 0.65,
                      delay: ing.delay,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className="absolute text-xl md:text-2xl pointer-events-none"
                    style={{ top: "35%" }}
                  >
                    {ing.icon}
                  </motion.div>
                ))}

                {splashState === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.2, 0.8, 0], scale: [0.8, 1.4, 1.8] }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl pointer-events-none"
                  />
                )}
              </div>

              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-2 text-xs font-extrabold uppercase tracking-widest text-slate-500 font-sans"
              >
                {splashState === 'complete' ? "Preparing Experience..." : "Filling Nutrition Intelligence..."}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
