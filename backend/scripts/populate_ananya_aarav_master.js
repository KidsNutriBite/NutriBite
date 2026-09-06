import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import Prescription from '../models/Prescription.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';
import MealLog from '../models/MealLog.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import SleepLog from '../models/SleepLog.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import Appointment from '../models/Appointment.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

function getDateStr(daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function populateMasterProfiles() {
    console.log("=================================================================");
    console.log("🌱 POPULATING MASTER PROFILES: ANANYA SHARMA (SUCCESS) & AARAV SHARMA (DEFICIT)");
    console.log("=================================================================");

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", MONGO_URI);

    // 1. Ensure Parent User: Sneha Sharma
    let parent = await User.findOne({ email: 'parent@nutrikid.com' });
    if (!parent) {
        parent = await User.findOne({ email: 'parent.test@nutrikid.com' });
    }

    const parentData = {
        title: 'Ms',
        name: 'Sneha Sharma',
        email: 'parent@nutrikid.com',
        password: 'Password123!',
        role: 'parent',
        status: 'Active',
        is2FAEnabled: false,
        parentProfile: {
            phoneNumber: '9876543210',
            city: 'Bengaluru',
            relationToChild: 'Mother'
        }
    };

    if (!parent) {
        parent = new User(parentData);
        await parent.save();
        console.log(`✅ Created Parent: ${parent.name} (${parent.email})`);
    } else {
        Object.assign(parent, parentData);
        parent.password = 'Password123!';
        await parent.save();
        console.log(`✅ Verified Parent: ${parent.name} (${parent.email})`);
    }

    // 2. Ensure Doctor: Dr. Rajesh Iyer, MD
    let doctor = await User.findOne({ email: 'doctor@nutrikid.com' });
    const doctorData = {
        title: 'Mr',
        name: 'Dr. Rajesh Iyer, MD',
        email: 'doctor@nutrikid.com',
        password: 'Password123!',
        role: 'doctor',
        status: 'Active',
        is2FAEnabled: false,
        doctorProfile: {
            specialization: 'Pediatric Growth & Developmental Nutrition',
            hospitalName: "Rainbow Children's Hospital, Bengaluru",
            experienceYears: 14,
            registrationId: 'KMC-78291-PED',
            rating: 4.9,
            consultationFee: '₹800'
        }
    };

    if (!doctor) {
        doctor = new User(doctorData);
        await doctor.save();
        console.log(`✅ Created Doctor: ${doctor.name}`);
    } else {
        Object.assign(doctor, doctorData);
        doctor.password = 'Password123!';
        await doctor.save();
        console.log(`✅ Updated Doctor: ${doctor.name}`);
    }

    // 3. Ensure Dietitian: Dt. Anjali Mehta, RD
    let dietitian = await User.findOne({ email: 'dietitian@nutrikid.com' });
    const dietitianData = {
        title: 'Ms',
        name: 'Dt. Anjali Mehta, RD',
        email: 'dietitian@nutrikid.com',
        password: 'Password123!',
        role: 'dietitian',
        status: 'Active',
        is2FAEnabled: false,
        dietitianProfile: {
            specialization: 'Pediatric Clinical Dietetics & Allergen Management',
            experienceYears: 9,
            registrationId: 'IDA-54120-NUT',
            rating: 4.8,
            consultationFee: '₹650'
        }
    };

    if (!dietitian) {
        dietitian = new User(dietitianData);
        await dietitian.save();
        console.log(`✅ Created Dietitian: ${dietitian.name}`);
    } else {
        Object.assign(dietitian, dietitianData);
        dietitian.password = 'Password123!';
        await dietitian.save();
        console.log(`✅ Updated Dietitian: ${dietitian.name}`);
    }

    // 4. Create/Update CHILD 1: Ananya Sharma (Age 7 - SUCCESS STORY / ALL RECORDS IMPROVED)
    let ananya = await Profile.findOne({ parentId: parent._id, name: 'Ananya Sharma' });
    const ananyaData = {
        parentId: parent._id,
        name: 'Ananya Sharma',
        dob: new Date('2019-03-15'),
        age: 7,
        gender: 'female',
        bloodGroup: 'B+',
        height: 122.5,
        weight: 23.2,
        waistCircumference: 55,
        sportsActivityLevel: 'Active',
        location: {
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            address: '104 Green Glen Layout, Bellandur'
        },
        healthConditions: [],
        goals: {
            primary: 'Optimal Height Velocity, Peak Immunity & Athletic Stamina',
            secondary: ['Bone Mineralization Support', 'Cognitive & School Concentration Sharpness']
        },
        preferences: {
            favoriteFoods: 'Sprouted Ragi Idli, Palak Moong Khichdi, Paneer Bajra Paratha, Almond Milk, Roasted Makhana, Til Laddoo',
            dislikedFoods: 'Deep-fried junk, excessive refined sugar',
            favoriteFruits: 'Papaya, Pomegranate, Sweet Guava, Banana',
            favoriteVegetables: 'Spinach, Carrots, Green Peas, Methi, Beetroot',
            waterIntake: 1800, // in ml
            activityLevel: 'high',
            sleepDuration: 9.5,
            sleepQuality: 'Good',
            eatingHabits: 'good'
        },
        lastCheckup: {
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            time: '10:30 AM',
            doctorName: 'Dr. Rajesh Iyer, MD',
            notes: 'Exemplary growth progression! Height velocity is at the 65th percentile (+4.5cm in 6 months). Micronutrient coverage is optimal with zero deficiency indicators.',
            status: 'Completed'
        },
        healthNotes: "Optimal pediatric health profile. Excellent adherence to the doctor-prescribed Indian micronutrient plan.",
        medicalReports: [
            {
                reportName: "Pediatric Growth & Iron Profile Review",
                reportDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                hospitalName: "Rainbow Children's Hospital, Bengaluru",
                doctorName: "Dr. Rajesh Iyer, MD",
                comments: "Hemoglobin 13.2 g/dL (optimal), Serum Ferritin normal, Vitamin D3 38 ng/mL (excellent).",
                attachment: "/reports/ananya_iron_growth_review.pdf",
                status: "Reviewed"
            }
        ],
        wellnessAnalysis: {
            score: 94,
            nutritionScore: 95,
            deficiencyScore: 96,
            growthRiskScore: 92,
            hydrationScore: 98,
            mealQualityScore: 92,
            aiExplanation: "Ananya is thriving with consistent high-protein, iron-rich Indian meals, active hydration (1.8L/day), and restorative sleep. All pediatric RDA milestones are exceeded."
        },
        avatar: 'lion'
    };

    if (!ananya) {
        ananya = await Profile.create(ananyaData);
        console.log(`✅ Created Child Profile: Ananya Sharma (Age 7 - SUCCESS STORY)`);
    } else {
        Object.assign(ananya, ananyaData);
        await ananya.save();
        console.log(`✅ Updated Child Profile: Ananya Sharma (Age 7 - SUCCESS STORY)`);
    }

    // 5. Create/Update CHILD 2: Aarav Sharma (Age 4 - HIGH DEFICIT / ALL NEGATIVE VALUES & ALERTS)
    let aarav = await Profile.findOne({ parentId: parent._id, name: 'Aarav Sharma' });
    const aaravData = {
        parentId: parent._id,
        name: 'Aarav Sharma',
        dob: new Date('2022-07-20'),
        age: 4,
        gender: 'male',
        bloodGroup: 'O+',
        height: 95.0, // Stunted (<10th percentile)
        weight: 12.8, // Underweight (BMI 14.1)
        waistCircumference: 46,
        sportsActivityLevel: 'Sedentary',
        location: {
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            address: '104 Green Glen Layout, Bellandur'
        },
        healthConditions: ['Mild Stunting', 'Picky Eating Behavior', 'Lactose Sensitivity', 'Iron Deficiency Risk'],
        goals: {
            primary: 'Catch-up Growth Acceleration & Severe Anemia Reversal',
            secondary: ['Appetite Restoration', 'Lactose Sensitivity & Digestive Tolerance']
        },
        preferences: {
            favoriteFoods: 'White Bread, Biscuits, Packaged Noodles, Sugary Juices',
            dislikedFoods: 'Green Leafy Vegetables, Dal, Khichdi, Ragi, Eggs, Curd, Boiled Vegetables',
            favoriteFruits: 'Only sweetened packaged juices',
            favoriteVegetables: 'None (refuses all greens and beans)',
            waterIntake: 600, // Severe deficit vs 1300ml required
            activityLevel: 'low',
            sleepDuration: 6.0,
            sleepQuality: 'Poor',
            eatingHabits: 'poor'
        },
        lastCheckup: {
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            time: '11:45 AM',
            doctorName: 'Dr. Rajesh Iyer, MD',
            notes: '⚠️ Critical Clinical Alert: Faltering growth velocity (<10th percentile height, underweight). Microcytic hypochromic anemia (Hb 9.4 g/dL), severe Vitamin D3 deficiency (11 ng/mL). Urgent dietary restructuring required.',
            status: 'Completed'
        },
        healthNotes: "⚠️ High Clinical Risk: Severe picky eating, chronic dehydration, and multi-micronutrient deficits. Under active pediatric intervention.",
        medicalReports: [
            {
                reportName: "Pediatric CBC & Micronutrient Screening",
                reportDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                hospitalName: "Rainbow Children's Hospital, Bengaluru",
                doctorName: "Dr. Rajesh Iyer, MD",
                comments: "Hemoglobin 9.4 g/dL (low), Serum Ferritin 12 ng/mL (depleted), Vitamin D3 11 ng/mL (severely deficient).",
                attachment: "/reports/aarav_milestone_review.pdf",
                status: "Reviewed"
            }
        ],
        wellnessAnalysis: {
            score: 42,
            nutritionScore: 38,
            deficiencyScore: 32,
            growthRiskScore: 44,
            hydrationScore: 40,
            mealQualityScore: 36,
            concerns: [
                {
                    issue: "Severe Iron & Micronutrient Deficiency",
                    whyItMatters: "Impairs cognitive development and energy stamina.",
                    healthImpact: "Chronic classroom lethargy and anemia risk.",
                    priority: "Critical"
                },
                {
                    issue: "Stunted Growth Velocity & Low Caloric Density",
                    whyItMatters: "Falls below WHO 10th percentile growth trajectory.",
                    healthImpact: "Delayed linear skeletal maturation.",
                    priority: "Critical"
                },
                {
                    issue: "Chronic Dehydration & Low Fluid Intake",
                    whyItMatters: "Intake is under 50% of ICMR pediatric requirement.",
                    healthImpact: "Constipation, sluggish metabolism.",
                    priority: "High"
                }
            ],
            aiExplanation: "⚠️ Aarav has critical multi-nutrient deficits: Iron is critically low (28% RDA), Vitamin D is deficient (22% RDA), Protein is inadequate (42% RDA), and Hydration is below 550ml/day. Immediate nutritional intervention is underway."
        },
        avatar: 'rabbit'
    };

    if (!aarav) {
        aarav = await Profile.create(aaravData);
        console.log(`✅ Created Child Profile: Aarav Sharma (Age 4 - HIGH DEFICIT)`);
    } else {
        Object.assign(aarav, aaravData);
        await aarav.save();
        console.log(`✅ Updated Child Profile: Aarav Sharma (Age 4 - HIGH DEFICIT)`);
    }

    // 6. Establish DoctorAccess and Doctor-Dietitian Group
    await DoctorAccess.deleteMany({ parentId: parent._id });
    await DoctorAccess.create([
        {
            doctorId: doctor._id,
            parentId: parent._id,
            profileId: ananya._id,
            status: 'active',
            fullAccessRequested: true,
            message: "Assigned Primary Pediatrician for Ananya Sharma",
            doctorMessage: "Access granted for growth tracking and monthly nutrition consultations."
        },
        {
            doctorId: doctor._id,
            parentId: parent._id,
            profileId: aarav._id,
            status: 'active',
            fullAccessRequested: true,
            message: "Assigned Primary Pediatrician for Aarav Sharma",
            doctorMessage: "Urgent access active for deficit protocol and growth recovery tracking."
        }
    ]);

    await DietitianDoctorGroup.deleteMany({ dietitianId: dietitian._id });
    await DietitianDoctorGroup.create({
        doctorId: doctor._id,
        dietitianId: dietitian._id
    });

    console.log(`✅ Assigned Doctor (Dr. Rajesh Iyer) & Dietitian (Dt. Anjali Mehta) to Ananya & Aarav`);

    // 7. Establish Prescriptions & Consultations
    await Prescription.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await ConsultationRequest.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });

    // Prescription for Ananya (Glowing Success)
    const rxAnanya = await Prescription.create({
        doctorId: doctor._id,
        profileId: ananya._id,
        title: "Pediatric Quarterly Health Review: Thriving Status Verified",
        diagnosis: "Excellent growth progression. Optimal hemoglobin, strong bone density, and 100% hydration consistency.",
        notes: "Ananya is active, confident, and tracking at the 65th WHO height percentile. Recent dietary logs reflect superior compliance with Sprouted Ragi + Vitamin C synergy.",
        instructions: "1. Continue Sprouted Ragi Idli / Thepla 3-4x weekly.\n2. Maintain 20-30 mins outdoor morning sunlight for natural Vitamin D3.\n3. Keep daily hydration at 1800 ml.\n4. Next routine checkup in 75 days.",
        nextCheckupDays: 75,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });

    await ConsultationRequest.create({
        profileId: ananya._id,
        parentId: parent._id,
        doctorId: doctor._id,
        dietitianId: dietitian._id,
        status: 'PrescriptionIssued',
        dietitianNotes: "7-day personalized Indian meal plan with high bioavailable iron and protein endorsed. Exemplary parental compliance.",
        doctorNotes: "Growth trajectory is thriving at 65th percentile. Pediatric health goals fully met.",
        prescriptionId: rxAnanya._id,
        assignedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        doctorAssignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    // Prescription for Aarav (Urgent Intervention)
    const rxAarav = await Prescription.create({
        doctorId: doctor._id,
        profileId: aarav._id,
        title: "⚠️ Urgent Pediatric Deficit Protocol: Anemia Reversal & Catch-Up Growth",
        diagnosis: "Moderate-Severe Micronutrient Deficit, Microcytic Anemia (Hb 9.4 g/dL), Picky Eating Behavior, and Stunted Height Velocity.",
        notes: "Aarav is falling below the 10th percentile curve. Refined carbohydrate intake must be replaced with energy-dense, iron-rich soft Indian preparations.",
        instructions: "1. Prescribe gentle iron syrup (Ferrous Ascorbate 15mg/day) after breakfast.\n2. Fortified plant milk with crushed dates and nutmeg at bedtime.\n3. Introduce soft yellow moong dal khichdi with ghee.\n4. Strict minimum fluid intake: 1300 ml/day.\n5. Mandatory review in 21 days.",
        nextCheckupDays: 21,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    await ConsultationRequest.create({
        profileId: aarav._id,
        parentId: parent._id,
        doctorId: doctor._id,
        dietitianId: dietitian._id,
        status: 'PrescriptionIssued',
        dietitianNotes: "⚠️ Structured transition plan designed to replace refined bakery snacks with soft vegetable cheela, jaggery sesame bites, and fortified almond-turmeric milk.",
        doctorNotes: "⚠️ Critical deficit protocol initiated. Physical growth milestones are delayed. Requires rigorous monitoring.",
        prescriptionId: rxAarav._id,
        assignedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        doctorAssignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // 7b. Appointments / Pediatrician Checkups
    await Appointment.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await Appointment.create([
        {
            parentId: parent._id,
            profileId: ananya._id,
            hospitalId: "hosp_rainbow_blr_01",
            hospitalName: "Rainbow Children's Hospital, Bengaluru (Dr. Rajesh Iyer, MD)",
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            time: "10:30 AM",
            reason: "Routine Pediatric Growth & Micronutrient Review",
            status: "completed"
        },
        {
            parentId: parent._id,
            profileId: aarav._id,
            hospitalId: "hosp_rainbow_blr_01",
            hospitalName: "Rainbow Children's Hospital, Bengaluru (Dr. Rajesh Iyer, MD)",
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            time: "11:45 AM",
            reason: "⚠️ Urgent Pediatric Evaluation: Picky Eating, Anemia & Stunted Velocity",
            status: "completed"
        }
    ]);

    // 8. POPULATE 21 DAYS OF CONTRASTING LOGS (Meals, Sleep, Activity)
    console.log("\n🍛 Populating 21 Days of Rich Contrasting Daily Logs...");
    await MealLog.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await SleepLog.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await ActivityLog.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await GrowthRecord.deleteMany({ childId: { $in: [ananya._id, aarav._id] } });

    for (let i = 0; i < 21; i++) {
        const dateStr = getDateStr(i);

        // ==========================================================
        // ANANYA: EXCELLENT BALANCED MEALS (6 SLOTS, HIGH HYDRATION)
        // ==========================================================
        const ananyaBreakfast = [
            { name: "Sprouted Ragi Roti with Fresh Curd", quantity: "1 roti + 1/2 cup curd", calories: 280, protein: 9, carbs: 45, fats: 6, fiber: 5.5, iron: 4.2, calcium: 260, vitaminA: 120, vitaminC: 8, water: 250 },
            { name: "Boiled Egg with Rock Salt", quantity: "1 egg", calories: 75, protein: 6.5, carbs: 0.5, fats: 5, fiber: 0, iron: 0.9, calcium: 25, vitaminA: 80, vitaminC: 0, water: 50 }
        ];
        const ananyaMorningSnack = [
            { name: "Fresh Papaya & Pomegranate Bowl", quantity: "1 cup (150g)", calories: 85, protein: 1.5, carbs: 19, fats: 0.3, fiber: 3.2, iron: 0.8, calcium: 30, vitaminA: 380, vitaminC: 65, water: 250 }
        ];
        const ananyaLunch = [
            { name: "Palak Moong Dal Khichdi with Ghee", quantity: "1.5 cups (200g)", calories: 340, protein: 12, carbs: 55, fats: 7.5, fiber: 5.5, iron: 4.5, calcium: 140, vitaminA: 450, vitaminC: 15, water: 350 },
            { name: "Cumin Mint Buttermilk", quantity: "1 large glass (250ml)", calories: 60, protein: 3.5, carbs: 4.5, fats: 2.5, fiber: 0, iron: 0.2, calcium: 150, vitaminA: 40, vitaminC: 5, water: 250 }
        ];
        const ananyaAfternoonSnack = [
            { name: "Sprouted Moong Salad with Lemon", quantity: "1/2 cup (80g)", calories: 115, protein: 6.5, carbs: 20, fats: 0.5, fiber: 4.5, iron: 2.8, calcium: 40, vitaminA: 60, vitaminC: 25, water: 250 },
            { name: "Roasted Makhana (Foxnuts) in Ghee", quantity: "1 bowl (25g)", calories: 130, protein: 3.2, carbs: 20, fats: 4.2, fiber: 2.5, iron: 1.4, calcium: 80, vitaminA: 0, vitaminC: 0, water: 50 }
        ];
        const ananyaDinner = [
            { name: "Soft Methi Thepla with Paneer Bhurji", quantity: "2 theplas + 1/2 cup paneer", calories: 325, protein: 14, carbs: 46, fats: 9, fiber: 5.5, iron: 3.8, calcium: 210, vitaminA: 320, vitaminC: 12, water: 250 },
            { name: "Warm Drumstick Pod (Moringa) Soup", quantity: "1 bowl (150ml)", calories: 65, protein: 2.5, carbs: 8, fats: 1.5, fiber: 2.5, iron: 2.1, calcium: 120, vitaminA: 210, vitaminC: 20, water: 200 }
        ];
        const ananyaEveningSnack = [
            { name: "Warm Golden Turmeric Milk with Almonds", quantity: "1 cup (180ml)", calories: 125, protein: 6.8, carbs: 12, fats: 5, fiber: 0.8, iron: 0.6, calcium: 240, vitaminA: 90, vitaminC: 1, water: 200 }
        ];

        await MealLog.create({
            profileId: ananya._id,
            parentId: parent._id,
            date: dateStr,
            breakfast: ananyaBreakfast,
            morningSnack: ananyaMorningSnack,
            lunch: ananyaLunch,
            afternoonSnack: ananyaAfternoonSnack,
            dinner: ananyaDinner,
            eveningSnack: ananyaEveningSnack,
            completedMealsCount: 6,
            isStreakCounted: true,
            lastMealAt: new Date()
        });

        // Ananya Sleep Log (9.5 hrs, Healthy)
        await SleepLog.create({
            profileId: ananya._id,
            date: dateStr,
            sleepTime: '21:00',
            wakeUpTime: '06:30',
            totalSleepHours: 9.5,
            status: 'healthy',
            notes: 'Slept soundly without interruption. Energetic morning waking.'
        });

        // Ananya Activity Log (70 mins, Active)
        await ActivityLog.create({
            profileId: ananya._id,
            date: dateStr,
            activities: [
                { type: 'Outdoor Play', duration: 40, notes: 'Badminton & playground games' },
                { type: 'Cycling', duration: 30, notes: 'Evening cycling around community' }
            ],
            totalDuration: 70,
            status: 'Active'
        });

        // ==========================================================
        // AARAV: DEFICIT-HEAVY MEALS (PICKY EATING, LOW WATER & CALS)
        // ==========================================================
        const aaravBreakfast = i % 3 === 0 ? [] : [
            { name: "White Bread Slices with Sweetened Tea", quantity: "1 slice", calories: 110, protein: 2.0, carbs: 22, fats: 1.5, fiber: 0.5, iron: 0.3, calcium: 15, vitaminA: 0, vitaminC: 0, water: 100 }
        ];
        const aaravMorningSnack = [
            { name: "Packaged Sweetened Mango Drink", quantity: "1 tetra pack (120ml)", calories: 80, protein: 0.1, carbs: 19, fats: 0, fiber: 0.1, iron: 0.1, calcium: 5, vitaminA: 10, vitaminC: 2, water: 120 }
        ];
        const aaravLunch = [
            { name: "Plain White Rice with Potato Gravy (Picky Eater)", quantity: "1/2 cup", calories: 180, protein: 2.8, carbs: 38, fats: 2.0, fiber: 0.8, iron: 0.5, calcium: 12, vitaminA: 5, vitaminC: 2, water: 150 }
        ];
        const aaravAfternoonSnack = [
            { name: "Refined Flour Cream Biscuits", quantity: "2 biscuits", calories: 140, protein: 1.2, carbs: 21, fats: 6.0, fiber: 0.3, iron: 0.2, calcium: 10, vitaminA: 0, vitaminC: 0, water: 50 }
        ];
        const aaravDinner = [
            { name: "Half Whole Wheat Roti with Sugar & Butter", quantity: "1/2 roti", calories: 130, protein: 2.2, carbs: 22, fats: 4.0, fiber: 1.0, iron: 0.4, calcium: 15, vitaminA: 15, vitaminC: 0, water: 100 }
        ];
        const aaravEveningSnack = [];

        await MealLog.create({
            profileId: aarav._id,
            parentId: parent._id,
            date: dateStr,
            breakfast: aaravBreakfast,
            morningSnack: aaravMorningSnack,
            lunch: aaravLunch,
            afternoonSnack: aaravAfternoonSnack,
            dinner: aaravDinner,
            eveningSnack: aaravEveningSnack,
            completedMealsCount: (aaravBreakfast.length > 0 ? 1 : 0) + 3,
            isStreakCounted: false,
            lastMealAt: new Date()
        });

        // Aarav Sleep Log (6.0 hrs, Poor)
        await SleepLog.create({
            profileId: aarav._id,
            date: dateStr,
            sleepTime: '23:30',
            wakeUpTime: '05:30',
            totalSleepHours: 6.0,
            status: 'poor',
            notes: 'Restless, struggled to fall asleep, woke up crying twice.'
        });

        // Aarav Activity Log (15 mins, Inactive)
        await ActivityLog.create({
            profileId: aarav._id,
            date: dateStr,
            activities: [
                { type: 'Other', duration: 15, notes: 'Sedentary mobile games and cartoon viewing' }
            ],
            totalDuration: 15,
            status: 'Inactive'
        });
    }

    // 9. POPULATE HISTORICAL GROWTH RECORDS
    console.log("\n📈 Populating Historical Growth Trajectories...");
    const ananyaGrowth = [
        { height: 114.0, weight: 19.5, waist: 51, bmi: 15.0, percentile: 62, daysAgo: 365, ageMonths: 72, risk: 'normal', notes: 'Steady linear height velocity along 62nd percentile.' },
        { height: 116.5, weight: 20.3, waist: 52, bmi: 15.0, percentile: 63, daysAgo: 270, ageMonths: 75, risk: 'normal', notes: 'Consistent bone density progression.' },
        { height: 118.5, weight: 21.4, waist: 53, bmi: 15.2, percentile: 64, daysAgo: 180, ageMonths: 78, risk: 'normal', notes: 'Optimal weight and stature gains.' },
        { height: 120.5, weight: 22.3, waist: 54, bmi: 15.3, percentile: 65, daysAgo: 90, ageMonths: 81, risk: 'normal', notes: 'Healthy athletic posture and muscle tone.' },
        { height: 122.5, weight: 23.2, waist: 55, bmi: 15.5, percentile: 65, daysAgo: 4, ageMonths: 84, risk: 'normal', notes: 'Quarterly review: Growth velocity is thriving at 65th percentile.' }
    ];

    for (const g of ananyaGrowth) {
        const d = new Date();
        d.setDate(d.getDate() - g.daysAgo);
        await GrowthRecord.create({
            childId: ananya._id,
            height: g.height,
            weight: g.weight,
            waistCircumference: g.waist,
            bmi: g.bmi,
            percentile: g.percentile,
            riskStatus: g.risk,
            ageInMonths: g.ageMonths,
            recordedByRole: 'doctor',
            recordedByUserId: doctor._id,
            verified: true,
            notes: g.notes,
            timestamp: d
        });
    }

    const aaravGrowth = [
        { height: 90.0, weight: 11.5, waist: 44, bmi: 14.2, percentile: 8, daysAgo: 365, ageMonths: 36, risk: 'underweight', notes: 'Growth faltering: Height <10th percentile.' },
        { height: 91.5, weight: 11.9, waist: 44.5, bmi: 14.2, percentile: 8, daysAgo: 270, ageMonths: 39, risk: 'underweight', notes: 'Suboptimal weight gain.' },
        { height: 92.8, weight: 12.2, waist: 45, bmi: 14.2, percentile: 9, daysAgo: 180, ageMonths: 42, risk: 'underweight', notes: 'Persistent picky eating habits.' },
        { height: 94.0, weight: 12.5, waist: 45.5, bmi: 14.1, percentile: 9, daysAgo: 90, ageMonths: 45, risk: 'underweight', notes: 'Low caloric intake.' },
        { height: 95.0, weight: 12.8, waist: 46, bmi: 14.1, percentile: 8, daysAgo: 6, ageMonths: 48, risk: 'underweight', notes: '⚠️ Clinical Alert: Faltering growth velocity (<10th percentile height, underweight). Urgent intervention active.' }
    ];

    for (const g of aaravGrowth) {
        const d = new Date();
        d.setDate(d.getDate() - g.daysAgo);
        await GrowthRecord.create({
            childId: aarav._id,
            height: g.height,
            weight: g.weight,
            waistCircumference: g.waist,
            bmi: g.bmi,
            percentile: g.percentile,
            riskStatus: g.risk,
            ageInMonths: g.ageMonths,
            recordedByRole: 'doctor',
            recordedByUserId: doctor._id,
            verified: true,
            notes: g.notes,
            timestamp: d
        });
    }

    console.log("\n=================================================================");
    console.log("🎉 POPULATION COMPLETE! CONTRAST SUMMARY:");
    console.log("=================================================================");
    console.log("👩 ANANYA SHARMA (Age 7 - SUCCESS STORY / ALL RECORDS IMPROVED):");
    console.log("   ⭐ Wellness Health Score: 94/100 (Thriving)");
    console.log("   🩺 Last Checkup:          Dr. Rajesh Iyer (4 days ago, 10:30 AM) - Status: Completed");
    console.log("   📋 Prescription:          Quarterly Review (Iron Synergy Plan & Sprouted Ragi)");
    console.log("   🍛 21-Day Meals:          6 daily slots completed (High Protein, High Iron & Calcium)");
    console.log("   💧 Hydration:             1800 ml/day (21-Day Active Streak)");
    console.log("   😴 Sleep:                 9.5 hrs / night (Healthy)");
    console.log("   🏃 Activity:              70 mins / day (Active Sports)");
    console.log("   📈 Growth:                122.5cm / 23.2kg (65th Percentile - Normal)");
    console.log("-----------------------------------------------------------------");
    console.log("👦 AARAV SHARMA (Age 4 - HIGH DEFICIT / NEEDS ATTENTION):");
    console.log("   ⚠️ Wellness Health Score: 42/100 (High Risk / Urgent Care)");
    console.log("   🩺 Last Checkup:          Dr. Rajesh Iyer (6 days ago, 11:45 AM) - Status: Completed");
    console.log("   📋 Prescription:          ⚠️ Urgent Deficit Protocol (Iron Syrup, Catch-Up Diet)");
    console.log("   🍛 21-Day Meals:          Picky eating, refined carbs, skipped slots");
    console.log("   💧 Hydration:             500-600 ml/day (Severe Deficit vs 1.3L Target)");
    console.log("   😴 Sleep:                 6.0 hrs / night (Poor / Restless)");
    console.log("   🏃 Activity:              15 mins / day (Inactive / Sedentary)");
    console.log("   📈 Growth:                95.0cm / 12.8kg (8th Percentile - Underweight Alert)");
    console.log("=================================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

populateMasterProfiles().catch(err => {
    console.error("❌ Population failed:", err);
    process.exit(1);
});
