import { useState, useEffect, useRef, Fragment, useMemo } from '@wordpress/element';
import Polygon from '../hooks/usePolygonHelper';
import Polyline from '../hooks/usePolylineHelper';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useCoordinateFormatter } from '../hooks/useCoordinateFormatter';
import DrawingSidebar from './drawer';
import { LayerToggler, FloorSwitcher } from './mapControls';
import { MapLegend } from './mapLegend';
import { MapSearch } from './mapSearch';
import { ZoomHandler } from './mapsZoomHandler';
import { MapLabels } from './mapLabels';
import { Spinner } from '@wordpress/components';
import MapErrorBoundary from './mapErrorBoundary';
import { __ } from '@wordpress/i18n'; 

import { useMapDimensions } from '../hooks/useMapDimensions';
import { useMapLayers } from '../hooks/useMapLayers';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { calculateSpatialBounds } from '../utils/mapBounds';
import { SpatialFeaturesRenderer } from './spatialFeaturesRenderer';
import { 
    MIN_MAP_ZOOM, MAX_MAP_TILT, OVERLAY_PAD, SPATIAL_DATA_ENDPOINT, 
    FLOOR_AWARE_LAYERS, FLOOR_LAYER_Z_INDEX, 
    ACTIVE_FLOOR_Z_INDEX_BOOST, FLOOR_OVERLAY_Z_INDEX, 
    normalizeSpatialFeature 
} from '../constants/mapConstants';
import { useMapUrlParams } from '../hooks/useMapUrlParams';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export default function BawBabIMaps({ 
    mapTypeProp = '', 
    locations: propsLocations = [], 
    zoom = 16, 
    tilt = 0, 
    onMarkerClick, 
    width = '100%', 
    height = 'stretch', 
    mapLogo, 
    navBackground, 
    colorTheme, 
    selectedLocationProp = null, 
    isDrawerOpenProp = false, 
    editMode = false, 
    onFeatureSelect,
    apiKeyProp = '', 
    mapIdProp = ''
}) {
    // 1. Reactive Container Dimension Hook
    const [dimensions, containerRef] = useMapDimensions();
    const isLayoutReady = dimensions.width > 0;

    const API_KEY = apiKeyProp || window.bwbimapsSettings?.googleApiKey || '';
    const MAP_ID = mapIdProp || window.bwbimapsSettings?.googleMapId || '';
    const MAP_TYPE = mapTypeProp || window.bwbimapsSettings?.mapType || 'roadmap';

    const { formatCoords } = useCoordinateFormatter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [locations, setLocations] = useState(propsLocations);
    const [isLoading, setIsLoading] = useState(propsLocations.length === 0);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const [isListeningForOriginClick, setIsListeningForOriginClick] = useState(false);
    const [manualOriginNode, setManualOriginNode] = useState(null);
    const [activeNavigationPath, setActiveNavigationPath] = useState(null);

    const [spatialFeatures, setSpatialFeatures] = useState([]);
    const [hoveredFeature, setHoveredFeature] = useState(null);
    const [viewportBounds, setViewportBounds] = useState(null);

    const { 
        visibleLayers, toggleLayer, layerOpacity, handleOpacityChange, 
        activeFloor, setActiveFloor, availableFloors 
    } = useMapLayers(spatialFeatures);

    // 2. Central Category & Color Manager
    const { categoryMap, processSpatialFeatures } = useCategoryManager();

    // Process spatial features with group IDs, display labels, and fill colors
    const processedSpatialFeatures = useMemo(() => {
        return processSpatialFeatures(spatialFeatures);
    }, [spatialFeatures, processSpatialFeatures]);

    // Build flat category-to-color lookup map for Legend component
    const categoryColorMap = useMemo(() => {
        const flatMap = {};
        Object.keys(categoryMap).forEach(cat => {
            flatMap[cat] = categoryMap[cat].color || '#007cba';
        });
        return flatMap;
    }, [categoryMap]);

    useMapUrlParams(spatialFeatures, setActiveFloor, setSelectedLocation, setIsDrawerOpen);

    const handleSidebarImageClick = (imageUrl) => { 
        setLightboxImage(imageUrl); 
        setIsLightboxOpen(true);
    };

    // 3. Compute Container-Relative Sidebar Width & Bounds
    const containerWidth = dimensions.width || 0;

    const sidebarWidth = useMemo(() => {
        if (!isDrawerOpen) return 0;
        if (containerWidth <= 768) return containerWidth;
        if (containerWidth <= 1024) return containerWidth * 0.5;
        return containerWidth * 0.35;
    }, [isDrawerOpen, containerWidth]);

    const spatialBounds = useMemo(() => {
        return calculateSpatialBounds(spatialFeatures, locations, isDrawerOpen, containerWidth, sidebarWidth);
    }, [spatialFeatures, locations, isDrawerOpen, containerWidth, sidebarWidth]);

    const defaultCenter = spatialBounds.center;
    const floorBounds = spatialBounds.bounds;

    const initialZoom = Number.isNaN(Number.parseInt(zoom, 10)) ? MIN_MAP_ZOOM : Math.max(MIN_MAP_ZOOM, Number.parseInt(zoom, 10));
    const initialTilt = Number.isNaN(Number.parseInt(tilt, 10)) ? 0 : Math.min(Math.max(0, Number.parseInt(tilt, 10)), MAX_MAP_TILT);
    const isFloorMode = activeFloor !== 0;

    const overlayBounds = viewportBounds || floorBounds;
    const floorOverlayPaths = [
        { lat: overlayBounds.north + OVERLAY_PAD, lng: overlayBounds.west - OVERLAY_PAD },
        { lat: overlayBounds.north + OVERLAY_PAD, lng: overlayBounds.east + OVERLAY_PAD },
        { lat: overlayBounds.south - OVERLAY_PAD, lng: overlayBounds.east + OVERLAY_PAD },
        { lat: overlayBounds.south - OVERLAY_PAD, lng: overlayBounds.west - OVERLAY_PAD },
    ];

    useEffect(() => {
        const fetchTableData = async () => {
            try {
                const response = await fetch(SPATIAL_DATA_ENDPOINT);
                const data = await response.json();
                if (data && data.features) {
                    setSpatialFeatures(data.features.map(normalizeSpatialFeature));
                }
            } catch (err) { console.error("Spatial Data Fetch Error:", err); }
        };
        fetchTableData();
    }, []);

    useEffect(() => {
        if (propsLocations.length > 0) return;
        const fetchGlobalSettings = async () => {
            try {
                const apiRootLink = document.querySelector('link[rel="https://api.w.org"]');
                const apiRoot = apiRootLink ? apiRootLink.href : '/wp-json/';
                const response = await fetch(`${apiRoot}bwb-imaps-federated-api/v1/map-locations`);
                if (response.ok) {
                    const data = await response.json();
                    setLocations(data.locations || []);
                }
            } catch (err) { console.error("Map Data Fetch Error:", err); }
            finally { setIsLoading(false); }
        };
        fetchGlobalSettings();
    }, []);
    
    useEffect(() => { 
        if (propsLocations.length > 0) {
            setLocations(propsLocations);
            setIsLoading(false);
        }
    }, [propsLocations]);

    useEffect(() => {
        if (editMode && selectedLocationProp) {
            const floor = Number.parseInt(selectedLocationProp.properties?.floor, 10);
            if (!Number.isNaN(floor)) setActiveFloor(floor);
            setSelectedLocation({ 
                ...selectedLocationProp.properties, 
                geometry: selectedLocationProp.geometry, 
                type: 'spatial',
                fid: selectedLocationProp.properties?.fid,
                layer_type: selectedLocationProp.properties?.layer_type 
            });
            setIsDrawerOpen(isDrawerOpenProp);
        }
    }, [selectedLocationProp, isDrawerOpenProp, editMode]);

    const handleMapClick = (e) => {
        if (!e.detail?.latLng) return;
        
        if (isListeningForOriginClick) {
            const clickedLat = e.detail.latLng.lat;
            const clickedLng = e.detail.latLng.lng;

            const dynamicPinLocationObject = {
                name: `${__('Pinned Location', TEXT_DOMAIN)} (${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)})`,
                lat: clickedLat,
                lng: clickedLng,
                floor: activeFloor
            };

            setManualOriginNode(dynamicPinLocationObject);
            setIsListeningForOriginClick(false);
            return; 
        }

        setSelectedLocation(null); 
        setIsDrawerOpen(false);
        setActiveNavigationPath(null);
        setManualOriginNode(null);
    };

    return (
        <div className={`map-theme-${colorTheme || 'blue'}`} style={{ display: 'flex', flexDirection: 'column', width, height, background: '#f0f0f0', overflow: 'hidden' }}>
            
            {isLayoutReady && (
                <MapSearch 
                    spatialFeatures={processedSpatialFeatures.filter(f => f.properties.layer_type === 'buildings' || f.properties.layer_type === 'land_use')}
                    locations={locations} 
                    onSelect={(item) => {
                        if (item.type === 'spatial') {
                            const floor = Number.parseInt(item.floor ?? item.properties?.floor, 10);
                            if (!Number.isNaN(floor)) setActiveFloor(floor);
                            setSelectedLocation({ ...item, geometry: processedSpatialFeatures.find(f => f.properties.fid === item.fid)?.geometry });
                        } else {
                            setSelectedLocation(item);
                        }
                        setIsDrawerOpen(true);
                        setActiveNavigationPath(null); 
                        setManualOriginNode(null);
                    }}
                    logoProp={mapLogo}
                    navBackgroundProp={navBackground}
                />
            )}

            <div ref={containerRef} style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', cursor: isListeningForOriginClick ? 'crosshair' : 'default' }}>
                
                {!isLayoutReady && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>}

                {isLayoutReady && (
                    <MapErrorBoundary key={`error-boundary-${API_KEY}`}>
                        <APIProvider apiKey={API_KEY} key={`provider-${API_KEY}`}>
                            <div style={{ height: '100%', width: '100%', opacity: isLayoutReady ? 1 : 0 }}>
                                {isLightboxOpen && (
                                    <div className="map-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
                                        <button className="lightbox-close-btn">&times;</button>
                                        <div className="lightbox-img-frame" onClick={(e) => e.stopPropagation()}>
                                            <img src={lightboxImage} alt="Large format" />
                                        </div>
                                    </div>
                                )}
                                {!editMode && (
                                    <Fragment>
                                        <DrawingSidebar isOpen={isDrawerOpen} 
                                            selectedLoc={selectedLocation ? { ...selectedLocation, manualOriginNode,
                                                onTriggerOriginPick: setIsListeningForOriginClick
                                            } : null}
                                            onClose={() => { setIsDrawerOpen(false); setActiveNavigationPath(null); setManualOriginNode(null); }} 
                                            onImageClick={handleSidebarImageClick}
                                            mapDimensions={dimensions}
                                            onRouteGenerated={(route) => setActiveNavigationPath(route)}
                                            onRouteCleared={() => { setActiveNavigationPath(null); setManualOriginNode(null); }}
                                        />
                                        <MapLegend mapDimensions={dimensions} categoryColorMap={categoryColorMap} />
                                    </Fragment>
                                )}

                                <LayerToggler 
                                    mapDimensions={dimensions} 
                                    visibleLayers={visibleLayers} 
                                    layerOpacity={layerOpacity} 
                                    onToggle={toggleLayer} 
                                    onOpacityChange={handleOpacityChange}
                                />

                                <FloorSwitcher 
                                    mapDimensions={dimensions} 
                                    activeFloor={activeFloor} 
                                    onFloorChange={setActiveFloor} 
                                    availableFloors={availableFloors} 
                                />

                                <Map key={`${locations.length}-${initialZoom}-${initialTilt}`} mapTypeId={MAP_TYPE} 
                                    defaultCenter={defaultCenter} defaultZoom={initialZoom} minZoom={MIN_MAP_ZOOM}
                                    defaultTilt={initialTilt} mapId={MAP_ID} fullscreenControl={false} gestureHandling={'greedy'} 
                                    onBoundsChanged={(e) => setViewportBounds(e.detail.bounds)}
                                    onClick={handleMapClick} restriction={{ latLngBounds: floorBounds, strictBounds: false }}
                                >
                                    <ZoomHandler 
                                        selectedLocation={selectedLocation} 
                                        isDrawerOpen={isDrawerOpen} 
                                        editMode={editMode} 
                                        containerRef={containerRef}
                                    />

                                    {isFloorMode && (
                                        <Polygon paths={floorOverlayPaths} options={{ zIndex: FLOOR_OVERLAY_Z_INDEX, fillColor: activeFloor > 0 ? '#ffffff' : '#000000',
                                            fillOpacity: activeFloor > 0 ? 0.72 : 0.65, strokeWeight: 0, clickable: false }}
                                        />
                                    )}

                                    {activeNavigationPath && activeNavigationPath.coordinates && (
                                        <Polyline paths={activeNavigationPath.coordinates.filter(coord => coord.floor === activeFloor && coord.isProjectionConnectorArc)}
                                            options={{
                                                strokeOpacity: 0,
                                                icons: [{
                                                    icon: {
                                                        path: 'M 0,-1 0,1',
                                                        strokeOpacity: 0.85,
                                                        strokeWeight: 4,
                                                        strokeColor: '#007cba'
                                                    },
                                                    offset: '0',
                                                    repeat: '15px'
                                                }],
                                                zIndex: FLOOR_OVERLAY_Z_INDEX + 490,
                                                clickable: false
                                            }}
                                        />
                                    )}

                                    {activeNavigationPath && activeNavigationPath.coordinates && (
                                        <Polyline paths={activeNavigationPath.coordinates.filter(coord => coord.floor === activeFloor && !coord.isProjectionConnectorArc)}
                                            options={{ strokeColor: '#007cba', strokeOpacity: 0.95, strokeWeight: 6, zIndex: FLOOR_OVERLAY_Z_INDEX + 500, clickable: false }}
                                        />
                                    )}

                                    {visibleLayers.markers && locations.map((loc, index) => {
                                        const mLat = parseFloat(loc.lat);
                                        const mLng = parseFloat(loc.lng);
                                        if (isNaN(mLat) || isNaN(mLng) || loc.showMarker === false) return null;
                                        const markerPos = { lat: mLat, lng: mLng };
                                        return (
                                            <Fragment key={index}>
                                                <AdvancedMarker position={markerPos} zIndex={2000} onClick={() => { setIsDrawerOpen(true); setSelectedLocation(loc); setActiveNavigationPath(null); setManualOriginNode(null); if (onMarkerClick) onMarkerClick(loc); }}>
                                                    <Pin background={'#004a99'} glyphColor={'#fff'} borderColor={'#000'} />
                                                </AdvancedMarker>
                                            </Fragment>
                                        );
                                    })}

                                    {visibleLayers.labels && processedSpatialFeatures.length > 0 && (
                                        <MapLabels 
                                            features={processedSpatialFeatures.filter(f => f.properties?.show_label !== false)} 
                                            visibleLayers={visibleLayers} 
                                            activeFloor={activeFloor} 
                                            markerZIndex={FLOOR_OVERLAY_Z_INDEX + 120}
                                            editMode={editMode}
                                        />
                                    )}

                                    <SpatialFeaturesRenderer
                                        spatialFeatures={processedSpatialFeatures}
                                        visibleLayers={visibleLayers}
                                        selectedLocation={selectedLocation}
                                        editMode={editMode}
                                        hoveredFeature={hoveredFeature}
                                        activeFloor={activeFloor}
                                        layerOpacity={layerOpacity}
                                        isFloorMode={isFloorMode}
                                        FLOOR_AWARE_LAYERS={FLOOR_AWARE_LAYERS}
                                        FLOOR_LAYER_Z_INDEX={FLOOR_LAYER_Z_INDEX}
                                        ACTIVE_FLOOR_Z_INDEX_BOOST={ACTIVE_FLOOR_Z_INDEX_BOOST}
                                        formatCoords={formatCoords}
                                        setHoveredFeature={setHoveredFeature}
                                        setSelectedLocation={setSelectedLocation}
                                        setIsDrawerOpen={setIsDrawerOpen}
                                        setActiveNavigationPath={setActiveNavigationPath}
                                        setManualOriginNode={setManualOriginNode}
                                        onFeatureSelect={onFeatureSelect}
                                    />
                                </Map>
                            </div>
                        </APIProvider>
                    </MapErrorBoundary>
                )}
            </div>
        </div>
    );
}