import { motion } from 'framer-motion';

const DailyMealCard = ({ date, log, onAdd, onEdit }) => {
    const mealTypes = [
        { id: 'breakfast', label: 'Breakfast', icon: 'sunny', time: '8:00 AM' },
        { id: 'lunch', label: 'Lunch', icon: 'light_mode', time: '1:00 PM' },
        { id: 'snacks', label: 'Snacks', icon: 'cookie', time: '4:00 PM' },
        { id: 'dinner', label: 'Dinner', icon: 'bedtime', time: '8:00 PM' }
    ];

    const getItems = (type) => log ? log[type] || [] : [];
    const isLogged = (type) => getItems(type).length > 0;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">calendar_month</span>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealTypes.map((meal) => {
                    const items = getItems(meal.id);
                    const filled = isLogged(meal.id);

                    return (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-5 rounded-2xl border transition-all ${filled ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-50 border-dashed border-gray-200'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filled ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                                        <span className="material-symbols-outlined">{meal.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${filled ? 'text-gray-800' : 'text-gray-500'}`}>{meal.label}</h4>
                                        <span className="text-xs text-gray-400 font-medium">{meal.time}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onAdd(meal.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${filled ? 'hover:bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-110'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">{filled ? 'edit' : 'add'}</span>
                                </button>
                            </div>

                            {filled ? (
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2.5 rounded-lg">
                                            <span className="font-medium text-gray-700">{item.name}</span>
                                            <span className="text-xs text-gray-500 font-bold bg-white px-2 py-1 rounded border border-gray-100">{item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 mt-2 border-t border-gray-100 flex gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        <span>{items.reduce((a, b) => a + (b.calories || 0), 0)} kcal</span>
                                        <span>•</span>
                                        <span>{items.reduce((a, b) => a + (b.protein || 0), 0)}g Protein</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-gray-400 font-medium">Not logged yet</p>
                                    {/* Missed Meal Warning Logic could go here if past time */}
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
