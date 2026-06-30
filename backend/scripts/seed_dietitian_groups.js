import mongoose from 'mongoose';
import User from '../models/User.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nutrikid");
        console.log("Connected successfully!");

        // 1. Create or Find Dietitian
        let dietitian = await User.findOne({ role: 'dietitian' });
        if (!dietitian) {
            console.log("No dietitian found. Creating a test Dietitian...");
            dietitian = await User.create({
                name: "Sarah Jenkins",
                email: "dietitian@nutrikid.com",
                password: "Password123",
                role: "dietitian",
                title: "Ms",
                availabilityStatus: "Available",
                dietitianProfile: {
                    specialization: "Pediatric Nutrition & Allergies",
                    experienceYears: 6,
                    registrationId: "RD-54321"
                }
            });
            console.log("Created Dietitian:", dietitian.email);
        } else {
            console.log("Found existing Dietitian:", dietitian.email);
            // Ensure status is Available for testing
            dietitian.availabilityStatus = "Available";
            await dietitian.save();
        }

        // 2. Create or Find Doctors
        let doctors = await User.find({ role: 'doctor' });
        if (doctors.length < 2) {
            console.log("Creating test Doctors...");
            const doc1 = await User.create({
                name: "John Carter",
                email: "carter@nutrikid.com",
                password: "Password123",
                role: "doctor",
                title: "Mr",
                availabilityStatus: "Available",
                doctorProfile: {
                    specialization: "General Pediatrics",
                    hospitalName: "City Children's Hospital",
                    experienceYears: 10,
                    registrationId: "MD-12345"
                }
            });
            const doc2 = await User.create({
                name: "Elizabeth Vance",
                email: "vance@nutrikid.com",
                password: "Password123",
                role: "doctor",
                title: "Ms",
                availabilityStatus: "Available",
                doctorProfile: {
                    specialization: "Pediatric Endocrinology",
                    hospitalName: "St. Jude Pediatric Center",
                    experienceYears: 8,
                    registrationId: "MD-67890"
                }
            });
            doctors = [doc1, doc2];
            console.log("Created doctors:", doc1.email, doc2.email);
        } else {
            console.log(`Found ${doctors.length} existing Doctors. Ensuring they are Available...`);
            for (const doc of doctors) {
                doc.availabilityStatus = "Available";
                await doc.save();
            }
        }

        // 3. Link Dietitian to Doctors in DietitianDoctorGroup
        let group = await DietitianDoctorGroup.findOne({ dietitianId: dietitian._id });
        const doctorIds = doctors.map(d => d._id);

        if (!group) {
            console.log("Creating DietitianDoctorGroup mapping...");
            group = await DietitianDoctorGroup.create({
                dietitianId: dietitian._id,
                doctorIds
            });
        } else {
            console.log("Updating existing DietitianDoctorGroup mapping...");
            group.doctorIds = doctorIds;
            await group.save();
        }

        console.log("Successfully seeded Dietitian-Doctor relationships!");
        console.log(`Dietitian ${dietitian.name} manages Doctor pool:`, doctors.map(d => `Dr. ${d.name}`).join(", "));

        await mongoose.disconnect();
        console.log("Database disconnected.");
    } catch (error) {
        console.error("Seeding failed:", error);
    }
}

seed();
