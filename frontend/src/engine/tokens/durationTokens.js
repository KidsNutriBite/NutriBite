/**
 * Centralized Duration Tokens for NutriKids Motion Engine
 * All time values are expressed in milliseconds (ms) and seconds (s) for Framer Motion.
 */

export const DURATION_TOKENS = {
  instant: 0.12,   // 120ms - Micro-taps, keypresses, active feedback
  fast: 0.24,      // 240ms - Hover states, tooltips, badge reveals
  medium: 0.48,    // 480ms - Card transitions, modal openings, tab switches
  slow: 0.85,      // 850ms - Scene transitions, full graph path draws
  cinematic: 1.4,  // 1400ms - Camera Z-axis travel, initial splash zoom
};

export const DURATION_MS = {
  instant: 120,
  fast: 240,
  medium: 480,
  slow: 850,
  cinematic: 1400,
};
