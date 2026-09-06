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
    try {
        const conn = await mongoose.connect(env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log(`[NutriKid] ✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.warn(`[NutriKid] ⚠️ Direct connection to "${env.MONGO_URI}" failed: ${error.message}`);

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
                    serverSelectionTimeoutMS: 5000,
                });
                console.log(`[NutriKid] ✅ MongoDB Connected to Embedded Instance: ${conn.connection.host}`);
                return conn;
            } catch (embeddedErr) {
                console.error(`[NutriKid] ❌ Could not start embedded MongoDB: ${embeddedErr.message}`);
            }
        }

        console.error(`MongoDB Connection Error: ${error.message}`);
        console.warn(`[NutriKid] Warning: Could not connect to MongoDB at "${env.MONGO_URI}". If using local MongoDB, please ensure the mongod service is active, or configure a remote MONGO_URI in backend/.env.`);
        try { fs.appendFileSync('server.log', `DB Connection Failed: ${error.message}\n`); } catch (e) { }
    }
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

