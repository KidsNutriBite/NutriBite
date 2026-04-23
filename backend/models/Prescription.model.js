import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Prescription title is required'],
            trim: true,
        },
        diagnosis: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        instructions: {
            type: String,
            required: [true, 'Instructions are required'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
