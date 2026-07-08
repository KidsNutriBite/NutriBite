import mongoose from 'mongoose';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import { ResponseBuilder } from '../services/nutritionIntelligenceEngine.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    try {
        console.log("Connecting to database:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nutrikids');
        console.log("Connected.");

        const profile = await Profile.findOne();
        if (!profile) {
            console.log("No profile found in database!");
            return;
        }
        console.log("Found profile raw data:", JSON.stringify(profile, null, 2));
        console.log("Found profile:", profile.name, "ID:", profile._id);

        const logs = await MealLog.find({ profileId: profile._id });
        console.log("Found logs count:", logs.length);

        console.log("profile.goals type:", typeof profile.goals, "isArray:", Array.isArray(profile.goals), "raw:", profile.goals);
        console.log("profile.goals.primary:", profile.goals?.primary, "type:", typeof profile.goals?.primary);
        
        console.log("Building response...");
        const result = ResponseBuilder.build(profile, logs);
        console.log("Build successful! Overall score:", result.overallScore);
        console.log("Gaps check count:", Object.keys(result.gaps).length);
        console.log("Recommendations check count:", result.recommendations.length);
    } catch (err) {
        console.error("CRASH:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
