import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from '@wordpress/element';

/**
 * ZoomHandler Component
 * 
 * Smoothly pans and zooms the Google Map viewport ONLY when a new feature is selected.
 * Closing the sidebar drawer will NOT re-trigger camera movements or zooms.
 */
export const ZoomHandler = ({ 
    selectedLocation, 
    isDrawerOpen, 
    editMode = false, 
    containerRef = null,
    sidebarSelector = '.map-sidebar'
}) => {
    const map = useMap();
    const animationFrameRef = useRef(null);
    const lastProcessedLocationRef = useRef(null);

    useEffect(() => {
        if (!map || !selectedLocation) {
            // Reset reference when selection is cleared
            if (!selectedLocation) {
                lastProcessedLocationRef.current = null;
            }
            return;
        }

        // Construct unique feature key to detect if this is a genuinely NEW selection
        const currentLocationKey = `${selectedLocation.layer_type || selectedLocation.properties?.layer_type || 'loc'}-${selectedLocation.fid || selectedLocation.properties?.fid || selectedLocation.name || selectedLocation.lat}`;

        // STOPS RE-ZOOMING ON DRAWER CLOSE:
        // If the location key hasn't changed, do not execute zoom/pan again!
        if (lastProcessedLocationRef.current === currentLocationKey) {
            return;
        }

        // Mark this location as processed
        lastProcessedLocationRef.current = currentLocationKey;

        let targetLat, targetLng;

        // 1. Resolve Target Coordinates
        if (selectedLocation.lat && selectedLocation.lng) {
            targetLat = parseFloat(selectedLocation.lat);
            targetLng = parseFloat(selectedLocation.lng);
        } 
        else if (selectedLocation.properties?.lat && selectedLocation.properties?.lng) {
            targetLat = parseFloat(selectedLocation.properties.lat);
            targetLng = parseFloat(selectedLocation.properties.lng);
        }
        else if (selectedLocation.geometry?.coordinates) {
            const type = selectedLocation.geometry.type;
            const coords = selectedLocation.geometry.coordinates;
            const ring = type === 'MultiPolygon' ? coords[0][0] : (type === 'Polygon' ? coords[0] : coords);
            
            if (Array.isArray(ring) && ring.length > 0) {
                const lats = ring.map(c => Array.isArray(c) ? c[1] : c.lat);
                const lngs = ring.map(c => Array.isArray(c) ? c[0] : c.lng);
                
                targetLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                targetLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            }
        }

        if (isNaN(targetLat) || isNaN(targetLng)) return;

        const panToTargetWithOffset = () => {
            const zoomLevel = 19;
            map.setZoom(zoomLevel);

            const containerEl = containerRef?.current || map.getDiv();
            const containerWidth = containerEl ? containerEl.getBoundingClientRect().width : window.innerWidth;

            // Measure actual rendered drawer width from the DOM
            const sidebarEl = containerEl?.querySelector(sidebarSelector) || document.querySelector(sidebarSelector);
            const sidebarWidth = (sidebarEl && isDrawerOpen) ? sidebarEl.getBoundingClientRect().width : 0;

            const isMobile = containerWidth <= 768;

            // Desktop centering: Shift target to the visual center of remaining open space
            if (!isMobile && !editMode && sidebarWidth > 0) {
                const pixelOffset = -(sidebarWidth / 2);
                const projection = map.getProjection();

                if (projection) {
                    const worldPoint = projection.fromLatLngToPoint({ lat: targetLat, lng: targetLng });
                    const scale = Math.pow(2, zoomLevel);
                    worldPoint.x += pixelOffset / scale;

                    const finalTarget = projection.fromPointToLatLng(worldPoint);
                    map.panTo(finalTarget);
                } else {
                    map.panTo({ lat: targetLat, lng: targetLng });
                }
            } else {
                map.panTo({ lat: targetLat, lng: targetLng });
            }
        };

        // If the drawer is opening from a closed state, wait briefly for the sidebar CSS transition
        if (isDrawerOpen) {
            const timer = setTimeout(() => {
                animationFrameRef.current = requestAnimationFrame(panToTargetWithOffset);
            }, 320);

            return () => {
                clearTimeout(timer);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };
        } else {
            panToTargetWithOffset();
        }
    }, [map, selectedLocation, isDrawerOpen, editMode, containerRef, sidebarSelector]);

    return null;
};