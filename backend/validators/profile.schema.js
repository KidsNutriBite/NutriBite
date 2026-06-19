import { z } from 'zod';

export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    dob: z.coerce.date().refine(val => val <= new Date(), { message: "Future date of birth is not allowed" }),
    gender: z.enum(['male', 'female', 'other']),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { required_error: "Blood Group is required" }),
    height: z.coerce.number().min(50, "Height must be between 50 and 220 cm").max(220, "Height must be between 50 and 220 cm"),
    weight: z.coerce.number().min(1, "Weight must be between 1 and 200 kg").max(200, "Weight must be between 1 and 200 kg"),
    waistCircumference: z.coerce.number().min(20, "Waist circumference must be between 20 and 200 cm").max(200, "Waist circumference must be between 20 and 200 cm"),
    sportsActivityLevel: z.enum(['Very Active', 'Active', 'Moderately Active', 'Low Activity', 'Sedentary']).optional().default('Moderately Active'),
    prematureBirth: z.object({
        isPremature: z.boolean().default(false),
        weeksPremature: z.coerce.number().nonnegative().optional().default(0)
    }).optional(),
    location: z.object({
        country: z.string().min(1, "Country is required"),
        state: z.string().min(1, "State is required"),
        city: z.string().min(1, "City is required"),
        address: z.string().min(1, "Address is required")
    }),
    healthConditions: z.array(z.string()).optional().default([]),
    otherCondition: z.string().optional().default(''),
    familyHistory: z.object({
        siblingConditions: z.object({
            hasCondition: z.boolean().default(false),
            description: z.string().optional().default('')
        }).optional(),
        motherConditions: z.object({
            hasCondition: z.boolean().default(false),
            description: z.string().optional().default('')
        }).optional(),
        fatherConditions: z.object({
            hasCondition: z.boolean().default(false),
            description: z.string().optional().default('')
        }).optional(),
        nutritionConcerns: z.string().optional().default('')
    }).optional(),
    goals: z.object({
        primary: z.string().min(1, "Primary goal is required"),
        secondary: z.array(z.string()).optional().default([])
    }),
    preferences: z.object({
        favoriteFoods: z.string().optional().default(''),
        dislikedFoods: z.string().optional().default(''),
        favoriteFruits: z.string().optional().default(''),
        favoriteVegetables: z.string().optional().default(''),
        favoriteSnacks: z.string().optional().default(''),
        waterIntake: z.coerce.number().nonnegative("Water intake cannot be negative").default(0),
        activityLevel: z.enum(['low', 'moderate', 'high']).default('moderate'),
        sleepDuration: z.coerce.number().nonnegative("Sleep duration cannot be negative").default(0),
        sleepQuality: z.enum(['Poor', 'Average', 'Good']).optional().default('Average'),
        screenTime: z.coerce.number().nonnegative("Screen time cannot be negative").default(0),
        eatingHabits: z.enum(['poor', 'average', 'good']).default('average')
    }).optional(),
    medicalReports: z.array(
        z.object({
            reportName: z.string().min(1, "Report name is required"),
            reportDate: z.coerce.date(),
            hospitalName: z.string().min(1, "Hospital name is required"),
            doctorName: z.string().min(1, "Doctor name is required"),
            comments: z.string().optional().default(''),
            attachment: z.string().optional().default(''),
            status: z.enum(['Reviewed', 'Not Reviewed']).default('Not Reviewed')
        })
    ).optional().default([]),
    parentNotes: z.string().optional().default(''),
    avatar: z.string().optional().default('lion'),
    profileImage: z.string().nullable().optional()
});


export const mealLogSchema = z.object({
    profileId: z.string().min(1, 'Profile ID is required'),
    date: z.string().or(z.date()).optional(),
    time: z.string().optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'water']),
    foodItems: z.array(
        z.object({
            name: z.string().min(1, 'Food name is required'),
            quantity: z.string().min(1, 'Quantity is required'),
            calories: z.number().nonnegative().optional(),
            protein: z.number().nonnegative().optional(),
            carbs: z.number().nonnegative().optional(),
            fats: z.number().nonnegative().optional(),
        })
    ).optional().default([]),
    waterIntake: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    nutrients: z.record(z.string(), z.number()).optional(),
});
