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
            'Password@123',
            'password@123',
            'P@ssword123',
            'p@ssword123',
            'Password123',
            'Password123!',
            'password123!',
            'Tharun@123',
            'Tharun123!',
            'Tharun@2005',
            'Tharun2005@',
            'Tharun2112',
            'Tharunreddy@123',
            '123456789'
        ];

        console.log("Testing more potential passwords:");
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
