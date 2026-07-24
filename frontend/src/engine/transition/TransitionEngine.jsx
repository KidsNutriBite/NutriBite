"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../scene/useSceneManager';

export function TransitionEngine({ children }) {
  const { activeScene, handleAnimationComplete } = useSceneManager();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        <motion.div
          key={activeScene?.id || 'scene_fallback'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={handleAnimationComplete}
          className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-auto"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
