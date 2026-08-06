import React from '@wordpress/element';
import Polygon from '../hooks/usePolygonHelper';

export const SpatialFeaturesRenderer = ({
    spatialFeatures,
    visibleLayers,
    selectedLocation,
    editMode,
    hoveredFeature,
    activeFloor,
    layerOpacity,
    isFloorMode,
    FLOOR_AWARE_LAYERS,
    FLOOR_LAYER_Z_INDEX,
    ACTIVE_FLOOR_Z_INDEX_BOOST,
    formatCoords,
    setHoveredFeature,
    setSelectedLocation,
    setIsDrawerOpen,
    setActiveNavigationPath,
    setManualOriginNode,
    onFeatureSelect
}) => {
    return spatialFeatures
        .filter(feature => visibleLayers[feature.properties.layer_type] || (selectedLocation && String(selectedLocation.fid) === String(feature.properties.fid) && selectedLocation.layer_type === feature.properties.layer_type))
        .map((feature, i) => {
            const coords = formatCoords(feature.geometry.coordinates);
            const { fid, layer_type, fill_color, name, wp_page_id, description, gallery, floor = 0 } = feature.properties;
            if (!coords || coords.length === 0) return null;
            
            const isLayerVisible = visibleLayers[layer_type];
            const isFloorAwareLayer = FLOOR_AWARE_LAYERS.includes(layer_type);
            const floorValue = Number.parseInt(floor, 10);
            const featureFloor = Number.isNaN(floorValue) ? 0 : floorValue;
            const isGroundFloorFeature = featureFloor === 0;
            const isActiveFloorFeature = isFloorAwareLayer && featureFloor === activeFloor;
            const shouldRenderFloorAwareFeature = !isFloorAwareLayer ? true : (activeFloor === 0 ? isGroundFloorFeature : (isGroundFloorFeature || isActiveFloorFeature));
            
            if (!shouldRenderFloorAwareFeature) return null;
            
            const hasContent = !!(name || description || (wp_page_id && parseInt(wp_page_id) > 0) || (gallery && gallery.length > 0));
            const isSelectable = layer_type !== 'parcels' && layer_type !== 'paths' && (hasContent || editMode);
            const isSelected = selectedLocation && String(selectedLocation.fid) === String(fid) && selectedLocation.layer_type === layer_type;
            const isHovered = isSelectable && hoveredFeature && !editMode && String(hoveredFeature.fid) === String(fid) && hoveredFeature.layer_type === layer_type;
            const shouldHighlight = isSelected || isHovered;
            const finalOpacity = isLayerVisible ? (layerOpacity[layer_type] ?? 0.5) : 0.3;
            const baseLayerZIndex = FLOOR_LAYER_Z_INDEX[layer_type] ?? 30;
            const isForegroundFloorFeature = isFloorMode && isActiveFloorFeature;
            const floorLayerZIndex = isForegroundFloorFeature ? baseLayerZIndex + ACTIVE_FLOOR_Z_INDEX_BOOST : baseLayerZIndex;
            
            const options = {
                zIndex: shouldHighlight && (!isFloorMode || isForegroundFloorFeature) ? floorLayerZIndex + 40 : floorLayerZIndex,
                fillColor: layer_type === 'parcels' ? "transparent" : (fill_color || "#888888"),
                strokeColor: shouldHighlight ? "#ffff00" : (layer_type === 'parcels' ? "#000" : layer_type === 'buildings' ? "#fff" : "transparent"),
                fillOpacity: finalOpacity, 
                strokeWeight: shouldHighlight ? 4 : (layer_type === 'parcels' ? 1.5 : 0.4),
                clickable: isSelectable && (!isFloorMode || isActiveFloorFeature)
            };
            
            const isMulti = feature.geometry.type === 'MultiPolygon';
            const polyProps = { 
                options, 
                onClick: () => isSelectable ? (setSelectedLocation({ ...feature.properties, geometry: feature.geometry }), setIsDrawerOpen(true), setActiveNavigationPath(null), setManualOriginNode(null), onFeatureSelect?.(feature)) : (setSelectedLocation(null), setIsDrawerOpen(false), setActiveNavigationPath(null), setManualOriginNode(null)), 
                onMouseEnter: () => isSelectable && setHoveredFeature({ fid, layer_type }), 
                onMouseLeave: () => setHoveredFeature(null) 
            };
            
            return isMulti 
                ? coords.map((p, pi) => <Polygon key={`poly-${i}-${pi}`} paths={p} {...polyProps} />)
                : <Polygon key={`poly-${i}`} paths={coords} {...polyProps} />;
        });
};
