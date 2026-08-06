import { useCallback } from '@wordpress/element';

export const useCoordinateFormatter = () => {
    
    const formatCoords = useCallback((input) => {
        if (!input || !Array.isArray(input) || input.length === 0) return [];

        // Determine nesting level to distinguish between Polygon and MultiPolygon
        // Polygon: [[[lng, lat], ...]] (Level 3)
        // MultiPolygon: [[[[lng, lat], ...]]] (Level 4)
        const isMulti = Array.isArray(input[0]) && Array.isArray(input[0][0]) && Array.isArray(input[0][0][0]);

        if (isMulti) {
            /**
             * Case 1: MultiPolygon
             * Standard GeoJSON: Array of Polygons
             * We return a flattened array of "Polygons", where each Polygon is an array of rings
             */
            return input.map(polygon => {
                return polygon.map(ring => {
                    return ring.map(coord => ({
                        lat: parseFloat(coord[1]),
                        lng: parseFloat(coord[0])
                    })).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
                });
            });
        }

        /**
         * Case 2: Standard Polygon
         * Standard GeoJSON: Array of Rings [[[lng, lat], ...], [[lng, lat], ...]]
         * Ring 0 is the exterior, subsequent rings are holes.
         */
        const isPolygon = Array.isArray(input[0]) && Array.isArray(input[0][0]);
        if (isPolygon) {
            return input.map(ring => {
                return ring.map(coord => ({
                    lat: parseFloat(coord[1]),
                    lng: parseFloat(coord[0])
                })).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
            });
        }

        return [];
    }, []);

    return { formatCoords };
};