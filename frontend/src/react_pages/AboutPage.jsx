"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

// Sub-component for Team Member Cards with fallback image state and premium hover styles
const TeamMemberCard = ({ member, itemVariants }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.01 }}
            className="relative flex flex-col p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/40 backdrop-blur-md transition-all duration-300 overflow-hidden"
        >
            {/* Elegant glassmorphism background hover card elements */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent-green/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            {/* Top decoration banner based on role */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 via-accent-green/30 to-primary/40" />

            <div className="flex items-center gap-4 mb-6">
                {/* Premium Ring Wrap */}
                <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-accent-green shadow-md shrink-0 flex items-center justify-center">
                    {member.image && !imageError ? (
                        <img 
                            src={member.image} 
                            alt={member.name} 
                            onError={() => setImageError(true)}
                            className="h-full w-full rounded-full object-cover bg-white dark:bg-slate-900 border border-white/50 dark:border-slate-800"
                        />
                    ) : (
                        <div className={`h-full w-full rounded-full ${member.avatarBg} text-white flex items-center justify-center font-extrabold text-base shadow-inner`}>
                            {member.avatarInitials}
                        </div>
                    )}
                </div>
                <div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary dark:bg-primary/20 tracking-wider mb-1">{member.type}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">{member.role}</p>
                </div>
            </div>

            {/* Department if Faculty / Specialization */}
            {member.department && (
                <div className="mb-4 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-355 text-xs font-semibold border border-slate-200/30 dark:border-slate-700/30">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Affiliation</span>
                    {member.department}
                </div>
            )}

            {/* Responsibilities */}
            <div className="flex-1 space-y-2 mb-6">
                <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-550 tracking-widest">Key Focus & Background</span>
                <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
                    {member.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} className="flex gap-2.5 items-start">
                            <span className="material-symbols-outlined text-primary text-base select-none mt-0.5 shrink-0">task_alt</span>
                            <span className="leading-relaxed">{resp}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Contact Email */}
            {member.email && (
                <a 
                    href={`mailto:${member.email}`}
                    className="mt-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary border border-slate-200/50 dark:border-slate-700 text-xs font-semibold transition-all hover:scale-[1.02] hover:shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm select-none">mail</span>
                    <span className="truncate">{member.email}</span>
                </a>
            )}
        </motion.div>
    );
};

const AboutPage = () => {
    // Categorized team members metadata
    const contributors = [
        {
            name: "Abhiram Bikkina",
            role: "AI Engineer & Feature Development Lead",
            email: "abhirambikkina@gmail.com",
            type: "Project Lead",
            image: "/images/team/abhiram.jpg",
            avatarInitials: "AB",
            avatarBg: "bg-blue-500",
            responsibilities: [
                "Product Architecture",
                "AI Systems",
                "LLM Integration",
                "Feature Development",
                "System Integration"
            ]
        },
        {
            name: "Dinesh Veera Bhargav",
            role: "AI & LLM Developer",
            email: "cb.sc.u4cse23302@cb.amrita.students.edu",
            type: "Core Contributor",
            image: "/images/team/dinesh.png",
            avatarInitials: "DB",
            avatarBg: "bg-teal-500",
            responsibilities: [
                "LLM Integration",
                "Prompt Engineering",
                "RAG Systems",
                "AI Model Tuning"
            ]
        },
        {
            name: "Y. Tharun Kumar Reddy",
            role: "Backend & Database Engineer",
            email: "cb.sc.u4cse23153@cb.students.amrita.edu",
            type: "Core Contributor",
            image: "/images/team/tharun.png",
            avatarInitials: "TR",
            avatarBg: "bg-emerald-500",
            responsibilities: [
                "Backend Development",
                "MongoDB",
                "Authentication",
                "API Development"
            ]
        },
        {
            name: "Damarapati Pavan Krishna",
            role: "Data Engineer & Backend Developer",
            email: "cb.sc.u4cse23315@cb.students.amrita.edu",
            type: "Core Contributor",
            image: "/images/team/pavan_k.png",
            avatarInitials: "PK",
            avatarBg: "bg-purple-500",
            responsibilities: [
                "Dataset Collection",
                "Data Processing",
                "Backend Support"
            ]
        },
        {
            name: "Veluri Pavan Vignesh",
            role: "Frontend & UI/UX Engineer",
            email: "cb.sc.u4cse23354@cb.students.amrita.edu",
            type: "Core Contributor",
            image: "/images/team/pavan_v.png",
            avatarInitials: "PV",
            avatarBg: "bg-orange-500",
            responsibilities: [
                "UI Design",
                "User Experience",
                "Animations",
                "Frontend Development"
            ]
        }
    ];

    const guides = [
        {
            name: "Dr. T. Senthil Kumar",
            role: "Project Guide / Faculty Mentor",
            department: "Department of Computer Science and Engineering",
            email: "t_senthilkumar@cb.amrita.edu",
            type: "Faculty Mentor",
            image: "/images/team/senthil.png",
            avatarInitials: "SK",
            avatarBg: "bg-indigo-600",
            responsibilities: [
                "Project Guidance & Mentorship",
                "Academic Review",
                "Research Validation"
            ]
        },
        {
            name: "Shanmugha Priya",
            role: "Industry LLM Guide",
            department: "AI Research & LLM Engineering",
            type: "LLM Specialist",
            image: "/images/team/shanmugha.jpg",
            avatarInitials: "SP",
            avatarBg: "bg-violet-600",
            responsibilities: [
                "Industry Guide who helped build and refine our LLM model",
                "Advised on LLM training, prompt engineering, and RAG evaluation",
                "Currently working on LLMs and generative AI in the tech industry"
            ]
        }
    ];

    const doctors = [
        {
            name: "Sindhu Abhijith",
            role: "Functional Medicine Clinical Nutritionist",
            department: "Founder, Overall Health and Nutrition, Bangalore",
            email: "sindhu.abhijith@gmail.com",
            type: "Clinical Advisor",
            image: "/images/team/sindhu.jpg",
            avatarInitials: "SA",
            avatarBg: "bg-pink-500",
            responsibilities: [
                "Functional medicine diagnostics & pediatric nutrition strategy.",
                "Founder & Clinical Lead at Overall Health and Nutrition, Bangalore.",
                "Clinical advisor validating pediatric meal safety standards."
            ]
        },
        {
            name: "Dr. A. Armugam, M.D., D.C.H.",
            role: "Professor & Head of Pediatrics (Rtd) / Pediatric Mentor",
            department: "Pediatrics & Child Health",
            type: "Clinical Advisor",
            image: "/images/team/armugam.png",
            avatarInitials: "AA",
            avatarBg: "bg-cyan-600",
            responsibilities: [
                "Professor and Head of the Department of Pediatrics, (Rtd), S.V. Medical College, Tirupati, AP.",
                "Presently working as Professor of Pediatrics, RDT Hospital, for DNB students at Anantapur district, AP."
            ]
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
                <section className="relative bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900 px-4 py-20 md:px-8 lg:px-16 overflow-hidden">
                    {/* Ambient background glows for ultimate premium feel */}
                    <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
                    <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-accent-green/5 dark:bg-accent-green/10 rounded-full blur-[130px] pointer-events-none animate-pulse delay-700" />

                    <div className="relative z-10 max-w-7xl mx-auto space-y-20">
                        {/* Section Header */}
                        <div className="text-center space-y-4">
                            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">
                                Our Team
                            </span>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                                Meet the Minds Behind NutriBite
                            </h2>
                            <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400">
                                The engineering, clinical guidance, and mentorship core driving pediatric health intelligence.
                            </p>
                        </div>

                        {/* Category 1: Student Contributors */}
                        <div className="space-y-8">
                            <div className="border-l-4 border-primary pl-4 flex flex-wrap items-center gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Core Student Contributors</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                            {contributors.length} Members
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The core developers who built the backend, frontend, database, and AI systems.</p>
                                </div>
                            </div>
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {contributors.map((member, idx) => (
                                    <TeamMemberCard key={idx} member={member} itemVariants={itemVariants} />
                                ))}
                            </motion.div>
                        </div>

                        {/* Category 2: Guides & Mentors */}
                        <div className="space-y-8">
                            <div className="border-l-4 border-indigo-650 dark:border-indigo-500 pl-4 flex flex-wrap items-center gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Project Guides & Mentors</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-650/10 text-indigo-650 dark:text-indigo-400 border border-indigo-650/20">
                                            {guides.length} Mentors
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Academic mentors and industry specialists who guided the LLM and codebase architecture.</p>
                                </div>
                            </div>
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl"
                            >
                                {guides.map((member, idx) => (
                                    <TeamMemberCard key={idx} member={member} itemVariants={itemVariants} />
                                ))}
                            </motion.div>
                        </div>

                        {/* Category 3: Clinical Advisors & Doctors */}
                        <div className="space-y-8">
                            <div className="border-l-4 border-cyan-650 dark:border-cyan-500 pl-4 flex flex-wrap items-center gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Clinical Advisors & Pediatricians</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-650/10 text-cyan-650 dark:text-cyan-400 border border-cyan-650/20">
                                            {doctors.length} Advisors
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Medical practitioners and pediatric dietitians who reviewed nutritional formulas and safety standards.</p>
                                </div>
                            </div>
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl"
                            >
                                {doctors.map((member, idx) => (
                                    <TeamMemberCard key={idx} member={member} itemVariants={itemVariants} />
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>


            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;
