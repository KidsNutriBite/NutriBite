/**
 * COMPREHENSIVE SEED SCRIPT — "Abhi" Child Profile
 * Seeds a full month of:
 *  - Breakfast, Lunch, Dinner (every day for 30 days)
 *  - Sleep logs
 *  - Activity logs
 *  - Growth records (weekly)
 *  - Doctor prescriptions / checkup notes
 *  - Doctor access (active)
 *
 * Run: node seed_abhi.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGO_URI = "mongodb+srv://pv839910_db_user:Pavan3107@cluster0.qf9utna.mongodb.net/nutrikid?appName=Cluster0";

// ─────────────────────────────────────────────
// INLINE SCHEMAS (avoid import path issues)
// ─────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name: String, email: String, password: String, role: String,
    title: String, phone: String, isEmailVerified: { type: Boolean, default: true },
    address: { city: String, state: String, country: String },
    doctorProfile: {
        specialization: String, hospitalName: String,
        experienceYears: Number, registrationId: String
    }
}, { timestamps: true });
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const profileSchema = new mongoose.Schema({
    parentId: mongoose.Schema.Types.ObjectId,
    name: String, age: Number, gender: String,
    height: Number, weight: Number, dob: Date,
    activityLevel: { type: String, default: 'moderate' },
    dietaryPreferences: [String], healthConditions: [String],
    goals: [String], avatar: { type: String, default: 'lion' },
    level: { type: Number, default: 1 },
    currentXP: { type: Number, default: 850 },
    streakCount: { type: Number, default: 15 },
    superheroesUnlocked: { type: [String], default: ['Captain Milk'] },
    equippedCompanion: { type: String, default: 'Captain Milk' }
}, { timestamps: true });

const foodItemSchema = new mongoose.Schema({
    name: String, quantity: String, calories: Number,
    protein: Number, carbs: Number, fats: Number,
    fiber: Number, water: Number, vitamins: String
}, { _id: true });

const mealLogSchema = new mongoose.Schema({
    profileId: mongoose.Schema.Types.ObjectId,
    date: String,
    breakfast: [foodItemSchema],
    morningSnack: [foodItemSchema],
    lunch: [foodItemSchema],
    afternoonSnack: [foodItemSchema],
    dinner: [foodItemSchema],
    eveningSnack: [foodItemSchema],
    completedMealsCount: { type: Number, default: 0 },
    isStreakCounted: { type: Boolean, default: true },
    lastMealAt: Date
}, { timestamps: true });
mealLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

const growthRecordSchema = new mongoose.Schema({
    childId: mongoose.Schema.Types.ObjectId,
    height: Number, weight: Number,
    waistCircumference: Number, bmi: Number,
    percentile: Number,
    riskStatus: { type: String, default: 'normal' },
    ageInMonths: Number,
    recordedByRole: String,
    recordedByUserId: mongoose.Schema.Types.ObjectId,
    verified: { type: Boolean, default: false },
    notes: String,
    timestamp: { type: Date, default: Date.now }
});
growthRecordSchema.index({ childId: 1, timestamp: -1 });

const prescriptionSchema = new mongoose.Schema({
    doctorId: mongoose.Schema.Types.ObjectId,
    profileId: mongoose.Schema.Types.ObjectId,
    title: String, diagnosis: String, notes: String,
    instructions: String,
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const doctorAccessSchema = new mongoose.Schema({
    doctorId: mongoose.Schema.Types.ObjectId,
    parentId: mongoose.Schema.Types.ObjectId,
    profileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, default: 'active' },
    expiresAt: { type: Date, default: null },
    message: String, doctorMessage: String,
    fullAccessRequested: { type: Boolean, default: false }
}, { timestamps: true });
doctorAccessSchema.index({ doctorId: 1, parentId: 1, profileId: 1 }, { unique: true });

const sleepLogSchema = new mongoose.Schema({
    profileId: mongoose.Schema.Types.ObjectId,
    date: String, sleepTime: String, wakeUpTime: String,
    totalSleepHours: Number,
    status: { type: String, enum: ['poor', 'healthy', 'oversleep'] },
    notes: String
}, { timestamps: true });
sleepLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

const activityItemSchema = new mongoose.Schema({
    type: String, duration: Number, notes: String
}, { _id: true });
const activityLogSchema = new mongoose.Schema({
    profileId: mongoose.Schema.Types.ObjectId,
    date: String,
    activities: [activityItemSchema],
    totalDuration: { type: Number, default: 0 },
    status: { type: String, default: 'Inactive' }
}, { timestamps: true });
activityLogSchema.index({ profileId: 1, date: 1 }, { unique: true });

// Register models (avoid OverwriteModelError)
const User        = mongoose.models.User        || mongoose.model('User', userSchema);
const Profile     = mongoose.models.Profile     || mongoose.model('Profile', profileSchema);
const MealLog     = mongoose.models.MealLog     || mongoose.model('MealLog', mealLogSchema);
const GrowthRecord= mongoose.models.GrowthRecord|| mongoose.model('GrowthRecord', growthRecordSchema);
const Prescription= mongoose.models.Prescription|| mongoose.model('Prescription', prescriptionSchema);
const DoctorAccess= mongoose.models.DoctorAccess|| mongoose.model('DoctorAccess', doctorAccessSchema);
const SleepLog    = mongoose.models.SleepLog    || mongoose.model('SleepLog', sleepLogSchema);
const ActivityLog  = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

// ─────────────────────────────────────────────
// MEAL DATA POOLS
// ─────────────────────────────────────────────
const BREAKFASTS = [
    { items: [{ name: 'Poha with peas and peanuts', quantity: '1 bowl', calories: 280, protein: 7, carbs: 48, fats: 6, fiber: 3, water: 50, vitamins: 'B1, Iron' }], snack: { name: 'Banana', quantity: '1 medium', calories: 89, protein: 1, carbs: 23, fats: 0, fiber: 2.6, water: 74 } },
    { items: [{ name: 'Idli with sambar', quantity: '3 idlis', calories: 260, protein: 9, carbs: 50, fats: 2, fiber: 2, water: 60, vitamins: 'B2, Iron' }], snack: { name: 'Apple slices', quantity: '1 apple', calories: 72, protein: 0, carbs: 19, fats: 0, fiber: 3.3, water: 85 } },
    { items: [{ name: 'Whole wheat upma with veggies', quantity: '1 bowl', calories: 240, protein: 6, carbs: 42, fats: 5, fiber: 4, water: 55, vitamins: 'B1, B3' }], snack: { name: 'Boiled egg', quantity: '1 egg', calories: 78, protein: 6, carbs: 1, fats: 5, fiber: 0, water: 37 } },
    { items: [{ name: 'Paratha with curd', quantity: '2 parathas', calories: 380, protein: 10, carbs: 55, fats: 13, fiber: 3, water: 40, vitamins: 'D, B12' }], snack: { name: 'Orange', quantity: '1 medium', calories: 62, protein: 1, carbs: 15, fats: 0, fiber: 3, water: 87 } },
    { items: [{ name: 'Oatmeal with milk and honey', quantity: '1 bowl', calories: 300, protein: 9, carbs: 52, fats: 6, fiber: 4, water: 200, vitamins: 'B1, D' }], snack: { name: 'Mixed nuts', quantity: '1 handful', calories: 170, protein: 5, carbs: 6, fats: 15, fiber: 2, water: 5 } },
    { items: [{ name: 'Dosa with coconut chutney', quantity: '2 dosas', calories: 290, protein: 6, carbs: 52, fats: 7, fiber: 2, water: 30, vitamins: 'B1, B6' }], snack: { name: 'Mango chunks', quantity: '1 cup', calories: 99, protein: 1, carbs: 25, fats: 0, fiber: 2.6, water: 83 } },
    { items: [{ name: 'Bread with peanut butter and jam', quantity: '2 slices', calories: 320, protein: 8, carbs: 50, fats: 10, fiber: 3, water: 10, vitamins: 'E, B6' }], snack: { name: 'Milk', quantity: '200ml', calories: 130, protein: 7, carbs: 10, fats: 7, fiber: 0, water: 175 } },
];

const LUNCHES = [
    [{ name: 'Dal rice with ghee', quantity: '1 plate', calories: 420, protein: 14, carbs: 72, fats: 8, fiber: 5, water: 100, vitamins: 'A, B6, Iron' }, { name: 'Cucumber raita', quantity: '1 bowl', calories: 80, protein: 4, carbs: 8, fats: 3, fiber: 1, water: 120, vitamins: 'D, B12' }],
    [{ name: 'Chicken curry with roti', quantity: '2 rotis + curry', calories: 480, protein: 28, carbs: 55, fats: 14, fiber: 4, water: 80, vitamins: 'B12, Iron' }, { name: 'Green salad', quantity: '1 bowl', calories: 45, protein: 2, carbs: 9, fats: 1, fiber: 3, water: 150, vitamins: 'K, C' }],
    [{ name: 'Rajma chawal', quantity: '1 plate', calories: 450, protein: 18, carbs: 78, fats: 5, fiber: 8, water: 90, vitamins: 'B1, Iron' }],
    [{ name: 'Vegetable biryani', quantity: '1 plate', calories: 380, protein: 9, carbs: 68, fats: 9, fiber: 5, water: 70, vitamins: 'A, C, B6' }, { name: 'Raita', quantity: '1 cup', calories: 80, protein: 4, carbs: 7, fats: 3, fiber: 0, water: 120, vitamins: 'B12' }],
    [{ name: 'Paneer butter masala with naan', quantity: '2 naan + paneer', calories: 520, protein: 20, carbs: 65, fats: 18, fiber: 4, water: 60, vitamins: 'A, D, B12' }],
    [{ name: 'Fish curry with rice', quantity: '1 plate', calories: 440, protein: 24, carbs: 60, fats: 10, fiber: 3, water: 85, vitamins: 'D, B12, Omega-3' }],
    [{ name: 'Chole with rice and onion', quantity: '1 plate', calories: 460, protein: 16, carbs: 80, fats: 7, fiber: 9, water: 95, vitamins: 'B6, Iron, C' }],
];

const DINNERS = [
    [{ name: 'Vegetable soup with bread', quantity: '1 bowl + 2 slices', calories: 280, protein: 8, carbs: 45, fats: 6, fiber: 5, water: 300, vitamins: 'A, C, B6' }],
    [{ name: 'Dal tadka with jeera rice', quantity: '1 plate', calories: 380, protein: 14, carbs: 66, fats: 6, fiber: 6, water: 100, vitamins: 'B1, Iron' }],
    [{ name: 'Egg bhurji with roti', quantity: '2 rotis + bhurji', calories: 360, protein: 18, carbs: 38, fats: 15, fiber: 3, water: 45, vitamins: 'B12, D' }],
    [{ name: 'Khichdi with ghee', quantity: '1 large bowl', calories: 340, protein: 11, carbs: 60, fats: 7, fiber: 5, water: 200, vitamins: 'B1, B6' }],
    [{ name: 'Chicken soup noodles', quantity: '1 bowl', calories: 310, protein: 16, carbs: 42, fats: 7, fiber: 3, water: 350, vitamins: 'B12, C' }],
    [{ name: 'Methi thepla with curd', quantity: '3 theplas', calories: 295, protein: 9, carbs: 46, fats: 8, fiber: 5, water: 60, vitamins: 'K, B6' }],
    [{ name: 'Palak paneer with roti', quantity: '2 rotis + paneer', calories: 420, protein: 18, carbs: 40, fats: 18, fiber: 5, water: 70, vitamins: 'A, D, Iron' }],
];

const ACTIVITIES = [
    [{ type: 'Playing', duration: 45, notes: 'Playground fun with friends' }, { type: 'Walking', duration: 20, notes: 'Evening walk with parents' }],
    [{ type: 'Outdoor Play', duration: 60, notes: 'Cricket in park' }],
    [{ type: 'Cycling', duration: 30, notes: 'Cycling in the colony' }, { type: 'Playing', duration: 20, notes: 'Indoor games' }],
    [{ type: 'School Physical Education', duration: 45, notes: 'PE class at school' }],
    [{ type: 'Swimming', duration: 60, notes: 'Swimming lessons' }],
    [{ type: 'Running', duration: 20, notes: 'Morning jog' }, { type: 'Playing', duration: 40, notes: 'After school play' }],
    [{ type: 'Dancing', duration: 45, notes: 'Dance class at school' }],
    [{ type: 'Sports', duration: 60, notes: 'Badminton with dad' }],
    [{ type: 'Yoga', duration: 30, notes: 'Morning yoga session' }],
];

const SLEEP_PATTERNS = [
    { sleepTime: '21:00', wakeUpTime: '06:30', hours: 9.5, status: 'healthy', notes: 'Good sleep, woke up fresh' },
    { sleepTime: '21:30', wakeUpTime: '06:30', hours: 9.0, status: 'healthy', notes: 'Normal sleep' },
    { sleepTime: '22:00', wakeUpTime: '06:30', hours: 8.5, status: 'healthy', notes: 'Slept a bit late' },
    { sleepTime: '22:30', wakeUpTime: '06:30', hours: 8.0, status: 'healthy', notes: 'Watched a show, slept late' },
    { sleepTime: '23:00', wakeUpTime: '06:30', hours: 7.5, status: 'poor', notes: 'Late night, restless sleep' },
    { sleepTime: '21:00', wakeUpTime: '07:30', hours: 10.5, status: 'oversleep', notes: 'Weekend, slept in' },
    { sleepTime: '20:30', wakeUpTime: '06:00', hours: 9.5, status: 'healthy', notes: 'Early to bed, early to rise' },
];

function getDateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

function calcBMI(height, weight) {
    return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
}

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function run() {
    try {
        console.log('\n🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!\n');

        // ── 1. PARENT USER ──────────────────────────────────────
        let parent = await User.findOne({ email: 'parent@test.com' });
        if (!parent) {
            console.log('Creating parent@test.com...');
            parent = new User({
                name: 'Abhi Parent', email: 'parent@test.com',
                password: 'password123', role: 'parent',
                title: 'Mr', phone: '9876543210',
                address: { city: 'Bangalore', state: 'Karnataka', country: 'India' }
            });
            await parent.save();
        } else {
            console.log('Parent already exists:', parent._id);
        }

        // ── 2. DOCTOR USER ──────────────────────────────────────
        let doctor = await User.findOne({ email: 'doctor@test.com' });
        if (!doctor) {
            console.log('Creating doctor@test.com...');
            doctor = new User({
                name: 'Dr. Priya Sharma', email: 'doctor@test.com',
                password: 'password123', role: 'doctor',
                title: 'Dr', phone: '9123456780',
                address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
                doctorProfile: {
                    specialization: 'Pediatrics',
                    hospitalName: "Rainbow Children's Hospital",
                    experienceYears: 12,
                    registrationId: 'MCI-PED-2012-0456'
                }
            });
            await doctor.save();
        } else {
            console.log('Doctor already exists:', doctor._id);
        }

        // ── 3. CHILD PROFILE "ABHI" ─────────────────────────────
        let child = await Profile.findOne({ name: 'Abhi', parentId: parent._id });
        if (!child) {
            console.log('Creating child profile: Abhi...');
            child = await Profile.create({
                parentId: parent._id,
                name: 'Abhi',
                age: 7,
                gender: 'male',
                dob: new Date('2018-03-12'),
                height: 120,
                weight: 22,
                activityLevel: 'moderate',
                dietaryPreferences: ['vegetarian-friendly'],
                healthConditions: ['mild iron deficiency'],
                goals: ['Improve immunity', 'Build healthy eating habits', 'Increase energy levels'],
                avatar: 'lion',
                level: 5,
                currentXP: 1250,
                streakCount: 18,
                superheroesUnlocked: ['Captain Milk', 'Veggie Ranger', 'Iron Chef'],
                equippedCompanion: 'Veggie Ranger'
            });
            console.log(`✅ Created Abhi profile: ${child._id}`);
        } else {
            console.log(`Abhi profile already exists: ${child._id}. Updating...`);
            child.height = 120; child.weight = 22;
            child.level = 5; child.currentXP = 1250; child.streakCount = 18;
            child.superheroesUnlocked = ['Captain Milk', 'Veggie Ranger', 'Iron Chef'];
            await child.save();
        }

        // ── 4. DOCTOR ACCESS ────────────────────────────────────
        let access = await DoctorAccess.findOne({
            doctorId: doctor._id, parentId: parent._id, profileId: child._id
        });
        if (!access) {
            console.log('Granting doctor active access to Abhi...');
            await DoctorAccess.create({
                doctorId: doctor._id,
                parentId: parent._id,
                profileId: child._id,
                status: 'active',
                message: 'Please check my son Abhi for nutritional guidance.',
                doctorMessage: 'Access granted. Monitoring nutritional patterns closely.'
            });
            console.log('✅ Doctor access created');
        } else {
            console.log('Doctor access already exists. Ensuring active status...');
            access.status = 'active';
            await access.save();
        }

        // ── 5. MEAL LOGS — 30 DAYS ──────────────────────────────
        console.log('\n📅 Seeding 30 days of meal logs...');
        let mealCount = 0;
        for (let day = 0; day < 30; day++) {
            const dateStr = getDateStr(day);
            const bIdx = day % BREAKFASTS.length;
            const lIdx = day % LUNCHES.length;
            const dIdx = day % DINNERS.length;
            const bf = BREAKFASTS[bIdx];

            const morningSnack = bf.snack ? [{ ...bf.snack, vitamins: bf.snack.vitamins || '' }] : [];
            const afternoon = [{ name: 'Fruit salad', quantity: '1 cup', calories: 85, protein: 1, carbs: 21, fats: 0, fiber: 2.5, water: 80, vitamins: 'C, A' }];
            const evening   = [{ name: 'Milk with Horlicks', quantity: '1 glass', calories: 140, protein: 6, carbs: 20, fats: 4, fiber: 0, water: 180, vitamins: 'D, B12, Calcium' }];

            try {
                await MealLog.findOneAndUpdate(
                    { profileId: child._id, date: dateStr },
                    {
                        $set: {
                            profileId: child._id,
                            date: dateStr,
                            breakfast: bf.items,
                            morningSnack,
                            lunch: LUNCHES[lIdx],
                            afternoonSnack: afternoon,
                            dinner: DINNERS[dIdx],
                            eveningSnack: evening,
                            completedMealsCount: 6,
                            isStreakCounted: true,
                            lastMealAt: new Date(`${dateStr}T20:00:00.000Z`)
                        }
                    },
                    { upsert: true, new: true }
                );
                mealCount++;
            } catch (e) {
                console.warn(`  ⚠️  Meal log ${dateStr}: ${e.message}`);
            }
        }
        console.log(`✅ ${mealCount}/30 meal logs seeded`);

        // ── 6. SLEEP LOGS — 30 DAYS ─────────────────────────────
        console.log('\n😴 Seeding 30 days of sleep logs...');
        let sleepCount = 0;
        for (let day = 0; day < 30; day++) {
            const dateStr = getDateStr(day);
            const pattern = SLEEP_PATTERNS[day % SLEEP_PATTERNS.length];
            try {
                await SleepLog.findOneAndUpdate(
                    { profileId: child._id, date: dateStr },
                    {
                        $set: {
                            profileId: child._id,
                            date: dateStr,
                            sleepTime: pattern.sleepTime,
                            wakeUpTime: pattern.wakeUpTime,
                            totalSleepHours: pattern.hours,
                            status: pattern.status,
                            notes: pattern.notes
                        }
                    },
                    { upsert: true, new: true }
                );
                sleepCount++;
            } catch (e) {
                console.warn(`  ⚠️  Sleep log ${dateStr}: ${e.message}`);
            }
        }
        console.log(`✅ ${sleepCount}/30 sleep logs seeded`);

        // ── 7. ACTIVITY LOGS — 30 DAYS ──────────────────────────
        console.log('\n🏃 Seeding 30 days of activity logs...');
        let actCount = 0;
        for (let day = 0; day < 30; day++) {
            const dateStr = getDateStr(day);
            const acts = ACTIVITIES[day % ACTIVITIES.length];
            const total = acts.reduce((sum, a) => sum + a.duration, 0);
            try {
                await ActivityLog.findOneAndUpdate(
                    { profileId: child._id, date: dateStr },
                    {
                        $set: {
                            profileId: child._id,
                            date: dateStr,
                            activities: acts,
                            totalDuration: total,
                            status: total >= 60 ? 'Active' : 'Inactive'
                        }
                    },
                    { upsert: true, new: true }
                );
                actCount++;
            } catch (e) {
                console.warn(`  ⚠️  Activity log ${dateStr}: ${e.message}`);
            }
        }
        console.log(`✅ ${actCount}/30 activity logs seeded`);

        // ── 8. GROWTH RECORDS — weekly ──────────────────────────
        console.log('\n📏 Seeding growth records (weekly for 4 weeks)...');
        const growthEntries = [
            { daysAgo: 28, height: 118.5, weight: 21.2, notes: 'Initial measurement at clinic start of month', verified: true },
            { daysAgo: 21, height: 119.0, weight: 21.5, notes: 'Normal growth progression, diet is good', verified: true },
            { daysAgo: 14, height: 119.5, weight: 21.8, notes: 'Height on track for age, slight weight gain noted', verified: true },
            { daysAgo:  7, height: 120.0, weight: 22.0, notes: 'BMI normal, iron levels improving', verified: false },
            { daysAgo:  0, height: 120.2, weight: 22.2, notes: 'Latest measurement — healthy trajectory', verified: false },
        ];
        for (const g of growthEntries) {
            const bmi = calcBMI(g.height, g.weight);
            const ts = new Date();
            ts.setDate(ts.getDate() - g.daysAgo);
            // avoid duplicates on same day
            const existing = await GrowthRecord.findOne({
                childId: child._id,
                timestamp: { $gte: new Date(ts.toDateString()), $lt: new Date(new Date(ts.toDateString()).getTime() + 86400000) }
            });
            if (!existing) {
                await GrowthRecord.create({
                    childId: child._id,
                    height: g.height, weight: g.weight,
                    bmi, percentile: 52, riskStatus: 'normal',
                    ageInMonths: 87, // 7y 3m
                    recordedByRole: g.verified ? 'doctor' : 'parent',
                    recordedByUserId: g.verified ? doctor._id : parent._id,
                    verified: g.verified,
                    notes: g.notes,
                    timestamp: ts
                });
            }
        }
        console.log(`✅ Growth records seeded (5 weekly records)`);

        // ── 9. PRESCRIPTIONS / DOCTOR CHECKUPS ──────────────────
        console.log('\n📋 Seeding doctor prescriptions & checkup notes...');
        const prescriptions = [
            {
                daysAgo: 25,
                title: 'Monthly Nutritional Assessment — June',
                diagnosis: 'Mild iron deficiency anemia (Hb: 10.2 g/dL)',
                instructions: 'Start iron supplementation: Ferrous sulphate 30mg once daily after dinner. Increase iron-rich foods: dark leafy greens, lentils, fortified cereals. Pair with Vitamin C sources (citrus, guava) to improve absorption. Avoid giving milk within 1 hour of iron supplement. Schedule CBC repeat in 4 weeks.',
                notes: 'Child appears healthy and active. Growth trajectory is normal (50th-55th percentile). Parents advised on dietary modifications. Will review at next visit.'
            },
            {
                daysAgo: 18,
                title: 'Follow-up: Iron Levels & Diet Review',
                diagnosis: 'Iron deficiency — improving. Dietary compliance: good.',
                instructions: 'Continue iron supplements for 2 more months. Diet diary shows good compliance with prescribed foods. Add spinach and beetroot to weekly diet at least 3x per week. Continue Vitamin C with every iron-rich meal. Growth is on track — no concerns.',
                notes: 'Mother reports child is more energetic since starting supplements. Appetite has improved. Color in lips/nails looks better. Continue current plan.'
            },
            {
                daysAgo: 10,
                title: 'Routine Pediatric Checkup — Vitamins & Immunity',
                diagnosis: 'Healthy child, appropriate growth for age. Mild Vitamin D insufficiency noted.',
                instructions: 'Prescribe Vitamin D3 400 IU daily (drops or chewable). Ensure 20-30 mins of outdoor sunlight exposure daily, ideally between 9-11am. Add eggs, fortified milk, and fatty fish (sardines) once weekly. Reduce screen time before bed for better sleep. Seasonal flu vaccine recommended this month.',
                notes: 'Parents expressed concern about child being picky with vegetables. Advised gradual introduction strategy — mix veggies in favorite dishes. Provided a kid-friendly meal plan handout.'
            },
            {
                daysAgo: 3,
                title: 'Digital Health Review — Nutrition Trends Analysis',
                diagnosis: 'Overall nutrition score: 74/100. Areas of concern: Calcium intake below RDA, Sugar slightly elevated.',
                instructions: '1. Increase dairy: Minimum 2 glasses of milk or equivalent (paneer, curd) daily.\n2. Reduce packaged snacks and sugary drinks completely.\n3. Increase water intake to 1.5-2L per day.\n4. Add almonds or walnuts as afternoon snack instead of processed foods.\n5. Maintain current meal logging streak — excellent compliance for 18 consecutive days.\n6. Next checkup in 3 weeks. Will run blood panel for full micronutrient levels.',
                notes: 'Reviewed digital twin analysis. Data shows caloric intake is appropriate but macro distribution needs adjustment — slightly high carbs, adequate protein for age. Parents are very engaged with the platform. Excellent tracking consistency. Projected 90-day health score: 82/100 if current habits maintained.'
            },
        ];

        let prescCount = 0;
        for (const p of prescriptions) {
            const date = new Date();
            date.setDate(date.getDate() - p.daysAgo);
            // Check if prescription with same title already exists
            const exists = await Prescription.findOne({ profileId: child._id, title: p.title });
            if (!exists) {
                await Prescription.create({
                    doctorId: doctor._id,
                    profileId: child._id,
                    title: p.title,
                    diagnosis: p.diagnosis,
                    instructions: p.instructions,
                    notes: p.notes,
                    date
                });
                prescCount++;
            }
        }
        console.log(`✅ ${prescCount} prescription(s) created (${prescriptions.length - prescCount} already existed)`);

        // ── SUMMARY ─────────────────────────────────────────────
        console.log('\n' + '═'.repeat(55));
        console.log('✅  ALL DONE! Here\'s a summary:');
        console.log('═'.repeat(55));
        console.log(`👤  Child Profile: Abhi  (ID: ${child._id})`);
        console.log(`👪  Parent Login:  parent@test.com / password123`);
        console.log(`🩺  Doctor Login:  doctor@test.com / password123`);
        console.log(`📅  Meal Logs:     30 days (Breakfast + Snacks + Lunch + Dinner)`);
        console.log(`😴  Sleep Logs:    30 days`);
        console.log(`🏃  Activity Logs: 30 days`);
        console.log(`📏  Growth Records:5 weekly snapshots`);
        console.log(`📋  Prescriptions: 4 doctor checkup notes`);
        console.log(`🤖  Digital Twin:  Ready to analyze (call /api/twin/${child._id})`);
        console.log('═'.repeat(55));
        console.log('\n🌐 Go to: http://localhost:3000');
        console.log('   Parent → My Kids → Abhi → tabs: Overview, Digital Twin, Growth, Sleep, Activity');
        console.log('   Doctor → Patients → Abhi → tabs: Clinical Overview, Digital Twin, Prescriptions\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Seeding error:', err.message);
        console.error(err);
        process.exit(1);
    }
}

run();
