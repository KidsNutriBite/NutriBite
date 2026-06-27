"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { logMeal, analyzeMealImage } from '../../api/meal.api';
import { FOOD_DATABASE, QUICK_ADDS } from '../../data/foodDatabase';
import { useProfile } from '../../context/ProfileContext';

const MEAL_TYPE_TAGS = {
    breakfast: [
        { label: 'Idli', dbName: 'Idli', icon: '🥯' },
        { label: 'Plain Dosa', dbName: 'Plain Dosa', icon: '🥞' },
        { label: 'Poha', dbName: 'Poha', icon: '🌾' },
        { label: 'Rava Upma', dbName: 'Rava Upma', icon: '🥣' },
        { label: 'Aloo Paratha', dbName: 'Aloo Paratha', icon: '🫓' },
        { label: 'Boiled Egg', dbName: 'Boiled Egg', icon: '🥚' },
        { label: 'Milk', dbName: 'Milk', icon: '🥛' },
        { label: 'Fruit Bowl', dbName: 'Fruit Bowl', icon: '🍎' }
    ],
    morningSnack: [
        { label: 'Milk', dbName: 'Milk', icon: '🥛' },
        { label: 'Banana', dbName: 'Banana', icon: '🍌' },
        { label: 'Apple', dbName: 'Apple', icon: '🍎' },
        { label: 'Almonds', dbName: 'Almonds', icon: '🥜' },
        { label: 'Biscuits', dbName: 'Biscuits', icon: '🍪' },
        { label: 'Yogurt', dbName: 'Yogurt', icon: '🥣' }
    ],
    lunch: [
        { label: 'White Rice', dbName: 'White Rice', icon: '🍚' },
        { label: 'Chapati', dbName: 'Chapati', icon: '🫓' },
        { label: 'Toor Dal', dbName: 'Toor Dal', icon: '🍲' },
        { label: 'Sambar', dbName: 'Sambar', icon: '🍲' },
        { label: 'Aloo Sabzi', dbName: 'Aloo Sabzi', icon: '🥔' },
        { label: 'Paneer Curry', dbName: 'Paneer Curry', icon: '🧀' },
        { label: 'Chicken Curry', dbName: 'Chicken Curry', icon: '🍗' },
        { label: 'Curd', dbName: 'Curd', icon: '🥣' }
    ],
    afternoonSnack: [
        { label: 'Banana', dbName: 'Banana', icon: '🍌' },
        { label: 'Roasted Chana', dbName: 'Roasted Chana', icon: '🥜' },
        { label: 'Sandwich', dbName: 'Sandwich', icon: '🥪' },
        { label: 'Peanut Chikki', dbName: 'Peanut Chikki', icon: '🍫' },
        { label: 'Dhokla', dbName: 'Dhokla', icon: '🧆' },
        { label: 'Buttermilk', dbName: 'Buttermilk', icon: '🥛' }
    ],
    eveningSnack: [
        { label: 'Milk', dbName: 'Milk', icon: '🥛' },
        { label: 'Fruit Bowl', dbName: 'Fruit Bowl', icon: '🍎' },
        { label: 'Makhana', dbName: 'Roasted Makhana', icon: '🍿' },
        { label: 'Cashews', dbName: 'Cashews', icon: '🥜' },
        { label: 'Sandwich', dbName: 'Sandwich', icon: '🥪' }
    ],
    dinner: [
        { label: 'Chapati', dbName: 'Chapati', icon: '🫓' },
        { label: 'Roti', dbName: 'Roti', icon: '🫓' },
        { label: 'Toor Dal', dbName: 'Toor Dal', icon: '🍲' },
        { label: 'Vegetable Khichdi', dbName: 'Vegetable Khichdi', icon: '🍲' },
        { label: 'Curd Rice', dbName: 'Curd Rice', icon: '🍚' },
        { label: 'Paneer Sabzi', dbName: 'Paneer Sabzi', icon: '🧀' },
        { label: 'Vegetable Soup', dbName: 'Vegetable Soup', icon: '🍜' },
        { label: 'Mixed Vegetable Curry', dbName: 'Mixed Vegetable Curry', icon: '🥦' }
    ]
};

const MealLogForm = ({ profileId, initialData, onSuccess, onCancel }) => {
    const [tab, setTab] = useState('manual'); // 'manual' or 'ai'
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
    
    // AI specific states
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isAiReview, setIsAiReview] = useState(false);
    const [aiFoods, setAiFoods] = useState([]);
    const [originalAnalysisResult, setOriginalAnalysisResult] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [applyToAll, setApplyToAll] = useState(false);
    
    const searchInputRef = useRef(null);
    const { profiles } = useProfile();

    // Search Logic for manual search
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
            id: Date.now() + Math.random(),
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

    // Manual Entry Tag Toggling
    const handleTagToggle = (tag) => {
        const isSelected = selectedFoods.some(f => f.name === tag.dbName);
        if (isSelected) {
            setSelectedFoods(selectedFoods.filter(f => f.name !== tag.dbName));
        } else {
            const food = FOOD_DATABASE.find(f => f.name === tag.dbName);
            if (food) {
                const match = food.qty.match(/^([\d.-]+)\s*(.*)$/);
                const amount = match ? parseFloat(match[1]) : 1;
                const unit = match ? match[2] : food.qty;
                setSelectedFoods([...selectedFoods, { 
                    ...food, 
                    id: Date.now() + Math.random(),
                    amount: amount,
                    unit: unit,
                    baseAmount: amount
                }]);
            }
        }
    };

    // AI Food review state actions
    const handleAiFoodChange = (idx, field, value) => {
        const updated = [...aiFoods];
        const food = updated[idx];
        if (!food) return;

        let baseField = '';
        if (field === 'calories') baseField = 'baseCalories';
        else if (field === 'protein') baseField = 'baseProtein';
        else if (field === 'carbs') baseField = 'baseCarbs';
        else if (field === 'fats') baseField = 'baseFats';
        else if (field === 'fiber') baseField = 'baseFiber';
        else if (field === 'iron') baseField = 'baseIron';
        else if (field === 'calcium') baseField = 'baseCalcium';
        else if (field === 'vitaminC') baseField = 'baseVitaminC';
        else if (field === 'water') baseField = 'baseWater';

        if (baseField) {
            const amount = food.amount || 1;
            updated[idx] = {
                ...food,
                [field]: value,
                [baseField]: value / amount
            };
        } else {
            updated[idx] = {
                ...food,
                [field]: value
            };
        }
        setAiFoods(updated);
    };

    const updateAiFoodAmount = (idx, delta) => {
        const updated = [...aiFoods];
        const food = updated[idx];
        if (!food) return;

        // amount validation: not less than 0
        const newAmount = Math.max(0, food.amount + delta);
        const factor = food.baseAmount > 0 ? (newAmount / food.baseAmount) : 1;

        // Update proportional values based on new quantity
        updated[idx] = {
            ...food,
            amount: newAmount,
            quantity: `${newAmount} ${food.unit}`.trim(),
            calories: Math.round(food.baseCalories * factor * 10) / 10,
            protein: Math.round(food.baseProtein * factor * 100) / 100,
            carbs: Math.round(food.baseCarbs * factor * 100) / 100,
            fats: Math.round(food.baseFats * factor * 100) / 100,
            fiber: Math.round(food.baseFiber * factor * 100) / 100,
            iron: Math.round(food.baseIron * factor * 100) / 100,
            calcium: Math.round(food.baseCalcium * factor),
            vitaminC: Math.round(food.baseVitaminC * factor * 100) / 100,
            water: Math.round(food.baseWater * factor * 100) / 100
        };
        setAiFoods(updated);
    };

    const handleRemoveAiFood = (idx) => {
        setAiFoods(aiFoods.filter((_, i) => i !== idx));
    };

    const handleAddBlankAiFood = () => {
        setAiFoods([...aiFoods, {
            id: Date.now() + Math.random(),
            name: 'New Food Item',
            quantity: '1 serving',
            amount: 1,
            unit: 'serving',
            baseAmount: 1,
            baseCalories: 0,
            baseProtein: 0,
            baseCarbs: 0,
            baseFats: 0,
            baseFiber: 0,
            baseIron: 0,
            baseCalcium: 0,
            baseVitaminC: 0,
            baseWater: 0,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
            iron: 0,
            calcium: 0,
            vitaminC: 0,
            confidence: 1.0,
            water: 0,
            vitamins: ''
        }]);
    };

    // Calculate Totals dynamically
    const nutrients = useMemo(() => {
        if (tab === 'ai' && isAiReview) {
            // Calculate totals from AI review screen items
            return aiFoods.reduce((acc, item) => {
                return {
                    calories: acc.calories + (Number(item.calories) || 0),
                    protein: acc.protein + (Number(item.protein) || 0),
                    carbs: acc.carbs + (Number(item.carbs) || 0),
                    fat: acc.fat + (Number(item.fats || item.fat) || 0),
                    fiber: acc.fiber + (Number(item.fiber) || 0),
                    water: acc.water + (Number(item.water) || 0),
                    vitamins: [...new Set([...acc.vitamins.split(', '), ...(item.vitamins?.split(', ') || [])])].filter(Boolean).join(', ')
                };
            }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0, vitamins: '' });
        } else {
            // Calculate from manual selectedFoods
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
        }
    }, [selectedFoods, aiFoods, isAiReview, tab]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
            setIsAiReview(false);
            setAiFoods([]);
        }
    };

    // AI Plate analysis request handler
    const handleAiAnalysis = async () => {
        if (!photo) {
            setError("Please upload a photo of the child's food plate first.");
            return;
        }

        // Log image upload parameters (Task 3)
        console.log(`[Frontend] Image Name: ${photo.name}`);
        console.log(`[Frontend] Image Size: ${photo.size} bytes`);
        console.log("[Frontend] Inference Started");

        setAiLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('image', photo);

            const res = await analyzeMealImage(fd);
            if (res && res.success && res.data) {
                console.log("[Frontend] Inference Completed");
                console.log("[Frontend] Prediction Returned:", JSON.stringify(res.data));

                const analysis = res.data;
                setOriginalAnalysisResult(analysis);
                
                const mappedFoods = (analysis.foods || []).map((food, idx) => {
                    const qtyStr = food.quantity || '1 serving';
                    const match = qtyStr.match(/^([\d.-]+)\s*(.*)$/);
                    const amount = match ? parseFloat(match[1]) : 1;
                    const unit = match ? match[2] : qtyStr;
                    
                    const caloriesVal = food.calories !== undefined ? Number(food.calories) : 0;
                    const proteinVal = food.protein !== undefined ? Number(food.protein) : 0;
                    const carbsVal = food.carbs !== undefined ? Number(food.carbs) : 0;
                    const fatsVal = food.fats !== undefined ? Number(food.fats) : (food.fat !== undefined ? Number(food.fat) : 0);
                    const fiberVal = food.fiber !== undefined ? Number(food.fiber) : 0;
                    const ironVal = food.iron !== undefined ? Number(food.iron) : 0;
                    const calciumVal = food.calcium !== undefined ? Number(food.calcium) : 0;
                    const vitaminCVal = food.vitaminC !== undefined ? Number(food.vitaminC) : 0;
                    const waterVal = food.water || 0;

                    return {
                        id: Date.now() + idx + Math.random(),
                        name: food.name || '',
                        quantity: qtyStr,
                        amount: amount,
                        unit: unit,
                        baseAmount: amount > 0 ? amount : 1,
                        
                        baseCalories: caloriesVal,
                        baseProtein: proteinVal,
                        baseCarbs: carbsVal,
                        baseFats: fatsVal,
                        baseFiber: fiberVal,
                        baseIron: ironVal,
                        baseCalcium: calciumVal,
                        baseVitaminC: vitaminCVal,
                        baseWater: waterVal,

                        calories: caloriesVal,
                        protein: proteinVal,
                        carbs: carbsVal,
                        fats: fatsVal,
                        fiber: fiberVal,
                        iron: ironVal,
                        calcium: calciumVal,
                        vitaminC: vitaminCVal,
                        confidence: food.confidence !== undefined ? Number(food.confidence) : 1.0,
                        water: waterVal,
                        vitamins: food.vitamins || ''
                    };
                });
                setAiFoods(mappedFoods);
                setIsAiReview(true);
            } else {
                throw new Error("Invalid response schema from AI service");
            }
        } catch (err) {
            console.error("AI Meal detection failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to analyze image with Ateeqq/food-analysis model.");
        } finally {
            setAiLoading(false);
        }
    };

    // Save/Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let foodItemsPayload = [];
            
            if (tab === 'ai') {
                if (aiFoods.length === 0) {
                    throw new Error("No foods detected or added. Please add at least one food item.");
                }
                foodItemsPayload = aiFoods.map(f => ({
                    name: f.name,
                    quantity: f.quantity,
                    calories: Number(f.calories) || 0,
                    protein: Number(f.protein) || 0,
                    carbs: Number(f.carbs) || 0,
                    fats: Number(f.fats || f.fat) || 0,
                    fiber: Number(f.fiber) || 0,
                    iron: Number(f.iron) || 0,
                    calcium: Number(f.calcium) || 0,
                    vitaminC: Number(f.vitaminC) || 0,
                    water: Number(f.water) || 0,
                    vitamins: f.vitamins || ''
                }));
            } else {
                if (selectedFoods.length === 0) {
                    throw new Error("Please add at least one food item.");
                }
                foodItemsPayload = selectedFoods.map(f => ({
                    name: f.name,
                    quantity: `${f.amount}${f.unit}`,
                    calories: f.cal,
                    protein: f.p,
                    carbs: f.c,
                    fats: f.f,
                    fiber: f.fib || 0,
                    water: f.w || 0,
                    vitamins: f.vit || ''
                }));
            }

            // Target profiles to log meal for
            let targetProfileIds = [profileId];
            
            if (applyToAll) {
                try {
                    const { default: api } = await import('../../api/axios');
                    const res = await api.get('/profiles');
                    const fetchedProfiles = Array.isArray(res.data) ? res.data : res.data?.data || [];
                    if (fetchedProfiles.length > 0) {
                        targetProfileIds = fetchedProfiles.map(p => p._id?.toString() || p.id?.toString());
                    } else if (profiles?.length > 0) {
                        targetProfileIds = profiles.map(p => p._id?.toString() || p.id?.toString());
                    }
                } catch (err) {
                    console.error("Failed to fetch profiles for applyToAll", err);
                    if (profiles?.length > 0) {
                        targetProfileIds = profiles.map(p => p._id?.toString() || p.id?.toString());
                    }
                }
            }

            console.log("Saving meals for profiles:", targetProfileIds);

            // Log meal for each target profile concurrently
            await Promise.all(targetProfileIds.map(async (targetId) => {
                const data = new FormData();
                data.append('profileId', targetId);
                data.append('date', formData.date);
                data.append('time', formData.time);
                data.append('mealType', formData.mealType);
                data.append('notes', formData.notes);
                data.append('foodItems', JSON.stringify(foodItemsPayload));
                data.append('nutrients', JSON.stringify(nutrients));

                if (photo) {
                    data.append('photo', photo);
                }
                if (originalAnalysisResult) {
                    data.append('analysisResult', JSON.stringify(originalAnalysisResult));
                }

                await logMeal(data);
            }));

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
            {/* Left Column: Form Fields */}
            <div className="flex-1 space-y-6">
                {error && (
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                {/* Option Tabs switcher */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-gray-200/50">
                    <button
                        type="button"
                        onClick={() => {
                            setTab('manual');
                            setError('');
                        }}
                        className={`flex-1 py-3.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'manual' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        Option 1: Manual entry
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTab('ai');
                            setError('');
                        }}
                        className={`flex-1 py-3.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'ai' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                    >
                        <span className="material-symbols-outlined text-lg">psychology</span>
                        Option 2: AI plate detection
                    </button>
                </div>

                {/* Meal Type Selectors */}
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Meal Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {[
                            { id: 'breakfast', label: 'Breakfast', icon: 'wb_twilight' },
                            { id: 'morningSnack', label: 'Morning', icon: 'coffee' },
                            { id: 'lunch', label: 'Lunch', icon: 'light_mode' },
                            { id: 'afternoonSnack', label: 'Afternoon', icon: 'wb_sunny' },
                            { id: 'eveningSnack', label: 'Evening', icon: 'partly_cloudy_day' },
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
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${formData.mealType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span className="material-symbols-outlined mb-1 text-xl">{type.icon}</span>
                                <span className="text-xs font-bold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl px-4 py-3 pl-11 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">calendar_today</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Time</label>
                        <div className="relative">
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl px-4 py-3 pl-11 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">schedule</span>
                        </div>
                    </div>
                </div>

                {/* Tab Content 1: Manual Food Entry */}
                {tab === 'manual' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Food Tags (Multi-select)</label>
                            
                            {/* Option 1 Food Tags Chips */}
                            <div className="flex flex-wrap gap-2 p-4 bg-gray-50/50 dark:bg-slate-800/10 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                {(MEAL_TYPE_TAGS[formData.mealType] || MEAL_TYPE_TAGS.breakfast).map((tag, idx) => {
                                    const isSelected = selectedFoods.some(f => f.name === tag.dbName);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleTagToggle(tag)}
                                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                                                isSelected 
                                                    ? 'bg-primary border-primary text-white shadow-md shadow-blue-100 dark:shadow-none scale-105' 
                                                     : 'bg-white dark:bg-slate-900 hover:bg-gray-100 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <span>{tag.icon}</span>
                                            {tag.label}
                                            {isSelected && <span className="material-symbols-outlined text-sm">check</span>}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (searchInputRef.current) {
                                            searchInputRef.current.focus();
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-dashed border-2 border-dashed border-gray-300 dark:border-slate-700 hover:bg-gray-100 text-gray-500 rounded-full text-xs font-bold transition-all"
                                >
                                    <span>🔍</span> Other...
                                </button>
                            </div>
                        </div>

                        {/* Search field database */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search Food Database</label>
                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search food database (e.g. Idli, Dal, Rice, Salad...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl px-4 py-3 pl-11 focus:ring-2 focus:ring-primary/20 outline-none text-sm shadow-sm"
                                />
                                <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">search</span>

                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl mt-1.5 z-20 max-h-60 overflow-y-auto">
                                        {searchResults.map((food, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => addFood(food)}
                                                className="p-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-gray-50 dark:border-slate-800 last:border-0"
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{food.name}</p>
                                                    <p className="text-xs text-gray-500">{food.cal} kcal • {food.qty} {food.tag && `[${food.tag}]`}</p>
                                                </div>
                                                <button className="text-primary text-xs font-black bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all">+ Add</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Food List */}
                        {selectedFoods.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Logged Foods</label>
                                <div className="space-y-2">
                                    {selectedFoods.map((item) => {
                                        const factor = item.baseAmount ? (item.amount / item.baseAmount) : 1;
                                        return (
                                            <div key={item.id} className="flex items-center p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm group">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center mr-3 font-bold">
                                                    🍳
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">{item.name}</p>
                                                        {item.tag && <span className="text-[9px] px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-full font-bold uppercase">{item.tag}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700 rounded-lg p-0.5">
                                                            <button 
                                                                type="button"
                                                                onClick={() => updateAmount(item.id, - (item.unit === 'g' ? 10 : 1))}
                                                                className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded transition text-xs font-bold"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
                                                                {item.amount}{item.unit}
                                                            </span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => updateAmount(item.id, (item.unit === 'g' ? 10 : 1))}
                                                                className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded transition text-xs font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                            {Math.round(item.cal * factor)} kcal
                                                        </span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeFood(item.id)} className="text-gray-300 hover:text-red-500 p-2 transition">
                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Content 2: AI Plate Analysis & Review */}
                {tab === 'ai' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {!isAiReview ? (
                            <div className="space-y-4">
                                {/* Upload Box */}
                                <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/10 transition-colors relative min-h-[220px] overflow-hidden">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                    
                                    {preview ? (
                                        <div className="relative w-full h-full min-h-[160px] z-30 flex flex-col items-center">
                                            <img src={preview} alt="Child Meal plate" className="max-w-[200px] h-32 object-cover rounded-2xl shadow-md border border-gray-200" />
                                            <div className="absolute top-2 right-2">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setPhoto(null); setPreview(null); }}
                                                    className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-green-600">
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                Plate Image: {photo.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <span className="material-symbols-outlined text-gray-300 dark:text-slate-700 text-6xl mb-3">photo_camera</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-black">Upload a photo of your child's plate</p>
                                            <p className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider">Drag & drop or tap to browse</p>
                                        </div>
                                    )}
                                </div>

                                {photo && !aiLoading && (
                                    <button
                                        type="button"
                                        onClick={handleAiAnalysis}
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">psychology</span>
                                        Analyze Plate with AI
                                    </button>
                                )}

                                {/* Premium Loading Indicator */}
                                {aiLoading && (
                                    <div className="p-8 bg-blue-50/50 dark:bg-slate-900/50 rounded-3xl border border-blue-100/50 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                                        <div className="relative w-16 h-16">
                                            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                                            <span className="material-symbols-outlined text-2xl text-primary absolute inset-0 flex items-center justify-center">psychology</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm uppercase tracking-widest">Food plate analysis</h4>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Ateeqq/food-analysis model is detecting food items and estimating nutrition...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                                {/* AI Review Screen */}
                                <div className="p-4 bg-green-50/60 dark:bg-slate-900/40 rounded-2xl border border-green-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-600">verified</span>
                                        <div>
                                            <h4 className="text-xs font-black text-green-800 dark:text-green-300 uppercase tracking-widest">AI Detection Results</h4>
                                            <p className="text-[11px] text-green-700 dark:text-green-400">Review detected foods, correct quantities or add missing items.</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsAiReview(false);
                                            setAiFoods([]);
                                        }}
                                        className="text-xs font-bold text-gray-500 hover:text-red-500 underline"
                                    >
                                        Re-upload
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {aiFoods.map((food, idx) => (
                                        <div key={food.id} className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl relative shadow-sm hover:border-primary/20 transition-all">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveAiFood(idx)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Food Name</label>
                                                    <input
                                                        type="text"
                                                        value={food.name}
                                                        onChange={(e) => handleAiFoodChange(idx, 'name', e.target.value)}
                                                        className="w-full border border-gray-200 dark:border-slate-850 dark:bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Portion Quantity</label>
                                                    <div className="flex items-center bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl p-1 h-9 max-w-[180px]">
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateAiFoodAmount(idx, - (food.unit === 'g' ? 10 : 1))}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition text-xs font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex-1 text-center select-none whitespace-nowrap overflow-hidden text-ellipsis px-1">
                                                            {food.amount} {food.unit}
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateAiFoodAmount(idx, (food.unit === 'g' ? 10 : 1))}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition text-xs font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Calories (kcal)</label>
                                                    <input
                                                        type="number"
                                                        value={food.calories}
                                                        onChange={(e) => handleAiFoodChange(idx, 'calories', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Protein (g)</label>
                                                    <input
                                                        type="number"
                                                        value={food.protein}
                                                        onChange={(e) => handleAiFoodChange(idx, 'protein', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Carbs (g)</label>
                                                    <input
                                                        type="number"
                                                        value={food.carbs}
                                                        onChange={(e) => handleAiFoodChange(idx, 'carbs', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Fats (g)</label>
                                                    <input
                                                        type="number"
                                                        value={food.fats}
                                                        onChange={(e) => handleAiFoodChange(idx, 'fats', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Fiber (g)</label>
                                                    <input
                                                        type="number"
                                                        value={food.fiber || 0}
                                                        onChange={(e) => handleAiFoodChange(idx, 'fiber', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Iron (mg)</label>
                                                    <input
                                                        type="number"
                                                        value={food.iron || 0}
                                                        onChange={(e) => handleAiFoodChange(idx, 'iron', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Calcium (mg)</label>
                                                    <input
                                                        type="number"
                                                        value={food.calcium || 0}
                                                        onChange={(e) => handleAiFoodChange(idx, 'calcium', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 text-center">Vit C (mg)</label>
                                                    <input
                                                        type="number"
                                                        value={food.vitaminC || 0}
                                                        onChange={(e) => handleAiFoodChange(idx, 'vitaminC', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-gray-250 dark:border-slate-850 dark:bg-slate-950 rounded-lg py-1 text-xs text-center font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>

                                            {food.confidence !== undefined && (
                                                <div className="mt-3 text-right">
                                                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                                                        Confidence Score: {Math.round(food.confidence * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddBlankAiFood}
                                    className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-slate-800 text-gray-500 hover:text-primary rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    Add Missing Food Item
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (Allergies, refusals, comments)</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Mention food preferences, leftovers percentage, or specific reactions..."
                        className="w-full border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        rows="2.5"
                    />
                </div>

                {/* Combined Meal Planning Toggle */}
                <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-slate-900/30 rounded-2xl border border-blue-100/50 dark:border-slate-800">
                    <input
                        type="checkbox"
                        id="applyToAll"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="w-5 h-5 text-primary rounded-lg border-gray-300 focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="applyToAll" className="text-xs md:text-sm font-black text-blue-900 dark:text-blue-300 cursor-pointer">
                        Apply same meal to all child profiles
                    </label>
                </div>
            </div>

            {/* Right Column: Nutrition Preview Widget */}
            <div className="w-full lg:w-80 bg-white lg:bg-transparent h-fit lg:sticky lg:top-4 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-md">
                    <h3 className="font-black text-gray-800 dark:text-white mb-6 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 pb-3">Nutrition Preview</h3>

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
                                    className="text-gray-100 dark:text-slate-800"
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
                                <span className="text-3xl font-black text-gray-800 dark:text-white">{Math.round(nutrients.calories)}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calories (kcal)</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                        {[
                            { label: 'PROTEIN', val: nutrients.protein, max: 25, color: 'bg-blue-500', barBg: 'bg-blue-100 dark:bg-blue-950/20', unit: 'g' },
                            { label: 'CARBS', val: nutrients.carbs, max: 100, color: 'bg-yellow-400', barBg: 'bg-yellow-100 dark:bg-yellow-950/20', unit: 'g' },
                            { label: 'FATS', val: nutrients.fat, max: 40, color: 'bg-green-500', barBg: 'bg-green-100 dark:bg-green-950/20', unit: 'g' },
                            { label: 'FIBER', val: Math.round(nutrients.fiber), max: 25, color: 'bg-orange-500', barBg: 'bg-orange-100 dark:bg-orange-950/20', unit: 'g' },
                            { label: 'WATER', val: nutrients.water, max: 2000, color: 'bg-cyan-500', barBg: 'bg-cyan-100 dark:bg-cyan-950/20', unit: 'ml' },
                        ].map((metric) => (
                            <div key={metric.label}>
                                <div className="flex justify-between text-[9px] font-black text-gray-500 mb-1">
                                    <span>{metric.label}</span>
                                    <span>{Math.round(metric.val * 10) / 10}{metric.unit} <span className="text-gray-300">/ {metric.max}{metric.unit}</span></span>
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
                        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 flex flex-wrap gap-1.5">
                            {nutrients.vitamins.split(', ').map((vit, idx) => (
                                <span key={idx} className="text-[9px] font-black bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg uppercase border border-purple-100 dark:border-purple-900/30">
                                    {vit}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Dynamic feedback based on selections */}
                    {(() => {
                        const feedbacks = [];
                        const foodsList = tab === 'ai' ? aiFoods : selectedFoods;
                        const hasVeg = foodsList.some(f => 
                            f.tag?.toLowerCase().includes('veg') || 
                            f.tag?.toLowerCase().includes('green') || 
                            f.tag?.toLowerCase().includes('vitamin') ||
                            ['spinach', 'palak', 'methi', 'bhindi', 'gobi', 'carrot', 'beans', 'peas', 'lauki', 'tinda'].some(v => f.name.toLowerCase().includes(v))
                        );
                        const hasProtein = foodsList.some(f => 
                            f.tag?.toLowerCase().includes('protein') || 
                            (f.p || f.protein) > 8 ||
                            ['dal', 'paneer', 'egg', 'chicken', 'fish', 'mutton', 'soya', 'chole', 'rajma'].some(p => f.name.toLowerCase().includes(p))
                        );
                        const hasFruit = foodsList.some(f => 
                            f.tag?.toLowerCase().includes('fruit') || 
                            ['banana', 'apple', 'orange', 'mango', 'papaya', 'grapes', 'guava', 'melon'].some(fruit => f.name.toLowerCase().includes(fruit))
                        );
                        
                        if (foodsList.length > 0) {
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
                                <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 flex gap-3">
                                    <span className="material-symbols-outlined text-blue-600">verified</span>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Looks Balanced!</p>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">This meal selection contains a good mix of essential nutrition.</p>
                                    </div>
                                </div>
                            );
                        }

                        const topFeedback = feedbacks[0];
                        const colorClasses = {
                            orange: { bg: 'bg-orange-50/60 dark:bg-orange-950/10', border: 'border-orange-100/50 dark:border-orange-900/30', icon: 'text-orange-600', title: 'text-orange-850 dark:text-orange-300', text: 'text-orange-700 dark:text-orange-400' },
                            blue: { bg: 'bg-blue-50/60 dark:bg-blue-950/10', border: 'border-blue-100/50 dark:border-blue-900/30', icon: 'text-blue-600', title: 'text-blue-850 dark:text-blue-300', text: 'text-blue-700 dark:text-blue-400' },
                            green: { bg: 'bg-green-50/60 dark:bg-green-950/10', border: 'border-green-100/50 dark:border-green-900/30', icon: 'text-green-600', title: 'text-green-850 dark:text-green-300', text: 'text-green-700 dark:text-green-400' }
                        }[topFeedback.color];

                        return (
                            <div className={`mt-6 p-4 ${colorClasses.bg} rounded-2xl border ${colorClasses.border} flex gap-3 transition-all animate-in fade-in`}>
                                <span className={`material-symbols-outlined ${colorClasses.icon}`}>{topFeedback.icon}</span>
                                <div>
                                    <p className={`text-xs font-bold ${colorClasses.title} mb-1`}>{topFeedback.title}</p>
                                    <p className={`text-[10px] ${colorClasses.text} leading-relaxed`}>{topFeedback.text}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || aiLoading || (tab === 'ai' && !isAiReview)}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                        {loading ? 'Saving meal...' : 'Save Logged Meal'}
                    </button>
                    <button
                        onClick={onCancel}
                        type="button"
                        className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MealLogForm;
