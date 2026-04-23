
import { z } from 'zod';

const parentSchema = z.object({
    role: z.literal('parent'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    city: z.string().min(2, 'City is required'),
    relationToChild: z.string().min(2, 'Relation to child is required'),
});

const doctorSchema = z.object({
    role: z.literal('doctor'),
    specialization: z.string().min(2, 'Specialization is required'),
    hospitalName: z.string().min(2, 'Hospital/Clinic name is required'),
    experienceYears: z.coerce.number().min(0, 'Experience years must be valid'),
    registrationId: z.string().min(2, 'Medical License ID is required'),
});

const baseUserSchema = z.object({
    title: z.enum(['Mr', 'Ms', 'Mrs']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.intersection(
    baseUserSchema,
    z.discriminatedUnion('role', [parentSchema, doctorSchema])
);

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
