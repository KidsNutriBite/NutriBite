"use client";

import React, { createContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SCENE_MANIFEST, SCENE_IDS } from './sceneManifest';

export const SceneContext = createContext(null);

export function SceneProvider({ children, initialSceneId = SCENE_IDS.SPLASH, onCompleteOnboarding }) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(() => {
    const idx = SCENE_MANIFEST.findIndex(s => s.id === initialSceneId);
    return idx >= 0 ? idx : 0;
  });
  
  const [isTransitionLocked, setIsTransitionLocked] = useState(false);
  const [preloadQueue, setPreloadQueue] = useState([]);

  const activeScene = useMemo(() => SCENE_MANIFEST[currentSceneIndex] || SCENE_MANIFEST[0], [currentSceneIndex]);
  const totalScenes = SCENE_MANIFEST.length;

  const lockTransition = useCallback(() => setIsTransitionLocked(true), []);
  const unlockTransition = useCallback(() => setIsTransitionLocked(false), []);

  const goToScene = useCallback((targetIndexOrId) => {
    let targetIdx = currentSceneIndex;
    if (typeof targetIndexOrId === 'number') {
      targetIdx = targetIndexOrId;
    } else if (typeof targetIndexOrId === 'string') {
      targetIdx = SCENE_MANIFEST.findIndex(s => s.id === targetIndexOrId);
    }

    if (targetIdx < 0 || targetIdx >= totalScenes) return;
    if (targetIdx === currentSceneIndex) return;

    lockTransition();
    setCurrentSceneIndex(targetIdx);

    // Queue asset preloading for next scene in background
    const nextSceneObj = SCENE_MANIFEST[targetIdx + 1];
    if (nextSceneObj && nextSceneObj.assets && nextSceneObj.assets.length > 0) {
      setPreloadQueue(prev => Array.from(new Set([...prev, ...nextSceneObj.assets])));
    }
  }, [currentSceneIndex, totalScenes, lockTransition]);

  const onCompleteRef = useRef(onCompleteOnboarding);
  useEffect(() => {
    onCompleteRef.current = onCompleteOnboarding;
  }, [onCompleteOnboarding]);

  const nextScene = useCallback(() => {
    setCurrentSceneIndex((prevIdx) => {
      if (prevIdx >= totalScenes - 1) {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return prevIdx;
      }
      const nextIdx = prevIdx + 1;
      lockTransition();
      return nextIdx;
    });
  }, [totalScenes, lockTransition]);

  const prevScene = useCallback(() => {
    setCurrentSceneIndex((prevIdx) => {
      if (prevIdx > 0) {
        const newIdx = prevIdx - 1;
        lockTransition();
        return newIdx;
      }
      return prevIdx;
    });
  }, [lockTransition]);

  // Framer Motion Animation Completion Lifecycle Handler
  const handleAnimationComplete = useCallback(() => {
    unlockTransition();
  }, [unlockTransition]);

  const value = useMemo(() => ({
    activeScene,
    currentSceneIndex,
    totalScenes,
    isTransitionLocked,
    preloadQueue,
    goToScene,
    nextScene,
    prevScene,
    lockTransition,
    unlockTransition,
    handleAnimationComplete,
    onCompleteOnboarding: onCompleteRef.current,
  }), [
    activeScene,
    currentSceneIndex,
    totalScenes,
    isTransitionLocked,
    preloadQueue,
    goToScene,
    nextScene,
    prevScene,
    lockTransition,
    unlockTransition,
    handleAnimationComplete,
  ]);

  return (
    <SceneContext.Provider value={value}>
      {children}
    </SceneContext.Provider>
  );
}
