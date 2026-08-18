/**
 * Gutenberg Block Editor Component
 * File: src/bawbab-interactive-maps-block/edit.js
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import {
    PanelBody,
    RangeControl,
    Placeholder,
    Spinner,
    TextControl,
} from '@wordpress/components';
import BawBabIMaps from './components/maps';

const MIN_MAP_ZOOM = 15;
const MAX_MAP_ZOOM = 20;
const ENDPOINT_GET_SETTINGS = '/wp-json/bawbin-maps-federated-api/v1/get-map-settings';

export default function Edit( { attributes, setAttributes } ) {
    const { zoom, tilt, width, height } = attributes;

    // Safely retrieve synchronous window settings across iframe boundaries
    const getSynchronousSettings = () => {
        if ( typeof window !== 'undefined' && window.bawbinmapsSettings ) {
            return window.bawbinmapsSettings;
        }
        if ( typeof window !== 'undefined' && window.top && window.top.bawbinmapsSettings ) {
            return window.top.bawbinmapsSettings;
        }
        return {};
    };

    const initialSettings = getSynchronousSettings();

    const [ settingsData, setSettingsData ] = useState( initialSettings );
    const [ isLoading, setIsLoading ] = useState( ! initialSettings.googleApiKey );

    useEffect( () => {
        // Fetch map settings via REST API
        fetch( ENDPOINT_GET_SETTINGS )
            .then( ( res ) => ( res.ok ? res.json() : {} ) )
            .then( ( data ) => {
                if ( data && Object.keys( data ).length > 0 ) {
                    setSettingsData( ( prev ) => ( { ...prev, ...data } ) );
                    
                    if ( typeof window !== 'undefined' ) {
                        window.bawbinmapsSettings = { ...window.bawbinmapsSettings, ...data };
                    }
                }
            } )
            .catch( ( err ) =>
                console.error( 'Error loading global map settings:', err )
            )
            .finally( () => setIsLoading( false ) );
    }, [] );

    const blockProps = useBlockProps();

    // Extract settings with fallback to synchronous window object
    const googleApiKey = settingsData?.googleApiKey || initialSettings.googleApiKey || '';
    const googleMapId = settingsData?.googleMapId || initialSettings.googleMapId || '';
    const locations = settingsData?.locations || initialSettings.locations || [];
    const colorTheme = settingsData?.colorTheme || initialSettings.colorTheme || 'blue';
    const mapLogo = settingsData?.mapLogo || initialSettings.mapLogo || '';
    const navBackground = settingsData?.navBackground || initialSettings.navBackground || '';
    const mapType = settingsData?.mapType || initialSettings.mapType || 'hybrid';

    // BLOCK RENDERING: Do NOT mount BawBabIMaps if Google API key is missing or still loading
    if ( isLoading || ! googleApiKey ) {
        return (
            <div { ...blockProps }>
                <Placeholder
                    label={ __(
                        'Bawbab Interactive Maps',
                        'bawbab-interactive-maps'
                    ) }
                    instructions={
                        ! googleApiKey && ! isLoading
                            ? __(
                                  'Google Maps API Key missing. Please configure your API key in the Map Settings admin page.',
                                  'bawbab-interactive-maps'
                              )
                            : __( 'Loading Map Data...', 'bawbab-interactive-maps' )
                    }
                >
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    return (
        <div { ...blockProps }>
            { /* Inspector Controls */ }
            <InspectorControls>
                <PanelBody
                    title={ __(
                        'Map display Settings',
                        'bawbab-interactive-maps'
                    ) }
                >
                    <RangeControl
                        label={ __( 'Default Zoom Level', 'bawbab-interactive-maps' ) }
                        value={ attributes.zoom }
                        onChange={ ( val ) =>
                            setAttributes( {
                                zoom: Math.max( MIN_MAP_ZOOM, val ),
                            } )
                        }
                        min={ MIN_MAP_ZOOM }
                        max={ MAX_MAP_ZOOM }
                    />
                    <RangeControl
                        label={ __( 'Tilt Angle', 'bawbab-interactive-maps' ) }
                        value={ attributes.tilt }
                        onChange={ ( val ) => setAttributes( { tilt: val } ) }
                        min={ 0 }
                        max={ 90 }
                    />
                    <TextControl
                        label={ __( 'Map Width', 'bawbab-interactive-maps' ) }
                        value={ attributes.width }
                        onChange={ ( val ) => setAttributes( { width: val } ) }
                        help={ __(
                            'e.g., 100% or 600px',
                            'bawbab-interactive-maps'
                        ) }
                    />
                    <TextControl
                        label={ __( 'Map Height', 'bawbab-interactive-maps' ) }
                        value={ attributes.height }
                        onChange={ ( val ) => setAttributes( { height: val } ) }
                        help={ __( 'e.g., 400px', 'bawbab-interactive-maps' ) }
                    />
                    <p style={ { fontSize: '11px', color: '#757575' } }>
                        { __(
                            'Note: Global settings are managed in the ',
                            'bawbab-interactive-maps'
                        ) }
                        <a
                            href="admin.php?page=bawbab-interactive-maps-settings"
                            target="_blank"
                            rel="noreferrer"
                        >
                            { __(
                                'Map Settings Page',
                                'bawbab-interactive-maps'
                            ) }
                        </a>
                        .
                    </p>
                </PanelBody>
            </InspectorControls>

            { /* Visual Map Renderer */ }
            <BawBabIMaps
                key={ `gutenberg-map-${ googleApiKey }-${ googleMapId }` }
                locations={ locations }
                zoom={ zoom }
                tilt={ tilt }
                width={ attributes.width }
                height={ attributes.height }
                mapLogoProp={ mapLogo }
                navBackgroundProp={ navBackground }
                colorThemeProp={ colorTheme }
                apiKeyProp={ googleApiKey }
                mapIdProp={ googleMapId }
                mapTypeProp={ mapType }
            />
        </div>
    );
}