import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
    {
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        dob: {
            type: Date,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        height: {
            type: Number, // in cm
            required: true,
        },
        weight: {
            type: Number, // in kg
            required: true,
        },
        waistCircumference: {
            type: Number, // in cm
            required: true,
        },
        activityLevel: {
            type: String,
            enum: ['low', 'moderate', 'high'],
            default: 'moderate',
        },
        dietaryPreferences: {
            type: [String], // e.g., 'vegetarian', 'nut-free'
            default: [],
        },
        avatar: {
            type: String,
            required: true, // Mandatory avatar for UI/Kids Mode
            default: 'lion', // Default avatar
        },
        profileImage: {
            type: String, // URL to uploaded image
        },
        location: {
            city: { type: String },
            state: { type: String },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number }
            }
        },
        healthConditions: {
            type: [String],
            // enum restriction removed to allow custom conditions
            default: [],
        },
        medicalReports: {
            type: [String], // Array of URLs/Paths
            default: []
        },
        healthNotes: {
            type: String, // Doctor's notes
            default: ''
        },
    },
    { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
