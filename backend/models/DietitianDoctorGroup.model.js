import mongoose from 'mongoose';

const dietitianDoctorGroupSchema = new mongoose.Schema(
    {
        dietitianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        doctorIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
    },
    { timestamps: true }
);

const DietitianDoctorGroup = mongoose.model('DietitianDoctorGroup', dietitianDoctorGroupSchema);

export default DietitianDoctorGroup;
