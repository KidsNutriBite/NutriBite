import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { findBestHospitals } from '../services/location.service.js';

// @desc    Find nearby pediatric hospitals (Advanced Search)
// @route   GET /api/hospitals/nearby
// @access  Private (Parent)
export const getNearbyHospitals = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
        res.status(400);
        throw new Error('Latitude and Longitude are required');
    }

    // Default radius 20km if not provided
    const searchRadius = radius ? Number(radius) : 20;

    const hospitals = await findBestHospitals(lat, lng, searchRadius);

    res.status(200).json(new ApiResponse(200, hospitals));
});
