import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Profile from '../models/Profile.model.js';
import Prescription from '../models/Prescription.model.js';
import User from '../models/User.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';

async function seedCheckups() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrikid');
  
  const doctor = await User.findOne({ role: 'doctor' }) || await User.findOne({ email: /doctor/i });
  const dietitian = await User.findOne({ role: 'dietitian' });
  console.log('Doctor:', doctor?._id, doctor?.name);
  console.log('Dietitian:', dietitian?._id, dietitian?.name);
  
  const ananyaProfiles = await Profile.find({ name: /Ananya/i });
  console.log('Found Ananya profiles:', ananyaProfiles.length);

  const checkupData = [
    {
      offsetDays: 10,
      title: '7-Year Comprehensive Milestone & School Transition Review',
      diagnosis: 'Normal growth velocity (65th percentile WHO), mild seasonal non-heme iron shortfall, zero allergy triggers.',
      notes: 'Ananya is thriving academically and physically. Sits comfortably at 65th height percentile (118.5 cm) and 21.4 kg. Mild seasonal fatigue reported during late afternoons; dietary recall indicates low non-heme iron absorption. Advised parents to combine sprouted ragi and greens with Vitamin C boosters (lemon/amla). Continue strict peanut-free vigilance.',
      instructions: '1. Sprouted Ragi dosa/idli 3x per week with fresh lemon drops on dal/greens. 2. 20-30 mins outdoor sunlight exposure between 8:00 AM - 9:30 AM for Vitamin D3. 3. Target 1,750 ml daily hydration. 4. Maintain strict avoidance of peanut-derived foods.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 100,
      title: 'Pre-Primary Physical Stature & Vision Screening',
      diagnosis: 'Optimal linear stature velocity (+2.4 cm in 6 mo). Visual acuity 6/6 bilateral.',
      notes: 'Linear height progression is very steady at 116.8 cm, weight 20.6 kg. Posture and gait are symmetrical. Parent reports good sleep hygiene (9.5 hours). Suggested maintaining casein dairy proteins (paneer, curd) for skeletal mineralization.',
      instructions: '1. Low-salt paneer / homemade curd daily in lunch or dinner. 2. Encourage active rope skipping and swimming for core flexibility. 3. Screen time limit under 45 mins/day.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 190,
      title: 'Mid-Year Growth Velocity & Dental Examination',
      diagnosis: 'Healthy primary-to-permanent dentition transition. Good oral hygiene.',
      notes: 'Height 114.5 cm, weight 19.8 kg. Incisor shedding and permanent tooth eruption progressing normally without crowding. Emphasized low-sugar snacking and swapping sticky confectionery for roasted foxnuts (makhana).',
      instructions: '1. Replace sugary evening snacks with roasted jaggery makhana or fresh papaya cubes. 2. Fluoride brushing twice daily under parental supervision.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 280,
      title: 'Winter Immunity & Respiratory Wellness Assessment',
      diagnosis: 'Mild viral upper respiratory clearance; clear lung fields, no wheeze.',
      notes: 'Height 112.8 cm, weight 19.1 kg. Seasonal winter cough resolved. Reassured parents that seasonal immunity improves with warm turmeric milk and zinc-rich whole grains (bajra, moong dal).',
      instructions: '1. Warm turmeric cardamom milk (Haldi Doodh) 150ml before bedtime. 2. Steam inhalation with saline drops as needed during cold weather. 3. Hydration minimum 1,500 ml daily.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 370,
      title: '6-Year Annual Comprehensive Pediatric Development Screen',
      diagnosis: 'Robust neuro-developmental milestone attainment, height 58th percentile.',
      notes: 'Height 110.5 cm, weight 18.2 kg. Fine motor and cognitive skills advanced for age. Excellent peer interaction. Reinforced the importance of ICMR cereal-pulse 3:1 ratio in home meals.',
      instructions: '1. Cereal-pulse combo meals (Khichdi, Dal Rice, Dosa with Sambar) daily. 2. 60 minutes unstructured free physical play daily. 3. Annual dental checkup recommended.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 460,
      title: 'Monsoon Gastrointestinal & Hydration Health Review',
      diagnosis: 'Normal bowel habits, good gut microbiome diversity.',
      notes: 'Height 108.6 cm, weight 17.5 kg. No signs of gastrointestinal distress or parasitic infections. Advised home probiotics (fresh set curd / buttermilk) to maintain gut mucosal barrier during monsoons.',
      instructions: '1. Freshly churned chaas (buttermilk) with roasted cumin and mint after lunch. 2. Strict boiled/filtered drinking water. 3. Freshly cooked warm meals only.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 550,
      title: 'Mid-Year Preschool Growth Spurt & Posture Evaluation',
      diagnosis: 'Active growth spurt observed (+3.1 cm over 6 months). Mild transient calf growing pains.',
      notes: 'Height 106.5 cm, weight 16.8 kg. Mother notes evening leg discomfort after active playground sessions. Clinical exam reveals normal joint laxity and no localized swelling. Classic physiological growing pains. Recommended calcium boost through sesame (til) and ragi.',
      instructions: '1. Til (sesame) laddoo or ragi porridge 3x per week. 2. Gentle warm olive oil massage before bed on active days. 3. Warm bath in evening.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 640,
      title: 'Pediatric Allergy Panel & Dietary Tolerance Review',
      diagnosis: 'Peanut hypersensitivity confirmed on skin prick/history; no other major allergens.',
      notes: 'Height 104.2 cm, weight 16.1 kg. Confirmed mild cutaneous peanut sensitivity. Tree nuts tolerated under supervision, but advised strict avoidance of mixed peanut oils and unlabeled bakery items.',
      instructions: '1. Strict zero-peanut diet protocol. School tiffin box labeling advised. 2. Safe alternatives: roasted pumpkin seeds, sunflower seeds, foxnuts. 3. Emergency antihistamine (Cetirizine 2.5ml) kept accessible at home and school.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 730,
      title: '5-Year Milestone Checkup & Pediatric Immunization Review',
      diagnosis: '5-Year booster immunizations completed (DPT, OPV, MMR). Healthy growth trajectory.',
      notes: 'Height 102.0 cm, weight 15.4 kg. 5-year boosters administered without acute reaction. Excellent social-emotional maturity and motor coordination.',
      instructions: '1. Post-vaccination paracetamol SOS for fever. 2. Continue balanced home-cooked Indian meals with diverse seasonal vegetables. 3. Ensure 10-11 hours total sleep including afternoon quiet time.',
      nextCheckupDays: 90
    },
    {
      offsetDays: 900,
      title: 'Baseline Pediatric Wellness & Dietary Transition Assessment',
      diagnosis: 'Healthy toddler-to-preschool physical transition. Normal hemoglobin (12.1 g/dL).',
      notes: 'Height 98.2 cm, weight 14.5 kg. Baseline vitals and developmental milestones on track. Transitioning smoothly into preschool routine. Advised high-fiber finger foods and self-feeding encouragement.',
      instructions: '1. Encourage diverse finger foods (steamed carrot sticks, cucumber, paneer cubes, vegetable cheela). 2. Minimize processed biscuits and fruit juices; offer whole fruits. 3. Regular semi-annual pediatric follow-up.',
      nextCheckupDays: 180
    }
  ];

  for (const prof of ananyaProfiles) {
    await Prescription.deleteMany({ profileId: prof._id });
    
    for (const item of checkupData) {
      const checkupDate = new Date(Date.now() - item.offsetDays * 24 * 60 * 60 * 1000);
      await Prescription.create({
        profileId: prof._id,
        doctorId: doctor._id,
        title: item.title,
        diagnosis: item.diagnosis,
        notes: item.notes,
        instructions: item.instructions,
        nextCheckupDays: item.nextCheckupDays,
        date: checkupDate,
        createdAt: checkupDate,
        updatedAt: checkupDate
      });
    }

    await ConsultationRequest.deleteMany({ profileId: prof._id });
    const firstRx = await Prescription.findOne({ profileId: prof._id }).sort({ date: -1 });
    await ConsultationRequest.create({
      profileId: prof._id,
      parentId: prof.parentId,
      doctorId: doctor._id,
      dietitianId: dietitian?._id,
      status: 'PrescriptionIssued',
      prescriptionId: firstRx?._id,
      doctorNotes: checkupData[0].notes,
      dietitianNotes: 'Balanced pediatric meal plan. Emphasized sprouted ragi + lemon pairing for iron and morning sunlight for Vitamin D3.',
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    await Profile.findByIdAndUpdate(prof._id, {
      lastCheckup: {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: checkupData[0].notes,
        status: 'Healthy'
      }
    });

    console.log(`Successfully seeded 10 checkups for Ananya profile ${prof._id}`);
  }

  // Clean orphan records where profileId is not set
  await Prescription.deleteMany({ profileId: null });

  await mongoose.disconnect();
  console.log('Checkup seeding finished successfully!');
}

seedCheckups().catch(err => {
  console.error('Error seeding checkups:', err);
  process.exit(1);
});
