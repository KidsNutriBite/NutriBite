import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const testEmail = 'ThArUnReDdY2112005@gmail.com';
        console.log(`Querying for: "${testEmail}"`);
        
        const user = await User.findOne({ email: testEmail });
        if (user) {
            console.log("User found!");
            console.log("DB Email:", user.email);
            console.log("DB Password Hash:", user.password);
        } else {
            console.log("User NOT found!");
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
