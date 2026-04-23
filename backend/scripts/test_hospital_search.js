import axios from 'axios';

const fetchHospitals = async (lat, lng, radius = 50000) => {
    console.log(`Testing Overpass API for Lat: ${lat}, Lng: ${lng}, Radius: ${radius}m`);

    // Identical query to service
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
        const start = Date.now();
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const duration = Date.now() - start;
        console.log(`Response received in ${duration}ms`);
        console.log(`Status: ${response.status}`);

        if (!response.data || !response.data.elements) {
            console.log('No elements structure in response');
            return;
        }

        const count = response.data.elements.length;
        console.log(`Found ${count} elements`);

        if (count > 0) {
            console.log('First 3 results:', response.data.elements.slice(0, 3).map(e => e.tags?.name || 'Unnamed'));
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
};

// Test with Anantapur Coordinates (from user screenshot)
fetchHospitals(14.6819, 77.6006);
