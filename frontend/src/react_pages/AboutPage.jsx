"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import { 
  Heart, Sparkles, Brain, Activity, FileText, Users, GraduationCap, ShieldCheck, 
  Layers, Globe, Rocket, Eye, Mail, ArrowRight, Smile, Flame, CheckCircle, Lock, 
  Monitor, BookOpen, Award, Zap, Apple
} from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

// ==========================================
// 1. DATA DEFINITIONS
// ==========================================

const CONTRIBUTORS = [
  {
    id: "abhiram",
    name: "Abhiram Bikkina",
    role: "AI Engineer & Feature Development Lead",
    email: "abhirambikkina@gmail.com",
    type: "Project Lead",
    image: "/images/team/abhiram.jpg",
    avatarInitials: "AB",
    avatarBg: "from-primary to-sky-500",
    skills: ["AI Architecture", "LLMs", "RAG Systems", "System Integration"],
    responsibilities: [
      "Product & AI Systems Architecture",
      "LLM Integration & Prompt Engineering",
      "End-to-End System Integration",
      "Core Feature Development & Testing"
    ],
    achievements: "Built core LLM pipeline & pediatric validation models."
  },
  {
    id: "dinesh",
    name: "Dinesh Veera Bhargav",
    role: "AI & LLM Developer",
    email: "cb.sc.u4cse23302@cb.amrita.students.edu",
    type: "Core Contributor",
    image: "/images/team/dinesh.png",
    avatarInitials: "DB",
    avatarBg: "from-primary to-sky-500",
    skills: ["LLMs", "RAG Systems", "Prompt Engineering", "Fine-Tuning"],
    responsibilities: [
      "Generative AI Model Tuning",
      "Search Retrieval & RAG Optimizations",
      "Clinical Prompt Gating",
      "Prompt Optimization & Benchmarks"
    ],
    achievements: "Refined RAG validation accuracy by 40%."
  },
  {
    id: "tharun",
    name: "Y. Tharun Kumar Reddy",
    role: "Backend & Database Engineer",
    email: "cb.sc.u4cse23153@cb.students.amrita.edu",
    type: "Core Contributor",
    image: "/images/team/tharun.png",
    avatarInitials: "TR",
    avatarBg: "from-primary to-sky-500",
    skills: ["Node.js", "Express", "MongoDB", "Auth Core"],
    responsibilities: [
      "REST APIs & Service Layer Setup",
      "MongoDB Schemes & Database Seeders",
      "Secure Two-Factor Authentication Core",
      "Server logging & performance tuning"
    ],
    achievements: "Engineered secure OAuth and 2FA logging mechanism."
  },
  {
    id: "pavan_k",
    name: "D. Pavan Krishna",
    role: "Data Engineer & Backend Developer",
    email: "cb.sc.u4cse23315@cb.students.amrita.edu",
    type: "Core Contributor",
    image: "/images/team/pavan_k.png",
    avatarInitials: "PK",
    avatarBg: "from-primary to-sky-500",
    skills: ["Data Pipelines", "Node.js", "Python", "NoSQL"],
    responsibilities: [
      "Nutritional Dataset Aggregation",
      "CSV Parsing & MongoDB Data Ingestion",
      "Backend Validation Rules Configuration",
      "Regression test coverage helpers"
    ],
    achievements: "Curated 10,000+ clinical-grade pediatric meal recipes."
  },
  {
    id: "pavan_v",
    name: "Veluri Pavan Vignesh",
    role: "Frontend & UI/UX Engineer",
    email: "cb.sc.u4cse23354@cb.students.amrita.edu",
    type: "Core Contributor",
    image: "/images/team/pavan_v.png",
    avatarInitials: "PV",
    avatarBg: "from-primary to-sky-500",
    skills: ["React", "Next.js", "CSS Animations", "UX Architectures"],
    responsibilities: [
      "Tailwind Styling System Configuration",
      "Interactive Wellness Analytics Interface",
      "Micro-animations & CSS Mesh Gradients",
      "Responsive Layout Compatibility testing"
    ],
    achievements: "Created custom vector mascot component and dashboards."
  }
];

const GUIDES = [
  {
    id: "senthil",
    name: "Dr. T. Senthil Kumar",
    role: "Project Guide / Faculty Mentor",
    department: "Department of Computer Science and Engineering",
    email: "t_senthilkumar@cb.amrita.edu",
    type: "Faculty Mentor",
    image: "/images/team/senthil.png",
    avatarInitials: "SK",
    avatarBg: "from-primary to-sky-500",
    skills: ["Academic Review", "Project Oversight", "Research Guidance"],
    responsibilities: [
      "Directing Research Methodologies",
      "Academic Evaluation & Validation Gating",
      "Codebase Architecture Oversight"
    ],
    achievements: "Guided structural framework and milestone alignment."
  },
  {
    id: "shanmugha",
    name: "Shanmugha Priya",
    role: "Industry LLM Guide",
    department: "AI Research & LLM Engineering",
    type: "LLM Specialist",
    image: "/images/team/shanmugha.jpg",
    avatarInitials: "SP",
    avatarBg: "from-primary to-sky-500",
    skills: ["LLM Engineering", "Fine-Tuning", "Vector Search"],
    responsibilities: [
      "Advised on LLM training methodologies",
      "RAG Evaluation & Vector Embedding Strategy",
      "Clinical Gating Review"
    ],
    achievements: "Optimized model contextual retrieval boundaries."
  }
];

const DOCTORS = [
  {
    id: "sindhu",
    name: "Sindhu Abhijith",
    role: "Functional Medicine Clinical Nutritionist",
    department: "Founder, Overall Health and Nutrition, Bangalore",
    email: "sindhu.abhijith@gmail.com",
    type: "Clinical Advisor",
    image: "/images/team/sindhu.jpg",
    avatarInitials: "SA",
    avatarBg: "from-primary to-sky-500",
    skills: ["Pediatric Nutrition", "Functional Medicine", "Meal Validation"],
    responsibilities: [
      "Designing Meal Security Algorithms",
      "Clinical Ingredient Risk Rules",
      "Reviewing AI Advice Against Standards"
    ],
    achievements: "Designed original ingredient warning classification matrices."
  },
  {
    id: "armugam",
    name: "Dr. A. Armugam, M.D., D.C.H.",
    role: "Professor & Head of Pediatrics (Rtd)",
    department: "Pediatrics & Child Health",
    type: "Clinical Advisor",
    image: "/images/team/armugam.png",
    avatarInitials: "AA",
    avatarBg: "from-primary to-sky-500",
    skills: ["Pediatrics", "Clinical Medicine", "Child Growth Tracks"],
    responsibilities: [
      "Reviewing Growth Velocity Charts",
      "Pediatric Benchmark Oversight",
      "Medical Soundness Validation"
    ],
    achievements: "Validated growth percentile mapping calculations."
  }
];

// ==========================================
// 2. HELPER INTERACTIVE SUBCOMPONENTS
// ==========================================

// --- A. Cinematic Page Loader ---
const PageLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 70);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#101a22] text-white"
    >
      <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-accent-orange/10 blur-[100px]" />

      <div className="relative flex flex-col items-center gap-6">
        {/* SVG Animated Logo in Brand Colors */}
        <svg width="70" height="70" viewBox="0 0 100 100" className="drop-shadow-[0_0_20px_rgba(43,157,238,0.4)]">
          <motion.path
            d="M 50 15 C 30 15, 15 30, 15 50 C 15 70, 30 85, 50 85 C 70 85, 85 70, 85 50 C 85 30, 70 15, 50 15 Z"
            fill="none"
            stroke="#2b9dee"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.path
            d="M 35 45 C 40 55, 60 55, 65 45"
            fill="none"
            stroke="#FF8C42"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          />
        </svg>

        <div className="text-center">
          <h3 className="text-lg font-extrabold tracking-widest text-slate-100 uppercase">NutriBite</h3>
          <span className="text-xs text-slate-400 font-bold block mt-1 tracking-wider">LOADING ENVIRONMENT</span>
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-2 tracking-wider">
          <span>COMPILING FILES</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <div className="h-[4px] w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// --- B. Glowing Scroll Progress Bar ---
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  const color = useTransform(scrollYProgress, [0, 0.5, 1], ["#2b9dee", "#FF8C42", "#a855f7"]);

  return (
    <motion.div
      style={{ scaleX, backgroundColor: color }}
      className="fixed top-0 left-0 right-0 h-[4px] origin-left z-50 shadow-[0_2px_8px_rgba(43,157,238,0.4)] pointer-events-none"
    />
  );
};

// --- C. Cursor Lightspot Spotlight Overlay ---
const Spotlight = ({ mouseX, mouseY }) => {
  const spotlightX = useSpring(mouseX, { stiffness: 80, damping: 25 });
  const spotlightY = useSpring(mouseY, { stiffness: 80, damping: 25 });

  return (
    <motion.div
      style={{
        left: spotlightX,
        top: spotlightY,
      }}
      className="fixed -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-primary/5 via-transparent to-transparent pointer-events-none z-[1] mix-blend-screen"
    />
  );
};

// --- D. Upward Rolling Counter for Metrics ---
const MetricCounter = ({ value, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value);
      if (isNaN(end)) return;
      const duration = 1.8;
      const stepTime = Math.max(Math.floor((duration * 1000) / end), 15);
      const increment = Math.ceil(end / 40);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums font-black text-primary">
      {count}
      {suffix}
    </span>
  );
};

// --- E. 3D Tilt Card Container ---
const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 150, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 150, damping: 22 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    x.set(-mouseY / (height / 15));
    y.set(mouseX / (width / 15));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`perspective-1000 ${className}`}
    >
      <div style={{ transform: "translateZ(20px)" }} className="w-full h-full">
        {children}
      </div>
    </motion.div>
  );
};

// --- F. SVG Interactive Mascot ---
const InteractiveMascot = ({ mouseX, mouseY }) => {
  const pupilX = useTransform(mouseX, [0, 1920], [-4, 4]);
  const pupilY = useTransform(mouseY, [0, 1080], [-3, 3]);

  const springPupilX = useSpring(pupilX, { stiffness: 150, damping: 18 });
  const springPupilY = useSpring(pupilY, { stiffness: 150, damping: 18 });

  const breathingScaleY = {
    animate: {
      scaleY: [1, 1.02, 1],
      y: [0, -1.5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      {/* Recolored Orbit lines to match blue/orange branding */}
      <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-spin" style={{ animationDuration: '40s' }} />
      <div className="absolute inset-10 rounded-full border border-accent-orange/15 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-2 rounded-full shadow border border-slate-200/50 dark:border-slate-800/80 text-primary">
            <Apple size={18} />
          </div>
        </motion.div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear", delay: 2 }}
          className="absolute inset-0"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white dark:bg-slate-900 p-2 rounded-full shadow border border-slate-200/50 dark:border-slate-800/80 text-accent-orange">
            <Sparkles size={18} />
          </div>
        </motion.div>
      </div>

      <motion.svg
        variants={breathingScaleY}
        animate="animate"
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        className="z-10 filter drop-shadow-[0_10px_20px_rgba(43,157,238,0.15)]"
      >
        <circle cx="100" cy="100" r="60" fill="#FED7AA" className="dark:fill-amber-100" />
        
        {/* Recolored hair to match orange accent */}
        <path
          d="M 40 90 C 40 40, 160 40, 160 90 C 145 90, 130 75, 115 85 C 100 70, 80 80, 65 75 C 50 85, 45 90, 40 90 Z"
          fill="#FF8C42"
        />

        <circle cx="36" cy="105" r="12" fill="#FDBA74" />
        <circle cx="36" cy="105" r="6" fill="#FED7AA" />
        <circle cx="164" cy="105" r="12" fill="#FDBA74" />
        <circle cx="164" cy="105" r="6" fill="#FED7AA" />

        <circle cx="65" cy="120" r="10" fill="#FCA5A5" opacity="0.4" />
        <circle cx="135" cy="120" r="10" fill="#FCA5A5" opacity="0.4" />

        {isBlinking ? (
          <>
            <path d="M 65 105 Q 75 110, 85 105" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <path d="M 115 105 Q 125 110, 135 105" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="75" cy="105" r="12" fill="white" />
            <motion.circle
              style={{ x: springPupilX, y: springPupilY }}
              cx="75"
              cy="105"
              r="6"
              fill="#0F172A"
            />
            <motion.circle
              style={{ x: springPupilX, y: springPupilY }}
              cx="72"
              cy="102"
              r="2"
              fill="white"
            />

            <circle cx="125" cy="105" r="12" fill="white" />
            <motion.circle
              style={{ x: springPupilX, y: springPupilY }}
              cx="125"
              cy="105"
              r="6"
              fill="#0F172A"
            />
            <motion.circle
              style={{ x: springPupilX, y: springPupilY }}
              cx="122"
              cy="102"
              r="2"
              fill="white"
            />
          </>
        )}

        <path
          d="M 85 125 Q 100 140, 115 125"
          stroke="#9A3412"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>
    </div>
  );
};

// ==========================================
// 3. PROFILE CARD COMPONENT WITH FALLBACK
// ==========================================
const TeamProfileCard = ({ member }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative flex flex-col p-6 rounded-[2rem] bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/45 backdrop-blur-md transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-primary/35 to-sky-400/35" />
      <div className="absolute inset-0 bg-radial from-primary/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-sky-400 shadow-sm shrink-0 flex items-center justify-center">
          {member.image && !imageError ? (
            <img
              src={member.image}
              alt={member.name}
              onError={() => setImageError(true)}
              className="h-full w-full rounded-full object-cover bg-white dark:bg-slate-900 border border-white/50 dark:border-slate-800"
            />
          ) : (
            <div className={`h-full w-full rounded-full bg-gradient-to-br ${member.avatarBg} text-white flex items-center justify-center font-black text-base shadow-inner`}>
              {member.avatarInitials}
            </div>
          )}
        </div>
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary dark:bg-primary/20 tracking-wider mb-1">
            {member.type}
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{member.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{member.role}</p>
        </div>
      </div>

      {member.department && (
        <div className="mb-4 px-3 py-2 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/30 dark:border-slate-700/30">
          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Affiliation</span>
          {member.department}
        </div>
      )}

      {/* Skill Chips */}
      <div className="mb-4">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">Focus Areas</span>
        <div className="flex flex-wrap gap-1.5">
          {member.skills.map((skill, sIdx) => (
            <span key={sIdx} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-150/80 dark:bg-slate-800 text-slate-655 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Key Responsibilities */}
      <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex-1">
        <div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">Responsibilities</span>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-350">
            {member.responsibilities.map((resp, rIdx) => (
              <li key={rIdx} className="flex gap-2 items-start leading-relaxed">
                <CheckCircle size={12} className="text-primary mt-0.5 shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {member.achievements && (
          <div className="mt-3 bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl border border-primary/10 text-xs italic text-slate-655 dark:text-slate-300 font-medium">
            <span className="text-[10px] uppercase font-black text-primary tracking-wider not-italic block mb-0.5">Key Impact</span>
            "{member.achievements}"
          </div>
        )}
      </div>

      {/* Contact Link */}
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-primary/15 dark:hover:bg-primary/20 text-slate-655 hover:text-primary dark:text-slate-300 dark:hover:text-primary border border-slate-200/50 dark:border-slate-800 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.01]"
        >
          <Mail size={14} />
          <span>Send Message</span>
        </a>
      )}
    </motion.div>
  );
};

// ==========================================
// 4. MAIN ABOUT PAGE WRAPPER
// ==========================================

const AboutPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Filtering team members list
  const filteredTeam = useMemo(() => {
    if (activeCategory === "students") return CONTRIBUTORS;
    if (activeCategory === "mentors") return GUIDES;
    if (activeCategory === "advisors") return DOCTORS;
    return [...CONTRIBUTORS, ...GUIDES, ...DOCTORS];
  }, [activeCategory]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500">
      
      {/* Cinematic Loader */}
      <AnimatePresence mode="wait">
        {loading && <PageLoader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <ScrollProgress />
      <Spotlight mouseX={mouseX} mouseY={mouseY} />
      
      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Recolored background mesh gradient spots */}
      <div className="absolute top-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[150px] animate-mesh-1 pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-sky-200/10 dark:bg-sky-900/5 blur-[180px] pointer-events-none" />

      <Header />

      <main className="flex-1 pt-24 relative z-10">

        {/* ==========================================
            SECTION 1: HERO SECTION
        ========================================== */}
        <section className="relative px-6 py-20 md:px-20 lg:px-40 overflow-visible max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Text */}
          <div className="flex flex-col gap-8 lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20 w-fit"
            >
              <Sparkles size={14} />
              <span>Our Origins | About NutriBite</span>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl">
                Building the Future of <span className="text-primary">Pediatric Nutrition</span>
              </h1>
              <p className="max-w-[500px] text-lg leading-relaxed text-slate-655 dark:text-slate-450">
                Empower families and healthcare professionals with intelligent nutrition insights that improve childhood health outcomes, promoting healthy eating, immunity support, and kids nutrition tracking worldwide.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link 
                href="/register" 
                className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-base font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all"
              >
                <span>Join Platform</span>
                <ArrowRight size={16} className="ml-2" />
              </Link>
              
              <Link 
                href="/pricing" 
                className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-base font-bold shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <span>View Pricing</span>
              </Link>
            </div>
          </div>

          {/* Right Mascot with interactive eyes */}
          <div className="flex-1 flex items-center justify-center lg:w-1/2">
            <InteractiveMascot mouseX={mouseX} mouseY={mouseY} />
          </div>
        </section>

        {/* ==========================================
            SECTION 2: WHY NUTRIBITE WAS CREATED (REFINED STORYTELLING)
        ========================================== */}
        <section className="px-6 py-24 bg-white dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-900">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                The Story
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                Why NutriBite Was Created
              </h2>
              <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                Bridging the critical diagnostics and communication gap between family dining tables and pediatric clinics.
              </p>
            </div>

            {/* Split Problem Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Parent struggle */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-orange/10 text-accent-orange mb-6">
                  <Heart size={22} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Parents struggle with:</h3>
                <ul className="space-y-4 flex-1">
                  {[
                    "Identifying dietary deficiencies and micro-nutrient gaps early",
                    "Accurately tracking growth percentiles and development tracking",
                    "Structuring age-specific healthy meal plans for child behavior",
                    "Accessing immediate, science-backed pediatric food guidance"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                      <span className="text-accent-orange font-bold select-none">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Doctors lack */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                  <Users size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Pediatricians often lack:</h3>
                <ul className="space-y-4 flex-1">
                  {[
                    "Continuous, daily out-of-clinic nutrition logs and metrics",
                    "Accurate daily child intake and physical activity logs",
                    "Longitudinal, reliable growth trend visibility",
                    "Secure, clinical validation frameworks shared with families"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                      <span className="text-primary font-bold select-none">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

            </div>

            {/* Showcase Bridge Solution Grid */}
            <div className="text-center pt-8 space-y-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Our Connected Solution
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { title: "AI Assistant", desc: "Real-time AI analysis of daily pediatric meal logs", icon: Sparkles },
                  { title: "Growth Monitor", desc: "Pediatric growth velocity and tracking logs", icon: Activity },
                  { title: "Nutrition Analysis", desc: "Granular check for kids nutritional gaps", icon: FileText },
                  { title: "Clinical Collaboration", desc: "Shared records portal for family and pediatricians", icon: GraduationCap },
                  { title: "Personalized Recs", desc: "Clinically backed meal plans for immunity support", icon: Apple }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.08, duration: 0.5 }}
                    className="flex flex-col items-center p-6 rounded-2xl bg-slate-550/5 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-center shadow-xs hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 shrink-0">
                      <item.icon size={18} />
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mb-2 leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ==========================================
            SECTIONS 3 & 4: VISION & MISSION 3D CARDS
        ========================================== */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Vision 3D Card in Brand Gray/Blue */}
            <TiltCard className="h-full">
              <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-8 md:p-12 text-slate-850 dark:text-slate-100 shadow-md">
                <div className="absolute top-[-30px] right-[-30px] w-56 h-56 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full gap-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner text-primary">
                    <Rocket size={28} />
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-4 text-slate-900 dark:text-white">Our Vision</h3>
                  
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold flex-1">
                    {"Create a future where every child receives personalized, accessible, and data-driven nutritional care. We aim to integrate clinical intelligence with everyday parenting habits to secure long-term childhood immunity.".split(" ").map((word, idx) => (
                      <motion.span
                        key={idx}
                        className="inline-block mr-1"
                        initial={{ opacity: 0.3 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.01 }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mt-6">
                    <span>Clinical Safety Gating</span>
                    <ShieldCheck size={16} />
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Mission 3D Card in Brand Gray/Blue */}
            <TiltCard className="h-full">
              <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-8 md:p-12 text-slate-850 dark:text-slate-100 shadow-md">
                <div className="absolute top-[-30px] right-[-30px] w-56 h-56 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full gap-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner text-primary">
                    <Eye size={28} />
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-4 text-slate-900 dark:text-white">Our Mission</h3>
                  
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold flex-1">
                    {"Empower families and healthcare professionals with intelligent nutrition insights that improve childhood health outcomes. Through our secure platform, we make pediatric nutrition insights actionable for everyone.".split(" ").map((word, idx) => (
                      <motion.span
                        key={idx}
                        className="inline-block mr-1"
                        initial={{ opacity: 0.3 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.01 }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mt-6">
                    <span>Precision Monitoring</span>
                    <Activity size={16} />
                  </div>
                </div>
              </div>
            </TiltCard>

          </div>
        </section>

        {/* ==========================================
            SECTION 5: ROADMAP TIMELINE
        ========================================== */}
        <section className="px-6 py-24 max-w-5xl mx-auto overflow-visible relative">
          <div className="text-center space-y-4 mb-20">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
              The Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Our Roadmap & Timeline
            </h2>
            <p className="max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400">
              From the initial idea to clinical validation and the launch of AI nutrition services.
            </p>
          </div>

          <div className="relative space-y-16 pl-8 md:pl-0">
            {/* Draw Vertical Road Line in Brand Blue */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="w-full bg-gradient-to-b from-primary to-sky-400 rounded-full origin-top"
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>

            {[
              { title: "Project Idea & Scope", step: "Step 01", desc: "Recognized the diagnostic communication gap between pediatricians and parents tracking nutritional habits.", icon: Brain, align: "left" },
              { title: "RAG & LLM Research", step: "Step 02", desc: "Compiled over 10,000+ pediatric nutrition data vectors for building LLM RAG pipelines.", icon: FileText, align: "right" },
              { title: "Clinical Validation", step: "Step 03", desc: "Collaborated with clinical advisors Dr. A. Armugam and nutritionist Sindhu Abhijith to set food ingredient gates.", icon: ShieldCheck, align: "left" },
              { title: "AI Model Development", step: "Step 04", desc: "Built pediatric chatbot and growth metrics tracker with real-time food evaluation modules.", icon: Sparkles, align: "right" },
              { title: "Nutrition Intelligence Testing", step: "Step 05", desc: "Conducted regression test suites validating dietary alert responses and 2FA user security audits.", icon: Activity, align: "left" },
              { title: "Launch and Future Plans", step: "Step 06", desc: "Released NutriBite platform. Ready to expand clinical tools and support growth analysis updates.", icon: Rocket, align: "right" }
            ].map((milestone, idx) => (
              <div key={idx} className="relative flex flex-col md:flex-row items-center overflow-visible">
                {/* Node Dot */}
                <div className="absolute left-4 md:left-1/2 top-1.5 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-4 border-primary shadow flex items-center justify-center text-primary">
                  <milestone.icon size={14} className="animate-pulse" />
                </div>

                <div className={`w-full md:w-1/2 flex ${milestone.align === "left" ? "md:justify-end md:pr-16" : "md:justify-start md:pl-16"}`}>
                  <motion.div
                    initial={{ opacity: 0, x: milestone.align === "left" ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm max-w-sm"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{milestone.step}</span>
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{milestone.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{milestone.desc}</p>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION 6: INTERACTIVE TEAM SECTION (PROFESSIONAL GRID ONLY)
        ========================================== */}
        <section className="relative bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-900 px-4 py-24">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Section Header */}
            <div className="text-center space-y-4">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                Our Core Team
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Meet the Minds Behind NutriBite
              </h2>
              <p className="max-w-xl mx-auto text-xs text-slate-500 dark:text-slate-400">
                The engineering, clinical guidance, and mentorship core driving pediatric health intelligence.
              </p>
            </div>

            {/* Category Triggers (Tabs) */}
            <div className="flex flex-wrap justify-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-4 max-w-xl mx-auto">
              {[
                { id: "all", label: "All Directory", icon: Users },
                { id: "students", label: "Students Core", icon: Brain },
                { id: "mentors", label: "Guides & Mentors", icon: GraduationCap },
                { id: "advisors", label: "Clinical Advisors", icon: ShieldCheck }
              ].map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${active ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-200/60 text-slate-655 dark:bg-slate-900/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-950 border border-slate-300/30 dark:border-slate-800/30"}`}
                  >
                    <tab.icon size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Cards Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredTeam.map((member) => (
                  <TeamProfileCard key={member.id} member={member} />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* ==========================================
            SECTION 7: METRICS NUMBERS SECTION
        ========================================== */}
        <section className="px-6 py-20 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-center items-center">
            {[
              { value: "5", suffix: "+", label: "Student Contributors" },
              { value: "2", suffix: "", label: "Expert Mentors" },
              { value: "2", suffix: "", label: "Clinical Advisors" },
              { value: "100", suffix: "+", label: "Research Hours" },
              { value: "2000", suffix: "+", label: "Target Families" }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-4xl md:text-5xl font-black tracking-tight flex justify-center items-center">
                  <MetricCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION 8: CORE VALUES (PROFESSIONAL GRID LAYOUT)
        ========================================== */}
        <section className="px-6 py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Section Header */}
            <div className="text-center space-y-4">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                Core Pillars
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                The Values Driving Our Platform
              </h2>
              <p className="max-w-xl mx-auto text-xs text-slate-500 dark:text-slate-400">
                Every line of code and clinical advice in NutriBite follows these primary values.
              </p>
            </div>

            {/* Structured Value Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Innovation", desc: "Pioneering pediatric diagnostics utilizing secure Generative AI pipelines.", icon: Sparkles },
                { title: "Data Security", desc: "End-to-end encryption for child records, logs, and two-factor authentication.", icon: Lock },
                { title: "Clinical Soundness", desc: "Doctor-approved nutrition rules, ingredient checking, and growth tracks.", icon: ShieldCheck },
                { title: "Platform Access", desc: "Clinical dashboards available for parents, mentors, and advisors anywhere.", icon: Globe },
                { title: "Medical Benchmarking", desc: "Rigorous diagnostic validation compared against pediatric specifications.", icon: Brain },
                { title: "Growth Tracking", desc: "Longitudinal growth velocity graphs tracking progress charts accurately.", icon: Activity }
              ].map((valueCard, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="flex flex-col p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 shadow-xs hover:shadow-lg transition-all duration-300 hover:border-primary/20 hover:scale-[1.01]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 shrink-0">
                    <valueCard.icon size={18} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 leading-tight">{valueCard.title}</h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{valueCard.desc}</p>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
