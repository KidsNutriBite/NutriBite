import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import MealLog from '../models/MealLog.model.js';
import ChatLog from '../models/ChatLog.model.js';
import Profile from '../models/Profile.model.js';
import mongoose from 'mongoose';

// @desc    Get Gamification Stats (Level, XP, Badges)
// @route   GET /api/game/stats/:id
// @access  Private (Parent Only)
export const getKidStats = asyncHandler(async (req, res) => {
    const { id } = req.params; // Profile ID

    const profile = await Profile.findById(id);
    if (!profile) {
        res.status(404);
        throw new Error('Child profile not found');
    }

    const mealCount = await MealLog.countDocuments({ profileId: id });

    // Determine Badges
    const badges = [];
    if (mealCount >= 1) badges.push({ id: 'first_bite', name: 'First Bite', icon: '🍎' });
    if (mealCount >= 5) badges.push({ id: 'high_five', name: 'High Five', icon: '🤚' });
    if (mealCount >= 10) badges.push({ id: 'double_digits', name: 'Double Digits', icon: '🔟' });
    if (mealCount >= 20) badges.push({ id: 'food_explorer', name: 'Food Explorer', icon: '🚀' });
    if (mealCount >= 50) badges.push({ id: 'nutrition_hero', name: 'Nutrition Hero', icon: '🦸' });

    // Daily Quests (dynamic matching of logs for YYYY-MM-DD today)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = await MealLog.findOne({
        profileId: id,
        date: todayStr
    });

    const hasBreakfast = todayLog ? (todayLog.breakfast && todayLog.breakfast.length > 0) : false;
    const hasLunch = todayLog ? (todayLog.lunch && todayLog.lunch.length > 0) : false;
    const hasDinner = todayLog ? (todayLog.dinner && todayLog.dinner.length > 0) : false;

    res.status(200).json(new ApiResponse(200, {
        level: profile.level || 1,
        currentXP: profile.currentXP || 0,
        nextLevelXP: (profile.level || 1) * 100,
        streakCount: profile.streakCount || 0,
        equippedCompanion: profile.equippedCompanion || 'Captain Milk',
        badges,
        totalMeals: mealCount,
        dailyQuests: {
            breakfast: hasBreakfast,
            lunch: hasLunch,
            dinner: hasDinner
        }
    }));
});

// @desc    Chat with Food Buddy (Safe AI Placeholder)
// @route   POST /api/game/chat
// @access  Private (Parent Only)
export const chatWithFoodBuddy = asyncHandler(async (req, res) => {
    const { profileId, message } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    const lowerMsg = message.toLowerCase();
    let response = "That sounds yummy! Tell me more!";

    // Helper for word boundary check
    const hasWord = (word) => new RegExp(`\\b${word}\\b`, 'i').test(lowerMsg);

    // Safety Filter (Reject weight/medical topics)
    const unsafeKeywords = ['diet', 'weight', 'fat', 'thin', 'calories', 'lose', 'gain', 'medicine', 'pill', 'sick', 'starve', 'fasting'];
    const foundUnsafe = unsafeKeywords.find(k => hasWord(k));

    if (foundUnsafe) {
        response = "I'm just a food buddy! I like talking about yummy fruits and veggies. Let's talk about that instead!";
    } else {
        // Simple Knowledge Base
        // Greetings
        if (hasWord('hello') || hasWord('hi') || hasWord('hey')) {
            response = "Hi there! I'm your Food Buddy. What did you eat today? 👋";
        }
        // Fruits & Veggies
        else if (hasWord('carrot') || hasWord('carrots')) response = "Carrots are crunchy and great for your eyes! 🥕";
        else if (hasWord('apple') || hasWord('apples')) response = "An apple a day is a crunchy treat! 🍎";
        else if (hasWord('banana') || hasWord('bananas')) response = "Bananas are full of energy and potassium! 🍌";
        else if (hasWord('orange') || hasWord('oranges')) response = "Oranges are packed with Vitamin C! 🍊";
        else if (hasWord('broccoli')) response = "Broccoli looks like little trees and makes you strong! 🥦";
        // Grains
        else if (hasWord('ragi')) response = "Ragi porridge builds dense bones and strong muscle shields! 🌾🛡️";
        // Drinks
        else if (hasWord('water')) response = "Staying hydrated is super important! 💧";
        else if (hasWord('milk')) response = "Milk helps build strong bones! 🥛";
        else if (hasWord('juice')) response = "Juice is tasty, but whole fruit is even better! 🧃";
        // Proteins / Meals
        else if (hasWord('chicken')) response = "Chicken gives you protein to build strong muscles! 🍗";
        else if (hasWord('egg') || hasWord('eggs')) response = "Eggs are egg-cellent for energy! 🍳";
        else if (hasWord('fish')) response = "Fish is great for your brain! 🐟";
        else if (hasWord('rice') || hasWord('biriyani')) response = "Yum! Grains give you energy to play! 🍚";
        else if (hasWord('pizza') || hasWord('burger')) response = "That sounds delicious! Did you have some veggies on the side? 🥗";
        // Treats
        else if (hasWord('candy') || hasWord('sugar') || hasWord('chocolate') || hasWord('cookie')) response = "Treats are okay sometimes, but fruits are nature's candy! 🍭➡️🍓";
    }

    // Audit Logging (Required for Safety)
    await ChatLog.create({
        profileId,
        message,
        response
    });

    res.status(200).json(new ApiResponse(200, { response }));
});

// @desc    Get Chat History
// @route   GET /api/game/chat/:id
// @access  Private (Parent Only)
export const getChatHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const history = await ChatLog.find({ profileId: id }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(new ApiResponse(200, history));
});

// @desc    Log a meal from Kids Mode (Anti-Cheat, XP & Streaks)
// @route   POST /api/game/log-meal-kid
// @access  Private (Parent / Kid Profile owner)
export const logMealKid = asyncHandler(async (req, res) => {
    const { profileId, mealType, foodName, calories, protein } = req.body;

    if (!profileId || !mealType || !foodName) {
        res.status(400);
        throw new Error("Missing required fields: profileId, mealType, foodName");
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
        res.status(404);
        throw new Error("Profile not found");
    }

    const now = new Date();

    // 1. Anti-Cheat Check: 2-hour cooldown
    if (profile.lastMealLoggedAt) {
        const timeDiffMs = now - new Date(profile.lastMealLoggedAt);
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
        if (timeDiffHours < 2) {
            return res.status(429).json(new ApiResponse(429, null, "Whoa, explorer! You can only log meals every 2 hours!"));
        }
    }

    // 2. Anti-Cheat Check: Daily Cap (Max 6 logs)
    const resetTimeDiffHours = (now - new Date(profile.lastLogResetAt)) / (1000 * 60 * 60);
    if (resetTimeDiffHours >= 24) {
        profile.dailyLogsCount = 0;
        profile.lastLogResetAt = now;
    }

    if (profile.dailyLogsCount >= 6) {
        return res.status(429).json(new ApiResponse(429, null, "Superstar, you have logged your maximum meals for today! Rest up!"));
    }

    // 3. Streak and XP Calculation
    if (profile.lastMealLoggedAt) {
        const diffMs = now - new Date(profile.lastMealLoggedAt);
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 12 && diffHours <= 48) {
            profile.streakCount += 1;
        } else if (diffHours > 48) {
            profile.streakCount = 1;
        }
    } else {
        profile.streakCount = 1;
    }

    let gainedXP = 10;
    const streakBonus = Math.min(1.5, 1 + (profile.streakCount * 0.05));
    gainedXP = Math.round(gainedXP * streakBonus);

    // 4. Update Profile XP & level
    profile.currentXP += gainedXP;
    profile.dailyLogsCount += 1;
    profile.lastMealLoggedAt = now;

    const nextLevelXP = profile.level * 100;
    let leveledUp = false;
    if (profile.currentXP >= nextLevelXP) {
        profile.level += 1;
        profile.currentXP = profile.currentXP - nextLevelXP;
        leveledUp = true;
    }

    await profile.save();

    // 5. Create active MealLog
    const dateStr = now.toISOString().split('T')[0];
    let dailyLog = await MealLog.findOne({ profileId, date: dateStr });
    
    const parsedFood = {
        name: foodName,
        calories: calories || 150,
        protein: protein || 5
    };

    if (!dailyLog) {
        dailyLog = new MealLog({
            profileId,
            date: dateStr,
            breakfast: mealType === 'breakfast' ? [parsedFood] : [],
            morningSnack: mealType === 'morningSnack' ? [parsedFood] : [],
            lunch: mealType === 'lunch' ? [parsedFood] : [],
            afternoonSnack: mealType === 'afternoonSnack' ? [parsedFood] : [],
            dinner: mealType === 'dinner' ? [parsedFood] : [],
            eveningSnack: mealType === 'eveningSnack' ? [parsedFood] : [],
            completedMealsCount: 1,
            lastMealAt: now
        });
    } else {
        if (!dailyLog[mealType]) dailyLog[mealType] = [];
        dailyLog[mealType].push(parsedFood);
        
        let count = 0;
        if (dailyLog.breakfast && dailyLog.breakfast.length > 0) count++;
        if (dailyLog.morningSnack && dailyLog.morningSnack.length > 0) count++;
        if (dailyLog.lunch && dailyLog.lunch.length > 0) count++;
        if (dailyLog.afternoonSnack && dailyLog.afternoonSnack.length > 0) count++;
        if (dailyLog.dinner && dailyLog.dinner.length > 0) count++;
        if (dailyLog.eveningSnack && dailyLog.eveningSnack.length > 0) count++;

        dailyLog.completedMealsCount = count;
        dailyLog.lastMealAt = now;
    }

    await dailyLog.save();

    // 6. Badges calculation
    const mealCount = await MealLog.countDocuments({ profileId });
    const badges = [];
    if (mealCount >= 1) badges.push({ id: 'first_bite', name: 'First Bite', icon: '🍎' });
    if (mealCount >= 5) badges.push({ id: 'high_five', name: 'High Five', icon: '🤚' });
    if (mealCount >= 10) badges.push({ id: 'double_digits', name: 'Double Digits', icon: '🔟' });
    if (mealCount >= 20) badges.push({ id: 'food_explorer', name: 'Food Explorer', icon: '🚀' });
    if (mealCount >= 50) badges.push({ id: 'nutrition_hero', name: 'Nutrition Hero', icon: '🦸' });

    res.status(200).json(new ApiResponse(200, {
        profileId,
        currentXP: profile.currentXP,
        level: profile.level,
        streakCount: profile.streakCount,
        dailyLogsCount: profile.dailyLogsCount,
        leveledUp,
        xpEarned: gainedXP,
        badges,
        dailyQuests: {
            breakfast: mealType === 'breakfast',
            lunch: mealType === 'lunch',
            dinner: mealType === 'dinner'
        }
    }, "Meal logged and XP calculated successfully!"));
});

// @desc    Equip a Superhero Companion
// @route   POST /api/game/equip
// @access  Private (Parent / Kid Profile owner)
export const equipCompanion = asyncHandler(async (req, res) => {
    const { profileId, companionName } = req.body;

    if (!profileId || !companionName) {
        res.status(400);
        throw new Error("profileId and companionName are required");
    }

    const validCompanions = ["Iron-Man Ragi", "Captain Milk", "Sprout-Shield"];
    if (!validCompanions.includes(companionName)) {
        res.status(400);
        throw new Error("Invalid companion name");
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
        res.status(404);
        throw new Error("Profile not found");
    }

    profile.equippedCompanion = companionName;
    await profile.save();

    res.status(200).json(new ApiResponse(200, {
        profileId: profile._id,
        equippedCompanion: profile.equippedCompanion
    }, `Successfully equipped ${companionName}!`));
});
