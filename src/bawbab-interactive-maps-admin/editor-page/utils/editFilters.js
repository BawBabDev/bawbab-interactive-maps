/**
 * Utility functions for filtering GIS spatial features based on dynamic custom attributes.
 * File location: src/utils/editFilters.js
 */

/**
 * Discovers boolean and numeric custom attributes across all features for dynamic filter controls.
 * 
 * @param {Array} features List of GeoJSON features
 * @returns {Object} { booleans: Array<string>, numbers: Array<string> }
 */
export const discoverCustomAttributes = (features = []) => {
    const bools = new Set();
    const numbers = new Set();

    features.forEach(f => {
        const attrs = f.properties?.custom_attributes || {};
        Object.keys(attrs).forEach(key => {
            const val = attrs[key];
            if (typeof val === 'boolean' || val === 'true' || val === 'false') {
                bools.add(key);
            } else if (typeof val === 'number' || (typeof val === 'string' && val !== '' && !isNaN(Number(val)) && key !== 'fid' && key !== 'code')) {
                numbers.add(key);
            }
        });
    });

    return {
        booleans: Array.from(bools),
        numbers: Array.from(numbers)
    };
};

/**
 * Filters a single feature against active search, category, and dynamic custom attribute filters.
 * 
 * @param {Object} feature Feature item
 * @param {string} searchQuery Search query string
 * @param {string} filterCategory Category slug
 * @param {Object} dynamicFilters Key-value map of active dynamic filters
 * @returns {boolean} Whether the feature satisfies all filter conditions
 */
export const matchesAllFilters = (feature, searchQuery = '', filterCategory = 'all', dynamicFilters = {}) => {
    const p = feature.properties || {};
    const attrs = p.custom_attributes || {};

    // 1. Text Search Filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const codeMatch = (p.code || '').toLowerCase().includes(query);
        const fidMatch = (p.fid || '').toString().toLowerCase().includes(query);
        if (!nameMatch && !codeMatch && !fidMatch) return false;
    }

    // 2. Category Filter
    if (filterCategory !== 'all' && p.category !== filterCategory) {
        return false;
    }

    // 3. Dynamic Custom Attribute Filters
    for (const key of Object.keys(dynamicFilters)) {
        const filterVal = dynamicFilters[key];
        const rawVal = attrs[key] !== undefined ? attrs[key] : p[key];

        // Boolean Check
        if (typeof filterVal === 'boolean' && filterVal) {
            if (!rawVal || rawVal === 'false' || rawVal === '0') return false;
        } 
        // Numeric Range Check
        else if (typeof filterVal === 'object' && filterVal !== null) {
            const hasMin = filterVal.min !== undefined && filterVal.min !== '';
            const hasMax = filterVal.max !== undefined && filterVal.max !== '';

            // Skip filter evaluation if both min and max inputs are cleared
            if (!hasMin && !hasMax) continue;

            const numVal = Number(rawVal);
            if (rawVal === undefined || rawVal === null || rawVal === '' || isNaN(numVal)) {
                return false;
            }

            if (hasMin && numVal < Number(filterVal.min)) return false;
            if (hasMax && numVal > Number(filterVal.max)) return false;
        }
    }

    return true;
};