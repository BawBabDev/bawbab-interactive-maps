/**
 * Central Category & Group State Hook
 * File location: src/hooks/useCategoryManager.js
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

import {
    CURATED_CATEGORY_PALETTE,
    DEFAULT_GROUPS,
    DEFAULT_CATEGORY_MAPPINGS,
    DEFAULT_LEGEND_CONFIG,
} from '../constants/defaultCategories';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const ENDPOINT_GET_SETTINGS = '/wp-json/bwb-imaps-federated-api/v1/get-map-settings';
const ENDPOINT_UPDATE_SETTINGS = '/wp-json/bwb-imaps-federated-api/v1/update-map-settings';

const LAYER_TITLES = {
    buildings: 'Buildings',
    land_use: 'Land Use',
    paths: 'Pathways',
    parcels: 'Parcels',
    entries: 'Entries & Doors',
};

const autoMatchCategoryToGroup = ( catSlug, groups = [] ) => {
    if ( ! catSlug || ! groups.length ) return '';

    const cleanSlug = catSlug.toLowerCase().replace( /[-_]/g, ' ' );

    for ( const group of groups ) {
        const gId = ( group.id || '' ).toLowerCase();
        const gTitle = ( group.title || '' ).toLowerCase();

        if (
            gTitle &&
            ( cleanSlug.includes( gTitle ) || gTitle.includes( cleanSlug ) )
        ) {
            return group.id;
        }

        if (
            /(apt|apartment|residential|flat|housing|unit)/i.test( cleanSlug ) &&
            /(apt|apartment|residential|housing)/i.test( `${ gTitle } ${ gId }` )
        ) {
            return group.id;
        }
        if (
            /(cottage|house|villa|home)/i.test( cleanSlug ) &&
            /(cottage|house|villa|home)/i.test( `${ gTitle } ${ gId }` )
        ) {
            return group.id;
        }
        if (
            /(amenity|care|center|club|pool|park|gym|playground)/i.test( cleanSlug ) &&
            /(amenit|care|center|facility)/i.test( `${ gTitle } ${ gId }` )
        ) {
            return group.id;
        }
        if (
            /(path|road|trail|patio|drive|support|infra|utility)/i.test( cleanSlug ) &&
            /(path|road|trail|support|infra|util)/i.test( `${ gTitle } ${ gId }` )
        ) {
            return group.id;
        }
    }

    return '';
};

export const useCategoryManager = () => {
    const [ groups, setGroups ] = useState( DEFAULT_GROUPS );
    const [ categoryMap, setCategoryMap ] = useState( DEFAULT_CATEGORY_MAPPINGS );
    const [ legendConfig, setLegendConfig ] = useState( DEFAULT_LEGEND_CONFIG );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ isSaving, setIsSaving ] = useState( false );

    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

    // 1. Fetch saved settings from /get-map-settings REST route
    const loadCategoryData = useCallback( async () => {
        setIsLoading( true );
        try {
            const settingsRes = await fetch( ENDPOINT_GET_SETTINGS );
            const savedData = settingsRes.ok ? await settingsRes.json() : {};
            const savedConfig = savedData.categoryConfig || {};

            let currentGroups = DEFAULT_GROUPS;
            let currentCategoryMap = {};
            let currentLegendConfig = DEFAULT_LEGEND_CONFIG;

            if (
                savedConfig.groups &&
                Array.isArray( savedConfig.groups ) &&
                savedConfig.groups.length > 0
            ) {
                currentGroups = savedConfig.groups;
            }
            if (
                savedConfig.categoryMap &&
                typeof savedConfig.categoryMap === 'object'
            ) {
                currentCategoryMap = savedConfig.categoryMap;
            }
            if (
                savedConfig.legendConfig &&
                typeof savedConfig.legendConfig === 'object'
            ) {
                currentLegendConfig = {
                    ...DEFAULT_LEGEND_CONFIG,
                    ...savedConfig.legendConfig,
                };
            }

            // Fetch active spatial features
            const spatialRes = await fetch(
                '/wp-json/bwb-imaps-federated-api/v1/get-spatial-data'
            );
            const spatialData = await spatialRes.json();

            // Discover active composite keys from DB: "layer_type::category_slug"
            const discoveredCompositeMap = {};
            if ( spatialData?.features ) {
                spatialData.features.forEach( ( f ) => {
                    const cat = f.properties?.category;
                    const layer = f.properties?.layer_type;
                    const color = f.properties?.fill_color;

                    if ( cat && layer ) {
                        const compositeKey = `${ layer }::${ cat }`;
                        if ( ! discoveredCompositeMap[ compositeKey ] ) {
                            discoveredCompositeMap[ compositeKey ] = {
                                layer_type: layer,
                                category: cat,
                                color: color || null,
                            };
                        }
                    }
                } );
            }

            let paletteIdx = 0;
            const updatedMap = {};

            // Preserve ALL existing saved composite categories
            Object.keys( currentCategoryMap ).forEach( ( key ) => {
                const item = currentCategoryMap[ key ] || {};

                if ( key.includes( '::' ) ) {
                    const parts = key.split( '::' );
                    updatedMap[ key ] = {
                        ...item,
                        layer_type: item.layer_type || parts[ 0 ],
                        label:
                            item.label ||
                            parts[ 1 ]
                                .split( '_' )
                                .map(
                                    ( w ) =>
                                        w.charAt( 0 ).toUpperCase() +
                                        w.slice( 1 )
                                )
                                .join( ' ' ),
                    };
                } else if ( item.layer_type ) {
                    const compositeKey = `${ item.layer_type }::${ key }`;
                    updatedMap[ compositeKey ] = {
                        ...item,
                        label:
                            item.label ||
                            key
                                .split( '_' )
                                .map(
                                    ( w ) =>
                                        w.charAt( 0 ).toUpperCase() +
                                        w.slice( 1 )
                                )
                                .join( ' ' ),
                    };
                }
            } );

            // Add ONLY newly discovered spatial keys that are completely unknown
            Object.keys( discoveredCompositeMap ).forEach( ( compositeKey ) => {
                const info = discoveredCompositeMap[ compositeKey ];

                if ( ! updatedMap[ compositeKey ] ) {
                    const fallbackColor =
                        info.color ||
                        CURATED_CATEGORY_PALETTE[
                            paletteIdx % CURATED_CATEGORY_PALETTE.length
                        ];
                    const catSlug = info.category;

                    const matchedGroupId = autoMatchCategoryToGroup(
                        catSlug,
                        currentGroups
                    );

                    updatedMap[ compositeKey ] = {
                        label: catSlug
                            .split( '_' )
                            .map(
                                ( w ) =>
                                    w.charAt( 0 ).toUpperCase() + w.slice( 1 )
                            )
                            .join( ' ' ),
                        groupId: matchedGroupId,
                        layer_type: info.layer_type,
                        color: fallbackColor,
                    };
                    paletteIdx++;
                }
            } );

            // IMPORTANT FIX: Preserve exact saved legend sections without auto-injecting deleted items!
            setGroups( currentGroups );
            setCategoryMap( updatedMap );
            setLegendConfig( currentLegendConfig );
        } catch ( err ) {
            console.error( 'Error loading category data:', err );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    useEffect( () => {
        loadCategoryData();
    }, [ loadCategoryData ] );

    // 2. Persist configuration via /update-map-settings REST API
    const saveCategoryData = async (
        newGroups,
        newCategoryMap,
        newLegendConfig
    ) => {
        setIsSaving( true );
        const payloadGroups = newGroups || groups;
        const payloadMap = newCategoryMap || categoryMap;
        const payloadLegend = newLegendConfig || legendConfig;

        try {
            const categoryConfig = {
                groups: payloadGroups,
                categoryMap: payloadMap,
                legendConfig: payloadLegend,
            };

            const nonce = window.wpApiSettings?.nonce || '';
            const response = await fetch( ENDPOINT_UPDATE_SETTINGS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                },
                body: JSON.stringify( {
                    categoryConfig,
                } ),
            } );

            if ( ! response.ok ) {
                const errData = await response.json();
                throw new Error( errData.message || 'Failed to update category data.' );
            }

            if ( ! window.bwbimapsSettings ) window.bwbimapsSettings = {};
            window.bwbimapsSettings.categoryConfig = categoryConfig;

            setGroups( payloadGroups );
            setCategoryMap( payloadMap );
            setLegendConfig( payloadLegend );

            createSuccessNotice(
                __(
                    'Category & Navigation settings saved successfully!',
                    TEXT_DOMAIN
                ),
                { type: 'snackbar' }
            );
            return true;
        } catch ( err ) {
            console.error( '[useCategoryManager] REST Save Error:', err );
            createErrorNotice(
                __( 'Error saving settings: ', TEXT_DOMAIN ) + err.message
            );
            return false;
        } finally {
            setIsSaving( false );
        }
    };

    // 3. Enrich spatial features using composite key matching
    const processSpatialFeatures = useCallback(
        ( features = [] ) => {
            return features.map( ( feature ) => {
                const cat = feature.properties?.category;
                const layer = feature.properties?.layer_type || 'buildings';
                const compositeKey = `${ layer }::${ cat }`;

                const mappedInfo =
                    categoryMap[ compositeKey ] || categoryMap[ cat ] || {};

                const rowColor = feature.properties?.fill_color;
                const useCustomColor = Boolean(
                    feature.properties?.use_custom_color
                );
                const globalColor = mappedInfo.color;

                const resolvedColor =
                    useCustomColor &&
                    rowColor &&
                    typeof rowColor === 'string' &&
                    rowColor.trim() !== ''
                        ? rowColor.trim()
                        : globalColor && globalColor.trim() !== ''
                        ? globalColor.trim()
                        : '#007cba';

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        fill_color: resolvedColor,
                        group_id:
                            mappedInfo.groupId !== undefined
                                ? mappedInfo.groupId
                                : '',
                        category_label: mappedInfo.label || cat,
                    },
                };
            } );
        },
        [ categoryMap ]
    );

    // 4. Prune unused categories
    const cleanupUnusedCategories = useCallback( async () => {
        setIsSaving( true );
        try {
            const response = await fetch(
                '/wp-json/bwb-imaps-federated-api/v1/cleanup-category-schema',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.wpApiSettings?.nonce || '',
                    },
                }
            );

            const result = await response.json();

            if ( response.ok && result.success ) {
                const cleanedMap =
                    result.categoryMap &&
                    typeof result.categoryMap === 'object' &&
                    ! Array.isArray( result.categoryMap )
                        ? result.categoryMap
                        : {};

                const activeCompositeKeys = new Set(
                    Object.keys( cleanedMap )
                );

                let cleanedSections = [];

                if ( activeCompositeKeys.size > 0 ) {
                    cleanedSections = ( legendConfig.sections || [] )
                        .map( ( section ) => {
                            const validItems = ( section.items || [] )
                                .map( ( item ) => {
                                    const validCats = (
                                        item.categories || []
                                    ).filter( ( ck ) =>
                                        activeCompositeKeys.has( ck )
                                    );

                                    if ( validCats.length === 0 ) return null;
                                    return { ...item, categories: validCats };
                                } )
                                .filter( Boolean );

                            return { ...section, items: validItems };
                        } );
                }

                const newLegendConfig = {
                    ...legendConfig,
                    sections: cleanedSections,
                };

                const success = await saveCategoryData(
                    groups,
                    cleanedMap,
                    newLegendConfig
                );

                if ( success ) {
                    setCategoryMap( cleanedMap );
                    setLegendConfig( newLegendConfig );
                }

                createSuccessNotice(
                    result.message ||
                        __(
                            'Unused categories and stale legend items pruned successfully.',
                            TEXT_DOMAIN
                        ),
                    { type: 'snackbar' }
                );
                return true;
            } else {
                createErrorNotice(
                    result.message ||
                        __( 'Category cleanup failed.', TEXT_DOMAIN )
                );
                return false;
            }
        } catch ( err ) {
            console.error( '[useCategoryManager] Cleanup Error:', err );
            createErrorNotice(
                __( 'Error during category cleanup: ', TEXT_DOMAIN ) +
                    err.message
            );
            return false;
        } finally {
            setIsSaving( false );
        }
    }, [
        groups,
        legendConfig,
        saveCategoryData,
        createSuccessNotice,
        createErrorNotice,
    ] );

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
        processSpatialFeatures,
    };
};