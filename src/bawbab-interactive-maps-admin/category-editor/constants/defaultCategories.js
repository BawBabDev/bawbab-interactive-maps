/**
 * Global Categories & Group Defaults
 * File location: src/constants/defaultCategories.js
 */

export const CURATED_CATEGORY_PALETTE = [
	'#d70f4f',
	'#d776e9',
	'#ed8401',
	'#f6e395',
	'#ede370',
	'#48dad0',
	'#6ab6ea',
	'#0f73d7',
	'#ce6787',
	'#ddebaf',
	'#7c4e1c',
	'#e39cb2',
];

export const DEFAULT_GROUPS = [
	{ id: 'apartments', title: 'Apartments', displayType: 'grouped' },
	{ id: 'cottages', title: 'Cottages', displayType: 'grouped' },
	{ id: 'amenities', title: 'Amenities & Care', displayType: 'flat' },
	{ id: 'infrastructure', title: 'Pathways & Support', displayType: 'flat' },
];

// Clean empty defaults - categories populate dynamically upon GeoJSON import
export const DEFAULT_CATEGORY_MAPPINGS = {};

export const DEFAULT_LEGEND_CONFIG = {
	enabled: true,
	sections: [],
};

export const DEFAULT_CATEGORY_CONFIG = {
	groups: DEFAULT_GROUPS,
	categoryMap: DEFAULT_CATEGORY_MAPPINGS,
	legendConfig: DEFAULT_LEGEND_CONFIG,
};
