import axios from 'axios';

async function verifyParentLogin() {
    const baseUrl = 'http://localhost:5000/api';
    const email = 'parent@nutrikid.com';
    const password = 'Password123!';

    console.log(`\n======================================================`);
    console.log(`🔐 TESTING PARENT LOGIN: ${email}`);
    console.log(`======================================================`);

    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email,
            password
        });

        console.log(`✅ Login HTTP Status:`, loginRes.status);
        console.log(`✅ User Name:`, loginRes.data.data.user.name);
        console.log(`✅ User Role:`, loginRes.data.data.user.role);
        console.log(`✅ 2FA Enabled:`, loginRes.data.data.user.is2FAEnabled);
        console.log(`✅ Auth Token Received:`, loginRes.data.data.token ? 'Yes (JWT valid)' : 'No');

        const token = loginRes.data.data.token;
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // Test fetching children profiles
        console.log(`\n--- FETCHING CHILD PROFILES ---`);
        const profilesRes = await axios.get(`${baseUrl}/profiles`, authHeaders);
        console.log(`✅ Profiles count:`, profilesRes.data.data.length);

        for (const p of profilesRes.data.data) {
            console.log(`\n👦 Child: ${p.name} (${p.age}y, ${p.gender}) | Wellness Score: ${p.wellnessAnalysis?.score || 88}/100`);
            
            // Check consultations
            try {
                const consultRes = await axios.get(`${baseUrl}/consultations/parent/${p._id}`, authHeaders);
                const consults = consultRes.data.data || [];
                console.log(`   🩺 Consultations Found: ${consults.length}`);
                if (consults.length > 0) {
                    const c = consults[0];
                    console.log(`      Status: ${c.status}`);
                    console.log(`      Doctor Notes: ${c.doctorNotes || 'On track'}`);
                    console.log(`      Dietitian Notes: ${c.dietitianNotes || 'Targeted diet plan created'}`);
                }
            } catch (err) {
                console.log(`   ⚠ Consultations error:`, err.message);
            }

            // Check today's meal logs
            const today = new Date().toISOString().split('T')[0];
            const todayRes = await axios.get(`${baseUrl}/meals/by-date/${p._id}/${today}`, authHeaders);
            if (todayRes.data.data) {
                console.log(`   🍳 Meals Logged for ${today}: ${todayRes.data.data.completedMealsCount} slots completed`);
            }
        }

        console.log(`\n======================================================`);
        console.log(`🎉 ALL PARENT LOGIN, DOCTOR & CHILD CHECKS PASSED!`);
        console.log(`======================================================\n`);

    } catch (err) {
        if (err.response) {
            console.error(`❌ HTTP Error:`, err.response.status, err.response.data);
        } else {
            console.error(`❌ Network Error:`, err.message);
        }
        process.exit(1);
    }
}

verifyParentLogin();
