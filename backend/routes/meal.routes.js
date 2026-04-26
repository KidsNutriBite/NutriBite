import express from 'express';
import path from 'path';
import { logMeal, getMealHistory, deleteFoodItem, getMealsByDate, getLastMealTime } from '../controllers/meal.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { checkProfileOwnership } from '../middlewares/ownership.middleware.js';
import multer from 'multer';

// Re-implement the same middleware flow
// Middleware to ensure profileId is checked for ownership before logMeal
// Note: logMeal reads profileId from body
const checkBodyOwnership = async (req, res, next) => {
    // Custom check if profileId is in body
    if (req.body.profileId) {
        // Assume checkProfileOwnership handles req.params.id usually. 
        // We'll mimic it:
        req.params.id = req.body.profileId;
        return checkProfileOwnership(req, res, next);
    }
    next();
};

const router = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.use(protect);

// LOG MEAL (Use checkBodyOwnership for POST)
router.post('/', authorize('parent'), upload.any(), checkBodyOwnership, logMeal);

// GET HISTORY (Use verify :id which is profileId)
router.get('/history/:id', checkProfileOwnership, getMealHistory);

// GET SPECIFIC DATE
router.get('/by-date/:id/:date', checkProfileOwnership, getMealsByDate);

// GET LAST MEAL TIME
router.get('/last-meal/:id', checkProfileOwnership, getLastMealTime);

// DELETE ITEM (Needs body logic to check ownership first, or trust parent role + log ownership check inside controller)
// Ideally pass profileId for ownership check
router.delete('/item', authorize('parent'), deleteFoodItem);

export default router;
