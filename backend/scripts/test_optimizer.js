import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeNutrition } from '../services/nutritionService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const profileId = "6a2d2b4c02b1b842e3515b8c"; // Ravi

async function run() {
    try {
        console.log("Connecting to database:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        console.log("Running analyzeNutrition for profile Ravi...");
        const result = await analyzeNutrition(profileId);
        
        console.log("\n--- OPTIMIZED GROCERY PLAN ---");
        console.log("Total Items:", result.groceryPlanSummary.totalItems);
        console.log("Critical Items Count:", result.groceryPlanSummary.criticalItems);
        console.log("High Priority Items Count:", result.groceryPlanSummary.highPriorityItems);
        console.log("Multi-Nutrient Items Count:", result.groceryPlanSummary.multiNutrientItems);
        console.log("Weekly Impacts:", result.groceryPlanSummary.weeklyImpacts);

        console.log("\n--- SHOPPING INSIGHTS ---");
        result.groceryPlanInsights.forEach((ins, idx) => {
            console.log(`${idx + 1}. ${ins}`);
        });

        console.log("\n--- CATEGORY LIST & ITEMS ---");
        const categories = {};
        result.groceryPlan.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push({
                food: item.food,
                priority: item.priority,
                nutrients: item.nutrients,
                usedInMeals: item.usedInMeals,
                score: item.score
            });
        });

        Object.keys(categories).forEach(cat => {
            console.log(`\nCategory: ${cat} (${categories[cat].length} items)`);
            categories[cat].forEach(item => {
                console.log(`  - [${item.priority}] ${item.food} (Score: ${item.score})`);
                console.log(`    Solves Gaps: ${item.nutrients.join(', ')}`);
                if (item.usedInMeals.length > 0) {
                    console.log(`    Used In Meals: ${item.usedInMeals.join(', ')}`);
                }
            });
        });

        console.log("\nDatabase verification successful!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error in verification test:", err);
        process.exit(1);
    }
}

run();
