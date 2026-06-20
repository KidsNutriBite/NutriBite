import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import { registerUser, loginUser } from '../controllers/auth.controller.js';

dotenv.config();

function runController(controller, req) {
    return new Promise((resolve, reject) => {
        const res = {
            statusCode: 200,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.jsonData = data;
                resolve({ statusCode: this.statusCode, data });
            }
        };
        const next = (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({ statusCode: res.statusCode, data: null });
            }
        };
        try {
            controller(req, res, next);
        } catch (err) {
            reject(err);
        }
    });
}

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const email = `test_flow_${Date.now()}@example.com`;
        const password = "Password123!";

        // 1. Test Registration
        console.log("\n--- Testing Registration ---");
        const registerReq = {
            body: {
                title: "Mr",
                name: "Test Flow",
                email: email,
                password: password,
                role: "parent",
                phoneNumber: "1234567890",
                city: "New York",
                relationToChild: "Father"
            }
        };

        try {
            const registerResult = await runController(registerUser, registerReq);
            console.log("Registration Response Code:", registerResult.statusCode);
            console.log("Registration Response Data:", JSON.stringify(registerResult.data, null, 2));
        } catch (err) {
            console.error("Registration failed with error:", err.message);
        }

        // Let's verify the user in the database
        const userInDb = await User.findOne({ email: email.toLowerCase() });
        console.log("User email in DB:", userInDb ? userInDb.email : "NOT FOUND");
        console.log("User password hash in DB:", userInDb ? userInDb.password : "N/A");

        // 2. Test Login
        console.log("\n--- Testing Login with Same Credentials ---");
        const loginReq = {
            body: {
                email: email,
                password: password
            }
        };

        try {
            const loginResult = await runController(loginUser, loginReq);
            console.log("Login Response Code:", loginResult.statusCode);
            console.log("Login Response Data:", JSON.stringify(loginResult.data, null, 2));
        } catch (err) {
            console.error("Login failed with error:", err.message);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error during test run:", err);
    }
}

run();
