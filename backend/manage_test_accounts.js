import mongoose from 'mongoose';
import User from './models/User.model.js';
import Profile from './models/Profile.model.js';
import MealLog from './models/MealLog.model.js';
import GrowthRecord from './models/GrowthRecord.model.js';
import DoctorAccess from './models/DoctorAccess.model.js';

const MONGO_URI = "mongodb+srv://pv839910_db_user:Pavan3107@cluster0.qf9utna.mongodb.net/nutrikid?appName=Cluster0";

async function run() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");

        // 1. Parent Account
        let parent = await User.findOne({ email: "parent@test.com" });
        if (!parent) {
            console.log("Creating parent@test.com...");
            parent = await User.create({
                name: "Test Parent",
                email: "parent@test.com",
                password: "password123", // Will be hashed by pre-save middleware
                role: "parent",
                title: "Mr",
                phone: "1234567890",
                address: { city: "New York", state: "NY", country: "USA" }
            });
        } else {
            console.log("Parent parent@test.com already exists. Updating password to password123...");
            parent.password = "password123";
            await parent.save();
        }
        console.log(`Parent ID: ${parent._id}`);

        // 2. Doctor Account
        let doctor = await User.findOne({ email: "doctor@test.com" });
        if (!doctor) {
            console.log("Creating doctor@test.com...");
            doctor = await User.create({
                name: "Test Doctor",
                email: "doctor@test.com",
                password: "password123",
                role: "doctor",
                title: "Mr",
                phone: "9876543210",
                address: { city: "Boston", state: "MA", country: "USA" },
                doctorProfile: {
                    specialization: "Pediatrics",
                    hospitalName: "Children's Health Hospital",
                    experienceYears: 10,
                    registrationId: "DOC12345"
                }
            });
        } else {
            console.log("Doctor doctor@test.com already exists. Updating password to password123...");
            doctor.password = "password123";
            await doctor.save();
        }
        console.log(`Doctor ID: ${doctor._id}`);

        // 3. Child Profile for Parent
        let child = await Profile.findOne({ name: "Twin Child Test" });
        if (!child) {
            console.log("Creating Twin Child Test profile...");
            child = await Profile.create({
                parentId: parent._id,
                name: "Twin Child Test",
                age: 5,
                gender: "male",
                height: 110,
                weight: 18,
                activityLevel: "moderate",
                dietaryPreferences: ["dairy-free"],
                healthConditions: ["asthma"],
                avatar: "bear"
            });
        } else {
            console.log(`Child Twin Child Test already exists: ${child._id}. Linking to parent ID.`);
            child.parentId = parent._id;
            await child.save();
        }
        console.log(`Child Profile ID: ${child._id}`);

        // 4. Ensure some meal log exists
        const todayStr = new Date().toISOString().split('T')[0];
        let mealLog = await MealLog.findOne({ profileId: child._id, date: todayStr });
        if (!mealLog) {
            console.log("Creating meal log for child...");
            mealLog = await MealLog.create({
                profileId: child._id,
                date: todayStr,
                breakfast: [{ name: "Oatmeal with fruit", calories: 200, protein: 6, carbs: 35, fats: 4 }],
                lunch: [{ name: "Rice and Beans", calories: 300, protein: 10, carbs: 50, fats: 6 }],
                dinner: [{ name: "Vegetable Soup", calories: 150, protein: 4, carbs: 25, fats: 3 }],
                waterIntake: 1200
            });
        }

        // 5. Ensure some growth record exists
        let growthRecord = await GrowthRecord.findOne({ childId: child._id });
        if (!growthRecord) {
            console.log("Creating growth record for child...");
            growthRecord = await GrowthRecord.create({
                childId: child._id,
                height: 110,
                weight: 18,
                bmi: 14.9,
                percentile: 50,
                recordedByRole: "parent",
                recordedByUserId: parent._id
            });
        }

        // 6. Grant doctor access to child profile
        let doctorAccess = await DoctorAccess.findOne({ doctorId: doctor._id, parentId: parent._id, profileId: child._id });
        if (!doctorAccess) {
            console.log("Granting doctor access to child...");
            doctorAccess = await DoctorAccess.create({
                doctorId: doctor._id,
                parentId: parent._id,
                profileId: child._id,
                status: "active"
            });
        }

        console.log("Seeding and validation setups done successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error setting up accounts:", err);
        process.exit(1);
    }
}

run();
