const fs = require('fs');

const foodsData = JSON.parse(fs.readFileSync('ai-service-v2/datasets/foods.json', 'utf8'));
const condData = JSON.parse(fs.readFileSync('ai-service-v2/datasets/conditions.json', 'utf8'));
const allergData = JSON.parse(fs.readFileSync('ai-service-v2/datasets/allergies.json', 'utf8'));
const goalsData = JSON.parse(fs.readFileSync('ai-service-v2/datasets/goals.json', 'utf8'));

// Helper to clean snake_case to natural text
function deSnake(s) {
    return s.replace(/_/g, ' ').trim();
}

// 1. FOODS GAZETTEER
const foodsGaz = [];
const seenFood = new Set();

foodsData.forEach(item => {
    const raw = item.food_name;
    if (!raw) return;
    const norm = deSnake(raw).toLowerCase();
    if (!seenFood.has(norm)) {
        seenFood.add(norm);
        foodsGaz.push({
            surface_form: raw,
            canonical_form: raw.toLowerCase(),
            entity_type: "FOOD",
            source: "foods.json",
            food_id: item.food_id,
            category: item.category,
            aliases: [deSnake(raw)]
        });
    }
});

// Add prominent food preparations & food groups observed in RAG text
const extraFoods = [
    { name: "ragi porridge", aliases: ["ragi kanji", "finger millet porridge"], id: "F_EXTRA_01" },
    { name: "moong dal khichdi", aliases: ["dal khichdi", "khichdi"], id: "F_EXTRA_02" },
    { name: "green leafy vegetables", aliases: ["leafy greens", "green vegetables", "spinach", "palak", "methi"], id: "F_EXTRA_03" },
    { name: "boiled egg", aliases: ["egg", "eggs", "boiled eggs", "scrambled egg", "omelette"], id: "F_EXTRA_04" },
    { name: "curd", aliases: ["dahi", "yogurt", "double-toned curd"], id: "F_EXTRA_05" },
    { name: "paneer", aliases: ["cottage cheese"], id: "F_EXTRA_06" },
    { name: "idli", aliases: ["idlis", "rava idli", "mini idli"], id: "F_EXTRA_07" },
    { name: "dosa", aliases: ["dosas", "ragi dosa"], id: "F_EXTRA_08" },
    { name: "sundal", aliases: ["boiled legumes sundal", "chana sundal"], id: "F_EXTRA_09" },
    { name: "avial", aliases: ["kerala avial"], id: "F_EXTRA_10" },
    { name: "dalia", aliases: ["broken wheat", "wheat dalia"], id: "F_EXTRA_11" },
    { name: "chapati", aliases: ["roti", "phulka", "whole wheat roti"], id: "F_EXTRA_12" },
    { name: "rice", aliases: ["cooked rice", "brown rice", "steamed rice"], id: "F_EXTRA_13" },
    { name: "banana", aliases: ["bananas", "ripe banana", "mashed banana"], id: "F_EXTRA_14" },
    { name: "apple", aliases: ["apples", "apple puree", "stewed apple"], id: "F_EXTRA_15" },
    { name: "cereals", aliases: ["cereal grains", "whole grains"], id: "F_EXTRA_16" },
    { name: "pulses", aliases: ["legumes", "lentils", "dals"], id: "F_EXTRA_17" },
    { name: "millets", aliases: ["nutri-cereals", "jowar", "bajra", "ragi"], id: "F_EXTRA_18" },
    { name: "dairy products", aliases: ["milk products", "milk"], id: "F_EXTRA_19" },
    { name: "tubers", aliases: ["roots and tubers", "potato", "sweet potato"], id: "F_EXTRA_20" },
    { name: "nuts and seeds", aliases: ["tree nuts", "walnuts", "almonds", "groundnuts"], id: "F_EXTRA_21" }
];

extraFoods.forEach(ef => {
    const norm = ef.name.toLowerCase();
    if (!seenFood.has(norm)) {
        seenFood.add(norm);
        foodsGaz.push({
            surface_form: ef.name,
            canonical_form: ef.name.toLowerCase(),
            entity_type: "FOOD",
            source: "rag_data.json / ontology",
            food_id: ef.id,
            category: "curated_dish",
            aliases: ef.aliases
        });
    }
});

fs.writeFileSync('ner/data/gazetteers/foods_gazetteer.json', JSON.stringify(foodsGaz, null, 2), 'utf8');

// 2. NUTRIENTS GAZETTEER
const nutrients = [
    { name: "iron", aliases: ["elemental iron", "ferrous iron", "non-heme iron", "heme iron"], id: "NUT_IRON" },
    { name: "calcium", aliases: ["dietary calcium"], id: "NUT_CALCIUM" },
    { name: "zinc", aliases: ["elemental zinc"], id: "NUT_ZINC" },
    { name: "protein", aliases: ["proteins", "dietary protein", "high biological value protein"], id: "NUT_PROTEIN" },
    { name: "vitamin A", aliases: ["Vitamin A", "vit A", "retinol", "beta-carotene"], id: "NUT_VIT_A" },
    { name: "vitamin D", aliases: ["Vitamin D", "vit D", "Vit D", "vitamin D3", "cholecalciferol"], id: "NUT_VIT_D" },
    { name: "vitamin C", aliases: ["Vitamin C", "vit C", "ascorbic acid"], id: "NUT_VIT_C" },
    { name: "vitamin B12", aliases: ["Vitamin B12", "vit B12", "cobalamin", "cyanocobalamin"], id: "NUT_VIT_B12" },
    { name: "folate", aliases: ["folic acid", "vitamin B9", "folates"], id: "NUT_FOLATE" },
    { name: "iodine", aliases: ["iodide"], id: "NUT_IODINE" },
    { name: "fiber", aliases: ["dietary fiber", "insoluble fiber", "soluble fiber", "roughage"], id: "NUT_FIBER" },
    { name: "carbohydrates", aliases: ["carbs", "carbohydrate", "complex carbohydrates"], id: "NUT_CARBS" },
    { name: "fat", aliases: ["fats", "dietary fat", "lipids", "essential fatty acids"], id: "NUT_FAT" },
    { name: "energy", aliases: ["calories", "caloric energy", "kilocalories", "kcal"], id: "NUT_ENERGY" },
    { name: "omega-3 fatty acids", aliases: ["omega-3", "n-3 fatty acids", "DHA", "ALA", "EPA"], id: "NUT_OMEGA3" },
    { name: "magnesium", aliases: ["elemental magnesium"], id: "NUT_MAGNESIUM" },
    { name: "potassium", aliases: ["dietary potassium"], id: "NUT_POTASSIUM" },
    { name: "phosphorus", aliases: ["phosphate"], id: "NUT_PHOSPHORUS" }
];

const nutrientsGaz = nutrients.map(n => ({
    surface_form: n.name,
    canonical_form: n.name.toLowerCase(),
    entity_type: "NUTRIENT",
    source: "ICMR-NIN RDA Taxonomy",
    nutrient_id: n.id,
    aliases: n.aliases
}));

fs.writeFileSync('ner/data/gazetteers/nutrients_gazetteer.json', JSON.stringify(nutrientsGaz, null, 2), 'utf8');

// 3. CONDITIONS GAZETTEER
const conditionsGaz = [];
const seenCond = new Set();

condData.forEach(item => {
    const raw = item.condition_name;
    if (!raw) return;
    const norm = deSnake(raw).toLowerCase();
    if (!seenCond.has(norm)) {
        seenCond.add(norm);
        conditionsGaz.push({
            surface_form: deSnake(raw),
            canonical_form: norm,
            entity_type: "HEALTH_CONDITION",
            source: "conditions.json",
            condition_name: raw,
            aliases: [raw, deSnake(raw)]
        });
    }
});

const clinicalAdditions = [
    { name: "malnutrition", aliases: ["undernutrition", "protein energy malnutrition", "PEM"] },
    { name: "anemia", aliases: ["anaemia", "iron deficiency anemia", "IDA", "nutritional anemia"] },
    { name: "stunting", aliases: ["stunted", "chronic malnutrition", "low height-for-age"] },
    { name: "wasting", aliases: ["wasted", "acute malnutrition", "low weight-for-height"] },
    { name: "severe acute malnutrition", aliases: ["SAM", "severe wasting"] },
    { name: "moderate acute malnutrition", aliases: ["MAM"] },
    { name: "underweight", aliases: ["under-weight", "low weight-for-age"] },
    { name: "obesity", aliases: ["obese", "childhood obesity", "overweight"] },
    { name: "rickets", aliases: ["nutritional rickets", "vitamin D deficiency rickets"] },
    { name: "diarrhea", aliases: ["diarrhoea", "loose stools", "acute gastroenteritis"] },
    { name: "constipation", aliases: ["constipated", "hard stools"] },
    { name: "fever", aliases: ["pyrexia", "high fever", "febrile illness"] },
    { name: "growth faltering", aliases: ["faltering growth", "failure to thrive", "FTT"] },
    { name: "xerophthalmia", aliases: ["nutritional blindness", "night blindness", "Bitot spots"] },
    { name: "scurvy", aliases: ["vitamin C deficiency"] }
];

clinicalAdditions.forEach(ca => {
    const norm = ca.name.toLowerCase();
    if (!seenCond.has(norm)) {
        seenCond.add(norm);
        conditionsGaz.push({
            surface_form: ca.name,
            canonical_form: norm,
            entity_type: "HEALTH_CONDITION",
            source: "WHO/IAP Pediatric Standards",
            condition_name: ca.name.replace(/\s+/g, '_'),
            aliases: ca.aliases
        });
    }
});

fs.writeFileSync('ner/data/gazetteers/conditions_gazetteer.json', JSON.stringify(conditionsGaz, null, 2), 'utf8');

// 4. ALLERGENS GAZETTEER
const allergens = [
    { name: "peanut allergy", aliases: ["peanut allergic", "groundnut allergy", "peanut hypersensitivity"], id: "ALLERG_PEANUT" },
    { name: "egg allergy", aliases: ["egg protein allergy", "egg hypersensitivity", "allergic to eggs"], id: "ALLERG_EGG" },
    { name: "lactose intolerance", aliases: ["lactose-intolerant", "milk lactose intolerance", "lactase deficiency"], id: "ALLERG_LACTOSE" },
    { name: "cow milk protein allergy", aliases: ["CMPA", "cow's milk protein allergy", "milk allergy", "milk protein allergy"], id: "ALLERG_CMPA" },
    { name: "celiac disease", aliases: ["coeliac disease", "celiac sprue", "gluten enteropathy"], id: "ALLERG_CELIAC" },
    { name: "gluten sensitivity", aliases: ["non-celiac gluten sensitivity", "NCGS", "gluten intolerance"], id: "ALLERG_GLUTEN" },
    { name: "tree nut allergy", aliases: ["nut allergy", "allergic to nuts", "walnut allergy", "almond allergy"], id: "ALLERG_TREENUT" },
    { name: "fish allergy", aliases: ["seafood allergy", "allergic to fish"], id: "ALLERG_FISH" },
    { name: "soy allergy", aliases: ["soya allergy", "soy protein allergy"], id: "ALLERG_SOY" },
    { name: "anaphylaxis", aliases: ["anaphylactic reaction", "anaphylactic shock"], id: "ALLERG_ANAPHYLAXIS" }
];

const allergensGaz = allergens.map(a => ({
    surface_form: a.name,
    canonical_form: a.name.toLowerCase(),
    entity_type: "ALLERGEN",
    source: "allergies.json / WAO Guidelines",
    allergen_id: a.id,
    aliases: a.aliases
}));

fs.writeFileSync('ner/data/gazetteers/allergens_gazetteer.json', JSON.stringify(allergensGaz, null, 2), 'utf8');

// 5. AGE GROUPS GAZETTEER
const ageGroups = [
    { name: "infant", aliases: ["infants", "infancy", "baby", "babies", "newborn", "newborns", "neonate", "neonates"], id: "AGE_INFANT" },
    { name: "toddler", aliases: ["toddlers", "toddlerhood", "1-3 years", "1 to 3 years", "2-year-old", "2yo", "3yo"], id: "AGE_TODDLER" },
    { name: "preschooler", aliases: ["preschoolers", "pre-schoolers", "pre-school children", "3-5 years", "3 to 5 years", "4yo", "5yo"], id: "AGE_PRESCHOOL" },
    { name: "school age child", aliases: ["school children", "school-age", "school going children", "6-10 years", "6 to 10 years", "7-year-old", "8-year-old"], id: "AGE_SCHOOL" },
    { name: "adolescent", aliases: ["adolescents", "adolescence", "teenager", "teenagers", "teens", "10-18 years", "puberty"], id: "AGE_ADOLESCENT" },
    { name: "children", aliases: ["child", "pediatric population", "under 5 years", "under-five children", "under 3 years", "6 to 8 months", "6-8 months", "9 to 12 months", "first 1000 days"], id: "AGE_GENERAL_PEDIATRIC" }
];

const ageGroupsGaz = ageGroups.map(ag => ({
    surface_form: ag.name,
    canonical_form: ag.name.toLowerCase(),
    entity_type: "AGE_GROUP",
    source: "WHO / IAP Pediatric Age Standards",
    age_group_id: ag.id,
    aliases: ag.aliases
}));

fs.writeFileSync('ner/data/gazetteers/age_groups_gazetteer.json', JSON.stringify(ageGroupsGaz, null, 2), 'utf8');

// 6. MEAL TYPES GAZETTEER
const mealTypes = [
    { name: "breakfast", aliases: ["morning meal", "morning breakfast"], id: "MEAL_BREAKFAST" },
    { name: "morning snack", aliases: ["mid-morning snack", "mid morning snack", "10 AM snack"], id: "MEAL_MORNING_SNACK" },
    { name: "lunch", aliases: ["midday meal", "afternoon lunch"], id: "MEAL_LUNCH" },
    { name: "evening snack", aliases: ["afternoon snack", "mid-afternoon snack", "4 PM snack", "tea-time snack"], id: "MEAL_EVENING_SNACK" },
    { name: "dinner", aliases: ["night meal", "supper", "evening dinner"], id: "MEAL_DINNER" },
    { name: "snack", aliases: ["snacks", "healthy snacks", "finger food snack"], id: "MEAL_SNACK_GENERAL" }
];

const mealTypesGaz = mealTypes.map(mt => ({
    surface_form: mt.name,
    canonical_form: mt.name.toLowerCase(),
    entity_type: "MEAL_TYPE",
    source: "NutriBite Meal Scheduler",
    meal_type_id: mt.id,
    aliases: mt.aliases
}));

fs.writeFileSync('ner/data/gazetteers/meal_types_gazetteer.json', JSON.stringify(mealTypesGaz, null, 2), 'utf8');

// 7. GROWTH METRICS GAZETTEER
const growthMetrics = [
    { name: "growth velocity", aliases: ["height velocity", "weight velocity", "growth rate", "velocity curve"], id: "METRIC_VELOCITY" },
    { name: "height-for-age", aliases: ["Height-for-Age", "height for age", "HFA", "length-for-age", "Length-for-Age", "LFA"], id: "METRIC_HFA" },
    { name: "weight-for-age", aliases: ["Weight-for-Age", "weight for age", "WFA"], id: "METRIC_WFA" },
    { name: "weight-for-height", aliases: ["Weight-for-Height", "weight for height", "WFH", "weight-for-length", "Weight-for-Length", "WFL"], id: "METRIC_WFH" },
    { name: "BMI", aliases: ["body mass index", "BMI-for-age", "BMI percentile", "BMI z-score"], id: "METRIC_BMI" },
    { name: "Z-score", aliases: ["z-score", "Z-scores", "standard deviation score", "SD score", "Z score"], id: "METRIC_ZSCORE" },
    { name: "Mid-Upper Arm Circumference", aliases: ["MUAC", "mid-upper arm circumference", "arm circumference"], id: "METRIC_MUAC" },
    { name: "head circumference", aliases: ["occipitofrontal circumference", "OFC", "HC-for-age"], id: "METRIC_HC" },
    { name: "growth chart", aliases: ["Road to Health chart", "IAP Growth Chart", "WHO growth standard curves"], id: "METRIC_CHART" }
];

const growthMetricsGaz = growthMetrics.map(gm => ({
    surface_form: gm.name,
    canonical_form: gm.name.toLowerCase(),
    entity_type: "GROWTH_METRIC",
    source: "WHO / IAP Growth Standards",
    metric_id: gm.id,
    aliases: gm.aliases
}));

fs.writeFileSync('ner/data/gazetteers/growth_metrics_gazetteer.json', JSON.stringify(growthMetricsGaz, null, 2), 'utf8');

console.log('All 7 normalized gazetteers generated successfully in ner/data/gazetteers/');
console.log(`- Foods: ${foodsGaz.length} entries`);
console.log(`- Nutrients: ${nutrientsGaz.length} entries`);
console.log(`- Conditions: ${conditionsGaz.length} entries`);
console.log(`- Allergens: ${allergensGaz.length} entries`);
console.log(`- Age Groups: ${ageGroupsGaz.length} entries`);
console.log(`- Meal Types: ${mealTypesGaz.length} entries`);
console.log(`- Growth Metrics: ${growthMetricsGaz.length} entries`);
