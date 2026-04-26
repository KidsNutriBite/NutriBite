"use client";
import { motion } from 'framer-motion';

const DailyMission = ({ onAccept }) => {
    return (
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/4 translate-y-1/4 blur-lg"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20"
                    >
                        Today's Mission
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: 0.1, type: "spring" }}
                        className="text-3xl md:text-4xl font-black mb-3 leading-tight"
                    >
                        The Rainbow Crunch Challenge!
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.2 }}
                        className="text-orange-50 text-lg font-medium leading-relaxed mb-4 max-w-lg"
                    >
                        Eat 3 different colored vegetables today to earn the "Veggie Voyager" badge and 200 XP!
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.3 }}
                        className="flex flex-col gap-2 mb-6"
                    >
                        <p className="text-white font-bold text-sm bg-white/20 px-3 py-2 rounded-xl inline-block w-fit mx-auto md:mx-0">
                            🥦 Vegetables help you grow strong 💪
                        </p>
                        <p className="text-white font-bold text-sm bg-white/20 px-3 py-2 rounded-xl inline-block w-fit mx-auto md:mx-0">
                            🥩 Iron makes you a superhero 🦸
                        </p>
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAccept}
                        className="bg-white text-orange-500 font-black text-lg px-8 py-3 rounded-2xl shadow-lg hover:bg-orange-50 transition-colors"
                    >
                        I'm Ready!
                    </motion.button>
                </div>

                {/* Icon Circle */}
                <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }} 
                    animate={{ rotate: 0, scale: 1 }} 
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="shrink-0 relative"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <span className="text-6xl md:text-7xl">🦸‍♂️</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DailyMission;
