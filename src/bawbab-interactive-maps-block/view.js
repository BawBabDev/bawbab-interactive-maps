import { createRoot } from '@wordpress/element';
import BawBabIMaps from './components/maps';

const ENDPOINT_GET_SETTINGS = '/wp-json/bawbin-maps-federated-api/v1/get-map-settings';

const viewBawbabImap = async () => {
    let globalSettings = {};

    try {
        const response = await fetch( ENDPOINT_GET_SETTINGS );
        if ( response.ok ) {
            globalSettings = await response.json();
            window.bawbinmapsSettings = globalSettings;
        }
    } catch ( err ) {
        console.error( 'Bawbab IMaps: Could not load global settings', err );
    }

    const targetContainers = document.querySelectorAll(
        '.bawbab-imaps-container:not([data-rendered="true"]), .map-shortcode-container:not([data-rendered="true"]), #interactive-map-root:not([data-rendered="true"]), .bawbin-maps-interactive-map-root:not([data-rendered="true"])'
    );

    targetContainers.forEach( ( container ) => {
        try {
            const parsedZoom = Number.parseInt( container.dataset.zoom, 10 );
            // Allow zoom to be null if dataset doesn't explicitly override it, letting BawBabIMaps scale dynamically
            const clampedZoom = Number.isNaN( parsedZoom ) ? null : parsedZoom;

            const parsedTilt = Number.parseInt( container.dataset.tilt, 10 );
            const clampedTilt = Number.isNaN( parsedTilt ) ? 0 : Math.min( Math.max( 0, parsedTilt ), 90 );

            const selectedTheme = container.dataset.colorTheme || globalSettings.colorTheme || 'blue';

            // Pass all database settings directly as explicit props
            const attributes = {
                zoom: clampedZoom,
                tilt: clampedTilt,
                width: container.dataset.width || '100%',
                height: container.dataset.height || '650px',
                mapType: container.dataset.mapType || globalSettings.mapType || 'hybrid',
                colorThemeProp: selectedTheme,
                mapLogoProp: globalSettings.mapLogo || '',
                mapTitleProp: globalSettings.mapTitle || '',
                mapDescriptionProp: globalSettings.mapDescription || '',
                navBackgroundProp: globalSettings.navBackground || '',
                apiKeyProp: globalSettings.googleApiKey || '',
                mapIdProp: globalSettings.googleMapId || '',
                locations: globalSettings.locations || [],
            };

            container.classList.remove( 'map-theme-blue', 'map-theme-green', 'map-theme-yellow' );
            container.classList.add( `map-theme-${ selectedTheme }` );

            const root = createRoot( container );
            root.render( <BawBabIMaps { ...attributes } /> );

            container.dataset.rendered = 'true';
        } catch ( e ) {
            console.error( 'Bawbab IMaps Error:', e );
        }
    } );
};

if ( document.readyState === 'complete' || document.readyState === 'interactive' ) {
    viewBawbabImap();
} else {
    window.addEventListener( 'DOMContentLoaded', viewBawbabImap );
}