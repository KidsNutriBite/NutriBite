import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        // Find some users
        const users = await User.find({}).sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${users.length} recent users:`);
        for (const u of users) {
            console.log(`Email: ${u.email}`);
            console.log(`Password in DB: ${u.password}`);
            console.log(`Role: ${u.role}`);
            
            // Let's test a sample compare if we know the password was 'Password123'
            const testPassword = 'Password123';
            const isMatch = await bcrypt.compare(testPassword, u.password);
            const isMatchViaMethod = await u.matchPassword(testPassword);
            console.log(`Test compare with '${testPassword}': ${isMatch} (via method: ${isMatchViaMethod})`);
            console.log('-----------------------------');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
