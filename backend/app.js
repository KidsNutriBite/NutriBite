import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import mealRoutes from './routes/meal.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import accessRoutes from './routes/access.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import gameRoutes from './routes/game.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import parentRoutes from './routes/parent.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import growthRoutes from './routes/growth.routes.js'; // New import
import escalationRoutes from './routes/escalation.routes.js';
import nutritionTrendsRoutes from './routes/nutritionTrends.routes.js';
import sleepRoutes from './routes/sleep.routes.js';
import activityRoutes from './routes/activity.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js'; // New import
import twinRoutes from './routes/twin.routes.js';
import { correlationMiddleware, requestLatencyLogger } from './utils/otel.js';
import { protect } from './middlewares/auth.middleware.js';
import { authorize } from './middlewares/role.middleware.js';
import { analyzeMealImageDebug } from './controllers/meal.controller.js';
import multer from 'multer';

// Initialize App
const app = express();

// Simple In-Memory Rate Limiter to protect all API endpoints
const clients = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 100;

    let requests = clients.get(ip) || [];
    requests = requests.filter(t => now - t < windowMs);
    
    if (requests.length >= maxRequests) {
        return res.status(429).json({ message: "Too many requests from this IP, please try again after a minute." });
    }
    
    requests.push(now);
    clients.set(ip, requests);
    next();
};

// Apply Correlation IDs and Latency telemetry
app.use(correlationMiddleware);
app.use(requestLatencyLogger);

// Apply Rate Limiter and JSON parsing
app.use('/api', rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded
}));

// Serve Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/growth', growthRoutes); // New route
app.use('/api/escalations', escalationRoutes);
app.use('/api/nutrition-trends', nutritionTrendsRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/nutrition-analysis', nutritionRoutes); // Mount nutrition routes
app.use('/api/twin', twinRoutes);

// Debug Food Analysis Route (Task 5)
const upload = multer();
app.post('/api/debug-food-analysis', protect, authorize('parent'), upload.any(), analyzeMealImageDebug);

// Health Check
app.get('/', (req, res) => {
    res.send('NutriKid API is running...');
});

// Error Handling
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

export default app;
