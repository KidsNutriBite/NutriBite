"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './Loader.module.css';

export default function Loader({ onAnimationComplete, onFadeOutComplete }) {
  const containerRef = useRef(null);
  const logoImgRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [preloadingProgress, setPreloadingProgress] = useState(0);

  // Asset list to preload in browser memory
  const ASSETS_TO_PRELOAD = [
    '/logo.png',
    '/indian_food.jpg',
    '/digital_twin.png',
    '/doctor_safety.png',
    '/gamified_kids.png',
  ];

  // 1. Client Mount & Image Preloader Engine
  useEffect(() => {
    setIsMounted(true);

    // Generate converging ambient floating particles
    const generatedParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      size: Math.random() * 12 + 6,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: ["#38BDF8", "#0EA5E9", "#7DD3FC", "#BAE6FD", "#34D399"][Math.floor(Math.random() * 5)],
    }));
    setParticles(generatedParticles);

    // Promise-based image preloading engine
    let loadedCount = 0;
    const totalAssets = ASSETS_TO_PRELOAD.length;

    ASSETS_TO_PRELOAD.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loadedCount += 1;
        setPreloadingProgress(Math.round((loadedCount / totalAssets) * 100));
        if (loadedCount >= totalAssets) {
          // Minimum splash duration for cinematic entrance
          setTimeout(() => {
            setIsLoaded(true);
          }, 1800);
        }
      };
    });
  }, []);

  const handleTap = () => {
    if (!isLoaded) return;

    // Trigger parent callback to show Intro Slides
    onAnimationComplete();

    // Smoothly fade out the loader overlay
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.98,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          onFadeOutComplete();
        }
      });
    }
  };

  // GSAP Animations
  useEffect(() => {
    if (!isMounted) return;

    const ctx = gsap.context(() => {
      // 1. Setup Pulsing Circular Energy Rings
      const rings = gsap.utils.toArray(`.${styles.ring}`);
      rings.forEach((r, i) => {
        gsap.to(r, {
          scale: 2.4,
          opacity: 0,
          duration: 3.4 + i * 0.4,
          ease: "power2.out",
          delay: i * 0.45,
          repeat: -1,
          repeatDelay: 0.5,
        });
      });

      // 2. Setup Floating Particles Converging toward Center
      const particleEls = gsap.utils.toArray(`.${styles.particle}`);
      particleEls.forEach((p) => {
        gsap.to(p, {
          opacity: Math.random() * 0.6 + 0.2,
          y: -(Math.random() * 100 + 40),
          x: (Math.random() - 0.5) * 60,
          scale: Math.random() * 0.8 + 0.4,
          duration: Math.random() * 3.5 + 2.5,
          delay: Math.random() * 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

      // 3. Continuous Logo Float & Shadow Pulse
      const logoShell = containerRef.current.querySelector(`.${styles.logoShell}`);
      const shadow = containerRef.current.querySelector(`.${styles.logoShadow}`);
      
      gsap.to(logoShell, {
        y: -16,
        duration: 2.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      gsap.to(shadow, {
        scaleX: 0.75,
        opacity: 0.4,
        duration: 2.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      // 4. Parallax Tilt on Mouse Move
      const handleMouseMove = (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        
        if (logoImgRef.current) {
          gsap.to(logoImgRef.current, {
            rotateY: dx * 16,
            rotateX: -dy * 12,
            transformPerspective: 700,
            duration: 0.6,
            ease: "power2.out"
          });
        }
      };
      document.addEventListener("mousemove", handleMouseMove);

      // 5. Entrance Stagger Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const titleSpans = containerRef.current.querySelectorAll('.title-word');

      tl.fromTo(logoShell, 
        { y: 35, scale: 0.88, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: "back.out(1.6)" }, 
        0.1
      )
      .to(`.${styles.headlineWrap}`, { opacity: 1, y: 0, duration: 0.5 }, 0.5)
      .to(titleSpans, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.06,
        duration: 0.6,
        ease: "back.out(2)"
      }, 0.6)
      .to(`.${styles.subCopy}`, { opacity: 1, y: 0, duration: 0.6 }, 1.0);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
      };
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [isMounted]);

  if (!isMounted) return null;

  const titleWords = "NutriKids • Pediatric Nutrition Intelligence".split(" ");

  return (
    <div 
      ref={containerRef} 
      className={`${styles.loaderContainer} ${isLoaded ? styles.clickable : ''}`}
      onClick={handleTap}
    >
      {/* Soft Ambient Radial Background */}
      <div className={styles.ambientGlow} />

      {/* Pulsing Energy Rings */}
      <div className={styles.ringsWrap}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={styles.ring}
            style={{
              width: `${180 + i * 85}px`,
              height: `${180 + i * 85}px`,
              borderColor: i % 2 === 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(52, 211, 153, 0.3)',
            }}
          />
        ))}
      </div>

      {/* Converging Micro Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}vw`,
            top: `${p.top}vh`,
            background: p.color,
            opacity: 0,
          }}
        />
      ))}

      {/* Main Content Card */}
      <div className={styles.mainContent}>
        <div className={styles.logoShell}>
          <img
            ref={logoImgRef}
            src="/logo.png"
            alt="NutriKids Logo"
            className={styles.logoImg}
          />
          <div className={styles.logoShimmer} />
          <div className={styles.logoShadow} />
        </div>

        <div className={styles.headlineWrap}>
          <div className={styles.eyebrow}>
            <span>✦ Medical-Grade AI Platform</span>
          </div>
          <h1 className={styles.mainTitle} aria-label="NutriKids Pediatric Nutrition Intelligence">
            {titleWords.map((word, i) => (
              <span key={i} className="title-word" style={{ display: 'inline-block', marginRight: '0.24em', opacity: 0 }}>
                {word}
              </span>
            ))}
          </h1>
        </div>

        <p className={styles.subCopy}>
          Uncovering hidden growth patterns and nutritional clarity for every child.
        </p>

        {/* Progress Bar during loading */}
        {!isLoaded && (
          <div className={styles.progressContainer}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${preloadingProgress}%` }}
              />
            </div>
            <span className={styles.progressText}>Preloading Experience... {preloadingProgress}%</span>
          </div>
        )}

        {/* Interactive Begin Journey Button */}
        {isLoaded && (
          <button className={styles.tapToContinue} type="button">
            <span className={styles.tapText}>Begin Onboarding Journey</span>
            <span className={`material-symbols-outlined ${styles.tapIcon}`}>arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}
