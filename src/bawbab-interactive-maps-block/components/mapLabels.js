import { memo, useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { Icon } from '@iconify/react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

/**
 * CLEAN WORD WRAP LOGIC
 */
const formatLabelText = (text) => {
    if (!text) return '';
    const words = text.toString().split(/\s+/);
    return words.map((word, idx) => {
        if (idx === 0) return word;
        return word.length > 4 ? `\n${word}` : ` ${word}`;
    }).join('');
};

const isElevatorRoom = (nameValue) => {
    const normalized = (nameValue || '').toString().trim().toLowerCase();
    return normalized === 'elev.room' || normalized === 'elev room' || normalized === 'elev. room';
};

/**
 * Individual Label Marker Component
 */
const MapLabelItem = memo(({ feature, activeFloor, visibleLayers, markerZIndex, scaledFontSize }) => {
    const { code, name, layer_type, fid, lat, lng, floor = 0, show_label } = feature.properties || {};

    if (!visibleLayers[layer_type] || show_label === false) return null;

    const rawText = code || name;
    if (!rawText || !lat || !lng) return null;

    const parsedFloor = Number.parseInt(floor, 10);
    const featureFloor = Number.isNaN(parsedFloor) ? 0 : parsedFloor;

    if (featureFloor !== activeFloor) return null;

    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const labelText = formatLabelText(rawText);
    const renderElevatorIcon = layer_type === 'paths' && isElevatorRoom(name);

    return (
        <AdvancedMarker 
            position={position} 
            zIndex={markerZIndex}
            collisionBehavior="REQUIRED_AND_HIDES_OPTIONAL"
        >
            <div style={{
                transform: 'translate(0%, 0%)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                userSelect: 'none',
                width: 'max-content',
                position: 'relative'
            }}>
                {renderElevatorIcon ? (
                    <Icon
                        icon="mdi:elevator-passenger"
                        width={Math.max(12, scaledFontSize * 1.8)}
                        height={Math.max(12, scaledFontSize * 1.8)}
                        aria-hidden="true"
                        style={{
                            display: 'block',
                            color: '#111',
                            transform: 'translateY(3px)',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'
                        }}
                    />
                ) : (
                    <span style={{
                        color: '#444',
                        fontSize: `${scaledFontSize}px`,
                        fontWeight: '900',
                        lineHeight: '1.05',
                        whiteSpace: 'pre-wrap', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.01em',
                        opacity: 1,
                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0px 1px 2px rgba(0,0,0,0.15)'
                    }}>
                        {labelText}
                    </span>
                )}
            </div>
        </AdvancedMarker>
    );
});

MapLabelItem.displayName = 'MapLabelItem';

/**
 * Main MapLabels Component
 * Retains DOM markers during map panning for seamless movement.
 * Only hides markers during active camera ZOOM transitions.
 */
export const MapLabels = memo(({ features = [], visibleLayers = {}, activeFloor = 0, markerZIndex = 320 }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(map?.getZoom() || 16);
    const [isZooming, setIsZooming] = useState(false);
    const [mapBounds, setMapBounds] = useState(null);
    const zoomTimeoutRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // 1. Detect ZOOM start (specifically track zoom_changed instead of bounds_changed)
        const zoomListener = map.addListener('zoom_changed', () => {
            setIsZooming(true);
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        });

        // 2. Capture map bounds and update zoom when camera is idle
        const idleListener = map.addListener('idle', () => {
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
            
            setMapBounds(map.getBounds());
            
            zoomTimeoutRef.current = setTimeout(() => {
                setZoom(Math.round(map.getZoom()));
                setIsZooming(false);
            }, 100);
        });

        return () => {
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
            zoomListener.remove();
            idleListener.remove();
        };
    }, [map]);

    // Filter features that fall inside current map viewport bounds
    const visibleViewportFeatures = useMemo(() => {
        if (!mapBounds) return features;

        return features.filter(f => {
            const { lat, lng } = f.properties || {};
            if (!lat || !lng) return false;
            
            const pLat = parseFloat(lat);
            const pLng = parseFloat(lng);
            if (isNaN(pLat) || isNaN(pLng)) return false;

            return mapBounds.contains({ lat: pLat, lng: pLng });
        });
    }, [features, mapBounds]);

    // Hide labels only below zoom 18 or during active camera ZOOMING
    if (zoom < 18 || isZooming) return null;

    const baseFontSize = 6; 
    const baseZoom = 18;
    const scaledFontSize = baseFontSize * Math.pow(2, zoom - baseZoom);

    return (
        <>
            {visibleViewportFeatures.map((f, i) => (
                <MapLabelItem
                    key={`label-${f.properties?.layer_type}-${f.properties?.fid || i}`}
                    feature={f}
                    activeFloor={activeFloor}
                    visibleLayers={visibleLayers}
                    markerZIndex={markerZIndex}
                    scaledFontSize={scaledFontSize}
                />
            ))}
        </>
    );
});

MapLabels.displayName = 'MapLabels';