"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Activity, ShieldCheck, ShoppingCart, Apple, ArrowRight, 
  Brain, CheckCircle, Mail, Globe, Users, FileText, Download, UserCheck, 
  Flame, Trash2, ShieldAlert, Award, Smile, Plus, RefreshCw
} from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

// ==========================================
// 1. DUMMY DATA FOR FEATURES LIST
// ==========================================

const FEATURE_CATEGORIES = [
  { id: "all", label: "All Features", icon: Globe },
  { id: "parents", label: "For Parents", icon: Heart },
  { id: "kids", label: "For Kids", icon: Smile },
  { id: "doctors", label: "For Doctors", icon: Activity },
  { id: "ai", label: "AI & Smart Tools", icon: Brain }
];

const FEATURES_DATA = [
  // Parent Features
  {
    id: "multi-child",
    category: "parents",
    title: "Multi-Child Profiles",
    desc: "Create and track separate profiles for each of your children, customized by age, gender, and metrics.",
    problem: "Parents manage kids of different age groups and medical needs; tracking them collectively leads to mismatched data.",
    highlight: "Interactive avatars and separate clinical databases per profile.",
    icon: Users,
    color: "from-blue-500 to-indigo-500"
  },
  {
    id: "nutrition-journal",
    category: "parents",
    title: "115+ Indian Foods Journal",
    desc: "Log daily food intake across 6 flexible slots using an extensive database of Indian recipes populated with micro and macro nutrient levels.",
    problem: "Most tracking tools focus on Western diets, which fails to correctly calculate the nutritional value of traditional Indian cooking.",
    highlight: "Track protein, carbs, fats, vitamins, and fibers easily.",
    icon: Apple,
    color: "from-amber-500 to-orange-500"
  },
  {
    id: "sleep-tracking",
    category: "parents",
    title: "Intelligent Sleep Logger",
    desc: "Record sleep/wake times and get automated health assessments categorizing sleep cycles as Poor, Healthy, or Oversleep.",
    problem: "Child wellness is not just about diet; irregular sleep patterns severely impact cognitive development and immune responses.",
    highlight: "Maintains consecutive sleep logging streaks for habit forming.",
    icon: ShieldCheck,
    color: "from-purple-500 to-indigo-600"
  },
  {
    id: "grocery-integration",
    category: "parents",
    title: "Grocery Gap Cart",
    desc: "Automatically identifies nutritional gaps in logged meals and populates a grocery shopping checklist to replenish deficiencies.",
    problem: "Knowing a child is low in vitamins is useless without knowing what specific grocery store ingredients will replenish those gaps.",
    highlight: "Offline shopping list download utility (.txt file export).",
    icon: ShoppingCart,
    color: "from-emerald-500 to-teal-500"
  },
  // Kids Features
  {
    id: "mascots",
    category: "kids",
    title: "Interactive Superhero Mascots",
    desc: "Children select a personalized animal food buddy (Lion, Bear, Rabbit) who joins them on their health journey, encouraging good habits.",
    problem: "Children reject strict nutritional regimens and lose motivation when forced to follow dry clinical tracking interfaces.",
    highlight: "Mascots visually react to healthy logging achievements.",
    icon: Smile,
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "gamification",
    category: "kids",
    title: "XP & Level-Up Quests",
    desc: "Kids earn experience points (XP) for tracking water, completing exercises, and logging balanced meals, unlocking custom badges.",
    problem: "Convincing children to eat healthy greens and drink water requires constant parental nagging instead of active child desire.",
    highlight: "Gamified leveling mechanics keeps child screen-time productive.",
    icon: Award,
    color: "from-yellow-500 to-amber-600"
  },
  {
    id: "streaks",
    category: "kids",
    title: "Habit Streaks Center",
    desc: "Keeps kids motivated through visual flame streaks tracking consecutive days of water goals, sleep targets, and nutrition logs.",
    problem: "Children quickly drop positive habits unless there is a visual, continuous progress indicator showing they are on a roll.",
    highlight: "Provides visual prompts to prevent breaking positive cycles.",
    icon: Flame,
    color: "from-orange-500 to-red-500"
  },
  // Doctor Features
  {
    id: "secure-handshake",
    category: "doctors",
    title: "Access Request Handshake",
    desc: "Doctors securely request access to profiles via parent emails, protected by full role-based authorization protocols.",
    problem: "Sharing medical records through messaging apps violates patient privacy laws (HIPAA/GDPR) and leaks sensitive childhood data.",
    highlight: "Toggle between Restricted View and Full Clinical access.",
    icon: UserCheck,
    color: "from-sky-500 to-blue-600"
  },
  {
    id: "growth-velocity",
    category: "doctors",
    title: "Growth Velocity Analytics",
    desc: "Tracks child BMI, height, and weight trends. Built-in alarms flag risk levels (obese, underweight) and display pediatric warnings.",
    problem: "Slow physical growth drifts or rapid BMI changes often go unnoticed by parents until the child enters a high-risk category.",
    highlight: "Integrated with AI growth analysis calculations.",
    icon: Activity,
    color: "from-red-500 to-pink-600"
  },
  {
    id: "prescriptions",
    category: "doctors",
    title: "Clinical Prescriptions Portal",
    desc: "Pediatricians can write advice and set return schedules, which display as active countdown notifications on the parent's dashboard.",
    problem: "Parents lose physical prescription papers and forget recommended return dates, leading to skipped clinical checkups.",
    highlight: "Automated countdown cards let parents track appointment intervals.",
    icon: FileText,
    color: "from-cyan-500 to-teal-500"
  },
  // AI features
  {
    id: "rag-chat",
    category: "ai",
    title: "NutriGuide RAG Assistant",
    desc: "AI Nutrition assistant powered by dense vector search over official ICMR / NIN pediatric nutrition guides.",
    problem: "General search engine queries return unverified blogs, conflicting parenting threads, or outdated child health advice.",
    highlight: "Allows toggling sources to show raw clinical guidelines text.",
    icon: Brain,
    color: "from-violet-600 to-purple-600"
  },
  {
    id: "allergen-shield",
    category: "ai",
    title: "Deterministic Allergen Gating",
    desc: "Safety filter code intercepts recipes containing child allergens before they are sent to the LLM to safeguard food recommendations.",
    problem: "Generative LLMs occasionally hallucinate ingredients, potentially suggesting food options containing items the child is allergic to.",
    highlight: "Zero-latency local check guarantees prompt safety gating.",
    icon: ShieldCheck,
    color: "from-rose-600 to-red-600"
  },
  {
    id: "digital-twin",
    category: "ai",
    title: "Predictive Digital Twins",
    desc: "Builds a simulated physical twin of the child representing their nutritional levels and predicts future development outcomes.",
    problem: "Parents have difficulty visualizing how today's meal decisions accumulate to affect their child's physical growth trajectory months from now.",
    highlight: "A visual portal representing growth trajectories and goals.",
    icon: Sparkles,
    color: "from-indigo-500 to-purple-500"
  }
];

// Helper to render cute animal SVGs for the kids mode simulator
const renderBuddySVG = (buddyId, sizeClass = "w-16 h-16") => {
  switch (buddyId) {
    case "leo":
      return (
        <svg viewBox="0 0 100 100" className={`${sizeClass} transition-all duration-300 transform`}>
          {/* Mane */}
          <path d="M 50 10 A 12 12 0 0 1 65 18 A 12 12 0 0 1 82 25 A 12 12 0 0 1 85 45 A 12 12 0 0 1 90 65 A 12 12 0 0 1 78 82 A 12 12 0 0 1 60 90 A 12 12 0 0 1 40 90 A 12 12 0 0 1 22 82 A 12 12 0 0 1 10 65 A 12 12 0 0 1 15 45 A 12 12 0 0 1 18 25 A 12 12 0 0 1 35 18 Z" fill="#F59E0B" />
          {/* Inner Mane */}
          <circle cx="50" cy="50" r="34" fill="#D97706" />
          {/* Ears */}
          <circle cx="28" cy="28" r="9" fill="#F59E0B" />
          <circle cx="28" cy="28" r="5" fill="#FEF3C7" />
          <circle cx="72" cy="28" r="9" fill="#F59E0B" />
          <circle cx="72" cy="28" r="5" fill="#FEF3C7" />
          {/* Face */}
          <circle cx="50" cy="53" r="28" fill="#FBBF24" />
          {/* Eyes */}
          <circle cx="40" cy="48" r="3.5" fill="#1F2937" />
          <circle cx="39" cy="46" r="1.2" fill="#FFFFFF" />
          <circle cx="60" cy="48" r="3.5" fill="#1F2937" />
          <circle cx="59" cy="46" r="1.2" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="34" cy="56" r="3" fill="#EF4444" opacity="0.4" />
          <circle cx="66" cy="56" r="3" fill="#EF4444" opacity="0.4" />
          {/* Snout */}
          <ellipse cx="50" cy="57" rx="6" ry="4" fill="#FEF3C7" />
          {/* Nose */}
          <polygon points="47,55 53,55 50,58" fill="#1F2937" />
          {/* Mouth */}
          <path d="M 47 59 Q 50 61 53 59" fill="none" stroke="#1F2937" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case "pom":
      return (
        <svg viewBox="0 0 100 100" className={`${sizeClass} transition-all duration-300 transform`}>
          {/* Ears */}
          <circle cx="25" cy="25" r="12" fill="#EC4899" />
          <circle cx="25" cy="25" r="6" fill="#FBCFE8" />
          <circle cx="75" cy="25" r="12" fill="#EC4899" />
          <circle cx="75" cy="25" r="6" fill="#FBCFE8" />
          {/* Face */}
          <circle cx="50" cy="55" r="36" fill="#F472B6" />
          {/* Eye Patches */}
          <ellipse cx="38" cy="48" rx="8" ry="10" fill="#DB2777" opacity="0.3" />
          <ellipse cx="62" cy="48" rx="8" ry="10" fill="#DB2777" opacity="0.3" />
          {/* Eyes */}
          <circle cx="38" cy="48" r="4.5" fill="#1F2937" />
          <circle cx="36.5" cy="46" r="1.5" fill="#FFFFFF" />
          <circle cx="62" cy="48" r="4.5" fill="#1F2937" />
          <circle cx="60.5" cy="46" r="1.5" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="26" cy="60" r="4" fill="#EF4444" opacity="0.5" />
          <circle cx="74" cy="60" r="4" fill="#EF4444" opacity="0.5" />
          {/* Snout */}
          <ellipse cx="50" cy="58" rx="7" ry="5" fill="#FFF1F2" />
          <circle cx="50" cy="56" r="2.5" fill="#1F2937" />
          <path d="M 46 59 Q 50 63 54 59" fill="none" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "bun":
      return (
        <svg viewBox="0 0 100 100" className={`${sizeClass} transition-all duration-300 transform`}>
          {/* Long Ears */}
          <path d="M 32 38 C 22 8, 44 8, 40 38 Z" fill="#38BDF8" />
          <path d="M 34 38 C 28 15, 40 15, 38 38 Z" fill="#FCE7F3" />
          <path d="M 68 38 C 78 8, 56 8, 60 38 Z" fill="#38BDF8" />
          <path d="M 66 38 C 72 15, 60 15, 62 38 Z" fill="#FCE7F3" />
          {/* Face */}
          <circle cx="50" cy="62" r="30" fill="#0EA5E9" />
          {/* Eyes */}
          <circle cx="39" cy="57" r="4" fill="#1F2937" />
          <circle cx="37.5" cy="55" r="1.2" fill="#FFFFFF" />
          <circle cx="61" cy="57" r="4" fill="#1F2937" />
          <circle cx="59.5" cy="55" r="1.2" fill="#FFFFFF" />
          {/* Blush */}
          <circle cx="29" cy="65" r="4" fill="#EF4444" opacity="0.4" />
          <circle cx="71" cy="65" r="4" fill="#EF4444" opacity="0.4" />
          {/* Nose & Mouth */}
          <polygon points="48,61 52,61 50,63" fill="#F472B6" />
          <path d="M 46 65 Q 50 68 54 65" fill="none" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" />
          {/* Buck Teeth */}
          <rect x="48" y="65" width="4" height="3" fill="#FFFFFF" stroke="#1F2937" strokeWidth="0.5" />
        </svg>
      );
    case "swift":
      return (
        <svg viewBox="0 0 100 100" className={`${sizeClass} transition-all duration-300 transform`}>
          {/* Hair Tuft/Flame */}
          <path d="M 50 8 C 65 20, 55 35, 50 35 C 45 35, 35 20, 50 8 Z" fill="#EF4444" />
          {/* Ears */}
          <polygon points="18,50 12,24 34,40" fill="#F97316" />
          <polygon points="18,48 15,28 30,40" fill="#FEE2E2" />
          <polygon points="82,50 88,24 66,40" fill="#F97316" />
          <polygon points="82,48 85,28 70,40" fill="#FEE2E2" />
          {/* Face */}
          <polygon points="18,50 82,50 72,82 50,90 28,82" fill="#F97316" />
          <polygon points="26,50 74,50 68,78 50,86 32,78" fill="#FBAF24" />
          {/* Eyes */}
          <ellipse cx="38" cy="55" rx="4.5" ry="6" fill="#1F2937" />
          <circle cx="36.5" cy="52" r="1.5" fill="#FFFFFF" />
          <ellipse cx="62" cy="55" rx="4.5" ry="6" fill="#1F2937" />
          <circle cx="60.5" cy="52" r="1.5" fill="#FFFFFF" />
          {/* Cheek blush */}
          <circle cx="28" cy="66" r="3.5" fill="#EF4444" opacity="0.5" />
          <circle cx="72" cy="66" r="3.5" fill="#EF4444" opacity="0.5" />
          {/* Nose/Mouth */}
          <circle cx="50" cy="64" r="2" fill="#1F2937" />
          <path d="M 45 68 Q 50 74 55 68" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

const FeaturesPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Playground state variables
  const [selectedBuddy, setSelectedBuddy] = useState("leo");
  const [waterLogged, setWaterLogged] = useState(500); // in ml
  const [growthAge, setGrowthAge] = useState(4);
  const [activeAllergies, setActiveAllergies] = useState(["peanut"]);
  const [shieldMealInput, setShieldMealInput] = useState("Apple Slices & Peanut Butter Toast");
  const [shieldStatus, setShieldStatus] = useState(null);

  // Mouse Spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Filter features
  const filteredFeatures = useMemo(() => {
    if (activeCategory === "all") return FEATURES_DATA;
    return FEATURES_DATA.filter(feat => feat.category === activeCategory);
  }, [activeCategory]);

  // Buddy Speech generator
  const getBuddySpeech = () => {
    switch (selectedBuddy) {
      case "leo":
        return "Roar! Let's eat some delicious green vegetables today to build our immunity shield!";
      case "pom":
        return "Zzz... Make sure to record at least 9 hours of sleep today so we grow big and strong!";
      case "bun":
        return "Crunch, crunch! Carrots are my favorite! We've unlocked 25 XP today together!";
      case "swift":
        return "Zoom! An hour of outdoor play is perfect for keeping our activity streak hot!";
      default:
        return "Let's track our health today!";
    }
  };

  // Water level calculation (max 1500ml)
  const waterPercentage = useMemo(() => {
    return Math.min(100, Math.max(0, (waterLogged / 1500) * 100));
  }, [waterLogged]);

  // Growth calculations
  const growthData = useMemo(() => {
    // mock percentile details based on selected age
    switch (parseInt(growthAge)) {
      case 2: return { height: "86 cm", weight: "12.2 kg", bmi: "16.5", status: "Healthy Weight", color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/50" };
      case 4: return { height: "102 cm", weight: "16.1 kg", bmi: "15.5", status: "Healthy Weight", color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/50" };
      case 6: return { height: "115 cm", weight: "20.5 kg", bmi: "15.5", status: "Healthy Weight", color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/50" };
      case 8: return { height: "128 cm", weight: "31.2 kg", bmi: "19.0", status: "Overweight Warning", color: "text-orange-500 bg-orange-100 dark:bg-orange-950/50" };
      default: return { height: "102 cm", weight: "16.1 kg", bmi: "15.5", status: "Healthy Weight", color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/50" };
    }
  }, [growthAge]);

  // Allergen Scan simulator
  const handleMealScan = () => {
    if (!shieldMealInput.trim()) {
      setShieldStatus(null);
      return;
    }
    
    const mealLower = shieldMealInput.toLowerCase();
    let triggeredAllergens = [];

    activeAllergies.forEach(allergy => {
      if (allergy === "peanut" && (mealLower.includes("peanut") || mealLower.includes("groundnut") || mealLower.includes("nut"))) {
        triggeredAllergens.push("Peanut");
      }
      if (allergy === "milk" && (mealLower.includes("milk") || mealLower.includes("butter") || mealLower.includes("cheese") || mealLower.includes("paneer") || mealLower.includes("dairy"))) {
        triggeredAllergens.push("Dairy/Milk");
      }
      if (allergy === "soy" && (mealLower.includes("soy") || mealLower.includes("tofu") || mealLower.includes("soya"))) {
        triggeredAllergens.push("Soy");
      }
    });

    if (triggeredAllergens.length > 0) {
      setShieldStatus({
        safe: false,
        msg: `🚨 SHIELD GATED! Meal contains active allergen: ${triggeredAllergens.join(", ")}. Food blocked from AI suggestions.`,
      });
    } else {
      setShieldStatus({
        safe: true,
        msg: "✅ SAFE TO LOG! Meal contains no active profile allergens. Checked by Allergen Shield.",
      });
    }
  };

  // Re-run scan when allergy selection or input changes
  useEffect(() => {
    if (shieldStatus) {
      handleMealScan();
    }
  }, [activeAllergies, shieldMealInput]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500">
      
      {/* Scroll glow spotlight */}
      <div 
        style={{
          left: mouseX,
          top: mouseY,
        }}
        className="fixed -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-primary/5 via-transparent to-transparent pointer-events-none z-[1] mix-blend-screen hidden lg:block"
      />

      <div className="noise-overlay" />

      {/* Mesh gradients backgrounds */}
      <div className="absolute top-[5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[150px] animate-mesh-1 pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-orange/10 dark:bg-accent-orange/5 blur-[180px] animate-mesh-2 pointer-events-none" />

      <Header />

      <main className="flex-1 pt-24 relative z-10">
        
        {/* ==========================================
            HERO HEADER
        ========================================== */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20"
          >
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>Project Scope & Implementation Details</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            What is Done in <span className="text-primary">NutriKids</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed"
          >
            Explore all implemented modules of our pediatric nutrition platform. From AI RAG search filters and allergen security gates to gamified profiles and growth curves.
          </motion.p>
        </section>

        {/* ==========================================
            INTERACTIVE PLAYGROUND SECTION
        ========================================== */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-3 mb-10">
            <span className="inline-block rounded-full bg-accent-orange/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent-orange dark:bg-accent-orange/20">
              Interactive Demos
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              Try Implemented Platform Features
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-450 max-w-xl mx-auto">
              Simulated interactive prototypes showing key client side elements in our dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Play-card 1: Mascot Buddy Simulator */}
            <div className="flex flex-col bg-white/70 dark:bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Kids Mode Portal</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Food Buddy Mascot Speak</h3>
                </div>
                <div className="px-2.5 py-1 bg-primary/10 rounded-full text-xs font-extrabold text-primary">XP Level 4</div>
              </div>

              {/* Speech bubble */}
              <div className="flex-1 flex flex-col justify-center items-center gap-6 py-4">
                <div className="relative bg-slate-100 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[280px] text-center shadow-inner hover:scale-[1.01] transition-transform duration-300">
                  <p>"{getBuddySpeech()}"</p>
                  {/* Speech Bubble arrow */}
                  <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-100 dark:bg-slate-850 border-r border-b border-slate-200/60 dark:border-slate-800 rotate-45" />
                </div>

                {/* Avatar illustration */}
                <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-primary/20 to-accent-orange/20 flex items-center justify-center shadow-2xl border border-white/20 hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce" style={{ animationDuration: '3s' }}>
                  {renderBuddySVG(selectedBuddy, "w-20 h-20")}
                </div>
              </div>

              {/* Selector buttons */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
                {[
                  { id: "leo", label: "Leo" },
                  { id: "pom", label: "Pompom" },
                  { id: "bun", label: "Bunbun" },
                  { id: "swift", label: "Swift" }
                ].map(buddy => {
                  return (
                    <button
                      key={buddy.id}
                      onClick={() => setSelectedBuddy(buddy.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-xs font-bold transition-all hover:scale-110 active:scale-90 cursor-pointer group/buddy ${
                        selectedBuddy === buddy.id
                        ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 shadow-md shadow-primary/10'
                        : 'border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-350'
                      }`}
                    >
                      <div className="w-10 h-10 mb-1 flex items-center justify-center transition-transform duration-300 group-hover/buddy:scale-110 group-hover/buddy:rotate-3">
                        {renderBuddySVG(buddy.id, "w-8 h-8")}
                      </div>
                      <span>{buddy.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Play-card 2: Water Wave Fill Simulator */}
            <div className="flex flex-col bg-white/70 dark:bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Hydration tracking</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Direct Water Wave Logger</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full text-xs font-extrabold text-amber-500">
                  <Flame size={12} className="animate-pulse" />
                  <span>3 Day Streak</span>
                </div>
              </div>

              {/* Water logging details */}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6">
                {/* Visual Glass Container */}
                <div className="relative w-28 h-44 rounded-b-[2rem] rounded-t-lg border-4 border-slate-350 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-950/20 overflow-hidden shadow-lg flex items-end">
                  {/* Animated Wave */}
                  <motion.div 
                    animate={{
                      y: [0, -3, 0],
                      height: `${waterPercentage}%`
                    }}
                    transition={{
                      y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                      height: { duration: 0.4, ease: "easeOut" }
                    }}
                    className="w-full bg-gradient-to-t from-primary/80 to-sky-400/90 relative overflow-hidden transition-all"
                  >
                    {/* Inner liquid shine */}
                    <div className="absolute inset-0 bg-white/10 opacity-30 transform -skew-y-12 scale-110" />
                  </motion.div>

                  {/* Measurement labels */}
                  <div className="absolute inset-y-0 right-2 flex flex-col justify-between py-4 text-[9px] font-bold text-slate-400 select-none">
                    <span>1.5L</span>
                    <span>1.0L</span>
                    <span>0.5L</span>
                    <span>0.0L</span>
                  </div>

                  {/* Display value */}
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-slate-800 dark:text-white mix-blend-difference">
                    {waterLogged} ml
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-center md:text-left">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Quick Logging Stats</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mt-1 leading-relaxed">
                      Click the buttons to log liquid cups. Keep the hydrations level full! Target is 1.5L (1500ml).
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setWaterLogged(prev => Math.min(1500, prev + 250))}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+250ml Glass</span>
                    </button>
                    <button 
                      onClick={() => setWaterLogged(500)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-505 hover:text-primary border border-slate-200/50 dark:border-slate-750 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Reset Level"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Play-card 3: Growth Percentile Calculator */}
            <div className="flex flex-col bg-white/70 dark:bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Clinical Tracking</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Growth Percentile & BMI Simulator</h3>
                </div>
                <div className="px-2.5 py-1 bg-red-500/10 rounded-full text-xs font-extrabold text-red-500">WHO Standards</div>
              </div>

              {/* Calculator View */}
              <div className="flex-1 flex flex-col justify-center gap-6">
                {/* Age selector tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
                  {[2, 4, 6, 8].map(age => (
                    <button
                      key={age}
                      onClick={() => setGrowthAge(age)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        growthAge === age
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      Age {age}
                    </button>
                  ))}
                </div>

                {/* Growth statistics display grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-slate-850/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-300">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Average Height</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">{growthData.height}</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-850/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-300">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Average Weight</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">{growthData.weight}</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-850/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-300">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Calculated BMI</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">{growthData.bmi} kg/m²</span>
                  </div>
                  <div className={`p-4 rounded-2xl border border-transparent transition-all duration-300 flex flex-col justify-center hover:scale-[1.02] ${growthData.color}`}>
                    <span className="text-[9px] uppercase font-bold opacity-60 block mb-0.5">WHO Classification</span>
                    <span className="text-sm font-black">{growthData.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Play-card 4: Allergen Gating Shield */}
            <div className="flex flex-col bg-white/70 dark:bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">AI Guardrails</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">AI Allergen Gating Shield</h3>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 rounded-full text-xs font-extrabold text-emerald-500">
                  <ShieldCheck size={12} />
                  <span>Shield Active</span>
                </div>
              </div>

              {/* Simulation Guts */}
              <div className="flex-1 flex flex-col justify-center gap-4">
                {/* Allergy selection */}
                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-2">Set Profile Allergies</span>
                  <div className="flex gap-2">
                    {[
                      { id: "peanut", label: "Peanuts" },
                      { id: "milk", label: "Dairy & Milk" },
                      { id: "soy", label: "Soybeans" }
                    ].map(allergy => {
                      const active = activeAllergies.includes(allergy.id);
                      return (
                        <button
                          key={allergy.id}
                          onClick={() => {
                            if (active) {
                              setActiveAllergies(prev => prev.filter(a => a !== allergy.id));
                            } else {
                              setActiveAllergies(prev => [...prev, allergy.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            active
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          {allergy.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom input */}
                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Simulate Recipe / Food Input</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={shieldMealInput}
                      onChange={(e) => setShieldMealInput(e.target.value)}
                      placeholder="e.g. Oats Porridge, Milk, Peanut Toast"
                      className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={handleMealScan}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                {/* Diagnostic feedback area */}
                <div className="h-14 flex items-center">
                  {shieldStatus ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full p-3 rounded-xl border text-xs font-semibold ${
                        shieldStatus.safe 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {shieldStatus.msg}
                    </motion.div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Enter a food item above and click Scan to test the shield.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==========================================
            TAB CATEGORY CONTROLLER
        ========================================== */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-200/50 dark:border-slate-800/80 pb-6">
            {FEATURE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    activeCategory === cat.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-primary'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            FEATURES GRID
        ========================================== */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map(feat => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    layout
                    key={feat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="group relative flex flex-col justify-center items-center h-[280px] rounded-[2rem] bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/35 transition-all duration-500 overflow-hidden cursor-pointer p-6"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-[2rem] bg-gradient-to-r from-primary/35 to-sky-400/35 z-20" />
                    
                    {/* Front Face: Icon & Title only */}
                    <div className="flex flex-col items-center justify-center text-center h-full w-full transition-all duration-500 ease-out group-hover:scale-75 group-hover:opacity-0 group-hover:pointer-events-none">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-400 flex items-center justify-center shadow-sm mb-4 group-hover:animate-pulse">
                        <Icon size={26} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight px-2">{feat.title}</h3>
                      <span className="mt-3 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-slate-400">
                        {feat.category}
                      </span>
                      <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 opacity-60">
                        <span>Hover to view details</span>
                        <ArrowRight size={10} />
                      </div>
                    </div>

                    {/* Back / Hover Overlay Face: Description, Problem & Highlight */}
                    <div className="absolute inset-0 bg-white/98 dark:bg-slate-950/98 p-5 flex flex-col justify-between opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 rounded-[2rem] z-10 text-left border border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-0.5">
                            {feat.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">{feat.title}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                            {feat.desc}
                          </p>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] text-slate-655 dark:text-slate-300 leading-relaxed">
                          <span className="font-extrabold text-rose-500 dark:text-rose-400">Solves: </span>
                          <span>{feat.problem}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-accent-orange dark:text-amber-500 italic flex items-center gap-1.5 shrink-0">
                        <Sparkles size={12} className="text-amber-500 shrink-0" />
                        <span>{feat.highlight}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ==========================================
            CTA BANNER
        ========================================== */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-12 border border-slate-850 shadow-2xl text-center flex flex-col items-center gap-6">
            {/* background details */}
            <div className="absolute top-[10%] left-[10%] w-60 h-60 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-60 h-60 bg-accent-orange/20 rounded-full blur-3xl pointer-events-none" />
            
            <span className="inline-block rounded-full bg-primary/20 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Ready to explore?
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold max-w-xl">
              Experience the Clinical Assistant Dashboard Yourself
            </h2>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Create a parent or doctor account to start tracking, access RAG nutrition guides, and run digital twin diagnostics.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link 
                href="/register" 
                className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Create Account</span>
                <ArrowRight size={14} className="ml-2" />
              </Link>
              <Link 
                href="/" 
                className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-slate-800 border border-slate-700 text-white text-sm font-bold shadow-md hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
