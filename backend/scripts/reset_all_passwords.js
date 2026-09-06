import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.model.js';

const updates = [
    { email: 'parent@nutrikid.com', newPassword: 'Password123!', role: 'parent' },
    { email: 'parent.test@nutrikid.com', newPassword: 'Password123!', role: 'parent' },
    { email: 'doctor@nutrikid.com', newPassword: 'Password123!', role: 'doctor' },
    { email: 'doctor.test@nutrikid.com', newPassword: 'Password123!', role: 'doctor' },
    { email: 'dietitian@nutrikid.com', newPassword: 'Password123!', role: 'dietitian' },
    { email: 'admin@nutrikid.com', newPassword: 'Admin@123456', role: 'admin' },
    { email: 'admin.test@nutrikid.com', newPassword: 'Admin@123456', role: 'admin' },
];

await mongoose.connect(process.env.MONGO_URI);

for (const { email, newPassword, role } of updates) {
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`❌ NOT FOUND: ${email}`);
        continue;
    }
    // Set plain text — pre-save hook will hash it
    user.password = newPassword;
    user.accountLockedUntil = null;
    // Ensure Available status for doctors/dietitians
    if (role !== 'parent') {
        user.availabilityStatus = 'Available';
    }
    await user.save();

    const fresh = await User.findOne({ email });
    const match = await fresh.matchPassword(newPassword);
    console.log(`${match ? '✅' : '❌'} ${role}: ${email} → password=${newPassword}`);
}

console.log('\n🎉 All accounts updated. Use Test@123 for everyone.');
await mongoose.disconnect();
process.exit(0);
