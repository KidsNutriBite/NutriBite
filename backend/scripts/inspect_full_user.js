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
            console.log("User tharunreddy2112005@gmail.com not found!");
            await mongoose.disconnect();
            return;
        }

        console.log("Full User Document:");
        console.log(JSON.stringify(user.toObject(), null, 2));

        // Test common passwords
        const potentialPasswords = [
            'Password123',
            'Password123!',
            'password123',
            'password',
            'Tharun@123',
            'Tharun123',
            '123456',
            '12345678',
            'pavan3107',
            'Pavan3107'
        ];

        console.log("\nTesting potential passwords:");
        for (const pw of potentialPasswords) {
            const isMatch = await bcrypt.compare(pw, user.password);
            console.log(`- "${pw}": ${isMatch}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
