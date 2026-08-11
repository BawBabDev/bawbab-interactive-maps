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
    DEFAULT_CATEGORY_MAPPINGS,
    DEFAULT_LEGEND_CONFIG 
} from '../constants/defaultCategories';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const useCategoryManager = () => {
    const [groups, setGroups] = useState(DEFAULT_GROUPS);
    const [categoryMap, setCategoryMap] = useState(DEFAULT_CATEGORY_MAPPINGS);
    const [legendConfig, setLegendConfig] = useState(DEFAULT_LEGEND_CONFIG);
    const [discoveredCategories, setDiscoveredCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

    // 1. Fetch saved WP options + discover spatial categories from database
    const loadCategoryData = useCallback(async () => {
        setIsLoading(true);
        try {
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const savedData = settingsRes?.bwb_imaps_options_data || {};
            const savedConfig = savedData.categoryConfig || {};

            let currentGroups = DEFAULT_GROUPS;
            let currentCategoryMap = DEFAULT_CATEGORY_MAPPINGS;
            let currentLegendConfig = DEFAULT_LEGEND_CONFIG;

            if (savedConfig.groups && Array.isArray(savedConfig.groups) && savedConfig.groups.length > 0) {
                currentGroups = savedConfig.groups;
            }
            if (savedConfig.categoryMap && typeof savedConfig.categoryMap === 'object') {
                currentCategoryMap = savedConfig.categoryMap;
            }
            if (savedConfig.legendConfig && typeof savedConfig.legendConfig === 'object') {
                currentLegendConfig = {
                    ...DEFAULT_LEGEND_CONFIG,
                    ...savedConfig.legendConfig
                };
            }

            // Fetch spatial data to discover active category slugs
            const spatialRes = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-spatial-data');
            const spatialData = await spatialRes.json();

            const discoveredMap = {};
            if (spatialData?.features) {
                spatialData.features.forEach(f => {
                    const cat = f.properties?.category;
                    const color = f.properties?.fill_color;
                    if (cat && !discoveredMap[cat]) {
                        discoveredMap[cat] = color || null;
                    }
                });
            }

            const discoveredList = Object.keys(discoveredMap);
            setDiscoveredCategories(discoveredList);

            let paletteIdx = 0;
            const updatedMap = { ...currentCategoryMap };

            discoveredList.forEach(catSlug => {
                const importedColor = discoveredMap[catSlug];

                if (!updatedMap[catSlug]) {
                    const fallbackColor = importedColor || CURATED_CATEGORY_PALETTE[paletteIdx % CURATED_CATEGORY_PALETTE.length];
                    const lowerSlug = catSlug.toLowerCase();

                    let defaultGroup = '';
                    for (const group of currentGroups) {
                        const gId = (group.id || '').toLowerCase();
                        const gTitle = (group.title || '').toLowerCase();

                        if (gTitle && (lowerSlug.includes(gTitle) || gTitle.includes(lowerSlug))) {
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

            // Set of all active/valid category slugs currently in categoryMap
            const activeCategorySlugs = new Set(Object.keys(updatedMap));

            let rawLegendItems = Array.isArray(currentLegendConfig.items) ? [...currentLegendConfig.items] : [];

            // A. PURGE: Remove items referencing categories that no longer exist in categoryMap
            let cleanedLegendItems = [];

            rawLegendItems.forEach(item => {
                const validCategories = (item.categories || []).filter(slug => activeCategorySlugs.has(slug));

                if (validCategories.length === 0) {
                    // Category was purged -> drop this legend item completely
                    return;
                }

                if (item.type === 'merged' && validCategories.length === 1) {
                    // Merged item reduced to 1 category -> convert back to 'single'
                    const singleSlug = validCategories[0];
                    cleanedLegendItems.push({
                        ...item,
                        type: 'single',
                        categories: [singleSlug],
                        label: item.label || updatedMap[singleSlug]?.label || singleSlug
                    });
                } else {
                    // Keep valid item
                    cleanedLegendItems.push({
                        ...item,
                        categories: validCategories
                    });
                }
            });

            // B. SYNC: Ensure every active category in categoryMap exists in legendConfig
            const existingLegendCatSlugs = new Set(cleanedLegendItems.flatMap(i => i.categories || []));

            activeCategorySlugs.forEach(slug => {
                if (!existingLegendCatSlugs.has(slug)) {
                    cleanedLegendItems.push({
                        id: `leg_${slug}_${Date.now()}`,
                        label: updatedMap[slug]?.label || slug,
                        type: 'single',
                        categories: [slug],
                        showInLegend: true
                    });
                }
            });

            currentLegendConfig.items = cleanedLegendItems;

            setGroups(currentGroups);
            setCategoryMap(updatedMap);
            setLegendConfig(currentLegendConfig);
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
    const saveCategoryData = async (newGroups, newCategoryMap, newLegendConfig) => {
        setIsSaving(true);
        const payloadGroups = newGroups || groups;
        const payloadMap = newCategoryMap || categoryMap;
        const payloadLegend = newLegendConfig || legendConfig;

        try {
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const currentOptions = settingsRes?.bwb_imaps_options_data || {};

            const categoryConfig = {
                groups: payloadGroups,
                categoryMap: payloadMap,
                legendConfig: payloadLegend
            };

            const updatedOptions = {
                ...currentOptions,
                categoryConfig
            };

            await apiFetch({
                path: '/wp/v2/settings',
                method: 'POST',
                data: { bwb_imaps_options_data: updatedOptions }
            });

            if (!window.bwbimapsSettings) window.bwbimapsSettings = {};
            window.bwbimapsSettings.categoryConfig = categoryConfig;

            setGroups(payloadGroups);
            setCategoryMap(payloadMap);
            setLegendConfig(payloadLegend);

            createSuccessNotice(__('Category & Navigation settings saved successfully!', TEXT_DOMAIN), {
                type: 'snackbar'
            });
            return true;
        } catch (err) {
            console.error('[useCategoryManager] REST Save Error:', err);
            createErrorNotice(__('Error saving settings: ', TEXT_DOMAIN) + err.message);
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
                : ((globalColor && globalColor.trim() !== '') ? globalColor : '#007cba');

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

    // 4. Explicit User Action: Cleanup unused categories
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
                const safeMap = (result.categoryMap && !Array.isArray(result.categoryMap) && typeof result.categoryMap === 'object') 
                    ? result.categoryMap 
                    : {};

                setCategoryMap(safeMap);
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
        legendConfig,
        setLegendConfig,
        discoveredCategories,
        isLoading,
        isSaving,
        loadCategoryData,
        saveCategoryData,
        cleanupUnusedCategories,
        processSpatialFeatures
    };
};