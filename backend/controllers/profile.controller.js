import Profile from '../models/Profile.model.js';
import GrowthRecord from '../models/GrowthRecord.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { profileSchema } from '../validators/profile.schema.js';
import { uploadFile } from '../services/storage.service.js';
import { sendEmail } from '../services/email.service.js';
import { computeWellnessAnalysis } from '../utils/wellnessEngine.js';

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
    profileData.wellnessAnalysis = computeWellnessAnalysis(profileData);

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
        const subject = `NutriBite: Child Profile Created - ${profile.name}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
                <h2 style="color: #2b9dee; margin-bottom: 20px;">Child Profile Created Successfully</h2>
                <p>Hello,</p>
                <p>A new child profile has been successfully created under your account on <strong>NutriBite</strong>.</p>
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
                <p>You can now manage their nutrition, track growth milestones, and upload medical reports on the NutriBite Parent Dashboard.</p>
                <br/>
                <p>Best regards,<br/><strong>NutriBite Team</strong></p>
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
    if (valData.name && valData.name !== existingProfile.name) fieldsChanged.push('Name');
    if (valData.dob && new Date(valData.dob).getTime() !== new Date(existingProfile.dob).getTime()) fieldsChanged.push('Date of Birth');
    if (valData.gender && valData.gender !== existingProfile.gender) fieldsChanged.push('Gender');
    if (valData.bloodGroup && valData.bloodGroup !== existingProfile.bloodGroup) fieldsChanged.push('Blood Group');
    if (valData.height && Number(valData.height) !== existingProfile.height) fieldsChanged.push('Height');
    if (valData.weight && Number(valData.weight) !== existingProfile.weight) fieldsChanged.push('Weight');
    if (valData.waistCircumference && Number(valData.waistCircumference) !== existingProfile.waistCircumference) fieldsChanged.push('Waist Circumference');
    if (valData.sportsActivityLevel && valData.sportsActivityLevel !== existingProfile.sportsActivityLevel) fieldsChanged.push('Sports Activity Level');
    if (valData.prematureBirth && (valData.prematureBirth.isPremature !== existingProfile.prematureBirth?.isPremature || valData.prematureBirth.weeksPremature !== existingProfile.prematureBirth?.weeksPremature)) fieldsChanged.push('Premature Birth Info');
    if (valData.parentNotes && valData.parentNotes !== existingProfile.parentNotes) fieldsChanged.push('Parent Notes');

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
    updatePayload.wellnessAnalysis = computeWellnessAnalysis(mergedProfileData);

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
        const subject = `NutriBite: Profile Updated - ${updatedProfile.name}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
                <h2 style="color: #2b9dee; margin-bottom: 20px;">Profile Update Alert</h2>
                <p>Hello,</p>
                <p>The profile of <strong>${updatedProfile.name}</strong> has been updated in your NutriBite account.</p>
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
                <p>Best regards,<br/><strong>NutriBite Team</strong></p>
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

    profile.wellnessAnalysis = computeWellnessAnalysis(profile.toObject());
    await profile.save();

    res.status(200).json(new ApiResponse(200, profile, 'Profile reanalyzed successfully'));
});
