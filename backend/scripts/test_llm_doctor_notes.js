import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Profile from '../models/Profile.model.js';
import User from '../models/User.model.js';
import Prescription from '../models/Prescription.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import { AgentOrchestrator } from '../services/agentOrchestrator.service.js';

async function testLLM() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrikid');
  
  const ananya = await Profile.findOne({ name: /Ananya/i });
  console.log('Testing with Profile:', ananya._id, ananya.name);

  const query = "What does the doctor say about Ananya's growth and what meals should I prepare for her this week?";
  console.log('\n--- QUERY ---');
  console.log(query);

  const res = await AgentOrchestrator.processAgentWorkflow({
    query,
    profileId: ananya._id.toString(),
    parentId: ananya.parentId.toString(),
    history: []
  });

  console.log('\n--- AGENT RESPONSE ---');
  console.log(res.answer);
  console.log('\n--- PROVIDER ---');
  console.log(res.providerStatus);

  await mongoose.disconnect();
}

testLLM().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
