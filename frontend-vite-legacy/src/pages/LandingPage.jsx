
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import heroIllustration from '../assets/pediatrician-home-service-smiling-woman-doctor-sitting-with-baby-girl-bed-checkup_726520-3200.jpg';

const LandingPage = () => {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 selection:bg-primary/30">
            {/* Sticky Navbar */}
            <header className="fixed top-0 z-50 w-full px-4 py-4 md:px-20 lg:px-40">
                <nav className="glass-nav flex items-center justify-between rounded-full border border-white/20 px-6 py-3 shadow-lg dark:border-white/10 bg-white/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/40">
                            <span className="material-symbols-outlined">nutrition</span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">NutriKid</h2>
                    </div>
                    <div className="hidden md:flex flex-1 justify-center gap-10">
                        <a className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary" href="#how-it-works">How It Works</a>
                        <a className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary" href="#features">Features</a>
                        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300 dark:hover:text-primary">Login</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/register" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                            <span>Get Started</span>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="flex-1 pt-24">
                {/* Hero Section */}
                <section className="relative px-4 py-16 md:px-20 lg:px-40 overflow-visible">
                    {/* Floating Decorative Icons */}
                    <div className="absolute top-[60%] right-[10%] opacity-20 dark:opacity-40 select-none animate-bounce delay-700">
                        <span className="material-symbols-outlined text-6xl text-orange-400 rotate-45">nutrition</span>
                    </div>
                    <div className="absolute top-[25%] right-[45%] opacity-20 dark:opacity-40 select-none animate-pulse">
                        <span className="material-symbols-outlined text-4xl text-purple-400">psychology</span>
                    </div>

                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                        <div className="flex flex-col gap-8 lg:w-1/2">
                            <div className="space-y-4">
                                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-primary/20">Welcome to NutriKid</span>
                                <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl">
                                    Healthy Habits for <span className="text-primary">Happy Kids</span>
                                </h1>
                                <p className="max-w-[500px] text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                    Connecting pediatric nutrition with families and medical professionals through play, expert care, and data-driven insights.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/register?role=parent" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-base font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all">
                                    I'm a Parent
                                </Link>
                                <Link to="/register?role=doctor" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-base font-bold shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                    I'm a Doctor
                                </Link>
                            </div>
                            <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-800 pt-8">
                                <div className="flex -space-x-3">
                                    <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" alt="Profile photo of a happy child" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA98q9K9PeEWGGkRaj-ucyMw-b7ysL2GHm2AdkQGxq-5IMXUYOYiH4JgbM04r6pW89fVa57I4wfwrvIhM8lkp4PxhJ90-GxZhGqUv7T18545FUc9KMNtyAiVm_oOEv9DhPXDc8BGJqw-JCC0jFjupB_dr-xrm16QfUWmRNT2iL8JEC8vPr8m9M74YsNuxg2mj-yGeh6mhew-VLm-gJDmbqL7w0kDDo3KUNH2WfztxmDtOEG0qQDTBrFnQwWG7z1UJn3j_wY1gT90AU" />
                                    <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" alt="Profile photo of a pediatrician" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjxbpVec7oM5stO037YN3L_iI1s0Mi1hOOrueSuYbQN8Ai6xAfY0w3VIyFpTi2fot4M8aDQj7bnaUfou3M1i1Q2i8DQo74_4wH_gxE6eX35UYF4h7aCeF4pDPh-XBYbR3rHKG_xbhgeyx2joparnWR22TEW2P4Y7L_cVOnNOPH2hDdUfwD7FoiuGPOpkvbyrkbw4FhnJiryECMU_1PS_dbxEbtm9CXrAY3wUt-nmDuUGvb-fUAL8wG1Bq1vAJv1br9UTi9ZsUAeT0" />
                                    <img className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" alt="Profile photo of a smiling parent" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhu1DdBc906cFOU1yGS6R0L2Kmh-0SkVGhijds4rQetykaAvnEPOO4A9etJFpnBddec9hp2hoK6Upyc1CxD3AJa9nCnkNy4Tf__TDSl3uFeHYGfB0hqCDH9Xg5Y09iXOYu7u8xv_wtXblkea9P-78RtsYpfLWrY9KR3clkMQD3yxG00zT3MeKJiOBFRjHB7luMo3W0ODpf7IjGPpDPwCVzunHNb8dnaYoIfw3rcUoYVeqzZbwY8hBKzs80lsPcK0-mRoIhWuz5Fis" />
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-600 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400">+2k</div>
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Trusted by over <span className="text-slate-900 dark:text-white font-bold">2,500+</span> families and doctors worldwide.</p>
                            </div>
                        </div>
                        <div className="relative lg:w-1/2">
                            <div className="relative z-10 w-full transform hover:-rotate-1 transition-transform duration-500">
                                <img className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg" alt="Illustration of a friendly pediatrician talking to a child holding an apple" src={heroIllustration} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="bg-white px-4 py-24 dark:bg-slate-900/50 md:px-20 lg:px-40">
                    <div className="flex flex-col items-center text-center gap-4 mb-16">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">How It Works</h2>
                        <p className="max-w-[600px] text-slate-600 dark:text-slate-400">Making nutrition simple, fun, and effective for the whole family.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-slate-100 bg-background-light p-8 transition-all hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-background-dark">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                <span className="material-symbols-outlined text-3xl">person_add</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. Sign Up</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Create a profile for your child and set personalized health and growth goals.</p>
                            </div>
                            <div className="absolute -right-4 top-1/2 hidden translate-x-1/2 md:block">
                                <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-4xl">chevron_right</span>
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-slate-100 bg-background-light p-8 transition-all hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-background-dark">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green transition-colors group-hover:bg-accent-green group-hover:text-white">
                                <span className="material-symbols-outlined text-3xl">sports_esports</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Track & Play</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Log meals and play nutritional games designed to keep kids engaged and excited.</p>
                            </div>
                            <div className="absolute -right-4 top-1/2 hidden translate-x-1/2 md:block">
                                <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-4xl">chevron_right</span>
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-slate-100 bg-background-light p-8 transition-all hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-background-dark">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-orange/10 text-accent-orange transition-colors group-hover:bg-accent-orange group-hover:text-white">
                                <span className="material-symbols-outlined text-3xl">stethoscope</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Expert Insights</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Get detailed reports and clinical advice from certified pediatricians instantly.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="px-4 py-24 md:px-20 lg:px-40">
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                        <div className="flex flex-col gap-6 lg:w-1/2">
                            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Playful Nutrition for Everyone</h2>
                            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">Our platform makes healthy eating fun for kids and data-driven for professionals. We bridge the gap between doctor visits and daily home habits.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                        <span className="material-symbols-outlined">check</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Gamified Goals</h4>
                                        <p className="text-sm text-slate-500">Earn rewards for trying new vegetables.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                        <span className="material-symbols-outlined">check</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Secure Data</h4>
                                        <p className="text-sm text-slate-500">HIPAA compliant patient monitoring.</p>
                                    </div>
                                </div>
                            </div>
                            <button className="mt-4 flex w-fit min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-base font-bold shadow-lg hover:scale-105 transition-all">
                                Explore Features
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:w-1/2">
                            <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-800">
                                <img className="aspect-video w-full rounded-2xl object-cover" alt="Screenshot of kid-friendly app interface with cartoon fruit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHRECu3XyTpvTW35sLvBEjEduTU932wCoj_aTsZZDLspk5XGXf-rpXkCXXiK1NZNDjWuqXO0oDqAwI4FNfLoBQ95zc7G_1BCqVTkyMP09SDINOJrybzWiAjtOYCbArbtputmb5zK_lloXlFooGgv-vv4YpfKSV9Efh4S50IC-wL5ASHsmkdmV8TW_RVfENKnLIUHPCG02rPo2PSy0Wfrbq2UQLGa9j7fhrEoKukhfWSx6nxureZGpcPEofanpdM2js_MPsc3LdxnQ" />
                                <div className="px-2 pb-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Kid-Friendly Interface</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Colorful icons and mascots keep children engaged.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-800 sm:mt-8">
                                <img className="aspect-video w-full rounded-2xl object-cover" alt="Medical dashboard showing health charts and patient data" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO9eL3QwbsnHaeCX5I71wXyu3et7dXhvp9I7VRgtNnVA_n4QLgf1mHqiMHkQib3zWYwYDdW-fKmmAAtUemHH8hpX5jymatb1lRvxK8-p23is2nngLW85nfM1Vk12U56L68e9kzfJPHLjgCs_PM42CU7EiO5N_F1nOaBmKfHH95hiALPMfGG8YkP8phjD0VbfhInQYQMFeyjoA-fm8f-wOzvkWya0GeKLiKfsBkDa-mYQa5r1NjyJM_nSQjUWHwhXXmXTFLXhhASZY" />
                                <div className="px-2 pb-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Doctor-Approved Tools</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Clinical monitoring and patient reports for experts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-24 md:px-20 lg:px-40">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-center text-white shadow-2xl">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <h2 className="max-w-[800px] text-4xl font-black md:text-5xl">Ready to start your child's healthy journey?</h2>
                            <p className="max-w-[600px] text-lg text-white/90">Join thousands of families already using NutriKid to build lifelong healthy habits.</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link to="/register" className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-10 bg-white text-primary text-lg font-black shadow-xl hover:bg-slate-50 transition-all">
                                    Get Started Now
                                </Link>
                                <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-10 border-2 border-white/40 text-white text-lg font-bold hover:bg-white/10 transition-all">
                                    View Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 px-4 py-16 dark:bg-slate-900 md:px-20 lg:px-40">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-200 dark:border-slate-800 pb-12">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                <span className="material-symbols-outlined text-sm">nutrition</span>
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">NutriKid</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Made with love for little ones and the heroes who care for them.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <a className="hover:text-primary transition-colors" href="#">How it works</a>
                            <a className="hover:text-primary transition-colors" href="#">Features</a>
                            <a className="hover:text-primary transition-colors" href="#">Pricing</a>
                            <a className="hover:text-primary transition-colors" href="#">Success Stories</a>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Company</h4>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <a className="hover:text-primary transition-colors" href="#">About Us</a>
                            <a className="hover:text-primary transition-colors" href="#">Careers</a>
                            <a className="hover:text-primary transition-colors" href="#">Blog</a>
                            <a className="hover:text-primary transition-colors" href="#">Contact</a>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Support</h4>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <a className="hover:text-primary transition-colors" href="#">Help Center</a>
                            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                            <a className="hover:text-primary transition-colors" href="#">Cookie Policy</a>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between mt-12 gap-6">
                    <p className="text-xs text-slate-400">© 2024 NutriKid Health Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">social_leaderboard</span></a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">groups</span></a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
