import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { analyzeNutrition } from '../services/nutritionService.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a dummy profile
        const profile = new Profile({
            parentId: new mongoose.Types.ObjectId(), // Dummy User ID
            name: "Test Child",
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 6)), // 6 years old
            age: 6,
            gender: "male",
            height: 110,
            weight: 20,
            waistCircumference: 50,
            avatar: "lion",
        });
        await profile.save();
        console.log('Dummy profile created:', profile._id);

        // Create some dummy meal logs
        const today = new Date();
        const logs = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            logs.push({
                profileId: profile._id,
                date: date.toISOString().split('T')[0],
                breakfast: [{ name: "Oats", calories: 200, protein: 5, carbs: 30, fats: 5, vitamins: "iron: 2mg" }],
                lunch: [{ name: "Rice and Dal", calories: 300, protein: 10, carbs: 50, fats: 5 }],
                dinner: [{ name: "Vegetable Soup", calories: 150, protein: 3, carbs: 20, fats: 2 }]
                // Total daily: Calories: 650, Protein: 18, Carbs: 100, Fats: 12, Iron: 2
                // Expected required for 6 yo: Calories: 1400, Protein: 19, Iron: 10, Carbs: 130, Fats: 45
                // Deficient in everything!
            });
        }
        await MealLog.insertMany(logs);
        console.log('Dummy meal logs created');

        // Run the service
        const analysis = await analyzeNutrition(profile._id, 10); // 10 mins sunlight (Low Vitamin D)
        console.log('\n--- NUTRITION ANALYSIS RESULT ---\n');
        console.log(JSON.stringify(analysis, null, 2));

        // Cleanup
        await Profile.findByIdAndDelete(profile._id);
        await MealLog.deleteMany({ profileId: profile._id });
        console.log('\nCleanup successful');
        process.exit(0);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

runTest();
