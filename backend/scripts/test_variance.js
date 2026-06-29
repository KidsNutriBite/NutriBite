import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import User from '../models/User.model.js';
import generateToken from '../services/jwt.service.js';

dotenv.config();

const runVarianceTest = async () => {
    let tempUser = null;
    try {
        console.log('--- STARTING AI MODEL PREDICTION VARIANCE TEST ---');

        // 1. Connect to MongoDB
        console.log('\n[1/5] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // 2. Create a temporary Parent user
        console.log('\n[2/5] Creating temporary parent user for auth bypass...');
        tempUser = new User({
            name: "Model Variance Tester",
            email: `variance_test_${Date.now()}@example.com`,
            password: "TemporaryPassword123!",
            role: "parent"
        });
        await tempUser.save();
        console.log(`✅ Temporary user created. ID: ${tempUser._id}`);

        // 3. Generate JWT Token
        const token = generateToken(tempUser._id, tempUser.role);
        console.log('✅ Auth Token generated.');

        // 4. Define test images and run inference
        console.log('\n[3/5] Starting inference on 5 test images...');
        const testAssetsDir = path.resolve('test-assets');
        const images = [
            { filename: 'dosa_plate.png', description: 'South Indian Dosa Plate' },
            { filename: 'ripe_banana.png', description: 'Banana' },
            { filename: 'pizza_slice.png', description: 'Pepperoni Pizza Slice' },
            { filename: 'cooked_rice.png', description: 'Basmati Cooked Rice' },
            { filename: 'chapati_plate.png', description: 'Chapati Flatbreads' }
        ];

        const results = [];

        for (const img of images) {
            const imgPath = path.join(testAssetsDir, img.filename);
            if (!fs.existsSync(imgPath)) {
                throw new Error(`Test image not found at: ${imgPath}`);
            }

            console.log(`\nProcessing: "${img.description}" (${img.filename})`);
            const fileBuffer = fs.readFileSync(imgPath);
            const blob = new Blob([fileBuffer], { type: 'image/png' });
            
            const formData = new FormData();
            formData.append('image', blob, img.filename);

            console.log(`- Sending request to Express backend debug endpoint...`);
            const startTime = Date.now();
            const response = await axios.post(
                'http://localhost:5000/api/meals/debug-food-analysis',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const duration = Date.now() - startTime;
            console.log(`- Response received in ${duration}ms.`);

            if (response.data && response.data.success && response.data.data) {
                const debugData = response.data.data;
                const predictions = debugData.raw_predictions || [];
                const topPrediction = predictions.length > 0 ? predictions[0] : null;
                
                console.log(`  Top Prediction: "${topPrediction ? topPrediction.label : 'None'}" with confidence ${(topPrediction ? topPrediction.score * 100 : 0).toFixed(2)}%`);
                console.log(`  All predictions above 5%: ${debugData.detected_classes?.join(', ') || 'None'}`);
                console.log(`  Model Inference Time: ${debugData.inference_time_ms?.toFixed(2) || 'N/A'}ms`);
                
                results.push({
                    image: img.description,
                    topClass: topPrediction ? topPrediction.label : 'None',
                    topScore: topPrediction ? topPrediction.score : 0,
                    allDetected: debugData.detected_classes || [],
                    inferenceTimeMs: debugData.inference_time_ms || 0
                });
            } else {
                throw new Error(`Invalid response format from debug endpoint: ${JSON.stringify(response.data)}`);
            }
        }

        // 5. Verification and Assertions
        console.log('\n[4/5] Running prediction variance validation assertions...');
        
        // Assert that the top prediction classes are not all identical
        const topClasses = results.map(r => r.topClass);
        const uniqueClasses = new Set(topClasses);

        console.log('\nSummary of Top Predictions:');
        results.forEach(r => {
            console.log(`- ${r.image.padEnd(25)} => Top Prediction: ${(r.topClass || 'N/A').padEnd(20)} (Conf: ${(r.topScore * 100).toFixed(2)}%)`);
        });

        console.log(`\nUnique Top Predicted Classes: ${uniqueClasses.size} / ${images.length}`);
        
        if (uniqueClasses.size <= 1) {
            console.error('\n❌ FAILURE: All test images returned identical top predictions!');
            console.error('This suggests that the model is either failing to perform real inference or returning fallback/cached data.');
            process.exitCode = 1;
        } else {
            console.log('\n✅ PASS: Prediction variance verified! The model successfully returned different predictions for different food images.');
            process.exitCode = 0;
        }

    } catch (err) {
        console.error('\n❌ ERROR RUNNING VARIANCE TEST:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', JSON.stringify(err.response.data, null, 2));
        }
        process.exitCode = 1;
    } finally {
        // 6. Cleanup temporary user
        if (tempUser) {
            console.log('\n[5/5] Cleaning up temporary parent user...');
            try {
                await User.findByIdAndDelete(tempUser._id);
                console.log('✅ Temporary user removed.');
            } catch (cleanupErr) {
                console.error('❌ Error during cleanup:', cleanupErr.message);
            }
        }
        
        console.log('\nClosing MongoDB connection...');
        await mongoose.connect(process.env.MONGO_URI); // safety check re-connect if closed
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        
        console.log('--- TEST RUN COMPLETED ---\n');
        process.exit(process.exitCode || 0);
    }
};

runVarianceTest();
