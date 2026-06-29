import fs from 'fs';
import path from 'path';

const syncDb = () => {
    try {
        console.log('--- STARTING NUTRITION DATABASE SYNC ---');

        const frontendDbPath = path.resolve('../frontend/src/data/foodDatabase.js');
        const backendEnginePath = path.resolve('./utils/nutritionEngine.js');

        if (!fs.existsSync(frontendDbPath)) {
            throw new Error(`Frontend food database not found at: ${frontendDbPath}`);
        }

        // Read frontend food database file
        const content = fs.readFileSync(frontendDbPath, 'utf8');

        // Extract the FOOD_DATABASE array by parsing the text
        const arrayStart = content.indexOf('export const FOOD_DATABASE = [');
        if (arrayStart === -1) {
            throw new Error('Could not find FOOD_DATABASE array in frontend file.');
        }

        // Simple text extraction of the array content
        const rawArrayText = content.substring(arrayStart);
        
        // Use regex to find all objects in the array
        const objectRegex = /\{\s*name:\s*['"](.*?)['"],\s*qty:\s*['"](.*?)['"],\s*cal:\s*([\d.]+),\s*p:\s*([\d.]+),\s*c:\s*([\d.]+),\s*f:\s*([\d.]+),(?:\s*fib:\s*([\d.]+),)?(?:\s*w:\s*([\d.]+),)?\s*tag:\s*['"](.*?)['"]\s*\}/g;
        
        const nutritionDbEntries = {};

        let match;
        while ((match = objectRegex.exec(rawArrayText)) !== null) {
            const [_, name, qty, cal, p, c, f, fib, w, tag] = match;
            
            // Normalize key for matching (same logic as nutritionEngine calculateFoodNutrition)
            const key = name.toLowerCase().trim();
            
            // Map values, defaulting fiber to 1.5, water to 0, iron to 1.0, calcium to 20, vitaminC to 1.0 if not specified
            nutritionDbEntries[key] = {
                name: name,
                servingSize: qty,
                calories: parseFloat(cal),
                protein: parseFloat(p),
                carbs: parseFloat(c),
                fat: parseFloat(f),
                fiber: fib ? parseFloat(fib) : 1.5,
                iron: 1.0,  // fallback default
                calcium: 20, // fallback default
                vitaminC: 1.0 // fallback default
            };
        }

        // For common items, let's keep some realistic micro-nutrients if possible, or copy them from the existing ones.
        // We'll read the existing engine first to preserve any custom micronutrients.
        let existingDb = {};
        if (fs.existsSync(backendEnginePath)) {
            const engineContent = fs.readFileSync(backendEnginePath, 'utf8');
            const entriesRegex = /"([^"]+)"\s*:\s*\{([^}]+)\}/g;
            let entryMatch;
            while ((entryMatch = entriesRegex.exec(engineContent)) !== null) {
                const key = entryMatch[1];
                const fieldsText = entryMatch[2];
                const ironMatch = fieldsText.match(/iron\s*:\s*([\d.]+)/);
                const calciumMatch = fieldsText.match(/calcium\s*:\s*([\d.]+)/);
                const vitCMatch = fieldsText.match(/vitaminC\s*:\s*([\d.]+)/);
                
                existingDb[key] = {
                    iron: ironMatch ? parseFloat(ironMatch[1]) : 1.0,
                    calcium: calciumMatch ? parseFloat(calciumMatch[1]) : 20,
                    vitaminC: vitCMatch ? parseFloat(vitCMatch[1]) : 1.0
                };
            }
        }

        // Update parsed entries with existing custom micronutrients if matches found
        for (const key of Object.keys(nutritionDbEntries)) {
            if (existingDb[key]) {
                nutritionDbEntries[key].iron = existingDb[key].iron;
                nutritionDbEntries[key].calcium = existingDb[key].calcium;
                nutritionDbEntries[key].vitaminC = existingDb[key].vitaminC;
            }
        }

        // Generate the new nutritionEngine.js content
        let newContent = `// Pediatric Nutrition Engine based on IFCT 2017 and USDA databases.
// Maps foods to Calories, Protein, Carbohydrates, Fat, Fiber, Iron, Calcium, and Vitamin C.
// AUTO-GENERATED from frontend/src/data/foodDatabase.js - Do not edit manually.

export const NUTRITION_DB = {\n`;

        const entryKeys = Object.keys(nutritionDbEntries);
        entryKeys.forEach((key, idx) => {
            const entry = nutritionDbEntries[key];
            newContent += `    "${key}": {
        name: "${entry.name}",
        servingSize: "${entry.servingSize}",
        calories: ${entry.calories},
        protein: ${entry.protein},
        carbs: ${entry.carbs},
        fat: ${entry.fat},
        fiber: ${entry.fiber},
        iron: ${entry.iron},
        calcium: ${entry.calcium},
        vitaminC: ${entry.vitaminC}
    }${idx < entryKeys.length - 1 ? ',' : ''}\n`;
        });

        newContent += `};

/**
 * Parses the quantity string and returns a scaling factor compared to the base serving size.
 * @param {string} quantityStr - E.g. "2 pieces", "1 bowl", "100g"
 * @param {string} foodName - Normalized food name key
 * @returns {number} Multiplier/scaling factor
 */
export const calculateQuantityMultiplier = (quantityStr, foodName) => {
    if (!quantityStr) return 1.0;
    
    const dbItem = NUTRITION_DB[foodName.toLowerCase().trim()];
    if (!dbItem) return 1.0;

    const qtyLower = quantityStr.toLowerCase();
    const dbQtyLower = dbItem.servingSize.toLowerCase();

    // Extract first numeric value from both
    const qtyMatch = qtyLower.match(/([\\d.]+)/);
    const dbQtyMatch = dbQtyLower.match(/([\\d.]+)/);

    if (qtyMatch && dbQtyMatch) {
        const qtyNum = parseFloat(qtyMatch[1]);
        const dbQtyNum = parseFloat(dbQtyMatch[1]);
        if (!isNaN(qtyNum) && !isNaN(dbQtyNum) && dbQtyNum > 0) {
            return qtyNum / dbQtyNum;
        }
    }
    return 1.0;
};

/**
 * Calculates nutritional values for a given food name and quantity.
 * @param {string} foodName - Food name
 * @param {string} quantity - E.g. "2 pieces"
 * @returns {object} Nutritional breakdown
 */
export const calculateFoodNutrition = (foodName, quantity = "") => {
    const key = foodName.toLowerCase().trim();
    const dbItem = NUTRITION_DB[key];
    
    // Default fallback values if food is not recognized
    if (!dbItem) {
        return {
            name: foodName,
            quantity: quantity || "1 serving",
            calories: 120,
            protein: 3.0,
            carbs: 18.0,
            fats: 4.0,
            fiber: 1.5,
            iron: 0.8,
            calcium: 20,
            vitaminC: 2.0
        };
    }

    const qty = quantity || dbItem.servingSize;
    const mult = calculateQuantityMultiplier(qty, key);

    return {
        name: dbItem.name || foodName,
        quantity: qty,
        calories: Math.round(dbItem.calories * mult),
        protein: Math.round((dbItem.protein * mult) * 100) / 100,
        carbs: Math.round((dbItem.carbs * mult) * 100) / 100,
        fats: Math.round((dbItem.fat * mult) * 100) / 100,
        fiber: Math.round((dbItem.fiber * mult) * 100) / 100,
        iron: Math.round((dbItem.iron * mult) * 100) / 100,
        calcium: Math.round(dbItem.calcium * mult),
        vitaminC: Math.round((dbItem.vitaminC * mult) * 100) / 100
    };
};
`;

        fs.writeFileSync(backendEnginePath, newContent, 'utf8');
        console.log(`✅ Synced ${entryKeys.length} entries to ${backendEnginePath}.`);
    } catch (e) {
        console.error('❌ ERROR RUNNING SYNC SCRIPT:', e.message);
    }
};

syncDb();
