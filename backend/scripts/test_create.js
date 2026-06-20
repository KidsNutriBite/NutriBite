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

        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Password123';

        console.log(`Creating user with email ${testEmail} and password ${testPassword}...`);
        const user = await User.create({
            name: "Test User",
            email: testEmail,
            password: testPassword,
            role: "parent",
            title: "Mr",
            parentProfile: {
                phoneNumber: "1234567890",
                city: "Test City",
                relationToChild: "Father"
            }
        });

        console.log("User created successfully!");
        console.log("Password in created object (returned by User.create):", user.password);

        // Retrieve from database
        const retrievedUser = await User.findById(user._id);
        console.log("Retrieved password from DB:", retrievedUser.password);

        // Test manual bcrypt compare
        const isMatchManual = await bcrypt.compare(testPassword, retrievedUser.password);
        console.log("Bcrypt compare of testPassword and DB password:", isMatchManual);

        // Test model method
        const isMatchMethod = await retrievedUser.matchPassword(testPassword);
        console.log("Model matchPassword method result:", isMatchMethod);

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
