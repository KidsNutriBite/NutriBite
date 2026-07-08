import Profile from '../models/Profile.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import MealLog from '../models/MealLog.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { profileSchema } from '../validators/profile.schema.js';
import { uploadFile } from '../services/storage.service.js';
import { sendEmail } from '../services/email.service.js';
import { computeWellnessAnalysis } from '../utils/wellnessEngine.js';
import axios from 'axios';

// @desc    Create a new child profile
// @route   POST /api/profiles
// @access  Private (Parent)
export const createProfile = asyncHandler(async (req, res) => {
    // 1. Parse JSON data field
    const parsedData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    // 2. Validate using profileSchema
    const validation = profileSchema.safeParse(parsedData);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const valData = validation.data;

    // 3. Handle File Uploads
    let profileImageUrl = null;
    const medicalReports = [];

    if (req.files && req.files.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

        // Profile Image
        const profileImageFile = req.files.find(f => f.fieldname === 'profileImage');
        if (profileImageFile) {
            const filename = await uploadFile(profileImageFile);
            profileImageUrl = `${baseUrl}/${filename}`;
        }

        // Medical Reports attachments
        if (valData.medicalReports && Array.isArray(valData.medicalReports)) {
            for (let i = 0; i < valData.medicalReports.length; i++) {
                const report = valData.medicalReports[i];
                const fileField = `medicalReportFile_${report.fileIndex ?? i}`;
                const file = req.files.find(f => f.fieldname === fileField);
                let attachmentUrl = report.attachment || '';
                if (file) {
                    const filename = await uploadFile(file);
                    attachmentUrl = `${baseUrl}/${filename}`;
                }
                medicalReports.push({
                    reportName: report.reportName,
                    reportDate: new Date(report.reportDate),
                    hospitalName: report.hospitalName,
                    doctorName: report.doctorName,
                    comments: report.comments || '',
                    attachment: attachmentUrl,
                    status: report.status || 'Not Reviewed'
                });
            }
        }
    } else {
        if (valData.medicalReports && Array.isArray(valData.medicalReports)) {
            for (const report of valData.medicalReports) {
                medicalReports.push({
                    reportName: report.reportName,
                    reportDate: new Date(report.reportDate),
                    hospitalName: report.hospitalName,
                    doctorName: report.doctorName,
                    comments: report.comments || '',
                    attachment: report.attachment || '',
                    status: report.status || 'Not Reviewed'
                });
            }
        }
    }

    // 4. Calculate Age
    const dob = new Date(valData.dob);
    const today = new Date();
    let computedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        computedAge--;
    }
    if (computedAge < 0) computedAge = 0;

    // 5. Create Profile
    const profileData = {
        parentId: req.user._id,
        name: valData.name,
        dob,
        age: computedAge,
        gender: valData.gender,
        bloodGroup: valData.bloodGroup,
        height: valData.height,
        weight: valData.weight,
        waistCircumference: valData.waistCircumference,
        sportsActivityLevel: valData.sportsActivityLevel || 'Moderately Active',
        prematureBirth: valData.prematureBirth || { isPremature: false, weeksPremature: 0 },
        location: valData.location,
        healthConditions: valData.healthConditions,
        otherCondition: valData.otherCondition,
        familyHistory: valData.familyHistory,
        goals: valData.goals,
        preferences: valData.preferences,
        medicalReports,
        parentNotes: valData.parentNotes || '',
        avatar: valData.avatar || 'lion',
        profileImage: profileImageUrl
    };

    // Calculate initial wellness analysis
    profileData.wellnessAnalysis = computeWellnessAnalysis(profileData, []);

    const profile = await Profile.create(profileData);

    // 6. Create GrowthRecord
    await GrowthRecord.create({
        childId: profile._id,
        height: valData.height,
        weight: valData.weight,
        waistCircumference: valData.waistCircumference,
        ageInMonths: (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth()),
        recordedByRole: 'parent',
        recordedByUserId: req.user._id,
    });

    // 7. Send Email Notification
    try {
        const subject = `NutriKids: Child Profile Created - ${profile.name}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
                <h2 style="color: #2b9dee; margin-bottom: 20px;">Child Profile Created Successfully</h2>
                <p>Hello,</p>
                <p>A new child profile has been successfully created under your account on <strong>NutriKids</strong>.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; width: 140px;">Child Name:</td>
                            <td style="padding: 6px 0;">${profile.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold;">Date of Birth:</td>
                            <td style="padding: 6px 0;">${dob.toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold;">Blood Group:</td>
                            <td style="padding: 6px 0;">${profile.bloodGroup}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold;">Date Created:</td>
                            <td style="padding: 6px 0;">${new Date().toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>
                <p>You can now manage their nutrition, track growth milestones, and upload medical reports on the NutriKids Parent Dashboard.</p>
                <br/>
                <p>Best regards,<br/><strong>NutriKids Team</strong></p>
            </div>
        `;
        await sendEmail(req.user.email, subject, html);
    } catch (err) {
        console.error("Failed to send child creation email notification:", err.message);
    }

    res.status(201).json(new ApiResponse(201, profile, 'Profile created successfully'));
});

import { generateHealthTips } from '../utils/healthTipsEngine.js';

// ... imports

import Appointment from '../models/Appointment.model.js';

// @desc    Get all profiles for logged in parent (with Tips)
// @route   GET /api/profiles
// @access  Private (Parent)
export const getMyProfiles = asyncHandler(async (req, res) => {
    const profiles = await Profile.find({ parentId: req.user._id }).lean();

    // Attach Health Tips and Last Checkup to each profile
    const profilesWithTips = await Promise.all(profiles.map(async (profile) => {
        const lastCheckup = await Appointment.findOne({ profileId: profile._id, status: { $ne: 'cancelled' } })
            .sort({ date: -1 })
            .lean();

        return {
            ...profile,
            tips: generateHealthTips(profile.healthConditions),
            lastCheckup: lastCheckup ? {
                date: lastCheckup.date,
                time: lastCheckup.time,
                doctorName: lastCheckup.hospitalName || 'Pediatrician'
            } : null
        };
    }));

    res.status(200).json(new ApiResponse(200, profilesWithTips));
});

// @desc    Get single profile details (with Tips)
// @route   GET /api/profiles/:id
// @access  Private (Owner/Parent)
export const getProfileById = asyncHandler(async (req, res) => {
    // req.profile is a Mongoose document from middleware
    const profileData = req.profile.toObject();
    profileData.tips = generateHealthTips(profileData.healthConditions);

    res.status(200).json(new ApiResponse(200, profileData));
});

// @desc    Update profile
// @route   PUT /api/profiles/:id
// @access  Private (Owner/Parent)
export const updateProfile = asyncHandler(async (req, res) => {
    const existingProfile = await Profile.findById(req.params.id);
    if (!existingProfile) {
        res.status(404);
        throw new Error('Child profile not found');
    }

    // 1. Parse JSON data field
    const parsedData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    // 2. Validate using profileSchema.partial()
    const validation = profileSchema.partial().safeParse(parsedData);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0].message);
    }

    const valData = validation.data;

    // 3. Compare changes to build Audit Log / changeHistory
    const fieldsChanged = [];
    if (valData.name !== undefined && valData.name !== existingProfile.name) fieldsChanged.push('Name');
    if (valData.dob !== undefined && new Date(valData.dob).getTime() !== new Date(existingProfile.dob).getTime()) fieldsChanged.push('Date of Birth');
    if (valData.gender !== undefined && valData.gender !== existingProfile.gender) fieldsChanged.push('Gender');
    if (valData.bloodGroup !== undefined && valData.bloodGroup !== existingProfile.bloodGroup) fieldsChanged.push('Blood Group');
    if (valData.height !== undefined && Number(valData.height) !== existingProfile.height) fieldsChanged.push('Height');
    if (valData.weight !== undefined && Number(valData.weight) !== existingProfile.weight) fieldsChanged.push('Weight');
    if (valData.waistCircumference !== undefined && Number(valData.waistCircumference) !== existingProfile.waistCircumference) fieldsChanged.push('Waist Circumference');
    if (valData.sportsActivityLevel !== undefined && valData.sportsActivityLevel !== existingProfile.sportsActivityLevel) fieldsChanged.push('Sports Activity Level');
    if (valData.prematureBirth !== undefined && (valData.prematureBirth.isPremature !== existingProfile.prematureBirth?.isPremature || valData.prematureBirth.weeksPremature !== existingProfile.prematureBirth?.weeksPremature)) fieldsChanged.push('Premature Birth Info');
    if (valData.parentNotes !== undefined && valData.parentNotes !== existingProfile.parentNotes) fieldsChanged.push('Parent Notes');

    // Preferences checking
    if (valData.preferences) {
        const prefKeys = ['favoriteFoods', 'dislikedFoods', 'favoriteFruits', 'favoriteVegetables', 'favoriteSnacks', 'waterIntake', 'activityLevel', 'sleepDuration', 'sleepQuality', 'screenTime', 'eatingHabits'];
        let prefChanged = false;
        for (const key of prefKeys) {
            if (valData.preferences[key] !== undefined && valData.preferences[key] !== existingProfile.preferences?.[key]) {
                prefChanged = true;
            }
        }
        if (prefChanged) fieldsChanged.push('Preferences');
    }

    // 4. Handle File Uploads for profileImage
    let profileImageUrl = existingProfile.profileImage;
    if (req.files && req.files.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

        // Check for new profileImage
        const profileImageFile = req.files.find(f => f.fieldname === 'profileImage');
        if (profileImageFile) {
            const filename = await uploadFile(profileImageFile);
            profileImageUrl = `${baseUrl}/${filename}`;
        }
    }

    // 5. Detect Medical Report Changes (Uploaded, Deleted, Updated)
    let emailAction = 'Profile Updated';
    let reportActivity = null;

    const updatedMedicalReports = [];
    if (valData.medicalReports && Array.isArray(valData.medicalReports)) {
        const existingCount = existingProfile.medicalReports.length;
        const incomingCount = valData.medicalReports.length;

        if (incomingCount > existingCount) {
            reportActivity = 'uploaded';
            emailAction = 'Medical Report Uploaded';
        } else if (incomingCount < existingCount) {
            reportActivity = 'deleted';
            emailAction = 'Medical Report Deleted';
        } else {
            let hasReportMod = false;
            for (let i = 0; i < incomingCount; i++) {
                const inc = valData.medicalReports[i];
                const ext = existingProfile.medicalReports[i];
                if (ext && (inc.reportName !== ext.reportName || inc.hospitalName !== ext.hospitalName || inc.doctorName !== ext.doctorName || inc.comments !== ext.comments || inc.status !== ext.status)) {
                    hasReportMod = true;
                    break;
                }
            }
            if (hasReportMod) {
                reportActivity = 'updated';
                emailAction = 'Medical Report Updated';
            }
        }

        if (reportActivity) {
            fieldsChanged.push('Medical Reports');
        }

        // Reconstruct reports
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
        for (let i = 0; i < valData.medicalReports.length; i++) {
            const report = valData.medicalReports[i];
            let attachmentUrl = report.attachment || '';

            const fileField = `medicalReportFile_${report.fileIndex ?? i}`;
            const file = req.files?.find(f => f.fieldname === fileField);
            if (file) {
                const filename = await uploadFile(file);
                attachmentUrl = `${baseUrl}/${filename}`;
            }

            updatedMedicalReports.push({
                _id: report._id || report.id,
                reportName: report.reportName,
                reportDate: new Date(report.reportDate),
                hospitalName: report.hospitalName,
                doctorName: report.doctorName,
                comments: report.comments || '',
                attachment: attachmentUrl,
                status: report.status || 'Not Reviewed'
            });
        }
    }

    // 6. Stage age calculations
    if (valData.dob) {
        const dob = new Date(valData.dob);
        const today = new Date();
        let computedAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            computedAge--;
        }
        if (computedAge < 0) computedAge = 0;
        valData.age = computedAge;
    }

    // Compute changeHistory
    const changeHistory = [...(existingProfile.changeHistory || [])];
    if (fieldsChanged.length > 0) {
        changeHistory.push({
            updatedAt: new Date(),
            fieldsChanged,
            updatedBy: req.user._id
        });
    }

    // Combine update payload
    const updatePayload = {
        ...valData,
        profileImage: profileImageUrl,
        changeHistory
    };

    if (valData.medicalReports) {
        updatePayload.medicalReports = updatedMedicalReports;
    }

    // Merge and compute wellness analysis
    const mergedProfileData = {
        ...existingProfile.toObject(),
        ...updatePayload,
        preferences: {
            ...existingProfile.preferences,
            ...updatePayload.preferences
        },
        prematureBirth: {
            ...existingProfile.prematureBirth,
            ...updatePayload.prematureBirth
        }
    };
    const mealLogs = await MealLog.find({ profileId: req.params.id });
    updatePayload.wellnessAnalysis = computeWellnessAnalysis(mergedProfileData, mealLogs);

    // Update in DB
    const updatedProfile = await Profile.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true, runValidators: true }
    );

    // If physical stats changed (height, weight, waistCircumference), insert a new GrowthRecord
    if (fieldsChanged.includes('Height') || fieldsChanged.includes('Weight') || fieldsChanged.includes('Waist Circumference')) {
        const today = new Date();
        const dob = new Date(updatedProfile.dob);
        await GrowthRecord.create({
            childId: updatedProfile._id,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            waistCircumference: updatedProfile.waistCircumference,
            ageInMonths: (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth()),
            recordedByRole: 'parent',
            recordedByUserId: req.user._id,
        });
    }

    // 7. Send Email Alert
    try {
        const subject = `NutriKids: Profile Updated - ${updatedProfile.name}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
                <h2 style="color: #2b9dee; margin-bottom: 20px;">Profile Update Alert</h2>
                <p>Hello,</p>
                <p>The profile of <strong>${updatedProfile.name}</strong> has been updated in your NutriKids account.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; width: 140px;">Child Name:</td>
                            <td style="padding: 6px 0;">${updatedProfile.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold;">Action Performed:</td>
                            <td style="padding: 6px 0; color: #d97706; font-weight: bold;">${emailAction}</td>
                        </tr>
                        ${fieldsChanged.length > 0 ? `
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Fields Updated:</td>
                            <td style="padding: 6px 0;">${fieldsChanged.join(', ')}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold;">Timestamp:</td>
                            <td style="padding: 6px 0;">${new Date().toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                <p>You can review this audit log in the child's profile view under the "Change History" log.</p>
                <br/>
                <p>Best regards,<br/><strong>NutriKids Team</strong></p>
            </div>
        `;
        await sendEmail(req.user.email, subject, html);
    } catch (err) {
        console.error("Failed to send update email alert:", err.message);
    }

    res.status(200).json(new ApiResponse(200, updatedProfile, 'Profile updated successfully'));
});

// @desc    Delete profile
// @route   DELETE /api/profiles/:id
// @access  Private (Owner/Parent)
export const deleteProfile = asyncHandler(async (req, res) => {
    await Profile.findByIdAndDelete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Profile deleted'));
});

// @desc    Reanalyze profile and save wellness analysis
// @route   POST /api/profiles/:id/reanalyze
// @access  Private (Owner/Parent)
export const reanalyzeProfile = asyncHandler(async (req, res) => {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
        res.status(404);
        throw new Error('Child profile not found');
    }

    const mealLogs = await MealLog.find({ profileId: req.params.id });
    profile.wellnessAnalysis = computeWellnessAnalysis(profile.toObject(), mealLogs);
    await profile.save();

    res.status(200).json(new ApiResponse(200, profile, 'Profile reanalyzed successfully'));
});

// @desc    Get dynamic diet plan for a specific child using Gemini API
// @route   GET /api/profiles/:id/diet-plan
// @access  Private (Owner/Parent)
export const getChildDietPlan = asyncHandler(async (req, res) => {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
        res.status(404);
        throw new Error('Child profile not found');
    }

    const deficiencies = profile.wellnessAnalysis?.deficiencies || {};
    const activeDeficiencies = Object.keys(deficiencies).filter(
        key => deficiencies[key]?.severity === 'RED' || deficiencies[key]?.severity === 'ORANGE'
    );

    const prompt = `
You are a pediatric nutritionist specializing in traditional Indian cuisine.
Generate a highly personalized 7-day Indian diet plan (Monday to Sunday) for a child named ${profile.name}, age ${profile.age}, gender ${profile.gender}, height ${profile.height}cm, weight ${profile.weight}kg.
Active Deficiencies to address: ${activeDeficiencies.join(', ') || 'None (General Growth)'}.
Dietary preferences: ${profile.preferences?.dietaryPreferences || 'None'}.

Rules:
1. Recommend ONLY authentic, location-appropriate Indian dishes (e.g., Ragi Chilla, Palak Khichdi, Masala Roasted Makhana, Curd Rice, Moong Dal Chilla, Idli Sambar, Paneer Bhurji Paratha). Do NOT include non-Indian foods like avocado toast, quinoa, kale, blueberry smoothies, oats waffles, chia seed pudding, or general western foods.
2. Focus specifically on the child's active deficiencies:
   - If Iron deficiency: emphasize spinach (palak), beetroot, sesame/til, jaggery, ragi, and pairing with Vitamin C (sweet lime, lemon juice, amla) for absorption.
   - If Protein deficiency: emphasize paneer, curd, pulses, lentils, sprouted grains, nuts.
   - If Calcium/Vitamin D deficiency: emphasize milk, curd, ragi, sesame seeds, paneer, and daylight exposure.
   - If Hydration/Water gap: emphasize warm water, buttermilk/chaas, fresh coconut water, home-made fresh juices.
   - If Fiber gap: emphasize whole-grain rotis, fresh local vegetables (lauki, turai, bhindi, carrots), local fruits.
3. Keep the meals child-friendly, appealing, and easy to prepare using standard Indian household ingredients.
4. Provide a day-by-day JSON format structure matching this schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Brief focus name (e.g., Iron Absorption & Energy Boost)",
      "rationale": "Clear, concise scientific explanation of why these meals work for this child's deficiencies using Indian foods",
      "meals": {
        "breakfast": "Meal name and brief description",
        "lunch": "Meal name and brief description",
        "snack": "Meal name and brief description",
        "dinner": "Meal name and brief description"
      }
    }
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting (like \`\`\`json).
`;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const apiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            }
        );

        const responseText = apiResponse.data.candidates[0].content.parts[0].text;
        const planData = JSON.parse(responseText);
        res.status(200).json(new ApiResponse(200, planData, 'Child diet plan generated successfully'));
    } catch (err) {
        console.error('Gemini error generating child diet plan:', err.message);
        // Fallback rule-based plan if Gemini fails
        const fallbackPlan = {
            weeklyPlan: [
                {
                    day: "Monday",
                    focus: "Iron & Energy Boost",
                    rationale: "Combines spinach with ragi to help boost iron and energy levels naturally.",
                    meals: {
                        breakfast: "Ragi Dosa with Coconut Chutney",
                        lunch: "Palak Dal, Carrot Sabzi, and Brown Rice",
                        snack: "Masala Roasted Makhana",
                        dinner: "Mixed Vegetable Khichdi with Ghee"
                    }
                },
                {
                    day: "Tuesday",
                    focus: "Calcium & Bone Health",
                    rationale: "Dairy and ragi supply calcium to help build bone structure.",
                    meals: {
                        breakfast: "Milk and Oats Porridge with Dates",
                        lunch: "Paneer Bhurji with Whole Wheat Roti",
                        snack: "Til Chikki & Banana",
                        dinner: "Lauki Sabzi with Moong Dal and Phulka"
                    }
                },
                {
                    day: "Wednesday",
                    focus: "Protein & Muscle Support",
                    rationale: "Moong dal chilla provides building blocks for growth.",
                    meals: {
                        breakfast: "Moong Dal Chilla stuffed with Paneer",
                        lunch: "Rajma Masala with Jeera Rice",
                        snack: "Peanut Chikki & Fresh Orange Juice",
                        dinner: "Vegetable Upma with Mint Chutney"
                    }
                },
                {
                    day: "Thursday",
                    focus: "Gut Health & Digestion",
                    rationale: "Probiotics in curd support healthy digestion.",
                    meals: {
                        breakfast: "Idli Sambar with Mint Chutney",
                        lunch: "Curd Rice with Pomegranate Seeds",
                        snack: "Roasted Chana & Buttermilk (Chaas)",
                        dinner: "Aloo Gobhi Sabzi with Jowar Roti"
                    }
                },
                {
                    day: "Friday",
                    focus: "Brain Development & Focus",
                    rationale: "Almonds and seeds provide essential fats for cognitive concentration.",
                    meals: {
                        breakfast: "Vegetable Poha with Roasted Peanuts",
                        lunch: "Soya Chunks Curry with Spinach Roti",
                        snack: "Walnuts & Dates with Milk",
                        dinner: "Paneer Pulao with Cucumber Raita"
                    }
                },
                {
                    day: "Saturday",
                    focus: "Weekend Balance",
                    rationale: "A delicious and nutrient-packed menu that children love.",
                    meals: {
                        breakfast: "Whole Wheat Pancakes with Honey",
                        lunch: "Mild Chole with Baked Bhature",
                        snack: "Fruit Chaat (Apple, Papaya, Sweet Lime)",
                        dinner: "Besan Chilla with Green Chutney"
                    }
                },
                {
                    day: "Sunday",
                    focus: "Reset & Hydration",
                    rationale: "Light, hydration-focused meals to prepare for the week.",
                    meals: {
                        breakfast: "Suji Upma with Watermelon Juice",
                        lunch: "Dal Tadka, Beans Sabzi, and Phulka",
                        snack: "Yogurt Parfait with Pomegranate",
                        dinner: "Mixed Vegetable Soup and Dal Khichdi"
                    }
                }
            ]
        };
        res.status(200).json(new ApiResponse(200, fallbackPlan, 'Child diet plan loaded from fallback'));
    }
});

// @desc    Get dynamic unified family diet plan using Gemini API based on all children's combined deficiencies
// @route   GET /api/profiles/unified-diet-plan
// @access  Private (Parent)
export const getUnifiedDietPlan = asyncHandler(async (req, res) => {
    const profiles = await Profile.find({ parentId: req.user._id });
    if (!profiles || profiles.length === 0) {
        res.status(404);
        throw new Error('No child profiles found for this user');
    }

    const childrenNames = [];
    const allDeficiencies = new Set();

    profiles.forEach(p => {
        childrenNames.push(p.name);
        const defs = p.wellnessAnalysis?.deficiencies || {};
        Object.keys(defs).forEach(key => {
            if (defs[key]?.severity === 'RED' || defs[key]?.severity === 'ORANGE') {
                allDeficiencies.add(key);
            }
        });
    });

    const compiledDeficiencies = Array.from(allDeficiencies);

    const prompt = `
You are a pediatric nutritionist specializing in traditional Indian cuisine.
Generate a unified weekly Indian diet plan (Monday to Sunday) designed for a family with children: ${childrenNames.join(', ')}.
The combined health deficiencies that need to be addressed across the children are: ${compiledDeficiencies.join(', ') || 'None (General Growth)'}.

Rules:
1. Recommending separate dishes for multiple children is exhausting for parents. Recommend ONE unified meal plan that meets all their nutritional requirements at once.
2. Recommend ONLY authentic, location-appropriate Indian dishes (e.g., Ragi Chilla, Palak Khichdi, Masala Roasted Makhana, Curd Rice, Moong Dal Chilla, Idli Sambar, Paneer Bhurji Paratha). Do NOT include non-Indian foods like avocado toast, quinoa, kale, blueberry smoothies, oats waffles, chia seed pudding, or general western foods.
3. Focus specifically on the children's combined active deficiencies:
   - If Iron: emphasize spinach, beetroot, sesame/til, jaggery, ragi, and pairing with Vitamin C (sweet lime, lemon juice, amla) for absorption.
   - If Protein: emphasize paneer, curd, pulses, lentils, sprouted grains, nuts.
   - If Calcium/Vitamin D: emphasize milk, curd, ragi, sesame seeds, paneer, and daylight exposure.
   - If Hydration/Water: emphasize warm water, buttermilk/chaas, fresh coconut water, home-made fresh juices.
   - If Fiber: emphasize whole-grain rotis, fresh local vegetables (lauki, turai, bhindi, carrots), local fruits.
4. Keep the meals child-friendly, appealing, and easy to prepare using standard Indian household ingredients.
5. Provide a day-by-day JSON format structure matching this schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Brief focus name (e.g., Combined Iron & Protein Boost)",
      "rationale": "Clear, concise explanation of why this menu works for the combined deficiencies (${compiledDeficiencies.join(', ')}) of all children (${childrenNames.join(', ')})",
      "meals": {
        "breakfast": "Meal name and brief description",
        "lunch": "Meal name and brief description",
        "snack": "Meal name and brief description",
        "dinner": "Meal name and brief description"
      }
    }
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting (like \`\`\`json).
`;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const apiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            }
        );

        const responseText = apiResponse.data.candidates[0].content.parts[0].text;
        const planData = JSON.parse(responseText);
        res.status(200).json(new ApiResponse(200, planData, 'Unified family diet plan generated successfully'));
    } catch (err) {
        console.error('Gemini error generating unified diet plan:', err.message);
        // Fallback unified plan
        const fallbackPlan = {
            weeklyPlan: [
                {
                    day: "Monday",
                    focus: "Combined Iron & Calcium Support",
                    rationale: "Integrates ragi, paneer, and spinach to address both iron and calcium needs simultaneously for all children.",
                    meals: {
                        breakfast: "Ragi Paneer Cheela with Mint Chutney",
                        lunch: "Palak Dal, Carrot Sabzi, Curd, and Wheat Phulka",
                        snack: "Roasted Sesame Jaggery Ladoo & Orange Slices",
                        dinner: "Moong Dal Khichdi with Ghee & Tomato Soup"
                    }
                },
                {
                    day: "Tuesday",
                    focus: "Protein & Gut Health Focus",
                    rationale: "Lentils and curd provide gut probiotics and protein tissue building blocks.",
                    meals: {
                        breakfast: "Idli Sambar with Coconut Chutney",
                        lunch: "Paneer Pulao, Cucumber Raita, and Beetroot Salad",
                        snack: "Roasted Makhana & Sweet Lime",
                        dinner: "Lauki Dal, Beans Poriyal, and Roti"
                    }
                },
                {
                    day: "Wednesday",
                    focus: "Fiber & Energy Reset",
                    rationale: "Whole grains and green vegetables provide high fiber for digestion and sustained play energy.",
                    meals: {
                        breakfast: "Vegetable Upma with Lemon Juice",
                        lunch: "Black Chana Curry, Spinach Roti, and Curd",
                        snack: "Fruit Chaat (Apple, Papaya, Banana)",
                        dinner: "Aloo Methi Sabzi, Yellow Dal, and Phulka"
                    }
                },
                {
                    day: "Thursday",
                    focus: "Bone & Skeletal Support",
                    rationale: "Calcium-heavy dairy and sesame snacks are matched with iron-building green lentils.",
                    meals: {
                        breakfast: "Milk & Atta Sheera with Almonds",
                        lunch: "Soybean Curry, Curd Rice, and Kachumber Salad",
                        snack: "Til Chikki & Buttermilk (Chaas)",
                        dinner: "Mixed Veg Sabzi, Dal Fry, and Multigrain Roti"
                    }
                },
                {
                    day: "Friday",
                    focus: "Brain Growth & Hydration",
                    rationale: "Nuts and hydrating juices promote focus and maintain electrolyte balance.",
                    meals: {
                        breakfast: "Vegetable Poha with Lemon & Peanuts",
                        lunch: "Rajma Masala, Jeera Rice, and Mint Raita",
                        snack: "Soaked Almonds & Pomegranate Juice",
                        dinner: "Paneer Bhurji with Whole Wheat Phulka"
                    }
                },
                {
                    day: "Saturday",
                    focus: "Weekend Balanced Treat",
                    rationale: "Combines high protein dal with kid-favorites for a healthy weekend treat.",
                    meals: {
                        breakfast: "Besan Chilla stuffed with paneer and peas",
                        lunch: "Mild Kabuli Chole with Steamed Rice and Salad",
                        snack: "Roasted Chana & Banana Sweet Lassi",
                        dinner: "Vegetable Soup and Khichdi with Ghee"
                    }
                },
                {
                    day: "Sunday",
                    focus: "Hydration & Nutrient Boost",
                    rationale: "Curd and fresh liquid bases reset digestion and replenish body fluids.",
                    meals: {
                        breakfast: "Suji Paneer Toast with Fresh Watermelon Juice",
                        lunch: "Paneer Butter Masala (mild), Dal Makhani, and Phulka",
                        snack: "Roasted Makhana & Almonds",
                        dinner: "Simple Moong Dal Khichdi and Curd"
                    }
                }
            ]
        };
        res.status(200).json(new ApiResponse(200, fallbackPlan, 'Unified family diet plan loaded from fallback'));
    }
});

