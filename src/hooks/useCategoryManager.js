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
    DEFAULT_CATEGORY_MAPPINGS,
    DEFAULT_LEGEND_CONFIG 
} from '../constants/defaultCategories';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const LAYER_TITLES = {
    buildings: 'Buildings',
    land_use: 'Land Use',
    paths: 'Pathways',
    parcels: 'Parcels',
    entries: 'Entries & Doors'
};

export const useCategoryManager = () => {
    const [groups, setGroups] = useState(DEFAULT_GROUPS);
    const [categoryMap, setCategoryMap] = useState(DEFAULT_CATEGORY_MAPPINGS);
    const [legendConfig, setLegendConfig] = useState(DEFAULT_LEGEND_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

    // 1. Fetch saved WP options + passively discover new spatial categories
    const loadCategoryData = useCallback(async () => {
        setIsLoading(true);
        try {
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const savedData = settingsRes?.bwb_imaps_options_data || {};
            const savedConfig = savedData.categoryConfig || {};

            let currentGroups = DEFAULT_GROUPS;
            let currentCategoryMap = {};
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

            // Fetch active spatial features
            const spatialRes = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-spatial-data');
            const spatialData = await spatialRes.json();

            // Composite key discovery: "layer_type::category_slug"
            const discoveredCompositeMap = {};
            if (spatialData?.features) {
                spatialData.features.forEach(f => {
                    const cat = f.properties?.category;
                    const layer = f.properties?.layer_type;
                    const color = f.properties?.fill_color;

                    if (cat && layer) {
                        const compositeKey = `${layer}::${cat}`;
                        if (!discoveredCompositeMap[compositeKey]) {
                            discoveredCompositeMap[compositeKey] = {
                                layer_type: layer,
                                category: cat,
                                color: color || null
                            };
                        }
                    }
                });
            }

            let paletteIdx = 0;
            const updatedMap = {};

            // A. Preserve ALL existing saved composite categories from WP options
            Object.keys(currentCategoryMap).forEach(key => {
                const item = currentCategoryMap[key] || {};
                
                let layer = item.layer_type;
                let slug = key;

                if (key.includes('::')) {
                    const parts = key.split('::');
                    layer = parts[0];
                    slug = parts[1];
                }

                const compositeKey = layer ? `${layer}::${slug}` : key;

                updatedMap[compositeKey] = {
                    ...item,
                    layer_type: layer || item.layer_type || 'buildings',
                    label: item.label || slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                };
            });

            // B. ONLY ADD newly discovered composite keys from active spatial data
            Object.keys(discoveredCompositeMap).forEach(compositeKey => {
                const info = discoveredCompositeMap[compositeKey];

                if (!updatedMap[compositeKey]) {
                    const fallbackColor = info.color || CURATED_CATEGORY_PALETTE[paletteIdx % CURATED_CATEGORY_PALETTE.length];
                    const catSlug = info.category;

                    updatedMap[compositeKey] = {
                        label: catSlug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        groupId: '',
                        layer_type: info.layer_type,
                        color: fallbackColor
                    };
                    paletteIdx++;
                }
            });

            const activeCompositeKeys = new Set(Object.keys(updatedMap));

            // Sync Legend Sections and Items (ADDITIVE)
            let sections = Array.isArray(currentLegendConfig.sections) ? [...currentLegendConfig.sections] : [];
            const existingLegendCompositeKeys = new Set();

            sections.forEach(section => {
                (section.items || []).forEach(item => {
                    (item.categories || []).forEach(ck => existingLegendCompositeKeys.add(ck));
                });
            });

            // Auto-assign newly discovered unassigned composite keys into default layer sections
            const unassignedKeys = [...activeCompositeKeys].filter(ck => !existingLegendCompositeKeys.has(ck));

            if (unassignedKeys.length > 0) {
                unassignedKeys.forEach(ck => {
                    const layer = updatedMap[ck]?.layer_type || (ck.includes('::') ? ck.split('::')[0] : 'buildings');
                    const catSlug = ck.includes('::') ? ck.split('::')[1] : ck;

                    let targetSec = sections.find(s => s.layer_type === layer || s.id === `sec_layer_${layer}`);
                    
                    if (!targetSec) {
                        const layerTitle = LAYER_TITLES[layer] || layer.toUpperCase();
                        targetSec = {
                            id: `sec_layer_${layer}`,
                            title: layerTitle,
                            layer_type: layer,
                            items: []
                        };
                        sections.push(targetSec);
                    }

                    targetSec.items.push({
                        id: `leg_${ck}_${Date.now()}`,
                        label: updatedMap[ck]?.label || catSlug,
                        type: 'single',
                        categories: [ck],
                        showInLegend: true
                    });
                });
            }

            currentLegendConfig.sections = sections;

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

    // 2. Persist configuration back to WP options
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

    // 3. Enrich spatial features using composite key matching
    const processSpatialFeatures = useCallback((features = []) => {
        return features.map(feature => {
            const cat = feature.properties?.category;
            const layer = feature.properties?.layer_type || 'buildings';
            const compositeKey = `${layer}::${cat}`;

            const mappedInfo = categoryMap[compositeKey] || categoryMap[cat] || {};
            
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

    // 4. EXPLICIT USER ACTION ONLY: Prunes unused categories from categoryMap and legendConfig
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
                const cleanedMap = (result.categoryMap && typeof result.categoryMap === 'object' && !Array.isArray(result.categoryMap))
                    ? result.categoryMap
                    : {};

                const activeCompositeKeys = new Set(Object.keys(cleanedMap));

                // Clean legend sections directly against pruned active composite keys
                const cleanedSections = (legendConfig.sections || []).map(section => {
                    const validItems = (section.items || []).map(item => {
                        const validCats = (item.categories || []).filter(ck => activeCompositeKeys.has(ck));
                        if (validCats.length === 0) return null;
                        return { ...item, categories: validCats };
                    }).filter(Boolean);

                    return { ...section, items: validItems };
                }).filter(section => section.items.length > 0);

                const newLegendConfig = { ...legendConfig, sections: cleanedSections };

                // Save pruned state explicitly to WP Options
                await saveCategoryData(groups, cleanedMap, newLegendConfig);

                // RE-SYNC STATE FROM DB IMMEDIATELY TO AVOID VISUAL DISCONNECT
                await loadCategoryData();

                createSuccessNotice(result.message || __('Unused categories pruned successfully.', TEXT_DOMAIN), {
                    type: 'snackbar'
                });
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
    }, [groups, legendConfig, saveCategoryData, loadCategoryData, createSuccessNotice, createErrorNotice]);

    return {
        groups,
        setGroups,
        categoryMap,
        setCategoryMap,
        legendConfig,
        setLegendConfig,
        isLoading,
        isSaving,
        loadCategoryData,
        saveCategoryData,
        cleanupUnusedCategories,
        processSpatialFeatures
    };
};