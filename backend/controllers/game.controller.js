import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import MealLog from '../models/MealLog.model.js';
import ChatLog from '../models/ChatLog.model.js';
import mongoose from 'mongoose';

// @desc    Get Gamification Stats (Level, XP, Badges)
// @route   GET /api/game/stats/:id
// @access  Private (Parent Only)
export const getKidStats = asyncHandler(async (req, res) => {
    const { id } = req.params; // Profile ID

    // 1. Calculate XP (1 Meal = 10 XP)
    const mealCount = await MealLog.countDocuments({ profileId: id });
    const xp = mealCount * 10;
    const level = Math.floor(xp / 100) + 1; // Level up every 100 XP (10 meals)

    // 2. Determine Badges (Derived info)
    const badges = [];
    if (mealCount >= 1) badges.push({ id: 'first_meal', name: 'First Bite', icon: '🍎' });
    if (mealCount >= 5) badges.push({ id: 'five_meals', name: 'High Five', icon: '🤚' });
    if (mealCount >= 10) badges.push({ id: 'ten_meals', name: 'Double Digits', icon: '🔟' });
    if (mealCount >= 20) badges.push({ id: 'twenty_meals', name: 'Food Explorer', icon: '🚀' });
    if (mealCount >= 50) badges.push({ id: 'fifty_meals', name: 'Nutrition Hero', icon: '🦸' });

    // 3. Daily Quests (New Logic)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMeals = await MealLog.find({
        profileId: id,
        date: { $gte: today }
    });

    const hasBreakfast = todayMeals.some(m => m.mealType === 'breakfast');
    const waterGlasses = todayMeals.reduce((acc, curr) => acc + (curr.waterIntake || 0), 0); // Assuming water exists, or placeholder 0

    // Return derived stats (No database write)
    res.status(200).json(new ApiResponse(200, {
        level,
        currentXP: xp,
        nextLevelXP: level * 100,
        badges,
        totalMeals: mealCount,
        dailyQuests: {
            breakfast: hasBreakfast,
            water: waterGlasses
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
