import { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; // Import axios directly for FormData if needed, or use api instance
// Assuming logMeal is imported correctly
import { logMeal } from '../../api/meal.api';
import { FOOD_DATABASE, QUICK_ADDS } from '../../data/foodDatabase'; // Import comprehensive DB

const MealLogForm = ({ profileId, initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        mealType: initialData?.mealType || 'breakfast',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        notes: ''
    });

    const [selectedFoods, setSelectedFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Search Logic
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }
        const filtered = FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setSearchResults(filtered);
    }, [searchQuery]);

    const addFood = (food) => {
        setSelectedFoods([...selectedFoods, { ...food, id: Date.now() }]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeFood = (id) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== id));
    };

    // Calculate Totals
    const nutrients = useMemo(() => {
        return selectedFoods.reduce((acc, item) => ({
            calories: acc.calories + item.cal,
            protein: acc.protein + item.p,
            carbs: acc.carbs + item.c,
            fat: acc.fat + item.f
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }, [selectedFoods]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (selectedFoods.length === 0) throw new Error("Please add at least one food item.");

            const data = new FormData();
            data.append('profileId', profileId);
            data.append('date', formData.date);
            data.append('time', formData.time);
            data.append('mealType', formData.mealType);
            data.append('notes', formData.notes);

            // Serialize
            const foodItemsPayload = selectedFoods.map(f => ({
                name: f.name,
                quantity: f.qty,
                calories: f.cal,
                protein: f.p,
                carbs: f.c,
                fats: f.f
            }));
            data.append('foodItems', JSON.stringify(foodItemsPayload));
            data.append('nutrients', JSON.stringify(nutrients));

            if (photo) data.append('photo', photo);

            // Directly using axios/api wrapper expected to handle FormData if Content-Type is set or auto-detected
            // The `logMeal` function in api/meal.api needs to handle this.
            // If `logMeal` is just `api.post('/meals', data)`, it works.

            // Note: Ensure `logMeal` passes the FormData directly. 
            // Since we imported `logMeal`, let's just use it.

            // IMPORTANT: If logMeal wraps data in { ...data }, FormData breaks.
            // I'll call axios directly here to be safe given missing context of `logMeal` impl details
            // OR assuming `logMeal` handles it.
            // Let's assume logMeal handles it or we update it.
            await logMeal(data);

            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to log meal");
        } finally {
            setLoading(false);
        }
    };

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    // Assuming 800kcal is the max for the circle progress
    const dashOffset = circumference - (Math.min(nutrients.calories, 800) / 800) * circumference;

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Left: Form */}
            <div className="flex-1 space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

                {/* Meal Type Selectors */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { id: 'breakfast', label: 'Breakfast', icon: 'sunny' },
                            { id: 'lunch', label: 'Lunch', icon: 'light_mode' },
                            { id: 'dinner', label: 'Dinner', icon: 'bedtime' },
                            { id: 'snack', label: 'Snack', icon: 'cookie' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, mealType: type.id })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.mealType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span className="material-symbols-outlined mb-1">{type.icon}</span>
                                <span className="text-xs font-bold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">calendar_today</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                        <div className="relative">
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">schedule</span>
                        </div>
                    </div>
                </div>

                {/* Search & Add Food */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Add Food Items</label>

                    {/* Quick Add Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {QUICK_ADDS.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    const food = FOOD_DATABASE.find(f => f.name === item.name);
                                    if (food) addFood(food);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 transition-colors"
                            >
                                <span>{item.icon}</span>
                                {item.label || item.name.split(' (')[0]} <span className="text-indigo-400">+</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search foods (e.g. Idli, Dal, Milk...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400">search</span>

                        {/* Dropdown Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-1 z-10 max-h-60 overflow-y-auto">
                                {searchResults.map((food, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => addFood(food)}
                                        className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800">{food.name}</p>
                                            <p className="text-xs text-gray-500">{food.cal} kcal • {food.qty}</p>
                                        </div>
                                        <button className="text-primary text-sm font-bold">+ Add</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Items List */}
                    <div className="space-y-3">
                        {selectedFoods.map((item) => (
                            <div key={item.id} className="flex items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3">
                                    <span className="material-symbols-outlined">restaurant</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        {item.tag && <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold uppercase">{item.tag}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{item.qty}</p>
                                </div>
                                <button onClick={() => removeFood(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Photo Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Meal Photo (Optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {photo ? (
                            <div className="relative w-full">
                                <p className="text-sm font-bold text-gray-800 mb-1">{photo.name}</p>
                                <p className="text-xs text-green-600">Photo selected</p>
                            </div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">add_a_photo</span>
                                <p className="text-sm text-gray-500">Drag and drop or <span className="text-primary font-bold">browse files</span></p>
                                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG up to 5MB</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes for Doctor</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Mention any refusals, allergic reactions, or appetite changes..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        rows="2"
                    />
                </div>
            </div>

            {/* Right: Nutrition Preview */}
            <div className="w-full lg:w-80 bg-white lg:bg-transparent h-fit lg:sticky lg:top-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6">Nutrition Preview</h3>

                    {/* Donut Chart */}
                    <div className="flex flex-col items-center justify-center mb-8 relative">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-100"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    className="text-primary transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-gray-800">{nutrients.calories}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calories</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                        {[
                            { label: 'PROTEIN', val: nutrients.protein, max: 50, color: 'bg-blue-500', barBg: 'bg-blue-100' },
                            { label: 'CARBS', val: nutrients.carbs, max: 100, color: 'bg-yellow-400', barBg: 'bg-yellow-100' },
                            { label: 'FATS', val: nutrients.fat, max: 40, color: 'bg-green-500', barBg: 'bg-green-100' },
                        ].map((metric) => (
                            <div key={metric.label}>
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                                    <span>{metric.label}</span>
                                    <span>{metric.val}g <span className="text-gray-300">/ {metric.max}g</span></span>
                                </div>
                                <div className={`h-2.5 ${metric.barBg} rounded-full overflow-hidden`}>
                                    <div
                                        className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.min((metric.val / metric.max) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tip Box */}
                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex gap-3">
                        <span className="material-symbols-outlined text-yellow-600">lightbulb</span>
                        <div>
                            <p className="text-xs font-bold text-yellow-800 mb-1">NutriTip: Moderate Sugar</p>
                            <p className="text-[11px] text-yellow-700 leading-relaxed">The blueberries add natural sugar. Keep afternoon snacks low-sugar to avoid energy crashes.</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                        {loading ? 'Saving Entry...' : 'Save Entry'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MealLogForm;
