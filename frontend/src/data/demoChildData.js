// Simulated Demo Child Profile for NutriKids Guest Mode
// This dataset is completely isolated in-memory and never calls or mutates any production database.

export const DEMO_CHILD_PROFILE = {
    _id: 'demo-child-ananya-sharma',
    name: 'Ananya Sharma',
    dob: '2019-03-15',
    age: 7,
    gender: 'female',
    bloodGroup: 'B+',
    height: 118, // cm
    weight: 21.4, // kg
    waistCircumference: 54, // cm
    bmi: 15.4, // kg/m²
    bmiCategory: 'Healthy & Normal Weight',
    bmiPercentile: 58,
    activityLevel: 'Moderate',
    dailyCalorieTarget: 1650,
    dailyCaloriesConsumed: 1360,
    hydrationTarget: 1500, // ml
    hydrationCurrent: 1100, // ml
    sleepTarget: 9.0, // hours
    sleepActual: 9.2, // hours
    parentName: 'Sneha Sharma (Mother)',
    location: {
        address: 'Sector 45, Green Park Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
    },
    goals: {
        primary: 'Optimal Height Growth & Immune Support',
        secondary: 'Healthy Cognitive Focus & Sports Energy',
    },
    allergies: [
        {
            id: 'allergy-1',
            allergen: 'Peanuts & Tree Nuts',
            severity: 'Severe (Type I)',
            reaction: 'Mild Hives / Airway Irritation',
            actionPlan: 'Strict nut-free meal protocol. Antihistamine on hand.',
            diagnosedDate: '2022-06-10',
        },
        {
            id: 'allergy-2',
            allergen: 'Artificial Food Colors (Red 40)',
            severity: 'Moderate',
            reaction: 'Skin Flush / Mild Eczema flare',
            actionPlan: 'Avoid processed confectionery and synthetic beverages.',
            diagnosedDate: '2023-01-14',
        }
    ],
    medicalBackground: {
        chronicConditions: ['None reported'],
        pastSurgeries: ['None'],
        vaccinations: [
            { name: 'MMR Booster', status: 'Completed', date: '2024-04-12' },
            { name: 'DTP Booster', status: 'Completed', date: '2024-04-12' },
            { name: 'Annual Flu Vaccine', status: 'Completed', date: '2025-10-05' },
        ],
        pediatrician: {
            name: 'Dr. Priya Kulkarni, MD',
            hospital: 'Rainbow Children’s Hospital',
            specialization: 'Pediatric Growth & Endocrinology',
            lastCheckup: '2026-01-18',
            notes: 'Excellent motor development and steady growth along the 58th percentile curve. Maintain iron-rich legumes and calcium fortified diet.',
        },
    },
    growthHistory: [
        { date: '2024-03-15', ageYears: 5.0, height: 108.5, weight: 17.6, bmi: 14.9, percentile: 52 },
        { date: '2024-09-15', ageYears: 5.5, height: 111.0, weight: 18.5, bmi: 15.0, percentile: 54 },
        { date: '2025-03-15', ageYears: 6.0, height: 113.8, weight: 19.4, bmi: 15.0, percentile: 55 },
        { date: '2025-09-15', ageYears: 6.5, height: 116.0, weight: 20.4, bmi: 15.2, percentile: 56 },
        { date: '2026-03-01', ageYears: 7.0, height: 118.0, weight: 21.4, bmi: 15.4, percentile: 58 },
    ],
    macros: {
        protein: { current: 44, target: 48, unit: 'g', pct: 91 },
        carbs: { current: 188, target: 210, unit: 'g', pct: 89 },
        fats: { current: 39, target: 45, unit: 'g', pct: 86 },
        fiber: { current: 19, target: 22, unit: 'g', pct: 86 },
    },
    micros: [
        { name: 'Calcium', current: 740, target: 800, unit: 'mg', pct: 92, icon: 'shield', source: 'Milk, Yogurt & Ragi' },
        { name: 'Iron', current: 9.4, target: 10, unit: 'mg', pct: 94, icon: 'favorite', source: 'Spinach, Lentils & Jaggery' },
        { name: 'Vitamin D', current: 520, target: 600, unit: 'IU', pct: 86, icon: 'wb_sunny', source: 'Sunlight & Fortified Milk' },
        { name: 'Vitamin C', current: 42, target: 45, unit: 'mg', pct: 93, icon: 'eco', source: 'Oranges, Guava & Amla' },
        { name: 'Zinc', current: 5.8, target: 6.0, unit: 'mg', pct: 96, icon: 'vital_signs', source: 'Pumpkin Seeds & Chickpeas' },
        { name: 'Omega-3 (DHA)', current: 210, target: 250, unit: 'mg', pct: 84, icon: 'psychology', source: 'Chia Seeds & Walnuts' },
    ],
    todayMeals: [
        {
            id: 'm-1',
            time: '08:15 AM',
            mealType: 'Breakfast',
            name: 'Warm Rolled Oats Porridge with Blueberries & Chia Seeds',
            calories: 320,
            macros: { p: 9, c: 54, f: 6 },
            tags: ['High Fiber', 'Antioxidant Boost'],
            icon: 'bakery_dining',
        },
        {
            id: 'm-2',
            time: '01:15 PM',
            mealType: 'Lunch',
            name: 'Moong Dal Khichdi with Steamed Carrots, Beans & Homemade Curd',
            calories: 460,
            macros: { p: 16, c: 68, f: 12 },
            tags: ['Gut-Friendly', 'Complete Protein'],
            icon: 'soup_kitchen',
        },
        {
            id: 'm-3',
            time: '04:45 PM',
            mealType: 'Afternoon Snack',
            name: 'Crisp Royal Gala Apple Slices with Roasted Sunflower Butter',
            calories: 170,
            macros: { p: 4, c: 26, f: 7 },
            tags: ['Nut-Free Safe', 'Sustained Energy'],
            icon: 'nutrition',
        },
        {
            id: 'm-4',
            time: '07:45 PM',
            mealType: 'Dinner',
            name: 'Whole Wheat Paneer Roti Wraps with Mild Spinach Gravy',
            calories: 410,
            macros: { p: 15, c: 40, f: 14 },
            tags: ['Calcium Powerhouse', 'Rich Iron'],
            icon: 'dinner_dining',
        },
    ],
    waterLogs: [
        { time: '08:00 AM', amount: 250, note: 'Morning wake-up glass' },
        { time: '11:00 AM', amount: 250, note: 'School break sip' },
        { time: '01:30 PM', amount: 300, note: 'Post lunch hydration' },
        { time: '05:00 PM', amount: 300, note: 'After playground cycling' },
    ],
    sleepHistory: [
        { date: 'Yesterday', bedtime: '09:00 PM', wakeTime: '06:15 AM', duration: 9.25, quality: 'Deep & Restful (94%)' },
        { date: '2 Days Ago', bedtime: '09:15 PM', wakeTime: '06:15 AM', duration: 9.0, quality: 'Restful (90%)' },
        { date: '3 Days Ago', bedtime: '08:50 PM', wakeTime: '06:00 AM', duration: 9.15, quality: 'Deep & Restful (95%)' },
        { date: '4 Days Ago', bedtime: '09:30 PM', wakeTime: '06:30 AM', duration: 9.0, quality: 'Good (88%)' },
    ],
    activityLogs: [
        { date: 'Today', type: 'Outdoor Cycling & Tag in Green Park', duration: 45, intensity: 'Moderate to Vigorous', caloriesBurned: 130, icon: 'pedal_bike' },
        { date: 'Today', type: 'School Gymnastics & Physical Education', duration: 30, intensity: 'Moderate', caloriesBurned: 95, icon: 'fitness_center' },
        { date: 'Yesterday', type: 'Swimming Practice (Kids Intermediate)', duration: 40, intensity: 'Vigorous', caloriesBurned: 160, icon: 'pool' },
    ],
    aiInsights: {
        headline: "Ananya is exhibiting healthy growth velocity with balanced micronutrient absorption.",
        recommendations: [
            "Maintain current calcium intake (92% of target) to support active bone mineral density during the 7-year growth spurt.",
            "Continue strict nut-free substitution with sunflower and pumpkin seed butters.",
            "Excellent sleep consistency (average 9.1 hours) correlates with high daytime focus and energy balance.",
        ]
    }
};
