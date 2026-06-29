import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.model.js';

const email = 'tharunwork2112005@gmail.com';
const testPassword = 'Test@123';

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOne({ email });

if (!user) {
    console.log('USER NOT FOUND in database for email:', email);
} else {
    const match = await user.matchPassword(testPassword);
    console.log(JSON.stringify({
        found: true,
        _id: user._id,
        email: user.email,
        role: user.role,
        passwordMatch: match,
        accountLockedUntil: user.accountLockedUntil || null,
        is2FAEnabled: user.is2FAEnabled || false,
        hasPassword: !!user.password
    }, null, 2));
}

await mongoose.disconnect();
process.exit(0);
