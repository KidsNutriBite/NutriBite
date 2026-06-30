import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import DietitianDoctorGroup from '../models/DietitianDoctorGroup.model.js';

await mongoose.connect(process.env.MONGO_URI);

// Find Arjun
const arjun = await User.findOne({ email: 'arjun@gmail.com', role: 'dietitian' });
if (!arjun) {
    console.log('❌ Arjun not found!');
    await mongoose.disconnect();
    process.exit(1);
}
console.log(`✅ Found Arjun: ${arjun.name} (${arjun._id})`);

// Ensure Arjun is Available
if (arjun.availabilityStatus !== 'Available') {
    arjun.availabilityStatus = 'Available';
    await arjun.save();
    console.log('✅ Set Arjun availability to Available');
}

// Get ALL doctors and set them all to Available
const allDoctors = await User.find({ role: 'doctor' });
for (const doc of allDoctors) {
    if (doc.availabilityStatus !== 'Available') {
        doc.availabilityStatus = 'Available';
        await doc.save();
    }
}
const doctorIds = allDoctors.map(d => d._id);
console.log(`✅ Found ${allDoctors.length} doctors:`, allDoctors.map(d => d.name));

// Check if Arjun already has a group
const existingGroup = await DietitianDoctorGroup.findOne({ dietitianId: arjun._id });
if (existingGroup) {
    // Update the existing group to include all doctors
    existingGroup.doctorIds = doctorIds;
    await existingGroup.save();
    console.log(`✅ Updated existing group for Arjun with ${doctorIds.length} doctors`);
} else {
    // Create a new group
    const group = await DietitianDoctorGroup.create({
        dietitianId: arjun._id,
        doctorIds: doctorIds,
    });
    console.log(`✅ Created new DietitianDoctorGroup for Arjun:`, group._id);
}

// Verify
const finalGroup = await DietitianDoctorGroup.findOne({ dietitianId: arjun._id }).populate('doctorIds', 'name email availabilityStatus');
console.log('\n=== ARJUN\'s GROUP ===');
finalGroup.doctorIds.forEach(d => {
    console.log(` - ${d.name} (${d.email}) | Status: ${d.availabilityStatus}`);
});
console.log('\n🎉 Done! Arjun can now assign doctors to cases.');

await mongoose.disconnect();
process.exit(0);
