import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const emailWithSpaces = '  tharunreddy2112005@gmail.com  ';
        console.log(`Querying for email with spaces: "${emailWithSpaces}"`);
        
        const user = await User.findOne({ email: emailWithSpaces });
        if (user) {
            console.log("Found user even with spaces!");
        } else {
            console.log("User NOT found when queried with spaces!");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
