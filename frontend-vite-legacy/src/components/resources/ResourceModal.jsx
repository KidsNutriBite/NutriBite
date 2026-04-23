import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ResourceModal = ({ isOpen, onClose, resource, isSaved, onToggleSave }) => {
    if (!isOpen || !resource) return null;

    const { title, image, description, tags, nutrition, prepTime, preview, content } = resource;
    const isRecipe = !!prepTime;

    const [scrollProgress, setScrollProgress] = useState(0);
    const contentRef = useRef(null);

    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;
        // Calculate progress from 0 to 1 over the first 200px of scroll
        const progress = Math.min(scrollTop / 200, 1);
        setScrollProgress(progress);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl h-full md:max-h-[85vh] bg-white dark:bg-slate-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header Image for Recipes - Dynamic Height */}
                    {image ? (
                        <div
                            className="w-full relative shrink-0 transition-all duration-300 ease-out origin-top"
                            style={{
                                height: `${Math.max(120, 320 - (scrollProgress * 200))}px`,
                                opacity: 1
                            }}
                        >
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-colors z-20"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div
                                className="absolute left-6 right-6 transition-all duration-300"
                                style={{
                                    bottom: scrollProgress > 0.8 ? '16px' : '24px',
                                    transform: `translateY(${scrollProgress * 10}px)`
                                }}
                            >
                                <div
                                    className="flex gap-2 mb-2 transition-opacity duration-300"
                                    style={{ opacity: Math.max(0, 1 - (scrollProgress * 2)) }}
                                >
                                    {tags && tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/30 shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h2
                                    className="font-black text-white leading-tight shadow-black drop-shadow-lg transition-all duration-300"
                                    style={{
                                        fontSize: `${Math.max(1.5, 2.5 - scrollProgress)}rem`,
                                        lineHeight: 1.1
                                    }}
                                >
                                    {title}
                                </h2>
                            </div>
                        </div>
                    ) : (
                        // Header without image
                        <div className="flex justify-between items-start px-6 pt-6 md:px-10 md:pt-10 mb-2 border-b border-slate-100 pb-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">{title}</h2>
                                {tags && (
                                    <div className="flex gap-2">
                                        {tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>
                    )}

                    {/* Content Body */}
                    <div
                        ref={contentRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 scroll-smooth"
                    >
                        {/* Recipe Specific Info */}
                        {isRecipe && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 text-center">
                                    <span className="material-symbols-outlined text-orange-500 text-2xl mb-1">schedule</span>
                                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-0.5">Time</p>
                                    <p className="font-black text-slate-800 dark:text-orange-100">{prepTime}</p>
                                </div>
                                {nutrition?.iron && (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                                        <span className="material-symbols-outlined text-red-500 text-2xl mb-1">bloodtype</span>
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">Iron</p>
                                        <p className="font-black text-slate-800 dark:text-red-100">High</p>
                                    </div>
                                )}
                                {nutrition?.protein && (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                                        <span className="material-symbols-outlined text-blue-500 text-2xl mb-1">fitness_center</span>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">Protein</p>
                                        <p className="font-black text-slate-800 dark:text-blue-100">High</p>
                                    </div>
                                )}
                                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                                    <span className="material-symbols-outlined text-green-500 text-2xl mb-1">bolt</span>
                                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-0.5">Energy</p>
                                    <p className="font-black text-slate-800 dark:text-green-100">Boost</p>
                                </div>
                            </div>
                        )}

                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-medium mb-6">
                                {description || preview}
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                {isRecipe ? 'Instructions' : 'Key Details'}
                            </h3>
                            {content ? (
                                <div dangerouslySetInnerHTML={{ __html: content }} />
                            ) : (
                                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                                    <p>Detailed content for this resource is currently being updated. Please check back soon for the full guide!</p>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Quick Summary</span>
                                        This resource focuses on providing actionable advice tailored for Indian families, ensuring cultural relevance and nutritional accuracy.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => onToggleSave && onToggleSave(resource.id)}
                            className={`font-bold px-8 py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${isSaved
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                                }`}
                        >
                            <span className={`material-symbols-outlined ${isSaved ? 'fill-current' : ''}`}>
                                {isSaved ? 'favorite' : 'bookmark_add'}
                            </span>
                            {isSaved ? 'Remove from Saved' : 'Save Resource'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ResourceModal;
