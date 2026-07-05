"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './IntroductionSlides.module.css';

export default function IntroductionSlides({ onComplete }) {
  const stageRef = useRef(null);
  const touchXRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // Generate ambient dots on client mount
  const [dots, setDots] = useState([]);
  useEffect(() => {
    setIsMounted(true);
    const generatedDots = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      size: Math.random() * 10 + 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: ['#BAE6FD', '#7DD3FC', '#E0F4FE', '#38BDF8'][Math.floor(Math.random() * 4)],
    }));
    setDots(generatedDots);
  }, []);

  // Set up dot animation
  useEffect(() => {
    if (!isMounted) return;

    const ctx = gsap.context(() => {
      const dotEls = gsap.utils.toArray(`.${styles.mdot}`);
      dotEls.forEach((d) => {
        gsap.to(d, {
          opacity: Math.random() * 0.4 + 0.1,
          y: -(Math.random() * 80 + 30),
          duration: 3 + Math.random() * 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 3,
        });
      });
    }, stageRef);

    return () => ctx.revert();
  }, [isMounted]);

  // Entrance of slide card
  useEffect(() => {
    if (!isMounted || showWelcomeScreen) return;

    const ctx = gsap.context(() => {
      const card = stageRef.current.querySelector(`#s${currentSlide + 1}`);
      if (!card) return;

      const paper = card.querySelector(`.${styles.cardPaper}`);
      const qs = card.querySelectorAll(`.${styles.qItem}`);
      const rev = card.querySelector(`.${styles.revealBar}`);
      const illus = card.querySelector(`.${styles.cardIllus}`);

      // Set initial values
      gsap.set(card, { opacity: 0, rotateY: -12, rotateX: 4, z: -120 });
      gsap.set(paper, { scale: 0.93, y: 30 });
      gsap.set(qs, { opacity: 0, x: -16 });
      if (rev) gsap.set(rev, { opacity: 0 });

      // Animate in
      gsap.to(card, {
        opacity: 1,
        rotateY: 0,
        rotateX: 0,
        z: 0,
        duration: 0.85,
        ease: 'back.out(1.5)',
        transformStyle: 'preserve-3d',
      });

      gsap.to(paper, {
        scale: 1,
        y: 0,
        duration: 0.75,
        ease: 'back.out(1.8)',
        delay: 0.05,
      });

      // Questions cascade
      gsap.to(qs, {
        opacity: 1,
        x: 0,
        stagger: 0.18,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.55,
      });

      // Reveal Bar
      if (rev) {
        gsap.to(rev, {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.55 + qs.length * 0.18 + 0.3,
        });
      }

      // Illustration continuous bob
      if (illus) {
        gsap.to(illus, {
          y: -10,
          duration: 2.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      // Slide specific loops (removed because illustrations are now high-quality static images)
    }, stageRef);

    return () => ctx.revert();
  }, [currentSlide, isMounted, showWelcomeScreen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isMounted || showWelcomeScreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        handleNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isMounted, showWelcomeScreen]);

  // Fly away animation function
  const flyAway = (idx, cb) => {
    const card = stageRef.current.querySelector(`#s${idx + 1}`);
    if (!card) return;

    const directions = [
      { rotateY: 25, rotateZ: 8, x: 80 },
      { rotateY: -20, rotateZ: -7, x: -80 },
      { rotateY: 18, rotateZ: -10, x: 60 },
      { rotateY: -22, rotateZ: 10, x: -60 },
    ];
    const d = directions[idx % directions.length];

    const tl = gsap.timeline({ onComplete: cb });
    tl.to(card, {
      z: 180,
      scale: 1.06,
      rotateY: d.rotateY,
      rotateZ: d.rotateZ,
      duration: 0.25,
      ease: 'power2.in',
      transformPerspective: 1200,
      transformStyle: 'preserve-3d',
    })
    .to(card, {
      z: -60,
      x: d.x * 6,
      y: -window.innerHeight * 0.7,
      rotateY: d.rotateY * 4,
      rotateZ: d.rotateZ * 5,
      opacity: 0,
      scale: 0.6,
      duration: 0.7,
      ease: 'power3.in',
    });
  };

  const handleNext = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    flyAway(currentSlide, () => {
      isAnimatingRef.current = false;
      if (currentSlide >= 3) {
        showMicDrop();
      } else {
        setCurrentSlide(prev => prev + 1);
      }
    });
  };

  const handleSkip = () => {
    const card = stageRef.current.querySelector(`#s${currentSlide + 1}`);
    if (card) gsap.to(card, { opacity: 0, duration: 0.3 });
    showMicDrop();
  };

  const showMicDrop = () => {
    setShowWelcomeScreen(true);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(`.${styles.micdrop}`, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' })
        .to('#mdpre', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .to('#ml1', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '>0.2')
        .to('#ma1', { opacity: 1, duration: 0.3 }, '>0.1')
        .to('#ml2', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '>0.15')
        .to('#ma2', { opacity: 1, duration: 0.3 }, '>0.1')
        .to('#ml3', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '>0.15')
        .to('#ma3', { opacity: 1, duration: 0.3 }, '>0.1')
        .to('#mdbig', { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' }, '>0.3')
        .to('#mdcta', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '>0.4');

      // Floating big text
      gsap.to('#mdbig', { y: -8, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3.5 });
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

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onTouchStart={(e) => (touchXRef.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchXRef.current - e.changedTouches[0].clientX > 50 && !showWelcomeScreen) {
          handleNext();
        }
      }}
    >
      {/* Ambient gradient circles */}
      <div className={styles.ambient}>
        <div className={styles.ambCircle} style={{ width: '600px', height: '600px', left: '-160px', top: '-180px', background: '#BAE6FD' }} />
        <div className={styles.ambCircle} style={{ width: '500px', height: '500px', right: '-120px', bottom: '-140px', background: '#7DD3FC' }} />
        <div className={styles.ambCircle} style={{ width: '300px', height: '300px', left: '40%', top: '30%', background: '#E8F7FE' }} />
      </div>

      {/* Floating micro dots */}
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

      {/* Skip Hint */}
      {!showWelcomeScreen && (
        <div className={styles.skipHint} onClick={handleSkip}>
          Skip Intro
        </div>
      )}

      {/* ── CARD STACK ── */}
      <div style={{ display: showWelcomeScreen ? 'none' : 'block' }}>
        {/* SLIDE 1 – Are Healthy Meals Enough? */}
        <div
          className={styles.slideCard}
          id="s1"
          style={{ zIndex: 40, display: currentSlide === 0 ? 'flex' : 'none', pointerEvents: currentSlide === 0 ? 'auto' : 'none' }}
        >
          <div className={styles.cardPaper}>
            <div className={styles.cardText}>
              <div className={styles.cardLabel}>Slide 1 of 4 — The Hidden Reality</div>
              <h2 className={styles.cardHeadline}>Are Healthy Meals Really Enough?</h2>
              <p className={styles.cardSub}>Most parents track what their child eats. Very few know what their child's body is actually absorbing.</p>
              <div className={styles.qList}>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>What if your child is eating enough food but still missing critical nutrients?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>What if normal weight gain is hiding nutrition Gaps beneath the surface?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>What if growth concerns begin months before they become visible?</span></div>
              </div>
              <div className={styles.revealBar}>
                <p className={styles.revealText}>NutriKids uncovers the <span>hidden patterns</span> behind your child's development.</p>
              </div>
            </div>
            <div className={styles.cardIllus}>
              <img
                src="/indian_food.jpg"
                alt="Indian Food Thali"
                className={styles.illusImg}
              />
            </div>
          </div>
        </div>

        {/* SLIDE 2 – Looking Into The Future */}
        <div
          className={styles.slideCard}
          id="s2"
          style={{ zIndex: 30, display: currentSlide === 1 ? 'flex' : 'none', pointerEvents: currentSlide === 1 ? 'auto' : 'none' }}
        >
          <div className={styles.cardPaper}>
            <div className={styles.cardText}>
              <div className={styles.cardLabel}>Slide 2 of 4 — Future Vision</div>
              <h2 className={styles.cardHeadline}>What If You Could See Growth Before It Happens?</h2>
              <p className={styles.cardSub}>Instead of only tracking the past, NutriKids helps parents understand where their child's development is heading.</p>
              <div className={styles.qList}>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>Is my child's current nutrition supporting future growth milestones?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>Are today's habits creating tomorrow's health outcomes?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>What changes now could make the biggest difference in six months?</span></div>
              </div>
              <div className={styles.revealBar}>
                <p className={styles.revealText}>Our <span>Digital Twin</span> transforms daily data into meaningful 180-day growth insights.</p>
              </div>
            </div>
            <div className={styles.cardIllus}>
              <img
                src="/digital_twin.png"
                alt="Digital Twin Growth Predictions"
                className={styles.illusImg}
              />
            </div>
          </div>
        </div>

        {/* SLIDE 3 – When AI Isn't Enough */}
        <div
          className={styles.slideCard}
          id="s3"
          style={{ zIndex: 20, display: currentSlide === 2 ? 'flex' : 'none', pointerEvents: currentSlide === 2 ? 'auto' : 'none' }}
        >
          <div className={styles.cardPaper}>
            <div className={styles.cardText}>
              <div className={styles.cardLabel}>Slide 3 of 4 — Clinical Trust</div>
              <h2 className={styles.cardHeadline}>Because Parenting Needs More Than Advice</h2>
              <p className={styles.cardSub}>Nutrition guidance should never rely on guesswork — and neither should your child's safety.</p>
              <div className={styles.qList}>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>Can every AI recommendation account for my child's specific allergies?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>What happens when a nutritional risk becomes clinically serious?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>Who steps in when my child needs professional medical attention?</span></div>
              </div>
              <div className={styles.revealBar}>
                <p className={styles.revealText}>NutriKids combines <span>AI guidance</span>, allergen filters, and doctor-connected care pathways.</p>
              </div>
            </div>
            <div className={styles.cardIllus}>
              <img
                src="/doctor_safety.png"
                alt="AI Doctor Nutrition Safety"
                className={styles.illusImg}
              />
            </div>
          </div>
        </div>

        {/* SLIDE 4 – The Daily Battle */}
        <div
          className={styles.slideCard}
          id="s4"
          style={{ zIndex: 10, display: currentSlide === 3 ? 'flex' : 'none', pointerEvents: currentSlide === 3 ? 'auto' : 'none' }}
        >
          <div className={styles.cardPaper}>
            <div className={styles.cardText}>
              <div className={styles.cardLabel}>Slide 4 of 4 — Kids Love This</div>
              <h2 className={styles.cardHeadline}>Why Do Healthy Habits Feel Like A Fight?</h2>
              <p className={styles.cardSub}>Children rarely get excited about nutrition on their own. That is the real challenge no app has solved — until now.</p>
              <div className={styles.qList}>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>How do I make healthy eating genuinely enjoyable for my child?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>How do I reduce the daily mealtime arguments at the table?</span></div>
                <div className={styles.qItem}><div className={styles.qMark}>?</div><span>How do I help my child build habits that will actually last?</span></div>
              </div>
              <div className={styles.revealBar}>
                <p className={styles.revealText}>NutriKids turns healthy choices into <span>achievements</span>, adventures, and progress children love.</p>
              </div>
            </div>
            <div className={styles.cardIllus}>
              <img
                src="/gamified_kids.png"
                alt="Gamified Kids Experience"
                className={styles.illusImg}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MIC DROP (Welcome Screen) ── */}
      <div className={styles.micdrop}>
        <div className={styles.mdContent}>
          <p className={styles.mdPre} id="mdpre">The Real Question Is Not...</p>
          <div className={styles.mdSeq}>
            <div className={styles.mdLine} id="ml1">
              <div className={styles.interactiveQuestion}>"Did my child finish their meal?"</div>
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
          <div className={styles.mdBig} id="mdbig">Do I truly understand<br/>my child's <span>development</span>?</div>
          <div className={styles.mdCtaBlock} id="mdcta">
            <div className={styles.mdWelcome}>Welcome to NutriKids</div>
            <p className={styles.mdTagline}>Where nutrition becomes understandable, measurable, and actionable — for every parent, every child, every day.</p>
            <button className={styles.mdEnterBtn} onClick={handleEnterSite}>Enter the Platform</button>
          </div>
        </div>
      </div>

      {/* NAV */}
      {!showWelcomeScreen && (
        <div className={styles.nav}>
          <button className={`${styles.navBtn} ${styles.btnSkip}`} onClick={handleSkip}>Skip</button>
          <button className={`${styles.navBtn} ${styles.btnNext}`} onClick={handleNext}>Next</button>
        </div>
      )}

      {/* PIPS */}
      {!showWelcomeScreen && (
        <div className={styles.pips}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`${styles.pip} ${currentSlide === idx ? styles.pipActive : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

