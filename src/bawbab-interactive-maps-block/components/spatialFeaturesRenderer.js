import { memo, useMemo, useCallback } from '@wordpress/element';
import Polygon from '../hooks/usePolygonHelper';

/**
 * Sub-component for individual features.
 * Wrapped in memo so un-hovered/un-selected polygons never re-render.
 */
const SpatialFeatureItem = memo(({
    feature,
    formattedCoords,
    isLayerVisible,
    layerOpacityValue,
    isSelected,
    isHovered,
    isSelectable,
    isFloorMode,
    isActiveFloorFeature,
    baseLayerZIndex,
    ACTIVE_FLOOR_Z_INDEX_BOOST,
    onSelect,
    onHoverStart,
    onHoverEnd
}) => {
    const { fid, layer_type, fill_color } = feature.properties;
    
    const shouldHighlight = isSelected || isHovered;
    const isForegroundFloorFeature = isFloorMode && isActiveFloorFeature;
    const floorLayerZIndex = isForegroundFloorFeature ? baseLayerZIndex + ACTIVE_FLOOR_Z_INDEX_BOOST : baseLayerZIndex;
    const finalOpacity = isLayerVisible ? layerOpacityValue : 0.3;

    // Memoize options object to prevent Google Maps vector polygon thrashing
    const options = useMemo(() => ({
        zIndex: shouldHighlight && (!isFloorMode || isForegroundFloorFeature) ? floorLayerZIndex + 40 : floorLayerZIndex,
        fillColor: layer_type === 'parcels' ? "transparent" : (fill_color || "#888888"),
        strokeColor: shouldHighlight ? "#ffff00" : (layer_type === 'parcels' ? "#000" : layer_type === 'buildings' ? "#fff" : "transparent"),
        fillOpacity: finalOpacity,
        strokeWeight: shouldHighlight ? 4 : (layer_type === 'parcels' ? 1.5 : 0.4),
        clickable: isSelectable && (!isFloorMode || isActiveFloorFeature)
    }), [shouldHighlight, isFloorMode, isForegroundFloorFeature, floorLayerZIndex, layer_type, fill_color, finalOpacity, isSelectable, isActiveFloorFeature]);

    const handleClick = useCallback(() => {
        if (isSelectable) {
            onSelect(feature, isSelectable);
        }
    }, [feature, isSelectable, onSelect]);

    const handleMouseEnter = useCallback(() => {
        if (isSelectable) {
            onHoverStart(fid, layer_type);
        }
    }, [isSelectable, fid, layer_type, onHoverStart]);

    const polyProps = {
        options,
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: onHoverEnd
    };

    const isMulti = feature.geometry?.type === 'MultiPolygon';

    if (isMulti) {
        return (
            <>
                {formattedCoords.map((p, pi) => (
                    <Polygon key={`poly-${layer_type}-${fid}-${pi}`} paths={p} {...polyProps} />
                ))}
            </>
        );
    }

    return <Polygon key={`poly-${layer_type}-${fid}`} paths={formattedCoords} {...polyProps} />;
});

SpatialFeatureItem.displayName = 'SpatialFeatureItem';

/**
 * SpatialFeaturesRenderer Main Container
 */
export const SpatialFeaturesRenderer = memo(({
    spatialFeatures = [],
    visibleLayers = {},
    selectedLocation,
    editMode = false,
    hoveredFeature,
    activeFloor = 0,
    layerOpacity = {},
    isFloorMode = false,
    FLOOR_AWARE_LAYERS = [],
    FLOOR_LAYER_Z_INDEX = {},
    ACTIVE_FLOOR_Z_INDEX_BOOST = 50,
    formatCoords,
    setHoveredFeature,
    setSelectedLocation,
    setIsDrawerOpen,
    setActiveNavigationPath,
    setManualOriginNode,
    onFeatureSelect
}) => {
    // 1. Pre-calculate coordinate formatting and feature metadata in memory
    const processedList = useMemo(() => {
        return spatialFeatures.map(feature => {
            const props = feature.properties || {};
            const fid = props.fid;
            const layer_type = props.layer_type;
            const floor = Number.parseInt(props.floor || 0, 10);
            const featureFloor = Number.isNaN(floor) ? 0 : floor;

            const isLayerVisible = Boolean(visibleLayers[layer_type]);
            const isFloorAwareLayer = FLOOR_AWARE_LAYERS.includes(layer_type);
            const isGroundFloorFeature = featureFloor === 0;
            const isActiveFloorFeature = isFloorAwareLayer && featureFloor === activeFloor;
            const shouldRenderFloorAwareFeature = !isFloorAwareLayer ? true : (activeFloor === 0 ? isGroundFloorFeature : (isGroundFloorFeature || isActiveFloorFeature));

            if (!shouldRenderFloorAwareFeature) return null;

            const coords = formatCoords(feature.geometry?.coordinates);
            if (!coords || coords.length === 0) return null;

            // Check if feature is marked interactive in database (0/false means non-interactive)
            const isInteractiveFlag = props.is_interactive !== false && props.is_interactive !== 0 && props.is_interactive !== '0';
            const hasContent = Boolean(props.name || props.description || (props.wp_page_id && parseInt(props.wp_page_id, 10) > 0) || (props.gallery && props.gallery.length > 0));

            // In editMode, non-interactive features can be selected via the sidebar, but on map hover/click they strictly respect is_interactive
            const isSelectable = layer_type !== 'parcels' && layer_type !== 'paths' && isInteractiveFlag && (hasContent || editMode);

            return {
                feature,
                coords,
                fid,
                layer_type,
                featureFloor,
                isLayerVisible,
                isActiveFloorFeature,
                isSelectable,
                baseLayerZIndex: FLOOR_LAYER_Z_INDEX[layer_type] ?? 30,
                layerOpacityValue: layerOpacity[layer_type] ?? 0.5
            };
        }).filter(Boolean);
    }, [spatialFeatures, visibleLayers, activeFloor, FLOOR_AWARE_LAYERS, FLOOR_LAYER_Z_INDEX, layerOpacity, formatCoords, editMode]);

    // 2. Stable selection and hover callbacks
    const handleSelect = useCallback((feature, isSelectable) => {
        if (isSelectable) {
            setSelectedLocation({ ...feature.properties, geometry: feature.geometry });
            setIsDrawerOpen(true);
            setActiveNavigationPath(null);
            setManualOriginNode(null);
            onFeatureSelect?.(feature);
        } else {
            setSelectedLocation(null);
            setIsDrawerOpen(false);
            setActiveNavigationPath(null);
            setManualOriginNode(null);
        }
    }, [setSelectedLocation, setIsDrawerOpen, setActiveNavigationPath, setManualOriginNode, onFeatureSelect]);

    const handleHoverStart = useCallback((fid, layer_type) => {
        setHoveredFeature({ fid, layer_type });
    }, [setHoveredFeature]);

    const handleHoverEnd = useCallback(() => {
        setHoveredFeature(null);
    }, [setHoveredFeature]);

    return (
        <>
            {processedList.map((item) => {
                const { feature, coords, fid, layer_type } = item;

                // Fast string checks for selection and hover states
                const isSelected = selectedLocation && String(selectedLocation.fid) === String(fid) && selectedLocation.layer_type === layer_type;
                const isHovered = item.isSelectable && hoveredFeature && String(hoveredFeature.fid) === String(fid) && hoveredFeature.layer_type === layer_type;

                return (
                    <SpatialFeatureItem
                        key={`feat-${layer_type}-${fid}`}
                        feature={feature}
                        formattedCoords={coords}
                        isLayerVisible={item.isLayerVisible}
                        layerOpacityValue={item.layerOpacityValue}
                        isSelected={isSelected}
                        isHovered={isHovered}
                        isSelectable={item.isSelectable}
                        isFloorMode={isFloorMode}
                        isActiveFloorFeature={item.isActiveFloorFeature}
                        baseLayerZIndex={item.baseLayerZIndex}
                        ACTIVE_FLOOR_Z_INDEX_BOOST={ACTIVE_FLOOR_Z_INDEX_BOOST}
                        onSelect={handleSelect}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                    />
                );
            })}
        </>
    );
});

SpatialFeaturesRenderer.displayName = 'SpatialFeaturesRenderer';