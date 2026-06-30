import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find all parent users
        const parents = await User.find({ role: 'parent' }).select('name email');
        console.log("\nAll Parents in DB:");
        parents.forEach(p => console.log(`- ID: ${p._id}, Name: ${p.name}, Email: ${p.email}`));

        // 2. Find all child profiles
        const profiles = await Profile.find({}).select('name parentId');
        console.log("\nAll Child Profiles in DB:");
        profiles.forEach(pr => console.log(`- ID: ${pr._id}, Name: ${pr.name}, ParentID: ${pr.parentId}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
