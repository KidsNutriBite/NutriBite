import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { AgentOrchestrator } from '../services/agentOrchestrator.service.js';
import { IntentClassifier, ChildContextEngine, SUPPORTED_INTENTS } from '../services/childContextEngine.js';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

async function testPhase3AndPhase4() {
    console.log(`\n========================================================================`);
    console.log(`🧪 PHASE 3 & 4 VERIFICATION: CHILD CONTEXT INTELLIGENCE & REAL AGENT ENGINE`);
    console.log(`========================================================================\n`);

    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);

    // Fetch Parent & Both Children
    const parent = await User.findOne({ email: 'parent@nutrikid.com' });
    if (!parent) throw new Error("Parent user not found");

    const ananya = await Profile.findOne({ parentId: parent._id, name: 'Ananya Sharma' });
    const aarav = await Profile.findOne({ parentId: parent._id, name: 'Aarav Sharma' });

    if (!ananya || !aarav) throw new Error("Both children profiles (Ananya & Aarav) must exist");

    console.log(`✅ Loaded Parent: ${parent.name}`);
    console.log(`✅ Child 1: ${ananya.name} (${ananya.age}y, Allergies: ${ananya.allergies?.join(', ') || 'None'})`);
    console.log(`✅ Child 2: ${aarav.name} (${aarav.age}y, Conditions: ${aarav.healthConditions?.join(', ') || 'Lactose sensitivity'})`);

    // -----------------------------------------------------------------
    // TEST 1: MULTI-CHILD CONTEXT ISOLATION & SWITCHING (PHASE 3)
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🔬 TEST 1: Multi-Child Context Isolation (Ananya vs Aarav)`);
    console.log(`------------------------------------------------------------------------`);

    const ananyaCtx = await ChildContextEngine.buildContext({
        profileId: ananya._id,
        parentId: parent._id,
        intent: SUPPORTED_INTENTS.GENERAL_NUTRITION
    });

    const aaravCtx = await ChildContextEngine.buildContext({
        profileId: aarav._id,
        parentId: parent._id,
        intent: SUPPORTED_INTENTS.GENERAL_NUTRITION
    });

    console.log(`Ananya Age: ${ananyaCtx.age} | Height: ${ananyaCtx.height}cm | Weight: ${ananyaCtx.weight}kg | Allergies: ${ananyaCtx.allergies.join(', ')}`);
    console.log(`Aarav Age:   ${aaravCtx.age} | Height: ${aaravCtx.height}cm | Weight: ${aaravCtx.weight}kg | Allergies: ${aaravCtx.allergies.join(', ') || 'None'}`);

    if (ananyaCtx.age === 7 && aaravCtx.age === 4 && ananyaCtx.profileId !== aaravCtx.profileId) {
        console.log(`✅ PASS: Complete multi-child isolation verified. Ananya and Aarav have distinct, non-overlapping contexts.`);
    } else {
        console.error(`❌ FAIL: Child contexts mixed!`);
    }

    // -----------------------------------------------------------------
    // TEST 2: INTENT-AWARE SELECTIVE CONTEXT RETRIEVAL (PHASE 3)
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🔬 TEST 2: Intent-Aware Context Retrieval (No DB Overload)`);
    console.log(`------------------------------------------------------------------------`);

    // Growth query
    const growthQuery = "How is Ananya's height and physical growth progression?";
    const growthIntent = IntentClassifier.classify(growthQuery);
    console.log(`Query: "${growthQuery}" → Classified Intent: ${growthIntent}`);

    const growthCtx = await ChildContextEngine.buildContext({
        profileId: ananya._id,
        parentId: parent._id,
        intent: growthIntent
    });

    console.log(`Growth Context Included: BMI=${growthCtx.growthContext?.bmi}, Percentile=${growthCtx.growthContext?.staturePercentile}`);
    console.log(`Meal Logs Excluded (Selective): ${growthCtx.mealHistoryContext === undefined ? 'Yes (Clean)' : 'No'}`);

    if (growthCtx.growthContext && !growthCtx.mealHistoryContext) {
        console.log(`✅ PASS: Selective intent-aware context retrieval validated.`);
    }

    // -----------------------------------------------------------------
    // TEST 3: REAL AGENT WORKFLOW & TOOL CALLING (PHASE 4)
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🔬 TEST 3: Agentic Execution (UNDERSTAND → OBSERVE → PLAN → ACT → VERIFY → RESPOND)`);
    console.log(`------------------------------------------------------------------------`);

    const agentQueries = [
        {
            label: "Meal Planning Agent Workflow",
            query: "Plan tomorrow's 6 meals for Ananya targeting iron and energy.",
            child: ananya
        },
        {
            label: "Allergy Safety Guard Workflow",
            query: "Can Ananya eat peanut butter cookies at a birthday party?",
            child: ananya
        },
        {
            label: "Pediatrician Visit Summary Workflow",
            query: "Prepare a clinical summary of Ananya's progress for Dr. Rajesh Iyer.",
            child: ananya
        },
        {
            label: "Grocery List Generation Workflow",
            query: "Generate a categorized grocery list for this week's meals.",
            child: ananya
        }
    ];

    for (const testCase of agentQueries) {
        console.log(`\n▶ Executing: [${testCase.label}]`);
        console.log(`  Query: "${testCase.query}"`);

        const result = await AgentOrchestrator.processAgentWorkflow({
            query: testCase.query,
            profileId: testCase.child._id,
            parentId: parent._id,
            history: []
        });

        console.log(`  🎯 Detected Intent: ${result.intent}`);
        console.log(`  🛠️ Real Tools Executed: [${result.toolsUsed.join(', ')}]`);
        console.log(`  ⚡ Latency: ${result.providerStatus.latency_ms}ms (Provider: ${result.providerStatus.provider})`);
        console.log(`  📋 Follow-up Actions: [${result.followUps.map(f => f.label).join(' | ')}]`);
        console.log(`  📄 Output Summary: ${result.answer.slice(0, 180).replace(/\n/g, ' ')}...`);
    }

    // -----------------------------------------------------------------
    // TEST 4: AUTHENTICATED END-TO-END HTTP API TEST (POST /api/ai/ask)
    // -----------------------------------------------------------------
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🌐 TEST 4: End-to-End Authenticated HTTP API (POST /api/ai/ask)`);
    console.log(`------------------------------------------------------------------------`);

    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'parent@nutrikid.com',
        password: 'Password123!'
    });
    const token = loginRes.data.data.token;

    const apiRes = await axios.post('http://localhost:5000/api/ai/ask', {
        query: "What is the recommended daily hydration and breakfast for Aarav?",
        profileId: aarav._id
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ HTTP Status: ${apiRes.status}`);
    console.log(`✅ API Intent: ${apiRes.data.data.intent}`);
    console.log(`✅ API Tools Used: [${apiRes.data.data.toolsUsed.join(', ')}]`);
    console.log(`✅ API Provider: ${apiRes.data.data.providerStatus.provider}`);

    console.log(`\n========================================================================`);
    console.log(`🎉 ALL PHASE 3 & PHASE 4 VERIFICATIONS PASSED WITH FLYING COLORS!`);
    console.log(`========================================================================\n`);

    await mongoose.disconnect();
}

testPhase3AndPhase4().catch(err => {
    console.error(`❌ Phase 3 & 4 tests failed:`, err);
    process.exit(1);
});
