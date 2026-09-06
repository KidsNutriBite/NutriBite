// Simulated Demo Data for NutriKids Guest Mode
// Provides comprehensive, realistic pediatric nutrition & clinical data for an interactive walkthrough.

export const DEMO_CHILDREN = [
    {
        _id: 'demo-child-ananya-sharma',
        name: 'Ananya Sharma',
        dob: '2019-03-15',
        age: 7,
        gender: 'female',
        avatar: 'girl',
        bloodGroup: 'B+',
        height: 118, // cm
        weight: 21.4, // kg
        waistCircumference: 54, // cm
        bmi: 15.4, // kg/m²
        bmiCategory: 'Healthy & Normal Weight',
        bmiPercentile: 58,
        activityLevel: 'Active & Athletic',
        dailyCalorieTarget: 1650,
        dailyCaloriesConsumed: 1360,
        hydrationTarget: 1500, // ml
        hydrationCurrent: 1100, // ml
        sleepTarget: 9.0, // hours
        sleepActual: 9.25, // hours
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
        lastCheckup: {
            date: '2026-01-18',
            time: '10:30 AM',
            doctorName: 'Dr. Priya Kulkarni, MD (Pediatrics)',
            clinic: 'Rainbow Children’s Hospital',
            notes: 'Steady growth along the 58th percentile curve. Maintain iron-rich legumes and calcium fortified diet.',
        },
        allergies: [
            {
                id: 'allergy-1',
                allergen: 'Peanuts & Tree Nuts',
                severity: 'Severe (Type I)',
                reaction: 'Mild Hives / Airway Irritation',
                actionPlan: 'Strict nut-free protocol. EpiPen / Antihistamine on hand.',
                diagnosedDate: '2022-06-10',
            },
            {
                id: 'allergy-2',
                allergen: 'Synthetic Food Dyes (Red 40)',
                severity: 'Moderate',
                reaction: 'Skin Flush / Mild Eczema flare',
                actionPlan: 'Avoid processed confectionery and colored beverages.',
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
                { name: 'Typhoid Conjugate', status: 'Completed', date: '2025-11-20' },
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
            { name: 'Omega-3 (DHA)', current: 210, target: 250, unit: 'mg', pct: 84, icon: 'psychology', source: 'Chia Seeds & Flax' },
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
        prescriptions: [
            {
                id: 'pr-101',
                date: '2026-01-18',
                doctorName: 'Dr. Priya Kulkarni',
                diagnosis: 'Routine 7-Year Growth Assessment & Seasonal Allergy Review',
                notes: 'Height velocity is optimal. Continue multivitamin with zinc support during seasonal weather shifts.',
                nextCheckupDays: 90,
                medicines: [
                    { name: 'Pediatric Vitamin D3 Drops', dosage: '400 IU once daily', duration: '3 months' },
                    { name: 'Cetirizine Syrup (5mg/5ml)', dosage: '2.5ml SOS for allergic rhinitis', duration: 'As needed' }
                ]
            }
        ],
        wellnessDeficiencies: {
            iron: { severity: 'GREEN', level: 'Optimal (94%)', advice: 'Keep incorporating lentils and spinach.' },
            vitaminD: { severity: 'ORANGE', level: 'Mild Gap (86%)', advice: 'Increase morning outdoor play (15-20 mins).' },
            calcium: { severity: 'GREEN', level: 'Optimal (92%)', advice: 'Excellent dairy and ragi intake.' },
            zinc: { severity: 'GREEN', level: 'Optimal (96%)', advice: 'Sufficient through legumes and seeds.' },
        },
        digitalTwin: {
            metabolicRate: '1,420 kcal/day (Active)',
            growthVelocityScore: 92,
            skeletalDensityIndex: 'Normal (+0.4 SD)',
            hydrationEfficiency: 'High (82%)',
            immuneResilienceRating: 'Strong',
        },
        aiInsights: {
            headline: "Ananya is exhibiting healthy growth velocity with balanced micronutrient absorption.",
            recommendations: [
                "Maintain current calcium intake (92% of target) to support active bone mineral density during the 7-year growth spurt.",
                "Continue strict nut-free substitution with sunflower and pumpkin seed butters.",
                "Excellent sleep consistency (average 9.1 hours) correlates with high daytime focus and energy balance.",
            ]
        }
    },
    {
        _id: 'demo-child-aarav-sharma',
        name: 'Aarav Sharma',
        dob: '2022-08-20',
        age: 4,
        gender: 'male',
        avatar: 'boy',
        bloodGroup: 'O+',
        height: 102, // cm
        weight: 15.6, // kg
        waistCircumference: 49, // cm
        bmi: 15.0, // kg/m²
        bmiCategory: 'Healthy & Normal Weight',
        bmiPercentile: 50,
        activityLevel: 'High Energy Toddler',
        dailyCalorieTarget: 1300,
        dailyCaloriesConsumed: 1120,
        hydrationTarget: 1200, // ml
        hydrationCurrent: 950, // ml
        sleepTarget: 10.5, // hours
        sleepActual: 10.2, // hours
        parentName: 'Sneha Sharma (Mother)',
        location: {
            address: 'Sector 45, Green Park Avenue',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
        },
        goals: {
            primary: 'Overcome Picky Eating & Improve Iron Absorption',
            secondary: 'Consistent Sleep Schedule & Lactose-Friendly Nutrition',
        },
        lastCheckup: {
            date: '2025-11-10',
            time: '04:15 PM',
            doctorName: 'Dr. Rajesh Nair, MD (Pediatrics)',
            clinic: 'Aster CMI Hospital',
            notes: 'Slightly low ferritin levels noted. Advised fortified ragi porridge and fortified plant milks.',
        },
        allergies: [
            {
                id: 'allergy-3',
                allergen: 'Lactose Sensitivity',
                severity: 'Mild to Moderate',
                reaction: 'Bloating / Tummy cramps with unfermented cows milk',
                actionPlan: 'Use curd/yogurt, oat milk, or lactose-free milk instead.',
                diagnosedDate: '2023-11-20',
            }
        ],
        medicalBackground: {
            chronicConditions: ['None'],
            pastSurgeries: ['None'],
            vaccinations: [
                { name: 'MMR Dose 2', status: 'Completed', date: '2024-02-15' },
                { name: 'Varicella Dose 2', status: 'Completed', date: '2024-03-10' },
                { name: 'Hepatitis A Booster', status: 'Completed', date: '2024-09-05' },
            ],
            pediatrician: {
                name: 'Dr. Rajesh Nair, MD',
                hospital: 'Aster CMI Hospital',
                specialization: 'Pediatric Nutrition & Child Development',
                lastCheckup: '2025-11-10',
                notes: 'Growth track is steady. Focus on sensory-friendly iron-rich foods for toddler pickiness.',
            },
        },
        growthHistory: [
            { date: '2024-02-20', ageYears: 2.5, height: 91.0, weight: 12.8, bmi: 15.4, percentile: 48 },
            { date: '2024-08-20', ageYears: 3.0, height: 95.2, weight: 13.7, bmi: 15.1, percentile: 49 },
            { date: '2025-02-20', ageYears: 3.5, height: 98.6, weight: 14.6, bmi: 15.0, percentile: 50 },
            { date: '2025-08-20', ageYears: 4.0, height: 102.0, weight: 15.6, bmi: 15.0, percentile: 50 },
        ],
        macros: {
            protein: { current: 32, target: 36, unit: 'g', pct: 88 },
            carbs: { current: 145, target: 160, unit: 'g', pct: 90 },
            fats: { current: 30, target: 35, unit: 'g', pct: 85 },
            fiber: { current: 14, target: 18, unit: 'g', pct: 77 },
        },
        micros: [
            { name: 'Iron', current: 6.8, target: 8.5, unit: 'mg', pct: 80, icon: 'favorite', source: 'Jaggery & Beet Puree' },
            { name: 'Calcium', current: 580, target: 700, unit: 'mg', pct: 83, icon: 'shield', source: 'Curd & Fortified Oat Milk' },
            { name: 'Vitamin D', current: 480, target: 600, unit: 'IU', pct: 80, icon: 'wb_sunny', source: 'Morning Sunlight' },
            { name: 'Vitamin C', current: 35, target: 35, unit: 'mg', pct: 100, icon: 'eco', source: 'Sweet Limes & Mango' },
            { name: 'Zinc', current: 4.2, target: 5.0, unit: 'mg', pct: 84, icon: 'vital_signs', source: 'Mashed Dal & Seeds' },
            { name: 'Omega-3 (DHA)', current: 160, target: 200, unit: 'mg', pct: 80, icon: 'psychology', source: 'Fortified Spread' },
        ],
        todayMeals: [
            {
                id: 'm-201',
                time: '08:30 AM',
                mealType: 'Breakfast',
                name: 'Steamed Ragi Idlis with Coconut Chutney & Banana',
                calories: 260,
                macros: { p: 7, c: 45, f: 5 },
                tags: ['Iron Enriched', 'Dairy Free'],
                icon: 'bakery_dining',
            },
            {
                id: 'm-202',
                time: '12:45 PM',
                mealType: 'Lunch',
                name: 'Soft Yellow Moong Dal Mash with Ghee Rice & Steamed Pumpkin',
                calories: 380,
                macros: { p: 12, c: 58, f: 9 },
                tags: ['Easy Digest', 'Toddler Favorite'],
                icon: 'soup_kitchen',
            },
            {
                id: 'm-203',
                time: '04:30 PM',
                mealType: 'Afternoon Snack',
                name: 'Homemade Mango Curd Smoothie (Lactose-Friendly)',
                calories: 180,
                macros: { p: 6, c: 28, f: 4 },
                tags: ['Probiotic Rich', 'Vitamin C'],
                icon: 'nutrition',
            },
            {
                id: 'm-204',
                time: '07:30 PM',
                mealType: 'Dinner',
                name: 'Mini Vegetable Paratha with Mild Homemade Hummus',
                calories: 300,
                macros: { p: 7, c: 38, f: 8 },
                tags: ['Finger Food', 'Plant Protein'],
                icon: 'dinner_dining',
            },
        ],
        waterLogs: [
            { time: '08:15 AM', amount: 200, note: 'Morning glass' },
            { time: '11:30 AM', amount: 250, note: 'Playtime hydration' },
            { time: '02:00 PM', amount: 250, note: 'Post nap water' },
            { time: '06:00 PM', amount: 250, note: 'Evening drink' },
        ],
        sleepHistory: [
            { date: 'Yesterday', bedtime: '08:30 PM', wakeTime: '06:45 AM', duration: 10.25, quality: 'Sound Sleep (95%)' },
            { date: '2 Days Ago', bedtime: '08:45 PM', wakeTime: '07:00 AM', duration: 10.25, quality: 'Sound Sleep (93%)' },
            { date: '3 Days Ago', bedtime: '08:30 PM', wakeTime: '06:30 AM', duration: 10.0, quality: 'Good (90%)' },
        ],
        activityLogs: [
            { date: 'Today', type: 'Playground Running & Sandbox Games', duration: 50, intensity: 'Moderate', caloriesBurned: 110, icon: 'directions_run' },
            { date: 'Yesterday', type: 'Indoor Dance & Nursery Rhymes Play', duration: 35, intensity: 'Light to Moderate', caloriesBurned: 75, icon: 'music_note' },
        ],
        prescriptions: [
            {
                id: 'pr-102',
                date: '2025-11-10',
                doctorName: 'Dr. Rajesh Nair',
                diagnosis: 'Toddler Growth Review & Mild Iron Gap Management',
                notes: 'Ferritin level slightly low. Recommended iron syrup 2.5ml daily after breakfast with vitamin C.',
                nextCheckupDays: 60,
                medicines: [
                    { name: 'Pediatric Iron Drops (Ferrous Ascorbate)', dosage: '2.5ml once daily', duration: '60 days' },
                    { name: 'Zincovit Junior Syrup', dosage: '2.5ml once daily', duration: '30 days' }
                ]
            }
        ],
        wellnessDeficiencies: {
            iron: { severity: 'RED', level: 'Mild Gap (80%)', advice: 'Pair plant iron with vitamin C (amla or lemon drops).' },
            vitaminD: { severity: 'ORANGE', level: 'Mild Gap (80%)', advice: '15 mins outdoor play in morning sun.' },
            calcium: { severity: 'ORANGE', level: 'Moderate (83%)', advice: 'Use lactose-free curd and fortified plant milk.' },
            zinc: { severity: 'GREEN', level: 'Good (84%)', advice: 'Maintain legume mash intake.' },
        },
        digitalTwin: {
            metabolicRate: '1,150 kcal/day (Normal)',
            growthVelocityScore: 88,
            skeletalDensityIndex: 'Healthy (0.0 SD)',
            hydrationEfficiency: 'Good (79%)',
            immuneResilienceRating: 'Moderate',
        },
        aiInsights: {
            headline: "Aarav is showing strong energy levels; focusing on iron-rich finger foods will optimize ferritin levels.",
            recommendations: [
                "Introduce fun shapes with iron-fortified ragi pancakes and beetroot puree dips.",
                "Stick with probiotic curd as a comfortable, tummy-friendly dairy source.",
                "Excellent sleep consistency (average 10.2 hours) is supporting neurodevelopment and mood regulation.",
            ]
        }
    }
];

export const DEMO_CHILD_PROFILE = DEMO_CHILDREN[0];

export const DEMO_DIRECTORY_DOCTORS = [
    {
        id: 'doc-1',
        name: 'Dr. Priya Kulkarni, MD',
        specialization: 'Pediatric Growth & Endocrinology',
        experience: '16 Years Exp',
        hospital: 'Rainbow Children’s Hospital, Bengaluru',
        rating: 4.9,
        reviewsCount: 142,
        distance: '2.4 km away',
        fee: '₹800',
        availableToday: true,
        languages: ['English', 'Hindi', 'Kannada'],
        nextSlot: 'Today, 03:30 PM',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'doc-2',
        name: 'Dr. Rajesh Nair, MD (Pediatrics)',
        specialization: 'Pediatric Nutrition & Allergy Care',
        experience: '12 Years Exp',
        hospital: 'Aster CMI Hospital, Bengaluru',
        rating: 4.8,
        reviewsCount: 98,
        distance: '4.1 km away',
        fee: '₹750',
        availableToday: true,
        languages: ['English', 'Hindi', 'Malayalam'],
        nextSlot: 'Tomorrow, 10:00 AM',
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'doc-3',
        name: 'Dt. Shalini Menon, M.Sc (Clinical Nutrition)',
        specialization: 'Certified Pediatric Dietitian',
        experience: '10 Years Exp',
        hospital: 'NutriCare Child Wellness Clinic',
        rating: 4.9,
        reviewsCount: 215,
        distance: '3.0 km away',
        fee: '₹600',
        availableToday: true,
        languages: ['English', 'Hindi', 'Tamil'],
        nextSlot: 'Today, 05:00 PM',
        image: 'https://images.unsplash.com/photo-1594824813596-f1315b80931d?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'doc-4',
        name: 'Dr. Arvind Swaminathan, MD, DCH',
        specialization: 'General Pediatrics & Adolescent Care',
        experience: '22 Years Exp',
        hospital: 'Manipal Hospital, Old Airport Road',
        rating: 4.9,
        reviewsCount: 310,
        distance: '5.8 km away',
        fee: '₹900',
        availableToday: false,
        languages: ['English', 'Hindi', 'Kannada', 'Telugu'],
        nextSlot: 'Thursday, 11:30 AM',
        image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
    }
];

export const DEMO_CONSULTATIONS = [
    {
        id: 'cons-901',
        childName: 'Ananya Sharma',
        doctorName: 'Dr. Priya Kulkarni, MD',
        doctorRole: 'Pediatric Endocrinologist',
        dietitianName: 'Dt. Shalini Menon',
        status: 'PrescriptionIssued', // 'Pending' | 'AssignedToDietitian' | 'UnderDoctorReview' | 'PrescriptionIssued' | 'Closed'
        requestDate: '2026-02-28',
        consultationType: 'Telehealth Video Consultation',
        chiefComplaint: 'Quarterly Growth Percentile Check & Seasonal Allergen Management',
        dietitianNotes: 'Dietary diary analyzed. Calorie balance is solid at 1,360 kcal. Advised maintaining calcium density with ragi and seeds.',
        doctorNotes: 'Ananya has shown steady 58th percentile growth trajectory. Prescribed seasonal vitamin D drops and updated nut-allergy safety guidelines.',
        prescriptions: [
            { medicine: 'Vitamin D3 Drops (400 IU)', dosage: 'Once daily after breakfast', duration: '90 Days' },
            { medicine: 'Cetirizine Syrup (5mg/5ml)', dosage: '2.5ml SOS for allergic sneezing', duration: 'As needed' },
        ]
    }
];

export const DEMO_RESOURCES_DATA = {
    guides: [
        {
            id: 'g1',
            title: 'The Iron-Rich Masterlist for Growing Children',
            category: 'Mineral Focus',
            readTime: '4 min read',
            summary: 'Traditional Indian superfoods and cooking techniques to maximize plant-based non-heme iron absorption.',
            deficiencyMatch: 'iron',
            sections: [
                { title: 'Why Iron Bioavailability Matters', text: 'Iron deficiency is a leading factor in early fatigue and concentration issues. Pairing iron-rich greens with vitamin C unlocks maximum bioavailability.' },
                { title: 'Top 5 Everyday Desi Superfoods', text: '1. Ragi (Finger Millet) - Packed with natural minerals.\n2. Steamed Spinach & Methi.\n3. Organic Jaggery & Til (Sesame) Chikkis.\n4. Sprouted Green Moong Beans.\n5. Beetroot juice with fresh sweet lime.' },
                { title: 'Cooking in Cast Iron', text: 'Preparing curries and sabzis in traditional cast iron cookware can naturally increase the iron content of foods by 15-20%.' }
            ]
        },
        {
            id: 'g2',
            title: 'Calcium & Bone Health Blueprint for Ages 3 to 10',
            category: 'Bone Development',
            readTime: '5 min read',
            summary: 'Essential calcium sources beyond cow’s milk, optimal pairing with Vitamin D3, and skeletal density tips.',
            deficiencyMatch: 'calcium',
            sections: [
                { title: 'Understanding Daily Calcium Needs', text: 'Children between 4 and 8 require approximately 800-1000 mg of calcium daily for bone remodeling and healthy teeth.' },
                { title: 'Dairy & Non-Dairy Powerhouses', text: 'Fresh Paneer, A2 Curd, Sesame Seeds, Ragi Malt, and Fortified Soy/Almond milks provide dense calcium without digestive distress.' },
                { title: 'The Sun & Vitamin D Factor', text: 'Calcium cannot be absorbed effectively without adequate Vitamin D3. Aim for 20 minutes of morning sun exposure.' }
            ]
        },
        {
            id: 'g3',
            title: 'Tackling Picky Eating Without Mealtime Battles',
            category: 'Parenting Strategy',
            readTime: '6 min read',
            summary: 'Evidence-based pediatric behavioral strategies to gently expand your child’s palate and reduce mealtime stress.',
            deficiencyMatch: 'all',
            sections: [
                { title: 'The "Division of Responsibility" Rule', text: 'Parents decide WHAT, WHEN, and WHERE food is offered. The child decides IF and HOW MUCH they eat. Removing pressure encourages curiosity.' },
                { title: 'The "Flavor Bridge" Technique', text: 'Pair a rejected food (e.g. broccoli) with an accepted flavor (e.g. melted cheese dip or mild peanut/sunflower sauce).' },
                { title: 'Micro-Portioning', text: 'Offer novel vegetables in tiny, non-intimidating pea-sized portions alongside familiar favorites.' }
            ]
        }
    ],
    recipes: [
        {
            id: 'r1',
            title: 'Golden Spiced Ragi Banana Pancakes',
            prepTime: '15 mins',
            calories: '210 kcal',
            protein: '6g',
            fiber: '4g',
            tags: ['Iron-Rich', 'No Refined Sugar', 'Nut-Free Safe'],
            ingredients: ['1 cup Sprouted Ragi Flour', '1 Ripe Robusta Banana (mashed)', '1/2 cup Warm Milk/Oat Milk', '1 tbsp Jaggery Powder', '1/4 tsp Cardamom Powder', '1 tsp Pure Cow Ghee for cooking'],
            instructions: '1. Whisk mashed banana, jaggery, and milk until smooth.\n2. Fold in ragi flour and cardamom powder to form a thick pouring batter.\n3. Cook on a medium-hot cast iron skillet with drops of ghee until golden bubbles form.'
        },
        {
            id: 'r2',
            title: 'High-Protein Moong Dal & Paneer Tikki Pops',
            prepTime: '20 mins',
            calories: '280 kcal',
            protein: '14g',
            fiber: '5g',
            tags: ['High Protein', 'Finger Food', 'Lunchbox Hero'],
            ingredients: ['1 cup Soaked & Boiled Yellow Moong Dal', '1/2 cup Fresh Grated Paneer', '1/4 cup Boiled Green Peas', '1/2 tsp Cumin Powder', 'Fresh Coriander', 'Breadcrumbs/Poha powder for binding'],
            instructions: '1. Mash boiled dal and peas in a bowl.\n2. Mix in grated paneer, roasted cumin, salt, and fresh coriander.\n3. Shape into mini cutlets and pan-sear with olive oil or ghee until crisp.'
        },
        {
            id: 'r3',
            title: 'Sunburst Vitamin C Smoothie Bowl',
            prepTime: '10 mins',
            calories: '190 kcal',
            protein: '8g',
            fiber: '6g',
            tags: ['Immunity Booster', 'Gut Healthy', 'Quick Breakfast'],
            ingredients: ['1 cup Fresh Homemade Curd/Greek Yogurt', '1/2 cup Sweet Alphonso Mango Chunks', '1/4 cup Orange Juice', '1 tbsp Chia Seeds', 'Puffed Amaranth for topping'],
            instructions: '1. Blend yogurt, mango, and orange juice until velvety.\n2. Pour into a bowl and top with chia seeds and puffed amaranth for delightful crunch.'
        }
    ],
    portionGuide: [
        { group: 'Grains & Millets', icon: '🌾', dailyServing: '4 - 6 portions', childPalmRule: '1 cupped palm per meal (Roti, Khichdi, Oats)' },
        { group: 'Pulses, Lentils & Dairy', icon: '🥛', dailyServing: '2 - 3 portions', childPalmRule: '1 flat palm of paneer/dal or 1 cup curd' },
        { group: 'Vegetables & Leafy Greens', icon: '🥦', dailyServing: '2 - 3 cups', childPalmRule: '1 closed child fist of cooked veggies per meal' },
        { group: 'Fresh Fruits', icon: '🍎', dailyServing: '2 servings', childPalmRule: '1 whole medium fruit or 1 small bowl sliced' },
        { group: 'Healthy Fats & Seeds', icon: '🥑', dailyServing: '2 - 3 teaspoons', childPalmRule: 'Child thumb-sized portion of ghee/seeds butter' }
    ]
};

export const DEMO_NOTIFICATIONS = [
    { id: 'notif-1', message: 'Growth update reminder: Ananya is approaching the 90-day physical measurement milestone.', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: false },
    { id: 'notif-2', message: 'Dr. Priya Kulkarni updated clinical notes for Ananya’s seasonal allergy plan.', createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: false },
    { id: 'notif-3', message: 'NutriKid AI: New iron-rich meal plan generated for this week.', createdAt: new Date(Date.now() - 172800000).toISOString(), isRead: true },
];
