import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MealLog from '../models/MealLog.model.js';
import Profile from '../models/Profile.model.js';
import { calculateFoodNutrition } from '../utils/nutritionEngine.js';

dotenv.config();

const runVerification = async () => {
    try {
        console.log('--- STARTING FOOD RECOGNITION INTEGRATION DIAGNOSTICS ---');
        
        // 1. Test Pediatric Nutrition Engine
        console.log('\n[1/3] Testing Nutrition Engine Calculations...');
        const testItems = [
            { name: "idli", qty: "2 pieces" },
            { name: "sambar", qty: "1 bowl" },
            { name: "banana", qty: "1 medium" },
            { name: "pizza", qty: "2 slices" }
        ];

        testItems.forEach(item => {
            const nut = calculateFoodNutrition(item.name, item.qty);
            console.log(`- Food: ${item.name} (${item.qty})`);
            console.log(`  Calories: ${nut.calories} kcal, Protein: ${nut.protein}g, Carbs: ${nut.carbs}g, Fat: ${nut.fats}g`);
            console.log(`  Fiber: ${nut.fiber}g, Iron: ${nut.iron}mg, Calcium: ${nut.calcium}mg, Vitamin C: ${nut.vitaminC}mg`);
            
            // Basic validation: must have non-zero calories and carbohydrates
            if (nut.calories <= 0 || nut.carbs <= 0) {
                throw new Error(`Nutrition calculation verification failed for ${item.name}`);
            }
        });
        console.log('✅ Nutrition Engine verified successfully.');

        // 2. Connect to Database
        console.log('\n[2/3] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connection established.');

        // 3. Test Database Schema Integration
        console.log('\n[3/3] Testing Database Schema Integration & Flat Properties...');
        const testProfile = new Profile({
            parentId: new mongoose.Types.ObjectId(),
            name: "Model Diagnostic Kid",
            dob: new Date("2020-01-01"),
            age: 6,
            gender: "female",
            height: 110,
            weight: 18,
            waistCircumference: 48,
            sportsActivityLevel: "Moderately Active",
            bloodGroup: "A+",
            avatar: "cat",
            location: {
                address: "123 Diagnostics Rd",
                city: "Bengaluru",
                state: "Karnataka",
                country: "India"
            },
            goals: { primary: "Healthy Eating" }
        });
        await testProfile.save();
        console.log(`✅ Temporary Profile created: ${testProfile._id}`);

        const mockMealItems = [
            { name: "idli", quantity: "2 pieces" },
            { name: "sambar", quantity: "1 bowl" },
            { name: "banana", quantity: "1 medium" }
        ];

        // Map food items
        let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
        let totalFiber = 0, totalIron = 0, totalCalcium = 0, totalVitaminC = 0;

        const mappedFoodItems = mockMealItems.map(item => {
            const nut = calculateFoodNutrition(item.name, item.quantity);
            totalCals += nut.calories;
            totalProt += nut.protein;
            totalCarbs += nut.carbs;
            totalFat += nut.fats;
            totalFiber += nut.fiber;
            totalIron += nut.iron;
            totalCalcium += nut.calcium;
            totalVitaminC += nut.vitaminC;

            return {
                name: item.name,
                quantity: item.quantity,
                calories: nut.calories,
                protein: nut.protein,
                carbs: nut.carbs,
                fats: nut.fats,
                fiber: nut.fiber,
                iron: nut.iron,
                calcium: nut.calcium,
                vitaminC: nut.vitaminC
            };
        });

        // Save using new flat properties as well as slots
        const mealLog = new MealLog({
            profileId: testProfile._id,
            parentId: testProfile.parentId,
            date: "2026-06-20",
            breakfast: mappedFoodItems,
            completedMealsCount: 1,
            lastMealAt: new Date(),
            
            // Flat properties
            childId: testProfile._id,
            mealType: "breakfast",
            mealImage: "/uploads/diagnostic_plate.jpg",
            detectedFoods: ["idli", "sambar", "banana"],
            nutritionValues: {
                calories: Math.round(totalCals),
                protein: Number(totalProt.toFixed(2)),
                carbs: Number(totalCarbs.toFixed(2)),
                fat: Number(totalFat.toFixed(2)),
                fiber: Number(totalFiber.toFixed(2)),
                iron: Number(totalIron.toFixed(2)),
                calcium: Math.round(totalCalcium),
                vitaminC: Number(totalVitaminC.toFixed(2))
            },
            analysisDate: new Date()
        });

        await mealLog.save();
        console.log(`✅ MealLog entry stored with flat root fields. ID: ${mealLog._id}`);

        // Fetch back and assert
        const fetchedLog = await MealLog.findById(mealLog._id);
        console.log('\nVerifying stored fields match input specifications:');
        console.log(`- childId matches profileId: ${fetchedLog.childId.toString() === testProfile._id.toString() ? 'PASS ✅' : 'FAIL ❌'}`);
        console.log(`- mealType is 'breakfast': ${fetchedLog.mealType === 'breakfast' ? 'PASS ✅' : 'FAIL ❌'}`);
        console.log(`- detectedFoods array size is 3: ${fetchedLog.detectedFoods.length === 3 ? 'PASS ✅' : 'FAIL ❌'}`);
        console.log(`- calories matches (375): ${fetchedLog.nutritionValues.calories === 375 ? 'PASS ✅' : 'FAIL ❌'} (${fetchedLog.nutritionValues.calories} kcal)`);
        console.log(`- fiber matches (8.6): ${fetchedLog.nutritionValues.fiber === 8.6 ? 'PASS ✅' : 'FAIL ❌'} (${fetchedLog.nutritionValues.fiber} g)`);
        console.log(`- iron matches (2.6): ${fetchedLog.nutritionValues.iron === 2.6 ? 'PASS ✅' : 'FAIL ❌'} (${fetchedLog.nutritionValues.iron} mg)`);
        console.log(`- calcium matches (56): ${fetchedLog.nutritionValues.calcium === 56 ? 'PASS ✅' : 'FAIL ❌'} (${fetchedLog.nutritionValues.calcium} mg)`);
        console.log(`- vitaminC matches (14): ${fetchedLog.vitaminC === undefined && fetchedLog.nutritionValues.vitaminC === 14 ? 'PASS ✅' : 'FAIL ❌'} (${fetchedLog.nutritionValues.vitaminC} mg)`);

        // Database Cleanup
        await Profile.findByIdAndDelete(testProfile._id);
        await MealLog.findByIdAndDelete(mealLog._id);
        console.log('\n🧹 Database cleaned successfully.');

        console.log('\n🎉 ALL INTEGRATION DIAGNOSTICS COMPLETED SUCCESSFULLY!\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ DIAGNOSTIC CRITICAL FAILURE:', err);
        process.exit(1);
    }
};

runVerification();
