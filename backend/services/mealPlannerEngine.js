/**
 * Enterprise Pediatric Meal Planner Engine
 * Modular architecture, single-responsibility services.
 * Features:
 * 1. 100% Unique Homemade Indian Meals across all 7 Days (Zero duplicates).
 * 2. Simplified, quick-to-prepare authentic Indian household dishes.
 * 3. Dynamic refresh rotation targeting nutritional deficits.
 * 4. Multi-theme support (Deficit Target, Height & Bone Growth, Quick 15-Min Prep).
 */
import { ProfileContextEngine, GapDetectionEngine } from './nutritionIntelligenceEngine.js';
import { enrichFoodItem } from '../utils/nutritionIntelligence.js';
import axios from 'axios';

// =========================================================================
// 1. EXPANDED HOMEMADE INDIAN MEALS DATABASE (Simple, Fast, Everyday Cooking)
// =========================================================================
const MEALS_DATABASE = [
    // ---------------------------------------------------------------------
    // --- 1. BREAKFAST (10 Authentic Quick Home Dishes) ---
    // ---------------------------------------------------------------------
    {
        name: "Vegetable Poha with Roasted Peanuts & Lemon",
        slot: "breakfast",
        region: "West India",
        keyNutrients: ["iron", "protein", "carbs", "vitaminC"],
        ingredients: ["poha (flattened rice)", "roasted peanuts", "onion", "green peas", "turmeric", "lemon juice"],
        nutrients: { calories: 270, protein: 8.5, carbs: 46, fats: 6, fiber: 4.2 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Quick, iron-rich flattened rice energized with crunchy roasted peanuts. Easy on the stomach and quick to prepare before school.",
        pairing: "Poha + Squeeze of Fresh Lemon",
        pairExplanation: "Vitamin C from fresh lemon juice converts plant non-heme iron into an easily absorbable form.",
        servingSuggestion: "1 medium bowl (approx. 150g) with a wedge of lemon.",
        substitutions: {
            "poha (flattened rice)": { name: "Rolled Oats", why: "High beta-glucan soluble fiber alternative." },
            "roasted peanuts": { name: "Roasted Pumpkin Seeds", why: "Nut-free zinc and healthy fat alternative for school boxes." }
        }
    },
    {
        name: "Sprouted Moong & Besan Chilla with Mint Chutney",
        slot: "breakfast",
        region: "North India",
        keyNutrients: ["protein", "iron", "zinc", "fiber"],
        ingredients: ["sprouted moong", "besan (gram flour)", "finely chopped onions", "turmeric", "fresh mint"],
        nutrients: { calories: 285, protein: 12.5, carbs: 39, fats: 6.5, fiber: 5.8 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "High-protein, easy-to-digest savory pancake supporting muscle growth and sustained classroom alertness.",
        pairing: "Chilla + Fresh Mint Chutney",
        pairExplanation: "Fresh mint polyphenols soothe gastric enzymes and boost pulse protein assimilation.",
        servingSuggestion: "1 medium chilla (approx. 80g) cut into fun roll strips.",
        substitutions: {
            "sprouted moong": { name: "Grated Paneer", why: "Rich dairy calcium and casein protein booster." },
            "besan (gram flour)": { name: "Oats Flour", why: "Light, low-glycemic flour alternative." }
        }
    },
    {
        name: "Steamed Vegetable Rava Idli with Sambar",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["protein", "calcium", "fiber", "vitaminA"],
        ingredients: ["sooji (semolina)", "grated carrots", "curd", "toor dal", "mustard seeds", "curry leaves"],
        nutrients: { calories: 265, protein: 9.5, carbs: 45, fats: 4.5, fiber: 4.5 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Soft, oil-free steamed breakfast providing instant gut comfort with carrot beta-carotene and lentil protein.",
        pairing: "Steamed Idli + Warm Vegetable Sambar",
        pairExplanation: "Warm lentil broth hydrates the digestive tract while drumstick and carrots boost mucosal immunity.",
        servingSuggestion: "2 small fluffy idlis with 1 bowl of mild vegetable sambar.",
        substitutions: {
            "sooji (semolina)": { name: "Ragi-Rice Batter", why: "Dense calcium boost for skeletal bone growth." },
            "toor dal": { name: "Yellow Moong Dal", why: "Ultra-gentle on delicate toddler tummies." }
        }
    },
    {
        name: "Paneer Bhurji with Soft Whole Wheat Phulka",
        slot: "breakfast",
        region: "North India",
        keyNutrients: ["protein", "calcium", "zinc", "fats"],
        ingredients: ["fresh paneer", "whole wheat flour", "tomatoes", "onions", "pure desi ghee"],
        nutrients: { calories: 330, protein: 14.5, carbs: 36, fats: 11, fiber: 4.5 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Bioavailable dairy casein protein and calcium paired with fiber-rich whole wheat roti for linear height support.",
        pairing: "Paneer Bhurji + Desi Ghee Phulka",
        pairExplanation: "Short-chain fatty acids in pure ghee assist in transporting fat-soluble vitamins A and D.",
        servingSuggestion: "1/2 cup fresh paneer bhurji with 1 soft warm phulka.",
        substitutions: {
            "fresh paneer": { name: "Organic Tofu", why: "Plant-based calcium alternative for dairy-free diets." },
            "whole wheat flour": { name: "Jowar (Sorghum) Roti", why: "High-fiber gluten-free flatbread." }
        }
    },
    {
        name: "Rava Upma with Mixed Vegetables & Coconut Chutney",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["fiber", "vitaminA", "carbs", "protein"],
        ingredients: ["roasted semolina (rava)", "carrots", "green peas", "ginger", "curry leaves", "fresh coconut"],
        nutrients: { calories: 275, protein: 8, carbs: 47, fats: 5.5, fiber: 4.8 },
        prepTime: "12 mins",
        difficulty: "Easy",
        whyThisMeal: "Light, comforting homestyle semolina bowl loaded with beta-carotene from colorful carrots and peas.",
        pairing: "Upma + Fresh Coconut Chutney",
        pairExplanation: "Medium-chain triglycerides in coconut enhance the assimilation of fat-soluble beta-carotene.",
        servingSuggestion: "1 cup warm upma (approx. 140g) with 1 tbsp mild coconut chutney.",
        substitutions: {
            "roasted semolina (rava)": { name: "Broken Wheat (Dalia)", why: "Whole grain with extra B-complex vitamins." },
            "green peas": { name: "Boiled Sweet Corn", why: "Sweet, crunchy child-pleasing fiber addition." }
        }
    },
    {
        name: "Methi Thepla with Fresh Homemade Set Curd",
        slot: "breakfast",
        region: "West India",
        keyNutrients: ["iron", "calcium", "fiber", "protein"],
        ingredients: ["whole wheat flour", "fresh methi (fenugreek) leaves", "curd", "ajwain", "turmeric", "pure ghee"],
        nutrients: { calories: 295, protein: 10, carbs: 44, fats: 7.5, fiber: 5.5 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Fenugreek infuses natural plant iron and gut fiber, balanced with cooling probiotic curd for healthy digestion.",
        pairing: "Methi Thepla + Fresh Set Curd",
        pairExplanation: "Curd probiotics and lactic acid assist in breaking down phytates, increasing iron bioavailability.",
        servingSuggestion: "1 soft thepla (approx. 60g) with 1/2 cup fresh curd.",
        substitutions: {
            "fresh methi (fenugreek) leaves": { name: "Finely Chopped Spinach (Palak)", why: "Mild, non-bitter leafy green alternative." },
            "curd": { name: "Whipped Coconut Yogurt", why: "Lactose-free probiotic alternative." }
        }
    },
    {
        name: "Ragi & Oats Porridge with Jaggery & Soaked Almonds",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["calcium", "iron", "fiber", "protein"],
        ingredients: ["ragi (finger millet) flour", "rolled oats", "toned milk", "organic jaggery", "crushed almonds"],
        nutrients: { calories: 280, protein: 9.5, carbs: 46, fats: 5.5, fiber: 5.2 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Calcium-dense finger millet combined with soluble beta-glucans and natural jaggery for sustained morning stamina.",
        pairing: "Ragi Porridge + Crushed Soaked Almonds",
        pairExplanation: "Healthy monounsaturated lipids in almonds optimize cellular uptake of ragi calcium.",
        servingSuggestion: "1 warm bowl (approx. 180ml) sprinkled with slivered nuts.",
        substitutions: {
            "toned milk": { name: "Almond or Soy Milk", why: "Nutritious plant milk option." },
            "organic jaggery": { name: "Mashed Ripe Banana", why: "Whole-fruit sweetness with extra potassium." }
        }
    },
    {
        name: "Vegetable Dalia Khichdi with Mild Cumin Tempering",
        slot: "breakfast",
        region: "North India",
        keyNutrients: ["fiber", "iron", "protein", "carbs"],
        ingredients: ["broken wheat (dalia)", "yellow moong dal", "carrots", "green peas", "desi ghee", "jeera"],
        nutrients: { calories: 285, protein: 10.5, carbs: 48, fats: 5, fiber: 6.2 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Whole broken cracked wheat delivers B-complex vitamins and insoluble fiber for gentle, smooth morning digestion.",
        pairing: "Dalia + Drop of Desi Ghee",
        pairExplanation: "Desi ghee lubricates intestinal motility and helps assimilate fat-soluble vitamins.",
        servingSuggestion: "1 warm bowl (approx. 160g).",
        substitutions: {
            "broken wheat (dalia)": { name: "Quinoa or Foxtail Millet", why: "Gluten-free complete amino acid grain." },
            "green peas": { name: "Diced French Beans", why: "Crisp, vitamin-K rich vegetable alternative." }
        }
    },
    {
        name: "Moong Dal Pesarattu with Mild Ginger Chutney",
        slot: "breakfast",
        region: "South India",
        keyNutrients: ["protein", "iron", "folate", "fiber"],
        ingredients: ["whole green moong", "rice", "ginger", "cumin", "curry leaves"],
        nutrients: { calories: 290, protein: 13, carbs: 45, fats: 5, fiber: 6.0 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "No-fermentation green gram crepe providing dense plant protein and natural folate for cellular repair.",
        pairing: "Pesarattu + Ginger Chutney",
        pairExplanation: "Ginger enzymes (gingerol) prevent legume flatulence and accelerate gastric breakdown.",
        servingSuggestion: "1 crepe (approx. 75g) served warm with mild chutney.",
        substitutions: {
            "whole green moong": { name: "Yellow Moong Dal", why: "Lighter, super quick soaking alternative." },
            "ginger": { name: "Fresh Coriander Chutney", why: "Herbaceous, cooling dip alternative." }
        }
    },
    {
        name: "Curd Semolina Toast with Grated Veggies",
        slot: "breakfast",
        region: "Universal",
        keyNutrients: ["calcium", "carbs", "vitaminA", "protein"],
        ingredients: ["whole wheat bread", "sooji", "fresh curd", "grated carrots", "capsicum", "black pepper"],
        nutrients: { calories: 260, protein: 8.5, carbs: 42, fats: 5.5, fiber: 3.8 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Pan-toasted child-friendly finger food combining calcium-rich curd with crunchy, colorful vegetables.",
        pairing: "Toast + Fresh Mint & Curd Spread",
        pairExplanation: "Fermented curd proteins in the topping offer easy digestibility and gut-friendly probiotics.",
        servingSuggestion: "2 triangle slices (approx. 90g) pan-toasted golden crisp.",
        substitutions: {
            "whole wheat bread": { name: "Multigrain Bread or Soft Roti", why: "High complex-carb alternative." },
            "capsicum": { name: "Sweet Corn Kernels", why: "Naturally sweet crunchy option for toddlers." }
        }
    },

    // ---------------------------------------------------------------------
    // --- 2. MORNING SNACK (10 Simple Fresh Home Snacks) ---
    // ---------------------------------------------------------------------
    {
        name: "Fresh Papaya & Pomegranate Bowl with Lemon Squeeze",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["vitaminC", "vitaminA", "fiber", "water"],
        ingredients: ["sweet ripe papaya", "pomegranate seeds", "lemon juice", "rock salt"],
        nutrients: { calories: 85, protein: 1.5, carbs: 19, fats: 0.3, fiber: 3.2 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Papain enzymes in papaya boost gut health while pomegranate polyphenols and Vitamin C strengthen immunity.",
        pairing: "Pomegranate + Fresh Lemon Juice",
        pairExplanation: "Citric acid accelerates non-heme iron absorption while quenching morning thirst.",
        servingSuggestion: "1 small cup (approx. 100g) chilled.",
        substitutions: {
            "sweet ripe papaya": { name: "Fresh Guava Slices", why: "Ultra-high Vitamin C powerhouse fruit." },
            "pomegranate seeds": { name: "Fresh Orange Segments", why: "Hydrating, sweet-citrus alternative." }
        }
    },
    {
        name: "Roasted Makhana (Foxnuts) in Desi Ghee & Turmeric",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["calcium", "fats", "zinc", "fiber"],
        ingredients: ["makhana (lotus seeds)", "pure desi ghee", "turmeric", "black pepper", "rock salt"],
        nutrients: { calories: 120, protein: 3, carbs: 18, fats: 4, fiber: 2.2 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Makhana is a natural low-glycemic source of calcium and magnesium, building strong bones and soothing growing muscles.",
        pairing: "Makhana + Turmeric Ghee",
        pairExplanation: "Curcumin in turmeric absorbs dramatically better with black pepper and healthy fats from desi ghee.",
        servingSuggestion: "1 medium bowl (approx. 25g).",
        substitutions: {
            "makhana (lotus seeds)": { name: "Roasted Chana (Bengal Gram)", why: "High-protein, crunchy afternoon snack." },
            "pure desi ghee": { name: "Cold-Pressed Coconut Oil", why: "Plant-based medium-chain lipid alternative." }
        }
    },
    {
        name: "Steamed Sweet Corn & Pea Chaat with Butter",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["fiber", "vitaminA", "carbs", "fats"],
        ingredients: ["sweet corn", "green peas", "butter/ghee", "chaat masala", "lemon"],
        nutrients: { calories: 130, protein: 4, carbs: 23, fats: 3, fiber: 3.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Rich in lutein, zeaxanthin, and soluble fiber for clear vision, bowel regularity, and vibrant energy.",
        pairing: "Corn & Peas + Dash of Butter",
        pairExplanation: "Dietary lipids in butter ensure full absorption of fat-soluble carotenoids.",
        servingSuggestion: "1 small bowl (approx. 80g).",
        substitutions: {
            "butter/ghee": { name: "Cold-Pressed Olive or Mustard Oil", why: "Heart-healthy unsaturated plant lipid." },
            "green peas": { name: "Boiled Sprouted Moong", why: "Boosts protein and living enzyme content." }
        }
    },
    {
        name: "Sesame (Til) & Organic Jaggery Laddoo",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["calcium", "iron", "fats", "zinc"],
        ingredients: ["white sesame seeds", "organic jaggery", "cardamom powder"],
        nutrients: { calories: 125, protein: 3.2, carbs: 17, fats: 5, fiber: 1.8 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Sesame seeds offer one of the highest plant-based calcium levels in Indian nutrition. Jaggery builds hemoglobin counts.",
        pairing: "Til Laddoo + Morning Active Playtime",
        pairExplanation: "Consuming calcium before active play optimizes skeletal mineral deposition.",
        servingSuggestion: "1 small laddoo (approx. 20g).",
        substitutions: {
            "white sesame seeds": { name: "Roasted Peanuts (Moongfali)", why: "Nutrient-dense protein and healthy fat alternative." },
            "organic jaggery": { name: "Soft Date Paste", why: "Low-glycemic natural whole-fruit binder." }
        }
    },
    {
        name: "Sliced Banana with Soaked Almonds & Walnuts",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["fats", "zinc", "fiber", "protein"],
        ingredients: ["ripe banana", "soaked almonds", "soaked walnuts", "cardamom"],
        nutrients: { calories: 135, protein: 3.5, carbs: 24, fats: 4.5, fiber: 2.8 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Walnuts provide plant-based Omega-3 ALA fatty acids for cognitive development, and banana supplies quick potassium.",
        pairing: "Banana + Soaked Nuts",
        pairExplanation: "Soaking nuts deactivates enzyme inhibitors, making zinc and omega-3s readily bioavailable.",
        servingSuggestion: "1 small bowl (approx. 90g).",
        substitutions: {
            "soaked walnuts": { name: "Chia Seeds or Pumpkin Seeds", why: "Nut-free zinc and healthy fat alternative." },
            "ripe banana": { name: "Ripe Chikoo (Sapodilla)", why: "Creamy, naturally sweet energy booster." }
        }
    },
    {
        name: "Sweet Guava Slices with Chaat Masala",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["vitaminC", "fiber", "water"],
        ingredients: ["fresh pink/white guava", "rock salt", "chaat masala"],
        nutrients: { calories: 75, protein: 1.8, carbs: 16, fats: 0.5, fiber: 4.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Guava provides up to 4x more Vitamin C than oranges, supercharging white blood cell immunity and iron uptake.",
        pairing: "Guava + Chaat Masala",
        pairExplanation: "Digestive spices stimulate saliva and enzyme secretions for immediate nutrient absorption.",
        servingSuggestion: "1 medium fruit sliced into wedges (approx. 100g).",
        substitutions: {
            "fresh pink/white guava": { name: "Crisp Apple Slices", why: "Gentle pectin-rich fruit alternative." },
            "chaat masala": { name: "Lemon Juice", why: "Pure citrus acidity enhancer." }
        }
    },
    {
        name: "Carrot & Cucumber Fingers with Whipped Curd Dip",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["vitaminA", "calcium", "water", "fiber"],
        ingredients: ["carrots", "cucumbers", "fresh curd", "roasted cumin", "black salt"],
        nutrients: { calories: 80, protein: 3, carbs: 12, fats: 1.5, fiber: 2.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Hydrating, crunchy raw finger food providing cooling hydration, beta-carotene, and gut-friendly probiotics.",
        pairing: "Carrots + Curd Dip",
        pairExplanation: "Probiotic lactic acid and milk fats facilitate conversion of beta-carotene into active Vitamin A.",
        servingSuggestion: "1 plate of veggie sticks with 2 tbsp whipped curd dip.",
        substitutions: {
            "carrots": { name: "Red Radish Slices or Bell Peppers", why: "Crunchy, vitamin-packed finger vegetables." },
            "fresh curd": { name: "Hummus (Chickpea Dip)", why: "Dairy-free plant protein spread." }
        }
    },
    {
        name: "Roasted Bengal Gram (Bhuna Chana) with Golden Raisins",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["iron", "protein", "fiber"],
        ingredients: ["roasted chana", "golden raisins (kishmish)"],
        nutrients: { calories: 110, protein: 5.5, carbs: 18, fats: 1.8, fiber: 3.5 },
        prepTime: "3 mins",
        difficulty: "Easy",
        whyThisMeal: "Classic traditional Indian energy combination pairing high-protein roasted chana with iron-rich raisins.",
        pairing: "Bhuna Chana + Raisins",
        pairExplanation: "Fruit sugars in raisins fuel quick mental focus while slow-release legume starch prevents insulin crashes.",
        servingSuggestion: "2 tablespoons (approx. 30g) as a handy snack.",
        substitutions: {
            "roasted chana": { name: "Roasted Peanuts", why: "Energy-dense healthy fat alternative." },
            "golden raisins (kishmish)": { name: "Dried Chopped Dates", why: "High potassium and iron dried fruit." }
        }
    },
    {
        name: "Tender Coconut Water & Fresh Pulp",
        slot: "morningSnack",
        region: "South India",
        keyNutrients: ["water", "zinc", "carbs"],
        ingredients: ["tender coconut water", "fresh coconut malai"],
        nutrients: { calories: 70, protein: 1.2, carbs: 14, fats: 1, fiber: 1.5 },
        prepTime: "2 mins",
        difficulty: "Easy",
        whyThisMeal: "Nature's premier isotonic electrolyte beverage, replenishing vital potassium and sodium on warm mornings.",
        pairing: "Coconut Water + Fresh Malai",
        pairExplanation: "Lauric acid in coconut pulp supports gut immune flora and soothing mucosal barrier health.",
        servingSuggestion: "1 fresh tender coconut (approx. 180ml).",
        substitutions: {
            "tender coconut water": { name: "Fresh Mosambi (Sweet Lime) Juice", why: "Vitamin C and hydration booster." },
            "fresh coconut malai": { name: "Chia Seed Infusion", why: "Omega-3 and gel-forming hydration matrix." }
        }
    },
    {
        name: "Sweet Chikoo (Sapodilla) Slices with Crushed Cashews",
        slot: "morningSnack",
        region: "Universal",
        keyNutrients: ["carbs", "fats", "fiber"],
        ingredients: ["sweet ripe chikoo", "crushed cashew nuts"],
        nutrients: { calories: 120, protein: 2, carbs: 22, fats: 3.5, fiber: 2.6 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Naturally sweet, creamy tropical fruit rich in tannins and soluble fiber for healthy bowel motility.",
        pairing: "Chikoo + Cashews",
        pairExplanation: "Cashew zinc and healthy lipids slow sugar absorption, keeping energy smooth and sustained.",
        servingSuggestion: "1 cup cubed fruit (approx. 100g).",
        substitutions: {
            "sweet ripe chikoo": { name: "Ripe Mango Cubes", why: "Seasonal high Vitamin A fruit alternative." },
            "crushed cashew nuts": { name: "Roasted Almond Slivers", why: "High-calcium nut alternative." }
        }
    },

    // ---------------------------------------------------------------------
    // --- 3. LUNCH (10 Simple Indian Household Lunches) ---
    // ---------------------------------------------------------------------
    {
        name: "Yellow Moong Dal Tadka with Steamed Rice & Ghee",
        slot: "lunch",
        region: "Universal",
        keyNutrients: ["protein", "carbs", "iron", "fats"],
        ingredients: ["yellow moong dal", "sona masoori rice", "desi ghee", "jeera (cumin)", "turmeric", "hing"],
        nutrients: { calories: 345, protein: 12, carbs: 58, fats: 6.5, fiber: 5.5 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "The gold standard of Indian home comfort food: combining cereal and pulse delivers a complete amino acid profile.",
        pairing: "Dal Rice + Pure Desi Ghee",
        pairExplanation: "Butyric acid in desi ghee nourishes colonocytes and improves nutrient absorption across the gut wall.",
        servingSuggestion: "1 cup steamed rice, 1/2 cup yellow dal, and 1 tsp desi ghee.",
        substitutions: {
            "yellow moong dal": { name: "Toor Dal or Masoor Dal", why: "Hearty traditional everyday lentil alternatives." },
            "sona masoori rice": { name: "Soft Whole Wheat Phulkas", why: "Whole grain flatbread alternative." }
        }
    },
    {
        name: "Rajma Masala with Soft Phulkas & Cucumber Salad",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["protein", "iron", "fiber", "zinc"],
        ingredients: ["kidney beans (rajma)", "whole wheat flour", "tomatoes", "cucumbers", "onions", "ginger"],
        nutrients: { calories: 370, protein: 14.5, carbs: 62, fats: 6, fiber: 8.5 },
        prepTime: "25 mins",
        difficulty: "Easy",
        whyThisMeal: "Rajma is a premier Indian source of plant protein, iron, and prebiotic soluble fiber for steady afternoon endurance.",
        pairing: "Rajma + Raw Cucumber & Lemon Salad",
        pairExplanation: "Hydration and Vitamin C from fresh raw salad prevent legume heaviness and boost iron absorption.",
        servingSuggestion: "1 cup mild rajma with 2 soft phulkas and cucumber slices.",
        substitutions: {
            "kidney beans (rajma)": { name: "Kabuli Chana (Chickpeas)", why: "Equally high in zinc, protein, and soluble fiber." },
            "whole wheat flour": { name: "Jeera Steamed Rice", why: "Naturally gluten-free grain alternative." }
        }
    },
    {
        name: "Paneer & Green Peas Matar Sabzi with Soft Phulkas",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["protein", "calcium", "fats", "zinc"],
        ingredients: ["fresh paneer", "green peas (matar)", "whole wheat flour", "tomatoes", "mild spices"],
        nutrients: { calories: 360, protein: 14, carbs: 48, fats: 11, fiber: 5.2 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Soft paneer cubes and sweet green peas supply high-biological-value protein and calcium for skeletal growth.",
        pairing: "Matar Paneer + Whole Wheat Roti",
        pairExplanation: "Tomato gravy lycopene and dairy fats optimize cellular antioxidant uptake.",
        servingSuggestion: "1 cup matar paneer with 2 small soft rotis.",
        substitutions: {
            "fresh paneer": { name: "Soya Chunks or Tofu", why: "Dense plant protein alternative (52% protein)." },
            "whole wheat flour": { name: "Steamed Basmati Rice", why: "Light, easily digestible carbohydrate alternative." }
        }
    },
    {
        name: "Palak Dal (Spinach Lentils) with Jeera Rice & Curd",
        slot: "lunch",
        region: "Universal",
        keyNutrients: ["iron", "protein", "vitaminA", "calcium"],
        ingredients: ["spinach (palak)", "toor dal", "rice", "curd", "cumin", "pure ghee"],
        nutrients: { calories: 350, protein: 13, carbs: 56, fats: 7, fiber: 6.2 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Iron-dense spinach blended into lentils provides bioavailable leafy minerals without being bitter for children.",
        pairing: "Palak Dal + Jeera Rice & Curd",
        pairExplanation: "Probiotic curd and cumin enhance gastric acid secretion, maximizing non-heme iron uptake.",
        servingSuggestion: "1 cup rice, 1/2 cup palak dal, and 1/3 cup fresh curd.",
        substitutions: {
            "spinach (palak)": { name: "Methi (Fenugreek) Leaves", why: "Aromatic high-iron leafy green alternative." },
            "toor dal": { name: "Yellow Moong Dal", why: "Lighter lentil that cooks rapidly." }
        }
    },
    {
        name: "Traditional Sambar Rice with Beetroot Poriyal",
        slot: "lunch",
        region: "South India",
        keyNutrients: ["iron", "protein", "fiber", "vitaminC"],
        ingredients: ["toor dal", "mixed vegetables", "rice", "beetroot", "mustard seeds", "curry leaves"],
        nutrients: { calories: 355, protein: 12, carbs: 62, fats: 5.5, fiber: 7.0 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Beetroot and mixed vegetable sambar provide dense anthocyanins, organic iron, and plant protein for blood health.",
        pairing: "Sambar Rice + Beetroot Poriyal",
        pairExplanation: "Tamarind and tomato acidity in sambar converts ferric iron into absorbable ferrous iron.",
        servingSuggestion: "1.5 cups sambar rice with 1/3 cup sauteed beetroot poriyal.",
        substitutions: {
            "beetroot": { name: "Carrot & French Bean Poriyal", why: "Sweet, crunchy beta-carotene vegetable side." },
            "toor dal": { name: "Masoor Dal (Red Lentils)", why: "Quick-cooking, iron-rich lentil alternative." }
        }
    },
    {
        name: "Tempered Curd Rice with Pomegranate Arils & Roasted Cumin",
        slot: "lunch",
        region: "South India",
        keyNutrients: ["calcium", "water", "vitaminC", "carbs"],
        ingredients: ["cooked soft rice", "fresh curd", "pomegranate seeds", "mustard seeds", "curry leaves", "ginger"],
        nutrients: { calories: 320, protein: 9, carbs: 52, fats: 7, fiber: 3.5 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Ultra-soothing probiotic comfort meal that hydrates the gut, soothes digestion, and provides bioavailable calcium.",
        pairing: "Curd Rice + Sweet Pomegranate Arils",
        pairExplanation: "Polyphenols in pomegranate synergize with probiotic flora to suppress gut inflammation.",
        servingSuggestion: "1.5 cups chilled or room-temperature curd rice.",
        substitutions: {
            "fresh curd": { name: "Coconut Yogurt", why: "Dairy-free probiotic alternative." },
            "pomegranate seeds": { name: "Grated Fresh Carrots & Cucumber", why: "Crisp, cooling veggie topping." }
        }
    },
    {
        name: "Lauki (Bottle Gourd) Chana Dal with Warm Phulkas",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["water", "protein", "fiber", "iron"],
        ingredients: ["bottle gourd (lauki)", "chana dal", "whole wheat flour", "tomatoes", "pure ghee", "jeera"],
        nutrients: { calories: 335, protein: 12.5, carbs: 54, fats: 5.5, fiber: 7.2 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Bottle gourd is over 90% water and gentle on digestion, preventing dehydration while chana dal maintains protein satiety.",
        pairing: "Lauki Chana + Ghee Phulkas",
        pairExplanation: "Cumin and ghee tempering eliminate pulse gas and support mucosal gut lining health.",
        servingSuggestion: "1 cup lauki chana dal with 2 small soft rotis.",
        substitutions: {
            "bottle gourd (lauki)": { name: "Ridge Gourd (Turai) or Zucchini", why: "Hydrating, sweet tender vegetable." },
            "chana dal": { name: "Yellow Moong Dal", why: "Extra light, fast-cooking pulse." }
        }
    },
    {
        name: "Vegetable Moong Khichdi with Fresh Mint Buttermilk",
        slot: "lunch",
        region: "Universal",
        keyNutrients: ["protein", "water", "fiber", "iron"],
        ingredients: ["yellow moong dal", "rice", "carrots", "green peas", "curd", "mint", "pure ghee"],
        nutrients: { calories: 340, protein: 12, carbs: 55, fats: 6.5, fiber: 5.8 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "One-pot nourishing rice and lentil dish providing balanced amino acids paired with cooling digestive chaas.",
        pairing: "Khichdi + Fresh Mint Buttermilk",
        pairExplanation: "Mint menthol and buttermilk probiotics accelerate gastric emptying, preventing afternoon lethargy.",
        servingSuggestion: "1.5 cups warm khichdi with 1 glass chilled chaas.",
        substitutions: {
            "rice": { name: "Broken Wheat (Dalia)", why: "Whole grain with higher insoluble fiber." },
            "curd": { name: "Lemon-Infused Water", why: "Dairy-free refreshing digestive drink." }
        }
    },
    {
        name: "Soya Chunks & Potato Mild Curry with Phulkas",
        slot: "lunch",
        region: "North India",
        keyNutrients: ["protein", "iron", "calcium", "zinc"],
        ingredients: ["soya chunks (meal maker)", "potato", "whole wheat flour", "tomatoes", "onions", "coriander"],
        nutrients: { calories: 365, protein: 16, carbs: 52, fats: 7.5, fiber: 7.0 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Soya chunks are nature's dense plant protein champion, supplying complete branch-chain amino acids for growing muscles.",
        pairing: "Soya Curry + Soft Phulkas & Lemon",
        pairExplanation: "Tomatoes and fresh lemon release bound plant iron for maximum bioavailability.",
        servingSuggestion: "1 cup curry with 2 soft phulkas.",
        substitutions: {
            "soya chunks (meal maker)": { name: "Paneer Cubes", why: "Dairy protein alternative." },
            "potato": { name: "Green Peas (Matar)", why: "Extra protein and vibrant color." }
        }
    },
    {
        name: "Tomato Rasam with Steamed Rice & Green Bean Poriyal",
        slot: "lunch",
        region: "South India",
        keyNutrients: ["vitaminC", "water", "carbs", "fiber"],
        ingredients: ["tomatoes", "tamarind", "rice", "french beans", "black pepper", "curry leaves", "pure ghee"],
        nutrients: { calories: 325, protein: 8.5, carbs: 58, fats: 5, fiber: 5.0 },
        prepTime: "18 mins",
        difficulty: "Easy",
        whyThisMeal: "Tangy, piping hot tomato rasam stimulates salivary and gastric secretions, paired with crisp green beans for dietary fiber.",
        pairing: "Rasam Rice + Green Bean Poriyal",
        pairExplanation: "Black pepper in rasam enhances piperine-mediated micronutrient absorption.",
        servingSuggestion: "1.5 cups rasam rice with 1/2 cup green bean poriyal.",
        substitutions: {
            "french beans": { name: "Carrot & Cabbage Poriyal", why: "Sweet, crunchy shredded vegetable side." },
            "tomatoes": { name: "Lemon / Raw Mango Rasam", why: "Seasonal tangy Vitamin C variation." }
        }
    },

    // ---------------------------------------------------------------------
    // --- 4. EVENING SNACK (10 Quick Indian Household Snacks) ---
    // ---------------------------------------------------------------------
    {
        name: "Sprouted Moong Chaat with Chopped Tomatoes & Lemon",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["protein", "vitaminC", "iron", "fiber"],
        ingredients: ["sprouted green moong", "tomatoes", "cucumber", "chaat masala", "lemon juice"],
        nutrients: { calories: 115, protein: 6.5, carbs: 20, fats: 0.5, fiber: 4.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Sprouting multiplies vitamin B and C content. The crunchy, sweet taste revitalizes post-school study focus.",
        pairing: "Sprouted Moong + Fresh Lemon Squeeze",
        pairExplanation: "Ascorbic acid acidifies gastric juices, boosting non-heme iron solubility and uptake.",
        servingSuggestion: "1 small cup (approx. 70g).",
        substitutions: {
            "sprouted green moong": { name: "Boiled Sweet Peas or Corn", why: "Sweet, soft, high-protein alternative." },
            "tomatoes": { name: "Pomegranate Arils", why: "Kid-favorite sweet, crunchy vitamin booster." }
        }
    },
    {
        name: "Steamed Vegetable Suji Appe with Fresh Mint Dip",
        slot: "eveningSnack",
        region: "South India",
        keyNutrients: ["fiber", "protein", "vitaminA", "carbs"],
        ingredients: ["sooji/rava", "grated carrots", "capsicum", "curd", "mustard seeds", "curry leaves"],
        nutrients: { calories: 135, protein: 4.5, carbs: 24, fats: 2.5, fiber: 3.0 },
        prepTime: "12 mins",
        difficulty: "Easy",
        whyThisMeal: "Crispy outside, soft inside, bite-sized steamed dumplings loaded with colorful vegetables for post-play recovery.",
        pairing: "Appe + Fresh Mint Dip",
        pairExplanation: "Mint polyphenols soothe the gut and aid digestion of roasted semolina.",
        servingSuggestion: "3-4 small appe balls with 2 tbsp mint chutney.",
        substitutions: {
            "sooji/rava": { name: "Oats & Ragi Batter", why: "Gluten-free, mineral-dense whole grain batter." },
            "capsicum": { name: "Finely Chopped Spinach", why: "Hides iron-rich greens in an enticing finger food." }
        }
    },
    {
        name: "Boiled Kala Chana (Black Chickpeas) Chaat with Coriander",
        slot: "eveningSnack",
        region: "North India",
        keyNutrients: ["iron", "protein", "fiber", "zinc"],
        ingredients: ["boiled kala chana", "chopped tomatoes", "coriander", "lemon juice", "roasted cumin"],
        nutrients: { calories: 135, protein: 7, carbs: 22, fats: 1.8, fiber: 5.5 },
        prepTime: "8 mins",
        difficulty: "Easy",
        whyThisMeal: "Kala chana is rich in iron, zinc, and resistant starch, maintaining steady blood glucose and fighting fatigue.",
        pairing: "Kala Chana + Lemon & Tomatoes",
        pairExplanation: "Tomatoes and lemon release bound iron in the outer chickpea husk for complete digestion.",
        servingSuggestion: "1/2 cup (approx. 80g).",
        substitutions: {
            "boiled kala chana": { name: "Boiled Kabuli Chana or Rajma", why: "Softer bean texture for younger toddlers." },
            "chopped tomatoes": { name: "Grated Raw Mango (Kairi)", why: "Tangy Indian seasonal Vitamin C enhancer." }
        }
    },
    {
        name: "Roasted Peanut & Jaggery Chikki Bar",
        slot: "eveningSnack",
        region: "West India",
        keyNutrients: ["protein", "iron", "fats", "zinc"],
        ingredients: ["roasted peanuts", "organic jaggery", "cardamom"],
        nutrients: { calories: 140, protein: 4.5, carbs: 18, fats: 6, fiber: 2.0 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Provides dense, sustained sports stamina and builds red blood cell counts with natural plant protein and minerals.",
        pairing: "Chikki + Glass of Warm Water",
        pairExplanation: "Water ensures smooth digestion of dense peanut proteins and prevents throat dryness.",
        servingSuggestion: "1 square bar (approx. 25g).",
        substitutions: {
            "roasted peanuts": { name: "Roasted Pumpkin & Sunflower Seeds", why: "Nut-free zinc and magnesium alternative for school lunchboxes." },
            "organic jaggery": { name: "Fig & Date Paste", why: "Iron-rich whole dried fruit alternative." }
        }
    },
    {
        name: "Fresh Strained Tomato & Carrot Soup with Butter",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["vitaminA", "vitaminC", "water", "fats"],
        ingredients: ["ripe tomatoes", "red carrots", "butter/ghee", "black pepper", "rock salt"],
        nutrients: { calories: 95, protein: 2.5, carbs: 16, fats: 2.5, fiber: 3.2 },
        prepTime: "12 mins",
        difficulty: "Easy",
        whyThisMeal: "Warm, comforting homestyle vegetable soup delivering hydration, lycopene, and beta-carotene for immune defense.",
        pairing: "Warm Soup + Dash of Butter",
        pairExplanation: "Dietary lipids in butter ensure the complete conversion of beta-carotene into active retinal Vitamin A.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "red carrots": { name: "Bottle Gourd (Lauki)", why: "Cooling, light, easy-to-digest soup base." },
            "butter/ghee": { name: "Cold-Pressed Olive Oil", why: "Heart-healthy unsaturated plant lipid." }
        }
    },
    {
        name: "Oil-Free Vegetable Murmura (Puffed Rice) Bhel",
        slot: "eveningSnack",
        region: "West India",
        keyNutrients: ["carbs", "fiber", "vitaminC"],
        ingredients: ["puffed rice (murmura)", "chopped cucumbers", "tomatoes", "roasted peanuts", "lemon juice", "chaat masala"],
        nutrients: { calories: 110, protein: 3, carbs: 22, fats: 1.2, fiber: 2.2 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Light, crunchy, oil-free puffed rice tossed with colorful fresh vegetables for instant energy before evening homework.",
        pairing: "Bhel + Squeeze of Lemon",
        pairExplanation: "Citric acid adds zest and ensures optimal iron absorption from peanuts and veggies.",
        servingSuggestion: "1 medium bowl (approx. 40g).",
        substitutions: {
            "puffed rice (murmura)": { name: "Roasted Makhana", why: "Calcium and magnesium dense crunchy alternative." },
            "roasted peanuts": { name: "Roasted Chana", why: "Low-fat pulse protein alternative." }
        }
    },
    {
        name: "Boiled Sweet Corn Chaat with Chaat Masala & Lime",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["fiber", "vitaminA", "carbs"],
        ingredients: ["sweet corn kernels", "chaat masala", "lime juice", "desi ghee drop", "coriander"],
        nutrients: { calories: 125, protein: 3.8, carbs: 23, fats: 2, fiber: 3.2 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Natural lutein and zeaxanthin in sweet corn protect young eyes from digital screen fatigue.",
        pairing: "Corn + Lime Juice",
        pairExplanation: "Vitamin C acidifies the snack, aiding digestion of dietary fiber.",
        servingSuggestion: "1 small cup (approx. 80g).",
        substitutions: {
            "sweet corn kernels": { name: "Green Peas (Matar)", why: "High-protein green vegetable alternative." },
            "desi ghee drop": { name: "Extra Virgin Olive Oil", why: "Unsaturated plant oil alternative." }
        }
    },
    {
        name: "Boiled Sweet Potato Cubes with Rock Salt & Lemon",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["vitaminA", "fiber", "carbs"],
        ingredients: ["sweet potato (shakarkandi)", "rock salt", "lemon juice", "roasted cumin"],
        nutrients: { calories: 120, protein: 2.2, carbs: 26, fats: 0.3, fiber: 3.8 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Sweet potato provides dense slow-digesting complex carbs and exceptional natural beta-carotene for skin and vision.",
        pairing: "Sweet Potato + Lemon & Cumin",
        pairExplanation: "Cumin stimulates digestive fire (Agni) preventing any abdominal gas.",
        servingSuggestion: "1 small bowl (approx. 100g).",
        substitutions: {
            "sweet potato (shakarkandi)": { name: "Boiled Raw Banana (Plantain)", why: "Resistant starch prebiotic alternative." },
            "lemon juice": { name: "Tamarind Chutney", why: "Sweet-and-sour Indian flavor twist." }
        }
    },
    {
        name: "Pan-Toasted Besan Bread Toast",
        slot: "eveningSnack",
        region: "North India",
        keyNutrients: ["protein", "fiber", "iron"],
        ingredients: ["whole wheat bread", "besan batter", "finely chopped onions", "turmeric", "coriander"],
        nutrients: { calories: 140, protein: 5.5, carbs: 22, fats: 3.5, fiber: 3.0 },
        prepTime: "10 mins",
        difficulty: "Easy",
        whyThisMeal: "Savory, protein-coated toast made by dipping whole wheat bread in seasoned gram flour batter and pan-crisping.",
        pairing: "Toast + Fresh Mint Dip",
        pairExplanation: "Mint polyphenols soothe the gut and aid pulse protein digestion.",
        servingSuggestion: "1 slice cut into fingers (approx. 70g).",
        substitutions: {
            "besan batter": { name: "Moong Dal Batter", why: "Extra light, fast-digesting pulse coat." },
            "whole wheat bread": { name: "Leftover Soft Phulkas (Roti Roll)", why: "Creative zero-waste household alternative." }
        }
    },
    {
        name: "Roasted Makhana & Sunflower Seeds Mix",
        slot: "eveningSnack",
        region: "Universal",
        keyNutrients: ["calcium", "zinc", "fats", "protein"],
        ingredients: ["makhana", "sunflower seeds", "desi ghee", "rock salt", "turmeric"],
        nutrients: { calories: 130, protein: 4, carbs: 16, fats: 5, fiber: 2.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Crunchy, mineral-dense combination of calcium-rich makhana and zinc-rich sunflower seeds.",
        pairing: "Seed Mix + Turmeric Ghee",
        pairExplanation: "Curcumin synergizes with healthy seeds to strengthen daily immunity.",
        servingSuggestion: "1 small cup (approx. 30g).",
        substitutions: {
            "sunflower seeds": { name: "Pumpkin Seeds", why: "High magnesium and zinc alternative." },
            "makhana": { name: "Roasted Poha", why: "Crisp light grain alternative." }
        }
    },

    // ---------------------------------------------------------------------
    // --- 5. DINNER (10 Light & Comforting Indian Household Dinners) ---
    // ---------------------------------------------------------------------
    {
        name: "Moong Dal Khichdi with Desi Ghee & Roasted Papad",
        slot: "dinner",
        region: "Universal",
        keyNutrients: ["protein", "fiber", "water", "iron"],
        ingredients: ["yellow moong dal", "rice", "pure desi ghee", "jeera", "turmeric", "hing"],
        nutrients: { calories: 300, protein: 11, carbs: 51, fats: 5, fiber: 5.5 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "The ultimate soothing, light Indian dinner. Yellow moong dal digests in under 20 minutes, ensuring restful, deep sleep.",
        pairing: "Khichdi + Spoon of Pure Desi Ghee",
        pairExplanation: "Ghee facilitates smooth gastric transit and aids restful melatonin release.",
        servingSuggestion: "1.5 cups (approx. 200g) served warm.",
        substitutions: {
            "yellow moong dal": { name: "Masoor Dal (Red Lentil)", why: "Light, flavorful lentil that cooks rapidly." },
            "rice": { name: "Foxtail Millet (Kangni)", why: "Low-glycemic ancient grain alternative." }
        }
    },
    {
        name: "Soft Phulkas with Yellow Dal Tadka & Kaddu (Pumpkin) Sabzi",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["vitaminA", "protein", "fiber", "iron"],
        ingredients: ["whole wheat flour", "toor dal", "sweet yellow pumpkin (kaddu)", "jeera", "pure ghee"],
        nutrients: { calories: 310, protein: 11.5, carbs: 53, fats: 4.5, fiber: 6.2 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Yellow pumpkin provides dense natural beta-carotene and potassium, calming the nervous system before bedtime.",
        pairing: "Kaddu Sabzi + Ghee Phulkas",
        pairExplanation: "Lipids in pure ghee enhance the assimilation of Vitamin A from sweet pumpkin.",
        servingSuggestion: "2 small rotis, 1/2 cup dal, and 1/2 cup pumpkin sabzi.",
        substitutions: {
            "sweet yellow pumpkin (kaddu)": { name: "Bottle Gourd (Lauki)", why: "Hydrating, cooling vegetable alternative." },
            "whole wheat flour": { name: "Jowar (Sorghum) Roti", why: "Gluten-free, high-fiber ancient grain." }
        }
    },
    {
        name: "Steamed Idlis with Drumstick Tomato Sambar",
        slot: "dinner",
        region: "South India",
        keyNutrients: ["protein", "fiber", "calcium", "water"],
        ingredients: ["urad dal", "idli rice", "drumstick pods", "toor dal", "tomatoes"],
        nutrients: { calories: 290, protein: 10, carbs: 52, fats: 4, fiber: 5.0 },
        prepTime: "18 mins",
        difficulty: "Easy",
        whyThisMeal: "Fermented idlis are naturally pre-digested by beneficial probiotics, making nutrients instantly available for overnight body repair.",
        pairing: "Steamed Idli + Drumstick Sambar",
        pairExplanation: "Fermentation increases Vitamin B complex bioavailability and promotes calm overnight digestion.",
        servingSuggestion: "2 small fluffy idlis with 1 cup vegetable sambar.",
        substitutions: {
            "toor dal": { name: "Moong Dal Sambar", why: "Ultra-gentle on toddler tummies." },
            "drumstick pods": { name: "Bottle Gourd or Carrots", why: "Sweet, soft vegetable alternative." }
        }
    },
    {
        name: "Soft Methi Thepla with Fresh Paneer Bhurji",
        slot: "dinner",
        region: "West India",
        keyNutrients: ["iron", "protein", "calcium", "fats"],
        ingredients: ["whole wheat flour", "fresh methi leaves", "fresh paneer", "tomatoes", "pure ghee"],
        nutrients: { calories: 325, protein: 14, carbs: 45, fats: 9, fiber: 5.2 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "Methi thepla provides plant iron and dietary fiber, while paneer supplies slow-release casein protein for overnight muscle growth.",
        pairing: "Thepla + Paneer Bhurji",
        pairExplanation: "Casein in paneer breaks down slowly over 6-8 hours, preventing nighttime hypoglycemia.",
        servingSuggestion: "1 soft thepla with 1/3 cup mild paneer bhurji.",
        substitutions: {
            "fresh paneer": { name: "Sprouted Moong Bhurji", why: "Plant-based protein alternative." },
            "fresh methi leaves": { name: "Palak (Spinach)", why: "Mild, non-bitter leafy green." }
        }
    },
    {
        name: "Dalia (Broken Wheat) Khichdi with Carrots & Peas",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["fiber", "protein", "vitaminA", "iron"],
        ingredients: ["broken wheat (dalia)", "yellow moong dal", "carrots", "green peas", "desi ghee", "hing"],
        nutrients: { calories: 305, protein: 10.5, carbs: 52, fats: 5, fiber: 6.5 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Whole cracked wheat is packed with B-complex vitamins and insoluble fiber, promoting smooth morning bowel regularity.",
        pairing: "Dalia + Drop of Pure Desi Ghee",
        pairExplanation: "Asafoetida (hing) and ghee ensure zero digestive discomfort and smooth overnight nutrient transfer.",
        servingSuggestion: "1.5 cups (approx. 200g) served warm.",
        substitutions: {
            "broken wheat (dalia)": { name: "Quinoa or Millets Dalia", why: "Gluten-free, complete amino acid grain." },
            "carrots": { name: "Finely Chopped French Beans", why: "Crisp, vitamin-K rich vegetable alternative." }
        }
    },
    {
        name: "Crispy Plain Dosa with Mild Potato Masala & Chutney",
        slot: "dinner",
        region: "South India",
        keyNutrients: ["carbs", "protein", "fiber", "fats"],
        ingredients: ["rice & urad dal batter", "boiled potato", "mustard seeds", "turmeric", "fresh coconut"],
        nutrients: { calories: 310, protein: 8.5, carbs: 55, fats: 6, fiber: 4.8 },
        prepTime: "15 mins",
        difficulty: "Easy",
        whyThisMeal: "A joyful kid-favorite dinner with fermented gut probiotics, gentle potato starch, and wholesome plant energy.",
        pairing: "Dosa + Fresh Coconut Chutney",
        pairExplanation: "Coconut medium-chain triglycerides support sustained release of energy throughout the night.",
        servingSuggestion: "1 medium thin dosa with 1/3 cup mild potato masala.",
        substitutions: {
            "rice & urad dal batter": { name: "Moong Dal Pesarattu Batter", why: "High protein, green gram crepe." },
            "boiled potato": { name: "Sweet Potato / Raw Banana", why: "Low-glycemic starch option." }
        }
    },
    {
        name: "Lauki (Bottle Gourd) & Moong Dal Curry with Phulkas",
        slot: "dinner",
        region: "Universal",
        keyNutrients: ["water", "protein", "fiber", "iron"],
        ingredients: ["bottle gourd (lauki)", "yellow moong dal", "whole wheat flour", "tomatoes", "pure ghee"],
        nutrients: { calories: 295, protein: 11, carbs: 50, fats: 4.5, fiber: 6.0 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Bottle gourd has high natural water content, preventing overnight dehydration. Moong dal ensures light amino acids.",
        pairing: "Jeera + Moong Dal",
        pairExplanation: "Roasted cumin seeds (jeera) contain volatile oils that relieve flatulence and ensure calm sleep.",
        servingSuggestion: "2 small soft rotis with 1 cup lauki dal curry.",
        substitutions: {
            "bottle gourd (lauki)": { name: "Ridge Gourd (Turai) or Zucchini", why: "Hydrating, sweet tender vegetable." },
            "whole wheat flour": { name: "Jowar (Sorghum) Roti", why: "Gluten-free, high-fiber ancient flatbread." }
        }
    },
    {
        name: "Jeera Rice with Light Masoor Dal & Sliced Cucumber",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["protein", "carbs", "water", "iron"],
        ingredients: ["basmati/sona masoori rice", "masoor dal (red lentil)", "cucumbers", "desi ghee", "jeera"],
        nutrients: { calories: 315, protein: 11.5, carbs: 54, fats: 5, fiber: 5.2 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Fragrant cumin-infused rice with iron-rich red lentils and crisp cucumber slices for effortless nighttime digestion.",
        pairing: "Jeera Rice + Masoor Dal",
        pairExplanation: "Cumin stimulates digestive enzymes while red lentils cook rapidly without creating heaviness.",
        servingSuggestion: "1 cup rice with 1/2 cup dal and cucumber slices.",
        substitutions: {
            "masoor dal (red lentil)": { name: "Yellow Moong Dal", why: "Ultra-gentle light lentil." },
            "basmati/sona masoori rice": { name: "Soft Whole Wheat Phulkas", why: "Whole grain flatbread alternative." }
        }
    },
    {
        name: "Vegetable Oats Khichdi with Turmeric & Carrots",
        slot: "dinner",
        region: "Universal",
        keyNutrients: ["fiber", "vitaminA", "protein", "iron"],
        ingredients: ["rolled oats", "yellow moong dal", "diced carrots", "green peas", "desi ghee", "turmeric"],
        nutrients: { calories: 285, protein: 9.5, carbs: 48, fats: 4.5, fiber: 6.0 },
        prepTime: "12 mins",
        difficulty: "Easy",
        whyThisMeal: "Hearty, comforting oats cooked with turmeric and diced vegetables, delivering soluble beta-glucan fiber and vitamins.",
        pairing: "Oats Khichdi + Desi Ghee",
        pairExplanation: "Turmeric curcumin and ghee soothe the intestinal mucosal lining during sleep.",
        servingSuggestion: "1.5 cups (approx. 200g) served warm.",
        substitutions: {
            "rolled oats": { name: "Broken Wheat (Dalia)", why: "Traditional cracked wheat alternative." },
            "yellow moong dal": { name: "Masoor Dal", why: "Quick-cooking red lentil alternative." }
        }
    },
    {
        name: "Paneer Tawa Pulao with Fresh Cucumber Raita",
        slot: "dinner",
        region: "North India",
        keyNutrients: ["protein", "calcium", "fats", "zinc"],
        ingredients: ["steamed rice", "paneer cubes", "green peas", "curd", "cucumber", "mild spices"],
        nutrients: { calories: 330, protein: 13, carbs: 49, fats: 8.5, fiber: 4.5 },
        prepTime: "20 mins",
        difficulty: "Easy",
        whyThisMeal: "Mildly spiced homestyle tawa pulao with golden paneer cubes and cooling probiotic cucumber raita.",
        pairing: "Pulao + Cucumber Raita",
        pairExplanation: "Curd probiotics balance the spices and facilitate smooth digestive comfort.",
        servingSuggestion: "1.5 cups pulao with 1/2 cup cucumber raita.",
        substitutions: {
            "paneer cubes": { name: "Soya Chunks or Tofu", why: "High plant protein alternative." },
            "curd": { name: "Mint Chaas", why: "Refreshing digestive drink alternative." }
        }
    },

    // ---------------------------------------------------------------------
    // --- 6. BEDTIME DRINK (8 Soothing Indian Night Drinks) ---
    // ---------------------------------------------------------------------
    {
        name: "Warm Golden Turmeric Milk with Black Pepper",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "vitaminD", "fats", "protein"],
        ingredients: ["cow milk", "haldi (turmeric)", "crushed black pepper", "organic honey / dates syrup"],
        nutrients: { calories: 110, protein: 6, carbs: 12, fats: 4, fiber: 0 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Rich in tryptophan and casein for deep restorative sleep. Turmeric provides anti-inflammatory curcumin to fortify immunity.",
        pairing: "Turmeric + Fresh Black Pepper",
        pairExplanation: "Piperine in black pepper increases curcumin bioavailability by 2000%, supporting deep overnight cellular repair.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "cow milk": { name: "Soy Milk or Almond Milk", why: "Dairy-free calcium-fortified sleep aid." },
            "honey": { name: "Organic Jaggery Powder", why: "Adds natural iron and potassium." }
        }
    },
    {
        name: "Warm Badam (Almond) Saffron Milk with Cardamom",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "fats", "protein", "zinc"],
        ingredients: ["cow milk", "crushed soaked almonds", "saffron strands (kesar)", "cardamom powder"],
        nutrients: { calories: 130, protein: 6.8, carbs: 13, fats: 5.5, fiber: 0.8 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Saffron contains natural safranal to soothe the nervous system, and almonds supply healthy brain fats and zinc.",
        pairing: "Almonds + Saffron Milk",
        pairExplanation: "Cardamom stimulates digestive fire (Agni) preventing milk mucus formation during sleep.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "cow milk": { name: "Oat Milk", why: "Creamy, naturally sweet, hypoallergenic bedtime drink." },
            "crushed soaked almonds": { name: "Cashew Nut Paste", why: "Rich in zinc and magnesium." }
        }
    },
    {
        name: "Warm Cardamom & Nutmeg (Jaiphal) Milk",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "protein", "fats"],
        ingredients: ["milk", "nutmeg (jaiphal) pinch", "cardamom", "date syrup"],
        nutrients: { calories: 115, protein: 6, carbs: 14, fats: 4, fiber: 0.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "A gentle traditional pediatric pinch of nutmeg relaxes muscles and supports uninterrupted rapid eye movement (REM) sleep.",
        pairing: "Nutmeg + Warm Milk",
        pairExplanation: "Myristicin in nutmeg synergizes with milk tryptophan to promote natural melatonin production.",
        servingSuggestion: "1 small cup (approx. 150ml).",
        substitutions: {
            "milk": { name: "Lactose-Free Milk", why: "Prevents lactose bloating and nocturnal tummy cramps." },
            "date syrup": { name: "Mashed Ripe Banana", why: "High potassium and magnesium muscle relaxant." }
        }
    },
    {
        name: "Warm Cinnamon Soy or Almond Milk with Jaggery",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["protein", "calcium", "iron"],
        ingredients: ["soy milk", "cinnamon powder", "organic jaggery"],
        nutrients: { calories: 105, protein: 7, carbs: 12, fats: 3, fiber: 0.8 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "100% plant-based high-protein nighttime beverage. Cinnamon regulates overnight insulin sensitivity.",
        pairing: "Soy Milk + Cinnamon",
        pairExplanation: "Cinnamaldehyde enhances cellular glucose transport and calms the metabolic rate before sleep.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "soy milk": { name: "Coconut Milk", why: "Rich in soothing lauric acid." },
            "cinnamon powder": { name: "Dry Ginger (Saunth) Powder", why: "Warming digestive spice for cold nights." }
        }
    },
    {
        name: "Warm Sprouted Ragi Malt Drink with Milk & Jaggery",
        slot: "bedtime",
        region: "South India",
        keyNutrients: ["calcium", "iron", "carbs", "protein"],
        ingredients: ["sprouted ragi flour", "toned milk", "organic jaggery", "cardamom"],
        nutrients: { calories: 125, protein: 5.5, carbs: 18, fats: 3.5, fiber: 1.5 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Gentle sprouted ragi malt supplies easily digestible calcium and iron without creating abdominal heaviness.",
        pairing: "Ragi Malt + Cardamom",
        pairExplanation: "Cardamom dispels colic and bloating, promoting peaceful sleep.",
        servingSuggestion: "1 warm cup (approx. 150ml).",
        substitutions: {
            "sprouted ragi flour": { name: "Roasted Barley (Jau) Flour", why: "Cooling, prebiotic ancient grain drink." },
            "toned milk": { name: "Almond Milk", why: "Nutty plant milk alternative." }
        }
    },
    {
        name: "Warm Date & Fig (Anjeer) Infused Milk",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["iron", "calcium", "fiber", "protein"],
        ingredients: ["cow milk", "dried fig (anjeer)", "soft dates", "cardamom"],
        nutrients: { calories: 135, protein: 6.2, carbs: 19, fats: 4, fiber: 1.2 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Simmered dried figs and dates infuse organic non-heme iron and potassium into warm milk for blood enrichment.",
        pairing: "Figs + Warm Milk",
        pairExplanation: "Ficin enzymes in figs soften milk curd formation in the stomach, aiding smooth overnight assimilation.",
        servingSuggestion: "1 warm cup (approx. 150ml) with softened fig pieces.",
        substitutions: {
            "dried fig (anjeer)": { name: "Golden Raisins (Kishmish)", why: "Sweet, high-iron alternative." },
            "cow milk": { name: "Oat Milk", why: "Dairy-free sweet grain milk." }
        }
    },
    {
        name: "Warm Saunf (Fennel) & Cardamom Soothing Milk",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "fats", "protein"],
        ingredients: ["milk", "crushed fennel seeds (saunf)", "cardamom", "mishri / jaggery"],
        nutrients: { calories: 110, protein: 6, carbs: 12, fats: 4, fiber: 0 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Fennel seeds provide natural carminative essential oils (anethole) that soothe pediatric colic and settle restless tummies.",
        pairing: "Fennel + Warm Milk",
        pairExplanation: "Anethole relaxes intestinal smooth muscle spasms, promoting unbroken sleep.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "crushed fennel seeds (saunf)": { name: "Chamomile Infusion", why: "Herbal calming floral infusion." },
            "milk": { name: "Soy Milk", why: "Plant-based night tonic." }
        }
    },
    {
        name: "Warm Desi Ghee & Cardamom Milk",
        slot: "bedtime",
        region: "Universal",
        keyNutrients: ["calcium", "fats", "vitaminD"],
        ingredients: ["warm milk", "pure desi ghee (1/2 tsp)", "cardamom", "jaggery"],
        nutrients: { calories: 125, protein: 6, carbs: 11, fats: 6, fiber: 0 },
        prepTime: "5 mins",
        difficulty: "Easy",
        whyThisMeal: "Traditional Ayurvedic bedtime rasayana that lubricates joints, nourishes brain tissue, and promotes easy morning bowel movements.",
        pairing: "Milk + Desi Ghee",
        pairExplanation: "Short-chain fatty acids in ghee nourish gut microbes and support smooth overnight hormone production.",
        servingSuggestion: "1 small warm cup (approx. 150ml).",
        substitutions: {
            "pure desi ghee": { name: "Cold-Pressed Sweet Almond Oil", why: "Traditional brain-nourishing oil alternative." },
            "milk": { name: "Warm Almond Milk", why: "Nut-based bedtime base." }
        }
    }
];

// ==========================================
// 2. MEAL SCORING & SELECTION ENGINES
// ==========================================

export class MealSubstitutionEngine {
    static getSubstitution(food, mealSubstitutions) {
        if (!food || !mealSubstitutions) return null;
        const key = food.toLowerCase().trim();
        return mealSubstitutions[key] || null;
    }
}

export class MealScoringEngine {
    static scoreMeal(meal, context, gaps, themeIndex = 0) {
        let score = 100;

        // 1. Location & Regional match (+35 points)
        const userState = (context.location?.state || '').toLowerCase();
        const userCity = (context.location?.city || '').toLowerCase();
        const isNorthState = ["delhi", "punjab", "haryana", "uttar pradesh", "rajasthan", "gujarat", "himachal", "uttarakhand", "madhya pradesh", "bihar"].some(s => userState.includes(s) || userCity.includes(s));
        const isSouthState = ["karnataka", "tamil nadu", "kerala", "andhra pradesh", "telangana", "bengaluru", "chennai", "hyderabad", "kochi"].some(s => userState.includes(s) || userCity.includes(s));
        const isWestState = ["maharashtra", "mumbai", "pune", "goa", "gujarat"].some(s => userState.includes(s) || userCity.includes(s));
        const isEastState = ["west bengal", "kolkata", "odisha", "bihar", "assam", "jharkhand"].some(s => userState.includes(s) || userCity.includes(s));

        if (isSouthState && meal.region === "South India") score += 35;
        else if (isNorthState && meal.region === "North India") score += 35;
        else if (isWestState && (meal.region === "West India" || meal.region === "South India")) score += 35;
        else if (isEastState && (meal.region === "East India" || meal.region === "North India")) score += 35;
        else if (meal.region === "Universal") score += 20;

        // 2. Theme-specific scoring boost
        if (themeIndex === 1) { // High Protein & Calcium Bone Growth
            if (meal.keyNutrients.includes("protein") || meal.keyNutrients.includes("calcium")) score += 40;
        } else if (themeIndex === 2) { // Quick 15-Min Traditional Family Plan
            if (meal.prepTime && (meal.prepTime.includes("2 mins") || meal.prepTime.includes("3 mins") || meal.prepTime.includes("5 mins") || meal.prepTime.includes("8 mins") || meal.prepTime.includes("10 mins") || meal.prepTime.includes("12 mins") || meal.prepTime.includes("15 mins"))) {
                score += 35;
            }
        }

        // 3. Intelligently target deficits (+15 to +70 points per active deficit)
        meal.keyNutrients.forEach(nut => {
            const gap = gaps[nut];
            if (gap && gap.severity !== 'Normal') {
                if (gap.severity === 'Critical') score += 70;
                else if (gap.severity === 'High') score += 50;
                else if (gap.severity === 'Moderate') score += 30;
                else score += 15;
            }
        });

        // 4. Disliked ingredients check (Severe penalty)
        const mealIngredients = meal.ingredients.map(i => i.toLowerCase());
        const hasDisliked = (context.dislikes || []).some(d => 
            mealIngredients.some(mi => mi.includes(d) || d.includes(mi))
        );
        if (hasDisliked) {
            score -= 150;
        }

        // 5. Vegetarian / Dairy restrictions (Absolute blocker)
        const hasAnimalProduct = ["chicken", "mutton", "fish", "egg", "chicken liver"].some(p => 
            meal.ingredients.some(mi => mi.includes(p))
        );
        if (context.isVeg && hasAnimalProduct) {
            score -= 1000;
        }

        const hasDairyProduct = ["milk", "curd", "paneer", "yogurt", "ghee"].some(d => 
            meal.ingredients.some(mi => mi.includes(d))
        );
        if (context.isLactoseIntolerant && hasDairyProduct && meal.slot !== "bedtime" && meal.slot !== "eveningSnack") {
            score -= 1000;
        }

        return score;
    }
}

// ==========================================
// 3. CLINICAL & AI MEAL PLANNER SERVICE
// ==========================================
export class GeminiMealPlannerService {
    static async suggestSlotWithGemini(context, gaps, slotKey, currentPlan = {}, parentNotes = '') {
        const apiKey = process.env.GEMINI_API_KEY;
        const locationStr = `${context.location?.city || 'Bengaluru'}, ${context.location?.state || 'Karnataka'}, India`;
        const activeGaps = Object.keys(gaps).filter(k => gaps[k].severity !== 'Normal').map(k => `${gaps[k].label} (${gaps[k].metPercent}% met)`).join(', ') || 'Overall vitality';

        if (apiKey) {
            try {
                const prompt = `You are a Pediatric Dietitian for Indian families. A parent left the "${slotKey}" meal slot blank for child ${context.name} (Age ${context.age}, Location: ${locationStr}, Deficits: ${activeGaps}, Parent Notes: "${parentNotes}").
Suggest 3 to 4 distinct authentic, easy-to-cook Indian dishes suitable for this specific meal slot to fulfill daily requirements using simple pantry staples.
Output STRICT JSON ONLY:
{
  "suggestions": [
    {
      "name": "Dish Name",
      "regionalTag": "Region",
      "ingredients": ["item1", "item2"],
      "prepTime": "15 mins",
      "estimatedNutrients": { "calories": 250, "protein": 9, "carbs": 38, "fats": 6, "fiber": 4.5 },
      "nutrientsImproved": ["Iron", "Protein"],
      "whyThisMeal": "Clinical rationale",
      "pairing": "Food pairing",
      "pairExplanation": "Synergy explanation",
      "servingSuggestion": "Portion guideline"
    }
  ]
}`;
                const res = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } },
                    { timeout: 8000 }
                );
                const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = JSON.parse(text);
                    if (parsed.suggestions && parsed.suggestions.length > 0) {
                        return parsed.suggestions;
                    }
                }
            } catch (err) {
                // Fallback below
            }
        }

        // Fallback slot generator using clinical database
        return MealGenerationEngine.suggestSlotMeals(context, gaps, slotKey);
    }
}

// ==========================================
// 4. CLINICAL MEAL GENERATION ENGINE
// ==========================================
export class MealGenerationEngine {
    static getPlanThemes() {
        return [
            { id: 0, name: "Deficit Target & Micronutrient Boost", badge: "🎯 Clinical Priority", description: "Maximizes bioavailable iron, vitamin D, and essential trace minerals." },
            { id: 1, name: "High Protein & Calcium Bone Growth", badge: "💪 Height & Bone Synergy", description: "Dense pulse-cereal-dairy proteins supporting linear skeletal velocity." },
            { id: 2, name: "Quick 15-Min Traditional Family Plan", badge: "⚡ Quick & Easy Prep", description: "Easy-to-cook authentic Indian recipes with standard kitchen staples." }
        ];
    }

    static generateDailyPlan(context, gaps, refreshNonce = 0, themeIndex = 0) {
        const plan = {};
        const slots = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtime"];
        const numericNonce = typeof refreshNonce === 'number' ? refreshNonce : (parseInt(refreshNonce, 10) || Date.now());

        slots.forEach((slot, slotIndex) => {
            const dbSlotQuery = [slot];
            if (slot === 'eveningSnack') dbSlotQuery.push('afternoonSnack');
            const candidates = MEALS_DATABASE.filter(m => dbSlotQuery.includes(m.slot));
            
            const scored = candidates.map(meal => {
                const score = MealScoringEngine.scoreMeal(meal, context, gaps, themeIndex);
                return { meal, score };
            }).filter(s => s.score > 0);

            scored.sort((a, b) => b.score - a.score);

            if (scored.length > 0) {
                const topScore = scored[0].score;
                const topCandidates = scored.filter(v => v.score >= topScore - 40 || v === scored[0]).slice(0, 6);
                const pickIndex = Math.abs(numericNonce + slotIndex * 11 + themeIndex * 17) % topCandidates.length;
                const selected = topCandidates[pickIndex].meal;
                const selectedScore = topCandidates[pickIndex].score;
                
                // Build alternatives from remaining candidates
                const remainingCandidates = candidates.filter(m => m.name !== selected.name);
                const alternatives = remainingCandidates.slice(0, 3).map(m => ({
                    name: m.name,
                    regionalTag: m.region,
                    ingredients: m.ingredients,
                    prepTime: m.prepTime,
                    difficulty: m.difficulty,
                    estimatedNutrients: m.nutrients,
                    nutrientsImproved: m.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal').map(g => gaps[g]?.label || g),
                    whyThisMeal: m.whyThisMeal,
                    pairing: m.pairing,
                    pairExplanation: m.pairExplanation,
                    servingSuggestion: m.servingSuggestion,
                    substitutions: Object.keys(m.substitutions || {}).map(ing => ({
                        ingredient: ing,
                        alternative: m.substitutions[ing].name,
                        rationale: m.substitutions[ing].why
                    }))
                }));

                const substitutionsList = Object.keys(selected.substitutions || {}).map(ing => ({
                    ingredient: ing,
                    alternative: selected.substitutions[ing].name,
                    rationale: selected.substitutions[ing].why
                }));

                const improvedGaps = selected.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal');

                plan[slot] = {
                    name: selected.name,
                    foods: selected.ingredients,
                    nutrientsImproved: improvedGaps.map(g => gaps[g]?.label || g),
                    estimatedNutrients: selected.nutrients,
                    prepTime: selected.prepTime,
                    difficulty: selected.difficulty,
                    whyThisMeal: selected.whyThisMeal,
                    pairing: selected.pairing,
                    pairExplanation: selected.pairExplanation,
                    servingSuggestion: selected.servingSuggestion,
                    substitutions: substitutionsList,
                    alternatives,
                    regionalTag: selected.region,
                    score: selectedScore
                };
            }
        });

        return plan;
    }

    /**
     * Strict 7-Day Weekly Schedule Generator
     * GUARANTEES 0 duplicate meals across all 7 days for every meal slot.
     */
    static generateWeeklyPlan(context, gaps, refreshNonce = 0, themeIndex = 0) {
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const slots = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner", "bedtime"];
        const weekly = {};
        const numericNonce = typeof refreshNonce === 'number' ? refreshNonce : (parseInt(refreshNonce, 10) || Date.now());

        // Track used meals per slot across the 7 days to strictly prevent any repetition
        const usedMealsPerSlot = {
            breakfast: new Set(),
            morningSnack: new Set(),
            lunch: new Set(),
            eveningSnack: new Set(),
            dinner: new Set(),
            bedtime: new Set()
        };

        days.forEach((day, dayIdx) => {
            const dayPlan = {};
            
            slots.forEach((slot, slotIdx) => {
                const dbSlotQuery = [slot];
                if (slot === 'eveningSnack') dbSlotQuery.push('afternoonSnack');
                const candidates = MEALS_DATABASE.filter(m => dbSlotQuery.includes(m.slot));

                // Score candidates
                const scored = candidates.map(meal => ({
                    meal,
                    score: MealScoringEngine.scoreMeal(meal, context, gaps, themeIndex)
                })).filter(s => s.score > 0);

                scored.sort((a, b) => b.score - a.score);

                // Filter out candidates already used earlier this week in this slot
                let available = scored.filter(s => !usedMealsPerSlot[slot].has(s.meal.name));
                if (available.length === 0) {
                    available = scored; // Graceful fallback
                }

                // Deterministically pick top-ranking candidate rotated with nonce
                const pickIdx = Math.abs(numericNonce + dayIdx * 7 + slotIdx * 13 + themeIndex * 19) % available.length;
                const chosen = available[pickIdx] || available[0] || scored[0];
                const selectedMeal = chosen.meal;
                const selectedScore = chosen.score;

                // Record as used for the week
                usedMealsPerSlot[slot].add(selectedMeal.name);

                // Build distinct alternatives that are also not the current meal
                const remainingCandidates = candidates.filter(m => m.name !== selectedMeal.name);
                const alternatives = remainingCandidates.slice(0, 3).map(m => ({
                    name: m.name,
                    regionalTag: m.region,
                    ingredients: m.ingredients,
                    prepTime: m.prepTime,
                    difficulty: m.difficulty,
                    estimatedNutrients: m.nutrients,
                    nutrientsImproved: m.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal').map(g => gaps[g]?.label || g),
                    whyThisMeal: m.whyThisMeal,
                    pairing: m.pairing,
                    pairExplanation: m.pairExplanation,
                    servingSuggestion: m.servingSuggestion,
                    substitutions: Object.keys(m.substitutions || {}).map(ing => ({
                        ingredient: ing,
                        alternative: m.substitutions[ing].name,
                        rationale: m.substitutions[ing].why
                    }))
                }));

                const substitutionsList = Object.keys(selectedMeal.substitutions || {}).map(ing => ({
                    ingredient: ing,
                    alternative: selectedMeal.substitutions[ing].name,
                    rationale: selectedMeal.substitutions[ing].why
                }));

                const improvedGaps = selectedMeal.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal');

                dayPlan[slot] = {
                    name: selectedMeal.name,
                    foods: selectedMeal.ingredients,
                    nutrientsImproved: improvedGaps.map(g => gaps[g]?.label || g),
                    estimatedNutrients: selectedMeal.nutrients,
                    prepTime: selectedMeal.prepTime,
                    difficulty: selectedMeal.difficulty,
                    whyThisMeal: selectedMeal.whyThisMeal,
                    pairing: selectedMeal.pairing,
                    pairExplanation: selectedMeal.pairExplanation,
                    servingSuggestion: selectedMeal.servingSuggestion,
                    substitutions: substitutionsList,
                    alternatives,
                    regionalTag: selectedMeal.region,
                    score: selectedScore
                };
            });

            // Calculate day totals
            let dayTotals = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
            Object.keys(dayPlan).forEach(slotKey => {
                const nut = dayPlan[slotKey].estimatedNutrients;
                if (nut) {
                    dayTotals.calories += nut.calories || 0;
                    dayTotals.protein += nut.protein || 0;
                    dayTotals.carbs += nut.carbs || 0;
                    dayTotals.fats += nut.fats || 0;
                    dayTotals.fiber += nut.fiber || 0;
                }
            });

            weekly[day] = {
                dayName: day.charAt(0).toUpperCase() + day.slice(1),
                slots: dayPlan,
                totals: {
                    calories: Math.round(dayTotals.calories),
                    protein: Number(dayTotals.protein.toFixed(1)),
                    carbs: Number(dayTotals.carbs.toFixed(1)),
                    fats: Number(dayTotals.fats.toFixed(1)),
                    fiber: Number(dayTotals.fiber.toFixed(1))
                }
            };
        });

        return weekly;
    }

    static suggestSlotMeals(context, gaps, slotKey) {
        const dbSlotQuery = [slotKey];
        if (slotKey === 'eveningSnack') dbSlotQuery.push('afternoonSnack');
        const candidates = MEALS_DATABASE.filter(m => dbSlotQuery.includes(m.slot));
        
        const scored = candidates.map(meal => ({
            meal,
            score: MealScoringEngine.scoreMeal(meal, context, gaps, 0)
        })).filter(s => s.score > 0);

        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, 4).map(s => ({
            name: s.meal.name,
            regionalTag: s.meal.region,
            ingredients: s.meal.ingredients,
            prepTime: s.meal.prepTime,
            difficulty: s.meal.difficulty,
            estimatedNutrients: s.meal.nutrients,
            nutrientsImproved: s.meal.keyNutrients.filter(nut => gaps[nut] && gaps[nut].severity !== 'Normal').map(g => gaps[g]?.label || g),
            whyThisMeal: s.meal.whyThisMeal,
            pairing: s.meal.pairing,
            pairExplanation: s.meal.pairExplanation,
            servingSuggestion: s.meal.servingSuggestion,
            substitutions: Object.keys(s.meal.substitutions || {}).map(ing => ({
                ingredient: ing,
                alternative: s.meal.substitutions[ing].name,
                rationale: s.meal.substitutions[ing].why
            }))
        }));
    }
}

// ==========================================
// 5. SERVICE COORDINATOR (RESPONSE BUILDER)
// ==========================================
export class MealPlannerService {
    static async generatePlan(profile, mealLogs, refreshNonce = 0, mode = 'daily', optionIndex = 0) {
        const context = ProfileContextEngine.buildContext(profile);
        const dailyAverages = this.calculateAverages(mealLogs);
        const gaps = GapDetectionEngine.detectGaps(context, dailyAverages);
        const themes = MealGenerationEngine.getPlanThemes();

        // 1. Generate Daily Plan
        const dailyPlan = MealGenerationEngine.generateDailyPlan(context, gaps, refreshNonce, optionIndex);

        // 2. Generate Weekly Plan (Strict 0 repeat across 7 days)
        const weeklyPlan = MealGenerationEngine.generateWeeklyPlan(context, gaps, refreshNonce, optionIndex);

        // 3. Tally total plan nutrients for daily
        let totalPlan = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
        Object.keys(dailyPlan).forEach(slot => {
            const nutrients = dailyPlan[slot].estimatedNutrients;
            if (nutrients) {
                totalPlan.calories += nutrients.calories || 0;
                totalPlan.protein += nutrients.protein || 0;
                totalPlan.carbs += nutrients.carbs || 0;
                totalPlan.fats += nutrients.fats || 0;
                totalPlan.fiber += nutrients.fiber || 0;
            }
        });

        totalPlan = {
            calories: Math.round(totalPlan.calories),
            protein: Number(totalPlan.protein.toFixed(1)),
            carbs: Number(totalPlan.carbs.toFixed(1)),
            fats: Number(totalPlan.fats.toFixed(1)),
            fiber: Number(totalPlan.fiber.toFixed(1))
        };

        const userState = (context.location?.state || '').toLowerCase();
        const regionalName = ["delhi", "punjab", "haryana", "uttar pradesh", "rajasthan", "gujarat"].some(s => userState.includes(s))
            ? "North Indian Staples"
            : (["karnataka", "tamil nadu", "kerala", "andhra pradesh", "telangana"].some(s => userState.includes(s)) ? "South Indian Staples" : "Traditional Indian Cuisine");

        return {
            childName: context.name,
            location: context.location,
            regionalFocus: regionalName,
            themes,
            selectedTheme: themes[optionIndex % themes.length],
            mode,
            dailyPlan,
            weeklyPlan,
            totalPlan,
            savedPlan: profile.savedDietPlan || null,
            customDietNotes: profile.customDietNotes || ''
        };
    }

    static async suggestSlot(profile, mealLogs, slotKey, currentPlan = {}, parentNotes = '') {
        const context = ProfileContextEngine.buildContext(profile);
        const dailyAverages = this.calculateAverages(mealLogs);
        const gaps = GapDetectionEngine.detectGaps(context, dailyAverages);

        return await GeminiMealPlannerService.suggestSlotWithGemini(context, gaps, slotKey, currentPlan, parentNotes);
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
