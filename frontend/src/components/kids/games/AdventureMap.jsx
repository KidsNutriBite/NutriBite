"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { completeAdventureMission } from '../../../api/game.api';

const AdventureMap = ({ profile, stats, onBack, onUpdateXP }) => {
    const checkpoints = [
        { id: "start", name: "Camp Start 🏕️", emoji: "🏕️", x: 10, y: 70, desc: "Your journey to nutritional mastery begins here!" },
        { id: "forest", name: "Hydration Forest 🌳", emoji: "🌳", x: 30, y: 35, desc: "Deep trees fed by pure, sparkling water!" },
        { id: "mountains", name: "Veggie Heights 🏔️", emoji: "🏔️", x: 55, y: 65, desc: "High peaks glowing with essential vitamin power!" },
        { id: "space", name: "Macro Galaxy 🚀", emoji: "🚀", x: 75, y: 20, desc: "A sparkling orbit fueled by breakfast blocks!" },
        { id: "ocean", name: "Ocean of Knowledge 🌊", emoji: "🌊", x: 90, y: 55, desc: "Unlock endless curiosity with Food Buddy!" }
    ];

    const [unlockedCheckpoints, setUnlockedCheckpoints] = useState(profile?.adventureCheckpoints || ["start"]);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState(checkpoints[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [gainedXP, setGainedXP] = useState(null);
    const [leveledUp, setLeveledUp] = useState(false);
    const [adventureExplanation, setAdventureExplanation] = useState(null);

    const activeMascot = profile?.equippedCompanion === "Captain Milk" ? "🤠🥛" : profile?.equippedCompanion === "Iron-Man Ragi" ? "🛡️🌾" : "🦸🥦";

    const dailyMissions = [
        { id: "drink_water", title: "Drink Water 💧", desc: "Drink pure clear water to hydrate your body cells.", target: "forest", icon: "💧" },
        { id: "eat_veggies", title: "Eat Vegetables 🥦", desc: "Log broccoli or spinach to activate fiber forcefields.", target: "mountains", icon: "🥦" },
        { id: "log_breakfast", title: "Complete Breakfast 🍳", desc: "Log a healthy breakfast idli or egg to fuel muscles.", target: "space", icon: "🍳" },
        { id: "ask_nutrition_question", title: "Curiosity Spark 🔬", desc: "Ask Food Buddy about protein, carbs, or digestion.", target: "ocean", icon: "🔬" }
    ];

    const handleClaimUnlock = async (mission) => {
        if (isLoading) return;
        setIsLoading(true);
        setGainedXP(null);
        setLeveledUp(false);
        setAdventureExplanation(null);

        try {
            const res = await completeAdventureMission(profile._id, { missionId: mission.id });
            const data = res.data || res;
            
            setUnlockedCheckpoints(data.adventureCheckpoints);
            
            // Highlight the newly unlocked checkpoint
            const nextCp = checkpoints.find(c => c.id === data.currentCheckpoint);
            if (nextCp) setSelectedCheckpoint(nextCp);

            if (data.checkpointUnlocked) {
                setGainedXP(data.gainedXP);
                setLeveledUp(data.leveledUp);
                setAdventureExplanation(data);
            }

            if (onUpdateXP && data.gainedXP > 0) {
                onUpdateXP(data.gainedXP);
            }
        } catch (err) {
            console.error("Failed to complete adventure mission", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto custom-scrollbar p-6">
            {/* XP Celebration overlay */}
            <AnimatePresence>
                {gainedXP && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8 }}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-emerald-400 text-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="text-7xl mb-4">🗺️✨</div>
                            <h3 className="text-2xl font-black mb-2">Checkpoint Unlocked!</h3>
                            <p className="text-md font-bold text-emerald-600 mb-6">Successfully traveled to the next adventure zone!</p>
                            <p className="text-sm font-bold text-slate-400 mb-6">You earned +{gainedXP} progression XP for maintaining healthy habits!</p>
                            
                            {/* Explainable AI Science Layer */}
                            {adventureExplanation && adventureExplanation.why_it_worked && (
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-3.5 w-full mb-6">
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                                        <span className="material-symbols-outlined text-sm">science</span> 🔬 Biological Science Lab
                                    </h4>
                                    
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mascot Explanation</p>
                                        <p className="font-black text-slate-800 text-xs leading-normal">{adventureExplanation.why_it_worked}</p>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cellular Pathway & Metabolism</p>
                                        <p className="font-bold text-slate-600 text-[11px] leading-relaxed">{adventureExplanation.scientific_reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Key Nutrients</p>
                                            <div className="flex flex-wrap gap-1">
                                                {adventureExplanation.key_nutrients?.map((n, i) => (
                                                    <span key={i} className="bg-emerald-50 text-emerald-600 border border-emerald-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Systems Supported</p>
                                            <div className="flex flex-wrap gap-1">
                                                {adventureExplanation.body_systems_supported?.map((s, i) => (
                                                    <span key={i} className="bg-emerald-50 text-emerald-600 border border-emerald-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Real-World Health Connection</p>
                                        <p className="font-semibold text-slate-700 text-[11px] leading-relaxed">{adventureExplanation.real_world_health_benefit}</p>
                                    </div>

                                    <div className="bg-yellow-50 text-yellow-800 border border-yellow-250 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-yellow-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                            💡 Did you know?
                                        </p>
                                        <p className="font-semibold text-[11px] leading-relaxed">{adventureExplanation.fun_fact}</p>
                                    </div>
                                </div>
                            )}

                            {leveledUp && (
                                <div className="bg-yellow-400 text-slate-900 font-black px-6 py-2 rounded-full uppercase text-xs mb-6 tracking-wide animate-bounce">
                                    🎉 Level Up!
                                </div>
                            )}

                            <button 
                                onClick={() => { setGainedXP(null); setAdventureExplanation(null); }}
                                className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-600 transition-all"
                            >
                                CONTINUOUS JOURNEY 🚀
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold">
                    <span className="material-symbols-outlined">arrow_back</span> Dashboard
                </button>
                <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wide">
                    🗺️ Healthy Habit Adventure Map
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1300px] mx-auto w-full flex-1">
                {/* Left Column: Visual Map Board (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* The Interactive Map Viewport */}
                    <div className="bg-gradient-to-br from-cyan-150 to-emerald-50 border border-slate-200 rounded-[2.5rem] p-6 h-[400px] shadow-sm relative overflow-hidden select-none">
                        
                        {/* Map track connections vector canvas */}
                        <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none">
                            <path 
                                d="M 10 70 Q 20 35 30 35 T 55 65 T 75 20 T 90 55" 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="4" 
                                strokeDasharray="8 8"
                                className="opacity-40"
                            />
                        </svg>

                        {/* Map Checkpoint Bubbles */}
                        {checkpoints.map((cp) => {
                            const isUnlocked = unlockedCheckpoints.includes(cp.id);
                            const isSelected = selectedCheckpoint.id === cp.id;
                            
                            return (
                                <motion.button
                                    key={cp.id}
                                    onClick={() => setSelectedCheckpoint(cp)}
                                    whileHover={{ scale: 1.1 }}
                                    whileActive={{ scale: 0.95 }}
                                    style={{ left: `${cp.x}%`, top: `${cp.y}%` }}
                                    className={`absolute w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 transition-all -translate-x-1/2 -translate-y-1/2 ${
                                        isSelected 
                                            ? "border-yellow-400 bg-white scale-110 z-20"
                                            : isUnlocked 
                                                ? "border-emerald-400 bg-emerald-50 z-10"
                                                : "border-slate-300 bg-slate-100 opacity-60 z-0"
                                    }`}
                                >
                                    {cp.emoji}
                                    
                                    {/* Locked pad indicator */}
                                    {!isUnlocked && (
                                        <span className="absolute -top-1 -right-1 text-xs">🔒</span>
                                    )}
                                </motion.button>
                            );
                        })}

                        {/* Mascot Icon Progressing to current active checkpoint */}
                        {(() => {
                            const currentIdx = checkpoints.findIndex(c => c.id === unlockedCheckpoints[unlockedCheckpoints.length - 1]);
                            const activeCp = checkpoints[currentIdx === -1 ? 0 : currentIdx];
                            return (
                                <motion.div 
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                    style={{ left: `${activeCp.x}%`, top: `${activeCp.y - 12}%` }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center text-xl shadow-xl z-30"
                                >
                                    {activeMascot}
                                </motion.div>
                            );
                        })()}
                    </div>

                    {/* Zone Info card */}
                    {selectedCheckpoint && (
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Checkpoint Zone</span>
                            <h4 className="text-xl font-black text-slate-800 mt-1 mb-2">{selectedCheckpoint.name}</h4>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-1">{selectedCheckpoint.desc}</p>
                            <p className="text-xs font-black text-emerald-500">
                                Status: {unlockedCheckpoints.includes(selectedCheckpoint.id) ? "🟢 UNLOCKED & ACTIVE" : "🔴 LOCKED - Habit Checkpoint Required"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Daily Habits Missions list (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-[2.5rem] p-6 border border-slate-150 flex flex-col flex-1 shadow-sm">
                        <h4 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">
                            📅 Daily Habit Quests
                        </h4>
                        <div className="flex-1 overflow-y-auto max-h-[460px] custom-scrollbar space-y-4 pr-1">
                            {dailyMissions.map((mission) => {
                                const isUnlocked = unlockedCheckpoints.includes(mission.target);
                                return (
                                    <div 
                                        key={mission.id} 
                                        className={`p-4 rounded-2xl border flex flex-col transition-all ${
                                            isUnlocked 
                                                ? "border-emerald-100 bg-emerald-50/20 text-slate-700"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-350"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <span className="text-3xl">{mission.icon}</span>
                                            <div>
                                                <h5 className="font-black text-sm leading-none mb-1">{mission.title}</h5>
                                                <p className="text-[10px] font-medium text-slate-400 leading-normal">{mission.desc}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleClaimUnlock(mission)}
                                            disabled={isUnlocked || isLoading}
                                            className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                                                isUnlocked 
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed uppercase"
                                                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95 uppercase tracking-wide"
                                            }`}
                                        >
                                            {isUnlocked ? "COMPLETED ✅" : "CLAIM UNLOCK CHECKPOINT 🗺️"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdventureMap;
