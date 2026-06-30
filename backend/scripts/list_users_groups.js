import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';

await mongoose.connect(process.env.MONGO_URI);

// Find Arjun the dietitian
const arjun = await User.findOne({ role: 'dietitian' });
console.log('\n=== DIETITIANS FOUND ===');
const allDietitians = await User.find({ role: 'dietitian' }).select('_id name email availabilityStatus');
allDietitians.forEach(d => console.log(JSON.stringify(d)));

// Find all doctors
console.log('\n=== DOCTORS FOUND ===');
const allDoctors = await User.find({ role: 'doctor' }).select('_id name email availabilityStatus');
allDoctors.forEach(d => console.log(JSON.stringify(d)));

// Find existing groups
console.log('\n=== EXISTING DIETITIAN-DOCTOR GROUPS ===');
const groups = await DietitianDoctorGroup.find({}).populate('dietitianId', 'name email').populate('doctorIds', 'name email');
groups.forEach(g => console.log(JSON.stringify({
    dietitian: g.dietitianId?.name,
    doctors: g.doctorIds?.map(d => d.name)
})));

await mongoose.disconnect();
process.exit(0);
