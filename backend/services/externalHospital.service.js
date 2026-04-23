import axios from 'axios';

/**
 * Fetch hospitals from Overpass API (OpenStreetMap)
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radius (in meters)
 */
export const fetchHospitalsFromOverpass = async (lat, lng, radius = 50000) => {
    // Overpass QL Query
    // Searching for hospitals, clinics, and pediatric specialties
    const query = `
        [out:json][timeout:45];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          node["healthcare"="clinic"](around:${radius},${lat},${lng});
          node["healthcare:speciality"="pediatrics"](around:${radius},${lat},${lng});
          way["amenity"="hospital"](around:${radius},${lat},${lng});
          way["healthcare"="clinic"](around:${radius},${lat},${lng});
        );
        out center;
    `;

    try {
        console.log(`[Overpass] Fetching for ${lat}, ${lng} radius ${radius}...`);
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(`[Overpass] Response received. Elements: ${response.data?.elements?.length}`);

        if (!response.data || !response.data.elements || response.data.elements.length === 0) {
            console.warn('[Overpass] No elements found in response. Returning MOCK data for demonstration.');
            return getMockHospitals(lat, lng);
        }

        // Transform Overpass data to internal format
        return response.data.elements.map(element => {
            const lat = element.lat || element.center?.lat;
            const lon = element.lon || element.center?.lon;

            if (!lat || !lon) return null;

            return {
                id: element.id,
                name: element.tags?.name || 'Unknown Medical Center',
                lat: lat,
                lng: lon,
                type: element.tags?.healthcare || element.tags?.amenity || 'hospital',
                tags: element.tags || {},
                address: [
                    element.tags?.['addr:housenumber'],
                    element.tags?.['addr:street'],
                    element.tags?.['addr:suburb'] || element.tags?.['addr:district'],
                    element.tags?.['addr:city'],
                    element.tags?.['addr:state'],
                    element.tags?.['addr:postcode']
                ].filter(Boolean).join(', ') || 'Address details not available'
            };
        }).filter(item => item !== null);

    } catch (error) {
        console.error('Overpass API Error:', error.message);
        if (error.response) console.error('Overpass Response Data:', error.response.data);
        console.warn('Falling back to MOCK data due to API failure.');
        return getMockHospitals(lat, lng);
    }
};

const getMockHospitals = (lat, lng) => {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    return [
        {
            id: 'mock-1',
            name: 'Rainbow Children\'s Hospital (Demo)',
            lat: latNum + 0.01,
            lng: lngNum + 0.01,
            type: 'hospital',
            tags: { 'healthcare:speciality': 'pediatrics' },
            address: '123 Health Valley, Near City Center',
            rating: 4.8
        },
        {
            id: 'mock-2',
            name: 'Sunrise Pediatric Clinic (Demo)',
            lat: latNum - 0.005,
            lng: lngNum + 0.005,
            type: 'clinic',
            tags: { 'healthcare:speciality': 'pediatrics' },
            address: '45 Green Park Avenue',
            rating: 4.5
        },
        {
            id: 'mock-3',
            name: 'City General Hospital (Demo)',
            lat: latNum + 0.015,
            lng: lngNum - 0.01,
            type: 'hospital',
            tags: {},
            address: '789 Main Road, Downtown',
            rating: 4.2
        },
        {
            id: 'mock-4',
            name: 'Little Care Polyclinic (Demo)',
            lat: latNum - 0.01,
            lng: lngNum - 0.015,
            type: 'clinic',
            tags: { 'healthcare:speciality': 'pediatrics' },
            address: '12 Sunshine Lane',
            rating: 4.7
        }
    ];
};
