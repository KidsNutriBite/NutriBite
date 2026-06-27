/**
 * clinical-grade Pediatric Nutrition Intelligence Engine
 * Based on ICMR 2020 guidelines, NIN India recommendations, and WHO child growth metrics.
 */

// 1. ICMR 2020 RDA Guidelines for Childhood Categories
export const ICMR_RDA_TABLE = {
    toddler: { // 1-3 years
        calories: 1110, protein: 12.5, carbs: 150, fat: 35, fiber: 15,
        iron: 9, calcium: 500, vitaminA: 390, vitaminC: 35, vitaminD: 15, zinc: 5.0, water: 1200
    },
    preschool: { // 4-6 years
        calories: 1350, protein: 16.0, carbs: 175, fat: 40, fiber: 20,
        iron: 11, calcium: 550, vitaminA: 510, vitaminC: 40, vitaminD: 15, zinc: 7.0, water: 1500
    },
    school: { // 7-9 years
        calories: 1700, protein: 23.0, carbs: 230, fat: 50, fiber: 25,
        iron: 15, calcium: 650, vitaminA: 630, vitaminC: 45, vitaminD: 15, zinc: 8.5, water: 1800
    },
    boys_10_12: {
        calories: 2190, protein: 32.0, carbs: 300, fat: 60, fiber: 30,
        iron: 16, calcium: 850, vitaminA: 770, vitaminC: 50, vitaminD: 15, zinc: 10.0, water: 2100
    },
    girls_10_12: {
        calories: 2010, protein: 33.0, carbs: 270, fat: 55, fiber: 30,
        iron: 28, calcium: 850, vitaminA: 790, vitaminC: 50, vitaminD: 15, zinc: 9.0, water: 1900
    },
    boys_13_15: {
        calories: 2860, protein: 45.0, carbs: 380, fat: 80, fiber: 35,
        iron: 22, calcium: 1000, vitaminA: 930, vitaminC: 60, vitaminD: 15, zinc: 13.0, water: 2500
    },
    girls_13_15: {
        calories: 2400, protein: 43.0, carbs: 320, fat: 65, fiber: 30,
        iron: 30, calcium: 1000, vitaminA: 890, vitaminC: 60, vitaminD: 15, zinc: 11.0, water: 2100
    },
    boys_16_18: {
        calories: 3320, protein: 55.0, carbs: 450, fat: 90, fiber: 40,
        iron: 26, calcium: 1050, vitaminA: 1000, vitaminC: 80, vitaminD: 15, zinc: 17.0, water: 3000
    },
    girls_16_18: {
        calories: 2500, protein: 46.0, carbs: 340, fat: 70, fiber: 30,
        iron: 32, calcium: 1050, vitaminA: 860, vitaminC: 65, vitaminD: 15, zinc: 12.0, water: 2200
    }
};

/**
 * 1. Dynamic Nutrition Requirement Engine
 * Computes RDA targets adjusted for Age, Gender, Weight, Height, Activity, Growth, and Conditions.
 */
export const calculateDynamicRDA = (profile) => {
    if (!profile) return ICMR_RDA_TABLE.school;

    const age = Number(profile.age || 7);
    const gender = (profile.gender || 'male').toLowerCase();
    
    // Choose base RDA
    let rda = { ...ICMR_RDA_TABLE.school };
    if (age <= 3) {
        rda = { ...ICMR_RDA_TABLE.toddler };
    } else if (age <= 6) {
        rda = { ...ICMR_RDA_TABLE.preschool };
    } else if (age <= 9) {
        rda = { ...ICMR_RDA_TABLE.school };
    } else if (age <= 12) {
        rda = gender === 'female' ? { ...ICMR_RDA_TABLE.girls_10_12 } : { ...ICMR_RDA_TABLE.boys_10_12 };
    } else if (age <= 15) {
        rda = gender === 'female' ? { ...ICMR_RDA_TABLE.girls_13_15 } : { ...ICMR_RDA_TABLE.boys_13_15 };
    } else {
        rda = gender === 'female' ? { ...ICMR_RDA_TABLE.girls_16_18 } : { ...ICMR_RDA_TABLE.boys_16_18 };
    }

    // 2. Adjust for Activity Level
    const sports = profile.sportsActivityLevel || 'Moderately Active';
    if (sports === 'Sedentary') {
        rda.calories = Math.round(rda.calories * 0.85);
        rda.water = Math.round(rda.water * 0.9);
    } else if (sports === 'Low Activity') {
        rda.calories = Math.round(rda.calories * 0.92);
    } else if (sports === 'Active') {
        rda.calories = Math.round(rda.calories * 1.15);
        rda.protein = Number((rda.protein * 1.1).toFixed(1));
        rda.water += 250;
    } else if (sports === 'Very Active') {
        rda.calories = Math.round(rda.calories * 1.3);
        rda.protein = Number((rda.protein * 1.2).toFixed(1));
        rda.water += 500;
    }

    // 3. Adjust for Growth Status (underweight / short stature)
    const height = Number(profile.height || 100);
    const weight = Number(profile.weight || 15);
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let isUnderweight = bmi < 14.0;
    let isShortStature = false;
    if (age <= 3 && height < 75) isShortStature = true;
    else if (age > 3 && age <= 5 && height < 90) isShortStature = true;
    else if (age > 5 && age <= 10 && height < 110) isShortStature = true;
    else if (age > 10 && height < 130) isShortStature = true;

    if (isUnderweight || isShortStature) {
        // Boost growth targets
        rda.protein = Number((rda.protein * 1.15).toFixed(1));
        rda.calories = Math.round(rda.calories * 1.1);
        rda.calcium = Math.round(rda.calcium * 1.2);
        rda.vitaminD = Number((rda.vitaminD * 1.2).toFixed(1));
    } else if (bmi >= 22.0) {
        // Slightly lower energy budget
        rda.calories = Math.round(rda.calories * 0.9);
        rda.fiber = Math.round(rda.fiber * 1.15);
    }

    // 4. Adjust for Medical Conditions
    const conditions = (profile.healthConditions || []).map(c => c.toLowerCase());
    if (conditions.includes('anemia')) {
        rda.iron = Number((rda.iron * 1.3).toFixed(1));
        rda.vitaminC = Math.round(rda.vitaminC * 1.2);
    }
    if (conditions.includes('lactose intolerance')) {
        // Keep recommendations high but alerts UI for dairy substitution
        rda.calcium = Math.round(rda.calcium * 1.1);
    }
    if (conditions.includes('pre-diabetes') || conditions.includes('diabetes')) {
        rda.carbs = Math.round(rda.carbs * 0.8);
        rda.fiber = Math.round(rda.fiber * 1.2);
    }
    if (conditions.includes('asthma') || conditions.includes('weak immunity')) {
        rda.vitaminC = Math.round(rda.vitaminC * 1.2);
        rda.vitaminA = Math.round(rda.vitaminA * 1.2);
        rda.zinc = Number((rda.zinc * 1.2).toFixed(1));
    }

    return rda;
};

/**
 * 2. Nutrition Intake Calculator & Enriched Mapper
 * Enriches food items with vitamin A, D, zinc, water using keyword diagnostics on Indian foods database.
 */
export const enrichFoodItem = (item) => {
    if (!item) return null;
    const name = (item.name || '').toLowerCase().trim();

    // Default missing fields placeholder
    let fiber = item.fiber !== undefined ? item.fiber : 0;
    let iron = item.iron !== undefined ? item.iron : 0;
    let calcium = item.calcium !== undefined ? item.calcium : 0;
    let vitaminC = item.vitaminC !== undefined ? item.vitaminC : 0;
    let vitaminA = 0;
    let vitaminD = 0;
    let zinc = 0.2;
    let water = 0;

    // Apply Keyword Heuristics for dynamic profiling
    if (name.includes('water') || name.includes('fluid') || name.includes('beverage')) {
        water = 250;
    } else if (name.includes('milk') || name.includes('yogurt') || name.includes('curd') || name.includes('lassi') || name.includes('chaas') || name.includes('buttermilk')) {
        water = 200;
        calcium = calcium || 250;
        vitaminA = 70;
        vitaminD = 1.5;
        zinc = 0.8;
    } else if (name.includes('paneer') || name.includes('cheese')) {
        calcium = calcium || 150;
        vitaminA = 60;
        vitaminD = 0.2;
        zinc = 0.7;
    } else if (name.includes('egg') || name.includes('omelette')) {
        iron = iron || 1.2;
        calcium = calcium || 25;
        vitaminA = 75;
        vitaminD = 1.1;
        zinc = 0.6;
    } else if (name.includes('chicken') || name.includes('mutton') || name.includes('meat') || name.includes('fish') || name.includes('chicken biryani')) {
        iron = iron || 1.5;
        zinc = 2.0;
        vitaminD = 1.5;
        vitaminA = 20;
    } else if (name.includes('spinach') || name.includes('palak') || name.includes('methi') || name.includes('leafy') || name.includes('drumstick') || name.includes('moringa')) {
        iron = iron || 3.0;
        calcium = calcium || 100;
        vitaminA = 400;
        vitaminC = vitaminC || 30;
        fiber = fiber || 3;
        zinc = 0.5;
    } else if (name.includes('ragi')) {
        calcium = calcium || 280;
        iron = iron || 2.5;
        zinc = 0.8;
        fiber = fiber || 4;
    } else if (name.includes('carrot') || name.includes('papaya') || name.includes('mango') || name.includes('pumpkin') || name.includes('apricot')) {
        vitaminA = 350;
        vitaminC = vitaminC || 15;
        fiber = fiber || 2.0;
    } else if (name.includes('orange') || name.includes('lemon') || name.includes('mosambi') || name.includes('sweet lime') || name.includes('amla') || name.includes('guava')) {
        vitaminC = vitaminC || 50;
        fiber = fiber || 2.5;
        water = 100;
    } else if (name.includes('dal') || name.includes('lentil') || name.includes('sambar') || name.includes('chole') || name.includes('rajma') || name.includes('chana') || name.includes('sprouts')) {
        iron = iron || 2.0;
        zinc = 1.2;
        fiber = fiber || 4;
    } else if (name.includes('apple') || name.includes('banana') || name.includes('grapes') || name.includes('pomegranate') || name.includes('fruit')) {
        vitaminC = vitaminC || 8;
        fiber = fiber || 2.2;
        water = 75;
    } else if (name.includes('coconut water')) {
        water = 250;
        vitaminC = 5;
        calcium = 24;
    }

    return {
        name: item.name,
        quantity: item.quantity || "1 serving",
        calories: Number(item.calories || 0),
        protein: Number(item.protein || 0),
        carbs: Number(item.carbs || 0),
        fats: Number(item.fats || item.fat || 0),
        fiber: Number(fiber),
        iron: Number(iron),
        calcium: Number(calcium),
        vitaminC: Number(vitaminC),
        vitaminA: Number(vitaminA),
        vitaminD: Number(vitaminD),
        zinc: Number(zinc),
        water: Number(water)
    };
};

/**
 * 3. Deficiency Risk Engine
 * Maps actual averages vs RDA targets, calculates deficit percentages, and returns color severity.
 */
export const computeDeficitsAndSeverity = (actual, target) => {
    const checkNutrient = (name, actVal, tarVal) => {
        const metPercent = tarVal > 0 ? Math.min(100, Math.round((actVal / tarVal) * 100)) : 100;
        const deficitPercent = 100 - metPercent;
        
        let severity = 'GREEN';
        if (metPercent < 50) severity = 'RED';
        else if (metPercent < 70) severity = 'ORANGE';
        else if (metPercent < 90) severity = 'YELLOW';

        return {
            nutrient: name,
            consumed: Number(actVal.toFixed(1)),
            target: Number(tarVal.toFixed(1)),
            metPercent,
            deficitPercent,
            severity
        };
    };

    return {
        calories: checkNutrient('calories', actual.calories || 0, target.calories),
        protein: checkNutrient('protein', actual.protein || 0, target.protein),
        carbs: checkNutrient('carbs', actual.carbs || 0, target.carbs),
        fats: checkNutrient('fats', actual.fats || actual.fat || 0, target.fat),
        fiber: checkNutrient('fiber', actual.fiber || 0, target.fiber),
        iron: checkNutrient('iron', actual.iron || 0, target.iron),
        calcium: checkNutrient('calcium', actual.calcium || 0, target.calcium),
        vitaminA: checkNutrient('vitaminA', actual.vitaminA || 0, target.vitaminA),
        vitaminC: checkNutrient('vitaminC', actual.vitaminC || 0, target.vitaminC),
        vitaminD: checkNutrient('vitaminD', actual.vitaminD || 0, target.vitaminD),
        zinc: checkNutrient('zinc', actual.zinc || 0, target.zinc),
        water: checkNutrient('water', actual.water || 0, target.water)
    };
};

/**
 * 4. Root Cause Analysis
 * Scans logged meals to find probable reasons for deficiencies.
 */
export const evaluateRootCauses = (deficits, loggedFoods) => {
    const reasons = [];
    const foodList = (loggedFoods || []).map(f => f.toLowerCase());

    const hasEgg = foodList.some(f => f.includes('egg'));
    const hasDairy = foodList.some(f => f.includes('milk') || f.includes('paneer') || f.includes('curd') || f.includes('yogurt'));
    const hasPulses = foodList.some(f => f.includes('dal') || f.includes('lentil') || f.includes('chole') || f.includes('rajma') || f.includes('sprouts'));
    const hasGreens = foodList.some(f => f.includes('spinach') || f.includes('palak') || f.includes('methi') || f.includes('drumstick') || f.includes('leafy'));
    const hasFruits = foodList.some(f => f.includes('fruit') || f.includes('apple') || f.includes('banana') || f.includes('orange') || f.includes('mango') || f.includes('papaya'));

    if (deficits.protein.severity === 'RED' || deficits.protein.severity === 'ORANGE') {
        const proteinCauses = [];
        if (!hasEgg) proteinCauses.push("Low Egg Consumption");
        if (!hasDairy) proteinCauses.push("Low Dairy Intake");
        if (!hasPulses) proteinCauses.push("Low Pulse/Lentil Intake");
        reasons.push({ nutrient: 'protein', causes: proteinCauses.length > 0 ? proteinCauses : ["Mainly grain-based carbohydrate heavy diet"] });
    }

    if (deficits.iron.severity === 'RED' || deficits.iron.severity === 'ORANGE') {
        const ironCauses = [];
        if (!hasGreens) ironCauses.push("Low Green Leafy Vegetable Intake");
        if (!hasPulses) ironCauses.push("Low Legumes/Iron-Rich Grains");
        reasons.push({ nutrient: 'iron', causes: ironCauses.length > 0 ? ironCauses : ["Lack of dietary iron sources"] });
    }

    if (deficits.calcium.severity === 'RED' || deficits.calcium.severity === 'ORANGE') {
        const calciumCauses = [];
        if (!hasDairy) calciumCauses.push("Low Dairy Intake");
        if (!foodList.some(f => f.includes('ragi'))) calciumCauses.push("Low Ragi/Millets Consumption");
        reasons.push({ nutrient: 'calcium', causes: calciumCauses.length > 0 ? calciumCauses : ["Insufficient bone-building mineral sources"] });
    }

    if (deficits.vitaminD.severity === 'RED' || deficits.vitaminD.severity === 'ORANGE') {
        reasons.push({ nutrient: 'vitaminD', causes: ["Low Fortified Dairy/Fish/Egg Intake", "Insufficient daily sunlight exposure (minimum 15-20 mins outdoor play needed)"] });
    }

    if (deficits.fiber.severity === 'RED' || deficits.fiber.severity === 'ORANGE') {
        const fiberCauses = [];
        if (!hasGreens) fiberCauses.push("Low Vegetable Intake");
        if (!hasFruits) fiberCauses.push("Low Whole Fruit Intake");
        reasons.push({ nutrient: 'fiber', causes: fiberCauses.length > 0 ? fiberCauses : ["Over-reliance on highly refined flour (maida) and processed meals"] });
    }

    if (deficits.water.severity === 'RED' || deficits.water.severity === 'ORANGE') {
        reasons.push({ nutrient: 'water', causes: ["Insufficient drinking water interval logs", "Heavy replacement with processed sweet juices or sodas"] });
    }

    return reasons;
};

/**
 * 5. Food Recommendation Engine
 * Provides personalized Indian food suggestions, filtering by dietary preferences (e.g., veg/non-veg).
 */
export const getPersonalizedFoods = (deficits, preferences = {}) => {
    const isVeg = preferences.favoriteFoods?.toLowerCase().includes('veg') && !preferences.favoriteFoods?.toLowerCase().includes('non-veg');
    const isLactoseIntolerant = preferences.dislikedFoods?.toLowerCase().includes('milk') || preferences.dislikedFoods?.toLowerCase().includes('dairy') || preferences.dislikedFoods?.toLowerCase().includes('lactose');

    const database = {
        protein: {
            veg: ["Paneer", "Milk", "Curd", "Moong Dal", "Soya Chunks", "Greek Yogurt", "Almonds", "Sprouts", "Chana"],
            nonveg: ["Eggs", "Chicken", "Fish", "Mutton", "Egg Curry"]
        },
        iron: {
            veg: ["Spinach", "Ragi", "Dates", "Jaggery", "Rajma", "Beetroot", "Drumstick Leaves", "Poha", "Pomegranate"],
            nonveg: ["Chicken Liver", "Fish", "Egg Yolks"]
        },
        calcium: {
            veg: ["Milk", "Curd", "Paneer", "Ragi Flour", "Sesame Seeds", "Almonds", "Broccoli", "Drumstick Leaves (Moringa)"],
            nonveg: ["Salmon", "Sardines"]
        },
        vitaminD: {
            veg: ["Fortified Milk", "Mushrooms", "Enriched Cereals"],
            nonveg: ["Egg Yolks", "Salmon", "Tuna", "Fish Oil"]
        },
        fiber: {
            veg: ["Oats", "Whole Wheat Roti", "Brown Rice", "Apple", "Guava", "Broccoli", "Cucumber", "Papaya", "Moong Sprouts"],
            nonveg: []
        },
        water: {
            veg: ["Water", "Coconut Water", "Buttermilk (Chass)", "Lemon Water (Nimbu Paani)", "Cucumber"],
            nonveg: []
        }
    };

    const suggestions = [];

    const nutrientsToCheck = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
    nutrientsToCheck.forEach(nut => {
        const severity = deficits[nut]?.severity;
        if (severity === 'RED' || severity === 'ORANGE' || severity === 'YELLOW') {
            let foods = [...database[nut].veg];
            
            // Adjust for vegetarian preference
            if (!isVeg) {
                foods = [...foods, ...database[nut].nonveg];
            }
            
            // Adjust for Lactose Intolerance
            if (isLactoseIntolerant) {
                foods = foods.filter(f => !['milk', 'curd', 'paneer', 'yogurt', 'cheese', 'fortified milk', 'buttermilk (chass)'].includes(f.toLowerCase()));
            }

            suggestions.push({
                nutrient: nut,
                foods: foods.slice(0, 5) // Top 5
            });
        }
    });

    return suggestions;
};

/**
 * 6. Smart Grocery Recommendation Engine
 * Maps nutrient deficits directly to shopping list items.
 */
export const compileGroceryList = (deficits, preferences = {}) => {
    const isVeg = preferences.favoriteFoods?.toLowerCase().includes('veg') && !preferences.favoriteFoods?.toLowerCase().includes('non-veg');
    const isLactoseIntolerant = preferences.dislikedFoods?.toLowerCase().includes('milk') || preferences.dislikedFoods?.toLowerCase().includes('dairy');

    const groceryMap = {
        protein: {
            veg: ["Moong Dal", "Soya Chunks", "Paneer", "Almonds", "Kabuli Chana", "Milk", "Curd"],
            nonveg: ["Eggs", "Chicken Breast", "Fish Fillet"]
        },
        iron: {
            veg: ["Fresh Spinach (Palak)", "Ragi Flour", "Dates (Khajoor)", "Organic Jaggery", "Rajma (Red Kidney Beans)", "Beetroot"],
            nonveg: []
        },
        calcium: {
            veg: ["Milk", "Paneer", "Sesame Seeds (Til)", "Ragi", "Almonds"],
            nonveg: []
        },
        vitaminD: {
            veg: ["Mushrooms", "Fortified Cereals", "Fortified Milk"],
            nonveg: ["Eggs"]
        },
        fiber: {
            veg: ["Oats", "Whole Wheat Flour (Atta)", "Brown Rice", "Fresh Apples", "Guavas", "Papaya"],
            nonveg: []
        }
    };

    const grocerySet = new Set();

    const nutrients = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber'];
    nutrients.forEach(nut => {
        const severity = deficits[nut]?.severity;
        if (severity === 'RED' || severity === 'ORANGE') {
            let items = [...groceryMap[nut].veg];
            if (!isVeg) {
                items = [...items, ...groceryMap[nut].nonveg];
            }
            if (isLactoseIntolerant) {
                items = items.filter(i => !['milk', 'paneer', 'curd', 'fortified milk'].includes(i.toLowerCase()));
            }
            items.forEach(item => grocerySet.add(item));
        }
    });

    return Array.from(grocerySet);
};

/**
 * 7. Phased 7/30/90 Day Nutrition Improvement Plan
 */
export const generateImprovementPlan = (currentWellnessScore, deficits) => {
    let worstDeficit = 'protein';
    let maxGap = 0;
    
    const coreNutrients = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
    coreNutrients.forEach(nut => {
        const deficitVal = deficits[nut]?.deficitPercent || 0;
        if (deficitVal > maxGap) {
            maxGap = deficitVal;
            worstDeficit = nut;
        }
    });

    // Build improvement expectations
    const plan = {
        currentWellnessScore,
        targetWellnessScore: Math.min(95, currentWellnessScore + Math.round(maxGap * 0.4)),
        expectedDurationDays: maxGap > 50 ? 90 : (maxGap > 30 ? 45 : 30),
        worstDeficit,
        phases: {
            day7: {
                title: "7-Day Foundation Setup",
                action: `Introduce 1 serving of ${worstDeficit === 'water' ? 'extra water glass' : 'rich food like Paneer/Spinach/Ragi'} daily. Keep complete logs of all meals.`,
                improvement: `Sub-scores should show active stabilization and hydration score increases by +15%.`
            },
            day30: {
                title: "30-Day Portion Consolidation",
                action: `Balance portion counters to meet at least 70% (Yellow status) for all active deficiencies. Introduce healthy snacks.`,
                improvement: `Overall Wellness Score targets +10 points increase. Parent logs should show zero red alert days.`
            },
            day90: {
                title: "90-Day Clinical Maintenance",
                action: `Steady RDA target met (>= 90% Green status). Height/weight verification checking.`,
                improvement: `Full potential growth curve tracking. Overall wellness reaches ${Math.min(95, currentWellnessScore + Math.round(maxGap * 0.4))} score.`
            }
        }
    };

    return plan;
};

/**
 * 8. Growth Impact Engine
 */
export const computeGrowthImpacts = (deficits) => {
    const impacts = [];

    if (deficits.protein.severity === 'RED' || deficits.protein.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Protein",
            risk: "Reduced Growth Potential & Skeletal Lag",
            explanation: "Protein provides the structural brick builders for muscles and organs. Chronic low protein slows down the height elongation pace relative to WHO percentiles and triggers muscular fatigue."
        });
    }
    if (deficits.iron.severity === 'RED' || deficits.iron.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Iron",
            risk: "Sluggish Oxygen Transport & Cognitive Fatigue",
            explanation: "Iron builds hemoglobin to distribute oxygen to the brain and muscle tissues. Deficits can trigger short attention span in classrooms, headaches, and physical tiredness during active sports."
        });
    }
    if (deficits.calcium.severity === 'RED' || deficits.calcium.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Calcium",
            risk: "Impaired Bone Mineralization & Dental Weakness",
            explanation: "Calcium represents the key mineral compound for strong bones. Insufficient intake forces the blood to leach calcium from bones, weakening the skeletal density and increasing dental cavity risks."
        });
    }
    if (deficits.vitaminD.severity === 'RED' || deficits.vitaminD.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Vitamin D",
            risk: "Weak Calcium Absorption & Skeletal Softening",
            explanation: "Vitamin D is essential to transport dietary calcium from the intestine into the bloodstream. Low levels can lead to muscle pains and prevent bones from hardening properly during major growth spurts."
        });
    }
    if (deficits.fiber.severity === 'RED' || deficits.fiber.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Fiber",
            risk: "Impaired Gut Peristalsis & Sugar Spikes",
            explanation: "Fiber fuels standard bowel movement. Deficits trigger regular constipation, stomach pains, and increase rapid blood glucose spikes which lead to subsequent energy crashes."
        });
    }
    if (deficits.water.severity === 'RED' || deficits.water.severity === 'ORANGE') {
        impacts.push({
            nutrient: "Hydration",
            risk: "Impaired Renal Filtration & Cognitive Slumps",
            explanation: "Dehydration constricts capillaries, causing mild brain fog, physical play fatigue, and strains the kidney filtration load."
        });
    }

    // Default if excellent
    if (impacts.length === 0) {
        impacts.push({
            nutrient: "Optimal Health",
            risk: "None - Balanced Growth Potential Active",
            explanation: "Your child's diet meets standard guidelines, ensuring cell repair, strong bone growth velocity, and active cognitive focus."
        });
    }

    return impacts;
};

/**
 * 9. AI Explanation Engine (Parent Friendly)
 */
export const compileAiExplanation = (deficits) => {
    const redGaps = [];
    const orangeGaps = [];
    const yellowGaps = [];

    const core = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
    core.forEach(n => {
        const severity = deficits[n].severity;
        if (severity === 'RED') redGaps.push(n);
        else if (severity === 'ORANGE') orangeGaps.push(n);
        else if (severity === 'YELLOW') yellowGaps.push(n);
    });

    if (redGaps.length === 0 && orangeGaps.length === 0 && yellowGaps.length === 0) {
        return "Congratulations! Your child met over 90% of all recommended nutritional targets today. Maintaining this variety of fresh home-cooked meals provides excellent support for healthy cognitive development, bones, and muscles.";
    }

    let summaryText = "Your child's meal logs indicate some nutritional gaps today. ";
    if (redGaps.length > 0) {
        const redNames = redGaps.map(g => g === 'vitaminD' ? 'Vitamin D' : g.toUpperCase()).join(', ');
        summaryText += `Intake of ${redNames} is critically low (below 50% of the recommended ICMR pediatric guidelines). `;
    }
    if (orangeGaps.length > 0) {
        const orangeNames = orangeGaps.map(g => g === 'vitaminD' ? 'Vitamin D' : g.toUpperCase()).join(', ');
        summaryText += `Intake of ${orangeNames} falls in the moderate deficiency zone. `;
    }

    // Suggest action
    const firstGap = redGaps[0] || orangeGaps[0] || yellowGaps[0];
    const foodTipMap = {
        protein: "increasing foods like eggs, paneer, curd, or pulses to support muscle development and energy.",
        iron: "introducing iron-rich options like spinach, ragi, dates, and beetroot to keep their red blood cells active.",
        calcium: "offering daily dairy servings, ragi flour recipes, or moringa/drumstick leaves to build strong bones.",
        vitaminD: "encouraging 15-20 minutes of outdoor play in morning sunlight and adding fortified foods or egg yolks.",
        fiber: "substituting refined grains with whole wheat rotis, oats, or whole fruits like apples and papayas.",
        water: "setting regular water breaks to build consistent daily hydration habits."
    };

    summaryText += `Focusing on ${foodTipMap[firstGap] || 'a diverse diet will help bridge these gaps.'}`;
    return summaryText;
};

/**
 * 10. Dynamic Wellness Score & Sub-scores Aggregation Engine
 * Evaluates child stats and meal logs to return all sub-scores and aggregated overall wellness score.
 */
export const computeDynamicWellnessScore = (profile, mealLogs = []) => {
    if (!profile) return null;

    // Calculate baseline RDA targets
    const targetRDA = calculateDynamicRDA(profile);

    // Compute actual averages (last 30 days)
    const logs = Array.isArray(mealLogs) ? mealLogs : [];
    const daysLogged = Math.max(1, logs.length);

    let totalNutrients = {
        calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0,
        iron: 0, calcium: 0, vitaminC: 0, vitaminA: 0, vitaminD: 0, zinc: 0, water: 0
    };

    let totalVeggiesCount = 0;
    let totalJunkCount = 0;

    const junkKeywords = ['maggi', 'noodle', 'samosa', 'pakora', 'burger', 'pizza', 'french fries', 'chips', 'biscuit', 'sweet', 'soft drink', 'cola', 'junk'];
    const vegKeywords = ['spinach', 'palak', 'methi', 'bhindi', 'gobi', 'carrot', 'beans', 'peas', 'lauki', 'cabbage', 'mixed veg', 'salad', 'green leafy', 'drumstick'];

    logs.forEach(log => {
        const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        slots.forEach(slot => {
            const items = log[slot] || [];
            items.forEach(item => {
                const enriched = enrichFoodItem(item);
                if (enriched) {
                    totalNutrients.calories += enriched.calories;
                    totalNutrients.protein += enriched.protein;
                    totalNutrients.carbs += enriched.carbs;
                    totalNutrients.fats += enriched.fats;
                    totalNutrients.fiber += enriched.fiber;
                    totalNutrients.iron += enriched.iron;
                    totalNutrients.calcium += enriched.calcium;
                    totalNutrients.vitaminC += enriched.vitaminC;
                    totalNutrients.vitaminA += enriched.vitaminA;
                    totalNutrients.vitaminD += enriched.vitaminD;
                    totalNutrients.zinc += enriched.zinc;
                    totalNutrients.water += enriched.water;

                    const name = (enriched.name || '').toLowerCase();
                    if (junkKeywords.some(k => name.includes(k))) totalJunkCount++;
                    if (vegKeywords.some(k => name.includes(k))) totalVeggiesCount++;
                }
            });
        });
    });

    const actualAvg = {
        calories: totalNutrients.calories / daysLogged,
        protein: totalNutrients.protein / daysLogged,
        carbs: totalNutrients.carbs / daysLogged,
        fats: totalNutrients.fats / daysLogged,
        fiber: totalNutrients.fiber / daysLogged,
        iron: totalNutrients.iron / daysLogged,
        calcium: totalNutrients.calcium / daysLogged,
        vitaminC: totalNutrients.vitaminC / daysLogged,
        vitaminA: totalNutrients.vitaminA / daysLogged,
        vitaminD: totalNutrients.vitaminD / daysLogged,
        zinc: totalNutrients.zinc / daysLogged,
        water: totalNutrients.water / daysLogged
    };

    // Calculate deficits & risk levels
    const deficits = computeDeficitsAndSeverity(actualAvg, targetRDA);

    // Compute Sub-Scores:
    // A. Nutrition Score (0-100): average met percentage of the 12 nutrients
    let totalMetPercent = 0;
    const nutrientsList = ['calories', 'protein', 'carbs', 'fats', 'fiber', 'iron', 'calcium', 'vitaminA', 'vitaminC', 'vitaminD', 'zinc', 'water'];
    nutrientsList.forEach(n => {
        totalMetPercent += deficits[n].metPercent;
    });
    const nutritionScore = Math.round(totalMetPercent / nutrientsList.length);

    // B. Deficiency Score (0-100): starts at 100, subtracts points for RED (-15) and ORANGE (-8) deficiencies
    let deficiencyPenalty = 0;
    const coreDeficiencies = ['protein', 'iron', 'calcium', 'vitaminD', 'fiber', 'water'];
    coreDeficiencies.forEach(n => {
        const severity = deficits[n].severity;
        if (severity === 'RED') deficiencyPenalty += 15;
        else if (severity === 'ORANGE') deficiencyPenalty += 8;
        else if (severity === 'YELLOW') deficiencyPenalty += 3;
    });
    const deficiencyScore = Math.max(10, 100 - deficiencyPenalty);

    // C. Hydration Score (0-100): met percentage of daily water intake
    const hydrationScore = deficits.water.metPercent;

    // D. Meal Quality Score (0-100): based on veggie frequency, lack of junk, and macronutrient distribution
    let mealQualityScore = 75;
    // Veggies bonus
    const veggieRatio = totalVeggiesCount / daysLogged;
    if (veggieRatio >= 1.5) mealQualityScore += 15;
    else if (veggieRatio >= 0.7) mealQualityScore += 8;
    else mealQualityScore -= 10;

    // Junk penalty
    const junkRatio = totalJunkCount / daysLogged;
    if (junkRatio >= 1.0) mealQualityScore -= 20;
    else if (junkRatio >= 0.4) mealQualityScore -= 10;
    else mealQualityScore += 10;

    // Bound meal quality
    mealQualityScore = Math.min(100, Math.max(10, mealQualityScore));

    // E. Growth Risk Score (0-100): based on BMI & stature height percentiles + bone building gaps (calcium, protein, vitamin D)
    let growthRiskPenalty = 0;
    const age = Number(profile.age || 7);
    const height = Number(profile.height || 100);
    const weight = Number(profile.weight || 15);
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    if (bmi < 14.0 || bmi >= 22.0) growthRiskPenalty += 20; // BMI bounds
    
    let isShort = false;
    if (age <= 3 && height < 75) isShort = true;
    else if (age > 3 && age <= 5 && height < 90) isShort = true;
    else if (age > 5 && age <= 10 && height < 110) isShort = true;
    else if (age > 10 && height < 130) isShort = true;
    if (isShort) growthRiskPenalty += 20;

    // Add penalties for calcium/protein gaps
    if (deficits.protein.severity === 'RED') growthRiskPenalty += 15;
    if (deficits.calcium.severity === 'RED') growthRiskPenalty += 15;
    if (deficits.vitaminD.severity === 'RED') growthRiskPenalty += 10;

    const growthRiskScore = Math.max(10, 100 - growthRiskPenalty);

    // Compute Overall Wellness Score (0-100)
    // Weighted combination of the sub-scores
    const score = Math.round(
        (nutritionScore * 0.3) +
        (deficiencyScore * 0.25) +
        (growthRiskScore * 0.2) +
        (hydrationScore * 0.15) +
        (mealQualityScore * 0.1)
    );

    // Evaluate concerns, strengths, monitor to match original model interface
    const concerns = [];
    const monitor = [];
    const strengths = [];
    const recommendations = [];

    // Map new severity REDs/ORANGEs to concerns
    coreDeficiencies.forEach(n => {
        const record = deficits[n];
        if (record.severity === 'RED' || record.severity === 'ORANGE') {
            const label = n === 'vitaminD' ? 'Vitamin D' : n.toUpperCase();
            concerns.push({
                issue: `Low ${label} intake risk`,
                whyItMatters: `Child is only getting ${record.metPercent}% of the recommended target value.`,
                healthImpact: computeGrowthImpacts(deficits).find(i => i.nutrient.toLowerCase() === n.toLowerCase())?.risk || "Risk of physical development lag",
                priority: record.severity === 'RED' ? 'High' : 'Medium',
                solutionKey: n
            });
        } else if (record.severity === 'YELLOW') {
            const label = n === 'vitaminD' ? 'Vitamin D' : n.toUpperCase();
            monitor.push({
                issue: `Marginal ${label} intake`,
                whyItMatters: `Intake is around ${record.metPercent}%. Minor food modifications suggested.`,
                priority: 'Low'
            });
        } else {
            const label = n === 'vitaminD' ? 'Vitamin D' : n.toUpperCase();
            strengths.push({
                strength: `Excellent ${label} levels`,
                benefit: `Child consumed ${record.consumed} / ${record.target} today (Green Status).`,
                recommendation: `Maintain your current variety of ${label}-rich meals.`
            });
        }
    });

    // Populate roadmap recommendations
    const foodSuggestions = getPersonalizedFoods(deficits, profile.preferences);
    foodSuggestions.forEach(fs => {
        const iconMap = { protein: '🥩', iron: '🩸', calcium: '🦴', vitaminD: '☀️', fiber: '🥦', water: '💧' };
        recommendations.push({
            concern: `Target Deficiency: ${fs.nutrient.toUpperCase()}`,
            solution: `AI Recommended Foods: ${fs.foods.slice(0, 3).join(', ')}`,
            expectedImprovement: `Will close the daily ${fs.nutrient} deficit gap within 30-45 days.`,
            icon: iconMap[fs.nutrient] || '🥗'
        });
    });

    // Build the finalized wellness analysis payload
    const wellnessAnalysis = {
        score,
        nutritionScore,
        deficiencyScore,
        growthRiskScore,
        hydrationScore,
        mealQualityScore,
        rdas: targetRDA,
        deficiencies: deficits,
        groceries: compileGroceryList(deficits, profile.preferences),
        improvementPlan: generateImprovementPlan(score, deficits),
        growthImpacts: computeGrowthImpacts(deficits),
        aiExplanation: compileAiExplanation(deficits),
        concerns,
        monitor,
        strengths,
        recommendations
    };

    return wellnessAnalysis;
};
