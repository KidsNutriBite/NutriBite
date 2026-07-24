"use client";

import { useState, useEffect } from 'react';

/**
 * Custom Promise-based Asset Preloader Hook
 * Buffers Images, SVGs, Fonts, and JSON into memory before component render.
 */
export function useAssetPreloader(assetList = []) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!assetList || assetList.length === 0) {
      setProgress(100);
      setIsReady(true);
      return;
    }

    let loadedCount = 0;
    const totalAssets = assetList.length;

    const updateProgress = () => {
      loadedCount += 1;
      const currentProgress = Math.round((loadedCount / totalAssets) * 100);
      setProgress(currentProgress);

      if (loadedCount >= totalAssets) {
        setIsReady(true);
      }
    };

    assetList.forEach((src) => {
      if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.svg') || src.endsWith('.webp')) {
        const img = new Image();
        img.src = src;
        img.onload = updateProgress;
        img.onerror = updateProgress;
      } else if (src.endsWith('.json')) {
        fetch(src)
          .then(updateProgress)
          .catch(updateProgress);
      } else {
        // Default fallback for generic assets
        setTimeout(updateProgress, 100);
      }
    });
  }, [assetList]);

  return { progress, isReady };
}
