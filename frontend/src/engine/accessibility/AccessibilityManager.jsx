"use client";

import React, { useEffect } from 'react';
import { useSceneManager } from '../scene/useSceneManager';

export function AccessibilityManager({ children }) {
  const { activeScene } = useSceneManager();

  // Announce active scene title for screen readers on scene change
  useEffect(() => {
    if (!activeScene) return;

    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Active scene: ${activeScene.title}`;
    }
  }, [activeScene]);

  return (
    <>
      {/* Screen Reader Invisible Live Region */}
      <div
        id="a11y-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      />
      {children}
    </>
  );
}
