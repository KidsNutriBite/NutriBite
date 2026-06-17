import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DoctorAccess from '../models/DoctorAccess.model.js';
import Profile from '../models/Profile.model.js';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const doctorId = new mongoose.Types.ObjectId('6a2d2b4b02b1b842e3515b89'); // Test Doctor

        // 1. Profile 1: Abhi (Full Access)
        const abhi = await Profile.findOne({ name: 'Abhi', parentId: new mongoose.Types.ObjectId('6a2d2b4a02b1b842e3515b84') });
        if (abhi) {
            console.log(`Found Abhi: ${abhi._id}`);
            let access = await DoctorAccess.findOne({ doctorId, profileId: abhi._id });
            if (!access) {
                access = new DoctorAccess({ doctorId, parentId: abhi.parentId, profileId: abhi._id });
            }
            access.status = 'active';
            await access.save();
            console.log("✅ Set Abhi access status to 'active' (Full Access)");
        } else {
            console.log("❌ Profile 'Abhi' not found");
        }

        // 2. Profile 2: Ravi (Partial/Restricted Access)
        const twin = await Profile.findOne({ name: 'Ravi', parentId: new mongoose.Types.ObjectId('6a2d2b4a02b1b842e3515b84') });
        if (twin) {
            console.log(`Found Ravi: ${twin._id}`);
            let access = await DoctorAccess.findOne({ doctorId, profileId: twin._id });
            if (!access) {
                access = new DoctorAccess({ doctorId, parentId: twin.parentId, profileId: twin._id });
            }
            access.status = 'restricted';
            access.message = "Hello Doctor, I am sharing access to my child's profile because he has had a low appetite for the last week. Please take a look at his basic stats and advise.";
            await access.save();
            console.log("✅ Set Ravi access status to 'restricted' (Partial Access) with message");
        } else {
            console.log("❌ Profile 'Ravi' not found");
        }

        console.log("\nAccess adjustment successful!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
