"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import IntroductionSlides from '../components/common/IntroductionSlides';
import CartoonKid from '../components/common/CartoonKid';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const LandingPage = () => {
    const [isLoaderMounted, setIsLoaderMounted] = useState(false);
    const [showIntroSlides, setShowIntroSlides] = useState(false);
    const [introMounted, setIntroMounted] = useState(true);
    const [showLandingPage, setShowLandingPage] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    // Session/Param-based Loader and Intro Gating
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasUrlParam = window.location.search.includes('loader=true');
            const hasLoadedSession = sessionStorage.getItem('has_loaded');
            
            if (hasUrlParam || !hasLoadedSession) {
                setIsLoaderMounted(true);
                setShowLandingPage(false);
                setShowIntroSlides(false);
                setIntroMounted(true);
                sessionStorage.setItem('has_loaded', 'true');
            } else {
                setIsLoaderMounted(false);
                setShowLandingPage(true);
                setShowIntroSlides(false);
                setIntroMounted(false);
            }
        }
    }, []);

    // Centralized Body Scroll Lock Manager
    useEffect(() => {
        if (showLandingPage) {
            document.body.style.overflow = '';
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showLandingPage]);

    const [isHoveredHow, setIsHoveredHow] = useState(false);

    // Autoplay slideshow logic for How It Works
    useEffect(() => {
        if (!showLandingPage || isHoveredHow) return;

        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4);
        }, 4000);

        return () => clearInterval(interval);
    }, [showLandingPage, isHoveredHow]);

    return (
        <>
            {isLoaderMounted && (
                <Loader 
                    onAnimationComplete={() => setShowIntroSlides(true)}
                    onFadeOutComplete={() => setIsLoaderMounted(false)}
                />
            )}

            {showIntroSlides && introMounted && (
                <IntroductionSlides 
                    onComplete={() => {
                        setShowLandingPage(true);
                        setIntroMounted(false);
                    }}
                />
            )}

            {showLandingPage && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 selection:bg-primary/30"
                >
                    <Header />

                    <main className="flex-1 pt-24">
                        {/* Hero Section */}
                        <section id="home" className="relative px-4 py-16 md:px-20 lg:px-40 overflow-visible">


                            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="flex flex-col gap-8 lg:w-1/2"
                                >
                                    <div className="space-y-4">
                                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">Welcome to NutriKids</span>
                                        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl">
                                            Healthy Habits for <span className="text-primary">Happy Kids</span>
                                        </h1>
                                        <p className="max-w-[500px] text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                            Leading AI-powered Pediatric Nutrition intelligence platform for Child Health and Growth Monitoring. Empowering families and doctors with an AI Nutrition Assistant for secure, clinical nutrition tracking.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <Link href="/register?role=parent" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-base font-bold shadow-xl shadow-primary/30 hover:scale-108 hover:shadow-2xl hover:shadow-primary/45 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                                            I'm a Parent
                                        </Link>
                                        <Link href="/register?role=doctor" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-base font-bold shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-108 hover:shadow-2xl hover:border-primary/50 hover:text-primary dark:hover:text-primary hover:-translate-y-1 active:scale-95 transition-all duration-300">
                                            I'm a Doctor
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-800 pt-8">
                                        <div className="flex -space-x-3">
                                            <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover hover:scale-110 hover:z-10 transition-transform duration-300" alt="Profile photo of a happy child" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA98q9K9PeEWGGkRaj-ucyMw-b7ysL2GHm2AdkQGxq-5IMXUYOYiH4JgbM04r6pW89fVa57I4wfwrvIhM8lkp4PxhJ90-GxZhGqUv7T18545FUc9KMNtyAiVm_oOEv9DhPXDc8BGJqw-JCC0jFjupB_dr-xrm16QfUWmRNT2iL8JEC8vPr8m9M74YsNuxg2mj-yGeh6mhew-VLm-gJDmbqL7w0kDDo3KUNH2WfztxmDtOEG0qQDTBrFnQwWG7z1UJn3j_wY1gT90AU" />
                                            <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover hover:scale-110 hover:z-10 transition-transform duration-300" alt="Profile photo of a pediatrician" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjxbpVec7oM5stO037YN3L_iI1s0Mi1hOOrueSuYbQN8Ai6xAfY0w3VIyFpTi2fot4M8aDQj7bnaUfou3M1i1Q2i8DQo74_4wH_gxE6eX35UYF4h7aCeF4pDPh-XBYbR3rHKG_xbhgeyx2joparnWR22TEW2P4Y7L_cVOnNOPH2hDdUfwD7FoiuGPOpkvbyrkbw4FhnJiryECMU_1PS_dbxEbtm9CXrAY3wUt-nmDuUGvb-fUAL8wG1Bq1vAJv1br9UTi9ZsUAeT0" />
                                            <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover hover:scale-110 hover:z-10 transition-transform duration-300" alt="Profile photo of a smiling parent" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhu1DdBc906cFOU1yGS6R0L2Kmh-0SkVGhijds4rQetykaAvnEPOO4A9etJFpnBddec9hp2hoK6Upyc1CxD3AJa9nCnkNy4Tf__TDSl3uFeHYGfB0hqCDH9Xg5Y09iXOYu7u8xv_wtXblkea9P-78RtsYpfLWrY9KR3clkMQD3yxG00zT3MeKJiOBFRjHB7luMo3W0ODpf7IjGPpDPwCVzunHNb8dnaYoIfw3rcUoYVeqzZbwY8hBKzs80lsPcK0-mRoIhWuz5Fis" />
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-600 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400 hover:scale-110 hover:z-10 transition-transform duration-300">+2k</div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Trusted by over <span className="text-slate-900 dark:text-white font-bold">2,500+</span> families and doctors worldwide.</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                    className="relative lg:w-1/2 flex items-center justify-center"
                                >
                                    <div className="relative w-full max-w-[480px] px-4 md:px-0 group">
                                        {/* Floating Badge 1 - Active Status */}
                                        <div className="absolute -top-4 -left-4 md:-left-8 bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-10 hover:scale-110 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300">
                                            <div className="bg-emerald-100 dark:bg-emerald-950 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                <span className="material-symbols-outlined font-black text-xl">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Health Status</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-white">Active & Strong</p>
                                            </div>
                                        </div>
 
                                        {/* Floating Badge 2 - Dynamic Vitality */}
                                        <div className="absolute -bottom-4 -right-4 md:-right-8 bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-10 hover:scale-110 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300">
                                            <div className="bg-blue-100 dark:bg-blue-950 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <span className="material-symbols-outlined font-black text-xl">bolt</span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">AI Nutrition</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-white">100% Balanced Diet</p>
                                            </div>
                                        </div>
 
                                        {/* Image Container with Glow Background */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-sky-300/30 rounded-[2rem] blur-2xl -z-10 transform scale-90 group-hover:scale-95 group-hover:opacity-100 transition-all duration-500"></div>
                                        <img 
                                            src="/healthy_kid.png" 
                                            alt="Healthy active kid with milk and apple" 
                                            className="w-full h-auto object-cover rounded-[2rem] shadow-2xl border-4 md:border-8 border-white dark:border-slate-900 transition-all duration-500 group-hover:scale-[1.04] group-hover:shadow-3xl group-hover:rotate-1"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </section>

                        {/* How It Works Section */}
                        <section id="how-it-works" className="relative bg-white dark:bg-slate-900/50 w-full min-h-screen flex flex-col items-center justify-center px-6 md:px-20 lg:px-40 py-24 overflow-hidden" onMouseEnter={() => setIsHoveredHow(true)} onMouseLeave={() => setIsHoveredHow(false)}>
                            {/* Background elements */}
                            <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header / Title */}
                            <div className="text-center z-10 w-full px-4 mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">How It Works</h2>
                                <p className="max-w-[600px] mx-auto text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base">
                                    Making nutrition simple, fun, and effective for the whole family.
                                </p>
                            </div>

                            {/* Interactive Step Tabs */}
                            <div className="flex flex-wrap items-center justify-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1.5 z-20 max-w-full overflow-x-auto no-scrollbar mb-12 shadow-inner border border-slate-200/10">
                                {[
                                    { step: 0, num: "01", label: "Profile Setup" },
                                    { step: 1, num: "02", label: "Track & Quests" },
                                    { step: 2, num: "03", label: "Doctor Portal" },
                                    { step: 3, num: "04", label: "Care Plans" }
                                ].map((item) => (
                                    <button
                                        key={item.step}
                                        onClick={() => setActiveStep(item.step)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                                            activeStep === item.step
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="opacity-60">{item.num}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Grid Layout */}
                            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-12 max-w-6xl">
                                {/* Left Column: Interactive Cartoon Kid */}
                                <div className="w-full md:w-1/2 flex items-center justify-center">
                                    <CartoonKid activeStep={activeStep} />
                                </div>

                                {/* Right Column: Visual Scrolling Cards */}
                                <div className="w-full md:w-1/2 relative h-[280px] flex items-center justify-center">
                                    {/* Step 1 */}
                                    <div className={`absolute inset-0 flex flex-col justify-center gap-4 transition-all duration-750 transform ${activeStep === 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}`}>
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-2">
                                            <span className="material-symbols-outlined text-3xl">person_add</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">1. Sign Up & Customize Profile</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                            Create a customized account for your child. Enter their demographic details, active allergies, and select a superhero mascot companion like <strong className="text-primary">Sprout-Shield</strong> or <strong className="text-emerald-500">Iron-Man Ragi</strong> to accompany them.
                                        </p>
                                    </div>

                                    {/* Step 2 */}
                                    <div className={`absolute inset-0 flex flex-col justify-center gap-4 transition-all duration-750 transform ${activeStep === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}`}>
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-2">
                                            <span className="material-symbols-outlined text-3xl">sports_esports</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">2. Track Meals & Play Quests</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                            Log daily breakfast, snacks, lunch, and dinner. Children interact directly with their mascot in a gamified portal, completing healthy eating quests to earn XP, level up, and unlock shield badges.
                                        </p>
                                    </div>

                                    {/* Step 3 */}
                                    <div className={`absolute inset-0 flex flex-col justify-center gap-4 transition-all duration-750 transform ${activeStep === 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}`}>
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 mb-2">
                                            <span className="material-symbols-outlined text-3xl">stethoscope</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">3. Get Verified Expert Insights</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                            Invite pediatricians to securely link with your child's profile. Pediatricians review objective growth velocity trajectory curves, add clinic notes, and write prescriptions with automatic count-down tracking.
                                        </p>
                                    </div>

                                    {/* Step 4 */}
                                    <div className={`absolute inset-0 flex flex-col justify-center gap-4 transition-all duration-750 transform ${activeStep === 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none'}`}>
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-2">
                                            <span className="material-symbols-outlined text-3xl">videocam</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">4. Teleconsultations & Care Plans</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                            Schedule secure video appointments with pediatricians and certified dietitians. Discuss growth analytics and receive tailored, Indian-diet-focused clinical nutrition care plans.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section id="features" className="px-4 py-24 md:px-20 lg:px-40">
                            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-col gap-6 lg:w-1/2"
                                >
                                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Playful Nutrition for Everyone</h2>
                                    <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">Our platform makes healthy eating fun for kids and data-driven for professionals. We bridge the gap between doctor visits and daily home habits.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                                        <div className="flex items-start gap-4 hover:scale-[1.03] transition-transform duration-300">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">check</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">Gamified Goals</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Earn rewards for trying new vegetables.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 hover:scale-[1.03] transition-transform duration-300">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">check</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">Secure Data</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">HIPAA compliant patient monitoring.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href="/features" className="mt-4 flex w-fit min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-base font-bold shadow-lg hover:scale-108 hover:shadow-xl hover:shadow-primary/45 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                                        Explore Features
                                    </Link>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:w-1/2"
                                >
                                    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-800 border border-transparent hover:border-primary/20 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 cursor-pointer transition-all duration-300 group">
                                        <img className="aspect-video w-full rounded-2xl object-cover group-hover:scale-[1.02] transition-transform duration-500" alt="Screenshot of kid-friendly app interface" src="/kids-mode-preview.png" />
                                        <div className="px-2 pb-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300">Kid-Friendly Interface</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Colorful icons and mascots keep children engaged.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-800 sm:mt-8 border border-transparent hover:border-primary/20 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 cursor-pointer transition-all duration-300 group">
                                        <img className="aspect-video w-full rounded-2xl object-cover group-hover:scale-[1.02] transition-transform duration-500" alt="Medical dashboard showing health charts" src="/pediatrician-checkup.png" />
                                        <div className="px-2 pb-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300">Doctor-Approved Tools</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Clinical monitoring and patient reports for experts.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </section>
 
                        {/* CTA Section */}
                        <section className="px-4 py-24 md:px-20 lg:px-40">
                            <motion.div 
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-center text-white shadow-2xl hover:shadow-[0_20px_50px_rgba(43,157,238,0.3)] transition-all duration-500"
                            >
                                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                                <div className="relative z-10 flex flex-col items-center gap-8">
                                    <h2 className="max-w-[800px] text-4xl font-black md:text-5xl">Ready to start your child's healthy journey?</h2>
                                    <p className="max-w-[600px] text-lg text-white/90">Join thousands of families already using NutriKids to track growth, immunity, and kids nutrition habits.</p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <Link href="/register" className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-10 bg-white text-primary text-lg font-black shadow-xl hover:bg-slate-50 hover:scale-108 hover:-translate-y-1 hover:shadow-2xl active:scale-95 transition-all duration-300">
                                            Get Started Now
                                        </Link>
                                        <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-10 border-2 border-white/40 text-white text-lg font-bold hover:bg-white/10 hover:scale-108 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                                            View Demo
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </section>
                    </main>

                    <Footer />
                </motion.div>
            )}
        </>
    );
};

export default LandingPage;































































