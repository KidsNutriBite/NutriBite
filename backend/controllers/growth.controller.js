import GrowthRecord from '../models/GrowthRecord.model.js';
import Profile from '../models/Profile.model.js';
import Notification from '../models/Notification.model.js';
import DoctorAccess from '../models/DoctorAccess.model.js';
import { calculateBMI, calculateAgeInMonths, calculatePercentileAndRisk } from '../utils/growthUtils.js';

// Get growth history for a child
export const getGrowthHistory = async (req, res) => {
    try {
        const { childId } = req.params;
        const records = await GrowthRecord.find({ childId }).sort({ timestamp: 1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Error fetching growth records", error: error.message });
    }
};

// Add new growth record
export const addGrowthRecord = async (req, res) => {
    try {
        const { childId } = req.params;
        const { height, weight, waistCircumference, notes } = req.body;
        const releasedByUserId = req.user._id.toString();
        const userRole = req.user.role;

        // 1. Fetch Child Profile directly
        const childProfile = await Profile.findById(childId);

        if (!childProfile) {
            return res.status(404).json({ message: "Child profile not found" });
        }

        // 2. Validate Access
        if (userRole === 'parent') {
            // Verify this parent owns the child
            if (childProfile.parentId.toString() !== releasedByUserId) {
                return res.status(403).json({ message: "Unauthorized access to this child" });
            }
        }

        // 3. Calculate Age
        // Use DOB if available, otherwise fallback to age * 12
        const ageInMonths = childProfile.dob ? calculateAgeInMonths(childProfile.dob) : (childProfile.age * 12);

        // 4. Calculate BMI & Risk
        const bmi = calculateBMI(weight, height);
        const { percentile, riskStatus } = calculatePercentileAndRisk(ageInMonths, bmi);

        // 5. Create Verified Status
        const verified = (userRole === 'doctor');

        // 6. Create Record
        const newRecord = new GrowthRecord({
            childId,
            height,
            weight,
            bmi,
            percentile,
            riskStatus,
            waistCircumference,
            ageInMonths,
            recordedByRole: userRole,
            recordedByUserId: releasedByUserId,
            verified,
            notes,
            timestamp: new Date()
        });

        await newRecord.save();

        // 7. Update Child's latest stats 
        childProfile.height = height;
        childProfile.weight = weight;
        if (waistCircumference) childProfile.waistCircumference = waistCircumference;
        await childProfile.save();

        // 8. Notification Logic (If Parent & Risky)
        if (userRole === 'parent' && (riskStatus === 'underweight' || riskStatus === 'obese')) {
            // Find linked doctors
            try {
                // Find doctors who have active access to this specific child (profileId)
                const linkedDoctors = await DoctorAccess.find({
                    profileId: childId,
                    status: 'active'
                });

                if (linkedDoctors.length > 0) {
                    const alertMessage = `Health Alert: ${childProfile.name} has recorded a growth update indicating they are ${riskStatus} (BMI: ${bmi}, ${percentile}th percentile). Please review.`;

                    const notifications = linkedDoctors.map(access => ({
                        recipientId: access.doctorId,
                        senderId: releasedByUserId,
                        type: 'health_alert',
                        message: alertMessage,
                        isRead: false
                    }));

                    if (notifications.length > 0) {
                        await Notification.insertMany(notifications);
                    }
                }
            } catch (notifError) {
                console.error("Error creating doctor notifications:", notifError);
                // Non-blocking error
            }
        }

        res.status(201).json({
            message: "Growth record added successfully",
            record: newRecord,
            bmi,
            percentile,
            riskStatus,
            verified
        });

    } catch (error) {
        console.error("Error adding growth record:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete growth record
export const deleteGrowthRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const releasedByUserId = req.user._id.toString();
        const userRole = req.user.role;

        const record = await GrowthRecord.findById(recordId);

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        // Logic: Only creator can delete, or doctor can delete any.
        if (record.recordedByUserId.toString() !== releasedByUserId && userRole !== 'doctor') {
            return res.status(403).json({ message: "Unauthorized to delete this record" });
        }

        await GrowthRecord.findByIdAndDelete(recordId);

        res.status(200).json({ message: "Growth record deleted" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting record", error: error.message });
    }
};
