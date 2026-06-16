import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import Prescription from '../models/Prescription.model.js';
import User from '../models/User.model.js';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI || "Not set in env");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        // Find both Abhi profiles
        const abhiProfiles = await Profile.find({ name: /abhi/i });
        if (abhiProfiles.length === 0) {
            console.log("No Abhi profiles found to populate!");
            process.exit(0);
        }

        console.log(`Found ${abhiProfiles.length} Abhi profile(s).`);

        // Find a doctor to attach prescriptions to
        let doctor = await User.findOne({ role: 'doctor' });
        if (!doctor) {
            console.log("No doctor found. Creating a test doctor...");
            doctor = await User.create({
                name: "Dr. Sarah Miller",
                email: "doctor@test.com",
                password: "Password123",
                role: "doctor",
                title: "Dr"
            });
        }

        for (const profile of abhiProfiles) {
            console.log(`\n--------------------------------------------`);
            console.log(`Populating Profile: ${profile.name} (ID: ${profile._id}, Age: ${profile.age})`);

            // 1. Update Profile HealthNotes
            profile.healthNotes = "Linear growth is progressing well along the 55th percentile. Weight velocity has slowed slightly this month (0.12 kg/mo vs expected 0.18 kg/mo). Advised parent to focus on quality proteins like paneer, legumes, and eggs. Scheduled follow-up in 4 weeks.";
            await profile.save();
            console.log("✅ Updated healthNotes.");

            // 2. Clear old MealLogs and populate 30 days of complete logs
            await MealLog.deleteMany({ profileId: profile._id });
            console.log("🧹 Cleaned old MealLogs.");

            const today = new Date();
            const mealLogs = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                mealLogs.push({
                    profileId: profile._id,
                    date: dateStr,
                    breakfast: [
                        { name: "Scrambled Eggs with Toast", quantity: "1 serving", calories: 280, protein: 14, carbs: 22, fats: 14, fiber: 2, water: 50, vitamins: "Vitamin D: 1.5mcg, B12: 1mcg" }
                    ],
                    lunch: [
                        { name: "Paneer Butter Masala & Roti", quantity: "1 serving", calories: 420, protein: 16, carbs: 45, fats: 18, fiber: 4, water: 100, vitamins: "Calcium: 250mg, Iron: 2mg" }
                    ],
                    dinner: [
                        { name: "Lentil Soup (Dal) & Rice", quantity: "1 serving", calories: 380, protein: 12, carbs: 55, fats: 10, fiber: 6, water: 120, vitamins: "Iron: 3mg, Folate: 80mcg" }
                    ],
                    completedMealsCount: 3,
                    isStreakCounted: true,
                    lastMealAt: date
                });
            }
            await MealLog.insertMany(mealLogs);
            console.log("✅ Inserted 30 days of breakfast, lunch, and dinner logs.");

            // 3. Clear old GrowthRecords and populate historical records to show velocity
            await GrowthRecord.deleteMany({ childId: profile._id });
            console.log("🧹 Cleaned old GrowthRecords.");

            // Let's create growth history for the last 6 months
            const growthRecords = [];
            const startingAgeMonths = profile.age * 12 - 6;

            // Height and weight milestones over last 6 months
            // Height: 112 -> 113.1 -> 114.2 -> 115.3 -> 116.4 -> 117.0
            // Weight: 18.2 -> 18.6 -> 19.1 -> 19.5 -> 19.8 -> 20.0
            const history = [
                { monthsAgo: 6, height: profile.height - 5, weight: profile.weight - 1.8 },
                { monthsAgo: 4, height: profile.height - 3.5, weight: profile.weight - 1.2 },
                { monthsAgo: 2, height: profile.height - 1.8, weight: profile.weight - 0.6 },
                { monthsAgo: 1, height: profile.height - 0.6, weight: profile.weight - 0.2 },
                { monthsAgo: 0, height: profile.height, weight: profile.weight }
            ];

            for (const step of history) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - step.monthsAgo);
                
                // BMI = weight / (height/100)^2
                const heightM = step.height / 100;
                const bmi = step.weight / (heightM * heightM);

                growthRecords.push({
                    childId: profile._id,
                    height: step.height,
                    weight: step.weight,
                    bmi: round(bmi, 2),
                    percentile: 55 + (step.monthsAgo % 2 === 0 ? 1 : -1), // slight percentile fluctuation
                    recordedByRole: step.monthsAgo === 0 ? 'doctor' : 'parent',
                    recordedByUserId: step.monthsAgo === 0 ? doctor._id : profile.parentId,
                    verified: step.monthsAgo === 0,
                    ageInMonths: startingAgeMonths + (6 - step.monthsAgo),
                    notes: step.monthsAgo === 0 ? "Routine checkup at doctor's clinic" : "Parent monthly check",
                    timestamp: date
                });
            }

            await GrowthRecord.insertMany(growthRecords);
            console.log("✅ Inserted 5 historical GrowthRecords (showing growth velocity trends).");

            // 4. Create prescriptions
            await Prescription.deleteMany({ profileId: profile._id });
            console.log("🧹 Cleaned old Prescriptions.");

            await Prescription.create([
                {
                    doctorId: doctor._id,
                    profileId: profile._id,
                    title: "Protein & Vitamin D Supplementation",
                    diagnosis: "Mild slowdown in weight gain velocity",
                    notes: "Kid is growing well in height but weight gain has slowed down.",
                    instructions: "1. Consume 1 boiled egg or 50g Paneer daily.\n2. Multivitamin syrup 5ml once daily after breakfast.\n3. Encourage 1 hour of outdoor play in evening for natural Vitamin D.",
                    date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
                }
            ]);
            console.log("✅ Inserted a mock prescription.");
        }

        function round(value, decimals) {
            return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
        }

        console.log(`\n🎉 Done seeding data for all Abhi profile(s).`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Failed to seed data:", err);
        process.exit(1);
    }
}

run();
