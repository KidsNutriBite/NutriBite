import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import LoginAudit from '../models/LoginAudit.model.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
    console.log('====================================================');
    console.log('🧪 Starting NutriKids Admin Portal Verification Suite');
    console.log('====================================================');

    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrikid';
    await mongoose.connect(mongoUri);

    let parentToken = '';
    let doctorToken = '';
    let adminToken = '';
    let testParentId = '';

    // 1. Seed or find test users
    console.log('\n[1/7] Setting up test users (Parent, Doctor, Admin)...');
    
    // Test Admin
    let adminUser = await User.findOne({ email: 'admin.test@nutrikid.com' });
    if (!adminUser) {
        adminUser = await User.create({
            name: 'Test Administrator',
            email: 'admin.test@nutrikid.com',
            password: 'AdminPassword123!',
            role: 'admin',
            title: 'Mr',
            status: 'Active',
            is2FAEnabled: false,
        });
    } else {
        adminUser.password = 'AdminPassword123!';
        adminUser.status = 'Active';
        adminUser.role = 'admin';
        await adminUser.save();
    }

    // Test Parent
    let parentUser = await User.findOne({ email: 'parent.test@nutrikid.com' });
    if (!parentUser) {
        parentUser = await User.create({
            name: 'Test Parent',
            email: 'parent.test@nutrikid.com',
            password: 'ParentPassword123!',
            role: 'parent',
            title: 'Ms',
            status: 'Active',
            parentProfile: { phoneNumber: '9876543210', city: 'Test City', relationToChild: 'Mother' },
        });
    } else {
        parentUser.password = 'ParentPassword123!';
        parentUser.status = 'Active';
        await parentUser.save();
    }
    testParentId = parentUser._id.toString();

    // Link a dummy child profile for parent
    const existingProfile = await Profile.findOne({ parentId: parentUser._id });
    if (!existingProfile) {
        await Profile.create({
            parentId: parentUser._id,
            name: 'Leo Test',
            dob: new Date('2021-05-10'),
            age: 5,
            gender: 'male',
            bloodGroup: 'O+',
            height: 110,
            weight: 18.5,
            waistCircumference: 52,
            location: {
                country: 'India',
                state: 'Karnataka',
                city: 'Bengaluru',
                address: '123 Test Street',
            },
            goals: {
                primary: 'Maintain Healthy Weight',
            },
        });
    }

    // Test Doctor
    let doctorUser = await User.findOne({ email: 'doctor.test@nutrikid.com' });
    if (!doctorUser) {
        doctorUser = await User.create({
            name: 'Dr. Test Pediatrician',
            email: 'doctor.test@nutrikid.com',
            password: 'DoctorPassword123!',
            role: 'doctor',
            title: 'Mr',
            status: 'Active',
            doctorProfile: { specialization: 'Pediatrics', hospitalName: 'City Hospital', experienceYears: 10, registrationId: 'MED-12345' },
        });
    } else {
        doctorUser.password = 'DoctorPassword123!';
        doctorUser.status = 'Active';
        await doctorUser.save();
    }

    console.log('✅ Test users ready in database.');

    // 2. Test Login for All Roles
    console.log('\n[2/7] Testing Authentication flows...');
    
    // Parent Login
    const parentLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'parent.test@nutrikid.com',
        password: 'ParentPassword123!',
    });
    parentToken = parentLoginRes.data.data.token;
    console.log(`✅ Parent Login: Success (Role: ${parentLoginRes.data.data.user.role})`);

    // Doctor Login
    const doctorLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'doctor.test@nutrikid.com',
        password: 'DoctorPassword123!',
    });
    doctorToken = doctorLoginRes.data.data.token;
    console.log(`✅ Doctor Login: Success (Role: ${doctorLoginRes.data.data.user.role})`);

    // Admin Login
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin.test@nutrikid.com',
        password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.data.data.token;
    console.log(`✅ Admin Login: Success (Role: ${adminLoginRes.data.data.user.role})`);

    // 3. Test Authorization Barriers
    console.log('\n[3/7] Testing RBAC Authorization Barriers...');
    
    // Unauthenticated request to /admin/dashboard
    try {
        await axios.get(`${API_BASE}/admin/dashboard`);
        throw new Error('❌ FAIL: Unauthenticated access to /admin/dashboard was allowed!');
    } catch (err) {
        if (err.response?.status === 401) {
            console.log('✅ Unauthenticated request correctly rejected with 401 Unauthorized.');
        } else {
            throw err;
        }
    }

    // Parent request to /admin/dashboard
    try {
        await axios.get(`${API_BASE}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${parentToken}` },
        });
        throw new Error('❌ FAIL: Parent access to /admin/dashboard was allowed!');
    } catch (err) {
        if (err.response?.status === 403) {
            console.log('✅ Parent request correctly rejected with 403 Forbidden.');
        } else {
            throw err;
        }
    }

    // Doctor request to /admin/dashboard
    try {
        await axios.get(`${API_BASE}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${doctorToken}` },
        });
        throw new Error('❌ FAIL: Doctor access to /admin/dashboard was allowed!');
    } catch (err) {
        if (err.response?.status === 403) {
            console.log('✅ Doctor request correctly rejected with 403 Forbidden.');
        } else {
            throw err;
        }
    }

    // Admin request to /admin/dashboard
    const adminDashRes = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDashRes.status === 200 && adminDashRes.data.data.stats) {
        console.log('✅ Admin request allowed (200 OK). Stats loaded:', adminDashRes.data.data.stats);
    } else {
        throw new Error('❌ FAIL: Admin dashboard response invalid.');
    }

    // 4. Test User Management Endpoints
    console.log('\n[4/7] Testing Admin User Management APIs...');
    
    const usersRes = await axios.get(`${API_BASE}/admin/users?role=parent`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ Admin Users API: Retrieved ${usersRes.data.data.users.length} parent users.`);

    const userDetailRes = await axios.get(`${API_BASE}/admin/users/${testParentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ Admin User Details: Found parent ${userDetailRes.data.data.name} with ${userDetailRes.data.data.children?.length || 0} linked child profiles.`);

    // 5. Test Status Change & Suspension Enforcement
    console.log('\n[5/7] Testing Account Status updates & Login Blocking...');
    
    // Suspend parent
    await axios.patch(`${API_BASE}/admin/users/${testParentId}/status`, { status: 'Suspended' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ Parent status updated to Suspended.');

    // Try logging in as suspended parent
    try {
        await axios.post(`${API_BASE}/auth/login`, {
            email: 'parent.test@nutrikid.com',
            password: 'ParentPassword123!',
        });
        throw new Error('❌ FAIL: Suspended user was able to login!');
    } catch (err) {
        if (err.response?.status === 403) {
            console.log('✅ Suspended user login blocked with 403 Forbidden.');
        } else {
            throw err;
        }
    }

    // Restore parent to Active
    await axios.patch(`${API_BASE}/admin/users/${testParentId}/status`, { status: 'Active' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ Parent status restored to Active.');

    // 6. Test Self-Protection Guardrails
    console.log('\n[6/7] Testing Admin Self-Protection Guardrails...');
    
    // Try to suspend own admin account
    try {
        await axios.patch(`${API_BASE}/admin/users/${adminUser._id}/status`, { status: 'Suspended' }, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        throw new Error('❌ FAIL: Admin was allowed to suspend their own account!');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Admin self-suspension prevented with 400 Bad Request.');
        } else {
            throw err;
        }
    }

    // Try to delete own admin account
    try {
        await axios.delete(`${API_BASE}/admin/users/${adminUser._id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        throw new Error('❌ FAIL: Admin was allowed to delete their own account!');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Admin self-deletion prevented with 400 Bad Request.');
        } else {
            throw err;
        }
    }

    // 7. Test Activity Logs & Security Telemetry
    console.log('\n[7/7] Testing Activity Audit Logs & Security Overview...');
    
    const activityRes = await axios.get(`${API_BASE}/admin/activity`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ Activity Logs: Retrieved ${activityRes.data.data.logs.length} audit entries.`);

    const securityRes = await axios.get(`${API_BASE}/admin/security`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ Security Overview:', securityRes.data.data.overview);

    console.log('\n====================================================');
    console.log('🎉 ALL ADMIN PORTAL VERIFICATION TESTS PASSED!');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
}

runTestSuite().catch(err => {
    console.error('❌ Test Suite Error:', err.message, err.response?.data || '');
    process.exit(1);
});
