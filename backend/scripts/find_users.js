import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI || "Not set in env");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const users = await User.find({}).lean();
        console.log("\n--- USERS ---");
        users.forEach(u => {
            console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
        });

        const profiles = await Profile.find({}).lean();
        console.log("\n--- PROFILES ---");
        profiles.forEach(p => {
            console.log(`ID: ${p._id} | Name: ${p.name} | ParentId: ${p.parentId} | Age: ${p.age}`);
        });

        const accesses = await DoctorAccess.find({}).lean();
        console.log("\n--- ACCESSES ---");
        accesses.forEach(a => {
            console.log(`ID: ${a._id} | Doctor: ${a.doctorId} | Profile: ${a.profileId} | Status: ${a.status}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
