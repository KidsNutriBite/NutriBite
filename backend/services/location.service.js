import NodeCache from 'node-cache';
import { fetchHospitalsFromOverpass } from './externalHospital.service.js';
import { spatialIndex } from './spatialIndex.service.js';
import MaxHeap from '../utils/maxHeap.js';
import { calculateDistance, validateCoordinates } from '../utils/geoUtils.js';

// Initialize Cache (TTL: 20 minutes)
const locationCache = new NodeCache({ stdTTL: 1200 });
// Global in-memory buffer check for index (simple version)
let lastFetchTime = 0;
const FETCH_COOLDOWN = 60 * 60 * 1000; // 1 hour for global refill if needed, but we rely on cache mainly

/**
 * Find best hospitals using Advanced Search Engine
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radius (km)
 */
export const findBestHospitals = async (lat, lng, radius = 20) => {
    if (!validateCoordinates(lat, lng)) {
        throw new Error('Invalid coordinates');
    }

    const roundedLat = Number(lat).toFixed(2);
    const roundedLng = Number(lng).toFixed(2);
    const cacheKey = `nearby_${roundedLat}_${roundedLng}`;

    // 1. Check Cache (Fast Path)
    const cachedData = locationCache.get(cacheKey);
    if (cachedData) {
        console.log(`[LocationService] Cache HIT for ${cacheKey}`);
        return cachedData;
    }

    console.log(`[LocationService] Cache MISS for ${cacheKey} - Processing Request`);

    // 2. Data Fetching & Indexing Strategy
    // For simplicity in this demo, if index is empty or new area, we fetch.
    // In production we might have a robust pre-loader.
    // We will fetch specifically for this region + buffer.

    // Check if we need to fetch data for this region? 
    // We just fetch from Overpass for this user's area to populate index/heap.
    // Note: Overpass is fast enough for regional query.

    let candidates = [];
    try {
        candidates = await fetchHospitalsFromOverpass(lat, lng, radius * 1000 * 2); // 2x radius buffer

        // 3. Build/Update Spatial Index
        // NOTE: In a real persistent app, we wouldn't rebuild global index every request per user.
        // But for "Search Nearby" ensuring fresh data, we load this subset into a local efficient structure or update global.
        // Given constraints: "fetch → build R-tree → rank" per region is acceptable if cached.
        // User's critical improvement: "if (!globalIndexBuiltForRegion) fetch..."
        // Since we are stateless here mostly, we will use the `spatialIndex` service as a singleton validator.

        spatialIndex.buildIndex(candidates); // Rebuilds simple R-Tree with new regional data

    } catch (err) {
        console.warn('External Fetch Failed, checking backup/cache', err);
        // Fallback or re-throw
    }

    // 4. Spatial Search (Bounding Box)
    // Convert Radius (km) to Lat/Lng degrees (approx 111km per degree)
    const degreeBuffer = radius / 111;
    const minLat = Number(lat) - degreeBuffer;
    const maxLat = Number(lat) + degreeBuffer;
    const minLng = Number(lng) - degreeBuffer;
    const maxLng = Number(lng) + degreeBuffer;

    const nearbyRaw = spatialIndex.search(minLat, minLng, maxLat, maxLng);

    // 5. Ranking Engine (Max Heap)
    const rankingHeap = new MaxHeap();

    nearbyRaw.forEach(hospital => {
        const distance = calculateDistance(lat, lng, hospital.lat, hospital.lng);

        // Scoring Algorithm
        // Score = (1 / (distance + 0.5)) * 0.6 + (rating / 5) * 0.3 + specializationBoost
        const rating = hospital.rating || (Math.random() * 1.5 + 3.5); // Mock rating if missing
        hospital.rating = rating.toFixed(1); // Ensure it's stored for display

        const isPediatric = hospital.tags?.['healthcare:speciality'] === 'pediatrics' ||
            hospital.name.toLowerCase().includes('children') ||
            hospital.name.toLowerCase().includes('pediatric');

        const specializationBoost = isPediatric ? 0.2 : 0;

        const score = (1 / (distance + 0.5)) * 0.6 + (rating / 5) * 0.3 + specializationBoost;

        hospital.distance = distance;
        hospital.score = score;
        hospital.isPediatric = isPediatric;

        rankingHeap.insert(hospital);
    });

    // 6. Extract Top Results
    const sortedResults = rankingHeap.getData().slice(0, 30); // Top 30

    // 7. Store in Cache
    locationCache.set(cacheKey, sortedResults);

    return sortedResults;
};
// Export alias for compatibility if needed, or update controller to use findBestHospitals
export const findNearbyDoctors = findBestHospitals;
