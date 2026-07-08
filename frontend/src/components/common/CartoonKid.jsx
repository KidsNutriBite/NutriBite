"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Make sure ScrollTrigger is registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CartoonKid({ activeStep }) {
  const containerRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);
  const mouthRef = useRef(null);
  const characterRef = useRef(null);

  // Floating elements refs
  const item1Ref = useRef(null); // Profile / Apple
  const item2Ref = useRef(null); // Broccoli
  const item3Ref = useRef(null); // Shield / Stethoscope
  const item4Ref = useRef(null); // Salad / PDF

  useEffect(() => {
    // 1. Hover/Mouse Move Eye Tracking
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerCenterX = rect.left + rect.width / 2;
      const containerCenterY = rect.top + rect.height / 2;

      // Distance from center
      const dx = e.clientX - containerCenterX;
      const dy = e.clientY - containerCenterY;
      const angle = Math.atan2(dy, dx);

      // Max travel distance for pupils inside the eye white
      const maxDistance = 4.5; 
      const dist = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy) / 45);

      const pupilX = Math.cos(angle) * dist;
      const pupilY = Math.sin(angle) * dist;

      // Animate left/right pupil groups (moves pupil + highlights together)
      gsap.to([leftPupilRef.current, rightPupilRef.current], {
        x: pupilX,
        y: pupilY,
        duration: 0.2,
        ease: "power2.out",
      });

      // 3D Tilt Character towards cursor
      const tiltX = -dy / 55;
      const tiltY = dx / 55;
      gsap.to(characterRef.current, {
        rotateX: gsap.utils.clamp(-12, 12, tiltX),
        rotateY: gsap.utils.clamp(-15, 15, tiltY),
        transformPerspective: 500,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 2. Scroll Trigger Eye Rolling & 3D Parallax Animations
    const parentSection = document.getElementById("how-it-works");
    let ctx;

    if (parentSection) {
      ctx = gsap.context(() => {
        // Continuous floating animation for character
        gsap.to(characterRef.current, {
          y: -10,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // Floating animations for 3D items
        gsap.to(item1Ref.current, {
          y: -8,
          rotation: 8,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.2,
        });

        gsap.to(item2Ref.current, {
          y: 8,
          rotation: -12,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.5,
        });

        gsap.to(item3Ref.current, {
          y: -6,
          rotation: 10,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.8,
        });

        gsap.to(item4Ref.current, {
          y: 6,
          rotation: -8,
          duration: 3.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.0,
        });

        ScrollTrigger.create({
          trigger: parentSection,
          start: "top center",
          end: "bottom center",
          scrub: 0.5,
          onUpdate: (self) => {
            if (!leftPupilRef.current || !rightPupilRef.current || !mouthRef.current) return;
            const p = self.progress;

            // Make eyes "roll" at the beginning, then focus
            if (p < 0.15) {
              const rollAngle = p * Math.PI * 4; // Multiple full rotations
              const rollRadius = 3.5;
              gsap.to([leftPupilRef.current, rightPupilRef.current], {
                x: Math.cos(rollAngle) * rollRadius,
                y: Math.sin(rollAngle) * rollRadius,
                duration: 0.1,
              });
            } else if (p >= 0.15 && p < 0.4) {
              // Focus left/up (looking at step 1)
              gsap.to([leftPupilRef.current, rightPupilRef.current], { x: -3, y: -2, duration: 0.3 });
              gsap.to(mouthRef.current, { attr: { d: "M 88 132 Q 100 140 112 132 Z" }, duration: 0.3 }); // small smile
            } else if (p >= 0.4 && p < 0.6) {
              // Focus left/down (looking at step 2)
              gsap.to([leftPupilRef.current, rightPupilRef.current], { x: -3, y: 3, duration: 0.3 });
              gsap.to(mouthRef.current, { attr: { d: "M 86 130 Q 100 148 114 130 Z" }, duration: 0.3 }); // wide smile
            } else if (p >= 0.6 && p < 0.8) {
              // Focus right/up (looking at step 3)
              gsap.to([leftPupilRef.current, rightPupilRef.current], { x: 3, y: -2, duration: 0.3 });
              gsap.to(mouthRef.current, { attr: { d: "M 84 126 Q 100 156 116 126 Z" }, duration: 0.3 }); // huge smile
            } else {
              // Focus right/down (looking at step 4)
              gsap.to([leftPupilRef.current, rightPupilRef.current], { x: 3, y: 3, duration: 0.3 });
              gsap.to(mouthRef.current, { attr: { d: "M 84 126 Q 100 156 116 126 Z" }, duration: 0.3 }); // huge smile
            }
          },
        });
      }, containerRef);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (ctx) ctx.revert();
    };
  }, []);

  // Update mouth and details based on activeStep prop changes as fallback/sync
  useEffect(() => {
    if (!mouthRef.current) return;
    if (activeStep === 0) {
      gsap.to(mouthRef.current, { attr: { d: "M 88 132 Q 100 140 112 132 Z" }, duration: 0.3 });
    } else if (activeStep === 1) {
      gsap.to(mouthRef.current, { attr: { d: "M 86 130 Q 100 148 114 130 Z" }, duration: 0.3 });
    } else if (activeStep === 2) {
      gsap.to(mouthRef.current, { attr: { d: "M 84 126 Q 100 156 116 126 Z" }, duration: 0.3 });
    } else if (activeStep === 3) {
      gsap.to(mouthRef.current, { attr: { d: "M 84 126 Q 100 156 116 126 Z" }, duration: 0.3 });
    }
  }, [activeStep]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] flex items-center justify-center select-none"
    >
      {/* ── 3D FLOATING ITEMS ── */}
      {/* Item 1: Cute healthy Apple (Active in step 1: Sign up) */}
      <div
        ref={item1Ref}
        className={`absolute top-4 left-4 z-25 transition-all duration-500 scale-95 ${
          activeStep === 0 ? "opacity-100 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.7)] scale-110" : "opacity-45"
        }`}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-lg text-2xl border border-rose-300">
          🍎
        </div>
      </div>

      {/* Item 2: Playful Broccoli (Active in step 2: Track & Play) */}
      <div
        ref={item2Ref}
        className={`absolute bottom-8 left-6 z-25 transition-all duration-500 scale-95 ${
          activeStep === 1 ? "opacity-100 filter drop-shadow-[0_0_15px_rgba(74,222,128,0.7)] scale-110" : "opacity-45"
        }`}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg text-3xl border border-emerald-300">
          🥦
        </div>
      </div>

      {/* Item 3: Pediatrician Stethoscope / Doctor tag (Active in step 3: Insights) */}
      <div
        ref={item3Ref}
        className={`absolute top-12 right-6 z-25 transition-all duration-500 scale-95 ${
          activeStep === 2 ? "opacity-100 filter drop-shadow-[0_0_15px_rgba(56,189,248,0.7)] scale-110" : "opacity-45"
        }`}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500 text-white shadow-lg text-2xl border border-sky-300">
          🩺
        </div>
      </div>

      {/* Item 4: AI personalized diet plans & PDF downloads (Active in step 4: Diet plans) */}
      <div
        ref={item4Ref}
        className={`absolute bottom-8 right-8 z-25 transition-all duration-500 scale-95 ${
          activeStep === 3 ? "opacity-100 filter drop-shadow-[0_0_15px_rgba(129,140,248,0.7)] scale-110" : "opacity-45"
        }`}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg text-3xl border border-indigo-300">
          🥗
        </div>
      </div>

      {/* ── CENTRAL MASCOT CHARACTER ── */}
      <div
        ref={characterRef}
        className="w-full h-full flex items-center justify-center relative z-20"
        style={{ transformStyle: "preserve-3d" }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full max-w-[280px] max-h-[280px] filter drop-shadow-[0_16px_24px_rgba(15,23,42,0.12)]"
        >
          {/* Back Shadow */}
          <ellipse cx="100" cy="176" rx="42" ry="10" fill="#0F172A" opacity="0.12" />

          {/* Ears */}
          <circle cx="44" cy="116" r="14" fill="#FED7AA" stroke="#E28743" strokeWidth="0.5" />
          <circle cx="44" cy="116" r="9" fill="#E28743" opacity="0.15" />
          <circle cx="156" cy="116" r="14" fill="#FED7AA" stroke="#E28743" strokeWidth="0.5" />
          <circle cx="156" cy="116" r="9" fill="#E28743" opacity="0.15" />

          {/* Hair (Back) */}
          <path d="M 44 110 C 38 60, 162 60, 156 110 Z" fill="#3B1501" />

          {/* Head/Face base */}
          <circle cx="100" cy="114" r="50" fill="#FED7AA" />

          {/* Cute Blush cheeks */}
          <ellipse cx="60" cy="132" rx="12" ry="8" fill="#F43F5E" opacity="0.3" />
          <ellipse cx="140" cy="132" rx="12" ry="8" fill="#F43F5E" opacity="0.3" />

          {/* Hair (Front fringe with spikes) */}
          <path d="M 46 94 Q 72 82 94 88 Q 112 80 134 94 Q 152 82 152 92 C 146 64, 114 54, 100 54 C 86 54, 54 64, 46 92 Z" fill="#3B1501" />

          {/* Orange/Yellow Cap */}
          {/* Cap dome */}
          <path d="M 52 82 C 52 28, 148 28, 148 82 Z" fill="#F97316" />
          <path d="M 56 82 C 56 34, 144 34, 144 82 Z" fill="#FBBF24" />
          {/* Cap Visor / Brim pointing to side/up */}
          <path d="M 38 78 Q 98 44 154 70 C 158 80, 142 84, 98 84 C 54 84, 38 82, 38 78 Z" fill="#EA580C" />

          {/* Eyebrows */}
          <path d="M 64 88 Q 74 84 84 90" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          <path d="M 116 90 Q 126 84 136 88" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />

          {/* Eyes (Whites) */}
          <ellipse cx="74" cy="114" rx="15" ry="21" fill="#FFFFFF" stroke="#3B1501" strokeWidth="2.5" />
          <ellipse cx="126" cy="114" rx="15" ry="21" fill="#FFFFFF" stroke="#3B1501" strokeWidth="2.5" />

          {/* Pupils Group (Moves pupil and shiny glints together) */}
          <g ref={leftPupilRef}>
            <ellipse cx="74" cy="114" rx="10" ry="15" fill="#3B1501" />
            <circle cx="70" cy="107" r="3.5" fill="#FFFFFF" />
            <circle cx="77" cy="120" r="1.8" fill="#FFFFFF" />
          </g>

          <g ref={rightPupilRef}>
            <ellipse cx="126" cy="114" rx="10" ry="15" fill="#3B1501" />
            <circle cx="122" cy="107" r="3.5" fill="#FFFFFF" />
            <circle cx="129" cy="120" r="1.8" fill="#FFFFFF" />
          </g>

          {/* Cute Nose */}
          <path d="M 97 120 Q 100 123 103 120" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />

          {/* Dynamic Open Smiling Mouth */}
          <path
            ref={mouthRef}
            d="M 88 132 Q 100 140 112 132 Z"
            fill="#991B1B"
          />
        </svg>
      </div>
    </div>
  );
}
