import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import Prescription from '../models/Prescription.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';

async function assignDoctorDietitianAndCheckups() {
    console.log('🌱 Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB!');

    // 1. Find or create Parent (Sneha Sharma)
    let parent = await User.findOne({ email: 'parent@nutrikid.com' });
    if (!parent) {
        parent = await User.findOne({ email: 'parent.test@nutrikid.com' });
    }
    if (!parent) {
        throw new Error('Parent user not found. Run seed_21days_parent_data.js first.');
    }

    // 2. Find Child Profiles (Ananya & Aarav)
    const ananya = await Profile.findOne({ parentId: parent._id, name: 'Ananya Sharma' });
    const aarav = await Profile.findOne({ parentId: parent._id, name: 'Aarav Sharma' });

    if (!ananya || !aarav) {
        throw new Error('Child profiles not found for parent.');
    }

    console.log(`✅ Found parent: ${parent.name} and children: ${ananya.name}, ${aarav.name}`);

    // 3. Create or update Verified Pediatrician (Dr. Rajesh Iyer)
    let doctor = await User.findOne({ email: 'doctor@nutrikid.com' });
    if (!doctor) {
        doctor = await User.findOne({ email: 'doctor.test@nutrikid.com' });
    }

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
        console.log(`✅ Created Doctor: ${doctor.name} (${doctor.email})`);
    } else {
        Object.assign(doctor, doctorData);
        doctor.password = 'Password123!';
        await doctor.save();
        console.log(`✅ Updated Doctor: ${doctor.name} (${doctor.email})`);
    }

    // 4. Create or update Certified Clinical Dietitian (Dt. Anjali Mehta)
    let dietitian = await User.findOne({ email: 'dietitian@nutrikid.com' });
    if (!dietitian) {
        dietitian = await User.findOne({ email: 'dietitian.test@nutrikid.com' });
    }

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
        console.log(`✅ Created Dietitian: ${dietitian.name} (${dietitian.email})`);
    } else {
        Object.assign(dietitian, dietitianData);
        dietitian.password = 'Password123!';
        await dietitian.save();
        console.log(`✅ Updated Dietitian: ${dietitian.name} (${dietitian.email})`);
    }

    // 5. Establish DoctorAccess permissions
    await DoctorAccess.deleteMany({ parentId: parent._id });

    await DoctorAccess.create({
        doctorId: doctor._id,
        parentId: parent._id,
        profileId: ananya._id,
        status: 'active',
        fullAccessRequested: true,
        message: "Assigned Primary Pediatrician for Ananya Sharma",
        doctorMessage: "Access granted for growth tracking and monthly nutrition consultations."
    });

    await DoctorAccess.create({
        doctorId: doctor._id,
        parentId: parent._id,
        profileId: aarav._id,
        status: 'active',
        fullAccessRequested: true,
        message: "Assigned Primary Pediatrician for Aarav Sharma",
        doctorMessage: "Access granted for developmental checkups and dietary allergy monitoring."
    });

    console.log(`✅ Established Active DoctorAccess for both children with Dr. Rajesh Iyer`);

    // 6. Establish Clinical Doctor-Dietitian Group
    await DietitianDoctorGroup.deleteMany({ dietitianId: dietitian._id });
    await DietitianDoctorGroup.create({
        doctorId: doctor._id,
        dietitianId: dietitian._id
    });
    console.log(`✅ Created Pediatric Collaboration Group: Dr. Rajesh Iyer + Dt. Anjali Mehta`);

    // 7. Create Checkup History, Clinical Prescriptions & Consultations
    await Prescription.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });
    await ConsultationRequest.deleteMany({ profileId: { $in: [ananya._id, aarav._id] } });

    // Prescription for Ananya
    const rxAnanya = await Prescription.create({
        doctorId: doctor._id,
        profileId: ananya._id,
        title: "Quarterly Pediatric Nutrition Review & Iron Synergy Plan",
        diagnosis: "Healthy growth progression with mild seasonal non-heme iron shortfall. Zero allergy triggers observed.",
        notes: "Ananya is active and in the 65th WHO height percentile. Recent 21-day dietary logs reflect significant improvement in breakfast consistency and hydration. Recommend continuing Sprouted Ragi + Vitamin C pairings.",
        instructions: "1. Sprouted Ragi Idli / Dosa 3x weekly with orange/lemon accompaniment for iron synergy.\n2. Maintain 20 mins morning outdoor activity for natural Vitamin D3 synthesis.\n3. Keep hydration at 1750 ml/day.\n4. Avoid all peanut-derived packaged snacks.",
        nextCheckupDays: 75,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    // Consultation Request for Ananya
    await ConsultationRequest.create({
        profileId: ananya._id,
        parentId: parent._id,
        doctorId: doctor._id,
        dietitianId: dietitian._id,
        status: 'PrescriptionIssued',
        dietitianNotes: "Reviewed 21-day meal history. Protein and calcium targets are well balanced. Added roasted jaggery makhana for post-school sports stamina.",
        doctorNotes: "Growth trajectory is on track. Endorsed dietitian's 7-day personalized meal plan.",
        prescriptionId: rxAnanya._id,
        assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        doctorAssignedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    // Prescription for Aarav
    const rxAarav = await Prescription.create({
        doctorId: doctor._id,
        profileId: aarav._id,
        title: "Picky Eating Resolution & Lactose Sensitivity Care Plan",
        diagnosis: "Mild lactose sensitivity under control; healthy weight gain trajectory.",
        notes: "Aarav is transitioning well with fortified almond milk and yellow moong dal khichdi. Micronutrient coverage is steady.",
        instructions: "1. Continue plant-based fortified milk with nutmeg.\n2. Soft mashed vegetables (pumpkin, carrots) with ghee.\n3. Daily hydration target: 1300 ml.",
        nextCheckupDays: 60,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Consultation Request for Aarav
    await ConsultationRequest.create({
        profileId: aarav._id,
        parentId: parent._id,
        doctorId: doctor._id,
        dietitianId: dietitian._id,
        status: 'PrescriptionIssued',
        dietitianNotes: "Customized lactose-free 6-meal daily schedule. Picky eating behavior is improving.",
        doctorNotes: "Digestive tolerance confirmed. Physical growth milestones are normal.",
        prescriptionId: rxAarav._id,
        assignedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        doctorAssignedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created Doctor Checkup History & Clinical Prescriptions for both children`);

    // 8. Update Child Profile doctor/clinic linkages and valid medicalReports
    ananya.medicalReports = [
        {
            reportName: "Pediatric Growth & Iron Profile Review",
            reportDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            hospitalName: "Rainbow Children's Hospital, Bengaluru",
            doctorName: "Dr. Rajesh Iyer, MD",
            comments: "Iron bioavailability improvement plan active. Growth percentiles normal.",
            attachment: "/reports/ananya_iron_growth_review.pdf",
            status: "Reviewed"
        }
    ];

    ananya.wellnessAnalysis = {
        score: 88,
        nutritionScore: 89,
        deficiencyScore: 86,
        growthRiskScore: 92,
        hydrationScore: 95,
        mealQualityScore: 88,
        aiExplanation: "Ananya has demonstrated significant improvement over the past 21 days with steady iron intake and excellent 100% hydration consistency."
    };
    await ananya.save();

    aarav.medicalReports = [
        {
            reportName: "Developmental Milestone & Allergy Clearance",
            reportDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            hospitalName: "Rainbow Children's Hospital, Bengaluru",
            doctorName: "Dr. Rajesh Iyer, MD",
            comments: "Lactose sensitivity managed effectively with fortified plant nutrition.",
            attachment: "/reports/aarav_milestone_review.pdf",
            status: "Reviewed"
        }
    ];

    aarav.wellnessAnalysis = {
        score: 84,
        nutritionScore: 85,
        deficiencyScore: 82,
        growthRiskScore: 88,
        hydrationScore: 90,
        mealQualityScore: 82,
        aiExplanation: "Aarav is achieving steady caloric adequacy and consistent picky-eating recovery with soft vegetable and dal khichdi diets."
    };
    await aarav.save();

    console.log(`\n======================================================`);
    console.log(`🎉 ASSIGNMENT & CHECKUP HISTORY COMPLETE!`);
    console.log(`👨‍⚕️ Assigned Pediatrician: Dr. Rajesh Iyer, MD (Rainbow Children's Hospital)`);
    console.log(`🥗 Assigned Dietitian:     Dt. Anjali Mehta, RD (Pediatric Clinical Dietetics)`);
    console.log(`📋 Prescriptions & Notes:  Active for Ananya & Aarav (Checked in last 5-10 days)`);
    console.log(`💧 Hydration Streak:       21 Days Logged (1750 ml / 1300 ml goals active)`);
    console.log(`⭐ Wellness Scores:        Ananya (88/100) & Aarav (84/100)`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
}

assignDoctorDietitianAndCheckups().catch(err => {
    console.error('❌ Error in assignment script:', err);
    process.exit(1);
});
