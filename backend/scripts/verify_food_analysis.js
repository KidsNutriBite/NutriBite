import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import { computeWellnessAnalysis } from '../utils/wellnessEngine.js';

dotenv.config();

const runValidation = async () => {
    try {
        console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB successfully.');

        // 1. Create a dummy child profile for testing
        // Standard recommended protein for 8 years old = 25g
        const testChild = new Profile({
            parentId: new mongoose.Types.ObjectId(),
            name: "Rahul Test",
            dob: new Date(new Date().setFullYear(new Date().getFullYear() - 8)), // 8 years old
            age: 8,
            gender: "male",
            height: 115,
            weight: 22,
            waistCircumference: 52,
            sportsActivityLevel: "Moderately Active",
            avatar: "bear",
            bloodGroup: "O+",
            location: {
                address: "123 Test Street",
                city: "Bengaluru",
                state: "Karnataka",
                country: "India"
            },
            goals: {
                primary: "Healthy Eating"
            }
        });
        await testChild.save();
        console.log('✅ Dummy child profile created. ID:', testChild._id);

        // 2. Create mock meal logs representing 3 days of meal entries
        // Day 1: Low protein, low vegetables, and high junk food frequency (e.g. Maggi, Samosa)
        // Day 2: Low protein, low vegetables, and junk food (Noodles)
        // Day 3: Low protein, low vegetables, and junk food (Pav Bhaji)
        const mockLogs = [
            {
                profileId: testChild._id,
                parentId: testChild.parentId,
                date: "2026-06-18",
                mealTimes: {
                    breakfast: "08:15",
                    lunch: "13:30",
                    dinner: "20:45"
                },
                mealMacros: {
                    breakfast: { calories: 250, protein: 3, carbs: 40, fat: 8 },
                    lunch: { calories: 350, protein: 4, carbs: 55, fat: 12 },
                    dinner: { calories: 400, protein: 5, carbs: 60, fat: 14 }
                },
                breakfast: [
                    { name: "Maggi / Noodles", quantity: "1 bowl", calories: 250, protein: 3, carbs: 40, fats: 8 }
                ],
                lunch: [
                    { name: "Samosa", quantity: "2 pieces", calories: 350, protein: 4, carbs: 55, fats: 12 }
                ],
                dinner: [
                    { name: "White Rice", quantity: "1 bowl", calories: 400, protein: 5, carbs: 60, fats: 14 }
                ],
                completedMealsCount: 3
            },
            {
                profileId: testChild._id,
                parentId: testChild.parentId,
                date: "2026-06-19",
                mealTimes: {
                    breakfast: "08:00",
                    lunch: "13:00"
                },
                mealMacros: {
                    breakfast: { calories: 200, protein: 2, carbs: 35, fat: 6 },
                    lunch: { calories: 350, protein: 4, carbs: 50, fat: 10 }
                },
                breakfast: [
                    { name: "Marie Biscuits", quantity: "4 pieces", calories: 200, protein: 2, carbs: 35, fats: 6 }
                ],
                lunch: [
                    { name: "Maggi / Noodles", quantity: "1 bowl", calories: 350, protein: 4, carbs: 50, fats: 10 }
                ],
                completedMealsCount: 2
            },
            {
                profileId: testChild._id,
                parentId: testChild.parentId,
                date: "2026-06-20",
                mealTimes: {
                    lunch: "13:15",
                    dinner: "20:00"
                },
                mealMacros: {
                    lunch: { calories: 400, protein: 5, carbs: 55, fat: 15 },
                    dinner: { calories: 300, protein: 4, carbs: 45, fat: 10 }
                },
                lunch: [
                    { name: "Pav Bhaji", quantity: "1 plate", calories: 400, protein: 5, carbs: 55, fats: 15 }
                ],
                dinner: [
                    { name: "Plain Rice", quantity: "1 bowl", calories: 300, protein: 4, carbs: 45, fats: 10 }
                ],
                completedMealsCount: 2
            }
        ];

        await MealLog.insertMany(mockLogs);
        console.log('✅ Mock meal logs populated in database.');

        // 3. Retrieve logs back to simulate query
        const fetchedLogs = await MealLog.find({ profileId: testChild._id });
        console.log(`✅ Queried ${fetchedLogs.length} logs for Rahul.`);

        // 4. Compute Wellness Score and Deficits
        console.log('\n--- Running Wellness Engine Evaluation ---');
        const wellness = computeWellnessAnalysis(testChild.toObject(), fetchedLogs);
        console.log('Wellness Score (out of 100):', wellness.score);
        console.log('\nStrengths detected:', wellness.strengths.map(s => s.strength));
        console.log('\nConcerns / Risks flagged:');
        wellness.concerns.forEach(c => {
            console.log(`⚠️  ${c.issue}`);
            console.log(`   Why it matters: ${c.whyItMatters}`);
            console.log(`   Clinical Impact: ${c.healthImpact}`);
            console.log(`   Priority: ${c.priority}`);
            console.log('---------------------------------------------');
        });

        // 5. Assertions/Validation checks
        const hasProteinRisk = wellness.concerns.some(c => c.issue.includes('Protein Risk'));
        const hasVeggiesRisk = wellness.concerns.some(c => c.issue.includes('Micronutrient Risk'));
        const hasJunkAlert = wellness.concerns.some(c => c.issue.includes('Nutrition Alert') || c.issue.includes('Junk Food'));

        console.log('\n--- VALIDATION SUMMARY ---');
        console.log('1. Protein Risk Flagged:', hasProteinRisk ? 'PASS ✅' : 'FAIL ❌');
        console.log('2. Vegetable Intake Deficit Flagged:', hasVeggiesRisk ? 'PASS ✅' : 'FAIL ❌');
        console.log('3. Junk Food Alert Flagged:', hasJunkAlert ? 'PASS ✅' : 'FAIL ❌');

        // 6. Database Cleanup
        await Profile.findByIdAndDelete(testChild._id);
        await MealLog.deleteMany({ profileId: testChild._id });
        console.log('\n🧹 Temp validation database entries cleaned successfully.');

        if (hasProteinRisk && hasVeggiesRisk && hasJunkAlert) {
            console.log('\n🎉 ALL WELLNESS LOGIC VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
            process.exit(0);
        } else {
            console.log('\n❌ SOME VERIFICATION CHECKS FAILED.\n');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Validation script encountered an error:', err);
        process.exit(1);
    }
};

runValidation();
