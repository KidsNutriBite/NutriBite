import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    hospitalId: {
        type: String, // From Overview API, so string ID
        required: true
    },
    hospitalName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
        default: 'pending'
    },
    medicalReport: {
        type: String, // URL to stored file
        default: null
    }
}, {
    timestamps: true
});

// Prevent double booking for same child at same hospital at same time
appointmentSchema.index({ profileId: 1, hospitalId: 1, date: 1, time: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
