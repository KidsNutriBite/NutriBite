import mongoose from 'mongoose';
import env from './env.js';

import fs from 'fs';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.warn(`[NutriKid] Warning: Could not connect to MongoDB at "${env.MONGO_URI}". If using local MongoDB, please ensure the mongod service is active, or configure a remote MONGO_URI in backend/.env.`);
        try { fs.appendFileSync('server.log', `DB Connection Failed: ${error.message}\n`); } catch (e) { }
    }
};

export default connectDB;
