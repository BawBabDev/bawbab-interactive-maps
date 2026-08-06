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
