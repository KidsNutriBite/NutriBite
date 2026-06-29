import { calculateDynamicRDA, computeDynamicWellnessScore } from '../utils/nutritionIntelligence.js';

// Define mock profile matching the mongoose model schema
const mockProfile = {
    age: 5,
    gender: 'male',
    height: 100, // cm
    weight: 15,  // kg
    sportsActivityLevel: 'Active',
    healthConditions: ['Anemia'],
    preferences: {
        favoriteFoods: 'Vegetarian',
        dislikedFoods: 'Eggs, milk'
    }
};

// Define mock meal logs
const mockMealLogs = [
    {
        date: "2026-06-21",
        breakfast: [
            { name: "Roti", quantity: "2 pieces", calories: 160, protein: 5, carbs: 32, fats: 1 },
            { name: "Curd", quantity: "1 bowl", calories: 100, protein: 4, carbs: 6, fats: 4 }
        ],
        lunch: [
            { name: "Spinach", quantity: "1 bowl", calories: 50, protein: 2, carbs: 5, fats: 0.5, iron: 3.0, calcium: 100 }
        ],
        dinner: [
            { name: "White Rice", quantity: "1 bowl", calories: 200, protein: 4, carbs: 44, fats: 0.5 }
        ]
    }
];

const testRunner = () => {
    console.log("=== STARTING PEDIATRIC NUTRITION INTELLIGENCE TEST ===");

    // Test 1: RDA Calculation
    console.log("\n[Test 1] Calculating Dynamic RDA Targets...");
    const rda = calculateDynamicRDA(mockProfile);
    console.log("RDA Targets Output:");
    console.log(`- Calories: ${rda.calories} kcal (Base: 1400, +15% Active)`);
    console.log(`- Protein: ${rda.protein}g (Base: 19, +10% Active)`);
    console.log(`- Iron: ${rda.iron}mg (Base: 11, +30% Anemia)`);
    console.log(`- Vitamin C: ${rda.vitaminC}mg (Base: 40, +20% Anemia)`);
    console.log(`- Calcium: ${rda.calcium}mg`);
    console.log(`- Water: ${rda.water}ml`);

    // Verify iron scaling
    if (rda.iron !== 14.3) {
        console.error("❌ Iron RDA calculation is incorrect. Expected: 14.3, Got:", rda.iron);
        process.exit(1);
    }
    console.log("✅ RDA Targets correctly adjusted for activity level and health condition!");

    // Test 2: Dynamic Wellness & Deficiency Risk Engine
    console.log("\n[Test 2] Running Wellness Analysis & Deficiency Engine...");
    const analysis = computeDynamicWellnessScore(mockProfile, mockMealLogs);
    
    console.log("Sub-scores:");
    console.log(`- Overall Wellness Score: ${analysis.score}/100`);
    console.log(`- Nutrition Score: ${analysis.nutritionScore}/100`);
    console.log(`- Deficiency Score: ${analysis.deficiencyScore}/100`);
    console.log(`- Growth Risk Score: ${analysis.growthRiskScore}/100`);
    console.log(`- Hydration Score: ${analysis.hydrationScore}/100`);
    console.log(`- Meal Quality Score: ${analysis.mealQualityScore}/100`);

    console.log("\nDeficiencies Detected:");
    Object.keys(analysis.deficiencies).forEach(n => {
        const item = analysis.deficiencies[n];
        if (item.metPercent < 90) {
            console.log(`- ${n.toUpperCase()}: Met ${item.metPercent}% (${item.consumed} / ${item.target}) - Severity: ${item.severity}`);
        }
    });

    console.log("\nSmart Grocery List Recommendations:");
    console.log(analysis.groceries);

    console.log("\nPhased Improvement Plan:");
    console.log(`- Target Score: ${analysis.improvementPlan.targetWellnessScore}`);
    console.log(`- Duration: ${analysis.improvementPlan.expectedDurationDays} days`);
    console.log(`- Day 7 Phased Action: ${analysis.improvementPlan.phases.day7.action}`);

    console.log("\nAI Parent Explanation Block:");
    console.log(`"${analysis.aiExplanation}"`);

    // Basic structure assertions
    if (!analysis.score || !analysis.nutritionScore || !analysis.deficiencies.protein) {
        console.error("❌ Wellness analysis structure is incomplete.");
        process.exit(1);
    }

    console.log("\n✅ Wellness Analysis completed successfully!");
    console.log("\n=== ALL NUTRITION INTELLIGENCE TESTS PASSED ===");
};

testRunner();
