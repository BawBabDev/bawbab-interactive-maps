import { Icon } from '@iconify/react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect } from '@wordpress/element';

export const MapLabels = ({ features, visibleLayers, activeFloor = 0, markerZIndex = 320 }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(map?.getZoom() || 16);

    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('zoom_changed', () => {
            setZoom(map.getZoom());
        });
        return () => listener.remove();
    }, [map]);

    // Show labels starting at zoom 18
    if (zoom < 18) return null;

    /**
     * CLEAN WORD WRAP LOGIC
     * Splits by space and joins with \n if word is > 4 chars.
     */
    const formatLabelText = (text) => {
        if (!text) return '';
        const words = text.toString().split(/\s+/);
        return words.map((word, idx) => {
            if (idx === 0) return word;
            return word.length > 4 ? `\n${word}` : ` ${word}`;
        }).join('');
    };

    const baseFontSize = 6; 
    const baseZoom = 18;
    const scaledFontSize = baseFontSize * Math.pow(2, zoom - baseZoom);

    const allowedBuildingCategories = [ 'residential_apartment', 'cottage', 'personal_care', 
        'community_center', 'skilled_care', 'fitness_center', 'carport_garage_support' ];

    const isElevatorRoom = (nameValue) => {
        const normalized = (nameValue || '').toString().trim().toLowerCase();
        return normalized === 'elev.room' || normalized === 'elev room' || normalized === 'elev. room';
    };

    return (
        <>
            {features.map((f, i) => {
                const { code, name, layer_type, category, fid, lat, lng, floor = 0 } = f.properties;
                
                // 1. Visibility Check
                if (!visibleLayers[layer_type]) return null;

                // 2. Strict Layer & Category Filter
                const isAllowedBuilding = layer_type === 'buildings' && allowedBuildingCategories.includes(category);
                const isAllowedLandUse = layer_type === 'land_use';
                const isAllowedPathLabel = layer_type === 'paths';
                if (!isAllowedBuilding && !isAllowedLandUse && !isAllowedPathLabel) return null;

                // 3. Label Text Priority
                const rawText = code || name;
                if (!rawText) return null;

                // 4. COORDINATE SOURCE: Use your new direct lat/lng fields
                if (!lat || !lng) return null;
                const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
                const parsedFloor = Number.parseInt(floor, 10);
                const featureFloor = Number.isNaN(parsedFloor) ? 0 : parsedFloor;

                // Labels are strictly floor-scoped: render only labels on the selected floor.
                if (featureFloor !== activeFloor) return null;
                
                const labelText = formatLabelText(rawText);
                const renderElevatorIcon = layer_type === 'paths' && isElevatorRoom(name);

                return (
                    <AdvancedMarker 
                        key={`label-${layer_type}-${fid}-${i}`} 
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
                                        filter: 'drop-shadow(-1px 0 0 #fff) drop-shadow(1px 0 0 #fff) drop-shadow(0 -1px 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
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
                                    filter: 'none',
                                    textShadow: `
                                        -1px -1px 0 #fff,  
                                         1px -1px 0 #fff,
                                        -1px  1px 0 #fff,
                                         1px  1px 0 #fff,
                                         0px 1px 2px rgba(0,0,0,0.15)
                                    `
                                }}>
                                    {labelText}
                                </span>
                            )}
                        </div>
                    </AdvancedMarker>
                );
            })}
        </>
    );
};