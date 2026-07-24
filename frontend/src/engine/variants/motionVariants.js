/**
 * Centralized Reusable Framer Motion Variants for NutriKids Engine
 * Guarantees zero inline animation values across scenes.
 */

import { DURATION_TOKENS } from '../tokens/durationTokens';
import { EASING_TOKENS } from '../tokens/easingTokens';
import { OPACITY_TOKENS, SCALE_TOKENS } from '../tokens/motionTokens';

// Volumetric Lens Focus Entrance - Clean & Crisp
export const volumetricEntranceVariants = {
  initial: {
    opacity: OPACITY_TOKENS.hidden,
    scale: SCALE_TOKENS.recessed,
    y: 16,
  },
  animate: {
    opacity: OPACITY_TOKENS.visible,
    scale: SCALE_TOKENS.default,
    y: 0,
    transition: {
      duration: DURATION_TOKENS.slow,
      ease: EASING_TOKENS.bioIn,
    },
  },
  exit: {
    opacity: OPACITY_TOKENS.hidden,
    scale: SCALE_TOKENS.expanded,
    y: -12,
    transition: {
      duration: DURATION_TOKENS.fast,
      ease: EASING_TOKENS.bioOut,
    },
  },
};

// Child Item Stagger Variant
export const childItemVariants = {
  initial: {
    opacity: OPACITY_TOKENS.hidden,
    y: 12,
  },
  animate: {
    opacity: OPACITY_TOKENS.visible,
    y: 0,
    transition: {
      duration: DURATION_TOKENS.medium,
      ease: EASING_TOKENS.bioIn,
    },
  },
};

// Kinetic Character Lock Typography Variant
export const textWordVariants = {
  initial: {
    opacity: OPACITY_TOKENS.hidden,
    y: 16,
  },
  animate: {
    opacity: OPACITY_TOKENS.visible,
    y: 0,
    transition: {
      duration: DURATION_TOKENS.medium,
      ease: EASING_TOKENS.bioIn,
    },
  },
};

// SVG Path Draw Variant
export const pathDrawVariants = {
  initial: {
    pathLength: 0,
    opacity: OPACITY_TOKENS.hidden,
  },
  animate: {
    pathLength: 1,
    opacity: OPACITY_TOKENS.visible,
    transition: {
      duration: DURATION_TOKENS.slow * 2,
      ease: EASING_TOKENS.bioIn,
      delay: DURATION_TOKENS.fast,
    },
  },
};

// Reduced Motion Variant (Fallback)
export const reducedMotionVariants = {
  initial: { opacity: OPACITY_TOKENS.hidden },
  animate: { opacity: OPACITY_TOKENS.visible, transition: { duration: DURATION_TOKENS.fast } },
  exit: { opacity: OPACITY_TOKENS.hidden, transition: { duration: DURATION_TOKENS.fast } },
};
