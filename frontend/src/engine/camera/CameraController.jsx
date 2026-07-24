"use client";

import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { CameraContext } from './CameraContext';
import { SPRING_TOKENS } from '../tokens/springTokens';

export function CameraController({ children }) {
  const context = useContext(CameraContext);

  if (!context) {
    return <>{children}</>;
  }

  const { cameraState, mouseParallax } = context;

  const totalRotateX = (cameraState.rotateX || 0) + (mouseParallax.rotateX || 0);
  const totalRotateY = (cameraState.rotateY || 0) + (mouseParallax.rotateY || 0);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ perspective: '1400px' }}>
      <motion.div
        animate={{
          x: cameraState.x,
          y: cameraState.y,
          z: cameraState.z,
          rotateX: totalRotateX,
          rotateY: totalRotateY,
          scale: cameraState.zoom,
          filter: `blur(${cameraState.blur}px)`,
        }}
        transition={SPRING_TOKENS.spatialDolly}
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
