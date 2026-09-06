import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Profile from '../models/Profile.model.js';
import User from '../models/User.model.js';

async function testApi() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrikid');
  const ananya = await Profile.findOne({ name: /Ananya/i });
  console.log('Ananya profile ID:', ananya._id);

  // Login as parent to get auth token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'parent@nutrikid.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;

  const res = await fetch(`http://localhost:5000/api/analytics/prescriptions/${ananya._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('API Status:', res.status);
  const data = await res.json();
  const list = data.data || data;
  console.log('Prescriptions returned by API:', list.length);
  list.forEach((p, i) => {
    console.log(`[${i+1}] ${new Date(p.date).toISOString().split('T')[0]} | ${p.title} | Dr: ${p.doctorId?.name || 'Dr. Rajesh Iyer'}`);
    console.log(`     Diagnosis: ${p.diagnosis}`);
    console.log(`     Doctor Notes: ${p.notes?.substring(0, 60)}...`);
  });

  await mongoose.disconnect();
}

testApi().catch(err => {
  console.error('API Test error:', err);
  process.exit(1);
});
