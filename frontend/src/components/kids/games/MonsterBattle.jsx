"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { battleMonsterAttack } from '../../../api/game.api';

const MonsterBattle = ({ profile, onBack, onUpdateXP }) => {
    const monsters = [
        { id: "burger_titan", name: "Burger Titan 🍔", icon: "🍔", maxHp: 100, desc: "A massive, heavy junk monster layered in grease! Weak against Protein Punch and Fiber Blast." },
        { id: "soda_dragon", name: "Soda Dragon 🐉", icon: "🐉", maxHp: 100, desc: "Bubbling with sugary acid! Needs a severe cooling down! Weak against Hydration Wave." },
        { id: "candy_beast", name: "Candy Beast 🦄", icon: "🦄", maxHp: 100, desc: "A colorful sugar fiend that weakens child tooth enamel! Weak against Calcium Cannon." }
    ];

    const [activeMonsterIdx, setActiveMonsterIdx] = useState(0);
    const [monsterHp, setMonsterHp] = useState(100);
    const [battleLogs, setBattleLogs] = useState(["A wild Junk Food Monster appeared! Choose a healthy food attack!"]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDefeated, setIsDefeated] = useState(false);
    const [gainedXP, setGainedXP] = useState(null);
    const [leveledUp, setLeveledUp] = useState(false);
    const [activeExplanation, setActiveExplanation] = useState(null);

    const activeMonster = monsters[activeMonsterIdx];

    const attackOptions = [
        { id: "spinach", name: "Fiber Blast 🥦", icon: "🥦", description: "Launches heavy green leaf-bots." },
        { id: "dal", name: "Protein Punch 🥣", icon: "🥣", description: "Builds a heavy direct structural punch." },
        { id: "water", name: "Hydration Wave 💧", icon: "💧", description: "Splashes pure hydration." },
        { id: "orange", name: "Vitamin Shield 🍊", icon: "🍊", description: "Erects immunoglobin forcefield." },
        { id: "milk", name: "Calcium Cannon 🥛", icon: "🥛", description: "Blasts heavy bone mineralization bricks." },
        { id: "burger", name: "Burger (Junk Food) 🍔", icon: "🍔", description: "Feed it a snack?", isJunk: true },
        { id: "soda", name: "Soda (Junk Food) 🥤", icon: "🥤", description: "Spritz it with sugar?", isJunk: true }
    ];

    const handleAttack = async (food) => {
        if (isLoading || isDefeated) return;
        setIsLoading(true);
        try {
            const res = await battleMonsterAttack(profile._id, {
                monsterId: activeMonster.id,
                attackFood: food.id,
                monsterHp: monsterHp
            });
            
            const data = res.data || res;
            
            setMonsterHp(data.monsterHpLeft);
            setBattleLogs(prev => [data.message, ...prev]);

            // Capture and display explanation
            setActiveExplanation(data);

            if (data.monsterDefeated) {
                setIsDefeated(true);
                setGainedXP(data.gainedXP);
                setLeveledUp(data.leveledUp);
                if (onUpdateXP) {
                    onUpdateXP(data.gainedXP);
                }
            } else if (onUpdateXP && data.gainedXP > 0) {
                onUpdateXP(data.gainedXP);
            }
        } catch (err) {
            console.error("Attack evaluation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const nextMonster = () => {
        const nextIdx = (activeMonsterIdx + 1) % monsters.length;
        setActiveMonsterIdx(nextIdx);
        setMonsterHp(100);
        setIsDefeated(false);
        setGainedXP(null);
        setLeveledUp(false);
        setActiveExplanation(null);
        setBattleLogs([`A new wild ${monsters[nextIdx].name} appeared! Attack using healthy nutrients!`]);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-900 text-white overflow-y-auto custom-scrollbar p-6 relative">
            {/* Dark background dust grids */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 shrink-0 relative z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span> Exit Arena
                </button>
                <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider">
                    ⚔️ Junk Food Monster Arena
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1300px] mx-auto w-full flex-1 relative z-10">
                {/* Left Column: Battle Arena Screen (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Monster Visual Box */}
                    <div className="bg-slate-800/80 border border-slate-700/50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative min-h-[360px] shadow-2xl backdrop-blur-md">
                        {/* HP Bar */}
                        <div className="w-full max-w-md mb-8">
                            <div className="flex justify-between items-center text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">
                                <span>{activeMonster.name}</span>
                                <span className={monsterHp < 30 ? "text-red-400 animate-pulse" : "text-green-400"}>
                                    {monsterHp} / {activeMonster.maxHp} HP
                                </span>
                            </div>
                            <div className="h-4 bg-slate-950 rounded-full border border-slate-750 overflow-hidden shadow-inner">
                                <motion.div 
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${monsterHp}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        monsterHp < 30 
                                            ? "bg-gradient-to-r from-red-600 to-red-400" 
                                            : monsterHp < 60 
                                                ? "bg-gradient-to-r from-yellow-500 to-yellow-300"
                                                : "bg-gradient-to-r from-green-500 to-green-300"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Monster Figure */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeMonster.id}
                                animate={isDefeated ? { rotate: [0, 90, 90], y: [0, 100, 100], opacity: 0 } : { y: [0, -10, 0] }}
                                transition={{ repeat: isDefeated ? 0 : Infinity, duration: 2.5 }}
                                className="text-8xl p-6 relative select-none"
                            >
                                {activeMonster.icon}
                                {monsterHp < 40 && !isDefeated && (
                                    <span className="absolute top-2 right-2 text-2xl animate-ping">💢</span>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Defeat Screen Overlay */}
                        <AnimatePresence>
                            {isDefeated && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-950/95 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center z-20 border border-yellow-500/50"
                                >
                                    <span className="text-7xl mb-4 animate-bounce">🏆</span>
                                    <h3 className="text-3xl font-black text-yellow-400 mb-2">Victory!</h3>
                                    <p className="font-bold text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                                        You successfully defended your cells and defeated the massive {activeMonster.name}! You earned +{gainedXP} learning XP!
                                    </p>

                                    {leveledUp && (
                                        <div className="bg-yellow-400 text-slate-900 font-black px-6 py-2 rounded-full uppercase text-xs mb-6 tracking-wide animate-bounce">
                                            🎉 Level Up!
                                        </div>
                                    )}

                                    <button 
                                        onClick={nextMonster}
                                        className="py-4 px-8 bg-green-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all w-full max-w-xs"
                                    >
                                        NEXT LEVEL ⚔️
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Battle log terminal */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-[2rem] p-5 h-44 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col gap-2">
                        {battleLogs.map((log, idx) => (
                            <div key={idx} className={`leading-relaxed ${idx === 0 ? "text-green-400 font-bold" : "text-slate-500"}`}>
                                &gt;&gt; {log}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Skill Book Attack Options (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-slate-850/80 border border-slate-750 rounded-[2.5rem] p-6 flex flex-col flex-1 shadow-xl">
                        <h4 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-400">
                            🧬 Nutrient Attacks Book
                        </h4>
                        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-3 pr-1">
                            {attackOptions.map((attack) => (
                                <motion.button
                                    key={attack.id}
                                    onClick={() => handleAttack(attack)}
                                    whileHover={{ x: 3 }}
                                    whileActive={{ scale: 0.98 }}
                                    disabled={isLoading || isDefeated}
                                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                        attack.isJunk 
                                            ? "border-red-950/50 bg-red-950/10 hover:bg-red-900/10 hover:border-red-800 text-red-300"
                                            : "border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-blue-500 text-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="text-3xl">{attack.icon}</div>
                                        <div>
                                            <p className="font-black text-sm leading-none mb-1">{attack.name}</p>
                                            <p className="text-[10px] font-medium text-slate-450 leading-relaxed">{attack.description}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 text-sm">bolt</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Biology science insight popup */}
            <AnimatePresence>
                {activeExplanation && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        {/* Closer backdrop */}
                        <div className="absolute inset-0 z-0" onClick={() => setActiveExplanation(null)}></div>
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar text-left text-white"
                        >
                            <div className="flex items-center justify-between mb-4 shrink-0 font-sans">
                                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">science</span> 🔬 Biological Science Lab
                                </h4>
                                <button onClick={() => setActiveExplanation(null)} className="p-1.5 hover:bg-slate-800 rounded-full">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">close</span>
                                </button>
                            </div>

                            <div className="space-y-3.5 font-sans">
                                <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/50">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Power Action Result</p>
                                    <p className="font-black text-indigo-300 text-xs leading-normal">{activeExplanation.why_it_worked}</p>
                                </div>

                                <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/50">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cellular Pathway & Metabolism</p>
                                    <p className="font-bold text-slate-300 text-[11px] leading-relaxed">{activeExplanation.scientific_reason}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/50">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Key Nutrients</p>
                                        <div className="flex flex-wrap gap-1">
                                            {activeExplanation.key_nutrients?.map((n, i) => (
                                                <span key={i} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/50">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Systems Supported</p>
                                        <div className="flex flex-wrap gap-1">
                                            {activeExplanation.body_systems_supported?.map((s, i) => (
                                                <span key={i} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/50">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Real-World Health Connection</p>
                                    <p className="font-semibold text-slate-350 text-[11px] leading-relaxed">{activeExplanation.real_world_health_benefit}</p>
                                </div>

                                <div className="bg-yellow-500/10 text-yellow-350 border border-yellow-500/20 p-3 rounded-2xl">
                                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                        💡 Did you know?
                                    </p>
                                    <p className="font-semibold text-[11px] leading-relaxed">{activeExplanation.fun_fact}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setActiveExplanation(null)}
                                className="mt-5 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider font-sans"
                            >
                                BACK TO COMBAT ⚔️
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MonsterBattle;
