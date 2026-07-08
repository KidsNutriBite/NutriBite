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

  useEffect(() => {
    setIsMounted(true);
    // Generate random particle positions and colors on client-side to prevent hydration mismatch
    const generatedParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      size: Math.random() * 14 + 5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: ["#38BDF8", "#7DD3FC", "#BAE6FD", "#BFDBFE", "#93C5FD"][Math.floor(Math.random() * 5)],
    }));
    setParticles(generatedParticles);
  }, []);

  // 3-second Timer to mark loading complete
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isMounted]);

  const handleTap = () => {
    if (!isLoaded) return;

    // Reveal the landing page content
    onAnimationComplete();

    // Smoothly fade out the loader overlay
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
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
      // 1. Setup Ripple Rings Animation
      const rings = gsap.utils.toArray(`.${styles.ring}`);
      rings.forEach((r, i) => {
        gsap.to(r, {
          scale: 1,
          opacity: 0.55 - i * 0.07,
          duration: 0,
          onComplete: () => {
            gsap.to(r, {
              scale: 2.2,
              opacity: 0,
              duration: 3.2 + i * 0.4,
              ease: "power2.out",
              delay: i * 0.45,
              repeat: -1,
              repeatDelay: 0.6,
            });
          }
        });
      });

      // 2. Setup Floating Particles
      const particleEls = gsap.utils.toArray(`.${styles.particle}`);
      particleEls.forEach((p) => {
        gsap.to(p, {
          opacity: Math.random() * 0.5 + 0.15,
          y: -(Math.random() * 120 + 40),
          x: (Math.random() - 0.5) * 80,
          scale: Math.random() * 0.8 + 0.4,
          duration: Math.random() * 4 + 3,
          delay: Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

      // 3. Continuous Logo Float
      const logoShell = containerRef.current.querySelector(`.${styles.logoShell}`);
      const shadow = containerRef.current.querySelector(`.${styles.logoShadow}`);
      
      gsap.to(logoShell, {
        y: -18,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      gsap.to(shadow, {
        scaleX: 0.75,
        opacity: 0.4,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      // 4. Mouse Move Tilt Effect on Logo
      const handleMouseMove = (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        
        if (logoImgRef.current) {
          gsap.to(logoImgRef.current, {
            rotateY: dx * 18,
            rotateX: -dy * 14,
            transformPerspective: 600,
            duration: 0.7,
            ease: "power2.out"
          });
        }
      };
      document.addEventListener("mousemove", handleMouseMove);

      // 5. Rotating Background Rings
      const dashRing = containerRef.current.querySelector('.dash-ring');
      const solidRing = containerRef.current.querySelector('.solid-ring');
      
      gsap.to(dashRing, { opacity: 0.6, duration: 1, delay: 1.2 });
      gsap.to(dashRing, { rotation: 360, duration: 22, ease: "none", repeat: -1 });

      gsap.to(solidRing, { opacity: 0.8, duration: 1, delay: 1.4 });
      gsap.to(solidRing, { rotation: -360, duration: 30, ease: "none", repeat: -1 });

      // 6. Setup 3D Floating Orbs Bobbing
      const orbs = containerRef.current.querySelectorAll('.floating-orb');
      orbs.forEach((orb) => {
        const delay = parseFloat(orb.dataset.delay) || 0;
        // Entrance
        gsap.to(orb, { opacity: 1, scale: 1, duration: 0.8, delay, ease: "back.out(2)" });
        gsap.fromTo(orb, { scale: 0 }, { scale: 1, duration: 0.8, delay, ease: "back.out(2)" });
        
        // Continuous bobbing
        gsap.to(orb, {
          y: -(Math.random() * 25 + 10),
          x: (Math.random() - 0.5) * 16,
          duration: 2.5 + Math.random() * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 1.5 + delay
        });
      });

      // 7. Entrance Timeline (Animations adjusted to align within the 3.0s timer)
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" }
      });

      const titleSpans = containerRef.current.querySelectorAll('.title-word');

      tl.from(logoShell, {
        y: 30,
        scale: 0.92,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out"
      }, 0.1)
      .fromTo(`.${styles.logoShimmer}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5)
      .to(`.${styles.headlineWrap}`, { opacity: 1, y: 0, duration: 0.4 }, 0.6)
      .to(titleSpans, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transformPerspective: 500,
        stagger: 0.05,
        duration: 0.5,
        ease: "back.out(2)"
      }, 0.7)
      .to(`.${styles.subCopy}`, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 1.1)
      .to(`.${styles.progressTrack}`, { opacity: 1, duration: 0.3 }, 1.3)
      .to(`.${styles.progressFill}`, { width: "100%", duration: 1.4, ease: "power1.inOut" }, 1.3)
      .to(`.${styles.dots}`, { opacity: 1, duration: 0.2 }, 1.4)
      .to(`#d1`, { scaleY: 1.8, duration: 0.3, ease: "power1.inOut", repeat: -1, yoyo: true }, 1.5)
      .to(`#d2`, { scaleY: 1.8, duration: 0.3, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 0.1 }, 1.5)
      .to(`#d3`, { scaleY: 1.8, duration: 0.3, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 0.2 }, 1.5);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
      };
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [isMounted]);

  if (!isMounted) return null;

  const titleWords = "Welcome to KidsNutriKids Platform".split(" ");

  const orbData = [
    { size: 42, left: "8%", top: "18%", color: "#38BDF8", delay: 0.5 },
    { size: 26, left: "88%", top: "22%", color: "#7DD3FC", delay: 0.9 },
    { size: 34, left: "12%", top: "72%", color: "#BAE6FD", delay: 0.7 },
    { size: 20, left: "82%", top: "70%", color: "#38BDF8", delay: 1.1 },
    { size: 16, left: "50%", top: "8%", color: "#7DD3FC", delay: 0.6 },
    { size: 28, left: "92%", top: "50%", color: "#BAE6FD", delay: 1.3 },
    { size: 18, left: "4%", top: "46%", color: "#38BDF8", delay: 0.8 },
  ];

  return (
    <div 
      ref={containerRef} 
      className={`${styles.loaderContainer} ${isLoaded ? styles.clickable : ''}`}
      onClick={handleTap}
    >
      {/* ── RINGS ── */}
      <div className={styles.ringsWrap}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={styles.ring}
            style={{
              width: `${160 + i * 90}px`,
              height: `${160 + i * 90}px`,
              borderColor: i % 2 === 0 ? '#7DD3FC' : '#BAE6FD',
            }}
          />
        ))}
      </div>

      {/* ── FLOATING PARTICLES ── */}
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

      {/* ── 3D FLOATING ORBS ── */}
      {orbData.map((o, idx) => (
        <div
          key={idx}
          className="floating-orb"
          data-delay={o.delay}
          style={{
            position: 'fixed',
            width: `${o.size}px`,
            height: `${o.size}px`,
            left: o.left,
            top: o.top,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, white 0%, ${o.color} 55%, #0284c7 100%)`,
            boxShadow: `0 8px 24px rgba(56,189,248,0.3), inset -3px -3px 8px rgba(2,132,199,0.25)`,
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 2,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* ── ROTATING DASHED RING behind logo ── */}
      <div
        className="dash-ring"
        style={{
          position: 'fixed',
          width: 'clamp(280px, 42vw, 480px)',
          height: 'clamp(280px, 42vw, 480px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -52%)',
          borderRadius: '50%',
          border: '2px dashed #BAE6FD',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── SOLID RING counter-rotate ── */}
      <div
        className="solid-ring"
        style={{
          position: 'fixed',
          width: 'clamp(320px, 50vw, 560px)',
          height: 'clamp(320px, 50vw, 560px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -52%)',
          borderRadius: '50%',
          border: '1.5px solid #E0F4FE',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── MAIN LOADER CONTENT ── */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div className={styles.logoShell}>
          <img
            ref={logoImgRef}
            src="/logo.png"
            alt="KidsNutriKids Logo"
          />
          <div className={styles.logoShimmer} />
          <div className={styles.logoShadow} />
        </div>

        <div className={styles.headlineWrap}>
          <div className={styles.eyebrow}>Nutrition for the Next Generation</div>
          <h1 className={styles.mainTitle} aria-label="Welcome to KidsNutriKids Platform">
            {titleWords.map((word, i) => (
              <span
                key={i}
                className="title-word"
                style={{
                  display: 'inline-block',
                  marginRight: '0.22em',
                  opacity: 0,
                  transform: 'translateY(50px) rotateX(-45deg)',
                  willChange: 'transform, opacity',
                }}
              >
                {word}
              </span>
            ))}
          </h1>
        </div>

        <p className={styles.subCopy}>
          Give your child the <strong>nutritional advantage</strong> they deserve.<br />
          Smart meal guidance, built for growing minds and bodies.
        </p>

        <div className={styles.progressTrack} style={{ display: isLoaded ? 'none' : 'block' }}>
          <div className={styles.progressFill} />
        </div>

        <div className={styles.dots} style={{ display: isLoaded ? 'none' : 'flex' }}>
          <div className={styles.dot} id="d1" />
          <div className={styles.dot} id="d2" />
          <div className={styles.dot} id="d3" />
        </div>

        {/* ── TAP TO CONTINUE ── */}
        <button className={`${styles.tapToContinue} ${isLoaded ? styles.visible : ''}`} type="button">
          <span className={styles.tapText}>Tap to Continue</span>
          <span className={`material-symbols-outlined ${styles.tapIcon}`}>touch_app</span>
        </button>
      </div>
    </div>
  );
}

