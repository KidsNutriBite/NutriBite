"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const PricingPage = () => {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [activeFaq, setActiveFaq] = useState(null);

    // Plans details
    const plans = [
        {
            name: "Free Plan",
            price: "₹0",
            period: "/month",
            desc: "Essential features to kickstart your pediatric child health tracking journey.",
            features: [
                "Child Profile Management",
                "Growth Records",
                "Meal Logging",
                "Basic Nutrition Tracking",
                "Community Support"
            ],
            buttonText: "Get Started",
            buttonLink: "/register",
            popular: false,
            comingSoon: false
        },
        {
            name: "Premium Plan",
            price: "Coming Soon",
            period: "",
            desc: "AI-powered pediatric nutrition intelligence to maximize immunity and growth tracking.",
            features: [
                "AI Nutrition Assistant (24/7)",
                "Nutrition Gap Analysis",
                "Personalized Meal Suggestions",
                "Growth Analytics & Trends",
                "Food Buddy Interactive Access",
                "Priority Support"
            ],
            buttonText: "Notify Me",
            buttonLink: "#notify",
            popular: true,
            comingSoon: true
        },
        {
            name: "Clinical Plan",
            price: "Coming Soon",
            period: "",
            desc: "Complete collaboration tools for pediatricians, dietitians and health centers.",
            features: [
                "Doctor Access Portal",
                "Dietitian Access Portal",
                "Clinical Growth Reports",
                "Continuous Nutrition Monitoring",
                "Direct Video Consultations",
                "Advanced Health Tracking Metrics"
            ],
            buttonText: "Contact Us",
            buttonLink: "#contact",
            popular: false,
            comingSoon: true
        }
    ];

    // FAQ items
    const faqs = [
        {
            q: "How does the AI Nutrition Assistant analyze my child's daily logs?",
            a: "Our AI Nutrition Assistant runs on secure language models integrated with FAISS vector databases. It processes details from daily food logs and compares them against pediatric dietary standards to identify nutritional gaps, suggest healthy eating habits, and propose meal changes."
        },
        {
            q: "Can I share my child's growth monitoring reports with our actual pediatrician?",
            a: "Absolutely! The Clinical Plan allows parents to directly connect their profile to registered pediatricians and dietitians. You can share real-time nutrition tracking, food logs, and clinical reports securely, complying with modern patient privacy standards."
        },
        {
            q: "What metrics are tracked under Pediatric Growth Monitoring?",
            a: "We track standard WHO growth benchmarks including height-for-age, weight-for-age, BMI-for-age, and daily caloric and macronutrient distribution. This ensures active monitoring of kids nutrition, growth spurts, and overall child health trends."
        },
        {
            q: "Is my kid's nutritional data secure on NutriBite?",
            a: "Security is our highest priority. All data, including growth records, clinical logs, and profile information, is encrypted both in transit and at rest. We ensure strict isolation of records so that only authorized family members and clinical advisors have access."
        },
        {
            q: "When will the Premium and Clinical plans launch?",
            a: "We are currently completing clinical validation and beta-testing the AI systems. You can register for the Free Plan today or sign up for notifications to be first in line when Premium and Clinical features roll out."
        }
    ];

    // Feature Comparison matrix
    const comparisonFeatures = [
        { name: "Child Profile Management", free: true, premium: true, clinical: true },
        { name: "Meal Logging & Basic Tracking", free: true, premium: true, clinical: true },
        { name: "Growth Records History", free: true, premium: true, clinical: true },
        { name: "AI Nutrition Assistant (Gemini)", free: false, premium: true, clinical: true },
        { name: "Nutrition Gap Analysis", free: false, premium: true, clinical: true },
        { name: "Personalized Meal Suggestions", free: false, premium: true, clinical: true },
        { name: "Advanced Growth Analytics", free: false, premium: true, clinical: true },
        { name: "Doctor & Dietitian Secure Access", free: false, block: true, premium: false, clinical: true },
        { name: "Clinical PDF Report Exports", free: false, premium: false, clinical: true },
        { name: "Video Consultations integration", free: false, premium: false, clinical: true },
        { name: "Priority Support Response", free: "Community", premium: "Priority", clinical: "24/7 Dedicated" }
    ];

    const toggleFaq = (index) => {
        if (activeFaq === index) {
            setActiveFaq(null);
        } else {
            setActiveFaq(index);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 selection:bg-primary/30">
            <Header />

            <main className="flex-1 pt-28">
                {/* Hero Header */}
                <section className="relative px-4 py-12 md:px-8 lg:px-16 text-center max-w-4xl mx-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
                    
                    <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20 mb-4">
                        Flexible Pricing
                    </span>
                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                        SaaS Plans for <span className="text-primary">Every Family</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-350">
                        Choose the right plan to monitor Child Health, track Immunity, and leverage our secure AI Nutrition Assistant for Healthy Eating habits.
                    </p>

                    {/* Monthly/Yearly toggle placeholder (aesthetic) */}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <span className={`text-sm font-bold ${billingPeriod === 'monthly' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Monthly Billing</span>
                        <button 
                            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-12 h-6 rounded-full bg-primary/20 dark:bg-slate-800 p-0.5 transition-colors relative flex items-center"
                        >
                            <motion.span 
                                layout
                                className="w-5 h-5 rounded-full bg-primary shadow-md block"
                                animate={{ x: billingPeriod === 'monthly' ? 0 : 24 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                            Yearly Billing
                            <span className="px-2 py-0.5 rounded bg-accent-green/20 text-accent-green text-[10px] font-black uppercase tracking-wider">Save 20%</span>
                        </span>
                    </div>
                </section>

                {/* SECTION 1: Modern SaaS Pricing Cards */}
                <section className="px-4 py-12 md:px-8 lg:px-16 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -8 }}
                                className={`relative flex flex-col p-8 rounded-3xl bg-white dark:bg-slate-900 border ${
                                    plan.popular 
                                    ? 'border-primary shadow-xl ring-2 ring-primary/10' 
                                    : 'border-slate-200/60 dark:border-slate-800 shadow-md'
                                } overflow-hidden`}
                            >
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.desc}</p>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{plan.price}</span>
                                        <span className="text-sm font-bold text-slate-400">{plan.period}</span>
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-slate-800 mb-6" />

                                {/* Features List */}
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-350">
                                            <span className="material-symbols-outlined text-primary text-base shrink-0 select-none">
                                                check_circle
                                            </span>
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                {plan.comingSoon ? (
                                    <a
                                        href={plan.buttonLink}
                                        className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold border transition-all duration-300 ${
                                            plan.popular
                                            ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {plan.buttonText}
                                    </a>
                                ) : (
                                    <Link
                                        href={plan.buttonLink}
                                        className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                                    >
                                        {plan.buttonText}
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* SECTION 2: Feature Comparison Table */}
                <section className="bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-900 px-4 py-20 md:px-8 lg:px-16">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Feature Comparison</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">See exactly what you get at every tier of our Pediatric Nutrition platform.</p>
                        </div>

                        {/* Responsive Matrix */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                                        <th className="p-5 font-black text-slate-800 dark:text-white text-sm">Feature Name</th>
                                        <th className="p-5 font-bold text-slate-700 dark:text-slate-350 text-sm">Free</th>
                                        <th className="p-5 font-bold text-primary text-sm">Premium</th>
                                        <th className="p-5 font-bold text-slate-700 dark:text-slate-350 text-sm">Clinical</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((feat, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="p-5 text-sm font-semibold text-slate-700 dark:text-slate-300">{feat.name}</td>
                                            
                                            {/* Free Plan Value */}
                                            <td className="p-5 text-sm">
                                                {typeof feat.free === 'boolean' ? (
                                                    feat.free ? (
                                                        <span className="material-symbols-outlined text-accent-green text-[20px] select-none">check</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[20px] select-none">remove</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-500 font-medium text-xs">{feat.free}</span>
                                                )}
                                            </td>

                                            {/* Premium Plan Value */}
                                            <td className="p-5 text-sm">
                                                {typeof feat.premium === 'boolean' ? (
                                                    feat.premium ? (
                                                        <span className="material-symbols-outlined text-accent-green text-[20px] select-none">check</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[20px] select-none">remove</span>
                                                    )
                                                ) : (
                                                    <span className="text-primary font-bold text-xs">{feat.premium}</span>
                                                )}
                                            </td>

                                            {/* Clinical Plan Value */}
                                            <td className="p-5 text-sm">
                                                {typeof feat.clinical === 'boolean' ? (
                                                    feat.clinical ? (
                                                        <span className="material-symbols-outlined text-accent-green text-[20px] select-none">check</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[20px] select-none">remove</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-500 font-medium text-xs">{feat.clinical}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: FAQ Section */}
                <section className="px-4 py-20 md:px-8 lg:px-16 max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block rounded-full bg-accent-green/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-accent-green dark:bg-accent-green/20 mb-4">
                            Questions
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">Everything you need to know about our Kids Nutrition monitoring tools and security.</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div 
                                key={idx}
                                className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-white text-base hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`material-symbols-outlined transition-transform duration-200 text-slate-400 select-none ${activeFaq === idx ? 'rotate-180' : ''}`}>
                                        keyboard_arrow_down
                                    </span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {activeFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20"
                                        >
                                            <p className="p-5 text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 4: Contact CTA Section */}
                <section id="contact" className="px-4 py-16 md:px-8 lg:px-16 max-w-6xl mx-auto">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-tr from-slate-900 to-slate-950 px-8 py-16 text-center text-white border border-slate-800 shadow-2xl">
                        {/* Decorative background vectors */}
                        <div className="absolute top-[-100px] right-[-100px] w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-[-100px] left-[-100px] w-72 h-72 bg-accent-green/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
                            <span className="material-symbols-outlined text-4xl bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner">
                                contact_support
                            </span>
                            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Have questions or custom clinical needs?</h2>
                            <p className="text-base text-slate-400 max-w-lg leading-relaxed">
                                Whether you are a parent exploring Healthy Eating logs or a pediatrician clinic manager seeking HIPAA-compliant medical API keys, we're here to help.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                <a 
                                    href="mailto:abhirambikkina@gmail.com" 
                                    className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-12 px-8 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    Email Project Lead
                                </a>
                                <a 
                                    href="mailto:senthilkumar@cb.amrita.edu"
                                    className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-12 px-8 bg-white/5 border border-white/10 text-slate-200 hover:text-white text-sm font-bold hover:bg-white/10 transition-all"
                                >
                                    Faculty Guide
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default PricingPage;
