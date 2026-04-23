import { z } from 'zod';

export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    dob: z.string().or(z.date()),
    age: z.number().int().positive('Age must be a positive number').optional(),
    gender: z.enum(['male', 'female', 'other']),
    height: z.number().positive('Height must be positive'),
    weight: z.number().positive('Weight must be positive'),
    waistCircumference: z.number().positive('Waist Circumference must be positive'),
    activityLevel: z.enum(['low', 'moderate', 'high']).optional(),
    dietaryPreferences: z.array(z.string()).optional(),
    avatar: z.string().min(1, 'Avatar selection is required'),
    conditions: z.array(z.string()).optional(),
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
