import DoctorAccess from '../models/DoctorAccess.model.js';
import AuditLog from '../models/AuditLog.model.js';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import User from '../models/User.model.js';
import { createNotification } from './notification.service.js';

/**
 * Request access to a child profile via parent email
 */
export const requestAccess = async (doctorId, parentEmail) => {
    const parent = await User.findOne({ email: parentEmail, role: 'parent' });
    if (!parent) {
        throw new Error('Parent with this email not found');
    }

    // Find profiles for this parent
    const profiles = await Profile.find({ parentId: parent._id });
    if (profiles.length === 0) {
        throw new Error('This parent has no child profiles yet');
    }

    const requests = [];
    for (const profile of profiles) {
        // Check existing
        const existing = await DoctorAccess.findOne({ doctorId, profileId: profile._id });
        if (!existing) {
            const req = await DoctorAccess.create({
                doctorId,
                profileId: profile._id,
                status: 'pending'
            });
            requests.push(req);

            // Notify Parent
            await createNotification(
                parent._id,
                `A Doctor has requested access to ${profile.name}'s profile.`,
                'system',
                doctorId
            );
        }
    }

    if (requests.length === 0) {
        return { message: 'Access requests already sent or exist.' };
    }

    return { message: `Access requested for ${requests.length} children.`, requests };
};

/**
 * Get all patients (profiles) that the doctor has access to
 */
export const getMyPatients = async (doctorId) => {
    const accesses = await DoctorAccess.find({
        doctorId,
        status: { $in: ['active', 'restricted'] }
    }).populate('profileId');
    return accesses.map(a => ({
        ...a.profileId.toObject(),
        accessStatus: a.status,
        accessId: a._id
    })).filter(p => p !== null && p._id);
};

/**
 * Validate if a doctor has ACTIVE access to a profile
 * Logs the attempt to AuditLog
 */
export const validateAccess = async (doctorId, profileId, action = 'VIEW_ATTEMPT') => {
    // 1. Check Access Record
    const access = await DoctorAccess.findOne({
        doctorId,
        profileId,
        status: { $in: ['active', 'restricted', 'pending'] }
    });

    let status = 'DENIED';
    if (access) {
        if (access.status === 'active') {
            status = 'ALLOWED';
        } else {
            status = 'RESTRICTED';
        }
    }

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

    // If action requires full access (e.g., UPDATE_NOTES), check if status is active
    if (action === 'UPDATE_NOTES' && access.status !== 'active') {
        throw new Error('Access Denied: Full access is required to update health notes.');
    }

    return true;
};

/**
 * Get full patient details (Profile + Meals + Generated Summary)
 */
export const getPatientDetails = async (doctorId, profileId) => {
    // 1. Fetch Access Info first to check status
    const access = await DoctorAccess.findOne({
        doctorId,
        profileId,
        status: { $in: ['active', 'restricted', 'pending'] }
    });

    if (!access) throw new Error('Access Denied');

    // 2. Fetch Data
    const profile = await Profile.findById(profileId);
    if (!profile) throw new Error('Profile not found');

    if (access.status === 'restricted' || access.status === 'pending') {
        // Return only basic info for restricted/pending status
        return {
            profile: {
                _id: profile._id,
                name: profile.name,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                avatar: profile.avatar,
                profileImage: profile.profileImage
            },
            message: access.message,
            status: 'restricted', // Always tell frontend it is restricted if not active
            accessId: access._id
        };
    }

    const meals = await MealLog.find({ profileId }).sort({ date: -1 }).limit(50);

    return {
        profile,
        meals,
        status: 'active',
        accessId: access._id
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
export const getGrowthVelocity = async (doctorId, profileId) => {
    // 1. Validate active access (doctors with restricted access cannot see clinical data)
    const access = await DoctorAccess.findOne({
        doctorId,
        profileId,
        status: 'active'
    });
    if (!access) throw new Error('Active access required to view Growth Velocity data');

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

