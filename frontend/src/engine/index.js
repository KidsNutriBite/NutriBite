"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SceneProvider, useSceneManager } from './scene/SceneContext';
import { CameraProvider } from './camera/CameraContext';
import { CameraController } from './camera/CameraController';
import { BackgroundEngine } from './background/BackgroundEngine';
import { ParticleEngine } from './particle/ParticleEngine';
import { TransitionEngine } from './transition/TransitionEngine';
import { AccessibilityManager } from './accessibility/AccessibilityManager';

export * from './tokens/motionTokens';
export * from './tokens/durationTokens';
export * from './tokens/easingTokens';
export * from './tokens/springTokens';
export * from './variants/motionVariants';
export * from './scene/sceneManifest';
export * from './scene/useSceneManager';
export * from './camera/useCamera';
export * from './preloader/useAssetPreloader';

// Persistent Skip Intro Capsule Button
function SkipIntroButton({ onSkip }) {
  return (
    <div className="fixed top-6 right-8 z-[500] pointer-events-auto">
      <motion.button
        onClick={onSkip}
        whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(37,99,235,0.12)" }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-slate-200 text-blue-600 text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        type="button"
      >
        <span>Skip Intro</span>
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </motion.button>
    </div>
  );
}

function InnerEngine({ children, onCompleteOnboarding }) {
  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-white font-sans">
      {/* Persistent Skip Intro Button in Top Right */}
      <SkipIntroButton onSkip={onCompleteOnboarding} />

      {/* Layer 0: Background Engine */}
      <BackgroundEngine />

      {/* Layer 1: Particle Engine */}
      <ParticleEngine />

      {/* Layer 2: Virtual 3D Camera Controller & Transition Engine */}
      <CameraController>
        <TransitionEngine>
          {children}
        </TransitionEngine>
      </CameraController>
    </div>
  );
}

/**
 * Master Onboarding Engine Container Provider
 * Combines Scene, Camera, Background, Particle, Transition, and Accessibility engines.
 */
export function NutriKidsOnboardingEngine({ children, initialSceneId, onCompleteOnboarding }) {
  return (
    <SceneProvider initialSceneId={initialSceneId} onCompleteOnboarding={onCompleteOnboarding}>
      <CameraProvider>
        <AccessibilityManager>
          <InnerEngine onCompleteOnboarding={onCompleteOnboarding}>
            {children}
          </InnerEngine>
        </AccessibilityManager>
      </CameraProvider>
    </SceneProvider>
  );
}
