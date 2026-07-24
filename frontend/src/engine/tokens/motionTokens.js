/**
 * Master Motion Tokens Registry for NutriKids Engine
 * Exports combined Depth, Opacity, Blur, Scale, Duration, Easing, and Spring tokens.
 */

import { DURATION_TOKENS, DURATION_MS } from './durationTokens';
import { EASING_TOKENS } from './easingTokens';
import { SPRING_TOKENS } from './springTokens';

export const DEPTH_TOKENS = {
  background: -600,
  midground: -150,
  surface: 0,
  foreground: 120,
  modal: 350,
};

export const OPACITY_TOKENS = {
  hidden: 0,
  subtle: 0.15,
  medium: 0.65,
  visible: 1,
};

export const BLUR_TOKENS = {
  none: "blur(0px)",
  light: "blur(6px)",
  medium: "blur(12px)",
  heavy: "blur(24px)",
};

export const SCALE_TOKENS = {
  compressed: 0.88,
  recessed: 0.94,
  default: 1.0,
  expanded: 1.05,
  hero: 1.15,
};

export const MOTION_TOKENS = {
  duration: DURATION_TOKENS,
  durationMs: DURATION_MS,
  easing: EASING_TOKENS,
  spring: SPRING_TOKENS,
  depth: DEPTH_TOKENS,
  opacity: OPACITY_TOKENS,
  blur: BLUR_TOKENS,
  scale: SCALE_TOKENS,
};
