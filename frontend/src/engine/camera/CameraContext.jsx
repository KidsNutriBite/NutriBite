"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSceneManager } from '../scene/useSceneManager';

export const CameraContext = createContext(null);

const DEFAULT_CAMERA_STATE = {
  x: 0,
  y: 0,
  z: 0,
  rotateX: 0,
  rotateY: 0,
  zoom: 1,
  blur: 0,
};

export function CameraProvider({ children }) {
  const { activeScene } = useSceneManager();
  const [cameraState, setCameraState] = useState(DEFAULT_CAMERA_STATE);
  const [mouseParallax, setMouseParallax] = useState({ rotateX: 0, rotateY: 0 });

  // Synchronize camera state with active scene manifest configuration
  useEffect(() => {
    if (activeScene && activeScene.camera) {
      setCameraState(prev => ({
        ...DEFAULT_CAMERA_STATE,
        ...activeScene.camera,
      }));
    }
  }, [activeScene]);

  // Mouse Parallax event listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      setMouseParallax({
        rotateX: -dy * 6,
        rotateY: dx * 8,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const updateCamera = useCallback((newState) => {
    setCameraState(prev => ({ ...prev, ...newState }));
  }, []);

  const value = useMemo(() => ({
    cameraState,
    mouseParallax,
    updateCamera,
  }), [cameraState, mouseParallax, updateCamera]);

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
}
