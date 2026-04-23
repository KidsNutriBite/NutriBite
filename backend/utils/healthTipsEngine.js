const TIPS_DB = {
    iron_deficiency: [
        "Include Vitamin C rich foods (oranges, strawberries) with meals to boost iron absorption! 🍊",
        "Leafy greens like spinach are great, but cook them to unlock the iron. 🍃",
        "Cook in cast-iron pans to naturally increase iron intake. 🍳",
        "Avoid calcium-rich drinks (milk) directly with iron-heavy meals as they block absorption. 🥛❌"
    ],
    diabetes: [
        "Focus on whole grains instead of white rice or bread to keep sugar steady. 🌾",
        "Pair fruits with a protein (like nuts or cheese) to slow down sugar spikes. 🍎🧀",
        "Water is the best drink! Juice can cause quick sugar highs. 💧",
        "Regular meal times help keep energy levels stable throughout the day. 🕒"
    ],
    obesity: [
        "Color the plate! Aim for half the plate to be veggies. 🥗",
        "Crunchy snacks like carrots or cucumbers are fun and low-calorie! 🥕",
        "Water first! Thirst is often confused with hunger. 🚰",
        "Focus on fiber-rich foods (beans, oats) to stay full longer. 🥣"
    ],
    lactose_intolerance: [
        "Try calcium-fortified plant milks like almond or soy! 🥛",
        "Yogurt with live cultures might be easier on the tummy than milk. 🥣",
        "Hard cheeses (cheddar, swiss) naturally have very little lactose. 🧀",
        "Leafy greens and broccoli are hidden sources of calcium! 🥦"
    ],
    general: [
        "Try to eat a rainbow of colors every day! 🌈",
        "Breakfast is fuel for the brain! 🧠",
        "Drink water before playing to stay super fast! ⚡",
        "Trying new foods is an adventure! 🗺️"
    ]
};

/**
 * Generate prioritized tips based on conditions
 * @param {Array} conditions 
 * @returns {Array} Top 3 tips
 */
export const generateHealthTips = (conditions = []) => {
    let selectedTips = [];

    // 1. Priority Conditions (Add logic here if needed, currently order of input)
    if (conditions && conditions.length > 0) {
        conditions.forEach(cond => {
            if (TIPS_DB[cond]) {
                // Take random 1-2 tips from each condition
                const tips = TIPS_DB[cond];
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                selectedTips.push({ type: 'condition', text: randomTip, tag: cond });
            }
        });
    }

    // 2. Fill with General Tips if not enough
    const generalTips = TIPS_DB.general;
    while (selectedTips.length < 3) {
        const randomGen = generalTips[Math.floor(Math.random() * generalTips.length)];
        // Avoid duplicates
        if (!selectedTips.some(t => t.text === randomGen)) {
            selectedTips.push({ type: 'general', text: randomGen, tag: 'General' });
        }
        if (selectedTips.length >= 3) break; // Safety break
    }

    // 3. Return top 3
    return selectedTips.slice(0, 3);
};
