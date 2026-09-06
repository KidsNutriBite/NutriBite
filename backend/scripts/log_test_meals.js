import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MealLog from '../models/MealLog.model.js';
import Profile from '../models/Profile.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const profileId = "6a2d2b4c02b1b842e3515b8c"; // Ravi

async function run() {
    try {
        console.log("Connecting to database:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // Check if profile exists
        const profile = await Profile.findById(profileId);
        if (!profile) {
            console.log("Error: Profile Ravi (6a2d2b4c02b1b842e3515b8c) not found!");
            process.exit(1);
        }
        console.log(`Found child profile: ${profile.name}, Age: ${profile.age}`);

        // Clean existing logs for this profile
        console.log("Cleaning old meal logs for child...");
        await MealLog.deleteMany({ profileId });

        // Generate 15 days of grain-heavy, nutrient-deficient logs
        console.log("Seeding new nutrient-deficient meal logs...");
        const logs = [];
        const today = new Date();

        for (let i = 0; i < 15; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            logs.push({
                parentId: profile.parentId,
                profileId: profile._id,
                date: dateString,
                breakfast: [
                    { name: "Plain Rice", quantity: "1 plate", calories: 200, protein: 3, carbs: 45, fat: 0.5, fiber: 0.5, iron: 0.2, calcium: 5, vitaminC: 0 }
                ],
                morningSnack: [],
                lunch: [
                    { name: "White Rice with Rasam", quantity: "1 plate", calories: 250, protein: 4, carbs: 55, fat: 1.5, fiber: 1.0, iron: 0.4, calcium: 10, vitaminC: 1 }
                ],
                afternoonSnack: [],
                dinner: [
                    { name: "Plain Roti", quantity: "2 rotis", calories: 220, protein: 6, carbs: 46, fat: 1.0, fiber: 2.2, iron: 0.8, calcium: 15, vitaminC: 0 }
                ],
                eveningSnack: [],
                waterIntake: 500 // Only 500ml water logged (severely dehydrated)
            });
        }

        await MealLog.insertMany(logs);
        console.log("Successfully seeded 15 days of meal logs!");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error logging test meals:", err);
        process.exit(1);
    }
}

run();
