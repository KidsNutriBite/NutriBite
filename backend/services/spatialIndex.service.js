import RBush from 'rbush';

class SpatialIndexService {
    constructor() {
        this.tree = new RBush();
        this.isBuilt = false;
    }

    /**
     * Clear and rebuild the spatial index
     * @param {Array} items - Array of hospital objects
     */
    buildIndex(items) {
        this.tree.clear();

        const bulkItems = items.map(item => ({
            minX: parseFloat(item.lng),
            minY: parseFloat(item.lat),
            maxX: parseFloat(item.lng),
            maxY: parseFloat(item.lat),
            item: item
        }));

        this.tree.load(bulkItems);
        this.isBuilt = true;
        console.log(`[SpatialIndex] Built with ${items.length} items`);
    }

    /**
     * Search within a bounding box
     * @param {number} minLat 
     * @param {number} minLng 
     * @param {number} maxLat 
     * @param {number} maxLng 
     * @returns {Array} List of hospital objects
     */
    search(minLat, minLng, maxLat, maxLng) {
        if (!this.isBuilt) return [];

        const results = this.tree.search({
            minX: minLng,
            minY: minLat,
            maxX: maxLng,
            maxY: maxLat
        });

        return results.map(r => r.item);
    }
}

// Singleton instance
export const spatialIndex = new SpatialIndexService();
