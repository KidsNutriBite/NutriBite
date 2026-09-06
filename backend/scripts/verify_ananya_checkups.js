import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Profile from '../models/Profile.model.js';
import User from '../models/User.model.js';
import Prescription from '../models/Prescription.model.js';

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrikid');
  const ananya = await Profile.findOne({ name: /Ananya/i });
  console.log('Ananya ID:', ananya._id, ananya.name);
  const prescs = await Prescription.find({ profileId: ananya._id }).populate('doctorId', 'name specialization').sort({ date: -1 });
  console.log('Total checkups found for Ananya:', prescs.length);
  prescs.forEach((p, i) => {
    console.log(`[${i+1}] ${p.date.toISOString().split('T')[0]} | ${p.title} | Dr: ${p.doctorId?.name}`);
    console.log(`     Diagnosis: ${p.diagnosis}`);
    console.log(`     Notes: ${p.notes.substring(0, 80)}...`);
    console.log(`     Instructions: ${p.instructions.substring(0, 80)}...`);
  });
  await mongoose.disconnect();
}
verify();
