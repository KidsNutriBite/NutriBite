/**
 * Mapping of nutrients to suggested foods.
 */
export const foodSuggestions = {
    iron: ["Spinach", "Dates", "Jaggery", "Lentils", "Pumpkin Seeds"],
    protein: ["Eggs", "Paneer", "Chicken", "Lentils", "Greek Yogurt", "Almonds"],
    calories: ["Bananas", "Peanut Butter", "Avocado", "Whole Milk", "Oats"],
    carbs: ["Sweet Potatoes", "Brown Rice", "Oats", "Bananas", "Whole Wheat Bread"],
    fats: ["Avocado", "Nuts", "Olive Oil", "Chia Seeds", "Peanut Butter"],
    vitaminD: ["Egg Yolks", "Fortified Milk", "Mushrooms", "Salmon"]
};

/**
 * Returns an explainable reason for recommending a specific food item.
 * 
 * @param {string} nutrient - The deficient nutrient
 * @param {string} food - The suggested food
 * @returns {string} The explanation message
 */
export const getExplanation = (nutrient, food) => {
    return `${food} is recommended because it is rich in ${nutrient}.`;
};
