/**
 * Global Categories & Group Defaults
 * File location: src/constants/defaultCategories.js
 */

export const CURATED_CATEGORY_PALETTE = [
    '#d70f4f', '#d776e9', '#ed8401', '#f6e395', 
    '#ede370', '#48dad0', '#6ab6ea', '#0f73d7', 
    '#ce6787', '#ddebaf', '#7c4e1c', '#e39cb2'
];

export const DEFAULT_GROUPS = [
    { id: 'apartments', title: 'Apartments', displayType: 'grouped' },
    { id: 'cottages', title: 'Cottages', displayType: 'grouped' },
    { id: 'amenities', title: 'Amenities & Care', displayType: 'flat' },
    { id: 'infrastructure', title: 'Pathways & Support', displayType: 'flat' }
];

export const DEFAULT_CATEGORY_MAPPINGS = {
    residential_apartment: { label: 'Residential Apartments', groupId: 'apartments', color: '#d70f4f' },
    cottage: { label: 'Cottages', groupId: 'cottages', color: '#d776e9' },
    community_center: { label: 'Community Center', groupId: 'amenities', color: '#ed8401' },
    personal_care: { label: 'Personal Care', groupId: 'amenities', color: '#f6e395' },
    skilled_care: { label: 'Skilled Care', groupId: 'amenities', color: '#ede770' },
    amenity: { label: 'Amenities', groupId: 'amenities', color: '#48dad0' },
    fitness_center: { label: 'Fitness Center', groupId: 'amenities', color: '#6ab6ea' },
    utilities: { label: 'Utilities', groupId: 'amenities', color: '#0f73d7' },
    support_structures: { label: 'Carport / Garage / Support', groupId: 'infrastructure', color: '#ce6787' },
    pathways: { label: 'Pathways / Patios', groupId: 'infrastructure', color: '#ddebaf' },
    trail: { label: 'Trail', groupId: 'infrastructure', color: '#7c4e1c' },
    covered_pathways: { 
        label: 'Indoor / Covered Pathways', 
        groupId: 'infrastructure', 
        color: '#e39cb2',
        colors: ['#e39cb2', '#feba67', '#ede79f']
    }
};

// ADD THIS EXPORT:
export const DEFAULT_LEGEND_CONFIG = {
    enabled: true,
    groupByLayer: false,
    items: []
};

export const DEFAULT_CATEGORY_CONFIG = {
    groups: DEFAULT_GROUPS,
    categoryMap: DEFAULT_CATEGORY_MAPPINGS,
    legendConfig: DEFAULT_LEGEND_CONFIG
};