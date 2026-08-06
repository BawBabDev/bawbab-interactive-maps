import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Custom React hook to validate the presence of the Google Maps API Key and Map ID on load.
 * Opens persistent warning notice banners if either configuration parameter is missing.
 */
export const useMapCredentialsCheck = ( isLoaded, googleApiKey, googleMapId ) => {
    const { createWarningNotice } = useDispatch( noticesStore );
    
    // Explicit mutable tracking flag reference to prevent notification spam loops on typing render inputs
    const hasDispatchedNoticeRef = useRef(false);

    useEffect( () => {
        // Wait until apiFetch completes loading the baseline platform settings
        if ( isLoaded && ! hasDispatchedNoticeRef.current ) {
            let noticeTriggered = false;

            // Validate if Google Cloud API Key string configuration is unassigned
            if ( ! googleApiKey || googleApiKey.trim() === '' ) {
                createWarningNotice( 
                    __( 'Bawbab Interactive Maps: Please enter a valid Google Maps API Key under the map settings tab to enable public rendering layouts.', 'bawbab-interactive-maps' ), 
                    {
                        id: 'bwb-maps-missing-key-warning', // Strict ID target prevents duplicate layout renders
                        isDismissible: true,
                        type: 'default' // Mounts as a standard administrative horizontal banner row
                    } 
                );
                noticeTriggered = true;
            }

            // Validate if Google Map ID string configuration is unassigned
            if ( ! googleMapId || googleMapId.trim() === '' ) {
                createWarningNotice( 
                    __( 'Bawbab Interactive Maps: Please enter a valid Google Map ID for your maps to load correctly.', 'bawbab-interactive-maps' ), 
                    {
                        id: 'bwb-maps-missing-id-warning', // Unique ID prevents double-rendering duplicate notices
                        isDismissible: true,
                        type: 'default' 
                    } 
                );
                noticeTriggered = true;
            }
            
            // If either credential was missing and threw a banner, lock execution pass until next hard reload pass
            if ( noticeTriggered ) {
                hasDispatchedNoticeRef.current = true;
            }
        }
    }, [ isLoaded, googleApiKey, googleMapId, createWarningNotice ] );
};
