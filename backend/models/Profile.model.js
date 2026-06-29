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
        bloodGroup: {
            type: String,
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
        sportsActivityLevel: {
            type: String,
            enum: ['Very Active', 'Active', 'Moderately Active', 'Low Activity', 'Sedentary'],
            default: 'Moderately Active'
        },
        prematureBirth: {
            isPremature: { type: Boolean, default: false },
            weeksPremature: { type: Number, default: 0 }
        },
        location: {
            country: { type: String, required: true },
            state: { type: String, required: true },
            city: { type: String, required: true },
            address: { type: String, required: true }
        },
        healthConditions: {
            type: [String],
            default: [],
        },
        otherCondition: {
            type: String,
            default: ''
        },
        familyHistory: {
            siblingConditions: {
                hasCondition: { type: Boolean, default: false },
                description: { type: String, default: '' }
            },
            motherConditions: {
                hasCondition: { type: Boolean, default: false },
                description: { type: String, default: '' }
            },
            fatherConditions: {
                hasCondition: { type: Boolean, default: false },
                description: { type: String, default: '' }
            },
            nutritionConcerns: { type: String, default: '' }
        },
        goals: {
            primary: { type: String, required: true },
            secondary: { type: [String], default: [] }
        },
        preferences: {
            favoriteFoods: { type: String, default: '' },
            dislikedFoods: { type: String, default: '' },
            favoriteFruits: { type: String, default: '' },
            favoriteVegetables: { type: String, default: '' },
            favoriteSnacks: { type: String, default: '' },
            waterIntake: { type: Number, default: 0 }, // in ml/day
            activityLevel: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
            sleepDuration: { type: Number, default: 0 }, // in hours
            sleepQuality: { type: String, enum: ['Poor', 'Average', 'Good'], default: 'Average' },
            screenTime: { type: Number, default: 0 }, // in hours
            eatingHabits: { type: String, enum: ['poor', 'average', 'good'], default: 'average' }
        },
        medicalReports: [
            {
                reportName: { type: String, required: true },
                reportDate: { type: Date, required: true },
                hospitalName: { type: String, required: true },
                doctorName: { type: String, required: true },
                comments: { type: String, default: '' },
                attachment: { type: String, required: true }, // File path/URL
                status: { type: String, enum: ['Reviewed', 'Not Reviewed'], default: 'Not Reviewed' }
            }
        ],
        changeHistory: [
            {
                updatedAt: { type: Date, default: Date.now },
                fieldsChanged: { type: [String] },
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }
        ],
        wellnessAnalysis: {
            score: { type: Number, default: 100 },
            nutritionScore: { type: Number, default: 100 },
            deficiencyScore: { type: Number, default: 100 },
            growthRiskScore: { type: Number, default: 100 },
            hydrationScore: { type: Number, default: 100 },
            mealQualityScore: { type: Number, default: 100 },
            rdas: { type: mongoose.Schema.Types.Mixed },
            deficiencies: { type: mongoose.Schema.Types.Mixed },
            groceries: { type: [String], default: [] },
            improvementPlan: { type: mongoose.Schema.Types.Mixed },
            growthImpacts: { type: mongoose.Schema.Types.Mixed },
            aiExplanation: { type: String, default: '' },
            concerns: [
                {
                    issue: { type: String },
                    whyItMatters: { type: String },
                    healthImpact: { type: String },
                    priority: { type: String },
                    solutionKey: { type: String }
                }
            ],
            monitor: [
                {
                    issue: { type: String },
                    whyItMatters: { type: String },
                    priority: { type: String }
                }
            ],
            strengths: [
                {
                    strength: { type: String },
                    benefit: { type: String },
                    recommendation: { type: String }
                }
            ],
            recommendations: [
                {
                    concern: { type: String },
                    solution: { type: String },
                    expectedImprovement: { type: String },
                    icon: { type: String }
                }
            ]
        },
        parentNotes: {
            type: String,
            default: ''
        },
        avatar: {
            type: String,
            required: true,
            default: 'lion',
        },
        profileImage: {
            type: String,
        },
        healthNotes: {
            type: String, // Doctor's notes
            default: ''
        },
        level: {
            type: Number,
            default: 1
        },
        currentXP: {
            type: Number,
            default: 0
        },
        streakCount: {
            type: Number,
            default: 0
        },
        lastMealLoggedAt: {
            type: Date,
            default: null
        },
        dailyLogsCount: {
            type: Number,
            default: 0
        },
        lastLogResetAt: {
            type: Date,
            default: Date.now
        },
        equippedCompanion: {
            type: String,
            default: 'Captain Milk'
        }
    },
    { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
