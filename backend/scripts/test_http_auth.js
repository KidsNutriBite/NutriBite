import axios from 'axios';

async function run() {
    const baseUrl = 'http://localhost:5000/api';
    const email = `test_http_${Date.now()}@example.com`;
    const password = 'Password123!';

    try {
        console.log("--- Testing Registration via HTTP ---");
        const registerPayload = {
            title: "Mr",
            name: "Test HTTP User",
            email: email,
            password: password,
            role: "parent",
            phoneNumber: "1234567890",
            city: "Chicago",
            relationToChild: "Father"
        };
        const registerResponse = await axios.post(`${baseUrl}/auth/register`, registerPayload);
        console.log("Registration Status:", registerResponse.status);
        console.log("Registration Data:", JSON.stringify(registerResponse.data, null, 2));

        console.log("\n--- Testing Login via HTTP ---");
        const loginPayload = {
            email: email,
            password: password
        };
        const loginResponse = await axios.post(`${baseUrl}/auth/login`, loginPayload);
        console.log("Login Status:", loginResponse.status);
        console.log("Login Data:", JSON.stringify(loginResponse.data, null, 2));

    } catch (err) {
        if (err.response) {
            console.error("HTTP Error Status:", err.response.status);
            console.error("HTTP Error Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("Network Error:", err.message);
        }
    }
}

run();
