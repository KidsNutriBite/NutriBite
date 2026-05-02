"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; // Import axios directly for FormData if needed, or use api instance
import { logMeal } from '../../api/meal.api';
import { FOOD_DATABASE, QUICK_ADDS } from '../../data/foodDatabase'; // Import comprehensive DB
import { useProfile } from '../../context/ProfileContext';

const MealLogForm = ({ profileId, initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState(() => {
        const mType = initialData?.mealType || 'breakfast';
        const defaultTimes = {
            breakfast: '08:00',
            morningSnack: '11:00',
            lunch: '13:00',
            afternoonSnack: '16:00',
            dinner: '20:00',
            eveningSnack: '18:00'
        };
        return {
            mealType: mType,
            date: initialData?.date || new Date().toISOString().split('T')[0],
            time: defaultTimes[mType] || '08:00',
            notes: ''
        };
    });

    const [selectedFoods, setSelectedFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [applyToAll, setApplyToAll] = useState(false);
    
    // Get profiles for combined meal planning
    const { profiles } = useProfile();

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
        const match = food.qty.match(/^([\d.-]+)\s*(.*)$/);
        const amount = match ? parseFloat(match[1]) : 1;
        const unit = match ? match[2] : food.qty;

        setSelectedFoods([...selectedFoods, { 
            ...food, 
            id: Date.now(),
            amount: amount,
            unit: unit,
            baseAmount: amount
        }]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeFood = (id) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== id));
    };

    const updateAmount = (id, delta) => {
        setSelectedFoods(selectedFoods.map(f => {
            if (f.id === id) {
                const newAmount = Math.max(0, f.amount + delta);
                return { ...f, amount: newAmount };
            }
            return f;
        }));
    };

    // Calculate Totals
    const nutrients = useMemo(() => {
        return selectedFoods.reduce((acc, item) => {
            const factor = item.baseAmount ? (item.amount / item.baseAmount) : 1;
            return {
                calories: acc.calories + (item.cal * factor || 0),
                protein: acc.protein + (item.p * factor || 0),
                carbs: acc.carbs + (item.c * factor || 0),
                fat: acc.fat + (item.f * factor || 0),
                fiber: acc.fiber + (item.fib * factor || 0),
                water: acc.water + (item.w * factor || 0),
                vitamins: [...new Set([...acc.vitamins.split(', '), ...(item.vit?.split(', ') || [])])].filter(Boolean).join(', ')
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0, vitamins: '' });
    }, [selectedFoods]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (selectedFoods.length === 0) throw new Error("Please add at least one food item.");

            // Serialize
            const foodItemsPayload = selectedFoods.map(f => ({
                name: f.name,
                quantity: f.qty,
                calories: f.cal,
                protein: f.p,
                carbs: f.c,
                fats: f.f,
                fiber: f.fib || 0,
                water: f.w || 0,
                vitamins: f.vit || ''
            }));

            // Target profiles to log meal for
            const targetProfileIds = applyToAll && profiles?.length > 0 
                ? profiles.map(p => p._id) 
                : [profileId];

            // Log meal for each target profile
            for (const targetId of targetProfileIds) {
                const data = new FormData();
                data.append('profileId', targetId);
                data.append('date', formData.date);
                data.append('time', formData.time);
                data.append('mealType', formData.mealType);
                data.append('notes', formData.notes);
                data.append('foodItems', JSON.stringify(foodItemsPayload));
                data.append('nutrients', JSON.stringify(nutrients));

                if (photo) data.append('photo', photo);

                await logMeal(data);
            }

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
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                            { id: 'breakfast', label: 'Breakfast', icon: 'wb_twilight' },
                            { id: 'morningSnack', label: 'Morning Snack', icon: 'coffee' },
                            { id: 'lunch', label: 'Lunch', icon: 'light_mode' },
                            { id: 'afternoonSnack', label: 'Afternoon Snack', icon: 'wb_sunny' },
                            { id: 'eveningSnack', label: 'Evening Snack', icon: 'partly_cloudy_day' },
                            { id: 'dinner', label: 'Dinner', icon: 'bedtime' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                    const defaultTimes = { 
                                        breakfast: '08:00', 
                                        morningSnack: '11:00', 
                                        lunch: '13:00', 
                                        afternoonSnack: '16:00', 
                                        eveningSnack: '18:00', 
                                        dinner: '20:00' 
                                    };
                                    setFormData({ ...formData, mealType: type.id, time: defaultTimes[type.id] || formData.time });
                                }}
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
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-0.5">
                                            <button 
                                                type="button"
                                                onClick={() => updateAmount(item.id, - (item.unit === 'g' ? 10 : 1))}
                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white rounded transition"
                                            >
                                                <span className="material-symbols-outlined text-sm">remove</span>
                                            </button>
                                            <span className="text-xs font-black text-gray-700 min-w-[50px] text-center">
                                                {item.amount}{item.unit}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => updateAmount(item.id, (item.unit === 'g' ? 10 : 1))}
                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white rounded transition"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                                            {Math.round(item.cal * (item.amount / item.baseAmount))} kcal
                                        </span>
                                    </div>
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
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative min-h-[160px] overflow-hidden">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                        
                        {preview ? (
                            <div className="relative w-full h-full min-h-[140px]">
                                <img src={preview} alt="Meal Preview" className="w-full h-32 object-cover rounded-lg" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPhoto(null); setPreview(null); }}
                                        className="bg-red-500 text-white p-1.5 rounded-full shadow-lg z-30 hover:scale-110 transition"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2 text-xs font-bold text-green-600">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    Ready to upload: {photo.name}
                                </div>
                            </div>
                        ) : (
                            <div className="py-4">
                                <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">add_a_photo</span>
                                <p className="text-sm text-gray-500 font-bold">Tap to capture or upload meal</p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-tighter">JPG, PNG up to 5MB</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Portion Size Help */}
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-orange-600 text-sm">info</span>
                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Portion Size Help</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">100g Rice ≈ 1 cup</p>
                        <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">1 Glass Milk ≈ 250ml</p>
                        <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">1 Bowl Dal ≈ 150g</p>
                        <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">1 Fistful Veg ≈ 80g</p>
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

                {/* Combined Meal Planning Toggle (UI Only) */}
                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <input
                        type="checkbox"
                        id="applyToAll"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="applyToAll" className="text-sm font-bold text-blue-900 cursor-pointer">
                        Apply same meal plan to all children
                    </label>
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
                            { label: 'PROTEIN', val: nutrients.protein, max: 50, color: 'bg-blue-500', barBg: 'bg-blue-100', unit: 'g' },
                            { label: 'CARBS', val: nutrients.carbs, max: 100, color: 'bg-yellow-400', barBg: 'bg-yellow-100', unit: 'g' },
                            { label: 'FATS', val: nutrients.fat, max: 40, color: 'bg-green-500', barBg: 'bg-green-100', unit: 'g' },
                            { label: 'FIBER', val: Math.round(nutrients.fiber), max: 25, color: 'bg-orange-500', barBg: 'bg-orange-100', unit: 'g' },
                            { label: 'WATER', val: nutrients.water, max: 2000, color: 'bg-cyan-500', barBg: 'bg-cyan-100', unit: 'ml' },
                        ].map((metric) => (
                            <div key={metric.label}>
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                    <span>{metric.label}</span>
                                    <span>{metric.val}{metric.unit} <span className="text-gray-300">/ {metric.max}{metric.unit}</span></span>
                                </div>
                                <div className={`h-2 ${metric.barBg} rounded-full overflow-hidden`}>
                                    <div
                                        className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.min((metric.val / metric.max) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vitamins List */}
                    {nutrients.vitamins && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {nutrients.vitamins.split(', ').map((vit, idx) => (
                                <span key={idx} className="text-[9px] font-black bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded uppercase border border-purple-100">
                                    {vit}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Dynamic Meal Feedback */}
                    {(() => {
                        const feedbacks = [];
                        const hasVeg = selectedFoods.some(f => 
                            f.tag?.toLowerCase().includes('veg') || 
                            f.tag?.toLowerCase().includes('green') || 
                            f.tag?.toLowerCase().includes('vitamin') ||
                            ['spinach', 'palak', 'methi', 'bhindi', 'gobi', 'carrot', 'beans', 'peas', 'lauki', 'tinda'].some(v => f.name.toLowerCase().includes(v))
                        );
                        const hasProtein = selectedFoods.some(f => 
                            f.tag?.toLowerCase().includes('protein') || 
                            f.p > 8 ||
                            ['dal', 'paneer', 'egg', 'chicken', 'fish', 'mutton', 'soya', 'chole', 'rajma'].some(p => f.name.toLowerCase().includes(p))
                        );
                        const hasFruit = selectedFoods.some(f => 
                            f.tag?.toLowerCase().includes('fruit') || 
                            ['banana', 'apple', 'orange', 'mango', 'papaya', 'grapes', 'guava', 'melon'].some(fruit => f.name.toLowerCase().includes(fruit))
                        );
                        
                        if (selectedFoods.length > 0) {
                            if (!hasVeg && formData.mealType !== 'snack') {
                                feedbacks.push({
                                    title: "Veggie Suggestion",
                                    text: "Add vegetables like spinach or carrot to boost fiber and vitamins.",
                                    icon: "eco",
                                    color: "orange"
                                });
                            }
                            if (!hasProtein) {
                                feedbacks.push({
                                    title: "Protein Tip",
                                    text: "Add a protein source like Dal, Paneer, or Egg for better growth.",
                                    icon: "fitness_center",
                                    color: "blue"
                                });
                            }
                            if (formData.mealType === 'snack' && !hasFruit) {
                                feedbacks.push({
                                    title: "Snack Idea",
                                    text: "Fresh fruits like Banana or Apple are healthier snack choices!",
                                    icon: "nutrition",
                                    color: "green"
                                });
                            }
                        }

                        if (feedbacks.length === 0) {
                            return (
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                    <span className="material-symbols-outlined text-blue-600">verified</span>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 mb-1">Looks Good!</p>
                                        <p className="text-[11px] text-blue-700 leading-relaxed">This meal selection looks balanced and nutritious.</p>
                                    </div>
                                </div>
                            );
                        }

                        const topFeedback = feedbacks[0];
                        const colorClasses = {
                            orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'text-orange-600', title: 'text-orange-800', text: 'text-orange-700' },
                            blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', title: 'text-blue-800', text: 'text-blue-700' },
                            green: { bg: 'bg-green-50', border: 'border-green-100', icon: 'text-green-600', title: 'text-green-800', text: 'text-green-700' }
                        }[topFeedback.color];

                        return (
                            <div className={`mt-6 p-4 ${colorClasses.bg} rounded-xl border ${colorClasses.border} flex gap-3 transition-all animate-in fade-in slide-in-from-bottom-2`}>
                                <span className={`material-symbols-outlined ${colorClasses.icon}`}>{topFeedback.icon}</span>
                                <div>
                                    <p className={`text-xs font-bold ${colorClasses.title} mb-1`}>{topFeedback.title}</p>
                                    <p className={`text-[11px] ${colorClasses.text} leading-relaxed`}>{topFeedback.text}</p>
                                </div>
                            </div>
                        );
                    })()}
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
