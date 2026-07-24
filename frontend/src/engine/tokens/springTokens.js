/**
 * Centralized Physics Spring Tokens for NutriKids Framer Motion Physics Engine
 */

export const SPRING_TOKENS = {
  // Micro feedback (Buttons, Toggles, Micro-clicks)
  microTap: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  },

  // Structural Surface (Cards, Modals, Slide Containers)
  surfaceCard: {
    type: "spring",
    stiffness: 220,
    damping: 24,
    mass: 1.1,
  },

  // Spatial Camera (Depth push, Scene dolly)
  spatialDolly: {
    type: "spring",
    stiffness: 120,
    damping: 18,
    mass: 1.5,
  },

  // Organic Data (SVG growth curves, DNA strands)
  bioFluid: {
    type: "spring",
    stiffness: 90,
    damping: 14,
    mass: 1.0,
  },
};
