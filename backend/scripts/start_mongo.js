import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '.db_data');

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
}

async function start() {
    console.log('[MongoDev] Starting local MongoDB instance on port 27017 with persistent storage...');
    try {
        const mongod = await MongoMemoryServer.create({
            instance: {
                port: 27017,
                dbPath: dbPath,
                storageEngine: 'wiredTiger',
            },
        });
        const uri = mongod.getUri();
        console.log(`[MongoDev] ✅ MongoDB running at: ${uri} (Port 27017)`);
        console.log(`[MongoDev] Storage path: ${dbPath}`);
    } catch (err) {
        console.error('[MongoDev] ❌ Error starting MongoDB:', err);
    }
}

start();
