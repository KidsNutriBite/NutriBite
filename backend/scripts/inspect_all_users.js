import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).sort({ createdAt: -1 });
        console.log(`Found ${users.length} users:`);
        for (const u of users) {
            console.log({
                email: u.email,
                password: u.password,
                role: u.role,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt
            });
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
