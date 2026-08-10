import { useMemo } from '@wordpress/element';

// Curated 12-color palette for category fallbacks
export const CURATED_CATEGORY_PALETTE = [
    '#007cba', '#2e7d32', '#f57c00', '#8d6e63', 
    '#6a1b9a', '#00838f', '#c2185b', '#455a64', 
    '#d84315', '#1565c0', '#283593', '#4e342e'
];

/**
 * Custom hook to resolve dynamic category colors and enhance spatial features.
 * 
 * @param {Array} spatialFeatures Raw imported spatial features
 * @returns {Object} { categoryColorMap, processedSpatialFeatures }
 */
export const useMapCategoryColors = (spatialFeatures = []) => {
    // 1. Build dynamic Category-to-Color palette map
    const categoryColorMap = useMemo(() => {
        const globalSavedColors = window.bwbimapsSettings?.categoryColors || {};
        const computedMap = { ...globalSavedColors };
        let paletteIndex = 0;

        spatialFeatures.forEach(feature => {
            const cat = feature.properties?.category;
            const explicitColor = feature.properties?.fill_color;

            if (cat && !computedMap[cat]) {
                if (explicitColor) {
                    computedMap[cat] = explicitColor;
                } else {
                    computedMap[cat] = CURATED_CATEGORY_PALETTE[paletteIndex % CURATED_CATEGORY_PALETTE.length];
                    paletteIndex++;
                }
            }
        });

        return computedMap;
    }, [spatialFeatures]);

    // 2. Enhance features with resolved fill colors
    const processedSpatialFeatures = useMemo(() => {
        return spatialFeatures.map(feature => {
            const cat = feature.properties?.category;
            const resolvedColor = feature.properties?.fill_color || categoryColorMap[cat] || '#007cba';

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    fill_color: resolvedColor
                }
            };
        });
    }, [spatialFeatures, categoryColorMap]);

    return { categoryColorMap, processedSpatialFeatures };
};