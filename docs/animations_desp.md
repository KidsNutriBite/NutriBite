# Onboarding & Pre-Landing Page Animations Specification

This document provides a comprehensive technical overview and visual design breakdown of the medical-grade cinematic onboarding experience rendered before entering the main NutriKids Landing Page.

---

## 🏛️ Overall Flow & Architecture

The onboarding experience follows a 5-stage sequential story arc:

```
Splash Screen (Preloader)
       ↓
Slide 1: Hidden Reality (Nutrient Scan)
       ↓
Slide 2: Future Vision (Digital Twin Growth Graph)
       ↓
Slide 3: Clinical Trust (DNA & Doctor Safety Mesh)
       ↓
Slide 4: Kids Experience (Gamified Food Quests)
       ↓
Welcome Screen ("Mic-Drop" Question Arc)
       ↓
Landing Page
```

---

## ⚡ Key Engineering Principles

1. **Atomic Slide Unit Pattern**:
   - Each slide is rendered as a single atomic unit using Framer Motion's `AnimatePresence`.
   - Text elements and living visual components share a parent variant with `staggerChildren`. This guarantees that text and visual graphics **always animate in lockstep synchronization**, completely eliminating blank slides or images appearing without text.

2. **Asset Preloader Engine**:
   - Prior to entering the story slides, a Promise-based asset preloading engine buffers all high-resolution images (`/logo.png`, `/indian_food.jpg`, `/digital_twin.png`, `/doctor_safety.png`, `/gamified_kids.png`) directly into browser memory.

3. **60 FPS Hardware Acceleration**:
   - All animations rely strictly on GPU-accelerated CSS properties (`transform: translate3d(...)`, `opacity`, `filter: blur()`). Layout-shifting properties (`height`, `width`, `margin`) are never animated during transitions.

4. **Accessibility & Motion Preference**:
   - Full support for `prefers-reduced-motion` via Framer Motion's `useReducedMotion()`. When enabled, spatial translations collapse into soft, instantaneous fades.

---

## 🎨 Detailed Screen-by-Screen Animation Specifications

### 0. Splash Screen (Immersive Introduction)
* **File Locations**: [`Loader.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/Loader.jsx) • [`Loader.module.css`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/Loader.module.css)

#### Visual Elements & Motions:
* **Ambient Radial Background**: Soft radial gradient light (`#38BDF8`) centered behind the logo shell.
* **Pulsing Circular Energy Rings**: 5 concentric medical energy rings scale outwards from `scale(0)` to `scale(2.4)` with staggered timing, fading out gently at the perimeter.
* **Converging Micro Particles**: 24 floating background particles float with sine-wave motion towards the central brand logo.
* **Logo Float & Shimmer**: The main NutriKids logo floats continuously up and down (`y: -16px`) over a 2.8s sine loop with an animated linear shimmer overlay (`background-position`).
* **Letter-Staggered Headline**: Title text (*"NutriKids • Pediatric Nutrition Intelligence"*) renders with 3D perspective rotation (`rotateX(-40deg)` to `rotateX(0deg)`) staggered letter by letter.
* **Progress Bar & Tap Button**: Shows exact loading percentage during asset preloading, morphing into a pulsing **"Begin Onboarding Journey"** button upon 100% completion.

---

### 1. Slide 1 — The Hidden Reality ("Are Healthy Meals Really Enough?")
* **File Locations**: [`LivingNutrientScan.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingNutrientScan.jsx) • [`IntroductionSlides.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/IntroductionSlides.jsx)

#### Living Component Mechanics:
* **Meal Radar Beam**: A continuous 360-degree rotating radar scan beam rotates over a high-resolution Indian Thali meal image.
* **Concentric Grid Overlay**: Semi-transparent medical grid pattern with pulsing scan rings expanding and contracting (`scale: [0.8, 1.15, 0.8]`).
* **Dynamic Deficiency Badges**: Floating cards for **Iron (Fe)**, **Zinc (Zn)**, **Vitamin D3**, and **Calcium** pop in with pinging status indicators (*"Gap Detected"*, *"Sub-optimal"*, *"Absorbed 42%"*) and continuous floating Y-bobbing.

#### Text & Stagger:
* Headline, subtitle, and 3 question bullet points (`?` marks) animate in with a 0.08s stagger delay.

---

### 2. Slide 2 — Future Vision ("What If You Could See Growth Before It Happens?")
* **File Locations**: [`LivingGrowthGraph.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingGrowthGraph.jsx)

#### Living Component Mechanics:
* **SVG Path Drawing**: Real-time 180-day growth curve path animates from `pathLength: 0` to `pathLength: 1` over 2 seconds using a multi-stop color gradient (`#38bdf8` → `#0ea5e9` → `#10b981`).
* **Area Gradient Fill**: Soft semi-transparent fill fades in beneath the growth trajectory line.
* **Dashed Baseline Curve**: Renders the average population growth curve for comparison.
* **Milestone Callout Dots**: Bouncing milestone pins at **Day 30** (*Height +1.8cm*), **Day 90** (*Immunity Milestone*), and **Day 180** (*92nd Percentile Peak*) pop up with spring ease.

---

### 3. Slide 3 — Clinical Trust ("Because Parenting Needs More Than Advice")
* **File Locations**: [`LivingDNAConnections.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingDNAConnections.jsx)

#### Living Component Mechanics:
* **Living DNA Strand**: 8-rung SVG DNA double helix strand with oscillating base-pair nodes sliding smoothly back and forth (`cx: [25, 75, 25]`).
* **Medical Pulse Circle**: Outer dashed circle counter-rotates slowly (`rotate: 360deg` over 20s).
* **Clinical Verification Nodes**: Floating glassmorphic cards display live clinical safeguards:
  - 🛡️ *Peanut Allergen Filter (Active Lock)*
  - 🩺 *Pediatrician Linked (Dr. Sharma Verified)*
  - 💊 *Dosage Protocol (Automated Tracking)*
  - 📋 *Clinical Risk Scan (Zero Anomalies)*

---

### 4. Slide 4 — Kids Experience ("Why Do Healthy Habits Feel Like A Fight?")
* **File Locations**: [`LivingKidsQuest.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingKidsQuest.jsx)

#### Living Component Mechanics:
* **Hero Mascot Card**: Central 3D card highlighting the **Sprout Shield** mascot companion with an active XP level badge (*LVL 12 • 1,450 XP*).
* **Floating Food Quest Tokens**: Interactive 3D food tokens float around the card with hover expansion and XP rewards:
  - 🥦 *Crispy Broccoli (+50 XP)*
  - 🥕 *Sweet Carrot (+40 XP)*
  - 🍎 *Juicy Apple (+35 XP)*
  - 🥛 *Super Milk (+60 XP)*

---

### 5. Welcome Screen ("Mic-Drop" Solution Arc)
* **File Locations**: [`IntroductionSlides.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/IntroductionSlides.jsx)

#### Animation Sequence:
1. **Sequential Question Cascade**: Questions animate downward one by one with glowing border cards and down-arrows (`↓`):
   - *"Did my child finish the meal?"*
   - *"Did my child eat enough today?"*
   - *"Did my child grow this month?"*
2. **Big Question Impact**: The text scales up (`scale: 1`) with back-ease: **"Do I truly understand my child's development?"**
3. **CTA Entry**: Brand tagline and the final **"Enter the Platform"** glassmorphic button slide up.
4. **Exit Transition**: Clicking "Enter the Platform" smoothly scales and fades out the onboarding overlay (`scale: 0.97, opacity: 0`) over 0.5s to reveal the main Landing Page.

---

## 🎛️ Interactive Controls & Micro-Interactions

* **Futuristic Step Timeline Indicator**: Displays step markers `01` through `04` at the top of the viewport. Features an animated green fill bar tracking progress and allows instant click navigation between steps.
* **3D Mouse Parallax Card Tilt**: Moving the mouse over the slide card dynamically updates `rotateX` (`-6deg` to `+6deg`) and `rotateY` (`-8deg` to `+8deg`) using Framer Motion's `useMotionValue` and `useTransform`.
* **Keyboard & Touch Navigation**:
  - `ArrowRight` / `Space` / `Enter`: Advance to next slide.
  - `ArrowLeft`: Return to previous slide.
  - `Escape`: Skip to Welcome Screen.
  - `Touch Swipe Left / Right`: Mobile touch gesture navigation.

---

## 🛠️ Summary File Reference

| Component | File Path | Animation Technology |
| :--- | :--- | :--- |
| **Preloader Splash** | [`Loader.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/Loader.jsx) | GSAP Timelines + Canvas/CSS |
| **Onboarding Shell** | [`IntroductionSlides.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/IntroductionSlides.jsx) | Framer Motion `AnimatePresence` + GSAP Context |
| **Nutrient Scan** | [`LivingNutrientScan.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingNutrientScan.jsx) | Framer Motion + SVG Grids |
| **Growth Graph** | [`LivingGrowthGraph.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingGrowthGraph.jsx) | SVG `pathLength` + Framer Motion Springs |
| **DNA & Safety** | [`LivingDNAConnections.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingDNAConnections.jsx) | Framer Motion + Keyframe Loops |
| **Gamified Quests** | [`LivingKidsQuest.jsx`](file:///c:/Users/abhir/.android/OneDrive/Desktop/projectPhase1/NutriBite-main/NutriBite-main/frontend/src/components/common/LivingKidsQuest.jsx) | 3D Transform + Hover Physics |
