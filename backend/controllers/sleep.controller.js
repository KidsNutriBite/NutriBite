import SleepLog from '../models/SleepLog.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

const calculateSleepHours = (sleepTime, wakeUpTime) => {
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);

    const sleepStart = new Date();
    sleepStart.setHours(sleepHours, sleepMinutes, 0, 0);

    const wakeUp = new Date();
    wakeUp.setHours(wakeHours, wakeMinutes, 0, 0);

    let diffInMs = wakeUp - sleepStart;
    if (diffInMs < 0) {
        diffInMs += 24 * 60 * 60 * 1000;
    }

    return Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100;
};

const getSleepStatus = (hours) => {
    if (hours < 8) return 'poor';
    if (hours <= 10) return 'healthy';
    return 'oversleep';
};

const normalizeDate = (date) => {
    if (!date) return date;
    if (date.includes('-') && date.length === 10) {
        const parts = date.split('-');
        if (parts[0].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    return date;
};

// @desc    Log or update sleep for a specific date
// @route   POST /api/sleep
// @access  Private (Parent)
export const logSleep = asyncHandler(async (req, res) => {
    const { profileId, date, sleepTime, wakeUpTime, notes } = req.body;

    if (!profileId || !date || !sleepTime || !wakeUpTime) {
        res.status(400);
        throw new Error('Missing required fields: profileId, date, sleepTime, wakeUpTime');
    }

    const normalizedDate = normalizeDate(date);
    const totalSleepHours = calculateSleepHours(sleepTime, wakeUpTime);
    const status = getSleepStatus(totalSleepHours);

    const sleepLog = await SleepLog.findOneAndUpdate(
        { profileId, date: normalizedDate },
        {
            profileId,
            date: normalizedDate,
            sleepTime,
            wakeUpTime,
            totalSleepHours,
            status,
            notes: notes || '',
        },
        { new: true, upsert: true, runValidators: true }
    );

    const message =
        status === 'healthy'
            ? 'Sleep pattern is healthy'
            : status === 'poor'
                ? 'Child is not getting enough sleep'
                : 'Child is oversleeping';

    res.status(200).json(new ApiResponse(200, { ...sleepLog.toObject(), message }, 'Sleep logged successfully'));
});

// @desc    Get sleep log by date
// @route   GET /api/sleep/:id/:date
// @access  Private (Parent)
export const getSleepByDate = asyncHandler(async (req, res) => {
    const { id, date } = req.params;
    const normalizedDate = normalizeDate(date);

    const sleepLog = await SleepLog.findOne({ profileId: id, date: normalizedDate });

    if (!sleepLog) {
        return res.status(200).json(
            new ApiResponse(200, {
                date: normalizedDate,
                sleepTime: '',
                wakeUpTime: '',
                totalSleepHours: 0,
                status: 'poor',
                notes: '',
                message: 'No sleep log found for this date',
            }, 'No sleep data found')
        );
    }

    const message =
        sleepLog.status === 'healthy'
            ? 'Sleep pattern is healthy'
            : sleepLog.status === 'poor'
                ? 'Child is not getting enough sleep'
                : 'Child is oversleeping';

    res.status(200).json(new ApiResponse(200, { ...sleepLog.toObject(), message }, 'Sleep log fetched'));
});

// @desc    Get sleep history
// @route   GET /api/sleep/history/:id
// @access  Private (Parent)
export const getSleepHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const logs = await SleepLog.find({ profileId: id }).sort({ date: -1 }).limit(30);

    res.status(200).json(new ApiResponse(200, logs, 'Sleep history fetched'));
});
