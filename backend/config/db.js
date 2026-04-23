import mongoose from 'mongoose';
import env from './env.js';

import fs from 'fs';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        try { fs.appendFileSync('server.log', `DB Connection Failed: ${error.message}\n`); } catch (e) { }
        process.exit(1);
    }
};

export default connectDB;
