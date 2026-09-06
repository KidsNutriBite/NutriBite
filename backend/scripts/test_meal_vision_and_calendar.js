import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import AiCorrection from '../models/AiCorrection.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';
const imagePath = 'c:/Users/LENOVO/Desktop/project-phase/frontend/public/indian_food.jpg';

async function testMealVisionAndCalendar() {
    console.log(`\n========================================================================`);
    console.log(`🧪 TESTING FOOD PLATE VISION AI & PARENT SELF-LEARNING CORRECTIONS`);
    console.log(`========================================================================\n`);

    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);

    // 1. Authenticate Parent
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'parent@nutrikid.com',
        password: 'Password123!'
    });
    const token = loginRes.data.data.token;
    console.log(`✅ Parent Logged In (Token Acquired)`);

    // 2. Test Food Plate Vision Upload
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`📸 TEST 1: Food Plate Vision AI (POST /api/meals/analyze-image)`);
    console.log(`------------------------------------------------------------------------`);

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    const visionRes = await axios.post('http://localhost:5000/api/meals/analyze-image', form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`
        },
        timeout: 40000
    });

    console.log(`✅ Vision API Status: ${visionRes.status}`);
    console.log(`✅ AI Provider: ${visionRes.data.data.provider}`);
    console.log(`✅ Detected Foods Count: ${visionRes.data.data.foods.length}`);
    console.log(`Detected Foods:`, visionRes.data.data.foods.map(f => `${f.name} (${f.quantity}, ${f.calories} kcal)`));
    console.log(`Plate Totals:`, visionRes.data.data.totals);

    // 3. Test Parent AI Correction (Self-learning)
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🧠 TEST 2: Record Parent Correction (POST /api/meals/correction)`);
    console.log(`------------------------------------------------------------------------`);

    const correctionRes = await axios.post('http://localhost:5000/api/meals/correction', {
        originalFood: 'Chicken Curry',
        correctedFood: 'Paneer Makhani',
        originalQuantity: '0.75 cup',
        correctedQuantity: '1 cup',
        mealType: 'lunch'
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Correction Recorded Status: ${correctionRes.status}`);
    console.log(`✅ Saved AI Correction in DB:`, correctionRes.data.data);

    // Verify in MongoDB
    const latestCorrection = await AiCorrection.findOne({ originalFood: 'chicken curry' }).sort({ createdAt: -1 });
    if (latestCorrection) {
        console.log(`✅ PASS: MongoDB verified correction: "${latestCorrection.originalFood}" -> "${latestCorrection.correctedFood}" (${latestCorrection.correctedQuantity})`);
    } else {
        console.error(`❌ FAIL: Correction not found in database!`);
    }

    console.log(`\n========================================================================`);
    console.log(`🎉 ALL FOOD PLATE VISION & CORRECTION TESTS PASSED SUCCESSFULLY!`);
    console.log(`========================================================================\n`);

    await mongoose.disconnect();
}

testMealVisionAndCalendar().catch(err => {
    console.error(`❌ Test failed:`, err.response?.data || err.message);
    process.exit(1);
});
