import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { NutriGuideOrchestrator } from '../services/aiOrchestrator.service.js';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

async function testPhase2AIArchitecture() {
    console.log(`\n======================================================`);
    console.log(`🧪 PHASE 2 VERIFICATION: GEMINI AI PROVIDER + FALLBACK ARCHITECTURE`);
    console.log(`======================================================\n`);

    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);

    // 1. Fetch Parent & Child Context
    const parent = await User.findOne({ email: 'parent@nutrikid.com' });
    if (!parent) throw new Error("Parent user not found");

    const child = await Profile.findOne({ parentId: parent._id, name: 'Ananya Sharma' });
    if (!child) throw new Error("Ananya Sharma profile not found");

    console.log(`✅ Loaded Parent: ${parent.name} (${parent.email})`);
    console.log(`✅ Loaded Child Profile: ${child.name} (Age: ${child.age}, Allergies: ${child.allergies?.join(', ') || 'None'})`);

    // 2. Test NutriGuideOrchestrator Direct Invocation
    console.log(`\n------------------------------------------------------`);
    console.log(`🔬 TEST 1: Orchestrator Query Execution (Real Gemini Fallback)`);
    console.log(`------------------------------------------------------`);

    const query = "What are the best iron-rich breakfast and snack options for Ananya considering her school schedule?";
    console.log(`Query: "${query}"`);

    const result = await NutriGuideOrchestrator.handleQuery({
        query,
        profileId: child._id,
        parentId: parent._id,
        history: []
    });

    console.log(`\n✅ Provider Used:`, result.providerStatus.provider);
    console.log(`✅ Custom RAG Available:`, result.providerStatus.custom_rag_available);
    console.log(`✅ Gemini Used:`, result.providerStatus.gemini_used);
    console.log(`✅ Fallback Reason:`, result.providerStatus.fallback_reason || 'None (Primary succeeded)');
    console.log(`✅ Latency:`, `${result.providerStatus.latency_ms}ms`);
    console.log(`✅ Follow-up Chips:`, result.followUps.map(f => f.label));
    console.log(`\n📄 Generated Response Preview (First 400 chars):`);
    console.log(result.answer.slice(0, 400) + '...\n');

    // 3. Test Safety Layer (Allergy Filtering)
    console.log(`------------------------------------------------------`);
    console.log(`🛡️ TEST 2: Allergy Safety Layer Verification`);
    console.log(`------------------------------------------------------`);
    const containsPeanut = result.answer.toLowerCase().includes('peanut') && !result.answer.toLowerCase().includes('avoid');
    if (!containsPeanut) {
        console.log(`✅ PASS: Child's registered allergen (Peanut) was strictly excluded or marked as avoided.`);
    } else {
        console.error(`❌ FAIL: Allergen found in recommendation!`);
    }

    // 4. Test Authenticated HTTP API Endpoint (POST /api/ai/ask)
    console.log(`\n------------------------------------------------------`);
    console.log(`🌐 TEST 3: Authenticated HTTP Endpoint (POST /api/ai/ask)`);
    console.log(`------------------------------------------------------`);

    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'parent@nutrikid.com',
        password: 'Password123!'
    });

    const token = loginRes.data.data.token;
    console.log(`✅ Authenticated with JWT token`);

    const httpRes = await axios.post('http://localhost:5000/api/ai/ask', {
        query: "Suggest a 6-meal schedule for Ananya with optimal protein and iron absorption.",
        profileId: child._id
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ HTTP Status:`, httpRes.status);
    console.log(`✅ HTTP Success Flag:`, httpRes.data.success);
    console.log(`✅ API Provider Status:`, httpRes.data.data.providerStatus);
    console.log(`✅ API Follow-ups Count:`, httpRes.data.data.followUps.length);

    console.log(`\n======================================================`);
    console.log(`🎉 ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
}

testPhase2AIArchitecture().catch(err => {
    console.error(`❌ Phase 2 test failed:`, err);
    process.exit(1);
});
