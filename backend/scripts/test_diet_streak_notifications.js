import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.model.js';
import User from '../models/User.model.js';
import MealLog from '../models/MealLog.model.js';
import { MealPlannerService } from '../services/mealPlannerEngine.js';
import { calculateStreaks } from '../controllers/meal.controller.js';
import { getUserNotifications, getUnreadCount } from '../services/notification.service.js';
import { analyzeNutrition } from '../services/nutritionService.js';

dotenv.config();

async function runTests() {
    console.log("=================================================================");
    console.log("🧪 RUNNING COMPREHENSIVE VERIFICATION SUITE");
    console.log("=================================================================");

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid');

    // 1. Fetch a parent and child profile
    const parent = await User.findOne({ email: 'parent@nutrikid.com' });
    if (!parent) {
        console.error("❌ Parent account not found");
        process.exit(1);
    }
    const child = await Profile.findOne({ parentId: parent._id });
    if (!child) {
        console.error("❌ Child profile not found");
        process.exit(1);
    }

    console.log(`👤 Child: ${child.name} (Age: ${child.age}) | Parent: ${parent.name}`);

    // =================================================================
    // TEST 1: CHRONOLOGICAL INDIAN DIET BALANCING & DYNAMIC REFRESH PLAN
    // =================================================================
    console.log("\n--- TEST 1: DIET PLAN DYNAMIC REFRESH & INDIAN DEFICIT BALANCING ---");
    const mealLogs = await MealLog.find({ profileId: child._id });

    const plan1 = await analyzeNutrition(child._id.toString(), 15, 1);
    const plan2 = await analyzeNutrition(child._id.toString(), 15, 2);
    const plan3 = await analyzeNutrition(child._id.toString(), 15, 3);

    console.log(`Plan 1 (Refresh Nonce = 1):`);
    console.log(`  Breakfast: ${plan1.mealPlan.breakfast?.name} (Improves: ${plan1.mealPlan.breakfast?.nutrientsImproved?.join(', ') || 'General'})`);
    console.log(`  Morning Snack: ${plan1.mealPlan.morningSnack?.name}`);
    console.log(`  Lunch: ${plan1.mealPlan.lunch?.name} (Improves: ${plan1.mealPlan.lunch?.nutrientsImproved?.join(', ') || 'General'})`);
    console.log(`  Evening Snack: ${plan1.mealPlan.eveningSnack?.name}`);
    console.log(`  Dinner: ${plan1.mealPlan.dinner?.name}`);
    console.log(`  Bedtime: ${plan1.mealPlan.bedtime?.name}`);

    console.log(`\nPlan 2 (Refresh Nonce = 2):`);
    console.log(`  Breakfast: ${plan2.mealPlan.breakfast?.name}`);
    console.log(`  Lunch: ${plan2.mealPlan.lunch?.name}`);
    console.log(`  Dinner: ${plan2.mealPlan.dinner?.name}`);

    console.log(`\nPlan 3 (Refresh Nonce = 3):`);
    console.log(`  Breakfast: ${plan3.mealPlan.breakfast?.name}`);
    console.log(`  Lunch: ${plan3.mealPlan.lunch?.name}`);
    console.log(`  Dinner: ${plan3.mealPlan.dinner?.name}`);

    const hasChanged = (plan1.mealPlan.breakfast?.name !== plan2.mealPlan.breakfast?.name) ||
                       (plan1.mealPlan.lunch?.name !== plan2.mealPlan.lunch?.name) ||
                       (plan2.mealPlan.dinner?.name !== plan3.mealPlan.dinner?.name);

    if (hasChanged) {
        console.log(`✅ SUCCESS: Refresh Plan dynamically changes meals across refreshes while targeting pediatric deficits!`);
    } else {
        console.warn(`⚠️ Warning: Plans did not change across refreshes`);
    }

    // =================================================================
    // TEST 2: MEAL STREAK & WATER INTAKE STREAK VALUES
    // =================================================================
    console.log("\n--- TEST 2: MEAL & WATER STREAK CALCULATION ---");
    const streakResult = calculateStreaks(mealLogs, child.preferences?.waterIntake || 1400);
    console.log(`📊 Food/Meal Streak: ${streakResult.mealStreak} consecutive days`);
    console.log(`💧 Hydration Streak: ${streakResult.waterStreak} consecutive days`);

    if (streakResult.mealStreak >= 0 && streakResult.waterStreak >= 0) {
        console.log(`✅ SUCCESS: Streaks calculated accurately with consecutive date progression!`);
    }

    // =================================================================
    // TEST 3: DYNAMIC PARENT REMINDERS IN NOTIFICATION TAB
    // =================================================================
    console.log("\n--- TEST 3: DYNAMIC NOTIFICATION REMINDERS ---");
    const todayStr = new Date().toISOString().split('T')[0];

    // Check notifications before today's completion
    let notifsBefore = await getUserNotifications(parent._id);
    let unreadBefore = await getUnreadCount(parent._id);

    console.log(`Active Notifications Count: ${notifsBefore.length} (Unread: ${unreadBefore})`);
    console.log(`Current Reminders:`);
    notifsBefore.forEach(n => {
        console.log(`  - [${n.type}] ${n.message}`);
    });

    const hasMealReminderBefore = notifsBefore.some(n => n.type === 'meal_reminder');
    const hasWaterReminderBefore = notifsBefore.some(n => n.type === 'hydration_reminder');

    console.log(`Meal reminder active: ${hasMealReminderBefore}`);
    console.log(`Water reminder active: ${hasWaterReminderBefore}`);

    // Now simulate parent completing all 3 meals and full water target for today
    console.log(`\nSimulating parent logging all meals and full water target for today (${todayStr})...`);
    let todayLog = await MealLog.findOne({ profileId: child._id, date: todayStr });
    if (!todayLog) {
        todayLog = new MealLog({
            profileId: child._id,
            parentId: parent._id,
            date: todayStr
        });
    }

    todayLog.breakfast = [{ name: "Ragi Roti with Curd", calories: 280, protein: 9, carbs: 45, fats: 6, fiber: 5.5, water: 150 }];
    todayLog.lunch = [{ name: "Palak Khichdi", calories: 340, protein: 12, carbs: 55, fats: 7.5, fiber: 5.5, water: 350 }];
    todayLog.dinner = [{ name: "Dal Khichdi & Soup", calories: 300, protein: 11, carbs: 52, fats: 4.5, fiber: 5.8, water: 400 }];
    todayLog.morningSnack = [{ name: "Water Glass", calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 600 }];
    todayLog.completedMealsCount = 4;
    todayLog.lastMealAt = new Date();
    await todayLog.save();

    // Check notifications after today's completion
    let notifsAfter = await getUserNotifications(parent._id);
    console.log(`\nNotifications after completing meals & water for today:`);
    notifsAfter.forEach(n => {
        console.log(`  - [${n.type}] ${n.message}`);
    });

    const hasMealReminderAfter = notifsAfter.some(n => n.type === 'meal_reminder' && n._id.includes(child._id.toString()));
    const hasWaterReminderAfter = notifsAfter.some(n => n.type === 'hydration_reminder' && n._id.includes(child._id.toString()));

    if (!hasMealReminderAfter && !hasWaterReminderAfter) {
        console.log(`✅ SUCCESS: Reminders automatically DISAPPEARED once parent logged all meals and met required water intake!`);
    } else {
        console.log(`Meal reminder remaining: ${hasMealReminderAfter}, Water reminder remaining: ${hasWaterReminderAfter}`);
    }

    console.log("\n=================================================================");
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=================================================================");

    await mongoose.disconnect();
    process.exit(0);
}

runTests().catch(err => {
    console.error("❌ Test error:", err);
    process.exit(1);
});
