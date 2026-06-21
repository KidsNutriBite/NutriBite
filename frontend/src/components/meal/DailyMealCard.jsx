"use client";
import { motion } from 'framer-motion';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
};

const DailyMealCard = ({ date, log, onAdd, onEdit }) => {
    const mealTypes = [
        { id: 'breakfast', label: 'Breakfast', icon: 'wb_twilight', defaultTime: '08:00' },
        { id: 'morningSnack', label: 'Morning Snack', icon: 'coffee', defaultTime: '11:00' },
        { id: 'lunch', label: 'Lunch', icon: 'light_mode', defaultTime: '13:00' },
        { id: 'afternoonSnack', label: 'Afternoon Snack', icon: 'wb_sunny', defaultTime: '16:00' },
        { id: 'eveningSnack', label: 'Evening Snack', icon: 'partly_cloudy_day', defaultTime: '18:00' },
        { id: 'dinner', label: 'Dinner', icon: 'bedtime', defaultTime: '20:00' }
    ];

    const getItems = (type) => log ? log[type] || [] : [];
    const isLogged = (type) => getItems(type).length > 0;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">calendar_month</span>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mealTypes.map((meal) => {
                    const items = getItems(meal.id);
                    const filled = isLogged(meal.id);
                    const loggedTime = log?.mealTimes?.[meal.id] || meal.defaultTime;
                    const slotImage = log?.images?.[meal.id];
                    const slotMacros = log?.mealMacros?.[meal.id] || {};

                    // Calculate nutrients
                    const cals = slotMacros.calories !== undefined ? slotMacros.calories : items.reduce((a, b) => a + (b.calories || 0), 0);
                    const protein = slotMacros.protein !== undefined ? slotMacros.protein : items.reduce((a, b) => a + (b.protein || 0), 0);
                    const carbs = slotMacros.carbs !== undefined ? slotMacros.carbs : items.reduce((a, b) => a + (b.carbs || 0), 0);
                    const fat = slotMacros.fat !== undefined ? slotMacros.fat : (slotMacros.fats !== undefined ? slotMacros.fats : items.reduce((a, b) => a + (b.fats || b.fat || 0), 0));

                    return (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-3xl border overflow-hidden transition-all flex flex-col justify-between ${filled ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 shadow-md hover:shadow-lg' : 'bg-gray-50/50 dark:bg-slate-900/10 border-dashed border-gray-200 dark:border-slate-800 p-5'}`}
                        >
                            {/* Card Header */}
                            <div className={filled ? "p-5 pb-3 flex justify-between items-start" : "flex justify-between items-start mb-3"}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${filled ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-slate-800 text-gray-400'}`}>
                                        <span className="material-symbols-outlined">{meal.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className={`font-black text-sm uppercase tracking-wider ${filled ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{meal.label}</h4>
                                        <span className="text-xs text-gray-400 font-bold">{loggedTime}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onEdit(meal.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${filled ? 'bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-gray-400' : 'bg-indigo-600 text-white shadow-md hover:scale-110'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">{filled ? 'edit' : 'add'}</span>
                                </button>
                            </div>

                            {/* Card Content */}
                            {filled ? (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="px-5 pb-4 space-y-3">
                                        {/* Optional Image */}
                                        {slotImage && (
                                            <div className="w-full h-28 rounded-2xl overflow-hidden relative border border-gray-150 dark:border-slate-800">
                                                <img 
                                                    src={getImageUrl(slotImage)} 
                                                    alt={`${meal.label} plate`} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-widest">
                                                    AI Scanned
                                                </div>
                                            </div>
                                        )}

                                        {/* Food List */}
                                        <div className="space-y-1.5">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100/30 dark:border-slate-800">
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-black bg-white dark:bg-slate-850 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-800">{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card Footer: Macros banner */}
                                    <div className="bg-gray-50/50 dark:bg-slate-950/40 px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                                        <span className="text-gray-800 dark:text-white font-black">{Math.round(cals)} kcal</span>
                                        <div className="flex gap-2">
                                            <span>P: {Math.round(protein * 10) / 10}g</span>
                                            <span>•</span>
                                            <span>C: {Math.round(carbs * 10) / 10}g</span>
                                            <span>•</span>
                                            <span>F: {Math.round(fat * 10) / 10}g</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Not logged yet</p>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyMealCard;
