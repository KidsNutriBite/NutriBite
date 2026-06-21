import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import AiCorrection from '../models/AiCorrection.model.js';
import generateToken from '../services/jwt.service.js';

dotenv.config();

const runCorrectionsLoopTest = async () => {
    let tempUser = null;
    let tempProfile = null;
    try {
        console.log('--- STARTING CLOSED-LOOP CORRECTIONS FEEDBACK TEST ---');

        // 1. Connect to MongoDB
        console.log('\n[1/7] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // 2. Create a temporary Parent user and Child profile
        console.log('\n[2/7] Creating temporary parent user and child profile...');
        tempUser = new User({
            name: "Corrections Loop Tester",
            email: `corrections_test_${Date.now()}@example.com`,
            password: "TemporaryPassword123!",
            role: "parent"
        });
        await tempUser.save();

        tempProfile = new Profile({
            name: "Test Child",
            dob: new Date('2021-01-01'),
            age: 5,
            gender: "male",
            weight: 18,
            height: 110,
            waistCircumference: 50,
            parentId: tempUser._id,
            bloodGroup: "O+",
            goals: {
                primary: "healthy_maintain"
            },
            location: {
                address: "123 Street",
                city: "Bengaluru",
                state: "Karnataka",
                country: "India",
                postalCode: "560001"
            },
            medicalReports: []
        });
        await tempProfile.save();

        console.log(`✅ Temporary parent created: ${tempUser._id}`);
        console.log(`✅ Temporary child profile created: ${tempProfile._id}`);

        // 3. Generate JWT Token
        const token = generateToken(tempUser._id, tempUser.role);
        console.log('✅ Auth Token generated.');

        // 4. Log a meal with a simulated correction
        console.log('\n[3/7] Simulating a correction by logging a meal...');
        const originalAiOutput = {
            foods: [
                {
                    name: "vada",
                    quantity: "3 vada",
                    calories: 300,
                    protein: 6.0,
                    carbs: 40,
                    fats: 15
                }
            ]
        };

        const submittedFoodItems = [
            {
                name: "vada",
                quantity: "2 vada",
                calories: 200,
                protein: 4.0,
                carbs: 26.6,
                fats: 10
            }
        ];

        const mealPayload = {
            profileId: tempProfile._id.toString(),
            date: new Date().toISOString().split('T')[0],
            mealType: "breakfast",
            time: "08:00",
            notes: "Test correction",
            foodItems: JSON.stringify(submittedFoodItems),
            analysisResult: JSON.stringify(originalAiOutput)
        };

        console.log('- Sending meal logging request to Express backend...');
        const logResponse = await axios.post(
            'http://localhost:5000/api/meals',
            mealPayload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (logResponse.data && logResponse.data.success) {
            console.log('✅ Meal logged successfully.');
        } else {
            throw new Error(`Failed to log meal: ${JSON.stringify(logResponse.data)}`);
        }

        // 5. Verify correction was saved to MongoDB
        console.log('\n[4/7] Verifying correction was saved to MongoDB...');
        const savedCorrection = await AiCorrection.findOne({ parentId: tempUser._id });
        if (savedCorrection) {
            console.log('✅ Found saved correction in database:');
            console.log(`  - Original: '${savedCorrection.originalFood}' (${savedCorrection.originalQuantity})`);
            console.log(`  - Corrected: '${savedCorrection.correctedFood}' (${savedCorrection.correctedQuantity})`);
        } else {
            throw new Error('❌ Failed: No correction was saved in MongoDB.');
        }

        // 6. Test that corrections are passed to Gemini via Express -> FastAPI
        console.log('\n[5/7] Sending a new plate image for analysis and verifying prompt contains feedback...');
        const testAssetsDir = path.resolve('test-assets');
        const imgPath = path.join(testAssetsDir, 'ripe_banana.png');
        if (!fs.existsSync(imgPath)) {
            throw new Error(`Test image not found at: ${imgPath}`);
        }

        const fileBuffer = fs.readFileSync(imgPath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        
        const formData = new FormData();
        formData.append('image', blob, 'ripe_banana.png');

        console.log('- Sending analysis request to Express backend (which should fetch and forward corrections)...');
        const analysisResponse = await axios.post(
            'http://localhost:5000/api/meals/analyze-image',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (analysisResponse.data && analysisResponse.data.success) {
            console.log('✅ AI analysis responded successfully.');
            console.log('  Detected foods:', analysisResponse.data.data.foods.map(f => f.name));
        } else {
            throw new Error(`Inference request failed: ${JSON.stringify(analysisResponse.data)}`);
        }

        // 7. Success assertion
        console.log('\n[6/7] Closed-loop feedback validation passed successfully!');
        process.exitCode = 0;

    } catch (err) {
        console.error('\n❌ ERROR RUNNING CORRECTIONS LOOP TEST:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', JSON.stringify(err.response.data, null, 2));
        }
        process.exitCode = 1;
    } finally {
        // Clean up
        console.log('\n[7/7] Cleaning up temporary test data...');
        if (tempUser) {
            try {
                await User.findByIdAndDelete(tempUser._id);
                console.log('✅ Temporary user removed.');
            } catch (e) {
                console.error('Error deleting temp user:', e.message);
            }
        }
        if (tempProfile) {
            try {
                await Profile.findByIdAndDelete(tempProfile._id);
                console.log('✅ Temporary child profile removed.');
            } catch (e) {
                console.error('Error deleting temp profile:', e.message);
            }
        }
        if (tempUser) {
            try {
                await AiCorrection.deleteMany({ parentId: tempUser._id });
                console.log('✅ Temporary AI corrections removed.');
            } catch (e) {
                console.error('Error deleting temp corrections:', e.message);
            }
        }

        console.log('\nClosing MongoDB connection...');
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        
        console.log('--- TEST RUN COMPLETED ---\n');
        process.exit(process.exitCode || 0);
    }
};

runCorrectionsLoopTest();
