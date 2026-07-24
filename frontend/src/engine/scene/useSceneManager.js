"use client";

import { useContext } from 'react';
import { SceneContext } from './SceneContext';

export function useSceneManager() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useSceneManager must be used within a SceneProvider');
  }
  return context;
}
