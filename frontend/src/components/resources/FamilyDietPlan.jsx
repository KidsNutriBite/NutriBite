"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FamilyDietPlan = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleDownload = () => {
        // Create a mock download for the PDF
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY31jBQsTAz1LBSKuey4DLgssxiAIBMA58gHQQplbmRzdHJlYW0KZW5kb2JqCgozIDAgb2JqCjM1CmVuZG9iagoKMSAwIG9iago8PC9QYWdlcyA0IDAgUi9UeXBlL0NhdGFsb2c+PgplbmRvYmoKCjUgMCBvYmoKPDwvQ3JlYXRvciAoTW9jayBQREYpL0NyZWF0aW9uRGF0ZSAoRDoyMDIzMTAwMTEyMDAwMFopL01vZERhdGUgKEQ6MjAyMzEwMDExMjAwMDBaKT4+CmVuZG9iagoKNCAwIG9iago8PC9LaWRzWzYgMCBSXS9Db3VudCAxL1R5cGUvUGFnZXM+PgplbmRvYmoKCjYgMCBvYmoKPDwvUGFyZW50IDQgMCBSL1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1LjI4IDg0MS44OV0vQ29udGVudHMgMiAwIFIvUmVzb3VyY2VzPDw+Pj4+CmVuZG9iagoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMTQ2IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDEwNCAwMDAwMCBuIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDAxOTQgMDAwMDAgbiAKMDAwMDAwMDMwNiAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNy9Sb290IDEgMCBSL0luZm8gNSAwIFI+PgpzdGFydHhyZWYKNTE3CiUlRU9GCg=='; // very basic valid dummy pdf
        link.download = 'Family_Weekly_Diet_Plan.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const weeklyPlan = [
        {
            day: "Monday",
            focus: "Iron & Energy Boost",
            rationale: "Combines Vitamin C with iron-rich greens to maximize absorption for iron deficiencies, while providing high-energy complex carbs for active siblings.",
            meals: {
                breakfast: "Ragi Dosa with Tomato-Coconut Chutney & Boiled Egg",
                lunch: "Palak Dal, Carrot Poriyal, Brown Rice, and Fresh Curd",
                snack: "Roasted Makhana & Sweet Lime (Vitamin C)",
                dinner: "Mixed Vegetable Khichdi with a dash of Ghee"
            }
        },
        {
            day: "Tuesday",
            focus: "Calcium & Bone Health",
            rationale: "Rich in dairy and sesame to build strong bones and teeth, essential for growing children across all age groups.",
            meals: {
                breakfast: "Oats Porridge cooked in Milk with Almonds and Dates",
                lunch: "Paneer Butter Masala (mild), Methi Roti, and Cucumber Raita",
                snack: "Til (Sesame) Chikki and a Banana",
                dinner: "Lauki (Bottle Gourd) Sabzi with Multigrain Phulka"
            }
        },
        {
            day: "Wednesday",
            focus: "Protein & Immunity",
            rationale: "Lentil-heavy meals provide building blocks for muscle growth, paired with immunity-boosting spices like turmeric and garlic.",
            meals: {
                breakfast: "Moong Dal Chilla stuffed with Grated Paneer & Carrots",
                lunch: "Rajma Masala, Jeera Rice, and a side of Kachumber Salad",
                snack: "Sprout Salad with Lemon Juice",
                dinner: "Vegetable Upma with lots of Peas and Cashews"
            }
        },
        {
            day: "Thursday",
            focus: "Gut Health & Digestion",
            rationale: "Probiotic-rich and high-fiber foods to ensure smooth digestion and nutrient absorption, preventing bloating or constipation.",
            meals: {
                breakfast: "Idli with Sambar and Mint Chutney",
                lunch: "Curd Rice with Pomegranate Seeds and Aloo Roast",
                snack: "Roasted Chana and Buttermilk (Chaas)",
                dinner: "Light Dal Tadka with Jowar Roti"
            }
        },
        {
            day: "Friday",
            focus: "Brain Development (Omega-3)",
            rationale: "Incorporates healthy fats and seeds crucial for cognitive function, memory, and concentration during school days.",
            meals: {
                breakfast: "Poha with Peanuts, Peas, and a side of Orange Juice",
                lunch: "Soya Chunks Curry, Spinach Roti, and Beetroot Salad",
                snack: "Walnuts, Almonds, and a glass of Milk",
                dinner: "Vegetable Pulao with Mint Raita"
            }
        },
        {
            day: "Saturday",
            focus: "Family Favorites (Balanced)",
            rationale: "A relaxed weekend menu that feels like a treat but maintains a hidden nutritional profile, keeping kids happy and healthy.",
            meals: {
                breakfast: "Whole Wheat Pancakes with Honey and Banana",
                lunch: "Chole Bhature (baked/air-fried bhature option) with Onion Salad",
                snack: "Fruit Chaat (Apple, Papaya, Guava)",
                dinner: "Besan Chilla with Green Chutney"
            }
        },
        {
            day: "Sunday",
            focus: "Reset & Hydration",
            rationale: "Hydrating, vitamin-dense meals to prepare the body for the upcoming week, ensuring a balanced intake of all micronutrients.",
            meals: {
                breakfast: "Vegetable Sandwich (Brown Bread) with Fresh Watermelon Juice",
                lunch: "Mixed Veg Curry, Dal Makhani, and Phulka",
                snack: "Yogurt Parfait with Berries or Seasonal Fruits",
                dinner: "Light Vegetable Soup and Moong Dal Khichdi"
            }
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="max-w-3xl">
                    <div className="flex gap-3 mb-4">
                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Family Oriented
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Holistic Nutrition
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                        Unified Family Diet Plan
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        A single, balanced meal plan designed to address the unique nutritional deficiencies of all your children simultaneously. Because practical parenting means one healthy family meal, not separate dishes.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Download PDF
                    </button>
                    <button 
                        onClick={toggleExpand}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            keyboard_arrow_down
                        </span>
                        {isExpanded ? 'Hide Plan' : 'View Plan'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-8"
                    >
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">This Week's Schedule</h3>
                            
                            <div className="space-y-6">
                                {weeklyPlan.map((dayPlan, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Day & Rationale Info */}
                                            <div className="lg:w-1/3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{dayPlan.day}</h4>
                                                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
                                                        {dayPlan.focus}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Why this works</span>
                                                    {dayPlan.rationale}
                                                </p>
                                            </div>

                                            {/* Meals Breakdown */}
                                            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-orange-500">light_mode</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Breakfast</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.breakfast}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-yellow-500">wb_sunny</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Lunch</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.lunch}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-green-500">eco</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Snack</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.snack}</p>
                                                </div>

                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-indigo-500">dark_mode</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Dinner</span>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{dayPlan.meals.dinner}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FamilyDietPlan;
