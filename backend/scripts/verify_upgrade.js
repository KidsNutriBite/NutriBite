import { findNearbyDoctors } from '../services/location.service.js';
import { uploadFile } from '../services/storage.service.js';
import { generateHealthTips } from '../utils/healthTipsEngine.js';
import mongoose from 'mongoose';

// Mock File Object for Storage Test
const mockLargeFile = {
    originalname: 'large_image.jpg',
    size: 10 * 1024 * 1024, // 10MB
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-data')
};

const mockValidFile = {
    originalname: 'valid_image.jpg',
    size: 1 * 1024 * 1024, // 1MB
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-data')
};

const runVerification = async () => {
    console.log('--- STARTING SYSTEM UPGRADE VERIFICATION ---');

    try {
        // 1. Health Tips Engine
        console.log('\n[TEST] Health Tips Engine...');
        const tips = generateHealthTips(['iron_deficiency']);
        if (tips.length === 3 && tips.some(t => t.tag === 'iron_deficiency')) {
            console.log('✅ Health Tips generated correctly (Prioritized + General)');
        } else {
            console.error('❌ Health Tips logic failed', tips);
        }

        // 2. Storage Service
        console.log('\n[TEST] Storage Service - File Size Limit...');
        try {
            await uploadFile(mockLargeFile);
            console.error('❌ Storage Service failed to reject large file');
        } catch (error) {
            if (error.message.includes('exceeds 5MB')) {
                console.log('✅ Storage Service rejected 10MB file correctly');
            } else {
                console.error('❌ Storage Service threw unexpected error:', error.message);
            }
        }

        console.log('\n[TEST] Storage Service - Valid Upload...');
        try {
            const result = await uploadFile(mockValidFile);
            if (result && result.includes('valid_image')) {
                console.log(`✅ Storage Service uploaded valid file: ${result}`);
            } else {
                console.error('❌ Storage Service failed valid upload');
            }
        } catch (error) {
            console.error('❌ Storage Service failed valid upload:', error.message);
        }

        // 3. Location Service (Mocking/Real)
        console.log('\n[TEST] Location Service (OpenStreetMap)...');
        console.log('Fetching doctors near New York (40.71, -74.00)...');
        const doctors = await findNearbyDoctors(40.71, -74.00);
        if (doctors && doctors.length > 0) {
            console.log(`✅ Location Service returned ${doctors.length} results`);
            console.log('   First result:', doctors[0].name);
        } else {
            console.warn('⚠️ Location Service returned 0 results (might be rate limited or API issue)');
        }

        // 3.1 Cache Check
        console.log('\n[TEST] Location Service Cache...');
        const start = Date.now();
        const cachedDoctors = await findNearbyDoctors(40.71, -74.00);
        const duration = Date.now() - start;
        if (duration < 50) {
            console.log(`✅ Cache HIT! Response time: ${duration}ms (vs ~1000ms+ for network)`);
        } else {
            console.warn(`⚠️ Cache MISS or slow. Duration: ${duration}ms`);
        }

    } catch (error) {
        console.error('❌ GLOBAL VERIFICATION ERROR:', error);
    } finally {
        console.log('\n--- VERIFICATION COMPLETE ---');
        process.exit(0);
    }
};

runVerification();
