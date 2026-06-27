import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import SleepLog from '../models/SleepLog.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import { computeWellnessAnalysis } from '../utils/wellnessEngine.js';

dotenv.config();

// Pool of 8 distinct Breakfasts
const BREAKFAST_POOL = [
    { name: "Millet Dosa with Sambar", calories: 260, protein: 7, carbs: 42, fats: 8, fiber: 4, water: 120, vitamins: "Calcium: 50mg, Iron: 1.5mg" },
    { name: "Scrambled Eggs (2) & Multigrain Toast", calories: 320, protein: 18, carbs: 24, fats: 14, fiber: 3, water: 80, vitamins: "Vitamin D: 1.8mcg, B12: 1.2mcg" },
    { name: "Milk (200ml) with Cornflakes & Honey", calories: 240, protein: 8, carbs: 45, fats: 4, fiber: 1, water: 200, vitamins: "Calcium: 240mg, Vitamin A: 60mcg" },
    { name: "Vegetable Upma with Chutney", calories: 280, protein: 6, carbs: 48, fats: 9, fiber: 5, water: 90, vitamins: "Iron: 1mg, Vitamin C: 10mg" },
    { name: "Ragi Porridge with Almonds & Banana", calories: 310, protein: 9, carbs: 54, fats: 6, fiber: 7, water: 150, vitamins: "Calcium: 300mg, Iron: 2.2mg" },
    { name: "Pancakes with Maple Syrup & Strawberry", calories: 350, protein: 6, carbs: 68, fats: 8, fiber: 2, water: 60, vitamins: "Vitamin C: 15mg" },
    { name: "Poha with Roasted Peanuts & Lemon", calories: 270, protein: 7, carbs: 46, fats: 9, fiber: 3, water: 70, vitamins: "Vitamin C: 12mg, Iron: 1.8mg" },
    { name: "Idli (3) with Tomato Sambar", calories: 230, protein: 6, carbs: 45, fats: 2, fiber: 4, water: 110, vitamins: "Calcium: 40mg, Iron: 1.2mg" }
];

// Pool of 8 distinct Lunches
const LUNCH_POOL = [
    { name: "Paneer Tikka Masala, Roti (2) & Salad", calories: 480, protein: 18, carbs: 48, fats: 20, fiber: 5, water: 130, vitamins: "Calcium: 280mg, Vitamin A: 80mcg" },
    { name: "Dal Tadka (Lentil), Jeera Rice & Bhindi", calories: 410, protein: 12, carbs: 68, fats: 10, fiber: 7, water: 150, vitamins: "Iron: 3mg, Folate: 70mcg" },
    { name: "Chicken Curry with Whole Wheat Chapati", calories: 510, protein: 32, carbs: 40, fats: 18, fiber: 4, water: 120, vitamins: "Zinc: 2.2mg, B12: 1.5mcg" },
    { name: "Vegetable Biryani with Veg Cucumber Raita", calories: 430, protein: 10, carbs: 72, fats: 12, fiber: 6, water: 160, vitamins: "Vitamin A: 50mcg, Calcium: 120mg" },
    { name: "Sambar Rice, Beans Poriyal & Papad", calories: 380, protein: 8, carbs: 64, fats: 9, fiber: 5, water: 140, vitamins: "Iron: 1.5mg, Calcium: 60mg" },
    { name: "Grilled Fish Fillet, Steamed Rice & Broccoli", calories: 450, protein: 28, carbs: 50, fats: 12, fiber: 4, water: 110, vitamins: "Vitamin D: 2.2mcg, Zinc: 1.8mg" },
    { name: "Rajma (Kidney Beans) with Brown Rice & Curd", calories: 460, protein: 15, carbs: 70, fats: 11, fiber: 9, water: 170, vitamins: "Iron: 2.8mg, Calcium: 140mg" },
    { name: "Palak Paneer with Whole Wheat Naan", calories: 490, protein: 19, carbs: 52, fats: 21, fiber: 7, water: 120, vitamins: "Calcium: 310mg, Iron: 3.5mg" }
];

// Pool of 8 distinct Dinners
const DINNER_POOL = [
    { name: "Moong Dal Khichdi with Ghee & Curd", calories: 360, protein: 11, carbs: 55, fats: 8, fiber: 6, water: 180, vitamins: "Calcium: 100mg, Iron: 2mg" },
    { name: "Mixed Veg Soup & Whole Wheat Garlic Bread", calories: 290, protein: 7, carbs: 40, fats: 11, fiber: 5, water: 250, vitamins: "Vitamin C: 25mg, Vitamin A: 120mcg" },
    { name: "Aloo Gobi, Dal Makhani & Roti", calories: 440, protein: 13, carbs: 62, fats: 14, fiber: 8, water: 110, vitamins: "Iron: 2.4mg, Calcium: 90mg" },
    { name: "Egg Bhurji (2 eggs) with Wheat Chapati", calories: 380, protein: 20, carbs: 36, fats: 16, fiber: 3, water: 90, vitamins: "Vitamin D: 1.6mcg, B12: 1mcg" },
    { name: "Veg Hakka Noodles & Tofu Stir Fry", calories: 420, protein: 14, carbs: 58, fats: 13, fiber: 4, water: 100, vitamins: "Calcium: 180mg, Zinc: 1.2mg" },
    { name: "Methi Thepla (3) with Chana Masala", calories: 390, protein: 12, carbs: 56, fats: 12, fiber: 7, water: 110, vitamins: "Iron: 3.2mg, Calcium: 120mg" },
    { name: "Chicken Noodle Soup & Steamed Momos", calories: 410, protein: 24, carbs: 48, fats: 10, fiber: 3, water: 220, vitamins: "Zinc: 1.5mg" },
    { name: "Paneer Bhurji & Multigrain Chapati", calories: 460, protein: 17, carbs: 44, fats: 20, fiber: 5, water: 100, vitamins: "Calcium: 240mg, Vitamin A: 70mcg" }
];

// Pool of 8 distinct Snacks
const SNACK_POOL = [
    { name: "Fresh Apple slices & Almonds", calories: 120, protein: 3, carbs: 18, fats: 5, fiber: 4, water: 80, vitamins: "Vitamin C: 8mg" },
    { name: "Coconut Water (250ml)", calories: 50, protein: 0.5, carbs: 10, fats: 0.1, fiber: 1, water: 250, vitamins: "Calcium: 24mg, Potassium: 250mg" },
    { name: "Boiled Sweet Corn with Lemon juice", calories: 110, protein: 3.2, carbs: 22, fats: 1.2, fiber: 3, water: 60, vitamins: "Vitamin C: 12mg" },
    { name: "Yogurt with Fresh Berries", calories: 150, protein: 6, carbs: 20, fats: 4, fiber: 2, water: 120, vitamins: "Calcium: 180mg, Vitamin C: 15mg" },
    { name: "Roasted Makhana (Lotus Seeds)", calories: 90, protein: 2, carbs: 18, fats: 1, fiber: 2, water: 10, vitamins: "Calcium: 50mg" },
    { name: "Papaya Cubes with Honey", calories: 80, protein: 0.8, carbs: 19, fats: 0.1, fiber: 3, water: 95, vitamins: "Vitamin A: 280mcg, Vitamin C: 40mg" },
    { name: "Chana Chat (Boiled Chickpeas)", calories: 140, protein: 6, carbs: 24, fats: 2.5, fiber: 5, water: 70, vitamins: "Iron: 1.8mg, Folate: 40mcg" },
    { name: "Buttermilk (Chass - 200ml)", calories: 60, protein: 2.2, carbs: 4.5, fats: 2.5, fiber: 0, water: 200, vitamins: "Calcium: 110mg" }
];

async function seed() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully!");

        // 1. Find profile "Abhiram Bikkina" case-insensitively
        let profile = await Profile.findOne({ name: /abhiram bikkina/i });
        if (!profile) {
            console.log("Profile 'Abhiram Bikkina' not found. Searching for name 'Abhiram'...");
            profile = await Profile.findOne({ name: /abhiram/i });
        }
        if (!profile) {
            console.log("Profile 'Abhiram' not found. Searching for name 'Abhi'...");
            profile = await Profile.findOne({ name: /abhi/i });
        }

        if (!profile) {
            console.error("❌ Error: No child profile matches Abhiram, Bikkina, or Abhi. Please create a child profile first.");
            process.exit(1);
        }

        console.log(`Found Target Profile: ${profile.name} (ID: ${profile._id})`);

        // Update preferences to support diverse data
        await Profile.findByIdAndUpdate(profile._id, {
            $set: {
                preferences: {
                    favoriteFoods: "Veg and Non-Veg, Idli, Dosa, Paneer, Chicken, Eggs",
                    dislikedFoods: "Bittergourd",
                    waterIntake: 1800,
                    activityLevel: "moderate",
                    sleepDuration: 10,
                    sleepQuality: "Good",
                    screenTime: 1.5,
                    eatingHabits: "average"
                }
            }
        }, { runValidators: false });
        console.log("Updated child preferences successfully.");

        // Clean existing meal, sleep, and activity logs
        await MealLog.deleteMany({ profileId: profile._id });
        await SleepLog.deleteMany({ profileId: profile._id });
        await ActivityLog.deleteMany({ profileId: profile._id });
        console.log("🧹 Cleaned old MealLogs, SleepLogs, and ActivityLogs.");

        const today = new Date();
        const mealLogsToInsert = [];
        const sleepLogsToInsert = [];
        const activityLogsToInsert = [];

        // Log exactly 24 days out of the last 30 days
        // Spread the 24 logged days over the last 30 days (leaving 6 days unlogged to show gaps)
        const unloggedDays = [5, 12, 18, 22, 27, 29]; // dates with gaps

        for (let i = 0; i < 30; i++) {
            if (unloggedDays.includes(i)) {
                continue; // skip logging on these days to show calorie gaps
            }

            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Select varied foods from pools based on date index (modulo pools length)
            const bf = BREAKFAST_POOL[i % BREAKFAST_POOL.length];
            const ln = LUNCH_POOL[i % LUNCH_POOL.length];
            const dn = DINNER_POOL[i % DINNER_POOL.length];
            
            // Log 2 snacks per day for optimal nutrient distribution
            const sn1 = SNACK_POOL[i % SNACK_POOL.length];
            const sn2 = SNACK_POOL[(i + 3) % SNACK_POOL.length];

            // 1. Create Meal Log
            mealLogsToInsert.push({
                profileId: profile._id,
                date: dateStr,
                breakfast: [{
                    name: bf.name,
                    quantity: "1 serving",
                    calories: bf.calories,
                    protein: bf.protein,
                    carbs: bf.carbs,
                    fats: bf.fats,
                    fiber: bf.fiber,
                    water: bf.water,
                    vitamins: bf.vitamins
                }],
                morningSnack: [{
                    name: sn1.name,
                    quantity: "1 serving",
                    calories: sn1.calories,
                    protein: sn1.protein,
                    carbs: sn1.carbs,
                    fats: sn1.fats,
                    fiber: sn1.fiber,
                    water: sn1.water,
                    vitamins: sn1.vitamins
                }],
                lunch: [{
                    name: ln.name,
                    quantity: "1 serving",
                    calories: ln.calories,
                    protein: ln.protein,
                    carbs: ln.carbs,
                    fats: ln.fats,
                    fiber: ln.fiber,
                    water: ln.water,
                    vitamins: ln.vitamins
                }],
                afternoonSnack: [{
                    name: sn2.name,
                    quantity: "1 serving",
                    calories: sn2.calories,
                    protein: sn2.protein,
                    carbs: sn2.carbs,
                    fats: sn2.fats,
                    fiber: sn2.fiber,
                    water: sn2.water,
                    vitamins: sn2.vitamins
                }],
                dinner: [{
                    name: dn.name,
                    quantity: "1 serving",
                    calories: dn.calories,
                    protein: dn.protein,
                    carbs: dn.carbs,
                    fats: dn.fats,
                    fiber: dn.fiber,
                    water: dn.water,
                    vitamins: dn.vitamins
                }],
                // Hydration focus
                eveningSnack: [{
                    name: "Mineral Water",
                    quantity: "2 glasses (500ml)",
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    fiber: 0,
                    water: 500,
                    vitamins: ""
                }],
                completedMealsCount: 5,
                isStreakCounted: true,
                lastMealAt: date
            });

            // 2. Create Sleep Log (varying duration slightly between 8.5 and 10.5 hrs)
            const sleepHrs = 8.5 + (i % 5) * 0.5; // ranges 8.5, 9.0, 9.5, 10.0, 10.5
            const sleepQuality = i % 7 === 0 ? 'poor' : 'healthy';
            const sleepTimeStr = i % 2 === 0 ? '21:30' : '22:00';
            const wakeUpTimeStr = sleepHrs === 9.5 ? '07:30' : '07:00';

            sleepLogsToInsert.push({
                profileId: profile._id,
                date: dateStr,
                sleepTime: sleepTimeStr,
                wakeUpTime: wakeUpTimeStr,
                totalSleepHours: sleepHrs,
                status: sleepQuality,
                notes: sleepQuality === 'poor' ? 'Woke up once in middle of night.' : 'Slept peacefully.'
            });

            // 3. Create Activity Log (varying outdoor play and sports)
            const playDuration = 45 + (i % 4) * 15; // ranges 45, 60, 75, 90 mins
            const isPE = i % 3 === 0;

            const activitiesList = [
                { type: 'Outdoor Play', duration: playDuration, notes: 'Played in park with friends.' }
            ];
            if (isPE) {
                activitiesList.push({ type: 'Sports', duration: 30, notes: 'School basketball session.' });
            }

            const totalActDuration = activitiesList.reduce((sum, act) => sum + act.duration, 0);

            activityLogsToInsert.push({
                profileId: profile._id,
                date: dateStr,
                activities: activitiesList,
                totalDuration: totalActDuration,
                status: totalActDuration >= 60 ? 'Active' : 'Inactive'
            });
        }

        // Insert logs into database
        await MealLog.insertMany(mealLogsToInsert);
        await SleepLog.insertMany(sleepLogsToInsert);
        await ActivityLog.insertMany(activityLogsToInsert);
        console.log("✅ Seeded 24 days of MealLogs, SleepLogs, and ActivityLogs with varied datasets.");

        // 4. Update historical GrowthRecords to draw nice curves
        await GrowthRecord.deleteMany({ childId: profile._id });
        const growthRecordsToInsert = [];
        const curHeight = profile.height || 116;
        const curWeight = profile.weight || 20;

        // History steps over the last 6 months showing steady growth
        const growthHistory = [
            { monthsAgo: 6, height: curHeight - 4.5, weight: curWeight - 1.6 },
            { monthsAgo: 4, height: curHeight - 3.0, weight: curWeight - 1.1 },
            { monthsAgo: 2, height: curHeight - 1.5, weight: curWeight - 0.5 },
            { monthsAgo: 0, height: curHeight, weight: curWeight }
        ];

        for (const record of growthHistory) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - record.monthsAgo);

            const heightM = record.height / 100;
            const bmi = record.weight / (heightM * heightM);

            growthRecordsToInsert.push({
                childId: profile._id,
                height: record.height,
                weight: record.weight,
                bmi: Number(bmi.toFixed(2)),
                recordedByRole: 'parent',
                recordedByUserId: profile.parentId,
                ageInMonths: profile.age * 12 - record.monthsAgo,
                notes: record.monthsAgo === 0 ? "Latest height/weight update" : "Routine monthly verification",
                timestamp: date
            });
        }

        await GrowthRecord.insertMany(growthRecordsToInsert);
        console.log("✅ Seeded 4 GrowthRecords representing developmental velocity.");

        // 5. Run local clinical re-analysis and update the profile
        const freshMealLogs = await MealLog.find({ profileId: profile._id });
        const updatedProfile = await Profile.findById(profile._id);
        
        const analysis = computeWellnessAnalysis(updatedProfile.toObject(), freshMealLogs);
        await Profile.findByIdAndUpdate(profile._id, {
            $set: { wellnessAnalysis: analysis }
        }, { runValidators: false });
        console.log(`✅ Completed clinical re-analysis! Overall Wellness Score is now: ${analysis.score}/100.`);

        console.log("\n🎉 Database Seed Successful for Abhiram Bikkina profile!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seed();
