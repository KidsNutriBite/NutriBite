import mongoose from 'mongoose';
import env from './env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', '.db_data');

let mongodInstance = null;

const connectDB = async () => {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[NutriKid] 🔄 Connecting to MongoDB (Attempt ${attempt}/${maxRetries})...`);
            const conn = await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 20000,
                connectTimeoutMS: 20000,
                socketTimeoutMS: 45000,
            });
            console.log(`[NutriKid] ✅ MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            lastError = error;
            console.warn(`[NutriKid] ⚠️ Attempt ${attempt} failed to connect to MongoDB: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 2000 * attempt));
            }
        }
    }

    // If local instance, start embedded MongoMemoryServer with persistent .db_data storage
    const isLocal = env.MONGO_URI.includes('127.0.0.1') || env.MONGO_URI.includes('localhost');
    if (isLocal) {
        try {
            console.log(`[NutriKid] 🚀 Initializing embedded MongoDB (Port 27017) with storage at: ${dbPath}`);
            if (!fs.existsSync(dbPath)) {
                fs.mkdirSync(dbPath, { recursive: true });
            }

            const { MongoMemoryServer } = await import('mongodb-memory-server');
            mongodInstance = await MongoMemoryServer.create({
                instance: {
                    port: 27017,
                    dbPath: dbPath,
                    storageEngine: 'wiredTiger',
                },
            });

            const uri = mongodInstance.getUri();
            console.log(`[NutriKid] ✅ Embedded MongoDB instance active at: ${uri}`);

            const conn = await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log(`[NutriKid] ✅ MongoDB Connected to Embedded Instance: ${conn.connection.host}`);
            return conn;
        } catch (embeddedErr) {
            console.error(`[NutriKid] ❌ Could not start embedded MongoDB: ${embeddedErr.message}`);
        }
    }

    console.error(`[NutriKid] ❌ Fatal MongoDB Connection Error: ${lastError?.message}`);
    try { fs.appendFileSync('server.log', `DB Connection Failed: ${lastError?.message}\n`); } catch (e) { }
    throw lastError;
};

const gracefulShutdown = async () => {
    if (mongodInstance) {
        try {
            await mongodInstance.stop();
            console.log('[NutriKid] Embedded MongoDB stopped cleanly.');
        } catch (e) { }
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default connectDB;

