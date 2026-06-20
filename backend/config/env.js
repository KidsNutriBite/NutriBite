import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRE: z.string().default('30d'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Two-Factor Authentication Settings
    PARENT_2FA_MANDATORY: z.string().default('false'),
    SMS_PROVIDER: z.enum(['twilio', 'msg91', 'fast2sms', 'console']).default('console'),
    TWILIO_ACCOUNT_SID: z.string().default(''),
    TWILIO_AUTH_TOKEN: z.string().default(''),
    TWILIO_PHONE_NUMBER: z.string().default(''),
    MSG91_AUTH_KEY: z.string().default(''),
    MSG91_TEMPLATE_ID: z.string().default(''),
    FAST2SMS_API_KEY: z.string().default(''),
});

const env = envSchema.parse(process.env);

export default env;
