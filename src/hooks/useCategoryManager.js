/**
 * Central Category & Group State Hook
 * File location: src/hooks/useCategoryManager.js
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';

import { 
    CURATED_CATEGORY_PALETTE, 
    DEFAULT_GROUPS, 
    DEFAULT_CATEGORY_MAPPINGS 
} from '../constants/defaultCategories';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const useCategoryManager = () => {
    const [groups, setGroups] = useState(DEFAULT_GROUPS);
    const [categoryMap, setCategoryMap] = useState(DEFAULT_CATEGORY_MAPPINGS);
    const [discoveredCategories, setDiscoveredCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

    // 1. Fetch saved WP options + discover spatial categories from database
    const loadCategoryData = useCallback(async () => {
        setIsLoading(true);
        try {
            // A. Fetch saved WP settings options (Primary Source of Truth for Categories)
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const savedData = settingsRes?.bwb_imaps_options_data || {};
            const savedConfig = savedData.categoryConfig;

            let currentGroups = DEFAULT_GROUPS;
            let currentCategoryMap = DEFAULT_CATEGORY_MAPPINGS;

            if (savedConfig) {
                if (Array.isArray(savedConfig.groups) && savedConfig.groups.length > 0) {
                    currentGroups = savedConfig.groups;
                }
                if (savedConfig.categoryMap && typeof savedConfig.categoryMap === 'object') {
                    currentCategoryMap = savedConfig.categoryMap;
                }
            }

            // B. Fetch spatial data to discover active category slugs and initial row colors
            const spatialRes = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-spatial-data');
            const spatialData = await spatialRes.json();

            const discoveredMap = {};
            if (spatialData?.features) {
                spatialData.features.forEach(f => {
                    const cat = f.properties?.category;
                    const color = f.properties?.fill_color;
                    if (cat) {
                        if (!discoveredMap[cat]) {
                            discoveredMap[cat] = color || null;
                        }
                    }
                });
            }

            const discoveredList = Object.keys(discoveredMap);
            setDiscoveredCategories(discoveredList);

            // C. Auto-register newly discovered categories with palette fallbacks
            let paletteIdx = 0;
            const updatedMap = { ...currentCategoryMap };

            discoveredList.forEach(catSlug => {
                const importedColor = discoveredMap[catSlug];

                if (!updatedMap[catSlug]) {
                    const fallbackColor = importedColor || CURATED_CATEGORY_PALETTE[paletteIdx % CURATED_CATEGORY_PALETTE.length];
                    const lowerSlug = catSlug.toLowerCase();

                    // Dynamic matching against active groups
                    let defaultGroup = '';

                    for (const group of currentGroups) {
                        const gId = (group.id || '').toLowerCase();
                        const gTitle = (group.title || '').toLowerCase();

                        // Title substring match (e.g. "utilities" vs "Utility")
                        if (gTitle && (lowerSlug.includes(gTitle) || gTitle.includes(lowerSlug))) {
                            defaultGroup = group.id;
                            break;
                        }

                        // Keyword semantic checks against group title/id
                        if (/(apt|apartment|residential|building)/i.test(lowerSlug) && /(apt|apartment|residential|building)/i.test(gTitle + ' ' + gId)) {
                            defaultGroup = group.id;
                            break;
                        }
                        if (/(cottage|house|villa)/i.test(lowerSlug) && /(cottage|house|villa)/i.test(gTitle + ' ' + gId)) {
                            defaultGroup = group.id;
                            break;
                        }
                        if (/(util|utility|service|maintenance)/i.test(lowerSlug) && /(util|utility|service|maintenance)/i.test(gTitle + ' ' + gId)) {
                            defaultGroup = group.id;
                            break;
                        }
                        if (/(path|road|trail|patio|garage|carport|drive|support|infrastructure)/i.test(lowerSlug) && /(path|road|trail|patio|garage|carport|drive|support|infrastructure)/i.test(gTitle + ' ' + gId)) {
                            defaultGroup = group.id;
                            break;
                        }
                    }

                    updatedMap[catSlug] = {
                        label: catSlug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        groupId: defaultGroup,
                        color: fallbackColor
                    };
                    paletteIdx++;
                }
            });

            setGroups(currentGroups);
            setCategoryMap(updatedMap);
        } catch (err) {
            console.error('Error loading category data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategoryData();
    }, [loadCategoryData]);

    // 2. Persist updated configuration back to WP options
    const saveCategoryData = async (newGroups, newCategoryMap) => {
        setIsSaving(true);
        const payloadGroups = newGroups || groups;
        const payloadMap = newCategoryMap || categoryMap;

        try {
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const currentOptions = settingsRes?.bwb_imaps_options_data || {};

            const categoryConfig = {
                groups: payloadGroups,
                categoryMap: payloadMap
            };

            const updatedOptions = {
                ...currentOptions,
                categoryConfig
            };

            await apiFetch({
                path: '/wp/v2/settings',
                method: 'POST',
                data: {
                    bwb_imaps_options_data: updatedOptions
                }
            });

            if (!window.bwbimapsSettings) window.bwbimapsSettings = {};
            window.bwbimapsSettings.categoryConfig = categoryConfig;

            setGroups(payloadGroups);
            setCategoryMap(payloadMap);

            createSuccessNotice(__('Category & Navigation settings saved successfully!', TEXT_DOMAIN), {
                type: 'snackbar'
            });
            return true;
        } catch (err) {
            console.error('[useCategoryManager] REST Save Error:', err);
            createErrorNotice(__('Error saving category settings: ', TEXT_DOMAIN) + err.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Helper: Enrich features with resolved colors and group assignments for rendering
    const processSpatialFeatures = useCallback((features = []) => {
        return features.map(feature => {
            const cat = feature.properties?.category;
            const mappedInfo = categoryMap[cat] || {};
            
            const rowColor = feature.properties?.fill_color;
            const globalColor = mappedInfo.color;

            const resolvedColor = (rowColor && rowColor.trim() !== '') 
                ? rowColor 
                : (globalColor || '#007cba');

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    fill_color: resolvedColor,
                    group_id: mappedInfo.groupId !== undefined ? mappedInfo.groupId : '',
                    category_label: mappedInfo.label || cat
                }
            };
        });
    }, [categoryMap]);

    // 4. Explicit User Action: Cleanup categories from option data that are not assigned in MySQL
    const cleanupUnusedCategories = useCallback(async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/cleanup-category-schema', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || '' 
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Ensure result.categoryMap is treated as an Object, not an Array
                const safeMap = (result.categoryMap && !Array.isArray(result.categoryMap) && typeof result.categoryMap === 'object') 
                    ? result.categoryMap 
                    : {};

                setCategoryMap(safeMap);

                if (!window.bwbimapsSettings) window.bwbimapsSettings = {};
                if (!window.bwbimapsSettings.categoryConfig) window.bwbimapsSettings.categoryConfig = {};
                window.bwbimapsSettings.categoryConfig.categoryMap = safeMap;

                createSuccessNotice(
                    sprintf(__('Cleanup complete: %d unused categories removed.', TEXT_DOMAIN), result.pruned_count || 0),
                    { type: 'snackbar' }
                );
                
                await loadCategoryData();
                return true;
            } else {
                createErrorNotice(result.message || __('Category cleanup failed.', TEXT_DOMAIN));
                return false;
            }
        } catch (err) {
            console.error('[useCategoryManager] Cleanup Error:', err);
            createErrorNotice(__('Error during category cleanup: ', TEXT_DOMAIN) + err.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [loadCategoryData, createSuccessNotice, createErrorNotice]);

    return {
        groups,
        setGroups,
        categoryMap,
        setCategoryMap,
        discoveredCategories,
        isLoading,
        isSaving,
        loadCategoryData,
        saveCategoryData,
        cleanupUnusedCategories,
        processSpatialFeatures
    };
};