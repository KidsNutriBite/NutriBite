import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'tharunreddy2112005@gmail.com' });
        if (!user) {
            console.log("User not found!");
            await mongoose.disconnect();
            return;
        }

        const candidates = [
            'undefined',
            '',
            'null',
            'Password123'
        ];

        console.log("Testing special string values as password:");
        for (const cand of candidates) {
            const isMatch = await bcrypt.compare(cand, user.password);
            console.log(`- "${cand}": ${isMatch}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
