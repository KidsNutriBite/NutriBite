/**
 * Explainable Nutrition Engine for NutriKid Games & AI Interactions.
 * 
 * Maps healthy ingredients to:
 * - Superhero Powers
 * - Key Nutrients
 * - Biological Explanations (Age-Adapted: 4-6, 7-10, 11-14)
 * - Supported Body Systems
 * - Real-world Health Connections
 */

const NUTRITION_MAP = {
    banana: {
        power: "⚡ Energy Speed Boost",
        nutrients: ["Carbohydrates", "Potassium"],
        systems: ["energy metabolism", "muscular system", "nervous system"],
        benefit: "Eating bananas before sports helps maintain high energy levels and reduces muscle fatigue during play.",
        fact: "Did you know that bananas are botanically considered berries? They grow on giant herbaceous plants instead of trees!",
        explanations: {
            young: {
                why: "Bananas are like battery packs! They are full of simple sugars that give you immediate speed to run and play.",
                science: "Simple carbohydrates in bananas enter your tummy, breaking down fast to fuel your muscles so they don't get tired."
            },
            mid: {
                why: "Bananas contain complex carbohydrates and potassium, supplying immediate and sustained cellular energy.",
                science: "Carbohydrates are digested and converted into glucose. Glucose is absorbed into the bloodstream to feed muscle fibers. Potassium helps nerves transmit signals that control muscle contractions."
            },
            teen: {
                why: "Bananas are an rich source of glycogen-restoring carbohydrates and potassium, optimizing nerve conductivity and ATP synthesis.",
                science: "Carbohydrates undergo rapid enzymatic hydrolysis into glucose, triggering cellular glycolysis to produce ATP (adenosine triphosphate) for muscle contraction. Potassium ions maintain the intracellular osmotic balance and support membrane action potentials during exertion."
            }
        }
    },
    fish: {
        power: "🧠 Brain Wave Vision",
        nutrients: ["Omega-3 fatty acids", "High-quality Protein"],
        systems: ["nervous system", "ocular system", "brain development"],
        benefit: "Consuming fish helps build strong brain cell connections, improving concentration and learning in school.",
        fact: "Your brain is made of nearly 60% fat, and eating healthy fish fats helps keep that brain armor super insulated!",
        explanations: {
            young: {
                why: "Fish has healthy smart-fats that build brain cell bridges so you can solve tricky puzzles like a genius!",
                science: "Special oils in fish, called Omega-3s, make the thinking cells in your head talk to each other faster."
            },
            mid: {
                why: "Fish is rich in Omega-3 fatty acids, which are crucial structural blocks of brain cell membranes.",
                science: "Omega-3 fatty acids (like DHA) are integrated into the cell membranes of neurons. This enhances synaptic plasticity, supporting cognitive function, memory, and concentration."
            },
            teen: {
                why: "Fish provides highly bioavailable proteins and essential Omega-3 polyunsaturated fatty acids (EPA/DHA) that optimize neuronal membrane fluidity.",
                science: "Docosahexaenoic acid (DHA) is a major structural lipid in the cerebral cortex and retina. It promotes synaptic vesicle fusion and neuroplasticity, while high-quality amino acids support neurotransmitter synthesis like serotonin."
            }
        }
    },
    milk: {
        power: "🛡️ Bone Shield Armor",
        nutrients: ["Calcium", "Phosphorus", "Vitamin D"],
        systems: ["skeletal system", "musculoskeletal system", "dental health"],
        benefit: "Drinking milk supplies bone-building blocks, making your bones strong enough to withstand high jumps.",
        fact: "Bones are alive and constantly rebuilding themselves! Drinking milk provides the calcium bricks to rebuild them stronger.",
        explanations: {
            young: {
                why: "Milk is full of calcium bricks that build a heavy shield armor to keep your bones and teeth super strong!",
                science: "Calcium and Vitamin D join forces in your tummy. Vitamin D acts like a crane, helping your bones absorb the calcium blocks."
            },
            mid: {
                why: "Milk contains calcium, phosphorus, and vitamin D, which are essential for bone mineralization.",
                science: "Calcium and phosphorus combine to form hydroxyapatite crystals, the mineral foundation of bones. Vitamin D acts as a hormone that stimulates calcium absorption in the intestines."
            },
            teen: {
                why: "Milk supplies highly bioavailable calcium, phosphorus, and Vitamin D3, which maximize peak bone mass and osteoblast activity.",
                science: "The calcium and phosphorus ions mineralize the collagen matrix in bones via hydroxyapatite crystallization, guided by osteoblasts. Cholecalciferol (Vitamin D3) upregulates the synthesis of calcium-binding proteins to facilitate active intestinal transport."
            }
        }
    },
    spinach: {
        power: "🛡️ Immune Shield Forcefield",
        nutrients: ["Iron", "Folate", "Vitamin C"],
        systems: ["circulatory system", "immune system", "oxygen transport"],
        benefit: "Spinach fuels oxygen transport in your blood, giving you lasting stamina and fighting off cold bugs.",
        fact: "Popeye the Sailor eating spinach for instant strength was actually based on a math mistake where a scientist placed the decimal point in the wrong spot, making spinach seem to have 10 times more iron than it actually did!",
        explanations: {
            young: {
                why: "Spinach launches green shield-bots that run through your blood cells to deliver fresh breathing-air and sweep away bad cold bugs!",
                science: "Spinach is packed with iron. Iron builds oxygen balloons inside your blood so you have endless running power."
            },
            mid: {
                why: "Spinach is rich in non-heme iron and folate, supporting red blood cell production and cellular immunity.",
                science: "Iron is a critical component of hemoglobin, the protein in red blood cells that binds oxygen. Folate is required for DNA synthesis and rapid cell division, supporting active immune cells."
            },
            teen: {
                why: "Spinach contains non-heme iron, dietary folate, and antioxidants that promote erythropoiesis and cellular immune integrity.",
                science: "Iron is incorporated into the porphyrin ring of heme, facilitating reversible oxygen binding in hemoglobin. Folate acting as a coenzyme participates in one-carbon metabolism essential for purine synthesis, facilitating rapid clonal expansion of lymphocytes."
            }
        }
    },
    eggs: {
        power: "🧠 Brain Spark Charger",
        nutrients: ["Protein", "Choline", "Vitamin B12"],
        systems: ["nervous system", "brain health", "cellular repair"],
        benefit: "Eggs contain brain messengers that help you memorize lessons and stay focused during school.",
        fact: "The yolk in the egg contains almost all the choline and healthy fats. So eating the whole egg is best for your brain cells!",
        explanations: {
            young: {
                why: "Eggs act like memory chargers, building super fast paths in your brain so you never forget where your toys are!",
                science: "Eggs have a special nutrient called Choline. Choline acts like a telephone wire, helping your brain cells call each other instantly."
            },
            mid: {
                why: "Eggs provide high-quality complete protein and choline, which support neurotransmitter production.",
                science: "Choline is a chemical precursor to acetylcholine, a key neurotransmitter involved in memory, learning, and muscle control. Eggs also supply all nine essential amino acids required for growth."
            },
            teen: {
                why: "Eggs contain high-biological-value protein and choline, essential for lipid membrane synthesis and cholinergic neurotransmission.",
                science: "Choline is acetylated by choline acetyltransferase into acetylcholine, a vital neurotransmitter regulating memory encoding and neuromuscular synapses. Eggs' complete amino acid profile ensures optimal substrate availability for muscle protein synthesis."
            }
        }
    },
    carrot: {
        power: "👁️ Night Vision Scanner",
        nutrients: ["Beta-carotene", "Vitamin A"],
        systems: ["ocular system", "immune defense", "skin health"],
        benefit: "Carrots keep your eyes healthy, preventing dryness and supporting your eyes' ability to adjust to dark rooms.",
        fact: "Eating way too many carrots can actually turn your skin slightly orange-yellow! This harmless condition is called carotenemia.",
        explanations: {
            young: {
                why: "Carrots act like eye sight-boosters, giving your eyes special goggles to see clearly and adjust in the dark!",
                science: "Inside your tummy, carrots turn into Vitamin A. Vitamin A acts like a little light bulb inside your eyes."
            },
            mid: {
                why: "Carrots are rich in beta-carotene, a pigment that your liver converts into active Vitamin A.",
                science: "Beta-carotene is converted into retinal, which combines with the protein opsin to form rhodopsin. Rhodopsin is the biological pigment in rod cells responsible for light sensitivity and night vision."
            },
            teen: {
                why: "Carrots provide carotenoids, primarily beta-carotene, serving as precursors to retinol essential for phototransduction pathways.",
                science: "Beta-carotene is cleaved by oxygenase enzymes into retinaldehyde. Retinaldehyde binds with opsin in photoreceptor rod cells, forming rhodopsin. Upon photon absorption, 11-cis-retinal isomerizes to all-trans-retinal, initiating the visual hyperpolarization cascade."
            }
        }
    },
    broccoli: {
        power: "🛡️ Tummy Armor Defender",
        nutrients: ["Fiber", "Vitamin C", "Antioxidants"],
        systems: ["digestive system", "immune defense", "gut health"],
        benefit: "Broccoli launches tiny fiber bots in your tummy that clean up wastes and support digestion.",
        fact: "Broccoli looks like little trees because it is actually a bunch of unopened flower buds from the cabbage family!",
        explanations: {
            young: {
                why: "Broccoli acts like mini tummy sweepers, brushing away bad tummy bugs and keeping your belly happy! 🌳",
                science: "Broccoli is full of fibers. Fiber acts like a broom that sweeps food smoothly through your stomach."
            },
            mid: {
                why: "Broccoli is loaded with dietary fiber and Vitamin C, optimizing intestinal peristalsis and cell defenses.",
                science: "Dietary fiber adds bulk to stools, supporting smooth intestinal contractions. Vitamin C acts as a powerful antioxidant protecting cells from damage."
            },
            teen: {
                why: "Broccoli provides insoluble and soluble dietary fibers, glucosinolates, and ascorbic acid that optimize gut microbiome and cellular integrity.",
                science: "Fiber acts as a prebiotic substrate for short-chain fatty acid (SCFA) producing gut microflora, maintaining the integrity of the mucosal barrier. Vitamin C acts as a critical cofactor for collagen synthesis and an electron donor that neutralizes free radicals."
            }
        }
    },
    dal: {
        power: "💪 Titan Muscle Builder",
        nutrients: ["Plant Protein", "Iron", "Fiber"],
        systems: ["musculoskeletal system", "energy metabolism", "cell growth"],
        benefit: "Lentils supply rich plant protein blocks to construct heavy, strong muscle mass for play.",
        fact: "Lentils have been grown by humans for over 10,000 years! They were highly valued by ancient warriors for building muscle stamina.",
        explanations: {
            young: {
                why: "Dal soup supplies tiny construction blocks to build super strong muscle shields so you can lift heavy toys! 🥣",
                science: "Dal is full of plant proteins. Proteins act like little builders that repair and expand your muscle fibers."
            },
            mid: {
                why: "Dal (lentils) provides rich plant-based proteins and essential amino acids necessary for skeletal muscle growth.",
                science: "Amino acids from digested lentil protein are absorbed and used by ribosomes to synthesize new structural proteins, rebuilding muscle fibers damaged during exercise."
            },
            teen: {
                why: "Lentils supply highly bioavailable plant proteins rich in essential amino acids (such as lysine) and iron, facilitating muscle hypertrophy.",
                science: "Protein digestion releases free amino acids that stimulate the mTOR signaling pathway, upregulating ribosomal translation and skeletal muscle protein synthesis. Heme-supporting iron optimizes systemic cellular respiration."
            }
        }
    },
    water: {
        power: "🌊 Hydration Jet Wave",
        nutrients: ["Water (H2O)", "Electrolytes"],
        systems: ["circulatory system", "thermoregulation", "renal system"],
        benefit: "Drinking water cools your body engine down, preventing overheating and keeping all cellular functions active.",
        fact: "Every single cell in your body is mostly made of water! In fact, your brain is about 85% water, which is why dehydration makes you feel fuzzy.",
        explanations: {
            young: {
                why: "Water launches a cooling jet wave through your body, keeping your superhero engine running cool and fast! 💧",
                science: "Water flows to every cell, washing out wastes and helping blood carry healthy snacks to your organs."
            },
            mid: {
                why: "Water is the universal solvent, facilitating chemical reactions, regulating body temperature, and supporting circulation.",
                science: "Water forms the fluid basis of plasma, which transports red blood cells and dissolved nutrients. Sweat evaporation from the skin dissipates heat, cooling the body."
            },
            teen: {
                why: "Water acts as the vital medium for biochemical homeostasis, maintaining blood volume and facilitating thermal regulation.",
                science: "Water maintains systemic hemodynamics and osmotic balance across cellular membranes. Sweating triggers cutaneous vasodilation and evaporative cooling, preventing hyperthermia during physical exertion."
            }
        }
    }
};

/**
 * Generates structured explanation payload.
 * 
 * @param {string} foodName - Name of the food/ingredient
 * @param {number} age - Age of the child (4-14)
 * @returns {object} Explainable Response Payload
 */
export const generateExplanation = (foodName, age = 7) => {
    const item = foodName.toLowerCase().trim();
    const mapping = NUTRITION_MAP[item];

    if (!mapping) {
        // Fallback generic mapping
        return {
            game_result: `🍀 ${foodName} Activated!`,
            power_unlocked: "🍀 Healthy Boost",
            why_it_worked: `${foodName} is packed with wholesome natural nutrients!`,
            scientific_reason: `${foodName} supplies micronutrients that maintain balanced biological functions and metabolism inside your cells.`,
            body_systems_supported: ["energy metabolism", "immune defense"],
            key_nutrients: ["Vitamins", "Minerals"],
            real_world_health_benefit: "Eating a wide variety of fresh, whole foods ensures your cells receive a complete nutrient balance.",
            fun_fact: "Did you know that eating a rainbow of differently colored fruits and vegetables supplies different types of protective antioxidants?",
            learning_concept: "balanced diet",
            xp_reward: 10
        };
    }

    // Determine age bracket
    let bracket = "mid";
    if (age <= 6) bracket = "young";
    if (age >= 11) bracket = "teen";

    const explanation = mapping.explanations[bracket];

    return {
        game_result: `${mapping.power} Activated!`,
        power_unlocked: mapping.power,
        why_it_worked: explanation.why,
        scientific_reason: explanation.science,
        body_systems_supported: mapping.systems,
        key_nutrients: mapping.nutrients,
        real_world_health_benefit: mapping.benefit,
        fun_fact: mapping.fact,
        learning_concept: mapping.nutrients[0].toLowerCase(),
        xp_reward: 15
    };
};
