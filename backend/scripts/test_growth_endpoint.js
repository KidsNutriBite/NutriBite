import axios from 'axios';

async function test() {
    try {
        console.log("1. Logging in as doctor...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'doctor@test.com',
            password: 'Password123'
        });

        const token = loginRes.data.data.token;
        console.log("✅ Doctor logged in! Token retrieved.");

        const headers = { Authorization: `Bearer ${token}` };

        // Profile ID for Abhi
        const profileId = '6a2f815876c5079e776f4e7e';

        console.log(`2. Requesting growth velocity data for profile ${profileId}...`);
        const velocityRes = await axios.get(`http://localhost:5000/api/doctor/patients/${profileId}/growth-velocity`, { headers });
        
        console.log("\n================ GROWTH VELOCITY ENDPOINT RESPONSE ================");
        console.log(JSON.stringify(velocityRes.data, null, 2));
        console.log("===================================================================\n");

        if (velocityRes.data.success && velocityRes.data.data.velocityMetrics) {
            console.log("SUCCESS: Growth Velocity API returned healthy data!");
        } else {
            console.log("FAILURE: API did not return growth velocity data.");
        }
    } catch (err) {
        console.error("Test failed:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Response:", err.response.data);
        }
    }
}

test();
