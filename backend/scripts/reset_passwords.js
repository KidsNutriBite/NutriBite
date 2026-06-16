import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const users = await User.find({});
        console.log(`Found ${users.length} users. Updating passwords...`);

        for (const u of users) {
            u.password = 'Password123';
            // Save will trigger pre-save hook to hash password
            await u.save();
            console.log(`Updated password for ${u.email}`);
        }

        console.log("Successfully reset all passwords to Password123!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
