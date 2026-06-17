import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import User from '../models/User.model.js';

dotenv.config();

const breakfastPool = [
    { name: "Idli & Sambar", calories: 220, protein: 7, carbs: 42, fats: 2, fiber: 3, water: 40, vitamins: "Vitamin B: 0.5mg, Iron: 1mg" },
    { name: "Poha", calories: 250, protein: 5, carbs: 48, fats: 4, fiber: 2, water: 30, vitamins: "Iron: 2mg" },
    { name: "Oatmeal with Berries", calories: 280, protein: 9, carbs: 52, fats: 5, fiber: 6, water: 50, vitamins: "Vitamin C: 12mg, Calcium: 50mg" },
    { name: "Scrambled Eggs & Toast", calories: 290, protein: 14, carbs: 24, fats: 14, fiber: 2, water: 60, vitamins: "Vitamin D: 1.5mcg, B12: 1mcg" },
    { name: "Banana Pancakes", calories: 310, protein: 8, carbs: 58, fats: 6, fiber: 4, water: 45, vitamins: "Potassium: 300mg" },
    { name: "Upma", calories: 240, protein: 6, carbs: 45, fats: 4, fiber: 3, water: 35, vitamins: "Iron: 1.2mg" }
];

const lunchPool = [
    { name: "Dal & Rice", calories: 360, protein: 11, carbs: 60, fats: 8, fiber: 5, water: 90, vitamins: "Iron: 2.5mg, Folate: 50mcg" },
    { name: "Paneer Butter Masala & Roti", calories: 440, protein: 15, carbs: 42, fats: 22, fiber: 4, water: 80, vitamins: "Calcium: 200mg" },
    { name: "Vegetable Pulav & Raita", calories: 380, protein: 8, carbs: 62, fats: 10, fiber: 5, water: 100, vitamins: "Calcium: 120mg, Vit C: 10mg" },
    { name: "Spinach Pasta", calories: 410, protein: 12, carbs: 58, fats: 12, fiber: 5, water: 75, vitamins: "Iron: 3mg, Vit A: 100mcg" },
    { name: "Mixed Veg Curry & Rice", calories: 350, protein: 8, carbs: 58, fats: 9, fiber: 6, water: 95, vitamins: "Vit C: 15mg, Vit A: 80mcg" },
    { name: "Chicken Soup & Bread", calories: 320, protein: 18, carbs: 35, fats: 10, fiber: 3, water: 110, vitamins: "B12: 0.8mcg, Zinc: 2mg" }
];

const dinnerPool = [
    { name: "Chapati with Yellow Dal", calories: 330, protein: 10, carbs: 55, fats: 6, fiber: 5, water: 85, vitamins: "Iron: 2mg" },
    { name: "Khichdi & Ghee", calories: 310, protein: 9, carbs: 52, fats: 8, fiber: 4, water: 120, vitamins: "Vit A: 50mcg" },
    { name: "Grilled Chicken & Broccoli", calories: 290, protein: 22, carbs: 12, fats: 8, fiber: 4, water: 70, vitamins: "Vit C: 20mg, Vit K: 60mcg" },
    { name: "Vegetable Soup & Roll", calories: 260, protein: 7, carbs: 40, fats: 6, fiber: 5, water: 100, vitamins: "Vit A: 120mcg" },
    { name: "Tofu Stir Fry & Rice", calories: 340, protein: 12, carbs: 50, fats: 9, fiber: 5, water: 80, vitamins: "Iron: 3.2mg, Calcium: 150mg" },
    { name: "Roti with Palak Paneer", calories: 380, protein: 14, carbs: 40, fats: 14, fiber: 5, water: 90, vitamins: "Iron: 2.8mg, Calcium: 220mg" }
];

const snackPool = [
    { name: "Apple Slices", calories: 80, protein: 0.5, carbs: 20, fats: 0.2, fiber: 3, water: 50, vitamins: "Vit C: 5mg" },
    { name: "Yogurt", calories: 120, protein: 6, carbs: 12, fats: 4, fiber: 0, water: 45, vitamins: "Calcium: 180mg, Vit D: 1mcg" },
    { name: "Mixed Nuts", calories: 160, protein: 5, carbs: 6, fats: 14, fiber: 2, water: 10, vitamins: "Vit E: 4mg" },
    { name: "Carrot Sticks with Hummus", calories: 100, protein: 3, carbs: 12, fats: 4, fiber: 3, water: 35, vitamins: "Vit A: 200mcg" },
    { name: "Orange Juice", calories: 90, protein: 1, carbs: 21, fats: 0.1, fiber: 0.5, water: 60, vitamins: "Vit C: 45mg" }
];

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const parentId = new mongoose.Types.ObjectId('6a2d2b4a02b1b842e3515b84'); // Test Parent

        // 1. Find or create the profile
        let ravi = await Profile.findOne({ 
            $or: [
                { name: 'Twin Child Test', parentId },
                { name: 'Ravi', parentId }
            ]
        });

        if (!ravi) {
            console.log("Profile not found. Creating a new profile named Ravi...");
            ravi = new Profile({
                parentId,
                name: 'Ravi',
                age: 5,
                dob: new Date('2021-06-17'),
                gender: 'male',
                height: 110,
                weight: 19,
                avatar: 'rabbit',
                goals: ['Healthy weight', 'Active growth'],
                healthConditions: ['underweight']
            });
            await ravi.save();
            console.log(`✅ Created Ravi profile (ID: ${ravi._id})`);
        } else {
            console.log(`Found existing profile (ID: ${ravi._id}, Current Name: "${ravi.name}").`);
            ravi.name = 'Ravi';
            ravi.avatar = 'rabbit';
            ravi.height = 110;
            ravi.weight = 19;
            await ravi.save();
            console.log(`✅ Renamed/updated profile to "Ravi"`);
        }

        // 2. Clear old logs
        await MealLog.deleteMany({ profileId: ravi._id });
        console.log("🧹 Cleaned old meal logs for Ravi.");

        // 3. Seed 30 days of randomized logs
        const today = new Date();
        const mealLogs = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Randomly choose meal options
            const bf = { ...breakfastPool[Math.floor(Math.random() * breakfastPool.length)] };
            const lh = { ...lunchPool[Math.floor(Math.random() * lunchPool.length)] };
            const dn = { ...dinnerPool[Math.floor(Math.random() * dinnerPool.length)] };

            // Decide if we have snacks today (randomly log snack meals)
            const includeMorningSnack = Math.random() > 0.5;
            const includeAfternoonSnack = Math.random() > 0.5;

            const mSnack = includeMorningSnack ? [{ ...snackPool[Math.floor(Math.random() * snackPool.length)] }] : [];
            const aSnack = includeAfternoonSnack ? [{ ...snackPool[Math.floor(Math.random() * snackPool.length)] }] : [];

            let completedCount = 3 + (includeMorningSnack ? 1 : 0) + (includeAfternoonSnack ? 1 : 0);

            mealLogs.push({
                profileId: ravi._id,
                date: dateStr,
                breakfast: [bf],
                morningSnack: mSnack,
                lunch: [lh],
                afternoonSnack: aSnack,
                dinner: [dn],
                eveningSnack: [],
                completedMealsCount: completedCount,
                isStreakCounted: true,
                lastMealAt: date
            });
        }

        await MealLog.insertMany(mealLogs);
        console.log("✅ Inserted 30 days of randomized meal logs for Ravi.");

        await mongoose.disconnect();
        console.log("Disconnected successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
