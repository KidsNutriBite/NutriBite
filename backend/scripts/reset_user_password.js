import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.model.js';

const email = 'tharunwork2112005@gmail.com';
const newPassword = 'Test@123';

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOne({ email });

if (!user) {
    console.log('USER NOT FOUND:', email);
} else {
    // Set plain text password — the pre('save') hook will hash it once
    user.password = newPassword;
    // Also clear any lockout
    user.accountLockedUntil = null;
    user.loginAttempts = 0;
    await user.save();
    
    // Reload from DB and verify
    const freshUser = await User.findOne({ email });
    const match = await freshUser.matchPassword(newPassword);
    console.log('Password reset result:', match ? 'SUCCESS ✅' : 'FAILED ❌');
    console.log('Email:', freshUser.email, '| Role:', freshUser.role);
    console.log('You can now login with:', email, '/', newPassword);
}

await mongoose.disconnect();
process.exit(0);
