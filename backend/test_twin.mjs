import mongoose from 'mongoose';
import Profile from './models/Profile.model.js';
import MealLog from './models/MealLog.model.js';
import GrowthRecord from './models/GrowthRecord.model.js';
import DigitalTwinSnapshot from './models/DigitalTwinSnapshot.model.js';
import axios from 'axios';

const MONGO_URI = "mongodb+srv://pv839910_db_user:Pavan3107@cluster0.qf9utna.mongodb.net/nutrikid?appName=Cluster0";
const AI_SERVICE_URL = "http://localhost:8000";

async function verify() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");

        // Find or create test profile
        let profile = await Profile.findOne({ name: "Test Twin Child" });
        if (!profile) {
            console.log("Creating mock child profile...");
            profile = await Profile.create({
                parentId: new mongoose.Types.ObjectId(),
                name: "Test Twin Child",
                age: 6,
                gender: "male",
                height: 115,
                weight: 20,
                activityLevel: "moderate",
                dietaryPreferences: ["peanut"],
                healthConditions: ["cold"],
                avatar: "bear"
            });
        }
        console.log(`Mock child profile ID: ${profile._id}`);

        // Insert mock meal log
        const dateStr = new Date().toISOString().split('T')[0];
        let mealLog = await MealLog.findOne({ profileId: profile._id, date: dateStr });
        if (!mealLog) {
            console.log("Creating mock meal log...");
            mealLog = await MealLog.create({
                profileId: profile._id,
                date: dateStr,
                breakfast: [{ name: "Oatmeal with milk", calories: 250, protein: 8, carbs: 40, fats: 5, vitamins: "Iron: 2mg" }],
                lunch: [{ name: "Dal Khichdi", calories: 350, protein: 12, carbs: 55, fats: 8, vitamins: "Iron: 1.5mg" }],
                dinner: [{ name: "Roti with Paneer", calories: 300, protein: 14, carbs: 35, fats: 10 }]
            });
        }

        // Insert mock growth record
        let growthRec = await GrowthRecord.findOne({ childId: profile._id });
        if (!growthRec) {
            console.log("Creating mock growth record...");
            growthRec = await GrowthRecord.create({
                childId: profile._id,
                height: 115,
                weight: 20,
                bmi: 15.1,
                percentile: 55,
                recordedByRole: "parent",
                recordedByUserId: new mongoose.Types.ObjectId()
            });
        }

        // Call FastAPI Digital Twin directly to verify
        console.log(`Sending payload to FastAPI AI microservice at ${AI_SERVICE_URL}/twin/analyze ...`);
        const response = await axios.post(`${AI_SERVICE_URL}/twin/analyze`, {
            profile: {
                age: profile.age,
                weight: profile.weight,
                height: profile.height,
                gender: profile.gender,
                allergies: profile.dietaryPreferences,
                healthConditions: profile.healthConditions,
                healthNotes: profile.healthNotes || ''
            },
            meals: [mealLog.toObject()],
            growth_records: [growthRec.toObject()]
        });

        console.log("\n================ FASTAPI RESPONSE ==================");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("===================================================\n");

        if (response.data && response.data.nutritionScore && response.data.radarMetrics) {
            console.log("SUCCESS: Twin analysis generated successfully and structured validation passed!");
        } else {
            console.error("FAILURE: Invalid twin response structure.");
        }

        // Clean up mock data
        console.log("Cleaning up mock records...");
        await Profile.deleteOne({ _id: profile._id });
        await MealLog.deleteMany({ profileId: profile._id });
        await GrowthRecord.deleteMany({ childId: profile._id });
        await DigitalTwinSnapshot.deleteMany({ profileId: profile._id });

        console.log("Done!");
        process.exit(0);

    } catch (err) {
        console.error("Verification failed with error:", err.message);
        if (err.response) {
            console.error("Response details:", err.response.data);
        }
        process.exit(1);
    }
}

verify();
