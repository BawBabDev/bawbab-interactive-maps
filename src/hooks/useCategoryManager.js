/**
 * Central Category & Group State Hook
 * File location: src/hooks/useCategoryManager.js
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

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
            // A. Fetch saved WP settings options
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

            // C. Auto-register newly discovered categories using imported colors or palette fallbacks
            let paletteIdx = 0;
            const updatedMap = { ...currentCategoryMap };

            discoveredList.forEach(catSlug => {
                const importedColor = discoveredMap[catSlug];

                if (!updatedMap[catSlug]) {
                    const fallbackColor = importedColor || CURATED_CATEGORY_PALETTE[paletteIdx % CURATED_CATEGORY_PALETTE.length];
                    const defaultGroup = currentGroups[0]?.id || 'amenities';
                    
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
            // Fetch current settings to preserve googleApiKey, googleMapId, etc.
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

            console.log('[useCategoryManager] Sending POST payload to /wp/v2/settings:', updatedOptions);

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
            
            // Preference: Global Category Master Color > Row-level fill_color > Default Blue
            const resolvedColor = mappedInfo.color || feature.properties?.fill_color || '#007cba';

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    fill_color: resolvedColor,
                    group_id: mappedInfo.groupId || 'amenities',
                    category_label: mappedInfo.label || cat
                }
            };
        });
    }, [categoryMap]);

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
        processSpatialFeatures
    };
};