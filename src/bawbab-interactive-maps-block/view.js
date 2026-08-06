import { createRoot } from '@wordpress/element';
import BawBabIMaps from './components/maps';
    
const MIN_MAP_ZOOM = 15;

const viewBawbabImap = async () => {
    // Fetch Global Settings once for the whole page
    let globalSettings = { colorTheme: 'blue', mapLogo: '' };
    try {
        const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/map-locations');
        if (response.ok) {
            const data = await response.json();
            globalSettings = {
                colorTheme: data.colorTheme || 'blue',
                mapLogo: data.mapLogo || ''
            };
            // Set global for components that might peek at it
            window.bwbimapsSettings = data;
        }
    } catch (err) {
        console.error("Bawbab IMaps: Could not load global settings", err);
    }

    document.querySelectorAll('.bawbab-imaps-container:not([data-rendered="true"])').forEach((container) => {
        try {
            const parsedZoom = Number.parseInt(container.dataset.zoom, 10);
            const clampedZoom = Number.isNaN(parsedZoom) ? MIN_MAP_ZOOM : Math.max(MIN_MAP_ZOOM, parsedZoom);
            const parsedTilt = Number.parseInt(container.dataset.tilt, 10);
            const clampedTilt = Number.isNaN(parsedTilt) ? 0 : Math.min(Math.max(0, parsedTilt), 90);

            const attributes = {
                zoom: clampedZoom,
                tilt: clampedTilt,
                width: container.dataset.width || '100%',
                height: container.dataset.height || '650px', 
                mapType: container.dataset.mapType || 'hybrid',
                // Pass the theme and logo down to the React component
                colorTheme: globalSettings.colorTheme,
                mapLogo: globalSettings.mapLogo
            };

            // Apply the theme class to the container itself
            container.classList.add(`map-theme-${globalSettings.colorTheme}`);

            const root = createRoot(container);
            root.render(
                <BawBabIMaps {...attributes} />
            );
            
            container.dataset.rendered = 'true';
        } catch (e) {
            console.error("Bawbab IMaps Error:", e);
        }
    });
};

// SAFEGUARD: Check for both 'complete' and 'interactive' states so footer-loaded scripts don't get stuck
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    viewBawbabImap();
} else {
    window.addEventListener('DOMContentLoaded', viewBawbabImap);
}