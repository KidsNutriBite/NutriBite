import ActivityLog from '../models/ActivityLog.model.js';
import Profile from '../models/Profile.model.js';

// Add or update an activity log for a specific date
export const logActivity = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { date, activities } = req.body;

        if (!date || !activities || !Array.isArray(activities)) {
            return res.status(400).json({ message: "Date and activities array are required." });
        }

        let activityLog = await ActivityLog.findOne({ profileId, date });

        if (!activityLog) {
            activityLog = new ActivityLog({ profileId, date, activities: [] });
        }

        // Add new activities
        activityLog.activities.push(...activities);

        await activityLog.save();

        res.status(200).json({
            message: "Activity logged successfully",
            data: activityLog
        });
    } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ message: "Failed to log activity", error: error.message });
    }
};

// Get daily activity log
export const getDailyActivity = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date query parameter is required." });
        }

        const activityLog = await ActivityLog.findOne({ profileId, date });

        res.status(200).json({
            data: activityLog || { profileId, date, activities: [], totalDuration: 0, status: 'Inactive' }
        });
    } catch (error) {
        console.error("Error fetching daily activity:", error);
        res.status(500).json({ message: "Failed to fetch activity", error: error.message });
    }
};

// Get activity history
export const getActivityHistory = async (req, res) => {
    try {
        const { profileId } = req.params;
        const logs = await ActivityLog.find({ profileId }).sort({ date: -1 }).limit(30);
        
        res.status(200).json({ data: logs });
    } catch (error) {
        console.error("Error fetching activity history:", error);
        res.status(500).json({ message: "Failed to fetch activity history", error: error.message });
    }
};

// Delete a specific activity from a log
export const deleteActivity = async (req, res) => {
    try {
        const { profileId, logId, activityId } = req.params;

        const log = await ActivityLog.findOne({ _id: logId, profileId });
        
        if (!log) {
            return res.status(404).json({ message: "Activity log not found" });
        }

        log.activities = log.activities.filter(a => a._id.toString() !== activityId);
        
        await log.save();

        res.status(200).json({
            message: "Activity deleted successfully",
            data: log
        });
    } catch (error) {
        console.error("Error deleting activity:", error);
        res.status(500).json({ message: "Failed to delete activity", error: error.message });
    }
};
