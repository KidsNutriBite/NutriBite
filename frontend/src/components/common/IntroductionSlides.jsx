"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import LivingNutrientScan from './LivingNutrientScan';
import LivingGrowthGraph from './LivingGrowthGraph';
import LivingDNAConnections from './LivingDNAConnections';
import LivingKidsQuest from './LivingKidsQuest';
import styles from './IntroductionSlides.module.css';

export default function IntroductionSlides({ onComplete }) {
  const stageRef = useRef(null);
  const touchXRef = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // 3D Parallax Mouse Tilt values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [6, -6]);
  const rotateY = useTransform(mouseX, [-400, 400], [-8, 8]);

  const handleMouseMove = (e) => {
    if (typeof window === 'undefined') return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX.set(e.clientX - cx);
    mouseY.set(e.clientY - cy);
  };

  // Ambient floating background particles
  const [dots, setDots] = useState([]);
  useEffect(() => {
    setIsMounted(true);
    const generatedDots = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 10 + 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: ['#BAE6FD', '#7DD3FC', '#E0F4FE', '#38BDF8', '#34D399'][Math.floor(Math.random() * 5)],
    }));
    setDots(generatedDots);
  }, []);

  // Ambient Dots continuous float animation via GSAP context
  useEffect(() => {
    if (!isMounted) return;

    const ctx = gsap.context(() => {
      const dotEls = gsap.utils.toArray(`.${styles.mdot}`);
      dotEls.forEach((d) => {
        gsap.to(d, {
          opacity: Math.random() * 0.45 + 0.15,
          y: -(Math.random() * 90 + 30),
          duration: 3 + Math.random() * 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2,
        });
      });
    }, stageRef);

    return () => ctx.revert();
  }, [isMounted]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!isMounted || showWelcomeScreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isMounted, showWelcomeScreen]);

  const handleNext = () => {
    if (currentSlide >= 3) {
      showMicDrop();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    showMicDrop();
  };

  const showMicDrop = () => {
    setShowWelcomeScreen(true);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(`.${styles.micdrop}`, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' })
        .to('#mdpre', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to('#ml1', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>0.15')
        .to('#ma1', { opacity: 1, duration: 0.25 }, '>0.1')
        .to('#ml2', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>0.15')
        .to('#ma2', { opacity: 1, duration: 0.25 }, '>0.1')
        .to('#ml3', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>0.15')
        .to('#ma3', { opacity: 1, duration: 0.25 }, '>0.1')
        .to('#mdbig', { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }, '>0.25')
        .to('#mdcta', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '>0.3');

      gsap.to('#mdbig', { y: -8, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3 });
    }, stageRef);
  };

  const handleEnterSite = () => {
    const md = stageRef.current.querySelector(`.${styles.micdrop}`);
    gsap.to(md, {
      opacity: 0,
      scale: 0.97,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        onComplete();
      }
    });
  };

  if (!isMounted) return null;

  // Slide Data Configuration
  const slidesData = [
    {
      id: 0,
      stepLabel: "Step 01 of 04 • Hidden Reality",
      headline: "Are Healthy Meals Really Enough?",
      sub: "Most parents track what their child eats. Very few know what their child's body is actually absorbing.",
      questions: [
        "What if your child is eating enough food but still missing critical nutrients?",
        "What if normal weight gain is hiding nutrition gaps beneath the surface?",
        "What if growth concerns begin months before they become visible?"
      ],
      revealText: "NutriKids uncovers the hidden deficiency patterns behind your child's daily meals.",
      visualComponent: <LivingNutrientScan />,
    },
    {
      id: 1,
      stepLabel: "Step 02 of 04 • Future Vision",
      headline: "What If You Could See Growth Before It Happens?",
      sub: "Instead of only tracking the past, NutriKids helps parents understand where their child's development is heading.",
      questions: [
        "Is my child's current nutrition supporting future growth milestones?",
        "Are today's eating habits creating tomorrow's clinical outcomes?",
        "What changes now could make the biggest difference in six months?"
      ],
      revealText: "Our Digital Twin transforms daily meal data into meaningful 180-day growth insights.",
      visualComponent: <LivingGrowthGraph />,
    },
    {
      id: 2,
      stepLabel: "Step 03 of 04 • Medical Trust",
      headline: "Because Parenting Needs More Than Advice",
      sub: "Nutrition guidance should never rely on guesswork — and neither should your child's safety.",
      questions: [
        "Can every AI recommendation account for my child's specific active allergies?",
        "What happens when a nutritional risk becomes clinically serious?",
        "Who steps in when my child needs professional medical attention?"
      ],
      revealText: "NutriKids combines AI guidance, allergen filters, and doctor-connected care pathways.",
      visualComponent: <LivingDNAConnections />,
    },
    {
      id: 3,
      stepLabel: "Step 04 of 04 • Kids Experience",
      headline: "Why Do Healthy Habits Feel Like A Fight?",
      sub: "Children rarely get excited about nutrition on their own. That is the real challenge no app has solved — until now.",
      questions: [
        "How do I make healthy eating genuinely enjoyable for my child?",
        "How do I reduce the daily mealtime arguments at the dinner table?",
        "How do I help my child build habits that will actually last?"
      ],
      revealText: "NutriKids turns healthy choices into achievements, quests, and progress children love.",
      visualComponent: <LivingKidsQuest />,
    },
  ];

  const slideContainerVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 25, filter: "blur(6px)" },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.1 } },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, y: -20, filter: "blur(8px)", transition: { duration: 0.45, ease: "easeIn" } },
  };

  const childItemVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  const activeSlideData = slidesData[currentSlide];

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => (touchXRef.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const delta = touchXRef.current - e.changedTouches[0].clientX;
        if (delta > 50 && !showWelcomeScreen) {
          handleNext();
        } else if (delta < -50 && !showWelcomeScreen && currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
        }
      }}
      aria-live="polite"
    >
      {/* Soft Ambient Background Blur Circles */}
      <div className={styles.ambient}>
        <div className={styles.ambCircle} style={{ width: '640px', height: '640px', left: '-180px', top: '-200px', background: '#BAE6FD' }} />
        <div className={styles.ambCircle} style={{ width: '540px', height: '540px', right: '-140px', bottom: '-160px', background: '#7DD3FC' }} />
        <div className={styles.ambCircle} style={{ width: '380px', height: '380px', left: '42%', top: '28%', background: '#E8F7FE' }} />
      </div>

      {/* Micro Floating Ambient Particles */}
      {dots.map((d) => (
        <div
          key={d.id}
          className={styles.mdot}
          style={{
            width: `${d.size}px`,
            height: `${d.size}px`,
            left: `${d.left}vw`,
            top: `${d.top}vh`,
            background: d.color,
            opacity: 0,
          }}
        />
      ))}

      {/* Top Header Controls (Skip Hint & Step Counter) */}
      {!showWelcomeScreen && (
        <div className={styles.topHeader}>
          <div className={styles.brandBadge}>
            <img src="/logo.png" alt="NutriKids" className={styles.brandLogoIcon} />
            <span className={styles.brandName}>NutriKids</span>
          </div>

          <div className={styles.skipHint} onClick={handleSkip} role="button" tabIndex={0}>
            Skip Intro
          </div>
        </div>
      )}

      {/* ── TIMELINE PROGRESS INDICATOR ── */}
      {!showWelcomeScreen && (
        <div className={styles.timelineBar}>
          {slidesData.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`${styles.timelineStep} ${currentSlide === idx ? styles.timelineStepActive : ''} ${currentSlide > idx ? styles.timelineStepPassed : ''}`}
            >
              <div className={styles.timelineTrack}>
                <motion.div
                  className={styles.timelineFill}
                  initial={{ width: "0%" }}
                  animate={{ width: currentSlide >= idx ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className={styles.timelineLabel}>0{idx + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ATOMIC SLIDE CONTAINER (Framer Motion AnimatePresence) ── */}
      {!showWelcomeScreen && (
        <div className={styles.cardViewport}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              variants={slideContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={styles.slidePaper}
            >
              {/* Left Column: Living Component Slot */}
              <motion.div variants={childItemVariants} className={styles.visualSlot}>
                {activeSlideData.visualComponent}
              </motion.div>

              {/* Right Column: Text & Question Content */}
              <motion.div variants={childItemVariants} className={styles.textSlot}>
                <div className={styles.cardHeader}>
                  <span className={styles.stepBadge}>{activeSlideData.stepLabel}</span>
                  <h2 className={styles.cardHeadline}>{activeSlideData.headline}</h2>
                  <p className={styles.cardSub}>{activeSlideData.sub}</p>
                </div>

                {/* Staggered Question Bullet List */}
                <div className={styles.qList}>
                  {activeSlideData.questions.map((q, idx) => (
                    <motion.div key={idx} variants={childItemVariants} className={styles.qItem}>
                      <div className={styles.qMark}>?</div>
                      <span>{q}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Reveal Bar */}
                <motion.div variants={childItemVariants} className={styles.revealBar}>
                  <p className={styles.revealText}>{activeSlideData.revealText}</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── MIC DROP (Welcome Screen) ── */}
      <div className={styles.micdrop}>
        <div className={styles.mdContent}>
          <p className={styles.mdPre} id="mdpre">The Real Question Is Not...</p>
          <div className={styles.mdSeq}>
            <div className={styles.mdLine} id="ml1">
              <div className={styles.interactiveQuestion}>"Did my child finish the meal?"</div>
            </div>
            <div className={styles.mdArrow} id="ma1">&#8595;</div>
            <div className={styles.mdLine} id="ml2">
              <div className={styles.interactiveQuestion}>"Did my child eat enough today?"</div>
            </div>
            <div className={styles.mdArrow} id="ma2">&#8595;</div>
            <div className={styles.mdLine} id="ml3">
              <div className={styles.interactiveQuestion}>"Did my child grow this month?"</div>
            </div>
            <div className={styles.mdArrow} id="ma3">&#8595;</div>
          </div>

          <div className={styles.mdBig} id="mdbig">
            Do I truly understand<br />
            my child's <span>development</span>?
          </div>

          <div className={styles.mdCtaBlock} id="mdcta">
            <div className={styles.mdWelcome}>Welcome to NutriKids</div>
            <p className={styles.mdTagline}>
              Where nutrition becomes understandable, measurable, and actionable — for every parent, every child, every day.
            </p>
            <button className={styles.mdEnterBtn} onClick={handleEnterSite}>
              Enter the Platform
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      {!showWelcomeScreen && (
        <div className={styles.navBar}>
          <button
            disabled={currentSlide === 0}
            className={`${styles.navBtn} ${styles.btnPrev} ${currentSlide === 0 ? styles.btnDisabled : ''}`}
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          >
            Back
          </button>
          <button className={`${styles.navBtn} ${styles.btnNext}`} onClick={handleNext}>
            {currentSlide === 3 ? "Complete Story" : "Next Slide"}
          </button>
        </div>
      )}
    </div>
  );
}
