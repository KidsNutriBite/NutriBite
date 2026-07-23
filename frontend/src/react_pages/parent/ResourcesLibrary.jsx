"use client";
import React, { useState } from 'react';
import GuideCard from '../../components/resources/GuideCard';
import RecipeCard from '../../components/resources/RecipeCard';
import TipCard from '../../components/resources/TipCard';
import ResourceModal from '../../components/resources/ResourceModal';
import PortionGuide from '../../components/resources/PortionGuide';
import FamilyDietPlan, { downloadPlanAsPDF } from '../../components/resources/FamilyDietPlan';
import { getChildDietPlan } from '../../api/profile.api';
import { useProfile } from '../../context/ProfileContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ResourcesLibrary = () => {
    const { selectedProfile, profiles, selectedProfileId, changeProfile } = useProfile();
    const [activeTab, setActiveTab] = useState('guides'); // guides, recipes, portions, dietplan
    const [activeFilter, setActiveFilter] = useState('All');
    const [savedResources, setSavedResources] = useState(new Set());
    const [selectedResource, setSelectedResource] = useState(null); // For modal
    const [downloading, setDownloading] = useState(false);

    const childName = selectedProfile?.name || 'Your Child';

    const handleDownloadChildPlan = async () => {
        if (!selectedProfile?._id) {
            toast.error('No child profile selected');
            return;
        }
        try {
            setDownloading(true);
            toast.loading('Generating child-specific diet plan using AI Nutrition Engine...', { id: 'diet-plan-loader' });
            const res = await getChildDietPlan(selectedProfile._id);
            toast.dismiss('diet-plan-loader');
            const plan = res.data?.weeklyPlan || res.weeklyPlan;
            if (!plan || plan.length === 0) {
                toast.error('Failed to parse diet plan');
                return;
            }
            downloadPlanAsPDF(childName, plan);
            toast.success('Diet plan generated successfully!');
        } catch (err) {
            toast.dismiss('diet-plan-loader');
            console.error('Error downloading child plan:', err);
            toast.error('Failed to generate diet plan');
        } finally {
            setDownloading(false);
        }
    };
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

    // Hardcoded Data with Rich Content (No placeholders)
    const guides = [
        { 
            id: 'g1', 
            title: 'The Iron-Rich Masterlist', 
            description: 'Traditional Indian superfoods and cooking techniques to maximize iron absorption for your child.', 
            tags: ['Mineral Focus', 'Vegetarian'], 
            deficiencyMatches: ['iron'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Iron deficiency (anemia) is one of the most common nutritional gaps in growing children, leading to low energy levels, reduced immunity, and concentration issues. In an Indian dietary context, maximizing non-heme (plant-based) iron absorption is key.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. Top Desi Iron Superfoods</h4>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Ragi (Finger Millet):</strong> Naturally loaded with iron and calcium. Perfect for porridge, dosas, or laddoos.</li>
                        <li><strong>Spinach & Green Leafy Vegetables:</strong> A solid source of iron. Steam slightly to release oxalates and boost digestibility.</li>
                        <li><strong>Beetroot:</strong> Promotes red blood cell production. Juice it with sweet lime or grate into paratha fillings.</li>
                        <li><strong>Sesame Seeds (Til) & Jaggery:</strong> High iron sweet combination. Excellent as weekly treats (chikkis).</li>
                        <li><strong>Sprouted Legumes (Moong, Chana):</strong> Sprouting doubles the iron bioavailability for growing bodies.</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Golden Rule: Pair with Vitamin C</h4>
                    <p class="leading-relaxed font-medium">Plant-based iron needs an acidic helper to absorb. Always squeeze fresh lemon juice over cooked dals and greens, or pair iron-rich meals with Vitamin C fruits like sweet limes, oranges, or amla.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. Cook in Cast Iron (Kadhai)</h4>
                    <p class="leading-relaxed font-medium">An age-old Indian kitchen practice that is clinically verified: cooking dry sabzis and dals in cast-iron kadhais increases the iron content of your meals up to 3 to 5 times.</p>
                </div>
            `
        },
        { 
            id: 'g2', 
            title: 'The Balanced Indian Lunchbox', 
            description: 'Quick strategies to pack nutrition-dense Indian lunches that stay fresh and tasty until recess.', 
            tags: ['Lunchbox', 'School'], 
            deficiencyMatches: ['protein'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Packing a lunchbox that is highly nutritious, kid-approved, and stays palatable after four hours in a backpack is a daily challenge. Here is our pediatrician-approved packing framework.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The Roti Softness Hack</h4>
                    <p class="leading-relaxed font-medium">Avoid rubbery, dry rotis. Knead the atta flour using lukewarm water mixed with a tablespoon of warm milk and a teaspoon of oil. Wrap cooked rotis in a clean cotton cloth before placing them in the tiffin box.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Three-Section Formula</h4>
                    <ul class="list-disc pl-5 space-y-1.5 font-bold text-sm">
                        <li><strong>Energy Carb (50%):</strong> Atta parathas, vegetable poha, idlis, or vegetable pulao.</li>
                        <li><strong>Protein / Growing Block (25%):</strong> Mild paneer cubes, boiled chana, roasted peanuts, or egg slices.</li>
                        <li><strong>Vitamins & Freshness (25%):</strong> Sliced cucumbers, carrots, apple chunks, or grapes.</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. Preventing Soggy Lunches</h4>
                    <p class="leading-relaxed font-medium">Always let warm foods (like parathas or khichdi) cool completely to room temperature before locking the box lid. This stops steam from condensing and turning lunches soggy.</p>
                </div>
            `
        },
        { 
            id: 'g3', 
            title: 'Managing Picky Eating Desi Style', 
            description: 'How to introduce new textures and flavors using familiar Indian spices and comfort foods.', 
            tags: ['Behavior', 'Tips'], 
            deficiencyMatches: [],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Picky eating is a normal behavioral phase, but it can be exhausting. Here are traditional Indian parenting approaches to introduce healthy foods successfully.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. The Puree & Grate Stealth Method</h4>
                    <p class="leading-relaxed font-medium">If vegetables are rejected, steam and finely puree bottle gourd (lauki), carrots, or spinach. Use this nutrient-dense puree as the base liquid to knead wheat roti dough or to cook dals. They get the vitamins without sorting them out.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. The Dip & Play Concept</h4>
                    <p class="leading-relaxed font-medium">Children love finger foods and dipping. Cut vegetables, paneer, or cheela into fun shapes and serve them alongside mild yogurt-coriander dips or peanut chutneys. Making meals interactive decreases plate anxiety.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">3. Avoid Forced Plates</h4>
                    <p class="leading-relaxed font-medium">Avoid mealtime pressure. Instead of commanding they finish their vegetables, offer a choice: "Do you want spinach paratha or carrot chilla today?" Giving children agency boosts cooperative eating.</p>
                </div>
            `
        },
        { 
            id: 'g4', 
            title: 'Understanding Growth & BMI', 
            description: 'A parent\'s guide to interpreting growth charts in the Indian context.', 
            tags: ['Growth', 'Medical'], 
            deficiencyMatches: ['calcium', 'vitaminD'],
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="leading-relaxed font-medium">Growth charts visualize physical height, weight, and skeletal development. Understanding how to read percentiles is vital to tracking healthy growth velocity.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">1. Percentiles Demystified</h4>
                    <p class="leading-relaxed font-medium">If your child is in the 40th percentile for height, it simply means they are taller than 40% of children of the same age and gender. What matters most is consistency over time—a steady, progressive curve rather than climbing to the top percentile.</p>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">2. Growth Spurts & Calcium Demands</h4>
                    <p class="leading-relaxed font-medium">During rapid growth spurts, children experience "growing pains" in their legs. This is a vital period to step up calcium and Vitamin D intakes to support skeletal calcification and overall height gains.</p>
                </div>
            `
        },
    ];

    const recipes = [
        { 
            id: 'r1', 
            title: 'Iron-Rich Palak Paneer Paratha', 
            prepTime: '20 mins', 
            nutrition: { iron: true, protein: true }, 
            deficiencyMatches: ['iron', 'protein'],
            image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A delicious, iron-dense stuffed flatbread that merges green iron-rich spinach (non-heme iron) and soft paneer (protein and calcium) into an easily acceptable breakfast or school tiffin box.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Whole wheat flour (atta)</li>
                        <li>1/2 cup Spinach (Palak) leaves, blanched and pureed</li>
                        <li>1/2 cup Grated fresh Paneer</li>
                        <li>1/4 tsp Carom seeds (Ajwain)</li>
                        <li>1/4 tsp Turmeric & Jeera powder</li>
                        <li>Salt to taste & 1 tsp Ghee for cooking</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Knead whole wheat flour, spinach puree, ajwain, and a pinch of salt into a soft green dough. Let it rest for 10 minutes.</li>
                        <li>In a small bowl, combine the grated paneer with turmeric, jeera powder, and salt to prepare the stuffing.</li>
                        <li>Roll out a small dough ball, place 2 tablespoons of paneer stuffing in the center, fold edges inward, and roll gently into a flat paratha.</li>
                        <li>Cook on a hot tawa with a light coating of ghee until golden spots appear on both sides. Serve warm with fresh curd.</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r2', 
            title: 'Masala Roasted Makhana (Foxnuts)', 
            prepTime: '10 mins', 
            nutrition: { protein: true, fiber: true }, 
            deficiencyMatches: ['protein', 'fiber', 'calcium'],
            image: 'https://images.unsplash.com/photo-1606491956689-2ea287bc2a54?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A crunchy, low-calorie, calcium-heavy snack alternative to packaged chips. Rich in minerals and excellent for keeping focus during studies.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>2 cups Raw Foxnuts (Makhana)</li>
                        <li>1 tsp Ghee</li>
                        <li>1/4 tsp Turmeric (Haldi)</li>
                        <li>1/2 tsp Chat Masala & salt to taste</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Heat ghee in a heavy-bottomed kadhai on a low flame.</li>
                        <li>Add the makhanas and roast on low heat for 7-10 minutes, stirring frequently until they become completely crispy and crack easily when pressed.</li>
                        <li>Turn off the heat. Immediately sprinkle the turmeric, salt, and chat masala.</li>
                        <li>Toss well to ensure the spices stick to the warm makhanas. Allow to cool completely before storing in an airtight jar.</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r3', 
            title: 'Mango & Chia Seed Lassi Bowl', 
            prepTime: '05 mins', 
            nutrition: { fiber: true, protein: true }, 
            deficiencyMatches: ['fiber', 'protein'],
            image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">A refreshing, probiotic-rich lassi bowl loaded with fiber-packed chia seeds and seasonal mangoes. Excellent for digestion and gut health.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Fresh curd (thick)</li>
                        <li>1/2 cup Ripened mango pulp (fresh)</li>
                        <li>1 tbsp Chia seeds, soaked in water for 15 minutes</li>
                        <li>1 tsp Honey or Jaggery powder</li>
                        <li>Toppings: Almond slivers & pomegranate seeds</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Blend curd, mango pulp, and honey into a smooth, thick lassi in a mixer.</li>
                        <li>Pour the blended lassi into a serving bowl.</li>
                        <li>Stir in the soaked gelatinous chia seeds.</li>
                        <li>Garnish with almond slivers and fresh pomegranate seeds. Serve chilled.</li>
                    </ol>
                </div>
            `
        },
        { 
            id: 'r4', 
            title: 'Moong Dal Chilla with Veggies', 
            prepTime: '15 mins', 
            nutrition: { protein: true, iron: true }, 
            deficiencyMatches: ['protein', 'iron'],
            image: 'https://images.unsplash.com/photo-1626082927389-d609f427f715?auto=format&fit=crop&q=80&w=800',
            content: `
                <div class="space-y-4 text-slate-600 dark:text-slate-300">
                    <p class="font-medium">High-protein, easily digestible moong dal crepes loaded with chopped, colorful vegetables. An ideal, energetic way to start a child's school morning.</p>
                    
                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Ingredients:</h4>
                    <ul class="list-disc pl-5 space-y-1 font-bold text-sm">
                        <li>1 cup Yellow Moong Dal, soaked for 2 hours and drained</li>
                        <li>1/4 cup Finely chopped onions, tomatoes, and bell peppers</li>
                        <li>1 tbsp Chopped coriander leaves</li>
                        <li>A pinch of Asafoetida (Hing) & Ginger paste</li>
                        <li>Salt & ghee to cook</li>
                    </ul>

                    <h4 class="text-base font-black text-slate-900 dark:text-white mt-4">Instructions:</h4>
                    <ol class="list-decimal pl-5 space-y-1.5 font-semibold text-sm">
                        <li>Blend the soaked dal, ginger paste, hing, and a little water into a smooth, pourable batter.</li>
                        <li>Pour batter into a bowl, mix in the finely chopped onions, tomatoes, peppers, coriander, and salt.</li>
                        <li>Heat a non-stick tawa, pour a ladle of batter and spread it in a thin circle.</li>
                        <li>Drizzle ghee around the edges and cook on medium heat until golden brown. Flip and cook for 1 minute on the other side. Serve with sweet tomato chutney.</li>
                    </ol>
                </div>
            `
        },
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
            title: 'Decoding Indian Labels', 
            preview: 'Identifying hidden additives in popular store-bought Indian snacks and drinks.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Packaged foods marketed as "healthy for kids" often contain high sugar and palm oil. Read the ingredients list: if maltodextrin, high-fructose corn syrup, refined wheat flour (maida), or palm oil are in the first three ingredients, choose an alternative. Check total sugars, not just "added sugars".</p>
                </div>
            `
        },
        { 
            id: 't4', 
            title: 'Healthy Snacking During Festivals', 
            preview: 'Smart swaps for Diwali and Holi sweets to keep sugar intake in check.',
            content: `
                <div class="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <p>Make laddoos using dates, dried figs, or organic jaggery instead of refined white sugar. Give children a high-fiber snack (like almonds or curd) before you leave for a festive dinner. This prevents overindulging in sweets and deep-fried snacks.</p>
                </div>
            `
        },
    ];

    // Filter Logic
    const filterResource = (resource) => {
        if (showSavedOnly) return savedResources.has(resource.id);
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Under 20 mins') return resource.prepTime && parseInt(resource.prepTime) <= 20;
        
        // Match specific tags
        if (resource.tags && resource.tags.includes(activeFilter)) return true;
        
        // Mock matching logic for specialty filters
        if (activeFilter === 'Desi Toddler-friendly' && (resource.id === 'r1' || resource.id === 'r2' || resource.id === 'g3')) return true;
        if (activeFilter === 'Doctor Recommended' && (resource.id === 'g4' || resource.id === 'r4' || resource.id === 't3')) return true;
        if (activeFilter === 'Lactose Free' && (resource.id === 'r2' || resource.id === 'r4' || resource.id === 'g1')) return true;
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
            {/* 1. Hero Section - Dynamic Personalized Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-blue-100 dark:border-slate-700 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {activeDeficiencies.length > 0 ? (
                            activeDeficiencies.map(def => (
                                <span key={def} className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-red-200/40">
                                    🎯 {def.toUpperCase()} TARGETED
                                </span>
                            ))
                        ) : (
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200/40">
                                🍀 HOLISTIC GROWTH
                            </span>
                        )}
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-blue-200/40">
                            🇮🇳 Indian Cuisine Focus
                        </span>
                    </div>

                    <div className="mb-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Personalized Care for {childName}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                        Targeted Nutrition Support
                    </h1>
                    
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium">
                        Based on {childName}'s health parameters showing {activeDeficiencies.length > 0 ? `deficiencies in ${activeDeficiencies.join(', ')}` : 'healthy growth ranges'}, we have curated traditional Indian recipes, clinical portion guidelines, and developmental tips to support their daily vitality.
                    </p>

                    <div className="flex flex-col gap-6 mt-2 relative z-20">
                        {/* Profile switcher pills next to download button area */}
                        {profiles && profiles.length > 0 && (
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="text-xs font-black text-[#4c799a] dark:text-slate-400 uppercase tracking-widest mr-1.5 flex items-center gap-1.5 select-none">
                                    <span className="material-symbols-outlined text-base">child_care</span>
                                    Switch Child Profile:
                                </span>
                                <div className="flex flex-wrap gap-2.5">
                                    {profiles.map(p => {
                                        const isSelected = selectedProfileId === p._id;
                                        return (
                                            <button
                                                key={p._id}
                                                onClick={() => changeProfile(p._id)}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-blue-600/25 scale-[1.03]' 
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-slate-500'
                                                }`}
                                            >
                                                {p.profileImage ? (
                                                    <img src={p.profileImage} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-[10px]">
                                                        👶
                                                    </div>
                                                )}
                                                <span>{p.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={handleDownloadChildPlan}
                                disabled={downloading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 w-full sm:w-auto"
                            >
                                <span className="material-symbols-outlined text-base">download</span>
                                {downloading ? 'Generating Plan...' : 'Download Weekly Plan (PDF)'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Premium Tabbed Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                {[
                    { id: 'guides', label: 'Guides & Tips', icon: 'menu_book' },
                    { id: 'recipes', label: 'Recipe Corner', icon: 'restaurant_menu' },
                    { id: 'portions', label: 'Portion Visualizer', icon: 'scale' },
                    { id: 'dietplan', label: 'Unified Family Diet Plan', icon: 'calendar_month' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            // Reset filter to All when switching tabs
                            setActiveFilter('All');
                            setShowSavedOnly(false);
                        }}
                        className={`flex-1 md:flex-none py-4 px-6 font-black text-sm transition-all border-b-2 flex items-center justify-center gap-2 uppercase tracking-wider ${
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

            {/* 3. Sticky Filter Bar (Only shown for Guides and Recipes) */}
            {(activeTab === 'guides' || activeTab === 'recipes') && (
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => handleFilterChange('Saved Resources')}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
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
                            ? ['All', 'Under 20 mins', 'Desi Toddler-friendly', 'Doctor Recommended', 'Lactose Free']
                            : ['All', 'Mineral Focus', 'School', 'Growth', 'Behavior']
                        ).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => handleFilterChange(filter)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
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
                        {/* Tab 1: Guides & Tips */}
                        {activeTab === 'guides' && (
                            <div className="space-y-12">
                                <section>
                                    <div className="flex justify-between items-end mb-6">
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Indian Nutrition Guides</h2>
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
                                                No saved guides found. Click the heart icon on any card to save it!
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

                        {/* Tab 2: Recipe Corner */}
                        {activeTab === 'recipes' && (
                            <section>
                                <div className="flex justify-between items-end mb-6">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Healthy Indian Recipes For You</h2>
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
                                            No saved recipes found.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Tab 3: Portion Visualizer */}
                        {activeTab === 'portions' && (
                            <section>
                                <PortionGuide />
                            </section>
                        )}

                        {/* Tab 4: Unified Family Diet Plan */}
                        {activeTab === 'dietplan' && (
                            <section className="-mx-4 md:mx-0">
                                <FamilyDietPlan />
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
