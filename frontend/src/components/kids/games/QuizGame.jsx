"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { completeQuizGame } from '../../../api/game.api';

const QuizGame = ({ profile, onBack, onUpdateXP }) => {
    const questions = [
        {
            id: 1,
            question: "Which of these superhero foods builds strong muscle blocks? 🧱",
            options: [
                { text: "Dal Soup (Lentils) 🥣", isCorrect: true, feedback: "Excellent! Dal is loaded with protein, which serves as amino acid blocks to build and repair muscles! 💪" },
                { text: "Candy Bars 🍭", isCorrect: false, feedback: "Oh no! Candy gives only temporary sugar rush but doesn't build any structural muscles." },
                { text: "Potato Chips 🥔", isCorrect: false, feedback: "Not quite! Chips are starches, not high-quality protein muscle bricks." }
            ],
            category: "proteins"
        },
        {
            id: 2,
            question: "Why does our body need clean water? 💧",
            options: [
                { text: "It carries nutrients and keeps cells hydrated 🧬", isCorrect: true, feedback: "Spot on! Hydration wave carries vital minerals through blood circulation to all your cells! 💧" },
                { text: "To make us swim faster 🏊", isCorrect: false, feedback: "That's fun, but the primary biological reason is cellular hydration and nutrient transport!" },
                { text: "To wash off bad bugs from outside only 🧼", isCorrect: false, feedback: "Water cleans outside, but drinking it fuels your internal cellular engine!" }
            ],
            category: "hydration"
        },
        {
            id: 3,
            question: "Spinach is rich in Vitamin A and Iron. What is Iron's superpower? 🦸",
            options: [
                { text: "Carries oxygen in your blood cells 🩸", isCorrect: true, feedback: "Superb! Iron helps synthesize hemoglobin to transport fresh oxygen through erythrocytes! 🩸" },
                { text: "Makes you see in the pitch dark 👁️", isCorrect: false, feedback: "That is Vitamin A's precursor, beta-carotene! Iron focuses on blood and oxygen." },
                { text: "Builds a heavy calcium shield for bones 🛡️", isCorrect: false, feedback: "Calcium handles bone shield! Iron is for oxygen and blood energy." }
            ],
            category: "vitamins"
        },
        {
            id: 4,
            question: "What happens in your stomach during digestion? ⚙️",
            options: [
                { text: "Foods are broken down into tiny energy particles 🥕", isCorrect: true, feedback: "Brilliant! Your stomach and gut digest food so your cells can extract vitamins and glucose! ⚙️" },
                { text: "It stores food forever like a drawer 🗄️", isCorrect: false, feedback: "Haha, no! Food moves through the digestive tract to fuel your body and clear out waste." },
                { text: "It turns foods into heavy iron metal ⚙️", isCorrect: false, feedback: "Not quite! It breaks foods down chemically, not into raw iron blocks!" }
            ],
            category: "digestion"
        },
        {
            id: 5,
            question: "Which mineral builds a thick protective shield for your bones and teeth? 🦴",
            options: [
                { text: "Calcium (found in Milk!) 🥛", isCorrect: true, feedback: "Perfect! Calcium aids osteoblast activity to form strong, mineralized skeletal armor! 🥛" },
                { text: "Sugar blocks 🍭", isCorrect: false, feedback: "Sugar actually damages teeth enamel and doesn't build any bone shields!" },
                { text: "Olive Oil 🫒", isCorrect: false, feedback: "Olive oil has healthy fats, but calcium is the ultimate bone shield building block!" }
            ],
            category: "minerals"
        }
    ];

    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState(null);
    const [score, setScore] = useState(0);
    const [battleLogs, setBattleLogs] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [gainedXP, setGainedXP] = useState(null);
    const [leveledUp, setLeveledUp] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    const q = questions[currentIdx];

    const handleAnswerSelect = (option, idx) => {
        if (selectedOpt !== null) return; // Answered already
        setSelectedOpt(idx);
        
        if (option.isCorrect) {
            setScore(prev => prev + 1);
            setBattleLogs(prev => [`🎉 Correct! ${option.feedback}`, ...prev]);
        } else {
            setBattleLogs(prev => [`❌ Incorrect. ${option.feedback}`, ...prev]);
        }
    };

    const handleNext = async () => {
        setSelectedOpt(null);
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            // End of quiz - call backend
            setIsLoading(true);
            try {
                const res = await completeQuizGame(profile._id, { score });
                const data = res.data || res;
                setQuizResult(data);
                setGainedXP(data.gainedXP);
                setLeveledUp(data.leveledUp);
                if (onUpdateXP && data.gainedXP > 0) {
                    onUpdateXP(data.gainedXP);
                }
                setIsFinished(true);
            } catch (err) {
                console.error("Failed to complete quiz", err);
                setIsFinished(true); // Fallback
            } finally {
                setIsLoading(false);
            }
        }
    };

    const resetGame = () => {
        setCurrentIdx(0);
        setSelectedOpt(null);
        setScore(0);
        setBattleLogs([]);
        setIsFinished(false);
        setGainedXP(null);
        setLeveledUp(false);
        setQuizResult(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto custom-scrollbar p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold">
                    <span className="material-symbols-outlined">arrow_back</span> Dashboard
                </button>
                <div className="bg-purple-100 text-purple-600 px-4 py-2 rounded-full font-black text-sm uppercase tracking-wide">
                    🧠 Nutrition Science Quiz Game
                </div>
            </div>

            <div className="max-w-[800px] mx-auto w-full flex-1 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                    {!isFinished ? (
                        <motion.div 
                            key={q.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-md border border-slate-150 w-full relative overflow-hidden"
                        >
                            {/* Question Progress Header */}
                            <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                <span>Question {currentIdx + 1} of {questions.length}</span>
                                <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full">Topic: {q.category}</span>
                            </div>

                            {/* Question text */}
                            <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-tight">
                                {q.question}
                            </h3>

                            {/* Options stack */}
                            <div className="space-y-4 mb-8">
                                {q.options.map((option, idx) => {
                                    const isAnswered = selectedOpt !== null;
                                    const isChosen = selectedOpt === idx;
                                    const showCorrect = isAnswered && option.isCorrect;
                                    const showWrong = isAnswered && isChosen && !option.isCorrect;

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleAnswerSelect(option, idx)}
                                            disabled={isAnswered}
                                            whileHover={!isAnswered ? { y: -2 } : {}}
                                            whileActive={!isAnswered ? { scale: 0.98 } : {}}
                                            className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between font-bold ${
                                                showCorrect 
                                                    ? "border-green-400 bg-green-50 text-green-700 shadow-sm"
                                                    : showWrong 
                                                        ? "border-red-400 bg-red-50 text-red-700 shadow-sm"
                                                        : isAnswered 
                                                            ? "border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed"
                                                            : "border-slate-200 bg-white hover:border-purple-400 hover:shadow-sm"
                                            }`}
                                        >
                                            <span className="text-sm md:text-base leading-normal flex-1 pr-4">{option.text}</span>
                                            {isAnswered && (
                                                <span className="material-symbols-outlined text-lg shrink-0">
                                                    {option.isCorrect ? "check_circle" : isChosen ? "cancel" : ""}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Feedback Block */}
                            {selectedOpt !== null && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-2xl border mb-8 font-semibold text-sm leading-relaxed ${
                                        q.options[selectedOpt].isCorrect 
                                            ? "bg-green-50 text-green-700 border-green-200" 
                                            : "bg-red-50 text-red-700 border-red-200"
                                    }`}
                                >
                                    <p className="font-black text-[10px] uppercase mb-1 tracking-wider text-slate-400">Buddy explanation:</p>
                                    {q.options[selectedOpt].feedback}
                                </motion.div>
                            )}

                            {/* Next Button */}
                            {selectedOpt !== null && (
                                <button
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-2xl shadow-lg transition-all uppercase tracking-wider text-sm active:scale-95"
                                >
                                    {currentIdx === questions.length - 1 ? "FINISH CHALLENGE 🏆" : "NEXT QUESTION ➡️"}
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-md border border-slate-150 w-full text-center relative overflow-hidden max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <span className="text-7xl mb-4 animate-bounce block select-none">🎓🏆</span>
                            <h3 className="text-3xl font-black text-slate-800 mb-2">Quiz Completed!</h3>
                            <p className="font-bold text-slate-500 mb-6 text-base">
                                Outstanding! You answered <strong className="text-purple-600 font-black">{score} / {questions.length}</strong> questions correctly!
                            </p>

                            <div className="flex gap-4 justify-center mb-6">
                                <div className="bg-yellow-400/20 text-yellow-600 border border-yellow-350 px-4 py-2 rounded-xl text-xs font-black">
                                    ⭐ +{gainedXP || 15} XP
                                </div>
                                <div className="bg-purple-100 text-purple-600 border border-purple-250 px-4 py-2 rounded-xl text-xs font-black">
                                    🧠 Curiosity +10
                                </div>
                            </div>

                            {/* Explainable AI Science Layer */}
                            {quizResult && quizResult.why_it_worked && (
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-3.5 w-full mb-6">
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
                                        <span className="material-symbols-outlined text-sm">science</span> 🔬 Biological Science Lab
                                    </h4>
                                    
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mascot Explanation</p>
                                        <p className="font-black text-slate-800 text-xs leading-normal">{quizResult.why_it_worked}</p>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cellular Pathway & Metabolism</p>
                                        <p className="font-bold text-slate-600 text-[11px] leading-relaxed">{quizResult.scientific_reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Key Nutrients</p>
                                            <div className="flex flex-wrap gap-1">
                                                {quizResult.key_nutrients?.map((n, i) => (
                                                    <span key={i} className="bg-purple-50 text-purple-600 border border-purple-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Systems Supported</p>
                                            <div className="flex flex-wrap gap-1">
                                                {quizResult.body_systems_supported?.map((s, i) => (
                                                    <span key={i} className="bg-emerald-50 text-emerald-600 border border-emerald-150 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-150">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Real-World Health Connection</p>
                                        <p className="font-semibold text-slate-700 text-[11px] leading-relaxed">{quizResult.real_world_health_benefit}</p>
                                    </div>

                                    <div className="bg-yellow-50 text-yellow-800 border border-yellow-250 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-yellow-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                            💡 Did you know?
                                        </p>
                                        <p className="font-semibold text-[11px] leading-relaxed">{quizResult.fun_fact}</p>
                                    </div>
                                </div>
                            )}

                            {leveledUp && (
                                <div className="bg-yellow-400 text-slate-900 font-black px-6 py-2 rounded-full uppercase text-xs mb-6 tracking-wide animate-bounce">
                                    🎉 Level Up!
                                </div>
                            )}

                            <button 
                                onClick={resetGame}
                                className="py-4 px-8 bg-purple-500 text-white font-black rounded-2xl shadow-lg hover:bg-purple-600 transition-all w-full mb-3"
                            >
                                PLAY AGAIN 🧠
                            </button>
                            <button 
                                onClick={onBack}
                                className="py-3 px-8 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all w-full"
                            >
                                BACK TO DASHBOARD 🏕️
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizGame;
