/**
 * Global Map Settings Controller Hook
 * File: src/bawbab-interactive-maps-admin/admin-core-page/hooks/useMapSettings.js
 */

import { useState, useEffect, useRef } from '@wordpress/element';

const ENDPOINT_GET = '/wp-json/bwb-imaps-federated-api/v1/get-map-settings';
const ENDPOINT_UPDATE = '/wp-json/bwb-imaps-federated-api/v1/update-map-settings';

export const useMapSettings = () => {
    // Synchronously read inline window object injected by PHP on page load
    const initialWindow = window.bwbimapsSettings || {};

    const [ mapDescription, setMapDescription ] = useState( initialWindow.mapDescription || '' );
    const [ mapType, setMapType ] = useState( initialWindow.mapType || 'hybrid' );
    const [ locations, setLocations ] = useState( initialWindow.locations || [] );
    const [ mapLogo, setMapLogo ] = useState( initialWindow.mapLogo || '' );
    const [ colorTheme, setColorTheme ] = useState( initialWindow.colorTheme || 'blue' );
    const [ navBackground, setNavBackground ] = useState( initialWindow.navBackground || '' );
    const [ typography, setTypography ] = useState( initialWindow.typography || {} );

    // Instantly available credentials on render frame 1
    const [ googleApiKey, setGoogleApiKey ] = useState( initialWindow.googleApiKey || '' );
    const [ googleMapId, setGoogleMapId ] = useState( initialWindow.googleMapId || '' );

    // If inline settings were present on load, set isLoaded to true immediately
    const [ isLoaded, setIsLoaded ] = useState( Boolean( initialWindow.googleApiKey || initialWindow.googleMapId ) );
    const [ isSaving, setIsSaving ] = useState( false );

    // Baseline tracker for Google credential changes
    const initialCredentialsRef = useRef( {
        apiKey: initialWindow.googleApiKey || '',
        mapId: initialWindow.googleMapId || '',
    } );

    const safeString = ( val ) =>
        typeof val === 'string' ? val : val?.url || '';

    // Asynchronously sync latest REST database state in background
    useEffect( () => {
        const fetchMapSettings = async () => {
            try {
                const response = await fetch( ENDPOINT_GET );
                if ( response.ok ) {
                    const data = await response.json();
                    setMapDescription( data.mapDescription || '' );
                    setMapType( data.mapType || 'hybrid' );
                    setLocations( data.locations || [] );
                    setMapLogo( data.mapLogo || '' );
                    setColorTheme( data.colorTheme || 'blue' );
                    setNavBackground( data.navBackground || '' );
                    setGoogleApiKey( data.googleApiKey || '' );
                    setGoogleMapId( data.googleMapId || '' );
                    setTypography( data.typography || {} );

                    initialCredentialsRef.current = {
                        apiKey: data.googleApiKey || '',
                        mapId: data.googleMapId || '',
                    };

                    window.bwbimapsSettings = {
                        ...window.bwbimapsSettings,
                        ...data,
                    };
                }
            } catch ( err ) {
                console.error( 'Error fetching map settings:', err );
            } finally {
                setIsLoaded( true );
            }
        };

        fetchMapSettings();
    }, [] );

    // Save updated options via /update-map-settings REST API
    const saveSettings = async () => {
        setIsSaving( true );
        try {
            const nonce = window.wpApiSettings?.nonce || '';
            const cleanApiKey = safeString( googleApiKey ).trim();
            const cleanMapId = safeString( googleMapId ).trim();

            const payload = {
                mapDescription: safeString( mapDescription ),
                mapType: safeString( mapType ),
                locations: Array.isArray( locations ) ? locations : [],
                mapLogo: safeString( mapLogo ),
                navBackground: safeString( navBackground ),
                colorTheme: safeString( colorTheme ),
                googleApiKey: cleanApiKey,
                googleMapId: cleanMapId,
                typography: typography || {},
            };

            const response = await fetch( ENDPOINT_UPDATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                },
                body: JSON.stringify( payload ),
            } );

            if ( ! response.ok ) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Failed to update settings.'
                );
            }

            // Sync window object in memory
            window.bwbimapsSettings = {
                ...window.bwbimapsSettings,
                mapType: safeString( mapType ),
                colorTheme: safeString( colorTheme ),
                mapLogo: safeString( mapLogo ),
                googleApiKey: cleanApiKey,
                googleMapId: cleanMapId,
                navBackground: safeString( navBackground ),
                typography: typography || {},
            };

            const credentialsChanged =
                cleanApiKey !== initialCredentialsRef.current.apiKey.trim() ||
                cleanMapId !== initialCredentialsRef.current.mapId.trim();

            if ( credentialsChanged ) {
                initialCredentialsRef.current = {
                    apiKey: cleanApiKey,
                    mapId: cleanMapId,
                };
            }

            return { success: true, credentialsChanged };
        } catch ( error ) {
            console.error( 'Save settings error:', error );
            return { success: false, error };
        } finally {
            setIsSaving( false );
        }
    };

    // Location repeater helper methods
    const addLocation = () =>
        setLocations( ( prev ) => [
            ...prev,
            {
                title: '',
                lat: '',
                lng: '',
                description: '',
                gallery: [],
                showMarker: true,
            },
        ] );

    const removeLocation = ( index ) =>
        setLocations( ( prev ) => prev.filter( ( _, i ) => i !== index ) );

    const updateLocation = ( index, key, value ) =>
        setLocations( ( prev ) => {
            const next = [ ...prev ];
            next[ index ] = { ...next[ index ], [ key ]: value };
            return next;
        } );

    const addImageToLocation = ( locIdx, media ) =>
        setLocations( ( prev ) => {
            const next = [ ...prev ];
            next[ locIdx ].gallery = [
                ...( next[ locIdx ].gallery || [] ),
                { id: media.id, url: media.url },
            ];
            return next;
        } );

    const removeImageFromLocation = ( locIdx, imgIdx ) =>
        setLocations( ( prev ) => {
            const next = [ ...prev ];
            next[ locIdx ].gallery = next[ locIdx ].gallery.filter(
                ( _, i ) => i !== imgIdx
            );
            return next;
        } );

    return {
        settings: {
            mapDescription,
            mapType,
            locations,
            mapLogo,
            colorTheme,
            navBackground,
            googleApiKey,
            googleMapId,
            typography,
        },
        setters: {
            setMapDescription,
            setMapType,
            setLocations,
            setMapLogo,
            setColorTheme,
            setNavBackground,
            setGoogleApiKey,
            setGoogleMapId,
            setTypography,
        },
        repeater: {
            addLocation,
            removeLocation,
            updateLocation,
            addImageToLocation,
            removeImageFromLocation,
        },
        isLoaded,
        isSaving,
        saveSettings,
    };
};