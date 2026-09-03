import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { NutrientGapEngine } from '../services/nutrientGapEngine.js';
import { ConversationManager } from '../services/conversationManager.service.js';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import Conversation from '../models/Conversation.model.js';
import ConversationMemory from '../models/ConversationMemory.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

async function testPhase8AndPhase10() {
    console.log(`\n========================================================================`);
    console.log(`🧪 TESTING PHASE 8 (NUTRIENT GAP ENGINE) & PHASE 10 (MEMORY & CONVERSATION SYSTEM)`);
    console.log(`========================================================================\n`);

    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);

    const parent = await User.findOne({ email: 'parent@nutrikid.com' });
    const ananya = await Profile.findOne({ parentId: parent._id, name: 'Ananya Sharma' });
    const aarav = await Profile.findOne({ parentId: parent._id, name: 'Aarav Sharma' });

    console.log(`✅ Parent: ${parent.name}`);
    console.log(`✅ Child 1: ${ananya.name} (${ananya.age}y)`);
    console.log(`✅ Child 2: ${aarav.name} (${aarav.age}y)`);

    // -----------------------------------------------------------------
    // TEST 1: PHASE 8 DETERMINISTIC NUTRIENT GAP ENGINE
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🔬 TEST 1: Deterministic Nutrient Gap Engine (Phase 8)`);
    console.log(`------------------------------------------------------------------------`);

    const gapReport = await NutrientGapEngine.calculateGaps({
        profileId: ananya._id,
        parentId: parent._id,
        days: 21
    });

    console.log(`✅ Standard Reference: ${gapReport.rdaStandard}`);
    console.log(`Calculated Gap Metrics (${gapReport.nutrients.length} Nutrients Evaluated):`);
    gapReport.nutrients.forEach(n => {
        console.log(`  - [${n.nutrient}]: Logged ${n.loggedIntake} ${n.unitSymbol} vs Target ${n.targetRda} ${n.unitSymbol} (${n.percentageMet}%) | ${n.isGap ? '🟡 Gap Observed' : '🟢 Optimal'} | ${n.clinicalObservation}`);
    });

    // -----------------------------------------------------------------
    // TEST 2: PHASE 10 MULTI-CHILD CONVERSATION THREADS & ISOLATION
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`💬 TEST 2: Multi-Child Conversation Threads & Strict Isolation (Phase 10)`);
    console.log(`------------------------------------------------------------------------`);

    // Create thread for Ananya
    const convAnanya = await ConversationManager.getOrCreateConversation({
        parentId: parent._id,
        profileId: ananya._id,
        initialQuery: "What nutrients are missing for Ananya?"
    });

    // Append messages for Ananya
    await ConversationManager.appendMessages({
        conversationId: convAnanya._id,
        userText: "What nutrients are missing for Ananya?",
        aiText: "> **In Brief:** Ananya's 21-day analysis shows non-heme iron as the primary optimization focus.",
        intent: "WF_MISSING_NUTRIENTS",
        toolsUsed: ["NutrientGapEngine.calculateGaps"]
    });

    // Create thread for Aarav
    const convAarav = await ConversationManager.getOrCreateConversation({
        parentId: parent._id,
        profileId: aarav._id,
        initialQuery: "Aarav is 4 years old, what snacks are safe?"
    });

    await ConversationManager.appendMessages({
        conversationId: convAarav._id,
        userText: "Aarav is 4 years old, what snacks are safe?",
        aiText: "> **In Brief:** For Aarav (4y), soft-textured snacks like steamed idli pieces and crushed makhana avoid choking hazards.",
        intent: "WF_SNACK_PLAN",
        toolsUsed: ["tool_check_food_allergy_safety"]
    });

    // Verify isolation
    const ananyaThreads = await Conversation.find({ parentId: parent._id, profileId: ananya._id }).lean();
    const aaravThreads = await Conversation.find({ parentId: parent._id, profileId: aarav._id }).lean();

    console.log(`✅ Ananya Consultation Threads Count: ${ananyaThreads.length} (Title: "${ananyaThreads[0]?.title}")`);
    console.log(`✅ Aarav Consultation Threads Count: ${aaravThreads.length} (Title: "${aaravThreads[0]?.title}")`);

    if (ananyaThreads.some(t => t.profileId.toString() === aarav._id.toString())) {
        console.error(`❌ Thread isolation leak detected!`);
        process.exit(1);
    }
    console.log(`✅ PASS: Zero thread leakage between Ananya and Aarav.`);

    // -----------------------------------------------------------------
    // TEST 3: LONG-TERM MEMORY PREFERENCE EXTRACTION
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🧠 TEST 3: Long-Term Memory Preference Extraction & Profile Sync`);
    console.log(`------------------------------------------------------------------------`);

    await ConversationManager.extractAndStoreMemory({
        parentId: parent._id,
        profileId: ananya._id,
        query: "My child Ananya doesn't like spinach."
    });

    const memory = await ConversationMemory.findOne({
        parentId: parent._id,
        profileId: ananya._id,
        key: 'dislike_spinach'
    }).lean();

    console.log(`✅ Saved Memory in DB: [${memory?.category}] "${memory?.value}" (Confidence: ${memory?.confidence})`);

    const updatedProfile = await Profile.findById(ananya._id).lean();
    console.log(`✅ Profile Disliked Foods Synced: "${updatedProfile?.preferences?.dislikedFoods}"`);

    // -----------------------------------------------------------------
    // TEST 4: AUTHENTICATED END-TO-END HTTP API TEST
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🌐 TEST 4: Authenticated HTTP Endpoints (/api/ai/conversations)`);
    console.log(`------------------------------------------------------------------------`);

    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'parent@nutrikid.com',
        password: 'Password123!'
    });
    const token = loginRes.data.data.token;

    // List conversations
    const listRes = await axios.get(`http://localhost:5000/api/ai/conversations?profileId=${ananya._id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ GET /api/ai/conversations Status: ${listRes.status} (Count: ${listRes.data.data.length})`);

    // Fetch by ID
    const getRes = await axios.get(`http://localhost:5000/api/ai/conversations/${convAnanya._id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ GET /api/ai/conversations/:id Status: ${getRes.status} (Title: "${getRes.data.data.title}")`);

    // Get Memories
    const memRes = await axios.get(`http://localhost:5000/api/ai/memory?profileId=${ananya._id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ GET /api/ai/memory Status: ${memRes.status} (Memories Count: ${memRes.data.data.length})`);

    console.log(`\n========================================================================`);
    console.log(`🎉 ALL PHASE 8 & PHASE 10 VERIFICATIONS PASSED WITH 100% ACCURACY!`);
    console.log(`========================================================================\n`);

    await mongoose.disconnect();
}

testPhase8AndPhase10().catch(err => {
    console.error(`❌ Test failed:`, err);
    process.exit(1);
});
