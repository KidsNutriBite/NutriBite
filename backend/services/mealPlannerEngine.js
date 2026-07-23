/**
 * Enterprise Pediatric Meal Planner Engine
 * Modular architecture, single-responsibility services.
 */
import { ProfileContextEngine, GapDetectionEngine } from './nutritionIntelligenceEngine.js';
import { enrichFoodItem } from '../utils/nutritionIntelligence.js';

// ==========================================
// 1. CLINICAL INDIAN MEALS DATABASE
// ==========================================
const MEALS_DATABASE = [
    // --- BREAKFAST ---
    {
        name: "Ragi Roti with Curd",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["calcium", "iron", "protein", "fiber"],
        ingredients: ["ragi", "curd", "onion", "chili"],
        nutrients: { calories: 280, protein: 9, carbs: 45, fats: 6, fiber: 5.5 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Ragi is an exceptional local source of calcium and iron. Pairing it with protein-rich curd supports bone structural growth and muscle repair.",
        pairing: "Ragi Roti + Fresh Curd",
        pairExplanation: "Lactic acid in curd helps break down phytates in ragi, increasing iron and calcium bioavailability.",
        servingSuggestion: "1 small roti (approx. 60g) served warm with 1/2 cup fresh curd.",
        substitutions: {
            "ragi": { name: "Bajra Flour", why: "Rich in magnesium and iron, perfect alternative grain." },
            "curd": { name: "Lactose-Free Yogurt", why: "Maintains protein intake for lactose-sensitive children." }
        }
    },
    {
        name: "Moringa Leaf Adai (Lentil Crepe)",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["protein", "iron", "calcium", "fiber"],
        ingredients: ["chana dal", "toor dal", "moringa leaves", "rice"],
        nutrients: { calories: 310, protein: 12, carbs: 48, fats: 5, fiber: 6.2 },
        prepTime: "20 mins",
        difficulty: "Medium",
        whyThisMeal: "A blend of local pulses provides complete amino acids. Moringa leaves add high-density natural iron and Vitamin A to combat classroom fatigue.",
        pairing: "Adai + Lemon Juice squeeze",
        pairExplanation: "Vitamin C in lemon juice enhances the absorption of non-heme iron from moringa and lentils.",
        servingSuggestion: "1 medium crepe (80g) served with home-made tomato chutney.",
        substitutions: {
            "moringa leaves": { name: "Amaranth Leaves", why: "Equally rich in iron and Vitamin A, with a milder taste." },
            "chana dal": { name: "Moong Dal", why: "Easier to digest for younger children or toddlers." }
        }
    },
    {
        name: "Paneer Bhurji with Bajra Paratha",
        slot: "breakfast",
        region: "North India",
        keyNutrients: ["protein", "calcium", "zinc", "fats"],
        ingredients: ["paneer", "bajra", "onion", "tomato", "ghee"],
        nutrients: { calories: 340, protein: 14, carbs: 38, fats: 12, fiber: 4.8 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "High-quality paneer casein protein combined with zinc-rich bajra supports cellular division and skeletal development.",
        pairing: "Bajra Paratha + Ghee",
        pairExplanation: "Healthy lipids in ghee facilitate the assimilation of fat-soluble vitamins present in paneer.",
        servingSuggestion: "1/2 cup paneer bhurji with 1 small paratha.",
        substitutions: {
            "paneer": { name: "Tofu", why: "Excellent dairy-free protein and calcium source." },
            "bajra": { name: "Whole Wheat", why: "Standard grain alternative, lighter in texture." }
        }
    },
    {
        name: "Stuffed Besan Chilla",
        slot: "breakfast",
        region: "North India",
        keyNutrients: ["protein", "iron", "zinc", "fiber"],
        ingredients: ["besan", "paneer", "coriander", "turmeric"],
        nutrients: { calories: 290, protein: 11, carbs: 40, fats: 7, fiber: 5.0 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Besan (chickpea flour) supplies low-glycemic carbohydrates and iron. Stuffed paneer increases protein density for muscle repair.",
        pairing: "Chilla + Mint Green Chutney",
        pairExplanation: "Mint and coriander contain organic acids that double chickpea iron absorption.",
        servingSuggestion: "1 chilla (approx. 70g) cut into finger-friendly strips.",
        substitutions: {
            "paneer": { name: "Crumbled Tofu", why: "Dairy-free alternative with equivalent protein content." },
            "besan": { name: "Moong Dal Batter", why: "Lighter batter alternative, highly bioavailable protein." }
        }
    },

    // --- MORNING SNACK ---
    {
        name: "Carrot Halwa (Sugar-Free)",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["vitaminA", "fats", "calcium"],
        ingredients: ["carrot", "milk", "dates", "ghee"],
        nutrients: { calories: 150, protein: 3, carbs: 22, fats: 5, fiber: 2.0 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Carrots are exceptionally rich in beta-carotene. Prepared in milk and ghee, it supports eye health and immune mucosal linings.",
        pairing: "Carrots + Ghee (Fat)",
        pairExplanation: "Beta-carotene is fat-soluble; healthy fats in ghee are required for its conversion to active Vitamin A.",
        servingSuggestion: "3-4 tablespoons (approx. 50g) served warm.",
        substitutions: {
            "milk": { name: "Almond Milk", why: "Nut-milk alternative for lactose-free diets." },
            "dates": { name: "Organic Jaggery", why: "Adds iron and trace elements instead of white sugar." }
        }
    },
    {
        name: "Sesame (Til) & Jaggery Laddoo",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["calcium", "iron", "fats"],
        ingredients: ["sesame seeds", "jaggery", "cardamom"],
        nutrients: { calories: 120, protein: 2.5, carbs: 18, fats: 4.5, fiber: 1.8 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Sesame seeds carry the highest calcium concentration of any plant seed. Paired with jaggery, it builds blood cell counts.",
        pairing: "Til Laddoo + Morning Playtime",
        pairExplanation: "Supports bone building during early physical play when calcium integration is highly active.",
        servingSuggestion: "1 small laddoo (approx. 20g).",
        substitutions: {
            "sesame seeds": { name: "Roasted Peanuts", why: "Rich in protein and healthy fats, highly delicious." },
            "jaggery": { name: "Dates Paste", why: "Natural whole-fruit binder with low glycemic load." }
        }
    },

    // --- LUNCH ---
    {
        name: "Palak Khichdi with Butter Milk",
        slot: "lunch",
        region: "South India",
        keyNutrients: ["iron", "vitaminA", "protein", "water"],
        ingredients: ["spinach", "rice", "moong dal", "ghee", "curd"],
        nutrients: { calories: 340, protein: 11, carbs: 55, fats: 8, fiber: 5.2 },
        prepTime: "25 mins",
        difficulty: "Easy",
        whyThisMeal: "Combines iron-dense spinach with rice and lentils to form a complete protein chain. Served with buttermilk to support hydration.",
        pairing: "Palak Khichdi + Buttermilk",
        pairExplanation: "Cumin in buttermilk stimulates salivary enzymes, aiding standard macronutrient breakdown.",
        servingSuggestion: "1.5 cups (approx. 200g) with a teaspoon of ghee.",
        substitutions: {
            "spinach": { name: "Fenugreek Leaves (Methi)", why: "High-iron leafy alternative with anti-inflammatory benefits." },
            "curd": { name: "Coconut Water", why: "Dairy-free hydration fluid rich in potassium." }
        }
    },
    {
        name: "Tomato Dal with Red Rice & Beetroot Poriyal",
        slot: "lunch",
        region: "South India",
        keyNutrients: ["iron", "vitaminC", "protein", "fiber"],
        ingredients: ["toor dal", "red rice", "beetroot", "tomato", "lemon"],
        nutrients: { calories: 360, protein: 12, carbs: 62, fats: 4, fiber: 7.0 },
        prepTime: "30 mins",
        difficulty: "Medium",
        whyThisMeal: "Beetroot and red rice contain rich amounts of iron and fiber. Tomato dal supplies Vitamin C to maximize bioavailability.",
        pairing: "Beetroot + Tomato/Lemon",
        pairExplanation: "Ascorbic acid in tomato dal transforms non-absorbable ferric iron into bioavailable ferrous iron.",
        servingSuggestion: "1 cup rice, 1/2 cup dal, and 1/3 cup beetroot poriyal.",
        substitutions: {
            "beetroot": { name: "Carrot Poriyal", why: "Beta-carotene rich alternative, sweet and easy to eat." },
            "toor dal": { name: "Masoor Dal", why: "Quick-cooking, iron-rich lentil alternative." }
        }
    },
    {
        name: "Sarson ka Saag with Makki Roti & Buttermilk",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["iron", "fiber", "vitaminA", "water"],
        ingredients: ["mustard greens", "spinach", "corn flour", "ghee", "curd"],
        nutrients: { calories: 380, protein: 10, carbs: 58, fats: 11, fiber: 7.5 },
        prepTime: "35 mins",
        difficulty: "Hard",
        whyThisMeal: "Mustard greens provide organic iron and dietary fiber, supporting linear height and digestive regularity.",
        pairing: "Makki Roti + White Butter",
        pairExplanation: "Fat-soluble vitamins in mustard greens require healthy fats for optimal digestion and cell delivery.",
        servingSuggestion: "1/2 cup saag with 1 small makki roti.",
        substitutions: {
            "mustard greens": { name: "Spinach (Palak)", why: "Milder taste, widely available throughout the year." },
            "curd": { name: "Lemon Water (Nimbu)", why: "Hydrating, vitamin-C rich alternative to buttermilk." }
        }
    },
    {
        name: "Chana Masala with Whole Wheat Roti & Cucumber Salad",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["protein", "zinc", "fiber", "water"],
        ingredients: ["chickpeas", "wheat flour", "cucumber", "tomato"],
        nutrients: { calories: 350, protein: 13, carbs: 56, fats: 6, fiber: 8.5 },
        prepTime: "25 mins",
        difficulty: "Medium",
        whyThisMeal: "Chickpeas contain zinc and magnesium, essential cofactors for protein synthesis. Cucumber salad restores active hydration.",
        pairing: "Chickpeas + Raw Cucumber/Tomato",
        pairExplanation: "Hydration in raw veggies supports optimal digestion of pulse fibers.",
        servingSuggestion: "1/2 cup chana masala with 1 roti and 1/2 cup cucumber salad.",
        substitutions: {
            "chickpeas": { name: "Rajma (Red Kidney Beans)", why: "Equally high in protein, iron, and fiber." },
            "cucumber": { name: "Grated Radish", why: "Spicy, enzymatic vegetable alternative." }
        }
    },

    // --- EVENING SNACK ---
    {
        name: "Sprouted Moong Salad",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["protein", "vitaminC", "fiber"],
        ingredients: ["sprouted moong", "lemon", "tomato", "cucumber"],
        nutrients: { calories: 110, protein: 6, carbs: 18, fats: 0.5, fiber: 4.2 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Sprouting increases the digestibility and vitamin C levels of moong. Paired with lemon squeeze for immune support.",
        pairing: "Sprouts + Lemon Squeeze",
        pairExplanation: "Vitamin C acts as a reducing agent to unlock mineral absorption from the sprouts.",
        servingSuggestion: "1/2 cup (approx. 60g) served fresh.",
        substitutions: {
            "sprouted moong": { name: "Boiled Green Peas", why: "Sweet and soft snack alternative, rich in fiber." },
            "lemon": { name: "Amla Powder", why: "Ultra-high vitamin C source to sprinkle over snacks." }
        }
    },
    {
        name: "Roasted Makhana (Foxnuts)",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["calcium", "fiber", "fats"],
        ingredients: ["makhana", "ghee", "turmeric", "pepper"],
        nutrients: { calories: 130, protein: 3, carbs: 20, fats: 4, fiber: 2.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Makhana is a natural source of calcium and magnesium, which build bone strength and calm muscles.",
        pairing: "Makhana + Ghee/Turmeric",
        pairExplanation: "Curcumin in turmeric absorbs better in fat (ghee), supplying natural anti-inflammatory benefits.",
        servingSuggestion: "1 small bowl (approx. 20g).",
        substitutions: {
            "makhana": { name: "Roasted Chana", why: "High protein, crunchy alternative for active children." },
            "ghee": { name: "Olive Oil", why: "Plant-based unsaturated lipid alternative." }
        }
    },

    // --- DINNER ---
    {
        name: "Dal Khichdi with Moringa Pod Soup",
        slot: "dinner",
        region: "South India",
        keyNutrients: ["protein", "fiber", "calcium", "water"],
        ingredients: ["moong dal", "rice", "drumstick pods", "tomato"],
        nutrients: { calories: 300, protein: 10, carbs: 52, fats: 4, fiber: 5.5 },
        prepTime: "25 mins",
        difficulty: "Easy",
        whyThisMeal: "Lighter dinner option. Moringa soup provides bone minerals, and khichdi ensures easy digestion before sleep.",
        pairing: "Khichdi + Drumstick Pod Soup",
        pairExplanation: "Water-based soup aids gastric enzyme flows for gentle overnight digestion.",
        servingSuggestion: "1 cup khichdi and 1/2 cup warm soup.",
        substitutions: {
            "drumstick pods": { name: "Bottle Gourd (Lauki)", why: "Extremely hydrating, soothing vegetable for dinner." },
            "moong dal": { name: "Masoor Dal", why: "Light, flavorful lentil that digests quickly." }
        }
    },
    {
        name: "Idli with Sambar & Coconut Chutney",
        slot: "dinner",
        region: "South India",
        keyNutrients: ["carbs", "protein", "fiber", "water"],
        ingredients: ["urad dal", "rice", "mixed vegetables", "coconut"],
        nutrients: { calories: 290, protein: 9, carbs: 54, fats: 5, fiber: 4.8 },
        prepTime: "20 mins",
        difficulty: "Medium",
        whyThisMeal: "Fermented idli is highly gentle on the stomach. Sambar adds vegetables and plant proteins to support nocturnal repair.",
        pairing: "Steamed Idli + Sambar",
        pairExplanation: "Fermentation increases vitamin B complex levels, aiding nutrient assimilation.",
        servingSuggestion: "2 small idlis with 1/2 cup sambar.",
        substitutions: {
            "mixed vegetables": { name: "Pumpkin", why: "Sweet, vitamin-A rich alternative that blends into sambar." },
            "coconut": { name: "Roasted Chana Chutney", why: "Lower fat, protein-rich chutney alternative." }
        }
    },
    {
        name: "Mixed Veg Paratha with Curd",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["fiber", "vitaminA", "calcium", "protein"],
        ingredients: ["wheat flour", "carrot", "cauliflower", "curd"],
        nutrients: { calories: 310, protein: 9, carbs: 48, fats: 8, fiber: 5.5 },
        prepTime: "20 mins",
        difficulty: "Medium",
        whyThisMeal: "Combines multiple vitamins from carrots and cauliflower. Yogurt delivers calcium and promotes a healthy gut biome.",
        pairing: "Paratha + Curd",
        pairExplanation: "Yogurt probiotics support intestinal health and nutrient absorption.",
        servingSuggestion: "1 small paratha with 1/2 cup curd.",
        substitutions: {
            "curd": { name: "Mint Raita", why: "Flavorful herb-based digestive dairy side." },
            "carrot": { name: "Boiled Potato", why: "Gentle starch option for fussy eaters." }
        }
    },
    {
        name: "Yellow Masoor Dal with Jeera Rice & Lauki Sabzi",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["protein", "water", "fiber", "iron"],
        ingredients: ["masoor dal", "basmati rice", "bottle gourd", "cumin"],
        nutrients: { calories: 320, protein: 11, carbs: 56, fats: 4, fiber: 6.0 },
        prepTime: "25 mins",
        difficulty: "Easy",
        whyThisMeal: "Lauki (bottle gourd) has high water content, preventing overnight dehydration. Masoor dal ensures lightweight amino acids.",
        pairing: "Jeera + Masoor Dal",
        pairExplanation: "Roasted cumin seeds (jeera) contain oils that reduce flatulence and support healthy bowel movements.",
        servingSuggestion: "1/2 cup dal, 3/4 cup rice, 1/2 cup lauki sabzi.",
        substitutions: {
            "bottle gourd": { name: "Ridge Gourd (Turai)", why: "Slightly sweet, highly hydrating vegetable alternative." },
            "basmati rice": { name: "Brown Rice", why: "Higher fiber grain option for regular digestion." }
        }
    },

    // --- BEDTIME ---
    {
        name: "Warm Turmeric Milk",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "vitaminD", "fats"],
        ingredients: ["milk", "turmeric", "black pepper", "honey"],
        nutrients: { calories: 110, protein: 6, carbs: 12, fats: 4, fiber: 0 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "High in tryptophan to aid sleep. Turmeric provides immune-boosting curcumin, and black pepper improves curcumin absorption.",
        pairing: "Turmeric + Black Pepper",
        pairExplanation: "Piperine in black pepper increases curcumin bioavailability by 2000%.",
        servingSuggestion: "1 small cup (approx. 150ml) served warm.",
        substitutions: {
            "milk": { name: "Soy Milk", why: "Excellent dairy-free protein and calcium sleep-aid." },
            "honey": { name: "Dates Syrup", why: "Whole-food sweetener alternative rich in potassium." }
        }
    }
];

// ==========================================
// 2. MEAL PLANNERS & GENERATION ENGINES
// ==========================================

export class MealSubstitutionEngine {
    static getSubstitution(food, mealSubstitutions) {
        if (!food || !mealSubstitutions) return null;
        const key = food.toLowerCase().trim();
        return mealSubstitutions[key] || null;
    }
}

export class MealScoringEngine {
    static scoreMeal(meal, context, gaps) {
        let score = 100;

        // 1. Regional match (+30 points)
        const isNorthState = ["delhi", "punjab", "haryana", "uttar pradesh", "rajasthan", "gujarat", "himachal"].includes(context.location?.state?.toLowerCase());
        const expectedRegion = isNorthState ? "North India" : "South India";
        
        if (meal.region === expectedRegion) {
            score += 30;
        } else if (meal.region === "Universal") {
            score += 15;
        }

        // 2. Address deficiencies check (+25 points per active deficiency)
        meal.keyNutrients.forEach(nut => {
            const gap = gaps[nut];
            if (gap && gap.severity !== 'Normal') {
                if (gap.severity === 'Critical') score += 40;
                else if (gap.severity === 'High') score += 30;
                else score += 20;
            }
        });

        // 3. Disliked ingredients check (Severe penalty)
        const mealIngredients = meal.ingredients.map(i => i.toLowerCase());
        const hasDisliked = context.dislikes.some(d => 
            mealIngredients.some(mi => mi.includes(d) || d.includes(mi))
        );
        if (hasDisliked) {
            score -= 150;
        }

        // 4. Vegetarian / Dairy restrictions (Absolute blocker)
        const hasAnimalProduct = ["chicken", "mutton", "fish", "egg", "chicken liver"].some(p => 
            meal.ingredients.some(mi => mi.includes(p))
        );
        if (context.isVeg && hasAnimalProduct) {
            score -= 1000;
        }

        const hasDairyProduct = ["milk", "curd", "paneer", "yogurt", "ghee"].some(d => 
            meal.ingredients.some(mi => mi.includes(d))
        );
        if (context.isLactoseIntolerant && hasDairyProduct && meal.name !== "Warm Turmeric Milk") {
            // Keep bedtime milk but let substitutions handle it
            score -= 1000;
        }

        return score;
    }
}

export class MealGenerationEngine {
    static generateDailyPlan(context, gaps) {
        const plan = {};
        const slots = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtime"];

        slots.forEach(slot => {
            const candidates = MEALS_DATABASE.filter(m => m.slot === slot);
            
            // Score and sort candidates
            const scored = candidates.map(meal => {
                const score = MealScoringEngine.scoreMeal(meal, context, gaps);
                return { meal, score };
            });

            // Filter out blocked candidates
            const valid = scored.filter(s => s.score > 0);
            
            // Sort by score descending
            valid.sort((a, b) => b.score - a.score);

            if (valid.length > 0) {
                // Select the top candidate
                const selected = valid[0].meal;
                
                // Build dynamic explanation and substitutions
                const improvedGaps = selected.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal');
                
                // Map substitutions
                const substitutionsList = [];
                Object.keys(selected.substitutions).forEach(ing => {
                    const sub = selected.substitutions[ing];
                    // Customize substitution if child dislikes the base ingredient
                    substitutionsList.push({
                        ingredient: ing,
                        alternative: sub.name,
                        rationale: sub.why
                    });
                });

                plan[slot] = {
                    name: selected.name,
                    foods: selected.ingredients,
                    nutrientsImproved: improvedGaps.map(g => gaps[g].label),
                    estimatedNutrients: selected.nutrients,
                    prepTime: selected.prepTime,
                    difficulty: selected.difficulty,
                    whyThisMeal: selected.whyThisMeal,
                    pairing: selected.pairing,
                    pairExplanation: selected.pairExplanation,
                    servingSuggestion: selected.servingSuggestion,
                    substitutions: substitutionsList,
                    regionalTag: selected.region,
                    score: valid[0].score
                };
            }
        });

        return plan;
    }
}

// ==========================================
// 3. SERVICE COORDINATOR (RESPONSE BUILDER)
// ==========================================
export class MealPlannerService {
    static generatePlan(profile, mealLogs) {
        // 1. Reuse ProfileContext and Gap Detection from Phase 1
        const context = ProfileContextEngine.buildContext(profile);
        const dailyAverages = this.calculateAverages(mealLogs);
        const gaps = GapDetectionEngine.detectGaps(context, dailyAverages);

        // 2. Generate daily plan
        const dailyPlan = MealGenerationEngine.generateDailyPlan(context, gaps);

        // 3. Tally total plan nutrients
        let totalPlan = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
        Object.keys(dailyPlan).forEach(slot => {
            const nutrients = dailyPlan[slot].estimatedNutrients;
            totalPlan.calories += nutrients.calories;
            totalPlan.protein += nutrients.protein;
            totalPlan.carbs += nutrients.carbs;
            totalPlan.fats += nutrients.fats;
            totalPlan.fiber += nutrients.fiber;
        });

        // Round values
        totalPlan = {
            calories: Math.round(totalPlan.calories),
            protein: Number(totalPlan.protein.toFixed(1)),
            carbs: Number(totalPlan.carbs.toFixed(1)),
            fats: Number(totalPlan.fats.toFixed(1)),
            fiber: Number(totalPlan.fiber.toFixed(1))
        };

        return {
            childName: context.name,
            region: context.isIndia ? (["delhi", "punjab", "haryana", "uttar pradesh", "rajasthan", "gujarat"].includes(context.location?.state?.toLowerCase()) ? "North India" : "South India") : "Universal",
            dailyPlan,
            totalPlan
        };
    }

    static calculateAverages(mealLogs) {
        const logs = Array.isArray(mealLogs) ? mealLogs : [];
        const daysLogged = Math.max(1, logs.length);
        
        const total = {
            calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0,
            iron: 0, calcium: 0, vitaminC: 0, vitaminA: 0, vitaminD: 0, zinc: 0, water: 0
        };

        logs.forEach(log => {
            const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
            slots.forEach(slot => {
                const items = log[slot] || [];
                items.forEach(item => {
                    const enriched = enrichFoodItem(item);
                    if (enriched) {
                        total.calories += enriched.calories;
                        total.protein += enriched.protein;
                        total.carbs += enriched.carbs;
                        total.fats += enriched.fats;
                        total.fiber += enriched.fiber;
                        total.iron += enriched.iron;
                        total.calcium += enriched.calcium;
                        total.vitaminC += enriched.vitaminC;
                        total.vitaminA += enriched.vitaminA;
                        total.vitaminD += enriched.vitaminD;
                        total.zinc += enriched.zinc;
                        total.water += enriched.water;
                    }
                });
            });
        });

        return {
            calories: total.calories / daysLogged,
            protein: total.protein / daysLogged,
            carbs: total.carbs / daysLogged,
            fats: total.fats / daysLogged,
            fiber: total.fiber / daysLogged,
            iron: total.iron / daysLogged,
            calcium: total.calcium / daysLogged,
            vitaminC: total.vitaminC / daysLogged,
            vitaminA: total.vitaminA / daysLogged,
            vitaminD: total.vitaminD / daysLogged,
            zinc: total.zinc / daysLogged,
            water: total.water / daysLogged
        };
    }
}
