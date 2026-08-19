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

const MIN_BLOCK_ZOOM = 2; // Allow zooming all the way out to global scale in block options
const MAX_BLOCK_ZOOM = 20;
const ENDPOINT_GET_SETTINGS = '/wp-json/bawbin-maps-federated-api/v1/get-map-settings';

export default function Edit( { attributes, setAttributes } ) {
    const { zoom, tilt, width, height } = attributes;

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

    const googleApiKey = settingsData?.googleApiKey || initialSettings.googleApiKey || '';
    const googleMapId = settingsData?.googleMapId || initialSettings.googleMapId || '';
    const locations = settingsData?.locations || initialSettings.locations || [];
    const colorTheme = settingsData?.colorTheme || initialSettings.colorTheme || 'blue';
    const mapLogo = settingsData?.mapLogo || initialSettings.mapLogo || '';
    const mapTitle = settingsData?.mapTitle || initialSettings.mapTitle || '';
    const mapDescription = settingsData?.mapDescription || initialSettings.mapDescription || '';
    const navBackground = settingsData?.navBackground || initialSettings.navBackground || '';
    const mapType = settingsData?.mapType || initialSettings.mapType || 'hybrid';

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
            <InspectorControls>
                <PanelBody
                    title={ __(
                        'Map Display Settings',
                        'bawbab-interactive-maps'
                    ) }
                >
                    <RangeControl
                        label={ __( 'Default Zoom Level', 'bawbab-interactive-maps' ) }
                        value={ attributes.zoom }
                        onChange={ ( val ) => setAttributes( { zoom: val } ) }
                        min={ MIN_BLOCK_ZOOM }
                        max={ MAX_BLOCK_ZOOM }
                        help={ __(
                            'Custom zoom level for this block instance. Overrides automatic bounding calculation when set.',
                            'bawbab-interactive-maps'
                        ) }
                    />
                    <RangeControl
                        label={ __( 'Tilt Angle', 'bawbab-interactive-maps' ) }
                        value={ attributes.tilt }
                        onChange={ ( val ) => setAttributes( { tilt: val } ) }
                        min={ 0 }
                        max={ 67.5 }
                        step={ 2.5 }
                        help={ __( 'Applies a 3D perspective angle to the map camera.', 'bawbab-interactive-maps' ) }
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
                        help={ __( 'e.g., 650px or 80vh', 'bawbab-interactive-maps' ) }
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

            <BawBabIMaps
                key={ `gutenberg-map-${ googleApiKey }-${ googleMapId }-${ attributes.zoom }-${ attributes.tilt }` }
                locations={ locations }
                zoom={ zoom }
                tilt={ tilt }
                width={ attributes.width }
                height={ attributes.height }
                mapLogoProp={ mapLogo }
                mapTitleProp={ mapTitle }
                mapDescriptionProp={ mapDescription }
                navBackgroundProp={ navBackground }
                colorThemeProp={ colorTheme }
                apiKeyProp={ googleApiKey }
                mapIdProp={ googleMapId }
                mapTypeProp={ mapType }
            />
        </div>
    );
}