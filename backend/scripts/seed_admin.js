import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';
        console.log(`Connecting to database: ${mongoUri}`);
        await mongoose.connect(mongoUri);

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutrikid.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
        const adminName = process.env.ADMIN_NAME || 'Platform Administrator';

        let admin = await User.findOne({ email: adminEmail.toLowerCase().trim() });

        if (admin) {
            console.log(`Admin account already exists for ${adminEmail}. Updating credentials & role...`);
            admin.role = 'admin';
            admin.name = adminName;
            admin.status = 'Active';
            admin.password = adminPassword; // Will be hashed by pre-save hook
            await admin.save();
            console.log(`✅ Admin account updated successfully: ${adminEmail}`);
        } else {
            console.log(`Creating new admin account for ${adminEmail}...`);
            admin = await User.create({
                name: adminName,
                email: adminEmail.toLowerCase().trim(),
                password: adminPassword,
                role: 'admin',
                title: 'Mr',
                status: 'Active',
                is2FAEnabled: false,
            });
            console.log(`✅ Admin account created successfully: ${adminEmail}`);
        }

        console.log(`----------------------------------------`);
        console.log(`Role: ${admin.role}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Status: ${admin.status}`);
        console.log(`2FA Enabled: ${admin.is2FAEnabled}`);
        console.log(`----------------------------------------`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding admin account:', err);
        process.exit(1);
    }
};

seedAdmin();
