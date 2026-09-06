/**
 * Enterprise Pediatric Grocery Optimizer Engine (Phase 3)
 * Modular architecture, single-responsibility services.
 */
import { ProfileContextEngine, GapDetectionEngine } from './nutritionIntelligenceEngine.js';
import { MealPlannerService } from './mealPlannerEngine.js';

// ==========================================
// 1. COMPREHENSIVE DEFICIENCY GROCERY CATALOG
// ==========================================
export const DEFICIENCY_GROCERY_CATALOG = {
    iron: [
        { food: "Sprouted Ragi Flour (500g)", category: "Whole Grains", nutrients: ["iron", "calcium", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Sprouting doubles non-heme iron absorption while delivering dense plant calcium." },
        { food: "Fresh Spinach / Palak (2 bunches)", category: "Vegetables", nutrients: ["iron", "vitaminA", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High non-heme iron and folate. Steam lightly to maximize bioavailability." },
        { food: "Fresh Moringa / Drumstick Leaves (250g)", category: "Vegetables", nutrients: ["iron", "calcium", "protein"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Superfood delivering 4x the non-heme iron of spinach with essential trace minerals." },
        { food: "Organic Solid Jaggery / Gur (500g)", category: "Whole Grains", nutrients: ["iron", "minerals"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Natural unrefined iron sweetener that promotes red blood cell formation." },
        { food: "Fresh Beetroot (500g)", category: "Vegetables", nutrients: ["iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Stimulates hemoglobin synthesis, nitric oxide circulation, and stamina." },
        { food: "Black Dates / Khajoor (250g)", category: "Fruits", nutrients: ["iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High-density natural iron snack that boosts afternoon pediatric energy." },
        { food: "Roasted Bengal Gram / Bhuna Chana (200g)", category: "Protein", nutrients: ["iron", "protein", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High-protein crunchy iron source ideal for healthy school snacking." },
        { food: "Fresh Nagpur Oranges / Sweet Limes (1 kg)", category: "Fruits", nutrients: ["vitaminC", "iron"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Essential Vitamin C carrier to squeeze over iron foods for 300% absorption synergy." },
        { food: "White / Black Sesame Seeds (200g)", category: "Healthy Fats", nutrients: ["iron", "calcium", "zinc"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Concentrated plant iron and calcium matrix for bone and blood health." },
        { food: "Fresh Ruby Pomegranate / Anar (500g)", category: "Fruits", nutrients: ["iron", "vitaminC", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Rich in iron, polyphenols, and ascorbic acid that enhance erythropoiesis." },
        { food: "Black Raisins / Munakka (200g)", category: "Fruits", nutrients: ["iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Traditional Ayurvedic iron and copper source soaked overnight for optimal RBC health." },
        { food: "Rajma / Jammu Red Kidney Beans (500g)", category: "Protein", nutrients: ["iron", "protein", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Dense plant iron and folate provider supporting sustained muscle vitality." },
        { food: "Garden Cress Seeds / Aliv (100g)", category: "Healthy Fats", nutrients: ["iron", "folate", "calcium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Powerhouse delivering 100mg iron per 100g; mix with warm milk or jaggery." },
        { food: "Roasted Chana Sattu Flour (500g)", category: "Whole Grains", nutrients: ["iron", "protein", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Traditional instant cooling iron and protein drink base for active kids." },
        { food: "Sprouted Matki / Moth Beans (500g)", category: "Protein", nutrients: ["iron", "protein", "zinc"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Sprouted legume packed with bioavailable iron and zinc for linear stamina." }
    ],
    calcium: [
        { food: "Fresh Set Dahi / Homemade Curd (1 kg)", category: "Dairy", nutrients: ["calcium", "protein"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "High-density bioavailable calcium with gut-friendly lactic probiotics." },
        { food: "Low-Salt Malai Paneer (400g)", category: "Dairy", nutrients: ["calcium", "protein"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Rich in casein protein and skeletal calcium for linear height velocity." },
        { food: "Pure Cow Milk / Fortified Milk (1 Litre)", category: "Dairy", nutrients: ["calcium", "vitaminD", "protein"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Classic pediatric bone building staple with calcium-phosphate balance." },
        { food: "White Sesame Seeds / Til (200g)", category: "Healthy Fats", nutrients: ["calcium", "iron", "zinc"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Supplies 975mg calcium per 100g to strengthen bone mineral density." },
        { food: "Raw Foxnuts / Makhana (200g)", category: "Whole Grains", nutrients: ["calcium", "magnesium", "protein"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Low-calorie mineral powerhouse that locks calcium into the bone crystal matrix." },
        { food: "Fresh Fenugreek / Methi Leaves (2 bunches)", category: "Vegetables", nutrients: ["calcium", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Mineral-rich leafy green that supports skeletal mineralization." },
        { food: "California / Kashmiri Almonds (200g)", category: "Healthy Fats", nutrients: ["calcium", "protein", "vitaminE"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Natural calcium and healthy fats that support brain and bone growth." },
        { food: "Pure A2 Cow Desi Ghee (500ml)", category: "Healthy Fats", nutrients: ["calcium", "vitaminD", "healthyFats"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Supplies Vitamin K2 and butyric acid to guide calcium directly into bones and teeth." },
        { food: "Chia Seeds / Tukmaria Sabja (150g)", category: "Healthy Fats", nutrients: ["calcium", "fiber", "healthyFats"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Delivers 630mg calcium per 100g along with anti-inflammatory ALA omega-3s." },
        { food: "Dried Royal Figs / Anjeer (200g)", category: "Fruits", nutrients: ["calcium", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Mineral-dense dried fruit providing bone-building calcium and natural gentle bowel transit." },
        { food: "Fresh Curry Leaves / Kadi Patta (100g)", category: "Vegetables", nutrients: ["calcium", "iron", "vitaminA"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Super-concentrated leafy calcium and iron seasoning to temper daily dals." },
        { food: "Fortified Organic Soya Tofu (200g)", category: "Protein", nutrients: ["calcium", "protein"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Calcium-sulfate set non-dairy paneer alternative delivering high-density skeletal minerals." }
    ],
    protein: [
        { food: "Yellow Moong Dal (1 kg)", category: "Protein", nutrients: ["protein", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Gentle, easily digestible plant protein with complete amino acid synergy." },
        { food: "Low-Salt Malai Paneer (400g)", category: "Dairy", nutrients: ["protein", "calcium"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Dense high-biological value protein for muscle repair and height gains." },
        { food: "Sprouted Green Moong (500g)", category: "Protein", nutrients: ["protein", "iron", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Active enzymatic plant protein with enhanced amino acid bioavailability." },
        { food: "Toor Dal / Arhar Dal (1 kg)", category: "Protein", nutrients: ["protein", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Core Indian staple providing essential lysine when paired with rice or roti." },
        { food: "Organic Chana Dal (500g)", category: "Protein", nutrients: ["protein", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Slow-digesting complex protein that sustains steady energy levels." },
        { food: "Nutri Soya Chunks (200g)", category: "Protein", nutrients: ["protein", "iron"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Ultra-concentrated plant protein supplying 52g protein per 100g." },
        { food: "Fresh Green Peas / Matar (500g)", category: "Vegetables", nutrients: ["protein", "fiber", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Kid-friendly sweet vegetable protein rich in vitamins." },
        { food: "Farm Fresh Whole Eggs (Pack of 6)", category: "Protein", nutrients: ["protein", "iron", "vitaminD"], isVeg: false, hasDairy: false, hasPeanut: false, rationale: "Gold-standard high biological value protein with natural choline for brain development." },
        { food: "Kabuli Chana / White Chickpeas (500g)", category: "Protein", nutrients: ["protein", "fiber", "zinc"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Fiber-rich legume high in branched-chain amino acids and zinc for skeletal growth." },
        { food: "Kala Chana / Brown Chickpeas (500g)", category: "Protein", nutrients: ["protein", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Dense protein and low-GI carbohydrate champion supporting muscular stamina." },
        { food: "Split Masoor Dal / Red Lentils (500g)", category: "Protein", nutrients: ["protein", "iron", "folate"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Fast-cooking light protein dal ideal for nourishing pediatric soups and khichdis." },
        { food: "Shelled Pumpkin Seeds / Kaddu Beej (150g)", category: "Healthy Fats", nutrients: ["protein", "zinc", "magnesium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Supplies 30g protein per 100g with high magnesium to support muscle contraction." },
        { food: "Urad Dal / Split Black Gram (500g)", category: "Protein", nutrients: ["protein", "calcium", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Fermentable dal delivering rich protein and bone-building minerals for idlis and dosas." }
    ],
    vitaminD: [
        { food: "Fresh Button Mushrooms (200g)", category: "Vegetables", nutrients: ["vitaminD", "minerals"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Natural dietary Vitamin D source that activates bone mineralization." },
        { food: "Fortified Cow Milk (1 Litre)", category: "Dairy", nutrients: ["vitaminD", "calcium", "protein"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Fortified with active Vitamin D3 to ensure maximum intestinal calcium absorption." },
        { food: "Farm Fresh Whole Eggs (Pack of 6)", category: "Protein", nutrients: ["vitaminD", "protein", "iron"], isVeg: false, hasDairy: false, hasPeanut: false, rationale: "Egg yolks supply natural fat-soluble Vitamin D and phospholipids." },
        { food: "Fortified Probiotic Yogurt (400g)", category: "Dairy", nutrients: ["vitaminD", "calcium", "protein"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Fortified cultured dairy providing synergistic Vitamin D3 and bioavailable calcium." },
        { food: "Pure A2 Cow Desi Ghee (500ml)", category: "Healthy Fats", nutrients: ["vitaminD", "calcium", "healthyFats"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Delivers essential lipid vehicle required for fat-soluble Vitamin D3 transport." }
    ],
    fiber: [
        { food: "Whole Wheat Khapli Atta (2 kg)", category: "Whole Grains", nutrients: ["fiber", "protein", "minerals"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Ancient emmer wheat rich in dietary fiber for smooth digestive transit." },
        { food: "Organic Rolled Oats (500g)", category: "Whole Grains", nutrients: ["fiber", "protein"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Rich in beta-glucan soluble fiber that regulates gut microbiome health." },
        { food: "Organic Bajra / Pearl Millet Flour (500g)", category: "Whole Grains", nutrients: ["fiber", "iron", "zinc"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Insoluble fiber champion that prevents childhood constipation." },
        { food: "Fresh Ripe Papaya (1 medium)", category: "Fruits", nutrients: ["fiber", "vitaminA", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Natural papain digestive enzymes that support intestinal gut motility." },
        { food: "Fresh Crisp Guavas (500g)", category: "Fruits", nutrients: ["fiber", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Supplies 5g of dietary pectin fiber per fruit to normalize bowel movements." },
        { food: "Fresh Bottle Gourd / Lauki (1 medium)", category: "Vegetables", nutrients: ["fiber", "water"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Hydrating soluble fiber that cools and protects the intestinal lining." },
        { food: "Crisp Himachal Apples (1 kg)", category: "Fruits", nutrients: ["fiber", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Rich in prebiotic apple pectin that feeds beneficial bifidobacteria in child gut." },
        { food: "Fresh Tender Okra / Bhindi (500g)", category: "Vegetables", nutrients: ["fiber", "folate"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Gentle mucilage fiber that protects gut mucosal barrier and relieves sluggish digestion." },
        { food: "Organic Jowar / Sorghum Flour (500g)", category: "Whole Grains", nutrients: ["fiber", "iron", "calcium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High-fiber gluten-free ancient grain promoting steady metabolic glycemic release." },
        { food: "Fresh Ridge Gourd / Turai (500g)", category: "Vegetables", nutrients: ["fiber", "water", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Easily digestible hydrating vegetable fiber that prevents abdominal bloating." }
    ],
    vitaminA: [
        { food: "Fresh Orange Carrots (500g)", category: "Vegetables", nutrients: ["vitaminA", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Loaded with beta-carotene for sharp visual acuity and corneal health." },
        { food: "Fresh Sweet Pumpkin / Kaddu (500g)", category: "Vegetables", nutrients: ["vitaminA", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Gentle carotenoids that support mucosal respiratory immunity." },
        { food: "Fresh Ripe Papaya (1 medium)", category: "Fruits", nutrients: ["vitaminA", "vitaminC", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Natural provitamin A carotenoids for vibrant skin and immune defense." },
        { food: "Fresh Spinach / Palak (2 bunches)", category: "Vegetables", nutrients: ["vitaminA", "iron"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High lutein and beta-carotene protecting developing vision." },
        { food: "Fresh Sweet Potatoes / Shakarkandi (500g)", category: "Vegetables", nutrients: ["vitaminA", "fiber", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Dense beta-carotene root vegetable providing long-chain carbs and immune protection." },
        { food: "Fresh Fresh Coriander / Kothmir (2 bunches)", category: "Vegetables", nutrients: ["vitaminA", "vitaminC", "iron"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Potent herbal carotenoid and flavonoid garnish protecting epithelial membranes." },
        { food: "Ripe Alphonso / Banganapalli Mangoes (1 kg)", category: "Fruits", nutrients: ["vitaminA", "vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Kid-favorite natural beta-carotene fruit supporting eye and skin regeneration." }
    ],
    vitaminC: [
        { food: "Fresh Juicy Lemons / Nimbu (6 pcs)", category: "Fruits", nutrients: ["vitaminC"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Essential ascorbic acid booster to squeeze over dals to triple iron uptake." },
        { food: "Fresh Indian Gooseberry / Amla (250g)", category: "Fruits", nutrients: ["vitaminC", "minerals"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Concentrated natural Vitamin C powerhouse (20x that of oranges) for immunity." },
        { food: "Nagpur Oranges (1 kg)", category: "Fruits", nutrients: ["vitaminC", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Juicy citrus that boosts immune phagocytes and speeds wound healing." },
        { food: "Crisp Green Bell Peppers / Capsicum (250g)", category: "Vegetables", nutrients: ["vitaminC", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Raw crunchy Vitamin C booster that preserves collagen elasticity." },
        { food: "Fresh Sweet Limes / Mosambi (1 kg)", category: "Fruits", nutrients: ["vitaminC", "water"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Hydrating alkaline citrus rich in ascorbic acid and potassium for active recovery." },
        { food: "Fresh Mint Leaves / Pudina (1 bunch)", category: "Vegetables", nutrients: ["vitaminC", "iron"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Cooling antioxidant herb stimulating gastric digestive enzymes and immunity." },
        { food: "Fresh Strawberries / Kiwi (200g)", category: "Fruits", nutrients: ["vitaminC", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Vibrant antioxidant berry boosting immune defense against seasonal flu." }
    ],
    zinc: [
        { food: "Roasted Foxnuts / Makhana (200g)", category: "Whole Grains", nutrients: ["zinc", "calcium", "magnesium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Supplies bioavailable zinc cofactors for osteoblast growth plates." },
        { food: "Organic Bajra / Pearl Millet (1 kg)", category: "Whole Grains", nutrients: ["zinc", "iron", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Traditional Indian millet promoting healthy linear growth and appetite." },
        { food: "Shelled Watermelon Seeds / Magaz (150g)", category: "Healthy Fats", nutrients: ["zinc", "protein", "magnesium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Mineral-rich seed delivering cellular zinc for immune DNA synthesis." },
        { food: "Raw Sunflower Seeds (150g)", category: "Healthy Fats", nutrients: ["zinc", "vitaminE", "healthyFats"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Supplies trace zinc, selenium, and antioxidant Vitamin E for cellular repair." },
        { food: "Whole Cashews / Kaju (150g)", category: "Healthy Fats", nutrients: ["zinc", "protein", "healthyFats"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Kid-friendly nut offering zinc and healthy monounsaturated fatty acids for energy." }
    ],
    water: [
        { food: "Fresh Tender Coconut Water (2 pcs)", category: "Hydration", nutrients: ["water", "potassium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Pure isotonic cellular hydration loaded with natural potassium." },
        { food: "Ingredients for Fresh Buttermilk (Curd, Jeera, Mint)", category: "Hydration", nutrients: ["water", "calcium"], isVeg: true, hasDairy: true, hasPeanut: false, rationale: "Traditional cooling hydration that replenishes electrolytes during active play." },
        { food: "Fresh Crisp Cucumbers (500g)", category: "Vegetables", nutrients: ["water", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "96% natural structured cellular water for daytime hydration." },
        { food: "Fresh Sweet Watermelon (1 mini)", category: "Fruits", nutrients: ["water", "vitaminC", "potassium"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Electrolyte-dense 92% hydrating fruit loaded with lycopene and fluid volume." },
        { food: "Barley Grains / Jau for Barley Water (500g)", category: "Whole Grains", nutrients: ["water", "fiber", "minerals"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Traditional soothing pediatric coolant that supports kidney hydration and gut calm." }
    ],
    healthyFats: [
        { food: "Kashmiri Walnuts / Akhrot (200g)", category: "Healthy Fats", nutrients: ["healthyFats", "protein"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Premier plant source of ALA Omega-3 fatty acids for neural connectivity and memory." },
        { food: "Roasted Flaxseed Powder / Alsi (150g)", category: "Healthy Fats", nutrients: ["healthyFats", "fiber"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "High in lignans and omega-3s to support pediatric brain development and visual acuity." },
        { food: "Pure Cold-Pressed Virgin Coconut Oil (500ml)", category: "Healthy Fats", nutrients: ["healthyFats"], isVeg: true, hasDairy: false, hasPeanut: false, rationale: "Medium chain triglycerides (MCTs) that provide immediate clean cellular energy." }
    ]
};

const CATEGORY_MAP = {
    // Vegetables
    "spinach": "Vegetables",
    "palak": "Vegetables",
    "carrot": "Vegetables",
    "beetroot": "Vegetables",
    "moringa": "Vegetables",
    "drumstick": "Vegetables",
    "mustard greens": "Vegetables",
    "sarson": "Vegetables",
    "cucumber": "Vegetables",
    "tomato": "Vegetables",
    "cauliflower": "Vegetables",
    "onion": "Vegetables",
    "chili": "Vegetables",
    "coriander": "Vegetables",
    "kothmir": "Vegetables",
    "mint": "Vegetables",
    "pudina": "Vegetables",
    "lauki": "Vegetables",
    "bottle gourd": "Vegetables",
    "pumpkin": "Vegetables",
    "kaddu": "Vegetables",
    "broccoli": "Vegetables",
    "amaranth": "Vegetables",
    "fenugreek": "Vegetables",
    "methi": "Vegetables",
    "ridge gourd": "Vegetables",
    "turai": "Vegetables",
    "bell pepper": "Vegetables",
    "capsicum": "Vegetables",
    "mushrooms": "Vegetables",
    "curry leaves": "Vegetables",
    "kadi patta": "Vegetables",
    "sweet potato": "Vegetables",
    "shakarkandi": "Vegetables",
    "okra": "Vegetables",
    "bhindi": "Vegetables",

    // Fruits
    "lemon": "Fruits",
    "nimbu": "Fruits",
    "dates": "Fruits",
    "khajoor": "Fruits",
    "orange": "Fruits",
    "apple": "Fruits",
    "banana": "Fruits",
    "papaya": "Fruits",
    "mango": "Fruits",
    "amla": "Fruits",
    "guava": "Fruits",
    "pomegranate": "Fruits",
    "anar": "Fruits",
    "raisins": "Fruits",
    "munakka": "Fruits",
    "figs": "Fruits",
    "anjeer": "Fruits",
    "mosambi": "Fruits",
    "sweet lime": "Fruits",
    "strawberry": "Fruits",
    "kiwi": "Fruits",
    "watermelon": "Fruits",

    // Whole Grains
    "ragi": "Whole Grains",
    "rice": "Whole Grains",
    "red rice": "Whole Grains",
    "wheat": "Whole Grains",
    "atta": "Whole Grains",
    "khapli": "Whole Grains",
    "bajra": "Whole Grains",
    "jowar": "Whole Grains",
    "besan": "Whole Grains",
    "sattu": "Whole Grains",
    "corn": "Whole Grains",
    "makki": "Whole Grains",
    "oats": "Whole Grains",
    "brown rice": "Whole Grains",
    "barley": "Whole Grains",
    "jau": "Whole Grains",
    "makhana": "Whole Grains",
    "foxnuts": "Whole Grains",
    "jaggery": "Whole Grains",
    "gur": "Whole Grains",

    // Dairy
    "milk": "Dairy",
    "curd": "Dairy",
    "dahi": "Dairy",
    "paneer": "Dairy",
    "yogurt": "Dairy",
    "ghee": "Dairy",
    "butter": "Dairy",
    "cheese": "Dairy",

    // Protein
    "moong dal": "Protein",
    "toor dal": "Protein",
    "arhar dal": "Protein",
    "chana dal": "Protein",
    "chana": "Protein",
    "chickpeas": "Protein",
    "kabuli chana": "Protein",
    "kala chana": "Protein",
    "rajma": "Protein",
    "masoor dal": "Protein",
    "urad dal": "Protein",
    "lentils": "Protein",
    "sprouts": "Protein",
    "matki": "Protein",
    "peas": "Protein",
    "matar": "Protein",
    "egg": "Protein",
    "chicken": "Protein",
    "fish": "Protein",
    "soya": "Protein",
    "tofu": "Protein",
    "soya chunks": "Protein",

    // Healthy Fats
    "sesame": "Healthy Fats",
    "til": "Healthy Fats",
    "peanut": "Healthy Fats",
    "almond": "Healthy Fats",
    "badam": "Healthy Fats",
    "walnut": "Healthy Fats",
    "akhrot": "Healthy Fats",
    "flaxseed": "Healthy Fats",
    "alsi": "Healthy Fats",
    "chia": "Healthy Fats",
    "sabja": "Healthy Fats",
    "pumpkin seeds": "Healthy Fats",
    "sunflower seeds": "Healthy Fats",
    "magaz": "Healthy Fats",
    "cashew": "Healthy Fats",
    "kaju": "Healthy Fats",
    "garden cress": "Healthy Fats",
    "aliv": "Healthy Fats",
    "coconut oil": "Healthy Fats",
    "olive oil": "Healthy Fats",

    // Hydration
    "water": "Hydration",
    "coconut water": "Hydration",
    "buttermilk": "Hydration",
    "chaas": "Hydration",
    "juice": "Hydration"
};

export class ShoppingCategoryService {
    static classify(foodName) {
        if (!foodName) return "Others";
        const clean = foodName.toLowerCase().trim();
        
        const key = Object.keys(CATEGORY_MAP).find(k => clean.includes(k) || k.includes(clean));
        return key ? CATEGORY_MAP[key] : "Others";
    }
}

// ==========================================
// 2. PRIORITY AND SCORING ENGINES
// ==========================================
export class ShoppingPriorityEngine {
    static getPriority(nutrients, gaps) {
        let maxSeverity = "Low";
        
        nutrients.forEach(nut => {
            const gap = gaps[nut?.toLowerCase()];
            if (gap) {
                if (gap.severity === "Critical") {
                    maxSeverity = "Critical";
                } else if (gap.severity === "High" && maxSeverity !== "Critical") {
                    maxSeverity = "High";
                } else if (gap.severity === "Moderate" && maxSeverity !== "Critical" && maxSeverity !== "High") {
                    maxSeverity = "Medium";
                }
            }
        });

        return maxSeverity;
    }
}

export class FoodRankingEngine {
    static scoreFood(item, context, isUsedInMeals) {
        let score = 0;

        // 1. Score based on number of deficiencies solved
        score += item.nutrients.length * 20;

        // 2. Score based on meal planner usage (+30 bonus)
        if (isUsedInMeals) {
            score += 30;
        }

        // 3. Priority weighting
        if (item.priority === 'Critical') score += 40;
        else if (item.priority === 'High') score += 25;
        else if (item.priority === 'Medium') score += 10;

        // 4. Child profile preferences check
        const cleanFood = item.food.toLowerCase();
        
        // Likes/Favorites (+15 points)
        const matchesLikes = context.likes.some(like => cleanFood.includes(like) || like.includes(cleanFood));
        if (matchesLikes) score += 15;

        // Dislikes (Severe Penalty)
        const matchesDislikes = context.dislikes.some(dislike => cleanFood.includes(dislike) || dislike.includes(cleanFood));
        if (matchesDislikes) score -= 100;

        // Allergy safety (Peanut check)
        const isPeanutAllergic = context.allergies?.some(a => a.toLowerCase().includes('peanut'));
        if (isPeanutAllergic && cleanFood.includes('peanut')) {
            score -= 1000;
        }

        // Medical conditions penalty/booster
        if (context.isLactoseIntolerant && ["milk", "paneer", "curd", "yogurt"].some(d => cleanFood.includes(d))) {
            score -= 500;
        }

        return score;
    }
}

// ==========================================
// 3. CORE OPTIMIZER SERVICE
// ==========================================
export class GroceryOptimizerService {
    static optimize(profile, mealLogs, mealPlan, rawRecommendations) {
        const context = ProfileContextEngine.buildContext(profile);
        const averages = MealPlannerService.calculateAverages(mealLogs);
        const gaps = GapDetectionEngine.detectGaps(context, averages);

        const isPeanutAllergic = (profile.allergies || []).some(a => a.toLowerCase().includes('peanut'));
        const isVeg = (profile.dietaryPreference || 'Vegetarian').toLowerCase().includes('veg') && !(profile.dietaryPreference || '').toLowerCase().includes('non');
        const isLactose = (profile.healthConditions || []).some(c => c.toLowerCase().includes('lactose'));

        // Map ingredients used in active mealPlan
        const mealIngredientsMap = {};
        if (mealPlan) {
            Object.keys(mealPlan).forEach(slot => {
                const meal = mealPlan[slot];
                if (meal && Array.isArray(meal.foods)) {
                    meal.foods.forEach(f => {
                        const cleanIng = f.toLowerCase().trim();
                        if (!mealIngredientsMap[cleanIng]) {
                            mealIngredientsMap[cleanIng] = [];
                        }
                        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
                        if (!mealIngredientsMap[cleanIng].includes(slotLabel)) {
                            mealIngredientsMap[cleanIng].push(slotLabel);
                        }
                    });
                }
            });
        }

        // Gather all unique foods
        const deduplicatedList = [];
        const seenFoods = new Set();

        // 1. Process all items from DEFICIENCY_GROCERY_CATALOG for active & complementary deficiencies
        const activeDeficiencyKeys = Object.keys(gaps).filter(nut => gaps[nut] && gaps[nut].severity !== "Normal");
        const allDeficiencyKeys = ['iron', 'calcium', 'protein', 'vitaminD', 'fiber', 'vitaminA', 'vitaminC', 'zinc', 'water', 'healthyFats'];
        
        // Put active deficiencies first, then remaining deficiency keys
        const orderedEvaluationKeys = Array.from(new Set([...activeDeficiencyKeys, ...allDeficiencyKeys]));

        orderedEvaluationKeys.forEach(nutKey => {
            const catalogItems = DEFICIENCY_GROCERY_CATALOG[nutKey] || [];
            const isNutrientDeficient = gaps[nutKey] && gaps[nutKey].severity !== "Normal";
            const gapSeverity = gaps[nutKey]?.severity;
            
            catalogItems.forEach(item => {
                const key = item.food.toLowerCase().trim();
                
                // Safety & dietary filters
                if (isVeg && !item.isVeg) return;
                if (isLactose && item.hasDairy) return;
                if (isPeanutAllergic && item.food.toLowerCase().includes('peanut')) return;

                if (!seenFoods.has(key)) {
                    seenFoods.add(key);

                    // Check if used in meal plan slots
                    const matchingSlotKeys = Object.keys(mealIngredientsMap).filter(m => key.includes(m) || m.includes(key.split(' ')[0]));
                    const usedInMeals = matchingSlotKeys.flatMap(m => mealIngredientsMap[m] || []);
                    const uniqueSlots = Array.from(new Set(usedInMeals));

                    const priority = ShoppingPriorityEngine.getPriority(item.nutrients, gaps);
                    
                    // If the item addresses a child's active critical/high deficiency, elevate priority
                    let finalPriority = priority;
                    if (isNutrientDeficient) {
                        if (gapSeverity === 'Critical') finalPriority = 'Critical';
                        else if (gapSeverity === 'High' && finalPriority !== 'Critical') finalPriority = 'High';
                        else if (finalPriority === 'Low') finalPriority = 'Medium';
                    }

                    deduplicatedList.push({
                        food: item.food,
                        nutrients: item.nutrients,
                        category: item.category,
                        priority: finalPriority,
                        usedInMeals: uniqueSlots,
                        rationale: item.rationale,
                        score: 0
                    });
                }
            });
        });

        // 2. Process foods from Phase 1 intelligence recommendations
        if (Array.isArray(rawRecommendations)) {
            rawRecommendations.forEach(rec => {
                const cleanFood = rec.food.trim();
                const key = cleanFood.toLowerCase();

                if (isPeanutAllergic && key.includes('peanut')) return;
                
                if (!seenFoods.has(key)) {
                    seenFoods.add(key);
                    
                    const nutrients = rec.nutrients || [];
                    const category = ShoppingCategoryService.classify(cleanFood);
                    const priority = ShoppingPriorityEngine.getPriority(nutrients, gaps);
                    const mealSlots = mealIngredientsMap[key] || [];

                    deduplicatedList.push({
                        food: cleanFood,
                        nutrients,
                        category,
                        priority,
                        usedInMeals: mealSlots,
                        rationale: rec.explanations?.[0] || `Supports daily pediatric target intake for ${nutrients.join(', ')}.`,
                        score: 0
                    });
                }
            });
        }

        // 3. Process active meal planner ingredients
        Object.keys(mealIngredientsMap).forEach(ing => {
            if (isPeanutAllergic && ing.includes('peanut')) return;

            if (!seenFoods.has(ing)) {
                const targetedNutrients = [];
                if (["spinach", "palak", "beetroot", "moringa", "ragi"].some(k => ing.includes(k))) targetedNutrients.push("iron");
                if (["milk", "curd", "dahi", "paneer", "yogurt", "ragi", "makhana", "sesame", "til"].some(k => ing.includes(k))) targetedNutrients.push("calcium");
                if (["dal", "chana", "paneer", "sprouts", "egg", "chicken", "soya"].some(k => ing.includes(k))) targetedNutrients.push("protein");
                if (["roti", "ragi", "bajra", "chilla", "makhana", "khichdi", "oats", "papaya", "guava"].some(k => ing.includes(k))) targetedNutrients.push("fiber");
                if (["lemon", "orange", "amla", "capsicum"].some(k => ing.includes(k))) targetedNutrients.push("vitaminC");
                if (["water", "buttermilk", "chaas", "coconut water"].some(k => ing.includes(k))) targetedNutrients.push("water");

                const activeGaps = targetedNutrients.filter(n => gaps[n] && gaps[n].severity !== "Normal");
                const assignedNutrients = activeGaps.length > 0 ? activeGaps : (targetedNutrients.length > 0 ? targetedNutrients : ["Micronutrients"]);

                seenFoods.add(ing);
                const cleanName = ing.charAt(0).toUpperCase() + ing.slice(1);
                const category = ShoppingCategoryService.classify(ing);
                const priority = ShoppingPriorityEngine.getPriority(assignedNutrients, gaps);

                deduplicatedList.push({
                    food: cleanName,
                    nutrients: assignedNutrients,
                    category,
                    priority,
                    usedInMeals: mealIngredientsMap[ing],
                    rationale: `Required ingredient for daily meal plan slots replenishing ${assignedNutrients.join(', ')}.`,
                    score: 0
                });
            }
        });

        // 4. Score and rank items
        deduplicatedList.forEach(item => {
            const isUsed = item.usedInMeals.length > 0;
            item.score = FoodRankingEngine.scoreFood(item, context, isUsed);
        });

        // Sort descending by score
        deduplicatedList.sort((a, b) => b.score - a.score);

        // 5. Generate dynamic shopping insights
        const insights = [];
        
        // Multi-nutrient insights
        const multiNutrientFoods = deduplicatedList.filter(item => item.nutrients.length >= 2);
        if (multiNutrientFoods.length > 0) {
            const topMulti = multiNutrientFoods[0];
            insights.push(`Buying ${topMulti.food} this week addresses ${topMulti.nutrients.length} deficiencies (${topMulti.nutrients.join(', ')}).`);
        }

        // Synergistic pairs
        const hasSpinachOrRagi = seenFoods.has("spinach") || seenFoods.has("palak") || seenFoods.has("ragi") || Array.from(seenFoods).some(f => f.includes('ragi') || f.includes('spinach'));
        const hasLemonOrOrange = seenFoods.has("lemon") || Array.from(seenFoods).some(f => f.includes('lemon') || f.includes('orange') || f.includes('amla'));
        if (hasSpinachOrRagi && hasLemonOrOrange) {
            insights.push("Pairing Sprouted Ragi / Greens with Fresh Lemon or Oranges triples non-heme Iron absorption.");
        }

        // Calcium booster insight
        const hasDairyOrRagi = Array.from(seenFoods).some(f => f.includes('milk') || f.includes('curd') || f.includes('paneer') || f.includes('ragi') || f.includes('makhana'));
        if (hasDairyOrRagi) {
            insights.push("Paneer, Curd, and Ragi supply dense bioavailable Calcium (+350mg/day) to support linear height velocity.");
        }

        // Hydration insight
        const hydrationGap = gaps["water"];
        if (hydrationGap && hydrationGap.severity !== "Normal") {
            insights.push("Target daily hydration of 1,750 ml using tender coconut water and fresh chaas (buttermilk).");
        }

        // 6. Tally summary metrics
        const totalItems = deduplicatedList.length;
        const criticalCount = deduplicatedList.filter(i => i.priority === "Critical").length;
        const highCount = deduplicatedList.filter(i => i.priority === "High").length;
        const multiCount = multiNutrientFoods.length;

        // Estimated weekly impact calculation
        let ironCovered = false;
        let calciumCovered = false;
        let proteinCovered = false;

        deduplicatedList.forEach(item => {
            if (item.nutrients.includes("iron")) ironCovered = true;
            if (item.nutrients.includes("calcium")) calciumCovered = true;
            if (item.nutrients.includes("protein")) proteinCovered = true;
        });

        const weeklyImpacts = [];
        if (ironCovered) weeklyImpacts.push("Improves bioavailable Iron intake by up to 45%");
        if (calciumCovered) weeklyImpacts.push("Supplies 90%+ of skeletal Calcium RDA for linear growth");
        if (proteinCovered) weeklyImpacts.push("Assures complete essential amino acid profile for muscle repair");
        if (weeklyImpacts.length === 0) weeklyImpacts.push("Secures pediatric micronutrient balance and digestion");

        return {
            groceries: deduplicatedList,
            insights,
            summary: {
                totalItems,
                criticalItems: criticalCount,
                highPriorityItems: highCount,
                multiNutrientItems: multiCount,
                weeklyImpacts
            }
        };
    }
}

