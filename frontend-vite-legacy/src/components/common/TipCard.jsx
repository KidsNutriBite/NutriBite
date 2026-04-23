
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TipCard = ({ tip, childName }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Default values if tip is missing or structure is different
    const tipText = tip?.text || "Try to include at least 3 different colors of vegetables in dinner today to boost antioxidant intake!";
    const tipTag = tip?.tag || "Daily Tip";
    // Mock explanation if not provided (since backend might not provide it yet)
    const explanation = tip?.explanation || `This helps build a strong immune system and keeps ${childName || 'your child'} energetic throughout the day. Colorful vegetables provide essential vitamins and antioxidants that are crucial for growth. Consistent healthy eating habits formed now will benefit them for a lifetime.`;

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden group h-full hover:border-indigo-100 transition-all duration-300">
            {/* Soft decorative background blob */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm">
                            <span className="material-symbols-outlined text-xl">lightbulb</span>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            {tipTag}
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wide mb-2">
                        {childName ? `Insight for ${childName}` : 'Health Insight'}
                    </h4>
                    <p className="text-xl md:text-2xl font-bold text-gray-800 leading-snug">
                        "{tipText}"
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-full group/btn"
                    >
                        <span>{isExpanded ? 'Hide explanation' : 'Why is this important?'}</span>
                        <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 text-sm text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                    {explanation}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TipCard;
