import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined in the backend .env file!");
    process.exit(1);
}

// Mock Child Profiles with specific deficiencies
const mockProfiles = [
    {
        name: "Aarav",
        age: 4,
        gender: "Male",
        height: 102,
        weight: 16,
        preferences: { dietaryPreferences: "Vegetarian" },
        wellnessAnalysis: {
            deficiencies: {
                iron: { severity: "RED", consumed: 4, target: 10, metPercent: 40 }
            }
        }
    },
    {
        name: "Ananya",
        age: 7,
        gender: "Female",
        height: 122,
        weight: 22,
        preferences: { dietaryPreferences: "Lactose-Free" },
        wellnessAnalysis: {
            deficiencies: {
                calcium: { severity: "ORANGE", consumed: 400, target: 800, metPercent: 50 },
                vitaminD: { severity: "RED", consumed: 2, target: 10, metPercent: 20 }
            }
        }
    },
    {
        name: "Kabir",
        age: 2,
        gender: "Male",
        height: 86,
        weight: 12,
        preferences: { dietaryPreferences: "None" },
        wellnessAnalysis: {
            deficiencies: {
                protein: { severity: "RED", consumed: 12, target: 25, metPercent: 48 }
            }
        }
    }
];

// Mock Child Plan Generator (simulates controller logic)
async function testChildPlan(profile) {
    const deficiencies = profile.wellnessAnalysis?.deficiencies || {};
    const activeDeficiencies = Object.keys(deficiencies).filter(
        key => deficiencies[key]?.severity === 'RED' || deficiencies[key]?.severity === 'ORANGE'
    );

    const prompt = `
You are a pediatric nutritionist specializing in traditional Indian cuisine.
Generate a highly personalized 7-day Indian diet plan (Monday to Sunday) for a child named ${profile.name}, age ${profile.age}, gender ${profile.gender}, height ${profile.height}cm, weight ${profile.weight}kg.
Active Deficiencies to address: ${activeDeficiencies.join(', ') || 'None (General Growth)'}.
Dietary preferences: ${profile.preferences?.dietaryPreferences || 'None'}.

Rules:
1. Recommend ONLY authentic, location-appropriate Indian dishes (e.g., Ragi Chilla, Palak Khichdi, Masala Roasted Makhana, Curd Rice, Moong Dal Chilla, Idli Sambar, Paneer Bhurji Paratha). Do NOT include non-Indian foods like avocado toast, quinoa, kale, blueberry smoothies, oats waffles, chia seed pudding, or general western foods.
2. Focus specifically on the child's active deficiencies:
   - If Iron deficiency: emphasize spinach (palak), beetroot, sesame/til, jaggery, ragi, and pairing with Vitamin C (sweet lime, lemon juice, amla) for absorption.
   - If Protein deficiency: emphasize paneer, curd, pulses, lentils, sprouted grains, nuts.
   - If Calcium/Vitamin D deficiency: emphasize milk, curd, ragi, sesame seeds, paneer, and daylight exposure.
   - If Hydration/Water gap: emphasize warm water, buttermilk/chaas, fresh coconut water, home-made fresh juices.
   - If Fiber gap: emphasize whole-grain rotis, fresh local vegetables (lauki, turai, bhindi, carrots), local fruits.
3. Keep the meals child-friendly, appealing, and easy to prepare using standard Indian household ingredients.
4. Provide a day-by-day JSON format structure matching this schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Brief focus name (e.g., Iron Absorption & Energy Boost)",
      "rationale": "Clear, concise scientific explanation of why these meals work for this child's deficiencies using Indian foods",
      "meals": {
        "breakfast": "Meal name and brief description",
        "lunch": "Meal name and brief description",
        "snack": "Meal name and brief description",
        "dinner": "Meal name and brief description"
      }
    }
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting.
`;

    const apiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }
    );

    const responseText = apiResponse.data.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
}

// Mock Unified Plan Generator (simulates controller logic)
async function testUnifiedPlan(profiles) {
    const childrenNames = [];
    const allDeficiencies = new Set();

    profiles.forEach(p => {
        childrenNames.push(p.name);
        const defs = p.wellnessAnalysis?.deficiencies || {};
        Object.keys(defs).forEach(key => {
            if (defs[key]?.severity === 'RED' || defs[key]?.severity === 'ORANGE') {
                allDeficiencies.add(key);
            }
        });
    });

    const compiledDeficiencies = Array.from(allDeficiencies);

    const prompt = `
You are a pediatric nutritionist specializing in traditional Indian cuisine.
Generate a unified weekly Indian diet plan (Monday to Sunday) designed for a family with children: ${childrenNames.join(', ')}.
The combined health deficiencies that need to be addressed across the children are: ${compiledDeficiencies.join(', ') || 'None (General Growth)'}.

Rules:
1. Recommending separate dishes for multiple children is exhausting for parents. Recommend ONE unified meal plan that meets all their nutritional requirements at once.
2. Recommend ONLY authentic, location-appropriate Indian dishes (e.g., Ragi Chilla, Palak Khichdi, Masala Roasted Makhana, Curd Rice, Moong Dal Chilla, Idli Sambar, Paneer Bhurji Paratha). Do NOT include non-Indian foods like avocado toast, quinoa, kale, blueberry smoothies, oats waffles, chia seed pudding, or general western foods.
3. Focus specifically on the children's combined active deficiencies:
   - If Iron: emphasize spinach, beetroot, sesame/til, jaggery, ragi, and pairing with Vitamin C (sweet lime, lemon juice, amla) for absorption.
   - If Protein: emphasize paneer, curd, pulses, lentils, sprouted grains, nuts.
   - If Calcium/Vitamin D: emphasize milk, curd, ragi, sesame seeds, paneer, and daylight exposure.
   - If Hydration/Water: emphasize warm water, buttermilk/chaas, fresh coconut water, home-made fresh juices.
   - If Fiber: emphasize whole-grain rotis, fresh local vegetables (lauki, turai, bhindi, carrots), local fruits.
4. Keep the meals child-friendly, appealing, and easy to prepare using standard Indian household ingredients.
5. Provide a day-by-day JSON format structure matching this schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Brief focus name (e.g., Combined Iron & Protein Boost)",
      "rationale": "Clear, concise explanation of why this menu works for the combined deficiencies (${compiledDeficiencies.join(', ')}) of all children (${childrenNames.join(', ')})",
      "meals": {
        "breakfast": "Meal name and brief description",
        "lunch": "Meal name and brief description",
        "snack": "Meal name and brief description",
        "dinner": "Meal name and brief description"
      }
    }
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting.
`;

    const apiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }
    );

    const responseText = apiResponse.data.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
}

// Execution and verification log
async function runVerification() {
    console.log("🚀 Starting Gemini Diet Plan Verification Suite...\n");

    // 1. Verify Aarav (Iron Deficiency)
    try {
        console.log("------------------------------------------------------------------");
        console.log(`🔍 1. Generating plan for Aarav (Deficiency: Iron)...`);
        const plan = await testChildPlan(mockProfiles[0]);
        console.log("✅ Success! Sample Day Plan:");
        console.log(JSON.stringify(plan.weeklyPlan[0], null, 2));

        // Check if iron-rich elements are mentioned in rationale or meals
        const mentionsIronSources = JSON.stringify(plan).toLowerCase().match(/palak|spinach|beetroot|ragi|jaggery|iron/g);
        if (mentionsIronSources) {
            console.log(`👍 VERIFIED: Plan contains iron elements: [${[...new Set(mentionsIronSources)].join(", ")}]`);
        } else {
            console.log("⚠️ Warning: Plan does not highlight specific iron-boosting ingredients.");
        }
    } catch (error) {
        if (error.response) {
            console.error("❌ Aarav plan generation failed:", error.response.status, JSON.stringify(error.response.data));
        } else {
            console.error("❌ Aarav plan generation failed:", error.message);
        }
    }

    // 2. Verify Ananya (Calcium & Vitamin D Deficiencies)
    try {
        console.log("\n------------------------------------------------------------------");
        console.log(`🔍 2. Generating plan for Ananya (Deficiency: Calcium & Vitamin D)...`);
        const plan = await testChildPlan(mockProfiles[1]);
        console.log("✅ Success! Sample Day Plan:");
        console.log(JSON.stringify(plan.weeklyPlan[0], null, 2));

        // Check if calcium/dairy elements are mentioned in rationale or meals
        const mentionsCalciumSources = JSON.stringify(plan).toLowerCase().match(/milk|curd|ragi|sesame|calcium|paneer/g);
        if (mentionsCalciumSources) {
            console.log(`👍 VERIFIED: Plan contains calcium/bone elements: [${[...new Set(mentionsCalciumSources)].join(", ")}]`);
        } else {
            console.log("⚠️ Warning: Plan does not highlight specific calcium-boosting ingredients.");
        }
    } catch (error) {
        if (error.response) {
            console.error("❌ Ananya plan generation failed:", error.response.status, JSON.stringify(error.response.data));
        } else {
            console.error("❌ Ananya plan generation failed:", error.message);
        }
    }

    // 3. Verify Unified Family Diet Plan (Combined Iron, Calcium, Protein, Vit D)
    try {
        console.log("\n------------------------------------------------------------------");
        console.log(`🔍 3. Generating Unified Family Diet Plan (Combined Deficiencies)...`);
        const plan = await testUnifiedPlan(mockProfiles);
        console.log("✅ Success! Sample Day Plan:");
        console.log(JSON.stringify(plan.weeklyPlan[0], null, 2));

        // Verify combined coverage
        const keywords = JSON.stringify(plan).toLowerCase();
        const ironFound = keywords.match(/palak|spinach|beetroot|iron|jaggery/g);
        const calciumFound = keywords.match(/milk|curd|calcium|paneer/g);
        const proteinFound = keywords.match(/protein|dal|chilla|lentil|paneer/g);

        console.log("\n📈 Combined Health Aspects Coverage Verification:");
        console.log(`   - Iron support: ${ironFound ? `✅ (Found: ${[...new Set(ironFound)].join(", ")})` : '❌ Not found'}`);
        console.log(`   - Calcium support: ${calciumFound ? `✅ (Found: ${[...new Set(calciumFound)].join(", ")})` : '❌ Not found'}`);
        console.log(`   - Protein support: ${proteinFound ? `✅ (Found: ${[...new Set(proteinFound)].join(", ")})` : '❌ Not found'}`);

        // Verify no random western foods
        const westernFoods = keywords.match(/avocado|quinoa|kale|blueberry|waffle|chia pudding/g);
        console.log(`   - Western food block: ${westernFoods ? `⚠️ Detected western foods: ${[...new Set(westernFoods)].join(", ")}` : '✅ (Passed: Only Indian cuisine recommended)'}`);

    } catch (error) {
        if (error.response) {
            console.error("❌ Unified plan generation failed:", error.response.status, JSON.stringify(error.response.data));
        } else {
            console.error("❌ Unified plan generation failed:", error.message);
        }
    }
    
    console.log("\n------------------------------------------------------------------");
    console.log("🏁 Verification Completed!");
}

runVerification();
