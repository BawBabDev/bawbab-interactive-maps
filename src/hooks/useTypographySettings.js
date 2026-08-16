import { useState, useEffect } from '@wordpress/element';

const DEFAULT_TYPOGRAPHY = {
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    legendHeaderFontSize: 13,
    legendSectionFontSize: 10,
    legendItemFontSize: 11,
    drawerTitleFontSize: 2.0,
    drawerBodyFontSize: 1.1,
    controlsFontSize: 13,
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
                    const fetchedTypography = data?.categoryConfig?.legendConfig?.typography || data?.typography;
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

    const cssVariables = {
        '--map-font-family': settings.fontFamily,
        '--map-legend-header-size': `${ settings.legendHeaderFontSize }px`,
        '--map-legend-section-size': `${ settings.legendSectionFontSize }px`,
        '--map-legend-item-size': `${ settings.legendItemFontSize }px`,
        '--map-drawer-title-size': `${ settings.drawerTitleFontSize }rem`,
        '--map-font-size-base': `${ settings.drawerBodyFontSize }rem`,
        '--map-controls-font-size': `${ settings.controlsFontSize }px`,
    };

    return {
        typographySettings: settings,
        updateTypography,
        saveTypographySettings,
        cssVariables,
        isLoading,
        isSaving,
    };
};