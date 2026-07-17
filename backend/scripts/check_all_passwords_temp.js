import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const candidates = [
    'Password123',
    'Test@123',
    'Password123!',
    'password123',
    'Password@123',
    'password',
    'admin123',
    'admin'
];

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const users = await User.find({});
        console.log(`Found ${users.length} users in database.`);

        for (const user of users) {
            let matched = null;
            for (const cand of candidates) {
                if (await bcrypt.compare(cand, user.password)) {
                    matched = cand;
                    break;
                }
            }
            console.log(`- Email: ${user.email} | Role: ${user.role} | Password: ${matched ? matched : 'UNKNOWN'}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
