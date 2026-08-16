import { useState, useEffect } from '@wordpress/element';

const DEFAULT_TYPOGRAPHY = {
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',

    // --- LEGEND DEFAULTS ---
    legendHeaderFontSize: 13,
    legendSectionFontSize: 10,
    legendItemFontSize: 11,
    legendHeaderFontWeight: '800',
    legendSectionFontWeight: '800',
    legendItemFontWeight: '600',
    legendHeaderFontStyle: 'normal',
    legendSectionFontStyle: 'normal',
    legendItemFontStyle: 'normal',
    legendHeaderDecoration: 'none',
    legendSectionDecoration: 'none',
    legendItemDecoration: 'none',

    // --- DRAWER CATEGORY LABEL ---
    drawerCategoryFontSize: 11,
    drawerCategoryFontWeight: '700',
    drawerCategoryFontStyle: 'normal',
    drawerCategoryDecoration: 'none',

    // --- DRAWER MAIN TITLE ---
    drawerTitleFontSize: 28,
    drawerTitleFontWeight: '800',
    drawerTitleFontStyle: 'normal',
    drawerTitleDecoration: 'none',

    // --- DRAWER SUBTITLE ---
    drawerSubtitleFontSize: 16,
    drawerSubtitleFontWeight: '600',
    drawerSubtitleFontStyle: 'normal',
    drawerSubtitleDecoration: 'none',

    // --- DRAWER HEADINGS (H1 - H3) ---
    drawerHeadingFontSize: 20,
    drawerHeadingFontWeight: '700',
    drawerHeadingFontStyle: 'normal',
    drawerHeadingDecoration: 'none',

    // --- DRAWER BODY / PARAGRAPHS / BULLETS ---
    drawerBodyFontSize: 14,
    drawerBodyFontWeight: '400',
    drawerBodyFontStyle: 'normal',
    drawerBodyDecoration: 'none',

    // --- DRAWER QUOTES & CITATIONS ---
    drawerQuoteFontSize: 14,
    drawerQuoteFontWeight: '400',
    drawerQuoteFontStyle: 'italic',
    drawerQuoteDecoration: 'none',

    // --- DRAWER UNIT SPECS ---
    drawerSpecsNumberFontSize: 14,
    drawerSpecsNumberFontWeight: '800',
    drawerSpecsNumberFontStyle: 'normal',
    drawerSpecsNumberDecoration: 'none',

    drawerSpecsLabelFontSize: 9,
    drawerSpecsLabelFontWeight: '700',
    drawerSpecsLabelFontStyle: 'normal',
    drawerSpecsLabelDecoration: 'none',

    // --- MAP CONTROLS DEFAULTS ---
    controlsHeaderFontSize: 12,
    controlsHeaderFontWeight: '800',
    controlsHeaderFontStyle: 'normal',
    controlsHeaderDecoration: 'none',

    controlsItemFontSize: 11,
    controlsItemFontWeight: '600',
    controlsItemFontStyle: 'normal',
    controlsItemDecoration: 'none',

    controlsFloorFontSize: 11,
    controlsFloorFontWeight: '800',
    controlsFloorFontStyle: 'normal',
    controlsFloorDecoration: 'none',

    // --- SEARCH BAR & SEARCH LIST DEFAULTS ---
    searchInputFontSize: 13,
    searchInputFontWeight: '400',
    searchInputFontStyle: 'normal',
    searchInputDecoration: 'none',

    searchTabFontSize: 14,
    searchTabFontWeight: '600',
    searchTabFontStyle: 'normal',
    searchTabDecoration: 'none',

    searchGroupHeaderFontSize: 13,
    searchGroupHeaderFontWeight: '600',
    searchGroupHeaderFontStyle: 'normal',
    searchGroupHeaderDecoration: 'none',

    searchItemFontSize: 12,
    searchItemFontWeight: '400',
    searchItemFontStyle: 'normal',
    searchItemDecoration: 'none',

    searchResultTitleFontSize: 12,
    searchResultTitleFontWeight: '600',
    searchResultTitleFontStyle: 'normal',
    searchResultTitleDecoration: 'none',

    searchResultCatFontSize: 9,
    searchResultCatFontWeight: '700',
    searchResultCatFontStyle: 'normal',
    searchResultCatDecoration: 'none',
};

export const useTypographySettings = ( initialSettings = {} ) => {
    const [ settings, setSettings ] = useState( () => ( {
        ...DEFAULT_TYPOGRAPHY,
        ...initialSettings,
    } ) );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ isSaving, setIsSaving ] = useState( false );

    // Keep state synchronized whenever initialSettings prop changes
    useEffect( () => {
        if ( Object.keys( initialSettings ).length > 0 ) {
            setSettings( ( prev ) => ( {
                ...prev,
                ...initialSettings,
            } ) );
        }
    }, [ JSON.stringify( initialSettings ) ] );

    // Fetch typography settings from GET route if no initialSettings are provided
    useEffect( () => {
        const fetchSettings = async () => {
            setIsLoading( true );
            try {
                const response = await fetch(
                    '/wp-json/bwb-imaps-federated-api/v1/get-map-settings'
                );
                if ( response.ok ) {
                    const data = await response.json();
                    const fetchedTypography =
                        data?.categoryConfig?.legendConfig?.typography ||
                        data?.typography;
                    if ( fetchedTypography ) {
                        setSettings( ( prev ) => ( {
                            ...prev,
                            ...fetchedTypography,
                        } ) );
                    }
                }
            } catch ( err ) {
                console.warn(
                    '⚠️ [useTypographySettings] Failed to fetch settings:',
                    err
                );
            } finally {
                setIsLoading( false );
            }
        };

        if ( Object.keys( initialSettings ).length === 0 ) {
            fetchSettings();
        }
    }, [] );

    const updateTypography = ( keyOrObject, value ) => {
        setSettings( ( prev ) => {
            if ( typeof keyOrObject === 'object' ) {
                return { ...prev, ...keyOrObject };
            }
            return { ...prev, [ keyOrObject ]: value };
        } );
    };

    const resetTypography = () => {
        setSettings( DEFAULT_TYPOGRAPHY );
    };

    const saveTypographySettings = async () => {
        setIsSaving( true );
        try {
            const nonce = window.wpApiSettings?.nonce || '';
            const response = await fetch(
                '/wp-json/bwb-imaps-federated-api/v1/update-map-settings',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce,
                    },
                    body: JSON.stringify( {
                        typography: settings,
                    } ),
                }
            );
            const data = await response.json();
            return { success: response.ok, data };
        } catch ( err ) {
            console.error( 'Typography Save Error:', err );
            return { success: false, error: err };
        } finally {
            setIsSaving( false );
        }
    };

    // Compute dynamic CSS variables for the root map container (.map-container)
    const cssVariables = {
        '--map-font-family': settings.fontFamily,

        // --- LEGEND CSS VARIABLES ---
        '--map-legend-header-size': `${ settings.legendHeaderFontSize }px`,
        '--map-legend-section-size': `${ settings.legendSectionFontSize }px`,
        '--map-legend-item-size': `${ settings.legendItemFontSize }px`,

        '--map-legend-header-weight': settings.legendHeaderFontWeight,
        '--map-legend-section-weight': settings.legendSectionFontWeight,
        '--map-legend-item-weight': settings.legendItemFontWeight,

        '--map-legend-header-style': settings.legendHeaderFontStyle,
        '--map-legend-section-style': settings.legendSectionFontStyle,
        '--map-legend-item-style': settings.legendItemFontStyle,

        '--map-legend-header-decoration': settings.legendHeaderDecoration,
        '--map-legend-section-decoration': settings.legendSectionDecoration,
        '--map-legend-item-decoration': settings.legendItemDecoration,

        // --- DRAWER CATEGORY ---
        '--map-drawer-category-size': `${ settings.drawerCategoryFontSize }px`,
        '--map-drawer-category-weight': settings.drawerCategoryFontWeight,
        '--map-drawer-category-style': settings.drawerCategoryFontStyle,
        '--map-drawer-category-decoration': settings.drawerCategoryDecoration,

        // --- DRAWER TITLE ---
        '--map-drawer-title-size': `${ settings.drawerTitleFontSize }px`,
        '--map-drawer-title-weight': settings.drawerTitleFontWeight,
        '--map-drawer-title-style': settings.drawerTitleFontStyle,
        '--map-drawer-title-decoration': settings.drawerTitleDecoration,

        // --- DRAWER SUBTITLE ---
        '--map-drawer-subtitle-size': `${ settings.drawerSubtitleFontSize }px`,
        '--map-drawer-subtitle-weight': settings.drawerSubtitleFontWeight,
        '--map-drawer-subtitle-style': settings.drawerSubtitleFontStyle,
        '--map-drawer-subtitle-decoration': settings.drawerSubtitleDecoration,

        // --- DRAWER HEADINGS ---
        '--map-drawer-h1-size': `${ settings.drawerHeadingFontSize }px`,
        '--map-drawer-h1-weight': settings.drawerHeadingFontWeight,
        '--map-drawer-h1-style': settings.drawerHeadingFontStyle,
        '--map-drawer-h1-decoration': settings.drawerHeadingDecoration,

        '--map-drawer-h2-size': `${ Math.round( settings.drawerHeadingFontSize * 0.9 ) }px`,
        '--map-drawer-h2-weight': settings.drawerHeadingFontWeight,
        '--map-drawer-h2-style': settings.drawerHeadingFontStyle,
        '--map-drawer-h2-decoration': settings.drawerHeadingDecoration,

        '--map-drawer-h3-size': `${ Math.round( settings.drawerHeadingFontSize * 0.8 ) }px`,
        '--map-drawer-h3-weight': settings.drawerHeadingFontWeight,
        '--map-drawer-h3-style': settings.drawerHeadingFontStyle,
        '--map-drawer-h3-decoration': settings.drawerHeadingDecoration,

        '--map-drawer-h4-size': `${ Math.round( settings.drawerHeadingFontSize * 0.75 ) }px`,
        '--map-drawer-h4-weight': settings.drawerHeadingFontWeight,
        '--map-drawer-h4-style': settings.drawerHeadingFontStyle,
        '--map-drawer-h4-decoration': settings.drawerHeadingDecoration,

        // --- DRAWER BODY ---
        '--map-drawer-body-size': `${ settings.drawerBodyFontSize }px`,
        '--map-drawer-body-weight': settings.drawerBodyFontWeight,
        '--map-drawer-body-style': settings.drawerBodyFontStyle,
        '--map-drawer-body-decoration': settings.drawerBodyDecoration,

        // --- DRAWER QUOTES & CITATIONS ---
        '--map-drawer-quote-size': `${ settings.drawerQuoteFontSize }px`,
        '--map-drawer-quote-weight': settings.drawerQuoteFontWeight,
        '--map-drawer-quote-style': settings.drawerQuoteFontStyle,
        '--map-drawer-quote-decoration': settings.drawerQuoteDecoration,

        '--map-drawer-cite-size': `${ Math.round( settings.drawerQuoteFontSize * 0.85 ) }px`,
        '--map-drawer-cite-weight': '600',
        '--map-drawer-cite-style': 'normal',
        '--map-drawer-cite-decoration': 'none',

        // --- DRAWER SPECS ---
        '--map-drawer-specs-number-size': `${ settings.drawerSpecsNumberFontSize }px`,
        '--map-drawer-specs-number-weight': settings.drawerSpecsNumberFontWeight,
        '--map-drawer-specs-number-style': settings.drawerSpecsNumberFontStyle,
        '--map-drawer-specs-number-decoration': settings.drawerSpecsNumberDecoration,

        '--map-drawer-specs-label-size': `${ settings.drawerSpecsLabelFontSize }px`,
        '--map-drawer-specs-label-weight': settings.drawerSpecsLabelFontWeight,
        '--map-drawer-specs-label-style': settings.drawerSpecsLabelFontStyle,
        '--map-drawer-specs-label-decoration': settings.drawerSpecsLabelDecoration,

        // --- MAP CONTROLS (LAYER TOGGLER & FLOOR SWITCHER) ---
        '--map-controls-header-size': `${ settings.controlsHeaderFontSize }px`,
        '--map-controls-header-weight': settings.controlsHeaderFontWeight,
        '--map-controls-header-style': settings.controlsHeaderFontStyle,
        '--map-controls-header-decoration': settings.controlsHeaderDecoration,

        '--map-controls-item-size': `${ settings.controlsItemFontSize }px`,
        '--map-controls-item-weight': settings.controlsItemFontWeight,
        '--map-controls-item-style': settings.controlsItemFontStyle,
        '--map-controls-item-decoration': settings.controlsItemDecoration,

        '--map-controls-floor-size': `${ settings.controlsFloorFontSize }px`,
        '--map-controls-floor-weight': settings.controlsFloorFontWeight,
        '--map-controls-floor-style': settings.controlsFloorFontStyle,
        '--map-controls-floor-decoration': settings.controlsFloorDecoration,

        // --- SEARCH BAR & SEARCH LIST ---
        '--map-search-input-size': `${ settings.searchInputFontSize }px`,
        '--map-search-input-weight': settings.searchInputFontWeight,
        '--map-search-input-style': settings.searchInputFontStyle,
        '--map-search-input-decoration': settings.searchInputDecoration,

        '--map-search-tab-size': `${ settings.searchTabFontSize }px`,
        '--map-search-tab-weight': settings.searchTabFontWeight,
        '--map-search-tab-style': settings.searchTabFontStyle,
        '--map-search-tab-decoration': settings.searchTabDecoration,

        '--map-search-group-header-size': `${ settings.searchGroupHeaderFontSize }px`,
        '--map-search-group-header-weight': settings.searchGroupHeaderFontWeight,
        '--map-search-group-header-style': settings.searchGroupHeaderFontStyle,
        '--map-search-group-header-decoration': settings.searchGroupHeaderDecoration,

        '--map-search-item-size': `${ settings.searchItemFontSize }px`,
        '--map-search-item-weight': settings.searchItemFontWeight,
        '--map-search-item-style': settings.searchItemFontStyle,
        '--map-search-item-decoration': settings.searchItemDecoration,

        '--map-search-result-title-size': `${ settings.searchResultTitleFontSize }px`,
        '--map-search-result-title-weight': settings.searchResultTitleFontWeight,
        '--map-search-result-title-style': settings.searchResultTitleFontStyle,
        '--map-search-result-title-decoration': settings.searchResultTitleDecoration,

        '--map-search-result-cat-size': `${ settings.searchResultCatFontSize }px`,
        '--map-search-result-cat-weight': settings.searchResultCatFontWeight,
        '--map-search-result-cat-style': settings.searchResultCatFontStyle,
        '--map-search-result-cat-decoration': settings.searchResultCatDecoration,
    };

    return {
        typographySettings: settings,
        updateTypography,
        resetTypography,
        saveTypographySettings,
        cssVariables,
        isLoading,
        isSaving,
    };
};