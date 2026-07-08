/**
 * Enterprise Pediatric Nutrition Intelligence Engine
 * Follows clean architecture. Implements SOLID principles.
 * References: ICMR 2020 RDA guidelines, WHO Growth Standards, and NIN India recommendations.
 */

import { ICMR_RDA_TABLE, enrichFoodItem } from '../utils/nutritionIntelligence.js';

// ==========================================
// 1. PROFILE CONTEXT ENGINE
// ==========================================
export class ProfileContextEngine {
    static buildContext(profile) {
        if (!profile) throw new Error("Profile context requires a valid child profile.");

        const age = Number(profile.age || 7);
        const gender = (profile.gender || 'male').toLowerCase();
        const activityLevel = profile.sportsActivityLevel || 'Moderately Active';
        const height = Number(profile.height || 100);
        const weight = Number(profile.weight || 15);
        
        // Growth stage categorization
        let growthStage = 'School Age';
        if (age <= 3) growthStage = 'Toddler';
        else if (age <= 6) growthStage = 'Preschooler';
        else if (age <= 12) growthStage = 'Pre-teen';
        else growthStage = 'Adolescent';

        // Stature check (WHO growth indicators)
        let isShortStature = false;
        if (age <= 3 && height < 75) isShortStature = true;
        else if (age > 3 && age <= 5 && height < 90) isShortStature = true;
        else if (age > 5 && age <= 10 && height < 110) isShortStature = true;
        else if (age > 10 && height < 130) isShortStature = true;

        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        const weightStatus = bmi < 14.0 ? 'Underweight' : (bmi >= 22.0 ? 'Overweight' : 'Normal');

        // Location context
        const location = {
            country: profile.location?.country || 'India',
            state: profile.location?.state || '',
            city: profile.location?.city || ''
        };
        const isIndia = location.country.toLowerCase() === 'india';

        // Food preferences parsing
        const likes = (profile.preferences?.favoriteFoods || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        const dislikes = (profile.preferences?.dislikedFoods || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        
        const isVeg = (profile.preferences?.favoriteFoods || '').toLowerCase().includes('veg') && 
                      !(profile.preferences?.favoriteFoods || '').toLowerCase().includes('non-veg');
        const isLactoseIntolerant = dislikes.some(d => d.includes('milk') || d.includes('dairy') || d.includes('lactose'));

        return {
            profileId: profile._id,
            name: profile.name,
            age,
            gender,
            growthStage,
            activityLevel,
            height,
            weight,
            bmi,
            weightStatus,
            isShortStature,
            prematurity: profile.prematureBirth?.isPremature || false,
            weeksPremature: profile.prematureBirth?.weeksPremature || 0,
            primaryGoal: profile.goals?.primary || 'General Wellness',
            secondaryGoals: profile.goals?.secondary || [],
            healthConditions: (profile.healthConditions || []).map(c => c.toLowerCase()),
            location,
            isIndia,
            isVeg,
            isLactoseIntolerant,
            likes,
            dislikes,
            lifestyle: {
                waterGoal: Number(profile.preferences?.waterIntake || 1500),
                sleepDuration: Number(profile.preferences?.sleepDuration || 9),
                sleepQuality: profile.preferences?.sleepQuality || 'Average',
                screenTime: Number(profile.preferences?.screenTime || 1),
                eatingHabits: profile.preferences?.eatingHabits || 'average'
            }
        };
    }
}

// ==========================================
// 2. SMART GAP DETECTION ENGINE
// ==========================================
export class GapDetectionEngine {
    static detectGaps(context, dailyAverages) {
        // Calculate Dynamic Targets based on ICMR 2020 / Context
        const targets = this.calculateDynamicRDA(context);
        const gaps = {};

        const nutrients = [
            { key: 'calories', label: 'Calories', unit: 'kcal' },
            { key: 'protein', label: 'Protein', unit: 'g' },
            { key: 'carbs', label: 'Carbohydrates', unit: 'g' },
            { key: 'fats', label: 'Fats', unit: 'g' },
            { key: 'fiber', label: 'Dietary Fiber', unit: 'g' },
            { key: 'iron', label: 'Iron', unit: 'mg' },
            { key: 'calcium', label: 'Calcium', unit: 'mg' },
            { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
            { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
            { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
            { key: 'zinc', label: 'Zinc', unit: 'mg' },
            { key: 'water', label: 'Water Intake', unit: 'ml' }
        ];

        nutrients.forEach(n => {
            const consumed = dailyAverages[n.key] || 0;
            const target = targets[n.key] || 1;
            const metPercent = Math.min(100, Math.round((consumed / target) * 100));
            const deficit = Math.max(0, Number((target - consumed).toFixed(1)));

            // Determine Severity and Priority
            let severity = 'Normal';
            let severityIcon = '🟢';
            let priority = 'Low';

            if (metPercent < 40) {
                severity = 'Critical';
                severityIcon = '🚨';
                priority = 'Critical';
            } else if (metPercent < 60) {
                severity = 'High';
                severityIcon = '🔴';
                priority = 'High';
            } else if (metPercent < 75) {
                severity = 'Moderate';
                severityIcon = '🟠';
                priority = 'Medium';
            } else if (metPercent < 90) {
                severity = 'Mild';
                severityIcon = '🟡';
                priority = 'Low';
            }

            // Clinical Health Impact mapping
            const healthImpact = this.getHealthImpact(n.key);

            gaps[n.key] = {
                nutrient: n.key,
                label: n.label,
                unit: n.unit,
                consumed: Number(consumed.toFixed(1)),
                target: Number(target.toFixed(1)),
                metPercent,
                deficit,
                severity,
                severityIcon,
                priority,
                healthImpact
            };
        });

        return gaps;
    }

    static calculateDynamicRDA(context) {
        // Core baseline selection
        let rda = { ...ICMR_RDA_TABLE.school };
        if (context.age <= 3) rda = { ...ICMR_RDA_TABLE.toddler };
        else if (context.age <= 6) rda = { ...ICMR_RDA_TABLE.preschool };
        else if (context.age <= 9) rda = { ...ICMR_RDA_TABLE.school };
        else if (context.age <= 12) rda = context.gender === 'female' ? { ...ICMR_RDA_TABLE.girls_10_12 } : { ...ICMR_RDA_TABLE.boys_10_12 };
        else if (context.age <= 15) rda = context.gender === 'female' ? { ...ICMR_RDA_TABLE.girls_13_15 } : { ...ICMR_RDA_TABLE.boys_13_15 };
        else rda = context.gender === 'female' ? { ...ICMR_RDA_TABLE.girls_16_18 } : { ...ICMR_RDA_TABLE.boys_16_18 };

        rda = { ...rda }; // clone

        // Adjust for sports activity level
        if (context.activityLevel === 'Sedentary') {
            rda.calories = Math.round(rda.calories * 0.85);
            rda.water = Math.round(rda.water * 0.9);
        } else if (context.activityLevel === 'Low Activity') {
            rda.calories = Math.round(rda.calories * 0.92);
        } else if (context.activityLevel === 'Active') {
            rda.calories = Math.round(rda.calories * 1.15);
            rda.protein = Number((rda.protein * 1.1).toFixed(1));
            rda.water += 250;
        } else if (context.activityLevel === 'Very Active') {
            rda.calories = Math.round(rda.calories * 1.3);
            rda.protein = Number((rda.protein * 1.2).toFixed(1));
            rda.water += 500;
        }

        // Adjust for growth deficiency status
        if (context.weightStatus === 'Underweight' || context.isShortStature) {
            rda.protein = Number((rda.protein * 1.15).toFixed(1));
            rda.calories = Math.round(rda.calories * 1.1);
            rda.calcium = Math.round(rda.calcium * 1.2);
            rda.vitaminD = Number((rda.vitaminD * 1.2).toFixed(1));
        }

        // Adjust for medical conditions
        if (context.healthConditions.includes('anemia')) {
            rda.iron = Number((rda.iron * 1.3).toFixed(1));
            rda.vitaminC = Math.round(rda.vitaminC * 1.2);
        }
        if (context.healthConditions.includes('lactose intolerance')) {
            rda.calcium = Math.round(rda.calcium * 1.1);
        }
        if (context.healthConditions.includes('asthma') || context.healthConditions.includes('weak immunity')) {
            rda.vitaminC = Math.round(rda.vitaminC * 1.2);
            rda.vitaminA = Math.round(rda.vitaminA * 1.2);
            rda.zinc = Number((rda.zinc * 1.2).toFixed(1));
        }

        return rda;
    }

    static getHealthImpact(nutrient) {
        const impacts = {
            calories: "Inadequate energy budget limits overall physiological activity, stamina, and basic metabolic support.",
            protein: "Muscles, cellular repair, and height growth are impaired when structural building blocks are missing.",
            carbs: "Energy depletion, brain performance drops, and potential muscle protein degradation for energy survival.",
            fats: "Weak hormone synthesis, dry skin, and impaired absorption of vital fat-soluble vitamins (A, D, E, K).",
            fiber: "Impaired gastrointestinal peristalsis, chronic constipation, and blood glucose crashes.",
            iron: "Impaired hemoglobin creation, leading to anemia, low classroom attention spans, and physical fatigue.",
            calcium: "Skeletal leaching, bone mass deceleration, dental fragility, and heightened long-term fracture risk.",
            vitaminA: "Impaired vision development, dry eyes, and compromised mucosal barriers in the immune system.",
            vitaminC: "Weak collagen formation (easy bruising, slow healing) and degraded white blood cell efficacy.",
            vitaminD: "Inability of the bones to absorb and lock calcium, resulting in soft bones or rickets-like symptoms.",
            zinc: "Delayed cellular division, stunted linear growth, decreased sense of taste, and slow wound healing.",
            water: "Reduced cell hydration, sluggish digestion, kidney load stress, and cognitive headaches."
        };
        return impacts[nutrient] || "General baseline health status affected.";
    }
}

// ==========================================
// 3. CLINICAL FOOD RECOMMENDATION DATABASE
// ==========================================
const CLINICAL_FOOD_DATABASE = {
    protein: [
        { name: "Paneer", isVeg: true, hasDairy: true, isLocal: true, density: "High", pairing: "Serve grilled with bell peppers to add vitamin C.", pairNutrient: "Vitamin C" },
        { name: "Moong Dal Sprouts", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Mix with sliced lemon to enhance mineral absorption.", pairNutrient: "Vitamin C" },
        { name: "Soya Chunks", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Cook with tomato gravy to supply absorbing organic acids.", pairNutrient: "Organic acids" },
        { name: "Greek Yogurt", isVeg: true, hasDairy: true, isLocal: false, density: "Medium", pairing: "Serve with berries to add antioxidants.", pairNutrient: "Antioxidants" },
        { name: "Chicken Breast", isVeg: false, hasDairy: false, isLocal: true, density: "High", pairing: "Pair with broccoli to boost antioxidant values.", pairNutrient: "Vitamin C" },
        { name: "Steamed Fish", isVeg: false, hasDairy: false, isLocal: true, density: "High", pairing: "Pair with lemon slices to facilitate digestion.", pairNutrient: "Vitamin C" },
        { name: "Whole Eggs", isVeg: false, hasDairy: false, isLocal: true, density: "Medium", pairing: "Pair with spinach scrambles for iron and protein synergy.", pairNutrient: "Iron" }
    ],
    iron: [
        { name: "Fresh Spinach (Palak)", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Pair with tomato or lemon (Vitamin C) to increase non-heme absorption.", pairNutrient: "Vitamin C" },
        { name: "Ragi Malt", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Mix with jaggery instead of white sugar to add natural iron.", pairNutrient: "Trace minerals" },
        { name: "Black Dates (Khajoor)", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Eat alongside oranges to double non-heme iron extraction.", pairNutrient: "Vitamin C" },
        { name: "Organic Jaggery", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Consume post-lunch to help absorb trace minerals.", pairNutrient: "None" },
        { name: "Cooked Chickpeas (Chana)", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Serve with lemon squeeze to maximize bioavailability.", pairNutrient: "Vitamin C" },
        { name: "Chicken Liver", isVeg: false, hasDairy: false, isLocal: true, density: "High", pairing: "Steamed or sautéed with local onions.", pairNutrient: "None" }
    ],
    calcium: [
        { name: "Milk", isVeg: true, hasDairy: true, isLocal: true, density: "High", pairing: "Pair with morning sunshine to supply active Vitamin D.", pairNutrient: "Vitamin D" },
        { name: "Curd (Yogurt)", isVeg: true, hasDairy: true, isLocal: true, density: "Medium", pairing: "Blend with fruit pulp to improve digestion.", pairNutrient: "None" },
        { name: "Sesame Seeds (Til)", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Add to homemade laddoos or ragi cookies.", pairNutrient: "Healthy fats" },
        { name: "Drumstick Leaves (Moringa)", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Boil into soups or add to dal recipes.", pairNutrient: "Vitamin C" }
    ],
    vitaminD: [
        { name: "Mushrooms", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Expose to direct sunlight before cooking to boost D2 content.", pairNutrient: "Sunlight" },
        { name: "Fortified Milk", isVeg: true, hasDairy: true, isLocal: true, density: "Medium", pairing: "Consume alongside healthy fats (like nuts) to aid absorption.", pairNutrient: "Lipids" },
        { name: "Egg Yolks", isVeg: false, hasDairy: false, isLocal: true, density: "Medium", pairing: "Pair with whole grain toast.", pairNutrient: "None" }
    ],
    fiber: [
        { name: "Rolled Oats", isVeg: true, hasDairy: false, isLocal: false, density: "Medium", pairing: "Prepare with sliced apples and chia seeds.", pairNutrient: "None" },
        { name: "Whole Wheat Roti", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Pair with subzi containing healthy ghee/oil.", pairNutrient: "Lipids" },
        { name: "Fresh Apples", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Serve raw with skin intact to capture all pectin.", pairNutrient: "Pectin" },
        { name: "Guava", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Eat with a tiny pinch of rock salt.", pairNutrient: "None" },
        { name: "Moong Sprouts", isVeg: true, hasDairy: false, isLocal: true, density: "Medium", pairing: "Mix with chopped cucumber and tomatoes.", pairNutrient: "Water" }
    ],
    water: [
        { name: "Water", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Keep a child-safe colorful water bottle nearby.", pairNutrient: "None" },
        { name: "Coconut Water", isVeg: true, hasDairy: false, isLocal: true, density: "High", pairing: "Consume in the afternoon for organic mineral restoration.", pairNutrient: "Potassium" },
        { name: "Buttermilk (Chass)", isVeg: true, hasDairy: true, isLocal: true, density: "Medium", pairing: "Flavor with roasted cumin (jeera) to aid digestion.", pairNutrient: "Cumin" }
    ]
};

// ==========================================
// 4. RECOMMENDATION & FOOD RANKING ENGINE
// ==========================================
export class RecommendationEngine {
    static generateRecommendations(context, gaps) {
        const recommendations = [];

        // Check our core 6 nutrients which have database recommendations
        const coreNutrients = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];

        coreNutrients.forEach(nut => {
            const gap = gaps[nut];
            
            // Only generate recommendations for nutrients that need improvements (severity not normal)
            if (gap && gap.severity !== 'Normal') {
                const candidates = CLINICAL_FOOD_DATABASE[nut] || [];
                
                // Rank candidates based on child profile rules
                const rankedFoods = this.rankFoods(candidates, context);
                
                if (rankedFoods.length > 0) {
                    const topFood = rankedFoods[0];
                    
                    // Generate explanation and evidence
                    const explanation = ExplanationEngine.explain(topFood, gap, context);
                    const evidence = EvidenceEngine.getEvidence(nut, topFood, context);

                    recommendations.push({
                        nutrient: nut,
                        label: gap.label,
                        severity: gap.severity,
                        priority: gap.priority,
                        severityIcon: gap.severityIcon,
                        recommendedFood: topFood.name,
                        pairing: topFood.pairing,
                        pairNutrient: topFood.pairNutrient,
                        ...explanation,
                        ...evidence
                    });
                }
            }
        });

        // Sort by priority (Critical > High > Medium > Low)
        const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        recommendations.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

        return recommendations;
    }

    static rankFoods(foods, context) {
        return foods
            .map(food => {
                let score = 100;

                // 1. Dietary restrictions check (Absolute filters)
                if (context.isVeg && !food.isVeg) score -= 1000;
                if (context.isLactoseIntolerant && food.hasDairy) score -= 1000;

                // 2. Disliked foods penalty
                const foodNameLower = food.name.toLowerCase();
                if (context.dislikes.some(d => foodNameLower.includes(d))) {
                    score -= 50;
                }

                // 3. Liked foods bonus
                if (context.likes.some(l => foodNameLower.includes(l))) {
                    score += 25;
                }

                // 4. Local country bonus (simple/classic Indian preference)
                if (context.isIndia && food.isLocal) {
                    score += 15;
                }

                // 5. Goal mapping adjustments
                if (context.primaryGoal.toLowerCase().includes('gain') || context.primaryGoal.toLowerCase().includes('growth')) {
                    if (food.density === 'High') score += 10;
                }

                return { food, score };
            })
            .filter(item => item.score > 0) // filter out invalid diet options
            .sort((a, b) => b.score - a.score)
            .map(item => item.food);
    }
}

// ==========================================
// 5. EXPLANATION ENGINE
// ==========================================
export class ExplanationEngine {
    static explain(food, gap, context) {
        const childName = context.name;
        const currentPercent = gap.metPercent;
        const deficiencyValue = gap.deficit;

        // Dynamic serving sizes based on age group
        let servingSuggestion = "1 serving";
        if (context.age <= 3) {
            servingSuggestion = "1/2 cup cooked (approx. 50g) portion size, pureed or finely mashed.";
        } else if (context.age <= 8) {
            servingSuggestion = "3/4 cup cooked (approx. 80-100g) portion size, easy to chew.";
        } else {
            servingSuggestion = "1 cup cooked (approx. 120g-150g) adult portion size.";
        }

        // Custom frequency suggestions
        let suggestedFrequency = "2–3 times per week";
        if (gap.severity === 'Critical') {
            suggestedFrequency = "4–5 times per week (High priority intervention)";
        } else if (gap.severity === 'High') {
            suggestedFrequency = "3–4 times per week";
        }

        // Dynamic, medical reason
        const reason = `Your child's average intake is currently only ${currentPercent}% of their daily requirement, leaving a daily deficit of ${deficiencyValue} ${gap.unit}.`;
        const whyThisFood = `${food.name} is selected because it has a ${food.density} concentration of bioavailable ${gap.label}. Supporting food pairing reduces biological barriers.`;
        const howItHelps = gap.healthImpact;

        // Dynamic lifestyle advice based on profile inputs
        let lifestyleAdvice = "Ensure regular hydration and schedule meals consistently.";
        if (context.lifestyle.sleepQuality === 'Poor' || context.lifestyle.sleepDuration < 8) {
            lifestyleAdvice = "Pair healthy nutrition with consistent sleep times. End screen use 1 hour before bedtime to help natural growth hormone release.";
        } else if (context.lifestyle.screenTime > 2) {
            lifestyleAdvice = "Combine nutrient-dense diet with active outdoor play. Restricting continuous screen time promotes healthy appetite.";
        } else if (context.activityLevel === 'Very Active' || context.activityLevel === 'Active') {
            lifestyleAdvice = "High physical activity increases electrolyte loss. Ensure your child drinks an extra glass of water shortly after play sessions.";
        }

        const expectedBenefit = `Helps correct the ${gap.label} gap, boosting levels to safe ranges in 30–45 days.`;

        return {
            reason,
            whyThisFood,
            howItHelps,
            servingSuggestion,
            suggestedFrequency,
            lifestyleAdvice,
            expectedBenefit
        };
    }
}

// ==========================================
// 6. EVIDENCE & CONFIDENCE ENGINE
// ==========================================
export class EvidenceEngine {
    static getEvidence(nutrient, food, context) {
        let source = "ICMR-NIN Dietary Guidelines 2020";
        let confidence = "High";
        let confidenceReason = "Derived from pediatric RDA tables mapped directly to child age and physical parameters.";

        if (context.prematurity && (nutrient === 'calcium' || nutrient === 'protein')) {
            source = "WHO Guidelines on Feeding Premature Infants";
            confidence = "High";
            confidenceReason = "Premature children have accelerated bone mineralization needs, matching therapeutic targets.";
        }

        if (nutrient === 'vitaminD') {
            source = "Indian Academy of Pediatrics (IAP) Guidelines";
            confidence = "Medium";
            confidenceReason = "Dietary D2 has variable absorption rates. Sunlight exposure or clinical supplementation remains primary.";
        }

        return {
            evidenceSource: source,
            confidenceLevel: confidence,
            confidenceReason
        };
    }
}

// ==========================================
// 7. RESPONSE BUILDER
// ==========================================
export class ResponseBuilder {
    static build(profile, mealLogs) {
        const context = ProfileContextEngine.buildContext(profile);
        
        // 1. Calculate actual averages (30 days)
        const dailyAverages = this.calculateAverages(mealLogs);
        
        // 2. Perform Smart Gap Analysis
        const gaps = GapDetectionEngine.detectGaps(context, dailyAverages);
        
        // 3. Generate Personal Explainable Recommendations
        const recommendations = RecommendationEngine.generateRecommendations(context, gaps);

        // 4. Calculate Scores
        const scores = this.calculateScores(gaps, context);

        // 5. Top 3 Priority Actions
        const priorityActions = this.extractPriorityActions(gaps, recommendations);

        // 6. Grocery List
        const groceryList = this.buildGroceryList(recommendations);

        // 7. General Strengths & Improvements
        const { strengths, improvements } = this.summarizeStrengthsAndWeaknesses(gaps);

        return {
            profileId: context.profileId,
            childName: context.name,
            overallScore: scores.overall,
            scoreStatus: scores.status,
            subScores: {
                nutrition: scores.nutrition,
                deficiency: scores.deficiency,
                growthRisk: scores.growthRisk,
                hydration: scores.hydration,
                mealQuality: scores.mealQuality
            },
            gaps,
            recommendations,
            priorityActions,
            groceryList,
            strengths,
            improvements,
            growthImpacts: this.buildGrowthImpacts(gaps),
            aiExplanation: this.buildSummaryExplanation(gaps, context)
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

    static calculateScores(gaps, context) {
        // A. Nutrition Score (average met percentage of all 12 nutrients)
        let totalMet = 0;
        Object.keys(gaps).forEach(k => {
            totalMet += gaps[k].metPercent;
        });
        const nutrition = Math.round(totalMet / Object.keys(gaps).length);

        // B. Deficiency Score (starts at 100, penalties for gaps)
        let penalty = 0;
        Object.keys(gaps).forEach(k => {
            const sev = gaps[k].severity;
            if (sev === 'Critical') penalty += 20;
            else if (sev === 'High') penalty += 12;
            else if (sev === 'Moderate') penalty += 6;
            else if (sev === 'Mild') penalty += 2;
        });
        const deficiency = Math.max(10, 100 - penalty);

        // C. Hydration Score
        const hydration = gaps.water.metPercent;

        // D. Meal Quality Score
        const mealQuality = Math.round(
            (gaps.fiber.metPercent * 0.4) + 
            (gaps.vitaminC.metPercent * 0.3) + 
            (gaps.zinc.metPercent * 0.3)
        );

        // E. Growth Risk Score
        let growthPenalty = 0;
        if (context.weightStatus === 'Underweight') growthPenalty += 20;
        if (context.isShortStature) growthPenalty += 20;
        if (gaps.protein.severity === 'Critical' || gaps.protein.severity === 'High') growthPenalty += 20;
        if (gaps.calcium.severity === 'Critical' || gaps.calcium.severity === 'High') growthPenalty += 20;
        
        const growthRisk = Math.max(10, 100 - growthPenalty);

        // Aggregate Overall Score
        const overall = Math.round(
            (nutrition * 0.3) +
            (deficiency * 0.25) +
            (growthRisk * 0.2) +
            (hydration * 0.15) +
            (mealQuality * 0.1)
        );

        const status = overall >= 80 ? 'Excellent' : (overall >= 60 ? 'Needs Improvement' : 'Needs Critical Attention');

        return { overall, nutrition, deficiency, hydration, mealQuality, growthRisk, status };
    }

    static extractPriorityActions(gaps, recommendations) {
        // Collect all nutrients that are not normal, sorted by deficit impact
        const sortingNutrients = Object.keys(gaps)
            .map(k => gaps[k])
            .filter(g => g.severity !== 'Normal')
            .sort((a, b) => {
                const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityWeight[b.priority] - priorityWeight[a.priority]) || (b.deficit - a.deficit);
            });

        return sortingNutrients.slice(0, 3).map((gap, idx) => {
            const rec = recommendations.find(r => r.nutrient === gap.nutrient);
            const foodText = rec ? `, such as adding ${rec.recommendedFood} to meals` : '';
            return {
                id: idx + 1,
                priority: gap.priority,
                severity: gap.severity,
                nutrient: gap.label,
                message: `Focus on bridging the daily ${gap.deficit} ${gap.unit} ${gap.label} gap${foodText}.`
            };
        });
    }

    static buildGroceryList(recommendations) {
        return recommendations.map(rec => ({
            food: rec.recommendedFood,
            nutrients: [rec.label],
            explanations: [`Recommended to supply bioavailable ${rec.label} to address the ${rec.severity.toLowerCase()} deficiency.`]
        }));
    }

    static summarizeStrengthsAndWeaknesses(gaps) {
        const strengths = [];
        const improvements = [];

        Object.keys(gaps).forEach(k => {
            const gap = gaps[k];
            if (gap.severity === 'Normal') {
                strengths.push({
                    nutrient: gap.label,
                    message: `Intake is healthy at ${gap.metPercent}% met of standard requirement.`
                });
            } else if (gap.severity === 'High' || gap.severity === 'Critical') {
                improvements.push({
                    nutrient: gap.label,
                    message: `Deficit of ${gap.deficit} ${gap.unit} (${gap.metPercent}% met). Requires correction.`
                });
            }
        });

        // Fallbacks
        if (strengths.length === 0) {
            strengths.push({ nutrient: "Macronutrients", message: "Intake checks are running. Focus on fresh variety." });
        }
        if (improvements.length === 0) {
            improvements.push({ nutrient: "Maintenance", message: "No critical deficits detected. Keep log logs." });
        }

        return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 3) };
    }

    static buildGrowthImpacts(gaps) {
        const impacts = [];
        const keys = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
        
        keys.forEach(k => {
            const gap = gaps[k];
            if (gap && (gap.severity === 'High' || gap.severity === 'Critical')) {
                impacts.push({
                    nutrient: gap.label,
                    risk: gap.priority === 'Critical' ? `Severe ${gap.label} insufficiency risk` : `${gap.label} deficiency risk`,
                    explanation: gap.healthImpact
                });
            }
        });

        if (impacts.length === 0) {
            impacts.push({
                nutrient: "Optimal Health",
                risk: "Active Healthy Development",
                explanation: "Met levels are stable, supporting proper linear growth velocity and cognitive focus."
            });
        }

        return impacts;
    }

    static buildSummaryExplanation(gaps, context) {
        const deficiencies = Object.keys(gaps)
            .map(k => gaps[k])
            .filter(g => g.severity === 'Critical' || g.severity === 'High');

        if (deficiencies.length === 0) {
            return `Excellent progress! ${context.name} meets all key daily pediatric targets. Keep maintaining this diverse food balance to support optimal development.`;
        }

        const list = deficiencies.map(d => d.label).join(', ');
        return `We have identified gaps in ${list}. Ragi, fresh green leafy vegetables, or eggs are prioritized options that match your child's profile goals.`;
    }
}
