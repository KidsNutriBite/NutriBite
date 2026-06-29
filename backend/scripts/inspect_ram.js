import mongoose from 'mongoose';
import Profile from '../models/Profile.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ram = await Profile.findOne({ name: 'Ram' }).lean();
        console.log(JSON.stringify(ram, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
