import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Profile from '../models/Profile.model.js';
import User from '../models/User.model.js';
import MealLog from '../models/MealLog.model.js';
import { analyzeNutrition } from '../services/nutritionService.js';

async function testOptimizer() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrikid');
  
  const profiles = await Profile.find({ name: { $in: [/Ananya/i, /Aarav/i] } });
  console.log(`Found ${profiles.length} profiles to test.`);

  for (const prof of profiles) {
    console.log(`\n======================================================`);
    console.log(`🛒 TESTING SMART GROCERY OPTIMIZER FOR: ${prof.name} (${prof.age}y, ${prof.gender})`);
    console.log(`======================================================`);

    const result = await analyzeNutrition(prof._id);
    
    console.log(`\n📊 Grocery Summary:`);
    console.log(`   Total Items to Buy: ${result.groceryPlanSummary.totalItems}`);
    console.log(`   Critical Priority Items: ${result.groceryPlanSummary.criticalItems}`);
    console.log(`   High Priority Items: ${result.groceryPlanSummary.highPriorityItems}`);
    console.log(`   Multi-Nutrient Items: ${result.groceryPlanSummary.multiNutrientItems}`);
    console.log(`   Weekly Impacts:`, result.groceryPlanSummary.weeklyImpacts);
    
    console.log(`\n💡 Smart Shopping Insights:`);
    result.groceryPlanInsights.forEach((ins, idx) => console.log(`   ${idx + 1}. ${ins}`));

    console.log(`\n📋 Grocery Items Catalog (${result.groceryPlan.length} items):`);
    result.groceryPlan.forEach((item, idx) => {
      console.log(`   [${idx + 1}] ${item.food} | Category: ${item.category} | Priority: ${item.priority} | Nutrients: [${item.nutrients.join(', ')}]`);
      console.log(`       Rationale: ${item.rationale}`);
      if (item.usedInMeals?.length > 0) {
        console.log(`       Used in Meals: ${item.usedInMeals.join(', ')}`);
      }
    });
  }

  await mongoose.disconnect();
}

testOptimizer().catch(err => {
  console.error('Optimizer test error:', err);
  process.exit(1);
});
