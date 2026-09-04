import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import SleepLog from '../models/SleepLog.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';

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

const HUMAN_MEALS_7YO = [
    {
        breakfast: [{ name: 'Sprouted Ragi & Banana Idlis with Coconut Chutney', quantity: '3 idlis', calories: 280, protein: 7, carbs: 52, fats: 4, fiber: 6, water: 150, vitamins: 'Iron, Vitamin C, Calcium' }],
        morningSnack: [{ name: 'Sliced Nagpur Orange & Roasted Almonds', quantity: '1 bowl', calories: 140, protein: 3, carbs: 22, fats: 5, fiber: 4, water: 180, vitamins: 'Vitamin C, Vitamin E' }],
        lunch: [{ name: 'Moong Dal Tadka with 2 Whole Wheat Phulkas & Steamed Spinach', quantity: '1 plate', calories: 420, protein: 18, carbs: 64, fats: 9, fiber: 8, water: 250, vitamins: 'Folate, Iron, Vitamin A, B-Complex' }],
        afternoonSnack: [{ name: 'Roasted Foxnut (Makhana) with Jaggery & Cow Milk', quantity: '1 cup', calories: 190, protein: 6, carbs: 28, fats: 5, fiber: 3, water: 200, vitamins: 'Calcium, Magnesium' }],
        dinner: [{ name: 'Paneer & Mixed Vegetable Khichdi with Homemade Cow Ghee', quantity: '1.5 bowls', calories: 410, protein: 16, carbs: 55, fats: 12, fiber: 6, water: 220, vitamins: 'Protein, Vitamin D3, Zinc' }],
        eveningSnack: [{ name: 'Warm Turmeric Spiced Milk', quantity: '1 small cup (150ml)', calories: 110, protein: 5, carbs: 12, fats: 4, fiber: 0, water: 150, vitamins: 'Curcumin, Calcium' }]
    },
    {
        breakfast: [{ name: 'Vegetable Vegetable Poha with Peanuts & Lemon Juice', quantity: '1 medium plate', calories: 310, protein: 8, carbs: 54, fats: 7, fiber: 5, water: 160, vitamins: 'Iron, Vitamin C, B1' }],
        morningSnack: [{ name: 'Fresh Papaya Cubes & Soaked Walnuts', quantity: '1 cup', calories: 130, protein: 3, carbs: 20, fats: 5, fiber: 3, water: 190, vitamins: 'Vitamin A, Omega-3' }],
        lunch: [{ name: 'Rajma Masala Curry with Jeera Brown Rice & Cucumber Salad', quantity: '1 plate', calories: 440, protein: 17, carbs: 68, fats: 8, fiber: 9, water: 260, vitamins: 'Iron, Potassium, Fiber' }],
        afternoonSnack: [{ name: 'Boiled Sweet Corn with Lemon & Butter', quantity: '1 cob / cup', calories: 160, protein: 4, carbs: 30, fats: 3, fiber: 4, water: 150, vitamins: 'Lutein, Zeaxanthin' }],
        dinner: [{ name: 'Palak Paneer with Whole Wheat Paratha & Homemade Dahi', quantity: '1 plate', calories: 430, protein: 19, carbs: 52, fats: 14, fiber: 7, water: 230, vitamins: 'Calcium, Iron, Vitamin A' }],
        eveningSnack: [{ name: 'Warm Milk with Crushed Cardamom', quantity: '1 cup', calories: 105, protein: 5, carbs: 11, fats: 4, fiber: 0, water: 150, vitamins: 'Calcium, Tryptophan' }]
    },
    {
        breakfast: [{ name: 'Rolled Oats Porridge with Apple Slices & Chia Seeds', quantity: '1 bowl', calories: 290, protein: 9, carbs: 48, fats: 6, fiber: 7, water: 180, vitamins: 'Beta-Glucan, Iron, Zinc' }],
        morningSnack: [{ name: 'Crisp Guava Slices with Chaat Masala', quantity: '1 whole fruit', calories: 110, protein: 2, carbs: 22, fats: 1, fiber: 6, water: 170, vitamins: 'High Vitamin C, Lycopene' }],
        lunch: [{ name: 'Toor Dal Sambhar with Steamed Idlis & Beetroot Poriyal', quantity: '1 plate', calories: 410, protein: 15, carbs: 67, fats: 6, fiber: 8, water: 250, vitamins: 'Folate, Iron, Potassium' }],
        afternoonSnack: [{ name: 'Besan Chilla (Gram Flour Pancake) with Mint Chutney', quantity: '1 chilla', calories: 180, protein: 7, carbs: 24, fats: 5, fiber: 4, water: 150, vitamins: 'Protein, B-Complex' }],
        dinner: [{ name: 'Mixed Lentil Dalia Porridge with Carrot, Beans & Peas', quantity: '1.5 bowls', calories: 380, protein: 14, carbs: 56, fats: 8, fiber: 9, water: 240, vitamins: 'Zinc, Vitamin A, B6' }],
        eveningSnack: [{ name: 'Chamomile Infused Warm Milk', quantity: '1 cup', calories: 100, protein: 4, carbs: 10, fats: 4, fiber: 0, water: 150, vitamins: 'Calcium, Calming Minerals' }]
    }
];

const HUMAN_MEALS_4YO = [
    {
        breakfast: [{ name: 'Soft Ragi Porridge with Almond Milk & Mashed Banana', quantity: '1 small bowl', calories: 220, protein: 5, carbs: 40, fats: 4, fiber: 5, water: 140, vitamins: 'Iron, Calcium, Potassium' }],
        morningSnack: [{ name: 'Steamed Apple Puree with Cinnamon', quantity: '1/2 bowl', calories: 95, protein: 1, carbs: 22, fats: 0, fiber: 3, water: 120, vitamins: 'Pectin, Vitamin C' }],
        lunch: [{ name: 'Soft Yellow Moong Dal Khichdi with Mashed Carrots & Ghee', quantity: '1 bowl', calories: 320, protein: 11, carbs: 48, fats: 7, fiber: 5, water: 200, vitamins: 'Vitamin A, Easy Protein' }],
        afternoonSnack: [{ name: 'Soft Boiled Sweet Potato Mash with Jaggery', quantity: '1/2 cup', calories: 130, protein: 2, carbs: 28, fats: 1, fiber: 3, water: 110, vitamins: 'Beta-Carotene, Fiber' }],
        dinner: [{ name: 'Soft Wheat Phulka with Moong Dal & Bottle Gourd (Lauki)', quantity: '1 small plate', calories: 290, protein: 9, carbs: 44, fats: 6, fiber: 5, water: 180, vitamins: 'Hydration, Electrolytes, Iron' }],
        eveningSnack: [{ name: 'Warm Plant-Based Milk with Nutmeg', quantity: '1 small cup (120ml)', calories: 85, protein: 3, carbs: 10, fats: 3, fiber: 0, water: 120, vitamins: 'Gentle Sleep Aid' }]
    },
    {
        breakfast: [{ name: 'Soft Vegetable Upma with Peas & Grated Carrots', quantity: '1 small bowl', calories: 210, protein: 5, carbs: 36, fats: 4, fiber: 4, water: 130, vitamins: 'Vitamin A, B-Vitamins' }],
        morningSnack: [{ name: 'Fresh Ripe Chikoo (Sapodilla) Slices', quantity: '1 fruit', calories: 100, protein: 1, carbs: 24, fats: 1, fiber: 4, water: 100, vitamins: 'Energy, Vitamin C' }],
        lunch: [{ name: 'Soft Toor Dal Rice Mash with Steamed Pumpkin & Ghee', quantity: '1 bowl', calories: 330, protein: 10, carbs: 50, fats: 8, fiber: 4, water: 190, vitamins: 'Vitamin A, Zinc' }],
        afternoonSnack: [{ name: 'Roasted Makhana Powder Porridge', quantity: '1 cup', calories: 140, protein: 4, carbs: 24, fats: 3, fiber: 2, water: 120, vitamins: 'Calcium, Iron' }],
        dinner: [{ name: 'Oats & Moong Dal Cheela with Mint Dip', quantity: '1 soft cheela', calories: 280, protein: 9, carbs: 42, fats: 6, fiber: 5, water: 170, vitamins: 'Complex Carbs, Protein' }],
        eveningSnack: [{ name: 'Warm Almond Milk with Saffron Thread', quantity: '1 cup', calories: 85, protein: 3, carbs: 9, fats: 3, fiber: 0, water: 120, vitamins: 'Restorative Minerals' }]
    }
];

async function seedComplete21DaysData() {
    console.log('🌱 Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB!');

    // 1. Create or verify Primary Parent Accounts
    const parentAccounts = [
        { email: 'parent@nutrikid.com', name: 'Sneha Sharma' },
        { email: 'parent.test@nutrikid.com', name: 'Sneha Sharma' }
    ];

    const parents = [];

    for (const p of parentAccounts) {
        let parent = await User.findOne({ email: p.email });
        if (!parent) {
            parent = new User({
                title: 'Ms',
                name: p.name,
                email: p.email,
                password: 'Password123!',
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
            console.log(`✅ Created Parent Account: ${p.name} (${p.email}) with password: Password123!`);
        } else {
            parent.password = 'Password123!';
            parent.status = 'Active';
            parent.is2FAEnabled = false;
            parent.name = p.name;
            await parent.save();
            console.log(`✅ Updated Parent Account: ${p.name} (${p.email}) with password: Password123!`);
        }
        parents.push(parent);
    }

    const mainParent = parents[0];

    // 2. Setup 2 Child Profiles with original names
    console.log('\n--- SETTING UP 2 CHILD PROFILES ---');

    // Child 1: Ananya Sharma (7yo)
    let child1 = await Profile.findOne({ parentId: mainParent._id, name: 'Ananya Sharma' });
    if (!child1) {
        child1 = await Profile.findOne({ parentId: mainParent._id });
    }

    const child1Data = {
        parentId: mainParent._id,
        name: 'Ananya Sharma',
        dob: new Date('2019-03-15'),
        age: 7,
        gender: 'female',
        bloodGroup: 'B+',
        height: 118.5,
        weight: 21.4,
        waistCircumference: 54,
        sportsActivityLevel: 'Active',
        location: {
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            address: '42 Lotus Boulevard, Indiranagar',
        },
        healthConditions: ['Peanut Allergy'],
        goals: {
            primary: 'Optimal Height Growth & Immune Resilience',
            secondary: ['Balanced Micronutrient Coverage (Iron & D3)', 'Active Sports Stamina'],
        },
        preferences: {
            favoriteFoods: 'Sprouted Ragi Idli, Moong Dal Khichdi, Paneer Wrap, Fresh Fruits, Makhana, Homemade Curd',
            dislikedFoods: 'Bitter Gourd, Excess Raw Chillies, Packaged Soda',
            favoriteFruits: 'Nagpur Oranges, Papaya, Banana, Pomegranate',
            favoriteVegetables: 'Spinach, Sweet Corn, Carrots, Green Peas, Bottle Gourd',
            favoriteSnacks: 'Roasted Makhana with Jaggery, Boiled Corn, Besan Chilla',
            waterIntake: 1750,
            activityLevel: 'high',
            sleepDuration: 9.5,
            sleepQuality: 'Good',
            eatingHabits: 'good',
            screenTime: 0.75,
        },
    };

    if (!child1) {
        child1 = await Profile.create(child1Data);
        console.log(`✅ Created Child 1: ${child1.name} (7yo, ${child1.gender})`);
    } else {
        Object.assign(child1, child1Data);
        await child1.save();
        console.log(`✅ Updated Child 1: ${child1.name} (7yo, ${child1.gender})`);
    }

    // Child 2: Aarav Sharma (4yo)
    let child2 = await Profile.findOne({ parentId: mainParent._id, name: 'Aarav Sharma' });
    const child2Data = {
        parentId: mainParent._id,
        name: 'Aarav Sharma',
        dob: new Date('2022-08-20'),
        age: 4,
        gender: 'male',
        bloodGroup: 'O+',
        height: 102.0,
        weight: 15.6,
        waistCircumference: 49,
        sportsActivityLevel: 'Moderately Active',
        location: {
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            address: '42 Lotus Boulevard, Indiranagar',
        },
        healthConditions: ['Mild Lactose Sensitivity'],
        goals: {
            primary: 'Cognitive Development & Digestive Balance',
            secondary: ['Picky Eater Nutritional Catch-up', 'Bone Density & Vitamin D3'],
        },
        preferences: {
            favoriteFoods: 'Oatmeal Porridge, Moong Dal Khichdi, Mashed Sweet Potato, Banana, Poha',
            dislikedFoods: 'Spicy Gravies, Whole Large Nuts, Raw Tomatoes',
            favoriteFruits: 'Ripe Banana, Chikoo, Sweet Apple Puree, Mango',
            favoriteVegetables: 'Mashed Pumpkin, Steamed Carrots, Boiled Peas, Bottle Gourd',
            favoriteSnacks: 'Roasted Makhana Powder Porridge, Fruit Puree, Oats Cheela',
            waterIntake: 1300,
            activityLevel: 'moderate',
            sleepDuration: 10.2,
            sleepQuality: 'Good',
            eatingHabits: 'average',
            screenTime: 0.5,
        },
    };

    if (!child2) {
        child2 = await Profile.create(child2Data);
        console.log(`✅ Created Child 2: ${child2.name} (4yo, ${child2.gender})`);
    } else {
        Object.assign(child2, child2Data);
        await child2.save();
        console.log(`✅ Updated Child 2: ${child2.name} (4yo, ${child2.gender})`);
    }

    // Sync profiles to secondary parent account if present
    for (const p of parents) {
        if (p._id.toString() !== mainParent._id.toString()) {
            await Profile.findOneAndUpdate(
                { parentId: p._id, name: 'Ananya Sharma' },
                { ...child1Data, parentId: p._id },
                { upsert: true, new: true }
            );
            await Profile.findOneAndUpdate(
                { parentId: p._id, name: 'Aarav Sharma' },
                { ...child2Data, parentId: p._id },
                { upsert: true, new: true }
            );
            console.log(`✅ Synced child profiles to secondary parent: ${p.email}`);
        }
    }

    // 3. Clear old logs for these children and seed 21 FULL DAYS (Day -20 to Day 0)
    console.log('\n--- SEEDING 21 CONSECUTIVE DAYS OF REALISTIC HUMAN LOGS ---');

    const children = [
        { profile: child1, templates: HUMAN_MEALS_7YO, targetCal: 1550, sleepTime: '21:00', wakeTime: '06:30', sleepHrs: 9.5, actType: 'Cycling & Playground', actMins: 60 },
        { profile: child2, templates: HUMAN_MEALS_4YO, targetCal: 1250, sleepTime: '20:30', wakeTime: '06:45', sleepHrs: 10.25, actType: 'Outdoor Play & Running', actMins: 45 }
    ];

    for (const item of children) {
        const pId = item.profile._id;
        console.log(`\nLogging 21 days for ${item.profile.name} (ID: ${pId})...`);

        await MealLog.deleteMany({ profileId: pId });
        await SleepLog.deleteMany({ profileId: pId });
        await ActivityLog.deleteMany({ profileId: pId });
        await GrowthRecord.deleteMany({ childId: pId });

        // A. 21 Days of Meals, Sleep, and Activity
        for (let daysAgo = 20; daysAgo >= 0; daysAgo--) {
            const dateStr = getDateStr(daysAgo);
            const template = item.templates[daysAgo % item.templates.length];

            // 1. Meal Log
            const mealDoc = {
                profileId: pId,
                parentId: mainParent._id,
                date: dateStr,
                mealTimes: {
                    breakfast: '08:15',
                    morningSnack: '11:00',
                    lunch: '13:30',
                    afternoonSnack: '17:00',
                    dinner: '20:00',
                    eveningSnack: '21:15'
                },
                mealMacros: {
                    breakfast: { calories: template.breakfast[0].calories, protein: template.breakfast[0].protein, carbs: template.breakfast[0].carbs, fat: template.breakfast[0].fats },
                    morningSnack: { calories: template.morningSnack[0].calories, protein: template.morningSnack[0].protein, carbs: template.morningSnack[0].carbs, fat: template.morningSnack[0].fats },
                    lunch: { calories: template.lunch[0].calories, protein: template.lunch[0].protein, carbs: template.lunch[0].carbs, fat: template.lunch[0].fats },
                    afternoonSnack: { calories: template.afternoonSnack[0].calories, protein: template.afternoonSnack[0].protein, carbs: template.afternoonSnack[0].carbs, fat: template.afternoonSnack[0].fats },
                    dinner: { calories: template.dinner[0].calories, protein: template.dinner[0].protein, carbs: template.dinner[0].carbs, fat: template.dinner[0].fats },
                    eveningSnack: { calories: template.eveningSnack[0].calories, protein: template.eveningSnack[0].protein, carbs: template.eveningSnack[0].carbs, fat: template.eveningSnack[0].fats }
                },
                breakfast: template.breakfast,
                morningSnack: template.morningSnack,
                lunch: template.lunch,
                afternoonSnack: template.afternoonSnack,
                dinner: template.dinner,
                eveningSnack: template.eveningSnack,
                completedMealsCount: 6,
                isStreakCounted: true,
                lastMealAt: new Date(`${dateStr}T20:30:00Z`)
            };

            await MealLog.create(mealDoc);

            // 2. Sleep Log
            const sleepVariance = ((daysAgo % 3) * 0.25);
            const actualSleep = Number((item.sleepHrs + sleepVariance - 0.25).toFixed(2));
            await SleepLog.create({
                profileId: pId,
                date: dateStr,
                sleepTime: item.sleepTime,
                wakeUpTime: item.wakeTime,
                totalSleepHours: actualSleep,
                status: 'healthy',
                notes: daysAgo === 0 ? 'Slept peacefully, refreshed morning!' : 'Good deep sleep cycle without interruptions.'
            });

            // 3. Activity Log
            const activityDuration = item.actMins + ((daysAgo % 4) * 5);
            await ActivityLog.create({
                profileId: pId,
                date: dateStr,
                activities: [
                    { type: 'Outdoor Play', duration: Math.floor(activityDuration * 0.6), notes: 'Park games, running with friends' },
                    { type: item.actType.includes('Cycling') ? 'Cycling' : 'Playing', duration: Math.ceil(activityDuration * 0.4), notes: 'Evening active play' }
                ],
                totalDuration: activityDuration,
                status: 'Active'
            });
        }

        // B. Historical Growth Records (Tracked over months)
        const growthPoints = [
            { monthsAgo: 6, h: item.profile.height - 3.2, w: item.profile.weight - 1.1 },
            { monthsAgo: 3, h: item.profile.height - 1.5, w: item.profile.weight - 0.5 },
            { monthsAgo: 1, h: item.profile.height - 0.4, w: item.profile.weight - 0.1 },
            { monthsAgo: 0, h: item.profile.height, w: item.profile.weight }
        ];

        for (const gp of growthPoints) {
            const recDate = new Date();
            recDate.setMonth(recDate.getMonth() - gp.monthsAgo);
            const heightM = gp.h / 100;
            const bmi = Number((gp.w / (heightM * heightM)).toFixed(2));

            await GrowthRecord.create({
                childId: pId,
                height: gp.h,
                weight: gp.w,
                waistCircumference: item.profile.waistCircumference,
                bmi: bmi,
                percentile: 65,
                riskStatus: 'normal',
                ageInMonths: (item.profile.age * 12) - gp.monthsAgo,
                recordedByRole: 'parent',
                recordedByUserId: mainParent._id,
                verified: true,
                notes: gp.monthsAgo === 0 ? 'Latest checkup measurements' : `Quarterly growth checkup (-${gp.monthsAgo} months)`,
                timestamp: recDate
            });
        }

        console.log(`✅ Logged 21 full days of Meals (6 slots/day), Sleep, Activity, and Growth Records for ${item.profile.name}`);
    }

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETE! PARENT LOGIN CREDENTIALS:');
    console.log('📧 Email:    parent@nutrikid.com  (or parent.test@nutrikid.com)');
    console.log('🔑 Password: Password123!');
    console.log('👦 Children: Ananya Sharma (7yo) & Aarav Sharma (4yo)');
    console.log('📊 Logs:     21 Days of complete human meals, sleep & activities');
    console.log('======================================================\n');

    await mongoose.disconnect();
}

seedComplete21DaysData().catch(err => {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
});
