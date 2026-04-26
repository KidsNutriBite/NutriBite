/**
 * Nutritional requirements based on age groups.
 * Approximations for pediatric daily requirements.
 * 
 * @param {number} age - Child's age in years
 * @param {string} gender - Child's gender
 * @returns {object} Required daily nutrients
 */
export const getNutritionalRequirements = (age, gender = 'other') => {
    // Default base for an average child
    const req = {
        calories: 1200,
        protein: 20, // grams
        iron: 10,    // mg
        carbs: 130,  // grams
        fats: 40,    // grams
        vitamins: 1  // a placeholder metric for overall vitamin score, or we can check specific ones
    };

    if (age >= 1 && age <= 3) {
        req.calories = 1000;
        req.protein = 13;
        req.iron = 7;
        req.carbs = 130;
        req.fats = 30;
    } else if (age >= 4 && age <= 8) {
        req.calories = 1400;
        req.protein = 19;
        req.iron = 10;
        req.carbs = 130;
        req.fats = 45;
    } else if (age >= 9 && age <= 13) {
        req.calories = gender === 'male' ? 1800 : 1600;
        req.protein = 34;
        req.iron = 8; // increases later
        req.carbs = 130;
        req.fats = 55;
    } else if (age >= 14 && age <= 18) {
        req.calories = gender === 'male' ? 2400 : 1800;
        req.protein = gender === 'male' ? 52 : 46;
        req.iron = gender === 'female' ? 15 : 11;
        req.carbs = 130;
        req.fats = 70;
    }

    return req;
};

/**
 * Calculates a weekly nutrition score.
 * Starts at 100, subtracts points based on the number and severity of deficiencies.
 * 
 * @param {number} deficienciesCount - Total number of deficiencies found
 * @returns {object} Score and Status
 */
export const calculateNutritionScore = (deficienciesCount) => {
    let score = 100 - (deficienciesCount * 10);
    if (score < 0) score = 0;

    let status = "Excellent";
    if (score < 60) {
        status = "Needs Critical Attention";
    } else if (score < 80) {
        status = "Needs Improvement";
    } else if (score < 95) {
        status = "Good";
    }

    return { score, status };
};
