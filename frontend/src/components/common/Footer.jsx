"use client";

import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200/50 px-4 py-12 dark:bg-slate-950 dark:border-slate-900 md:px-8 lg:px-16 transition-colors duration-200">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-200/60 dark:border-slate-900 pb-12">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                <span className="material-symbols-outlined text-sm">nutrition</span>
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">NutriKids</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                            Empowering families with intelligent pediatric nutrition tools, helping parents track child health, immunity, and healthy eating through AI-guided insights.
                        </p>
                    </div>

                    {/* Quick Links - Platform */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Platform</h4>
                        <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <li>
                                <Link className="hover:text-primary transition-colors" href="/#how-it-works">How it works</Link>
                            </li>
                            <li>
                                <Link className="hover:text-primary transition-colors" href="/features">Features</Link>
                            </li>
                            <li>
                                <Link className="hover:text-primary transition-colors" href="/pricing">Pricing Plans</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links - Company */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Company</h4>
                        <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <li>
                                <Link className="hover:text-primary transition-colors" href="/about">About Us</Link>
                            </li>
                            <li>
                                <span className="text-slate-400 dark:text-slate-600">Careers</span>
                            </li>
                            <li>
                                <span className="text-slate-400 dark:text-slate-600 font-medium">Contact: abhirambikkina@gmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-6">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        © {new Date().getFullYear()} NutriKids Inc. All rights reserved. Designed for pediatric nutrition intelligence.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-slate-400 hover:text-primary cursor-pointer transition-colors material-symbols-outlined text-xl">
                            groups
                        </span>
                        <span className="text-slate-400 hover:text-primary cursor-pointer transition-colors material-symbols-outlined text-xl">
                            share
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

