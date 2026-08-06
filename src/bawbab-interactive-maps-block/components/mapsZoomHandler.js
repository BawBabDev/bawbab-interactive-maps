import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from '@wordpress/element';

export const ZoomHandler = ({ selectedLocation, isDrawerOpen, editMode = false }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !selectedLocation || !isDrawerOpen) return;

        let targetLat, targetLng;

        // 1. Resolve Raw Feature Coordinates
        if (selectedLocation.lat && selectedLocation.lng) {
            targetLat = parseFloat(selectedLocation.lat);
            targetLng = parseFloat(selectedLocation.lng);
        } 
        else if (selectedLocation.geometry?.coordinates) {
            const type = selectedLocation.geometry.type;
            const coords = selectedLocation.geometry.coordinates;
            const ring = type === 'MultiPolygon' ? coords[0][0] : coords[0];
            
            const lats = ring.map(c => c[1]);
            const lngs = ring.map(c => c[0]);
            
            targetLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            targetLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        }

        if (!isNaN(targetLat) && !isNaN(targetLng)) {
            const zoomLevel = 19;
            map.setZoom(zoomLevel);

            // 2. Calculate Final Destination with Offset
            // Desktop only: Shift center so feature appears to the right of the sidebar
            if (window.innerWidth > 768) {
                const projection = map.getProjection();
                
                if (projection) {
                    // Convert LatLng to a linear coordinate system (World Points)
                    const worldPoint = projection.fromLatLngToPoint({ lat: targetLat, lng: targetLng });
                    
                    // Calculate how much a pixel represents in World Points at the specific zoom level
                    const scale = Math.pow(2, zoomLevel);
                    
                    // We want to shift the target to the right (by shifting the map center to the left)
                    // Offset: -200 pixels / scale
                    // If in Edit Mode, we want 0 offset (center of the box)
                    // If in Main Map Mode, we want -200 offset (to the right of sidebar)
                    const pixelOffset = editMode ? 0 : -200;
                    worldPoint.x += pixelOffset / scale;
                    
                    // Convert back to LatLng
                    const finalTarget = projection.fromPointToLatLng(worldPoint);
                    
                    // One single smooth motion to the offset center
                    map.panTo(finalTarget);
                } else {
                    // Fallback if projection isn't ready immediately
                    map.panTo({ lat: targetLat, lng: targetLng });
                }
            } else {
                // Mobile: Normal center
                map.panTo({ lat: targetLat, lng: targetLng });
            }
        }
    }, [map, selectedLocation, isDrawerOpen]);

    return null;
};