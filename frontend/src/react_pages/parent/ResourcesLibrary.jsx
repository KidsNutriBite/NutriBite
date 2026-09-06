"use client";
import React, { useState } from 'react';
import GuideCard from '../../components/resources/GuideCard';
import RecipeCard from '../../components/resources/RecipeCard';
import TipCard from '../../components/resources/TipCard';
import ResourceModal from '../../components/resources/ResourceModal';
import PortionGuide from '../../components/resources/PortionGuide';
import GrowthChartGuide from '../../components/resources/GrowthChartGuide';
import { useProfile } from '../../context/ProfileContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ResourcesLibrary = () => {
    const { selectedProfile } = useProfile();
    const [activeTab, setActiveTab] = useState('growth'); // growth, guides, recipes, portions
    const [activeFilter, setActiveFilter] = useState('All');
    const [savedResources, setSavedResources] = useState(new Set());
    const [selectedResource, setSelectedResource] = useState(null); // For modal

    const childName = selectedProfile?.name || 'Your Child';
    const deficiencies = selectedProfile?.wellnessAnalysis?.deficiencies || {};
    
    // Extract active child deficiencies (severity RED or ORANGE)
    const activeDeficiencies = Object.keys(deficiencies).filter(
        key => deficiencies[key]?.severity === 'RED' || deficiencies[key]?.severity === 'ORANGE'
    );

    const handleOpenResource = (resource) => setSelectedResource(resource);
    const handleCloseResource = () => setSelectedResource(null);

    const toggleSave = (id) => {
        setSavedResources(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
                toast.success('Removed from Saved Resources');
            } else {
                newSet.add(id);
                toast.success('Added to Saved Resources');
            }
            return newSet;
        });
    };

    const [showSavedOnly, setShowSavedOnly] = useState(false);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setShowSavedOnly(filter === 'Saved Resources');
    };

    // Hardcoded Rich Pediatric Guides (ICMR-NIN 2024 & WHO Grounded)
    const guides = [
        { 
            id: 'g1', 
            title: 'The Iron-Rich Masterlist & Bioavailability', 
            description: 'Traditional Indian superfoods, cast-iron cooking, and ascorbic acid pairings to prevent childhood fatigue.', 
            tags: ['Mineral Focus', 'Vegetarian'], 
            deficiencyMatches: ['iron'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Iron shortfall (anemia) is one of the most widespread nutritional gaps in Indian school children, leading to low stamina, poor concentration, and reduced immunity. In a vegetarian Indian diet, non-heme (plant-based) iron requires specific bioavailability enhancers.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. Top Desi Iron Superfoods</h4>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Sprouted Ragi (Finger Millet):</strong> Naturally loaded with non-heme iron and calcium. Sprouting breaks down phytates to double iron absorption.</li>
                        <li><strong>Spinach & Moringa (Drumstick Leaves):</strong> Exceptional plant iron sources. Steam lightly to deactivate oxalates.</li>
                        <li><strong>Beetroot & Organic Jaggery:</strong> Natural hematinic boosters that encourage red blood cell hemoglobin synthesis.</li>
                        <li><strong>Sesame Seeds (Til) & Roasted Chana:</strong> Concentrated trace minerals and amino acids for daily snacking.</li>
                        <li><strong>Yellow Moong & Green Sprouted Pulses:</strong> High bioavailable plant protein with zero gas or indigestion.</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Golden Rule: Ascorbic Acid (Vitamin C) Synergy</h4>
                    <p class="leading-relaxed font-medium">Plant-based non-heme iron requires an acidic carrier to reduce ferric iron into easily absorbable ferrous ions. Always squeeze fresh lemon juice over cooked dals and greens just before serving, or pair lunch with oranges, sweet limes, or fresh amla.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. Cook in Cast-Iron (Kadhai)</h4>
                    <p class="leading-relaxed font-medium">Cooking dry vegetables and lentil preparations in traditional cast-iron cookware releases elemental iron into food, boosting meal iron content up to 3 to 5 times naturally.</p>
                </div>
            `
        },
        { 
            id: 'g2', 
            title: 'The Cereal-Pulse 3:1 Amino Acid Ratio', 
            description: 'Understanding the ICMR standard for creating complete, high-biological value proteins from Indian kitchen staples.', 
            tags: ['Growth', 'Vegetarian'], 
            deficiencyMatches: ['protein'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Cereals (wheat, rice, millets) are naturally low in lysine but high in methionine. Pulses (dals, legumes) are high in lysine but low in methionine. Combining them creates a complete protein that equals egg and dairy quality!</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The 3:1 Proportional Rule</h4>
                    <p class="leading-relaxed font-medium">According to the National Institute of Nutrition (NIN), every meal should maintain roughly a 3:1 cereal-to-pulse ratio. Classic examples:</p>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Moong Dal Khichdi:</strong> 3 parts rice/millet + 1 part yellow moong dal with cow ghee.</li>
                        <li><strong>Idli & Sambar:</strong> 3 parts parboiled rice + 1 part urad dal.</li>
                        <li><strong>Phulka with Dal Tadka:</strong> 2 phulkas (wheat) paired with 1 deep bowl of toor or chana dal.</li>
                        <li><strong>Ragi & Moong Cheela:</strong> Sprouted finger millet flour mixed with pureed soaked moong.</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. Why Complete Proteins Matter for Kids</h4>
                    <p class="leading-relaxed font-medium">Complete amino acid arrays trigger liver production of Insulin-like Growth Factor 1 (IGF-1), the primary biochemical messenger stimulating linear height velocity at bone growth plates.</p>
                </div>
            `
        },
        { 
            id: 'g3', 
            title: 'The Balanced Indian School Lunchbox', 
            description: 'Strategies to pack high-nutrient Indian lunches that stay warm, crisp, and fresh until school recess.', 
            tags: ['Lunchbox', 'School'], 
            deficiencyMatches: ['protein', 'fiber'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Packing a lunchbox that retains warmth, texture, and high nutritional density after 4 hours inside a backpack is a daily priority for parents. Here is our pediatrician-tested framework.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The Soft Roti & Paratha Secret</h4>
                    <p class="leading-relaxed font-medium">Avoid dry, brittle rotis. Knead whole wheat flour with lukewarm water mixed with a tablespoon of warm milk and 1 teaspoon of cold-pressed oil. Wrap cooked rotis in a clean cotton cloth before placing them in a stainless steel insulated box.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The 3-Section Tiffin Formula</h4>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Energy Complex Carbs (50%):</strong> Vegetable poha, paneer paratha, methi thepla, or vegetable pulao.</li>
                        <li><strong>Protein & Calcium Block (25%):</strong> Low-salt paneer cubes, boiled chana, roasted seed mix, or hard-boiled egg slices.</li>
                        <li><strong>Fresh Vitamins & Moisture (25%):</strong> Cucumber rounds, carrot batons, or fresh orange segments.</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. Eliminating Lunchbox Sogginess</h4>
                    <p class="leading-relaxed font-medium">Always let warm foods (like parathas, cutlets, or khichdi) cool down for 3-4 minutes to room temperature before locking the lid. This prevents steam condensation from creating soggy textures.</p>
                </div>
            `
        },
        { 
            id: 'g4', 
            title: 'Managing Picky Eating Desi Style', 
            description: 'Sensory adaptation, stealth grating, and positive mealtime psychology without plate battles.', 
            tags: ['Behavior', 'Tips'], 
            deficiencyMatches: [],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Picky eating is a normal developmental phase of childhood autonomy. Using familiar Indian culinary textures and calm sensory exposure helps overcome vegetable resistance naturally.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The "Stealth Grate" & Puree Delivery</h4>
                    <p class="leading-relaxed font-medium">If leafy greens or vegetables are rejected on sight, steam and finely puree bottle gourd (lauki), carrots, or spinach. Use this nutrient-dense puree as the base liquid to knead whole wheat dough or blend directly into yellow dal. Children receive the vitamins without texture aversion.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Dip & Finger Food Strategy</h4>
                    <p class="leading-relaxed font-medium">Children love autonomy and finger dipping. Cut savory cheelas, vegetable paneer tikkis, or whole-wheat strips into fun shapes and pair with mild mint-coriander yogurt or peanut-free seed chutneys.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. The 10-Exposure Habituation Rule</h4>
                    <p class="leading-relaxed font-medium">A child often needs to see a new food 8 to 12 times before tasting it willingly. Offer a tiny portion next to their favorite comfort food with zero pressure to finish it. Familiarity eliminates mealtime anxiety.</p>
                </div>
            `
        },
        { 
            id: 'g5', 
            title: 'Bone Mineralization & Height Velocity', 
            description: 'How calcium, phosphorus, Vitamin D3, and morning sunlight work together for linear skeletal growth.', 
            tags: ['Growth', 'Mineral Focus'], 
            deficiencyMatches: ['calcium', 'vitaminD'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Linear height growth is determined by active bone mineralization at epiphyseal growth plates. Calcium alone is insufficient without active Vitamin D3 and weight-bearing physical movement.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The Calcium-D3 Absorption Gateway</h4>
                    <p class="leading-relaxed font-medium">Dietary calcium from milk, curd, paneer, and sprouted ragi cannot pass through the intestinal wall without Vitamin D3. Ensure your child gets 20 to 30 minutes of outdoor morning sunlight exposure (between 8:00 AM and 9:30 AM) daily.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Magnesium & Zinc Synergy</h4>
                    <p class="leading-relaxed font-medium">Magnesium converts Vitamin D into its active form (calcitriol), while zinc stimulates osteoblast proliferation. Incorporate roasted foxnuts (makhana), pumpkin seeds, and bajra into evening snacks.</p>
                </div>
            `
        },
        { 
            id: 'g6', 
            title: 'Gut Microbiome & Fermented Indian Foods', 
            description: 'Strengthening pediatric digestion, immunity, and nutrient absorption with traditional fermented staples.', 
            tags: ['Gut Health', 'Doctor Recommended'], 
            deficiencyMatches: ['fiber'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Over 70% of a child's immune system resides in gut-associated lymphoid tissue (GALT). Traditional Indian fermented staples naturally replenish beneficial probiotics (Lactobacillus and Bifidobacterium).</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. Traditional Probiotic Staples</h4>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Fresh Homemade Set Curd (Dahi):</strong> Rich in live lactic cultures; improves mineral absorption and calms digestion.</li>
                        <li><strong>Chaas (Spiced Buttermilk):</strong> Churned with roasted cumin and mint; hydrates while coating the intestinal lining.</li>
                        <li><strong>Naturally Fermented Idli / Dosa Batter:</strong> Microbial fermentation increases B-complex vitamins (especially B12 & folate).</li>
                        <li><strong>Kanji (Fermented Black Carrot / Beetroot Drink):</strong> Traditional winter tonic loaded with anthocyanins and probiotics.</li>
                    </ul>
                </div>
            `
        }
    ];

    // Rich Indian Kid-Friendly Recipes
    const recipes = [
        { 
            id: 'r1', 
            title: 'Iron-Rich Palak Paneer Paratha', 
            prepTime: '20 mins', 
            nutrition: { iron: true, protein: true, calcium: true }, 
            deficiencyMatches: ['iron', 'protein', 'calcium'],
            image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A delicious, iron-dense stuffed flatbread that merges iron-rich spinach puree into whole wheat dough with a high-protein paneer stuffing.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Whole wheat flour (atta)</li>
                        <li>1/2 cup Spinach (Palak) leaves, blanched and pureed</li>
                        <li>1/2 cup Grated fresh low-salt Paneer</li>
                        <li>1/4 tsp Carom seeds (Ajwain)</li>
                        <li>1/4 tsp Roasted Jeera powder & pinch of turmeric</li>
                        <li>Salt to taste & 1 tsp Pure Cow Ghee for cooking</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Knead whole wheat flour, spinach puree, ajwain, and salt into a pliable soft green dough. Let it rest for 10 minutes.</li>
                        <li>In a bowl, mix grated paneer with jeera powder, turmeric, and a pinch of salt to prepare the stuffing.</li>
                        <li>Roll out a dough ball, place 2 tablespoons of paneer stuffing in center, seal edges, and roll into a flat paratha.</li>
                        <li>Cook on a medium-hot tawa with a light coating of ghee until golden spots appear on both sides. Serve warm with fresh set curd!</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r2', 
            title: 'Masala Roasted Makhana (Foxnuts)', 
            prepTime: '10 mins', 
            nutrition: { protein: true, fiber: true, minerals: true }, 
            deficiencyMatches: ['protein', 'fiber', 'calcium'],
            image: 'https://images.unsplash.com/photo-1606491956689-2ea287bc2a54?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A crunchy, calcium and zinc heavy snack alternative to packaged chips. 100% nut-free and allergy safe for school snacking.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>2 cups Raw Foxnuts (Makhana)</li>
                        <li>1 tsp Pure Cow Ghee</li>
                        <li>1/4 tsp Turmeric (Haldi)</li>
                        <li>1/2 tsp Chaat Masala & pinch of rock salt</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Heat cow ghee in a heavy-bottomed kadhai on a low flame.</li>
                        <li>Add makhanas and roast on low heat for 7-10 minutes, stirring continuously until crisp and easily crushed between fingers.</li>
                        <li>Turn off heat, immediately sprinkle turmeric, rock salt, and chaat masala.</li>
                        <li>Toss well to evenly coat warm makhanas. Allow to cool completely before storing in an airtight glass container.</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r3', 
            title: 'Mango & Chia Seed Lassi Bowl', 
            prepTime: '05 mins', 
            nutrition: { fiber: true, protein: true, probiotics: true }, 
            deficiencyMatches: ['fiber', 'protein'],
            image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A refreshing, probiotic-rich lassi bowl loaded with fiber-dense chia seeds and fresh sweet mangoes. Excellent for gut flora and healthy bowel movement.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Fresh thick set curd (dahi)</li>
                        <li>1/2 cup Fresh ripe mango pulp</li>
                        <li>1 tbsp Chia seeds, soaked in water for 15 minutes</li>
                        <li>1 tsp Organic honey or jaggery powder</li>
                        <li>Toppings: Almond slivers & fresh pomegranate pearls</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Blend curd, mango pulp, and honey in a mixer into a thick, creamy lassi.</li>
                        <li>Pour the blended lassi into a wide serving bowl.</li>
                        <li>Stir in the soaked gelatinous chia seeds.</li>
                        <li>Garnish with almond slivers and ruby pomegranate pearls. Serve chilled!</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r4', 
            title: 'High-Protein Moong Dal Cheela with Veggies', 
            prepTime: '15 mins', 
            nutrition: { protein: true, iron: true, fiber: true }, 
            deficiencyMatches: ['protein', 'iron'],
            image: 'https://images.unsplash.com/photo-1626082927389-d609f427f715?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">Savory yellow moong dal crepes loaded with finely grated carrots and herbs. Delivers high bioavailable plant protein for school mornings.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Yellow Moong Dal, soaked for 2 hours and drained</li>
                        <li>1/4 cup Finely grated carrots and chopped bell peppers</li>
                        <li>1 tbsp Chopped fresh coriander</li>
                        <li>A pinch of Asafoetida (Hing) & ginger paste</li>
                        <li>Salt & 1 tsp cow ghee to cook</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Blend soaked dal, ginger, hing, and a splash of water into a smooth, pourable batter.</li>
                        <li>Stir in grated carrots, bell peppers, coriander, and salt.</li>
                        <li>Heat a tawa, pour a ladle of batter, and spread evenly into a circle.</li>
                        <li>Drizzle ghee around edges, cook until golden crisp, flip for 1 minute. Serve with sweet tomato chutney!</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r5', 
            title: 'Sprouted Ragi & Banana Sheera (Halwa)', 
            prepTime: '15 mins', 
            nutrition: { iron: true, calcium: true, energy: true }, 
            deficiencyMatches: ['iron', 'calcium'],
            image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A calcium and iron powerhouse sweet porridge sweetened naturally with ripe bananas and organic jaggery. Perfect for rapid growth spurts.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1/2 cup Sprouted Ragi flour</li>
                        <li>1 Ripe Banana, mashed</li>
                        <li>1.5 cups Warm Cow Milk or water</li>
                        <li>1.5 tbsp Organic Jaggery powder</li>
                        <li>1 tbsp Pure Cow Ghee & pinch of cardamom powder</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Heat cow ghee in a pan, add sprouted ragi flour and roast on low flame for 4-5 mins until aromatic.</li>
                        <li>Slowly whisk in warm milk to prevent lump formation. Stir continuously until thick.</li>
                        <li>Add mashed banana, jaggery powder, and cardamom powder.</li>
                        <li>Cook for 2 more minutes until sheera leaves the sides of the pan. Serve warm!</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r6', 
            title: 'Beetroot & Paneer High-Protein Tikkis', 
            prepTime: '20 mins', 
            nutrition: { iron: true, protein: true, zinc: true }, 
            deficiencyMatches: ['iron', 'protein'],
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">Vibrant ruby-red cutlets packed with iron-dense beetroot and crumbly paneer. Highly attractive and kid-approved finger food.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Boiled and grated Beetroot</li>
                        <li>3/4 cup Grated fresh Paneer</li>
                        <li>1 Boiled Potato (for binding)</li>
                        <li>2 tbsp Roasted Oats powder or roasted besan</li>
                        <li>1/2 tsp Chaat masala, jeera powder & salt</li>
                        <li>1 tbsp Cow ghee for pan shallow frying</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>In a large bowl, mash grated beetroot, paneer, and boiled potato together.</li>
                        <li>Add oats powder, chaat masala, jeera powder, and salt. Mix into a firm dough.</li>
                        <li>Shape into small round patties (tikkis).</li>
                        <li>Shallow fry on a hot tawa with a drizzle of ghee until crisp on both sides. Serve with mint curd dip!</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r7', 
            title: 'Sesame (Til) & Jaggery Bone-Builder Ladoos', 
            prepTime: '15 mins', 
            nutrition: { calcium: true, iron: true, zinc: true }, 
            deficiencyMatches: ['calcium', 'iron'],
            image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">Traditional Indian winter energy bites delivering dense organic calcium (975mg/100g til) and plant iron for rapid skeletal growth.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup White or Black Sesame Seeds (Til)</li>
                        <li>3/4 cup Grated Organic Jaggery</li>
                        <li>1 tbsp Cow Ghee</li>
                        <li>1/4 tsp Cardamom powder</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Dry roast sesame seeds on low heat until they lightly pop and release a nutty aroma (approx 3-4 minutes). Let cool.</li>
                        <li>Melt ghee and jaggery in a pan on low flame until jaggery is completely liquid and frothy.</li>
                        <li>Turn off heat, quickly fold in roasted sesame seeds and cardamom powder.</li>
                        <li>Grease palms with a drop of ghee and roll warm mixture into small bite-sized ladoos. Store for up to 3 weeks.</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r8', 
            title: 'Drumstick Leaves (Moringa) Dal Tadka', 
            prepTime: '20 mins', 
            nutrition: { iron: true, protein: true, vitaminA: true }, 
            deficiencyMatches: ['iron', 'protein'],
            image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">Moringa leaves deliver 4x the bioavailable iron of spinach with high plant amino acids. Merged with yellow moong dal for gentle digestion.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1/2 cup Yellow Moong Dal + 1/4 cup Toor Dal</li>
                        <li>1 cup Fresh Moringa (Drumstick) leaves, washed and picked</li>
                        <li>1/2 tsp Turmeric & salt to taste</li>
                        <li>Tadka: 1 tsp Ghee, 1/2 tsp Cumin seeds, pinch of Hing</li>
                        <li>1 tbsp Fresh Lemon Juice (Vitamin C carrier)</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Step-by-Step Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Pressure cook moong dal, toor dal, turmeric, and 2 cups water for 3 whistles until soft.</li>
                        <li>In a kadhai, heat ghee, add cumin seeds, hing, and fresh moringa leaves. Saute for 2 minutes.</li>
                        <li>Pour in cooked dal, season with salt, and simmer for 3 minutes.</li>
                        <li>Turn off heat, squeeze fresh lemon juice over dal right before serving to optimize non-heme iron absorption. Pair with steamed rice!</li>
                    </ol>
                </div>
            `
        }
    ];

    const tips = [
        { 
            id: 't1', 
            title: 'Encouraging Veggie Eating', 
            preview: 'How to sneak vegetables into parathas and dals without mealtime tantrums.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Many children go through a phase of food rejection. Use the "sneak-in" method: steam and puree carrots, bottle gourd, or pumpkin and mix it directly into the dal base or knead it into roti dough. Also, offer small servings next to their favorites so they get used to seeing them without pressure.</p>
                </div>
            `
        },
        { 
            id: 't2', 
            title: 'Desi Meal Prep for Busy Weeks', 
            preview: 'Prepping batters and chutneys for a week of nutritious Indian breakfasts.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Prepare standard dosa/idli batters, sprouted moong, or green chutneys during the weekend. Freeze curry paste cubes (onion, tomato, ginger-garlic) in ice trays. Pop a cube during the week to cook fresh nutritious dals and vegetables in under 10 minutes.</p>
                </div>
            `
        },
        { 
            id: 't3', 
            title: 'Decoding Indian Food Labels', 
            preview: 'Identifying hidden sugars and palm oil in popular store-bought kids snacks.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Packaged foods marketed as "healthy for kids" often contain high sugar and palm oil. Read the ingredients list: if maltodextrin, high-fructose corn syrup, refined wheat flour (maida), or palm oil are in the first three ingredients, choose an alternative. Check total sugars, not just "added sugars".</p>
                </div>
            `
        },
        { 
            id: 't4', 
            title: 'Healthy Snacking During Indian Festivals', 
            preview: 'Smart swaps for Diwali and Holi sweets to keep glycemic load balanced.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Make laddoos using dates, dried figs, or organic jaggery instead of refined white sugar. Give children a high-fiber snack (like almonds or curd) before leaving for festive gatherings to prevent overindulging on deep-fried snacks.</p>
                </div>
            `
        },
    ];

    // Filter Logic
    const filterResource = (resource) => {
        if (showSavedOnly) return savedResources.has(resource.id);
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Under 20 mins') return resource.prepTime && parseInt(resource.prepTime) <= 20;
        
        if (resource.tags && resource.tags.includes(activeFilter)) return true;
        
        if (activeFilter === 'Desi Toddler-friendly' && (resource.id === 'r1' || resource.id === 'r2' || resource.id === 'r5')) return true;
        if (activeFilter === 'Doctor Recommended' && (resource.id === 'g1' || resource.id === 'g2' || resource.id === 'g5' || resource.id === 'r4' || resource.id === 'r7' || resource.id === 'r8')) return true;
        if (activeFilter === 'High Iron' && (resource.id === 'r1' || resource.id === 'r4' || resource.id === 'r5' || resource.id === 'r6' || resource.id === 'r7' || resource.id === 'r8')) return true;
        return false;
    };

    const filteredGuides = guides.filter(filterResource);
    const filteredRecipes = recipes.filter(filterResource);
    const filteredTips = tips.filter(filterResource);

    // Check if a guide or recipe matches any child deficiency
    const isRecommended = (item) => {
        if (!item.deficiencyMatches) return false;
        return item.deficiencyMatches.some(def => activeDeficiencies.includes(def));
    };

    return (
        <div className="space-y-8 pb-12">
            {/* 1. Hero Section - Official Clinical & Government Nutrition Guidance Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-blue-100 dark:border-slate-700 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 max-w-4xl space-y-6">
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-blue-200/40 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            Official Guidelines
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200/40">
                            🍀 ICMR-NIN 2024 Standards
                        </span>
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-amber-200/40">
                            🇮🇳 Government Nutrition Portals
                        </span>
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                            Essential Pediatric Nutrition Resources & Growth Education
                        </h1>
                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            Understanding scientific nutrition standards from the <strong>Indian Council of Medical Research (ICMR)</strong> and the <strong>National Institute of Nutrition (NIN)</strong> empowers parents to track growth velocity, prevent micronutrient gaps, and cook healthy traditional Indian meals.
                        </p>
                    </div>

                    {/* ICMR-NIN Clinical Guidance Banner for Parents */}
                    <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl p-6 border border-blue-200/60 dark:border-slate-700/60 shadow-sm space-y-4">
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex-shrink-0">
                                <span className="material-symbols-outlined text-2xl">menu_book</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    Why Parents Must Follow ICMR-NIN Dietary Guidelines (2024)
                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        Evidence-Based
                                    </span>
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                    According to the <strong>ICMR-National Institute of Nutrition (NIN)</strong>, pediatric growth requires precise micronutrient density to eliminate "hidden hunger" and support cognitive development. Key clinical pillars include:
                                </p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-emerald-500 font-black">✓</span>
                                        <span><strong>Cereal-Pulse 3:1 Ratio:</strong> Complete essential amino acids for tissue repair.</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-emerald-500 font-black">✓</span>
                                        <span><strong>Iron + Vitamin C Synergy:</strong> Squeezing lemon over dals boosts iron absorption by 300%.</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-emerald-500 font-black">✓</span>
                                        <span><strong>Calcium + Vitamin D3:</strong> Daily active outdoor play and milk optimize linear height growth.</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-emerald-500 font-black">✓</span>
                                        <span><strong>Regional Indian Millets:</strong> Ragi, Jowar & Bajra provide ancient insoluble fiber and trace zinc.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Official Government & ICMR Nutrition Portals */}
                        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">link</span>
                                Official Government & ICMR Nutrition Portals:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                <a
                                    href="https://www.nin.res.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                            ICMR - NIN India
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dietary Guidelines for Indians</p>
                                    </div>
                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">open_in_new</span>
                                </a>

                                <a
                                    href="https://poshanabhiyaan.gov.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                            POSHAN Abhiyaan
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">National Nutrition Mission (MWCD)</p>
                                    </div>
                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">open_in_new</span>
                                </a>

                                <a
                                    href="https://eatrightindia.gov.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                            Eat Right India
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">FSSAI Healthy Diet Initiative</p>
                                    </div>
                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">open_in_new</span>
                                </a>

                                <a
                                    href="https://www.mohfw.gov.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                            MoHFW India
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Ministry of Health & Family Welfare</p>
                                    </div>
                                    <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">open_in_new</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Premium Tabbed Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {[
                    { id: 'growth', label: 'Growth Charts & Velocity', icon: 'timeline' },
                    { id: 'guides', label: 'Nutrition Guides', icon: 'menu_book' },
                    { id: 'recipes', label: 'Recipe Corner', icon: 'restaurant_menu' },
                    { id: 'portions', label: 'Portion Visualizer', icon: 'scale' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setActiveFilter('All');
                            setShowSavedOnly(false);
                        }}
                        className={`flex-1 md:flex-none py-4 px-6 font-black text-sm transition-all border-b-2 flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 3. Filter Bar (Shown for Guides and Recipes) */}
            {(activeTab === 'guides' || activeTab === 'recipes') && (
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => handleFilterChange('Saved Resources')}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                activeFilter === 'Saved Resources'
                                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">favorite</span>
                            Saved
                        </button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        
                        {(activeTab === 'recipes' 
                            ? ['All', 'Under 20 mins', 'Desi Toddler-friendly', 'Doctor Recommended', 'High Iron']
                            : ['All', 'Mineral Focus', 'Growth', 'School', 'Gut Health', 'Behavior']
                        ).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => handleFilterChange(filter)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeFilter === filter
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Tab Content Rendering */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Tab 1: Growth Charts & Velocity */}
                        {activeTab === 'growth' && (
                            <GrowthChartGuide />
                        )}

                        {/* Tab 2: Nutrition Guides & Tips */}
                        {activeTab === 'guides' && (
                            <div className="space-y-12">
                                <section>
                                    <div className="flex justify-between items-end mb-6">
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Evidence-Based Indian Nutrition Guides</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredGuides.length > 0 ? (
                                            filteredGuides.map(guide => (
                                                <GuideCard
                                                    key={guide.id}
                                                    {...guide}
                                                    recommended={isRecommended(guide)}
                                                    isSaved={savedResources.has(guide.id)}
                                                    onToggleSave={() => toggleSave(guide.id)}
                                                    onClick={() => handleOpenResource(guide)}
                                                />
                                            ))
                                        ) : (
                                            <div className="col-span-full py-8 text-center text-slate-500 italic font-medium">
                                                No guides matching filter found. Click the heart icon on any card to save it!
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Parenting Tips & Tricks</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredTips.length > 0 ? (
                                            filteredTips.map(tip => (
                                                <TipCard
                                                    key={tip.id}
                                                    {...tip}
                                                    isSaved={savedResources.has(tip.id)}
                                                    onToggleSave={() => toggleSave(tip.id)}
                                                    onClick={() => handleOpenResource(tip)}
                                                />
                                            ))
                                        ) : (
                                            <div className="col-span-full py-8 text-center text-slate-500 italic font-medium">
                                                No saved parenting tips found.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Tab 3: Recipe Corner */}
                        {activeTab === 'recipes' && (
                            <section>
                                <div className="flex justify-between items-end mb-6">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Step-by-Step Healthy Indian Recipes</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {filteredRecipes.length > 0 ? (
                                        filteredRecipes.map(recipe => (
                                            <RecipeCard
                                                key={recipe.id}
                                                {...recipe}
                                                recommended={isRecommended(recipe)}
                                                isSaved={savedResources.has(recipe.id)}
                                                onToggleSave={() => toggleSave(recipe.id)}
                                                onClick={() => handleOpenResource(recipe)}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-8 text-center text-slate-500 italic font-medium">
                                            No recipes matching filter found.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Tab 4: Portion Visualizer */}
                        {activeTab === 'portions' && (
                            <section>
                                <PortionGuide />
                            </section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Resource Detail Modal */}
            <ResourceModal
                isOpen={!!selectedResource}
                onClose={handleCloseResource}
                resource={selectedResource}
                isSaved={selectedResource ? savedResources.has(selectedResource.id) : false}
                onToggleSave={() => selectedResource && toggleSave(selectedResource.id)}
            />
        </div>
    );
};

export default ResourcesLibrary;
