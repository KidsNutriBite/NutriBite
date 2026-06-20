import mongoose from 'mongoose';
import User from '../models/User.model.js';
import app from '../app.js';
import axios from 'axios';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api`;

async function run() {
    let server;
    try {
        console.log("=== Starting 2FA Integration Test ===");
        
        // Connect to Mongo
        console.log("Connecting to MongoDB:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected!");

        // Start Test Server
        server = app.listen(PORT, () => {
            console.log(`Test server running on port ${PORT}`);
        });

        // Clean up any existing test users
        const testDoctorEmail = 'test_doctor_2fa@example.com';
        const testParentEmail = 'test_parent_2fa@example.com';
        await User.deleteMany({ email: { $in: [testDoctorEmail, testParentEmail] } });

        const testPassword = 'Password123!';

        // ----------------------------------------------------
        // Test 1: Register Doctor & Try Login (2FA Mandatory)
        // ----------------------------------------------------
        console.log("\n[Test 1] Registering doctor...");
        const registerDocRes = await axios.post(`${BASE_URL}/auth/register`, {
            title: 'Mr',
            name: 'Dr. Test 2FA',
            email: testDoctorEmail,
            password: testPassword,
            role: 'doctor',
            specialization: 'Pediatrics',
            hospitalName: 'Test Hospital',
            experienceYears: 10,
            registrationId: 'DOC12345'
        });
        
        console.log("Doctor registered successfully. Subsequent logins should require 2FA.");

        console.log("\n[Test 1.1] Logging in Doctor (Credentials Only)...");
        const docLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testDoctorEmail,
            password: testPassword
        });

        console.log("Status:", docLoginRes.status);
        console.log("Response Data:", docLoginRes.data.data);
        
        if (docLoginRes.data.data.twoFactorRequired && !docLoginRes.data.data.token) {
            console.log("✅ Success: Doctor login correctly requires 2FA and does not return a token!");
        } else {
            throw new Error("❌ Fail: Doctor login did not require 2FA or leaked a token!");
        }

        // Retrieve OTP directly from MongoDB to simulate verify
        let doctorUser = await User.findOne({ email: testDoctorEmail });
        if (!doctorUser.loginOTPHash) {
            throw new Error("❌ Fail: OTP hash was not stored in the database!");
        }
        console.log("✅ Success: Hashed OTP stored in database.");

        // ----------------------------------------------------
        // Test 2: Resend Cooldown Cooldown
        // ----------------------------------------------------
        console.log("\n[Test 2] Testing Resend OTP Cooldown...");
        try {
            await axios.post(`${BASE_URL}/auth/resend-2fa`, { email: testDoctorEmail });
            throw new Error("❌ Fail: Resend succeeded during 60-second cooldown!");
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log("✅ Success: Resend OTP correctly blocked by 60s cooldown (Rate Limit 429).");
                console.log("Cooldown message:", error.response.data.message);
            } else {
                throw error;
            }
        }

        // ----------------------------------------------------
        // Test 3: OTP Brute-Force & Lockout (5 Failed Attempts)
        // ----------------------------------------------------
        console.log("\n[Test 3] Testing Lockout after 5 failed attempts...");
        for (let i = 1; i <= 5; i++) {
            try {
                await axios.post(`${BASE_URL}/auth/verify-2fa`, {
                    email: testDoctorEmail,
                    otp: '000000' // Incorrect OTP
                });
                throw new Error("❌ Fail: verify-2fa succeeded with incorrect OTP!");
            } catch (error) {
                if (error.response) {
                    console.log(`Attempt ${i} failed. Status: ${error.response.status}, Message: ${error.response.data.message}`);
                    if (i === 5) {
                        if (error.response.status === 403 && error.response.data.message.includes('locked')) {
                            console.log("✅ Success: Account locked on 5th failed attempt!");
                        } else {
                            throw new Error(`❌ Fail: Lockout did not trigger correctly on 5th attempt: ${error.response.status}`);
                        }
                    }
                } else {
                    throw error;
                }
            }
        }

        // Verify accountLockedUntil is set in DB
        doctorUser = await User.findOne({ email: testDoctorEmail });
        if (doctorUser.accountLockedUntil && doctorUser.accountLockedUntil > Date.now()) {
            console.log("✅ Success: accountLockedUntil set in MongoDB.");
        } else {
            throw new Error("❌ Fail: accountLockedUntil was not set in MongoDB!");
        }

        // Reset lockout for further testing
        doctorUser.accountLockedUntil = undefined;
        doctorUser.loginOTPAttempts = 0;
        await doctorUser.save();

        // ----------------------------------------------------
        // Test 4: Correct OTP Verification
        // ----------------------------------------------------
        console.log("\n[Test 4] Logging in Doctor again to generate a new OTP...");
        const docLoginRes2 = await axios.post(`${BASE_URL}/auth/login`, {
            email: testDoctorEmail,
            password: testPassword
        });

        // Fetch new OTP from DB to verify it
        doctorUser = await User.findOne({ email: testDoctorEmail });
        
        // We need to bypass bcrypt comparison by manually verifying using the correct code.
        // Wait, how do we know the unhashed code? We can't since it is generated randomly.
        // But for testing purposes, we can manually overwrite the hash in DB to match a known code's hash!
        console.log("Setting known OTP in DB for verification test...");
        const testOtp = '123456';
        const salt = await bcrypt.genSalt(10);
        doctorUser.loginOTPHash = await bcrypt.hash(testOtp, salt);
        doctorUser.loginOTPExpiresAt = Date.now() + 5 * 60 * 1000;
        await doctorUser.save();

        console.log("Submitting correct OTP...");
        const verifyRes = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
            email: testDoctorEmail,
            otp: testOtp
        });

        console.log("Status:", verifyRes.status);
        console.log("Response Data keys:", Object.keys(verifyRes.data.data));

        if (verifyRes.data.data.token) {
            console.log("✅ Success: Correct OTP returns JWT token!");
            // Check that the token works on a protected route
            const token = verifyRes.data.data.token;
            const meRes = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("GET /api/auth/me result:", meRes.data.data.name);
            if (meRes.data.data.email === testDoctorEmail) {
                console.log("✅ Success: JWT token is fully valid and authorized!");
            } else {
                throw new Error("❌ Fail: Authorized route returned incorrect user!");
            }
        } else {
            throw new Error("❌ Fail: OTP verification did not return JWT token!");
        }

        // Verify OTP is invalidated after successful verification
        doctorUser = await User.findOne({ email: testDoctorEmail });
        if (!doctorUser.loginOTPHash && !doctorUser.loginOTPExpiresAt) {
            console.log("✅ Success: OTP credentials cleared from DB after verification (No Replay).");
        } else {
            throw new Error("❌ Fail: OTP credentials were not cleared from DB!");
        }

        // ----------------------------------------------------
        // Test 5: Parent Login (Optional 2FA)
        // ----------------------------------------------------
        console.log("\n[Test 5] Registering parent...");
        await axios.post(`${BASE_URL}/auth/register`, {
            title: 'Mrs',
            name: 'Parent Test 2FA',
            email: testParentEmail,
            password: testPassword,
            role: 'parent',
            phoneNumber: '1234567890',
            city: 'Test City',
            relationToChild: 'Mother'
        });

        console.log("Logging in Parent (Should login directly since 2FA defaults to false)...");
        const parentLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testParentEmail,
            password: testPassword
        });

        if (parentLoginRes.data.data.token) {
            console.log("✅ Success: Parent logged in directly, received token immediately.");
        } else {
            throw new Error("❌ Fail: Parent login prompted 2FA when disabled!");
        }

        const parentToken = parentLoginRes.data.data.token;

        console.log("\n[Test 5.1] Toggling Parent 2FA to ENABLED...");
        const patchRes = await axios.patch(
            `${BASE_URL}/parent/update`,
            { is2FAEnabled: true },
            { headers: { 'Authorization': `Bearer ${parentToken}` } }
        );

        if (patchRes.data.data.user.is2FAEnabled === true) {
            console.log("✅ Success: Parent profile is2FAEnabled toggle saved in DB.");
        } else {
            throw new Error("❌ Fail: Parent profile update did not toggle is2FAEnabled!");
        }

        console.log("\n[Test 5.2] Logging in Parent again (Should now require 2FA)...");
        const parentLoginRes2 = await axios.post(`${BASE_URL}/auth/login`, {
            email: testParentEmail,
            password: testPassword
        });

        if (parentLoginRes2.data.data.twoFactorRequired) {
            console.log("✅ Success: Parent subsequent login successfully requires 2FA!");
        } else {
            throw new Error("❌ Fail: Parent login did not require 2FA after enabling it!");
        }

        console.log("\n=========================================");
        console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉");
        console.log("=========================================");

    } catch (err) {
        console.error("\n❌ TEST FAILURE:", err.response?.data?.message || err.message || err);
        process.exitCode = 1;
    } finally {
        // Clean up test server & connections
        if (server) {
            console.log("Closing test server...");
            server.close();
        }
        console.log("Disconnecting MongoDB...");
        await mongoose.disconnect();
        console.log("Test finished.");
    }
}

run();
