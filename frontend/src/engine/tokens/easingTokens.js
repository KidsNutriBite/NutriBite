/**
 * Centralized Cubic-Bezier Easing Tokens for NutriKids Motion Engine
 */

export const EASING_TOKENS = {
  // Biological Entrance: Smooth acceleration with soft biological deceleration
  bioIn: [0.16, 1, 0.3, 1],

  // Biological Exit: Accelerates quickly out of view, receding into spatial depth
  bioOut: [0.7, 0, 0.84, 0],

  // Kinetic Snap: High-precision spring impact for badges and score markers
  kineticSnap: [0.34, 1.56, 0.64, 1],

  // Fluid Continuity: Seamless ongoing loops for background particles & rings
  fluidFlow: [0.45, 0, 0.55, 1],
  
  // Linear uniform motion
  linear: [0, 0, 1, 1],
};
