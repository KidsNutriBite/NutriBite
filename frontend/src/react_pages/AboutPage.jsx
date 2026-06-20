"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const AboutPage = () => {
    // Team member cards metadata
    const teamMembers = [
        {
            name: "Abhiram Bikkina",
            role: "AI Engineer & Feature Development Lead",
            email: "abhirambikkina@gmail.com",
            type: "Project Lead",
            responsibilities: [
                "Product Architecture",
                "AI Systems",
                "LLM Integration",
                "Feature Development",
                "System Integration"
            ],
            avatarInitials: "AB",
            avatarBg: "bg-blue-500"
        },
        {
            name: "Dinesh Veera Bhargav",
            role: "AI & LLM Developer",
            email: "cb.sc.u4cse23302@cb.amrita.students.edu",
            type: "Core Contributor",
            responsibilities: [
                "LLM Integration",
                "Prompt Engineering",
                "RAG Systems",
                "AI Model Tuning"
            ],
            avatarInitials: "DB",
            avatarBg: "bg-teal-500"
        },
        {
            name: "Y. Tharun Kumar Reddy",
            role: "Backend & Database Engineer",
            email: "cb.sc.u4cse23153@cb.students.amrita.edu",
            type: "Core Contributor",
            responsibilities: [
                "Backend Development",
                "MongoDB",
                "Authentication",
                "API Development"
            ],
            avatarInitials: "TR",
            avatarBg: "bg-emerald-500"
        },
        {
            name: "Damarapati Pavan Krishna",
            role: "Data Engineer & Backend Developer",
            email: "cb.sc.u4cse23315@cb.students.amrita.edu",
            type: "Core Contributor",
            responsibilities: [
                "Dataset Collection",
                "Data Processing",
                "Backend Support"
            ],
            avatarInitials: "PK",
            avatarBg: "bg-purple-500"
        },
        {
            name: "Veluri Pavan Vignesh",
            role: "Frontend & UI/UX Engineer",
            email: "cb.sc.u4cse23354@cb.students.amrita.edu",
            type: "Core Contributor",
            responsibilities: [
                "UI Design",
                "User Experience",
                "Animations",
                "Frontend Development"
            ],
            avatarInitials: "PV",
            avatarBg: "bg-orange-500"
        },
        {
            name: "Dr. T. Senthil Kumar",
            role: "Project Guide",
            department: "Computer Science and Engineering",
            email: "senthilkumar@cb.amrita.edu",
            type: "Faculty Mentor",
            responsibilities: [
                "Project Guidance & Mentorship",
                "Academic Review",
                "Research Validation"
            ],
            avatarInitials: "SK",
            avatarBg: "bg-indigo-600"
        },
        {
            name: "Sindhu Abhijith",
            role: "Consultant Dietitian",
            email: "sindhu.abhijith@gmail.com",
            type: "Clinical Advisor",
            responsibilities: [
                "Clinical Validation",
                "Nutrition Guidance",
                "Pediatric Dietary Consultation"
            ],
            avatarInitials: "SA",
            avatarBg: "bg-pink-500"
        }
    ];



    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 selection:bg-primary/30">
            <Header />

            <main className="flex-1 pt-28">
                {/* SECTION 1: Hero Section */}
                <section className="relative px-4 py-16 md:px-8 lg:px-16 overflow-visible text-center max-w-5xl mx-auto">
                    {/* Glowing blur effects */}
                    <div className="absolute top-10 left-[20%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
                    <div className="absolute top-20 right-[20%] w-72 h-72 bg-accent-green/10 rounded-full blur-3xl animate-pulse pointer-events-none delay-1000" />

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                            Our Origins
                        </span>
                        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
                            About <span className="text-primary">NutriBite</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300">
                            Building the Future of Pediatric Nutrition Intelligence Through Artificial Intelligence, Clinical Collaboration, and Personalized Child Health Monitoring.
                        </p>
                        
                        <div className="pt-6 max-w-2xl mx-auto p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-sm">
                            <h3 className="text-sm uppercase tracking-widest font-black text-primary mb-2">Our Mission Statement</h3>
                            <p className="text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                                "Empower families and healthcare professionals with intelligent nutrition insights that improve childhood health outcomes, promoting healthy eating, immunity support, and kids nutrition tracking worldwide."
                            </p>
                        </div>

                        <div className="pt-6 flex justify-center gap-4">
                            <Link href="/register" className="flex min-w-[150px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                Join Platform
                            </Link>
                            <Link href="/pricing" className="flex min-w-[150px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-base font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                View Pricing
                            </Link>
                        </div>
                    </motion.div>
                </section>

                {/* SECTION 2: Why NutriBite Was Created */}
                <section className="bg-white dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-900 px-4 py-20 md:px-8 lg:px-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                                Why NutriBite Was Created
                            </h2>
                            <p className="max-w-2xl mx-auto text-slate-500 dark:text-slate-400">
                                Bridging the communication and tracking gap between family dining tables and pediatrician clinics.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                            {/* Parents Struggle */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="flex flex-col p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 mb-6">
                                    <span className="material-symbols-outlined text-2xl">home_pin</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Parents struggle with:</h3>
                                <ul className="space-y-4 flex-1">
                                    {[
                                        "Identifying nutritional deficiencies early",
                                        "Accurately tracking growth patterns over time",
                                        "Understanding complex healthy meal choices for kids",
                                        "Accessing personalized, child-specific nutrition guidance",
                                        "Monitoring child health consistently between checkups"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-350">
                                            <span className="material-symbols-outlined text-orange-500 text-base shrink-0 select-none">close</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Doctors Struggle */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="flex flex-col p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 mb-6">
                                    <span className="material-symbols-outlined text-2xl">medical_services</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Doctors & dietitians often lack:</h3>
                                <ul className="space-y-4 flex-1">
                                    {[
                                        "Continuous, out-of-clinic nutrition tracking data",
                                        "Accurate, parent-logged daily food logs and behaviors",
                                        "Clear, longitudinal growth trend visibility",
                                        "Real-time, secure collaboration channels with families"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-350">
                                            <span className="material-symbols-outlined text-rose-500 text-base shrink-0 select-none">close</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>

                        {/* Bridge Solution Header */}
                        <div className="mt-16 text-center">
                            <span className="inline-block rounded-full bg-accent-green/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-accent-green dark:bg-accent-green/20 mb-6">
                                The Solution
                            </span>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8">
                                NutriBite Bridges This Gap
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                {[
                                    { title: "AI Nutrition Assistant", desc: "Real-time AI analysis of pediatric nutrition logs", icon: "psychology" },
                                    { title: "Growth Tracking", desc: "Pediatric growth monitoring metrics & analytics", icon: "monitoring" },
                                    { title: "Nutrition Analysis", desc: "Granular checks for kids nutrition & dietary gaps", icon: "analytics" },
                                    { title: "Clinical Collaboration", desc: "Shared records portal for parents and medical experts", icon: "forum" },
                                    { title: "Personalized Recs", desc: "Science-backed meal options for healthy eating", icon: "restaurant" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-xs">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/10 text-accent-green mb-4">
                                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTIONS 3 & 4: Our Vision & Mission */}
                <section className="px-4 py-20 md:px-8 lg:px-16 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Our Vision */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-8 md:p-12 text-white shadow-xl">
                            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full gap-4">
                                <span className="material-symbols-outlined text-4xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">visibility</span>
                                <h3 className="text-3xl font-black tracking-tight mt-4">Our Vision</h3>
                                <p className="text-base text-white/90 leading-relaxed flex-1 font-medium">
                                    Create a future where every child receives personalized, accessible, and data-driven nutritional care. We aim to integrate clinical intelligence with everyday parenting habits to secure long-term immunity and childhood health.
                                </p>
                            </div>
                        </div>

                        {/* Our Mission */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-green to-emerald-600 p-8 md:p-12 text-white shadow-xl">
                            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full gap-4">
                                <span className="material-symbols-outlined text-4xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">rocket_launch</span>
                                <h3 className="text-3xl font-black tracking-tight mt-4">Our Mission</h3>
                                <p className="text-base text-white/90 leading-relaxed flex-1 font-medium">
                                    Empower families and healthcare professionals with intelligent nutrition insights that improve childhood health outcomes. Through our secure platform, we make pediatric nutrition insights actionable for everyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: Meet The Team */}
                <section className="bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900 px-4 py-20 md:px-8 lg:px-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-16">
                            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                                Contributors
                            </span>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                                Meet The Team
                            </h2>
                            <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400">
                                The engineering, data, and clinical minds behind NutriBite's pediatric platform.
                            </p>
                        </div>

                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {teamMembers.map((member, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -8 }}
                                    className="relative flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 shadow-md transition-all hover:shadow-xl overflow-hidden"
                                >
                                    {/* Top decoration banner based on role */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/20 dark:bg-primary/10" />

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`h-12 w-12 rounded-full ${member.avatarBg} text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0`}>
                                            {member.avatarInitials}
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{member.type}</span>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{member.role}</p>
                                        </div>
                                    </div>

                                    {/* Department if Faculty */}
                                    {member.department && (
                                        <div className="mb-4 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                            Department: {member.department}
                                        </div>
                                    )}

                                    {/* Responsibilities */}
                                    <div className="flex-1 space-y-2 mb-6">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Responsibilities:</span>
                                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                                            {member.responsibilities.map((resp, rIdx) => (
                                                <li key={rIdx} className="flex gap-2">
                                                    <span className="material-symbols-outlined text-primary text-xs shrink-0 select-none">check_circle</span>
                                                    <span>{resp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Contact Email */}
                                    <a 
                                        href={`mailto:${member.email}`}
                                        className="mt-auto flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary border border-slate-200/50 dark:border-slate-700 text-xs font-semibold transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm select-none">mail</span>
                                        <span className="truncate">{member.email}</span>
                                    </a>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>


            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;
