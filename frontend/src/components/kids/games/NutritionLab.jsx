"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mixNutritionLab } from '../../../api/game.api';

const NutritionLab = ({ profile, onBack, onUpdateXP }) => {
    const ingredientsOptions = [
        { id: "spinach", name: "Spinach 🥦", icon: "🥦" },
        { id: "carrot", name: "Carrot 🥕", icon: "🥕" },
        { id: "broccoli", name: "Broccoli 🌳", icon: "🥦" },
        { id: "milk", name: "Milk 🥛", icon: "🥛" },
        { id: "ragi", name: "Ragi Grain 🌾", icon: "🌾" },
        { id: "walnuts", name: "Walnuts 🥜", icon: "🥜" },
        { id: "banana", name: "Banana 🍌", icon: "🍌" },
        { id: "eggs", name: "Eggs 🍳", icon: "🍳" },
        { id: "dal", name: "Dal Soup 🥣", icon: "🥣" }
    ];

    const [selected, setSelected] = useState([]);
    const [isMixing, setIsMixing] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [showRecipeBook, setShowRecipeBook] = useState(false);
    const [discoveredList, setDiscoveredList] = useState(profile?.discoveredRecipes || []);

    const toggleSelect = (ingredient) => {
        if (selected.find(s => s.id === ingredient.id)) {
            setSelected(selected.filter(s => s.id !== ingredient.id));
        } else {
            if (selected.length >= 3) return; // Max 3 ingredients
            setSelected([...selected, ingredient]);
        }
        setErrorMsg("");
    };

    const handleMix = async () => {
        if (selected.length < 2) {
            setErrorMsg("Select at least 2 ingredients to start brewing! 🔬");
            return;
        }
        setIsMixing(true);
        setErrorMsg("");
        setResult(null);

        try {
            // Wait 2 seconds to play boiling bubble animation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const listNames = selected.map(s => s.id);
            const res = await mixNutritionLab(profile._id, { ingredients: listNames });
            const data = res.data || res;
            
            setResult(data);
            setSelected([]);
            
            if (data.discoveredRecipes) {
                setDiscoveredList(data.discoveredRecipes);
            }

            if (onUpdateXP && data.gainedXP > 0) {
                onUpdateXP(data.gainedXP);
            }
        } catch (err) {
            console.error("Cauldron mixing failed", err);
            setErrorMsg("Oh no! The cauldron bubbled over. Try again!");
        } finally {
            setIsMixing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-900 text-white overflow-y-auto custom-scrollbar p-6 relative">
            {/* Lab Grid and bubbles */}
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold">
                    <span className="material-symbols-outlined">arrow_back</span> Exit Lab
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowRecipeBook(true)}
                        className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider flex items-center gap-1.5 hover:bg-indigo-600/30 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-sm">menu_book</span> Recipe Book ({discoveredList.length})
                    </button>
                    <div className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider">
                        🔬 Nutrition Lab Cauldron
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1300px] mx-auto w-full flex-1 relative z-10">
                {/* Left Column: Boiling Cauldron (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6 items-center justify-center relative min-h-[460px] bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
                    
                    {/* Mixing Cauldron Figure */}
                    <div className="relative flex flex-col items-center justify-center w-72 h-72">
                        {/* Cauldron base */}
                        <motion.div 
                            animate={isMixing ? { y: [0, -10, 5, -5, 0], rotate: [0, -2, 2, -2, 0] } : {}}
                            transition={{ repeat: isMixing ? Infinity : 0, duration: 0.5 }}
                            className="text-9xl relative z-10 select-none cursor-pointer"
                        >
                            🧙‍♂️🏺
                        </motion.div>

                        {/* Cauldron shadow glowing */}
                        <div className={`absolute bottom-4 w-40 h-8 rounded-full blur-xl transition-all duration-300 ${
                            isMixing ? "bg-purple-500 animate-pulse scale-125" : "bg-indigo-500/30"
                        }`}></div>

                        {/* Floating elements inside mixing */}
                        {isMixing && (
                            <>
                                <motion.div animate={{ y: [-20, -100], x: [-10, 20], scale: [0.5, 1], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute text-3xl z-0">🫧</motion.div>
                                <motion.div animate={{ y: [-20, -80], x: [30, -10], scale: [0.3, 0.8], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} className="absolute text-2xl z-0">✨</motion.div>
                                <motion.div animate={{ y: [-20, -120], x: [0, -30], scale: [0.4, 1.2], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="absolute text-3xl z-0">🧪</motion.div>
                            </>
                        )}

                        {/* Selected overlay floating */}
                        <div className="absolute top-2 w-full flex justify-center gap-2 z-20">
                            {selected.map((item, idx) => (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    className="w-10 h-10 bg-white/10 rounded-full border border-white/20 flex items-center justify-center text-xl shadow-lg backdrop-blur-sm"
                                >
                                    {item.icon}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Result Card Overlay */}
                    <AnimatePresence>
                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/95 rounded-[2.5rem] p-8 flex flex-col items-center overflow-y-auto custom-scrollbar text-center z-35 border border-indigo-500/50"
                            >
                                <span className="text-7xl mb-4 animate-bounce shrink-0">
                                    {result.recipeName === "Mystery Potion" ? "🧪" : "🧪🥤"}
                                </span>
                                {result.isNewDiscovery && (
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-slate-900 px-3 py-1 rounded-full mb-2 shrink-0">
                                        ✨ NEW RECIPE DISCOVERED! ✨
                                    </span>
                                )}
                                <h3 className="text-3xl font-black text-indigo-400 mb-1 shrink-0">{result.recipeName}</h3>
                                <p className="text-xs font-black text-purple-400 uppercase tracking-wider mb-4 shrink-0">
                                    Category: {result.category.toUpperCase()}
                                </p>
                                <p className="font-semibold text-slate-400 text-sm max-w-md mb-6 leading-relaxed shrink-0">
                                    {result.desc}
                                </p>
                                <div className="flex gap-4 mb-6 shrink-0">
                                    <div className="bg-yellow-400/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-xl text-xs font-black">
                                        ⭐ +{result.gainedXP} XP
                                    </div>
                                    <div className="bg-indigo-400/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-black">
                                        🧠 Curiosity Score: {result.curiosityScore}
                                    </div>
                                </div>

                                {/* Explainable AI Science Layer */}
                                {result.why_it_worked && (
                                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 text-left space-y-3.5 w-full max-w-md mb-6 shrink-0">
                                        <h4 className="font-black text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">science</span> 🔬 Biological Science Lab
                                        </h4>
                                        
                                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Mascot Explanation</p>
                                            <p className="font-black text-slate-200 text-xs leading-normal">{result.why_it_worked}</p>
                                        </div>

                                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cellular Pathway & Metabolism</p>
                                            <p className="font-bold text-slate-350 text-[11px] leading-relaxed">{result.scientific_reason}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Key Nutrients</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.key_nutrients?.map((n, i) => (
                                                        <span key={i} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                            {n}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Systems Supported</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.body_systems_supported?.map((s, i) => (
                                                        <span key={i} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Real-World Health Connection</p>
                                            <p className="font-semibold text-slate-350 text-[11px] leading-relaxed">{result.real_world_health_benefit}</p>
                                        </div>

                                        <div className="bg-yellow-500/10 text-yellow-350 border border-yellow-500/20 p-3 rounded-xl">
                                            <p className="text-[9px] font-black text-yellow-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                💡 Did you know?
                                            </p>
                                            <p className="font-semibold text-[11px] leading-relaxed">{result.fun_fact}</p>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => setResult(null)}
                                    className="py-4 px-8 bg-indigo-500 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-600 transition-all w-full max-w-xs shrink-0"
                                >
                                    BREW ANOTHER FORMULA 🧪
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mixing evaluation trigger */}
                    {!result && (
                        <div className="w-full max-w-sm">
                            {errorMsg && (
                                <p className="text-red-400 text-xs font-black mb-3 text-center">{errorMsg}</p>
                            )}
                            <button
                                onClick={handleMix}
                                disabled={selected.length < 2 || isMixing}
                                className="w-full py-4 bg-indigo-500 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed uppercase tracking-wider text-sm relative z-25"
                            >
                                {isMixing ? "MIXING FORMULAS..." : "🔮 BREW NUTRITION SHAKE 🔮"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Lab Ingredients Selection Book (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-slate-850/80 border border-slate-750 rounded-[2.5rem] p-6 flex flex-col flex-1 shadow-xl">
                        <h4 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-400">
                            🧬 Laboratory Pantry
                        </h4>
                        <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                            {ingredientsOptions.map((item) => {
                                const isSelected = selected.find(s => s.id === item.id);
                                return (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => toggleSelect(item)}
                                        whileHover={{ scale: 1.03 }}
                                        whileActive={{ scale: 0.97 }}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                                            isSelected 
                                                ? "border-indigo-500 bg-indigo-500/20 text-white"
                                                : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300"
                                        }`}
                                    >
                                        <span className="text-3xl mb-1.5">{item.icon}</span>
                                        <span className="font-black text-[10px] uppercase text-center leading-none tracking-tight">{item.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Illustrated Recipe Book Drawer modal */}
            <AnimatePresence>
                {showRecipeBook && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4">
                        {/* Overlay closer */}
                        <div className="absolute inset-0 z-0" onClick={() => setShowRecipeBook(false)}></div>
                        
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            className="relative z-10 w-full max-w-md h-full bg-slate-900 border-l border-slate-800 rounded-l-[2.5rem] p-8 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h3 className="text-xl font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined">menu_book</span> Formula Codex
                                </h3>
                                <button onClick={() => setShowRecipeBook(false)} className="p-2 hover:bg-slate-800 rounded-full">
                                    <span className="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>

                            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">
                                Mix different ingredients inside the bubbling cauldron to unlock active biochemical formulas that upgrade child nutrition!
                            </p>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                                {discoveredList.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500 font-bold">
                                        No formulas discovered yet! Select 2 or 3 ingredients to start brewing. 🧪
                                    </div>
                                ) : (
                                    discoveredList.map((formula, idx) => (
                                        <div key={idx} className="bg-slate-850 border border-slate-750 p-4 rounded-2xl flex gap-3">
                                            <span className="text-3xl shrink-0">🥤</span>
                                            <div>
                                                <h4 className="font-black text-indigo-400 leading-none mb-1.5">{formula}</h4>
                                                <p className="text-xs font-bold text-slate-300 leading-normal">
                                                    {formula === "Energy Shake" && "A potassium-rich blend that fuels cellular energy reserves and keeps brain cells firing active!"}
                                                    {formula === "Immunity Juice" && "Packed with vitamin A, C, and fiber! Stimulates cellular immune defense and supports macrophage function."}
                                                    {formula === "Bone Armor Porridge" && "Massive calcium supply to aid osteoblast activity and density growth in developing bones."}
                                                    {formula === "Muscle Building Bowl" && "High concentration of complete amino acids promoting myofibrillar growth and structural support."}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NutritionLab;
