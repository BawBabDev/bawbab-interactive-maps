export const FLOOR_AWARE_LAYERS = ['buildings', 'paths'];

export const FLOOR_LAYER_Z_INDEX = { land_use: 40, paths: 60,  buildings: 70, parcels: 80 };

export const FLOOR_OVERLAY_Z_INDEX = 200;
export const ACTIVE_FLOOR_Z_INDEX_BOOST = 300;
export const MIN_MAP_ZOOM = 15;
export const MAX_MAP_TILT = 90;
export const OVERLAY_PAD = 0.05;

export const SPATIAL_DATA_ENDPOINT = '/wp-json/bwb-imaps-federated-api/v1/get-spatial-data';

/**
 * Normalizes properties across map layers and assigns functional metadata flags
 */
export const normalizeSpatialFeature = (feature) => {
    const parsedFloor = Number.parseInt(feature?.properties?.floor, 10);
    const normalizedFloor = Number.isNaN(parsedFloor) ? 0 : parsedFloor;
    const normalizedProperties = { ...feature.properties, floor: normalizedFloor };
    return { 
        ...feature, 
        properties: normalizedProperties, 
        get: (key) => normalizedProperties?.[key] ?? null 
    };
};

/**
 * Default Category Configuration Preset
 * Guarantees zero-config backward compatibility for Foulkeways while allowing
 * custom site administrators to redefine tabs and categories in the WP Admin settings.
 */
export const DEFAULT_CATEGORY_CONFIG = {
    tabs: [
        {
            id: 'apartments',
            title: 'Apartments',
            displayType: 'grouped',
            categories: ['residential_apartment']
        },
        {
            id: 'cottages',
            title: 'Cottages',
            displayType: 'grouped',
            categories: ['cottage']
        },
        {
            id: 'amenities',
            title: 'Amenities',
            displayType: 'flat',
            categories: [
                'amenity',
                'community_center',
                'personal_care',
                'skilled_care',
                'fitness_center',
                'utilities'
            ]
        }
    ],
    categoryColors: {
        residential_apartment: '#1565c0',
        cottage: '#2e7d32',
        community_center: '#007cba',
        personal_care: '#f57c00',
        skilled_care: '#d84315',
        fitness_center: '#00838f',
        amenity: '#8d6e63'
    }
};
