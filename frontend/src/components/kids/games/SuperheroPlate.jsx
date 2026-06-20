"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuperheroMission, evaluateSuperheroPlate } from '../../../api/game.api';

const SuperheroPlate = ({ profile, onBack, onUpdateXP }) => {
    const [mission, setMission] = useState(null);
    const [plate, setPlate] = useState([]);
    const [powers, setPowers] = useState(null);
    const [evaluation, setEvaluation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeHero, setActiveHero] = useState(profile?.equippedCompanion || "Captain Milk");

    const foodOptions = [
        { id: "spinach", name: "Spinach 🥦", icon: "🥦", type: "immunity" },
        { id: "broccoli", name: "Broccoli 🌳", icon: "🥦", type: "immunity" },
        { id: "orange", name: "Orange 🍊", icon: "🍊", type: "immunity" },
        { id: "milk", name: "Milk 🥛", icon: "🥛", type: "boneShield" },
        { id: "ragi", name: "Ragi Grain 🌾", icon: "🌾", type: "boneShield" },
        { id: "eggs", name: "Eggs 🍳", icon: "🍳", type: "brainPower" },
        { id: "fish", name: "Fish 🐟", icon: "🐟", type: "brainPower" },
        { id: "banana", name: "Banana 🍌", icon: "🍌", type: "energy" },
        { id: "dal", name: "Dal Soup 🥣", icon: "🥣", type: "musclePower" },
        { id: "burger", name: "Burger 🍔", icon: "🍔", type: "junk" },
        { id: "candy", name: "Candy 🍭", icon: "🍭", type: "junk" }
    ];

    useEffect(() => {
        const loadMission = async () => {
            try {
                const res = await getSuperheroMission(profile._id);
                setMission(res.data || res);
            } catch (err) {
                console.error("Error loading mission", err);
            }
        };
        loadMission();
    }, [profile]);

    const addToPlate = (food) => {
        if (plate.length >= 4) return; // Max 4 foods on plate
        if (plate.find(f => f.id === food.id)) return; // No duplicates
        setPlate([...plate, food]);
    };

    const removeFromPlate = (foodId) => {
        setPlate(plate.filter(f => f.id !== foodId));
    };

    const handleEvaluate = async () => {
        if (plate.length === 0) return;
        setIsLoading(true);
        try {
            const foodNames = plate.map(f => f.id);
            const res = await evaluateSuperheroPlate(profile._id, {
                foods: foodNames,
                missionId: mission?.id
            });
            const data = res.data || res;
            setEvaluation(data);
            setPowers(data.powers);
            if (onUpdateXP && data.gainedXP > 0) {
                onUpdateXP(data.gainedXP);
            }
        } catch (err) {
            console.error("Evaluation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetGame = async () => {
        setPlate([]);
        setEvaluation(null);
        setPowers(null);
        setIsLoading(true);
        try {
            const res = await getSuperheroMission(profile._id);
            setMission(res.data || res);
        } catch (err) {
            console.error("Error reloading mission", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto custom-scrollbar p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold">
                    <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
                </button>
                <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wide">
                    🦸 Superhero Plate Builder
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto w-full flex-1">
                {/* Left Column: Mission Card & Food Selection (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Mission Board */}
                    {mission && (
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute right-4 bottom-0 opacity-15 text-9xl">⚡</div>
                            <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full tracking-widest">Active Duty Mission</span>
                            <h3 className="text-2xl font-black mt-2 mb-1">{mission.title}</h3>
                            <p className="text-sm font-semibold opacity-90 leading-relaxed mb-4">{mission.description}</p>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1">
                                    🎯 Mission Goal: {mission.requiredStat.toUpperCase()}
                                </div>
                                <div className="bg-yellow-400 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md">
                                    ⭐ +{mission.rewardXP} XP
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Food Items Pantry */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1">
                        <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            🛒 Open Pantry <span className="text-xs text-slate-400 font-bold">(Select up to 4 ingredients)</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {foodOptions.map((food) => {
                                const onPlate = plate.find(p => p.id === food.id);
                                return (
                                    <motion.button
                                        key={food.id}
                                        onClick={() => addToPlate(food)}
                                        whileHover={{ y: -2 }}
                                        whileActive={{ scale: 0.95 }}
                                        disabled={onPlate || plate.length >= 4}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                                            onPlate 
                                                ? "border-green-400 bg-green-50/50 opacity-55"
                                                : plate.length >= 4
                                                    ? "border-slate-100 bg-slate-50/30 cursor-not-allowed opacity-55"
                                                    : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
                                        }`}
                                    >
                                        <span className="text-4xl mb-2">{food.icon}</span>
                                        <span className="font-black text-xs text-slate-700 leading-none">{food.name}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase mt-1.5 tracking-wider">{food.type}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactive Golden Plate & Reaction (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Character and Plate Visualizer */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center flex-1 relative min-h-[450px]">
                        <div className="absolute top-6 left-6 text-xs font-black text-slate-400 uppercase">
                            Mascot Companion: {activeHero}
                        </div>

                        {/* Superhero Mascot visual feedback */}
                        <div className="flex flex-col items-center mb-6">
                            <motion.div 
                                animate={evaluation ? { y: [0, -10, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-white mb-2"
                            >
                                {activeHero === "Captain Milk" ? "🥛🤠" : activeHero === "Iron-Man Ragi" ? "🌾🛡️" : "🥦🦸"}
                            </motion.div>
                            <p className="font-black text-slate-700 text-lg uppercase tracking-tight">{activeHero}</p>
                            <p className="text-xs font-bold text-slate-400 italic">"Feed me strong attributes!"</p>
                        </div>

                        {/* Interactive golden plate */}
                        <div className="relative w-64 h-64 bg-yellow-50 rounded-full shadow-inner border-[6px] border-yellow-400 flex items-center justify-center mb-8">
                            <div className="absolute inset-4 rounded-full border-2 border-dashed border-yellow-200 flex items-center justify-center">
                                {plate.length === 0 && (
                                    <p className="text-center text-xs font-bold text-yellow-600/70 p-6 leading-relaxed">
                                        Tap pantry foods to load onto your superhero lunch shield! 🍽️
                                    </p>
                                )}
                            </div>

                            {/* Plate Items layout */}
                            {plate.map((item, idx) => {
                                const positions = [
                                    "top-6 left-1/2 -translate-x-1/2",
                                    "bottom-6 left-1/2 -translate-x-1/2",
                                    "left-6 top-1/2 -translate-y-1/2",
                                    "right-6 top-1/2 -translate-y-1/2"
                                ];
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`absolute w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center border border-yellow-250 cursor-pointer ${positions[idx]}`}
                                        onClick={() => removeFromPlate(item.id)}
                                    >
                                        <span className="text-2xl">{item.icon}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Evaluation screen overlay */}
                        <AnimatePresence>
                            {evaluation && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/95 rounded-[2.5rem] p-6 flex flex-col items-center overflow-y-auto custom-scrollbar z-10"
                                >
                                    <h3 className="text-3xl font-black text-slate-800 mb-1">Plate Evaluated!</h3>
                                    <div className="flex gap-1.5 mb-4 text-4xl">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <span key={i} className={i < evaluation.stars ? "text-yellow-400" : "text-slate-200"}>★</span>
                                        ))}
                                    </div>
                                    <p className="text-center font-bold text-slate-500 mb-6 max-w-sm leading-relaxed shrink-0">
                                        Amazing! Your superhero plate generated critical stats, granting you +{evaluation.gainedXP} XP!
                                    </p>

                                    {/* Calculated Power Bar Stats */}
                                    {powers && (
                                        <div className="w-full max-w-sm space-y-2.5 mb-6 shrink-0">
                                            <div>
                                                <div className="flex justify-between text-xs font-black text-slate-500">
                                                    <span>🛡️ BONE SHIELD</span>
                                                    <span>{powers.boneShield} pts</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div style={{ width: `${powers.boneShield}%` }} className="h-full bg-sky-400"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-black text-slate-500">
                                                    <span>💚 IMMUNITY SHIELD</span>
                                                    <span>{powers.immunity} pts</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div style={{ width: `${powers.immunity}%` }} className="h-full bg-emerald-400"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-black text-slate-500">
                                                    <span>⚡ MUSCLE POWER</span>
                                                    <span>{powers.dal ? powers.dal * 5 : 45} pts</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div style={{ width: `45%` }} className="h-full bg-orange-400"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Explainable AI Science Layer */}
                                    {evaluation.why_it_worked && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-3 w-full max-w-sm mb-6 shrink-0">
                                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                                                <span className="material-symbols-outlined text-sm">science</span> 🔬 Biological Science Lab
                                            </h4>
                                            
                                            <div className="bg-white p-3 rounded-xl border border-slate-150">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mascot Explanation</p>
                                                <p className="font-black text-slate-800 text-xs leading-normal">{evaluation.why_it_worked}</p>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-150">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cellular Pathway & Metabolism</p>
                                                <p className="font-bold text-slate-600 text-[11px] leading-relaxed">{evaluation.scientific_reason}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-3 rounded-xl border border-slate-150">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Key Nutrients</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {evaluation.key_nutrients?.map((n, i) => (
                                                            <span key={i} className="bg-blue-50 text-blue-600 border border-blue-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-150">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Systems Supported</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {evaluation.body_systems_supported?.map((s, i) => (
                                                            <span key={i} className="bg-emerald-50 text-emerald-600 border border-emerald-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-slate-150">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Real-World Health Connection</p>
                                                <p className="font-semibold text-slate-700 text-[11px] leading-relaxed">{evaluation.real_world_health_benefit}</p>
                                            </div>

                                            <div className="bg-yellow-50 text-yellow-800 border border-yellow-250 p-3 rounded-xl">
                                                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                    💡 Did you know?
                                                </p>
                                                <p className="font-semibold text-[11px] leading-relaxed">{evaluation.fun_fact}</p>
                                            </div>
                                        </div>
                                    )}

                                    {evaluation.leveledUp && (
                                        <div className="bg-yellow-400 text-slate-800 font-black px-6 py-2 rounded-full uppercase text-xs mb-6 animate-bounce shrink-0">
                                            🎉 Leveled Up to Level {evaluation.level}!
                                        </div>
                                    )}

                                    <button 
                                        onClick={resetGame}
                                        className="py-4 px-8 bg-blue-500 text-white font-black rounded-2xl shadow-lg hover:bg-blue-600 transition-all w-full max-w-sm shrink-0"
                                    >
                                        PLAY AGAIN 🚀
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Evaluate Trigger */}
                        {!evaluation && (
                            <button
                                onClick={handleEvaluate}
                                disabled={plate.length === 0 || isLoading}
                                className="w-full py-4 bg-green-500 text-white font-black rounded-2xl shadow-lg hover:bg-green-600 transition-all active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {isLoading ? "EVALUATING INGREDIENTS..." : "⚡ FUEL THE SHIELD ⚡"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperheroPlate;
