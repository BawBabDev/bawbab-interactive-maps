import { createRoot } from '@wordpress/element';
import BawBabIMaps from './components/maps';

const MIN_MAP_ZOOM = 15;
const ENDPOINT_GET_SETTINGS = '/wp-json/bwb-imaps-federated-api/v1/get-map-settings';

const viewBawbabImap = async () => {
    let globalSettings = {};

    try {
        const response = await fetch( ENDPOINT_GET_SETTINGS );
        if ( response.ok ) {
            globalSettings = await response.json();
            window.bwbimapsSettings = globalSettings;
        }
    } catch ( err ) {
        console.error( 'Bawbab IMaps: Could not load global settings', err );
    }

    const targetContainers = document.querySelectorAll(
        '.bawbab-imaps-container:not([data-rendered="true"]), .map-shortcode-container:not([data-rendered="true"]), #interactive-map-root:not([data-rendered="true"]), .bwb-interactive-map-root:not([data-rendered="true"])'
    );

    targetContainers.forEach( ( container ) => {
        try {
            const parsedZoom = Number.parseInt( container.dataset.zoom, 10 );
            const clampedZoom = Number.isNaN( parsedZoom ) ? MIN_MAP_ZOOM : Math.max( MIN_MAP_ZOOM, parsedZoom );

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