import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import SleepLog from '../models/SleepLog.model.js';
import ActivityLog from '../models/ActivityLog.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

function getDateStr(daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function seedParentData() {
    console.log('🌱 Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    // 1. Create or ensure test parent account
    let parent = await User.findOne({ email: 'parent.test@nutrikid.com' });

    if (!parent) {
        parent = new User({
            title: 'Ms',
            name: 'Sneha Sharma',
            email: 'parent.test@nutrikid.com',
            password: 'ParentPassword123!',
            role: 'parent',
            status: 'Active',
            is2FAEnabled: false,
            parentProfile: {
                phoneNumber: '9876543210',
                city: 'Bengaluru',
                relationToChild: 'Mother',
            },
        });
        await parent.save();
        console.log('✅ Created Parent Account: Sneha Sharma (parent.test@nutrikid.com)');
    } else {
        parent.password = 'ParentPassword123!';
        parent.status = 'Active';
        parent.is2FAEnabled = false;
        parent.name = 'Sneha Sharma';
        await parent.save();
        console.log('✅ Verified Parent Account: Sneha Sharma (parent.test@nutrikid.com)');
    }

    // 2. Create or update Child Profile 1: Leo Sharma
    let child1 = await Profile.findOne({ parentId: parent._id, name: 'Leo Sharma' });
    if (!child1) {
        child1 = await Profile.findOne({ parentId: parent._id });
    }

    if (!child1) {
        child1 = await Profile.create({
            parentId: parent._id,
            name: 'Leo Sharma',
            dob: new Date('2021-05-10'),
            age: 5,
            gender: 'male',
            bloodGroup: 'O+',
            height: 110,
            weight: 18.5,
            waistCircumference: 52,
            sportsActivityLevel: 'Active',
            location: {
                country: 'India',
                state: 'Karnataka',
                city: 'Bengaluru',
                address: '123 Green Park Layout',
            },
            healthConditions: [],
            goals: {
                primary: 'Optimal Height Growth & Lean Muscle Support',
                secondary: ['Strong Immune Defense', 'Digestive Health'],
            },
            preferences: {
                favoriteFoods: 'Oatmeal, Fresh Fruits, Paneer, Lentil Khichdi, Yogurt',
                dislikedFoods: 'Bitter Gourd, Excess Spicy Food',
                favoriteFruits: 'Banana, Apple, Strawberries',
                favoriteVegetables: 'Carrots, Peas, Spinach',
                waterIntake: 1400,
                activityLevel: 'moderate',
                sleepDuration: 9.5,
                sleepQuality: 'Good',
                eatingHabits: 'good',
            },
        });
        console.log('✅ Created Child Profile: Leo Sharma (Age 5)');
    } else {
        child1.name = 'Leo Sharma';
        child1.age = 5;
        child1.gender = 'male';
        child1.dob = new Date('2021-05-10');
        child1.height = 110;
        child1.weight = 18.5;
        child1.waistCircumference = 52;
        child1.bloodGroup = 'O+';
        child1.goals = {
            primary: 'Optimal Height Growth & Lean Muscle Support',
            secondary: ['Strong Immune Defense', 'Digestive Health'],
        };
        await child1.save();
        console.log('✅ Updated Child Profile: Leo Sharma');
    }

    // 3. Populate 7 Days of Rich Daily Meal Logs for Leo
    console.log('\n🍛 Populating 7 Days of Detailed Meal Logs for Leo Sharma...');
    await MealLog.deleteMany({ profileId: child1._id });

    const sampleMealDays = [
        {
            daysAgo: 0, // Today
            breakfast: [
                { name: 'Warm Rolled Oats Porridge with Milk & Blueberries', quantity: '1 bowl (200g)', calories: 280, protein: 9, carbs: 48, fats: 5, fiber: 6, vitamins: 'Vitamin B, Iron' },
                { name: 'Boiled Egg (Free Range)', quantity: '1 egg', calories: 75, protein: 6.5, carbs: 0.5, fats: 5, fiber: 0, vitamins: 'Choline, Vitamin D' },
            ],
            morningSnack: [
                { name: 'Ripe Robusta Banana', quantity: '1 medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.3, fiber: 3.1, vitamins: 'Potassium, Vitamin B6' },
            ],
            lunch: [
                { name: 'Moong Dal Khichdi with Ghee', quantity: '1.5 cups', calories: 340, protein: 12, carbs: 54, fats: 8, fiber: 5.5, vitamins: 'Folate, Zinc' },
                { name: 'Steamed Carrot & Green Pea Puree', quantity: '1 small cup', calories: 60, protein: 2, carbs: 12, fats: 0.5, fiber: 3, vitamins: 'Vitamin A, Vitamin K' },
                { name: 'Fresh Homemade Set Curd / Yogurt', quantity: '1 small bowl (100g)', calories: 65, protein: 3.8, carbs: 4.5, fats: 3.5, fiber: 0, vitamins: 'Calcium, Probiotics' },
            ],
            afternoonSnack: [
                { name: 'Crisp Apple Slices with Almond Butter', quantity: '1 apple + 1 tsp butter', calories: 160, protein: 3.5, carbs: 22, fats: 7, fiber: 4.2, vitamins: 'Vitamin C, Vitamin E' },
            ],
            dinner: [
                { name: 'Soft Whole Wheat Phulka Roti', quantity: '2 rotis', calories: 160, protein: 5, carbs: 32, fats: 1.5, fiber: 4, vitamins: 'B Vitamins' },
                { name: 'Mild Spinach & Paneer Bhurji', quantity: '1 cup (120g)', calories: 210, protein: 12, carbs: 6, fats: 15, fiber: 2.8, vitamins: 'Calcium, Iron, Vitamin A' },
            ],
            eveningSnack: [
                { name: 'Warm Turmeric Milk', quantity: '1 cup (150ml)', calories: 100, protein: 5, carbs: 8, fats: 5, fiber: 0, vitamins: 'Calcium, Curcumin' },
            ],
        },
        {
            daysAgo: 1, // Yesterday
            breakfast: [
                { name: 'Steamed Rava Idlis with Coconut Chutney', quantity: '3 small idlis', calories: 240, protein: 7, carbs: 44, fats: 4, fiber: 3, vitamins: 'Iron, B1' },
                { name: 'Warm Cow Milk with Cocoa', quantity: '1 cup (150ml)', calories: 110, protein: 5.5, carbs: 12, fats: 4.5, fiber: 0.5, vitamins: 'Calcium, Vitamin D' },
            ],
            morningSnack: [
                { name: 'Fresh Sweet Papaya Cubes', quantity: '1 cup', calories: 60, protein: 1, carbs: 15, fats: 0.2, fiber: 2.5, vitamins: 'Vitamin C, Papain' },
            ],
            lunch: [
                { name: 'Brown Rice with Toor Dal', quantity: '1 cup rice + 1 cup dal', calories: 350, protein: 13, carbs: 62, fats: 5, fiber: 6, vitamins: 'Protein, Folate' },
                { name: 'Stir Fried French Beans with Grated Coconut', quantity: '1 cup', calories: 90, protein: 2.5, carbs: 10, fats: 4.5, fiber: 3.5, vitamins: 'Fiber, Vitamin K' },
            ],
            afternoonSnack: [
                { name: 'Roasted Foxnuts (Makhana) with Ghee', quantity: '1 large bowl (30g)', calories: 120, protein: 3.2, carbs: 20, fats: 3, fiber: 2.5, vitamins: 'Magnesium, Calcium' },
            ],
            dinner: [
                { name: 'Vegetable Dosa with Mild Sambar', quantity: '2 dosas', calories: 310, protein: 8.5, carbs: 52, fats: 7, fiber: 4.5, vitamins: 'Folate, Iron' },
            ],
            eveningSnack: [
                { name: 'Almond Milk with Cardamom', quantity: '1 small cup', calories: 80, protein: 2, carbs: 6, fats: 5, fiber: 1, vitamins: 'Vitamin E' },
            ],
        },
        {
            daysAgo: 2,
            breakfast: [
                { name: 'Multi-grain Vegetable Pancakes (Cheela)', quantity: '2 small cheelas', calories: 220, protein: 8, carbs: 32, fats: 6, fiber: 4.5, vitamins: 'Iron, Protein' },
                { name: 'Pomegranate Seeds', quantity: '1/2 cup', calories: 70, protein: 1.5, carbs: 16, fats: 0.5, fiber: 3, vitamins: 'Antioxidants, Vitamin C' },
            ],
            morningSnack: [
                { name: 'Orange Wedges', quantity: '1 orange', calories: 65, protein: 1.2, carbs: 15, fats: 0.2, fiber: 3.1, vitamins: 'Vitamin C' },
            ],
            lunch: [
                { name: 'Paneer Vegetable Pulao with Mint Raita', quantity: '1.5 cups', calories: 380, protein: 14, carbs: 52, fats: 12, fiber: 4.5, vitamins: 'Calcium, Protein' },
            ],
            afternoonSnack: [
                { name: 'Boiled Sweet Corn with Butter', quantity: '1 cup', calories: 140, protein: 4, carbs: 26, fats: 3, fiber: 3.5, vitamins: 'Lutein, Fiber' },
            ],
            dinner: [
                { name: 'Methi (Fenugreek) Roti with Yellow Dal', quantity: '2 rotis + 1 cup dal', calories: 320, protein: 11, carbs: 54, fats: 6, fiber: 6, vitamins: 'Iron, Calcium' },
            ],
            eveningSnack: [
                { name: 'Warm Milk with Honey', quantity: '150ml', calories: 110, protein: 5, carbs: 12, fats: 4.5, fiber: 0, vitamins: 'Calcium' },
            ],
        },
        {
            daysAgo: 3,
            breakfast: [
                { name: 'Whole Wheat French Toast with Strawberries', quantity: '2 slices', calories: 260, protein: 9, carbs: 36, fats: 8, fiber: 3.5, vitamins: 'Choline, Vitamin C' },
            ],
            morningSnack: [
                { name: 'Roasted Pumpkin & Sunflower Seeds', quantity: '2 tbsp', calories: 95, protein: 4, carbs: 4, fats: 7.5, fiber: 1.5, vitamins: 'Zinc, Magnesium' },
            ],
            lunch: [
                { name: 'Steamed Rice with Tomato Rasam & Dal', quantity: '1 plate', calories: 330, protein: 9.5, carbs: 64, fats: 4, fiber: 4, vitamins: 'Vitamin C, Lycopene' },
                { name: 'Avocado and Cucumber Salad', quantity: '1 small bowl', calories: 110, protein: 1.8, carbs: 7, fats: 9, fiber: 4, vitamins: 'Healthy Fats, Vitamin E' },
            ],
            afternoonSnack: [
                { name: 'Guava Slices with Rock Salt', quantity: '1 guava', calories: 45, protein: 2, carbs: 10, fats: 0.5, fiber: 4.5, vitamins: 'Super Vitamin C' },
            ],
            dinner: [
                { name: 'Vegetable Vermicelli Upma with Peanuts', quantity: '1.5 cups', calories: 290, protein: 7.5, carbs: 48, fats: 7, fiber: 4, vitamins: 'B Vitamins' },
            ],
            eveningSnack: [
                { name: 'Milk with Saffron & Crushed Walnuts', quantity: '150ml', calories: 130, protein: 6, carbs: 8, fats: 8, fiber: 1, vitamins: 'Omega-3' },
            ],
        },
        {
            daysAgo: 4,
            breakfast: [
                { name: 'Ragi (Finger Millet) Dosa with Mint Chutney', quantity: '2 dosas', calories: 230, protein: 6, carbs: 42, fats: 4, fiber: 5.5, vitamins: 'High Calcium, Iron' },
            ],
            morningSnack: [
                { name: 'Chikoo (Sapodilla) Milkshake', quantity: '1 small glass', calories: 130, protein: 4, carbs: 22, fats: 3.5, fiber: 2, vitamins: 'Energy, Fiber' },
            ],
            lunch: [
                { name: 'Chapati with Rajma (Kidney Beans) Curry', quantity: '2 rotis + 1 cup rajma', calories: 390, protein: 15, carbs: 62, fats: 7, fiber: 9, vitamins: 'Iron, Protein, Fiber' },
            ],
            afternoonSnack: [
                { name: 'Homemade Trail Mix (Raisins & Almonds)', quantity: '30g', calories: 140, protein: 3.5, carbs: 18, fats: 6.5, fiber: 2.5, vitamins: 'Antioxidants' },
            ],
            dinner: [
                { name: 'Vegetable Khichdi with Moong & Ghee', quantity: '1.5 cups', calories: 330, protein: 11, carbs: 52, fats: 8, fiber: 5, vitamins: 'Digestive' },
            ],
            eveningSnack: [
                { name: 'Warm Milk', quantity: '150ml', calories: 95, protein: 4.8, carbs: 7, fats: 4.5, fiber: 0, vitamins: 'Calcium' },
            ],
        },
        {
            daysAgo: 5,
            breakfast: [
                { name: 'Scrambled Eggs on Whole Wheat Bread', quantity: '2 slices + 1 egg', calories: 270, protein: 12, carbs: 28, fats: 11, fiber: 3, vitamins: 'Protein, Choline' },
            ],
            morningSnack: [
                { name: 'Sweet Watermelon Cubes', quantity: '1 bowl', calories: 50, protein: 1, carbs: 12, fats: 0.2, fiber: 1, vitamins: 'Hydration, Lycopene' },
            ],
            lunch: [
                { name: 'Jeera Rice with Chana Masala & Curd', quantity: '1 plate', calories: 410, protein: 14.5, carbs: 68, fats: 9, fiber: 8.5, vitamins: 'Folate, Iron' },
            ],
            afternoonSnack: [
                { name: 'Steamed Sweet Potato with Cinnamon', quantity: '1 medium', calories: 110, protein: 2, carbs: 26, fats: 0.2, fiber: 3.8, vitamins: 'Vitamin A (Beta-Carotene)' },
            ],
            dinner: [
                { name: 'Paneer Paratha with Light Mint Curd', quantity: '1 paratha', calories: 340, protein: 13, carbs: 36, fats: 15, fiber: 3.5, vitamins: 'Calcium, Protein' },
            ],
            eveningSnack: [
                { name: 'Turmeric Golden Milk', quantity: '150ml', calories: 100, protein: 5, carbs: 8, fats: 5, fiber: 0, vitamins: 'Immunity' },
            ],
        },
        {
            daysAgo: 6,
            breakfast: [
                { name: 'Poha with Green Peas, Carrots & Peanuts', quantity: '1 plate (150g)', calories: 250, protein: 6.5, carbs: 42, fats: 6, fiber: 3.5, vitamins: 'Iron, Vitamin B' },
            ],
            morningSnack: [
                { name: 'Fresh Strawberries with Yogurt Dip', quantity: '1 cup', calories: 75, protein: 3, carbs: 12, fats: 1.5, fiber: 2.5, vitamins: 'Vitamin C, Probiotics' },
            ],
            lunch: [
                { name: 'Roti with Mixed Veg Dal Tadka & Salad', quantity: '2 rotis + 1 cup dal', calories: 340, protein: 12, carbs: 54, fats: 7, fiber: 6.5, vitamins: 'Complex Carbs, Iron' },
            ],
            afternoonSnack: [
                { name: 'Banana Oat Energy Cookies (Homemade)', quantity: '2 cookies', calories: 150, protein: 3.5, carbs: 26, fats: 4, fiber: 3, vitamins: 'Clean Energy' },
            ],
            dinner: [
                { name: 'Steamed Rice with Sambar & Beetroot Poriyal', quantity: '1 plate', calories: 320, protein: 9, carbs: 60, fats: 4.5, fiber: 5.5, vitamins: 'Antioxidants, Folate' },
            ],
            eveningSnack: [
                { name: 'Warm Milk with Honey', quantity: '150ml', calories: 105, protein: 5, carbs: 10, fats: 4.5, fiber: 0, vitamins: 'Calcium' },
            ],
        },
    ];

    for (const dayData of sampleMealDays) {
        const dateStr = getDateStr(dayData.daysAgo);
        
        // Calculate macros
        const calcMacros = (items = []) => items.reduce((acc, item) => ({
            calories: acc.calories + (item.calories || 0),
            protein: acc.protein + (item.protein || 0),
            carbs: acc.carbs + (item.carbs || 0),
            fat: acc.fat + (item.fats || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const bMacros = calcMacros(dayData.breakfast);
        const msMacros = calcMacros(dayData.morningSnack);
        const lMacros = calcMacros(dayData.lunch);
        const asMacros = calcMacros(dayData.afternoonSnack);
        const dMacros = calcMacros(dayData.dinner);
        const esMacros = calcMacros(dayData.eveningSnack);

        const totalCals = bMacros.calories + msMacros.calories + lMacros.calories + asMacros.calories + dMacros.calories + esMacros.calories;

        await MealLog.create({
            profileId: child1._id,
            parentId: parent._id,
            date: dateStr,
            mealTimes: {
                breakfast: '08:15 AM',
                morningSnack: '11:00 AM',
                lunch: '01:15 PM',
                afternoonSnack: '04:45 PM',
                dinner: '07:45 PM',
                eveningSnack: '09:00 PM',
            },
            mealMacros: {
                breakfast: bMacros,
                morningSnack: msMacros,
                lunch: lMacros,
                afternoonSnack: asMacros,
                dinner: dMacros,
                eveningSnack: esMacros,
            },
            breakfast: dayData.breakfast,
            morningSnack: dayData.morningSnack,
            lunch: dayData.lunch,
            afternoonSnack: dayData.afternoonSnack,
            dinner: dayData.dinner,
            eveningSnack: dayData.eveningSnack,
            completedMealsCount: 6,
            isStreakCounted: true,
            lastMealAt: new Date(),
        });
        console.log(`  ✓ Logged 6 meals for ${dateStr} (Total: ${totalCals} kcal)`);
    }

    // 4. Populate Growth Records for Leo
    console.log('\n📈 Populating Historical Growth Records for Leo Sharma...');
    await GrowthRecord.deleteMany({ childId: child1._id });

    const growthHistory = [
        { height: 102.0, weight: 15.8, waistCircumference: 48, bmi: 15.2, percentile: 50, daysAgo: 365, ageMonths: 48 },
        { height: 104.5, weight: 16.5, waistCircumference: 49, bmi: 15.1, percentile: 52, daysAgo: 270, ageMonths: 51 },
        { height: 106.8, weight: 17.2, waistCircumference: 50, bmi: 15.1, percentile: 53, daysAgo: 180, ageMonths: 54 },
        { height: 108.5, weight: 17.8, waistCircumference: 51, bmi: 15.1, percentile: 54, daysAgo: 90, ageMonths: 57 },
        { height: 110.0, weight: 18.5, waistCircumference: 52, bmi: 15.3, percentile: 56, daysAgo: 0, ageMonths: 60 },
    ];

    for (const g of growthHistory) {
        const d = new Date();
        d.setDate(d.getDate() - g.daysAgo);
        await GrowthRecord.create({
            childId: child1._id,
            height: g.height,
            weight: g.weight,
            waistCircumference: g.waistCircumference,
            bmi: g.bmi,
            percentile: g.percentile,
            riskStatus: 'normal',
            ageInMonths: g.ageMonths,
            recordedByRole: 'parent',
            recordedByUserId: parent._id,
            verified: true,
            notes: 'Consistent linear growth along standard 55th percentile curve.',
            timestamp: d,
        });
    }
    console.log(`  ✓ Created ${growthHistory.length} historical growth checkpoints.`);

    // 5. Populate Sleep Logs for Leo
    console.log('\n😴 Populating Sleep History for Leo Sharma...');
    await SleepLog.deleteMany({ profileId: child1._id });

    for (let i = 0; i < 7; i++) {
        const dateStr = getDateStr(i);
        await SleepLog.create({
            profileId: child1._id,
            date: dateStr,
            sleepTime: '21:00',
            wakeUpTime: '06:30',
            totalSleepHours: 9.5,
            status: 'healthy',
            notes: 'Slept soundly for 9.5 hours.',
        });
    }
    console.log('  ✓ Created 7 days of sleep logs.');

    // 6. Populate Activity Logs for Leo
    console.log('\n🏃 Populating Activity Logs for Leo Sharma...');
    await ActivityLog.deleteMany({ profileId: child1._id });

    for (let i = 0; i < 7; i++) {
        const dateStr = getDateStr(i);
        await ActivityLog.create({
            profileId: child1._id,
            date: dateStr,
            activities: [
                { type: 'Outdoor Play', duration: 45, notes: 'Green park playground games' },
                { type: 'Cycling', duration: 30, notes: 'Evening cycling around community' },
            ],
            totalDuration: 75,
            status: 'Active',
        });
    }
    console.log('  ✓ Created 7 days of activity records.');

    console.log('\n====================================================');
    console.log('🎉 PARENT MODE SEEDING COMPLETE!');
    console.log('====================================================');
    console.log('Email:    parent.test@nutrikid.com');
    console.log('Password: ParentPassword123!');
    console.log('Child:    Leo Sharma (Age 5, 110cm, 18.5kg)');
    console.log('Meals:    7 Days of Breakfast, Lunch, Snacks & Dinner');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
}

seedParentData().catch(err => {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
});
