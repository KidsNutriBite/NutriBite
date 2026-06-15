import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';

dotenv.config();

const run = async () => {
    console.log('--- STARTING NUTRIBITE TESTING PROFILE POPULATION ---');
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not set in backend .env file!");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas successfully.');

        // 1. Find or create a parent user
        let parent = await User.findOne({ role: 'parent' });
        if (!parent) {
            parent = new User({
                name: "Test Parent Explorer",
                email: "explorer.parent@nutribite.com",
                password: "Password123", // Encrypted pre-save
                role: "parent",
                title: "Mr"
            });
            await parent.save();
            console.log('✅ Created mock Parent user: explorer.parent@nutribite.com / Password123');
        } else {
            console.log(`✅ Using existing parent user ID: ${parent._id} (${parent.email})`);
        }

        // Cleanup any older test kids to prevent bloat
        const deletedStats = await Profile.deleteMany({ name: { $in: ["Iron Ranger", "Starch Kid", "Sunlight Pixie"] } });
        console.log(`🧹 Cleaned up ${deletedStats.deletedCount} older test profiles.`);

        // 2. Create Profile A: Iron Deficiency
        const kidIron = new Profile({
            parentId: parent._id,
            name: "Iron Ranger",
            age: 6,
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 6)),
            gender: "male",
            height: 112,
            weight: 18,
            avatar: "lion",
            dietaryPreferences: ["vegetarian"],
            goals: ["Improve immunity"],
            currentXP: 45,
            level: 2
        });
        await kidIron.save();
        console.log(`✅ Created Kid Profile A [IRON DEFICIENT]: Name: "Iron Ranger" | ID: ${kidIron._id}`);

        // Create low-iron meal logs for A (Oats and white rice only, missing pulses or spinach)
        const logsIron = [];
        const today = new Date();
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            logsIron.push({
                profileId: kidIron._id,
                date: date.toISOString().split('T')[0],
                breakfast: [{ name: "White bread with jam", calories: 180, protein: 2, carbs: 40, fats: 2 }],
                lunch: [{ name: "White rice and potato curry", calories: 350, protein: 4, carbs: 70, fats: 6 }],
                dinner: [{ name: "Veg chowmein", calories: 280, protein: 3, carbs: 50, fats: 8 }]
                // Total daily: Calories: 810 (Below 1400 requirement)
                // Protein: 9g (Below 19g target)
                // Iron: Extremely low (0mg)
            });
        }
        await MealLog.insertMany(logsIron);
        console.log(`   └─ Inserted 10 days of low-iron meal logs.`);

        // 3. Create Profile B: Protein Deficiency
        const kidProtein = new Profile({
            parentId: parent._id,
            name: "Starch Kid",
            age: 8,
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 8)),
            gender: "female",
            height: 125,
            weight: 22,
            avatar: "lion",
            dietaryPreferences: [],
            goals: ["Healthy weight", "Muscle growth"],
            currentXP: 10,
            level: 1
        });
        await kidProtein.save();
        console.log(`✅ Created Kid Profile B [PROTEIN DEFICIENT]: Name: "Starch Kid" | ID: ${kidProtein._id}`);

        // Create low-protein meal logs for B (eats only noodles, candies, sweet starches)
        const logsProtein = [];
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            logsProtein.push({
                profileId: kidProtein._id,
                date: date.toISOString().split('T')[0],
                breakfast: [{ name: "Frosted flakes cereal", calories: 220, protein: 1, carbs: 50, fats: 1 }],
                lunch: [{ name: "Instant noodles", calories: 380, protein: 3, carbs: 55, fats: 14 }],
                dinner: [{ name: "French fries and ketchup", calories: 320, protein: 2, carbs: 45, fats: 15 }]
                // Total daily: Calories: 920 (Below 1600 requirement)
                // Protein: 6g (Extremely deficient! Required 30g)
            });
        }
        await MealLog.insertMany(logsProtein);
        console.log(`   └─ Inserted 10 days of low-protein meal logs.`);

        // 4. Create Profile C: Vitamin D Deficiency
        const kidVitamin = new Profile({
            parentId: parent._id,
            name: "Sunlight Pixie",
            age: 4,
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 4)),
            gender: "female",
            height: 100,
            weight: 15,
            avatar: "lion",
            dietaryPreferences: ["dairy-free"],
            goals: ["Improve energy"],
            currentXP: 90,
            level: 3
        });
        await kidVitamin.save();
        console.log(`✅ Created Kid Profile C [VITAMIN D DEFICIENT]: Name: "Sunlight Pixie" | ID: ${kidVitamin._id}`);

        // Create logs for C (zero dairy, low energy fats)
        const logsVitamin = [];
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            logsVitamin.push({
                profileId: kidVitamin._id,
                date: date.toISOString().split('T')[0],
                breakfast: [{ name: "Puffed rice", calories: 100, protein: 1, carbs: 22, fats: 0.2 }],
                lunch: [{ name: "Sautéed beans", calories: 150, protein: 4, carbs: 15, fats: 2 }],
                dinner: [{ name: "Clear vegetable soup", calories: 80, protein: 1, carbs: 10, fats: 0.1 }]
                // Total daily: Calories: 330 (Severe deficiency)
                // Vitamin D: 0
            });
        }
        await MealLog.insertMany(logsVitamin);
        console.log(`   └─ Inserted 10 days of dairy-free meal logs.`);

        console.log('\n======================================================');
        console.log('🎉 PROFILE POPULATION SUCCESSFUL!');
        console.log('------------------------------------------------------');
        console.log('You can now verify the Nutrition Deficiency Analysis');
        console.log('and other features by testing the Express server routes:');
        console.log('\n1. Test Profile A (Iron Deficient):');
        console.log(`   GET http://localhost:5000/api/nutrition-analysis/${kidIron._id}`);
        console.log('\n2. Test Profile B (Protein Deficient):');
        console.log(`   GET http://localhost:5000/api/nutrition-analysis/${kidProtein._id}`);
        console.log('\n3. Test Profile C (Low Vitamin D - Sunlight exposure test):');
        console.log(`   GET http://localhost:5000/api/nutrition-analysis/${kidVitamin._id}?sunlight=5`);
        console.log('======================================================');

    } catch (err) {
        console.error('❌ POPULATION FAILED:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database.');
        process.exit(0);
    }
};

run();
