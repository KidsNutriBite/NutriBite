import ConsultationRequest from '../models/ConsultationRequest.model.js';
import AuditLog from '../models/AuditLog.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import User from '../models/User.model.js';
import { createNotification } from './notification.service.js';

/**
 * Get all patients (profiles) that the doctor has access to
 */
export const getMyPatients = async (doctorId) => {
    const requests = await ConsultationRequest.find({
        doctorId,
        status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] }
    }).populate('profileId');

    const Prescription = (await import('../models/Prescription.model.js')).default;
    
    const profileMap = new Map();
    for (const req of requests) {
        if (!req.profileId) continue;
        const profileIdStr = req.profileId._id.toString();
        if (!profileMap.has(profileIdStr)) {
            const profileObj = req.profileId.toObject();
            const lastCheckup = await Prescription.findOne({ profileId: req.profileId._id })
                .sort({ date: -1 })
                .lean();
            profileMap.set(profileIdStr, {
                ...profileObj,
                accessStatus: 'active',
                consultationRequestId: req._id,
                consultationStatus: req.status,
                lastCheckupDate: lastCheckup ? lastCheckup.date : null
            });
        }
    }
    return Array.from(profileMap.values());
};

/**
 * Validate if a doctor has ACTIVE access to a profile
 * Logs the attempt to AuditLog
 */
export const validateAccess = async (doctorId, profileId, action = 'VIEW_ATTEMPT') => {
    // 1. Check active/completed consultation request
    const access = await ConsultationRequest.findOne({
        doctorId,
        profileId,
        status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] }
    });

    const status = access ? 'ALLOWED' : 'DENIED';

    // 2. Create Audit Log (Async, don't block)
    AuditLog.create({
        doctorId,
        profileId,
        action,
        status
    }).catch(err => console.error('Audit Log Failed:', err));

    // 3. Return or Throw
    if (!access) {
        throw new Error('Access Denied: You do not have permission to view this patient.');
    }

    return true;
};

/**
 * Get full patient details (Profile + Meals + Generated Summary)
 */
export const getPatientDetails = async (doctorId, profileId) => {
    // 1. Fetch Access Info first to check status
    const access = await ConsultationRequest.findOne({
        doctorId,
        profileId,
        status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] }
    });

    if (!access) throw new Error('Access Denied');

    // 2. Fetch Data
    const profile = await Profile.findById(profileId);
    if (!profile) throw new Error('Profile not found');

    const logs = await MealLog.find({ profileId }).sort({ date: -1 }).limit(30);
    const meals = [];
    logs.forEach(log => {
        const slots = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
        slots.forEach(slot => {
            const items = log[slot] || [];
            if (items.length > 0) {
                const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
                
                let displayType = slot.charAt(0).toUpperCase() + slot.slice(1);
                if (displayType === 'MorningSnack') displayType = 'Morning Snack';
                if (displayType === 'AfternoonSnack') displayType = 'Afternoon Snack';
                if (displayType === 'EveningSnack') displayType = 'Evening Snack';

                meals.push({
                    _id: `${log._id}_${slot}`,
                    date: log.date,
                    mealType: displayType,
                    foodItems: items.map(item => ({
                        name: item.name,
                        calories: item.calories
                    })),
                    nutrients: {
                        calories: totalCalories
                    }
                });
            }
        });
    });

    return {
        profile,
        meals,
        status: 'active',
        consultationRequestId: access._id,
        consultationStatus: access.status
    };
};

/**
 * Update health notes for a patient
 */
export const updateHealthNotes = async (doctorId, profileId, note) => {
    // 1. Validate Access
    await validateAccess(doctorId, profileId, 'UPDATE_NOTES');

    const profile = await Profile.findById(profileId);
    if (!profile) throw new Error('Profile not found');

    profile.healthNotes = note;
    await profile.save();

    // Notify Parent
    await createNotification(
        profile.parentId,
        `New health note added for ${profile.name}.`,
        'doctor_message',
        doctorId
    );

    return profile;
};

/**
 * Compute growth velocity analysis for a patient
 * Calls FastAPI /growth/velocity with the child's GrowthRecords
 */
export const getGrowthVelocity = async (userId, profileId, userRole = 'doctor') => {
    // 1. Validate consultation assignment for Doctor or Dietitian.
    let access;
    if (userRole === 'dietitian') {
        access = await ConsultationRequest.findOne({
            dietitianId: userId,
            profileId,
        });
    } else {
        access = await ConsultationRequest.findOne({
            doctorId: userId,
            profileId,
            status: { $in: ['AssignedToDoctor', 'UnderDoctorReview', 'PrescriptionIssued', 'Closed'] }
        });
    }
    if (!access) throw new Error('Assigned consultation access required to view Growth Velocity data');

    // 2. Fetch child profile
    const profile = await Profile.findById(profileId);
    if (!profile) throw new Error('Profile not found');

    // 3. Fetch all growth records sorted ascending
    const GrowthRecord = (await import('../models/GrowthRecord.model.js')).default;
    const records = await GrowthRecord.find({ childId: profileId })
        .sort({ timestamp: 1 })
        .lean();

    if (records.length === 0) {
        return {
            profileId,
            insufficientData: true,
            recordCount: 0,
            insufficientDataReason: 'No growth records found for this child. Add measurements to enable velocity analysis.',
            insights: ['No growth records have been logged yet. Please record height and weight measurements to begin velocity tracking.'],
            recommendations: ['Start by recording a baseline measurement, then follow up monthly.'],
            velocityMetrics: {},
            velocityTimeline: [],
            growthTimeline: [],
            riskIndicators: [],
            stabilityScore: 0,
            riskScore: 0,
            percentileDrift: { direction: 'STABLE', magnitude: 0 },
        };
    }

    // 4. Build profile payload for FastAPI
    const profilePayload = {
        _id: profile._id.toString(),
        name: profile.name,
        age: profile.age,
        gender: profile.gender || 'male',
        ageInMonths: profile.dob
            ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
            : profile.age * 12,
        height: profile.height,
        weight: profile.weight,
    };

    // 5. Call FastAPI growth velocity engine
    const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
        const response = await fetch(`${AI_URL}/growth/velocity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profile: profilePayload,
                growth_records: records.map(r => ({
                    ...r,
                    _id: r._id.toString(),
                    childId: r.childId.toString(),
                    recordedByUserId: r.recordedByUserId.toString(),
                    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
                })),
            }),
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`FastAPI error: ${response.status} — ${errText}`);
        }

        const velocityData = await response.json();

        // 6. Enrich with record metadata (doctor-verified flags)
        velocityData.verifiedRecordCount = records.filter(r => r.verified).length;
        velocityData.totalRecordCount = records.length;
        velocityData.childName = profile.name;

        return velocityData;
    } catch (fetchError) {
        // Graceful degradation: return raw records without AI analysis
        console.error('[GrowthVelocity] FastAPI call failed:', fetchError.message);
        return {
            profileId,
            computedAt: new Date().toISOString(),
            recordCount: records.length,
            childName: profile.name,
            fastApiUnavailable: true,
            growthTimeline: records.map(r => ({
                date: new Date(r.timestamp).toISOString().split('T')[0],
                height: r.height,
                weight: r.weight,
                bmi: r.bmi,
                percentile: r.percentile,
            })),
            velocityMetrics: {},
            velocityTimeline: [],
            insights: ['Growth velocity engine temporarily unavailable. Raw growth data displayed below.'],
            recommendations: ['Retry in a few moments or check AI service status.'],
            riskIndicators: [],
            stabilityScore: null,
            riskScore: null,
            percentileDrift: { direction: 'STABLE', magnitude: 0 },
        };
    }
};

