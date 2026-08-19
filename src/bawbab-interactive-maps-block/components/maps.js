/**
 * Main Map Renderer Component
 * File: src/components/maps.jsx
 */

import {
    useState,
    useEffect,
    Fragment,
    useMemo,
} from '@wordpress/element';
import Polygon from '../hooks/usePolygonHelper';
import Polyline from '../hooks/usePolylineHelper';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
} from '@vis.gl/react-google-maps';
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
import { useCategoryManager } from '../../bawbab-interactive-maps-admin/category-editor-page/hooks/useCategoryManager';
import { useTypographySettings } from '../../bawbab-interactive-maps-admin/map-settings-page/hooks/useTypographySettings';
import { calculateSpatialBounds } from '../utils/mapBounds';
import { SpatialFeaturesRenderer } from './spatialFeaturesRenderer';
import {
    MIN_MAP_ZOOM,
    MAX_MAP_TILT,
    OVERLAY_PAD,
    SPATIAL_DATA_ENDPOINT,
    FLOOR_AWARE_LAYERS,
    FLOOR_LAYER_Z_INDEX,
    ACTIVE_FLOOR_Z_INDEX_BOOST,
    FLOOR_OVERLAY_Z_INDEX,
    normalizeSpatialFeature,
} from '../constants/mapConstants';
import { useMapUrlParams } from '../hooks/useMapUrlParams';

export default function BawBabIMaps( {
    colorThemeProp,
    mapLogoProp,
    mapTitleProp,
    mapDescriptionProp,
    navBackgroundProp,
    apiKeyProp,
    mapIdProp,
    mapTypeProp,
    locations: propsLocations = [],
    zoom = null, // Default to null so component can scale dynamically
    tilt = 0,
    width = '100%',
    height = 'stretch',
    selectedLocationProp = null,
    isDrawerOpenProp = false,
    editMode = false,
    onMarkerClick,
    onFeatureSelect,
} ) {
    const [ dimensions, containerRef ] = useMapDimensions();
    const isLayoutReady = dimensions.width > 0;

    // Direct Prop Resolution
    const API_KEY = apiKeyProp || '';
    const MAP_ID = mapIdProp || '';
    const MAP_TYPE = mapTypeProp || 'roadmap';
    const COLOR_THEME = colorThemeProp || 'blue';
    const MAP_LOGO = mapLogoProp || '';
    const NAV_BACKGROUND = navBackgroundProp || '';

    const activeTypographyInput = useMemo( () => {
        return (
            selectedLocationProp?.properties?.typography ||
            selectedLocationProp?.typography ||
            {}
        );
    }, [ selectedLocationProp?.properties?.typography, selectedLocationProp?.typography ] );

    const { cssVariables } = useTypographySettings( activeTypographyInput );

    const { formatCoords } = useCoordinateFormatter();
    const [ isDrawerOpen, setIsDrawerOpen ] = useState( false );
    const [ locations, setLocations ] = useState( propsLocations );
    const [ isLoading, setIsLoading ] = useState( propsLocations.length === 0 );
    const [ selectedLocation, setSelectedLocation ] = useState( null );
    const [ isLightboxOpen, setIsLightboxOpen ] = useState( false );
    const [ lightboxImage, setLightboxImage ] = useState( null );

    const [ isListeningForOriginClick, setIsListeningForOriginClick ] = useState( false );
    const [ manualOriginNode, setManualOriginNode ] = useState( null );
    const [ activeNavigationPath, setActiveNavigationPath ] = useState( null );

    const [ spatialFeatures, setSpatialFeatures ] = useState( [] );
    const [ hoveredFeature, setHoveredFeature ] = useState( null );
    const [ viewportBounds, setViewportBounds ] = useState( null );

    const {
        visibleLayers,
        toggleLayer,
        layerOpacity,
        handleOpacityChange,
        activeFloor,
        setActiveFloor,
        availableFloors,
    } = useMapLayers( spatialFeatures );

    const { categoryMap, processSpatialFeatures } = useCategoryManager();

    const processedSpatialFeatures = useMemo( () => {
        return processSpatialFeatures( spatialFeatures );
    }, [ spatialFeatures, processSpatialFeatures ] );

    const categoryColorMap = useMemo( () => {
        const flatMap = {};
        Object.keys( categoryMap ).forEach( ( cat ) => {
            flatMap[ cat ] = categoryMap[ cat ].color || '#007cba';
        } );
        return flatMap;
    }, [ categoryMap ] );

    useMapUrlParams(
        spatialFeatures,
        setActiveFloor,
        setSelectedLocation,
        setIsDrawerOpen
    );

    const handleSidebarImageClick = ( imageUrl ) => {
        setLightboxImage( imageUrl );
        setIsLightboxOpen( true );
    };

    const containerWidth = dimensions.width || 0;

    const sidebarWidth = useMemo( () => {
        if ( ! isDrawerOpen ) return 0;
        if ( containerWidth <= 768 ) return containerWidth;
        if ( containerWidth <= 1024 ) return containerWidth * 0.5;
        return containerWidth * 0.35;
    }, [ isDrawerOpen, containerWidth ] );

    const spatialBounds = useMemo( () => {
        return calculateSpatialBounds(
            spatialFeatures,
            locations,
            isDrawerOpen,
            containerWidth,
            sidebarWidth
        );
    }, [
        spatialFeatures,
        locations,
        isDrawerOpen,
        containerWidth,
        sidebarWidth,
    ] );

    const defaultCenter = spatialBounds.center;
    const floorBounds = spatialBounds.bounds;

    /**
     * DYNAMIC MINIMUM & DEFAULT ZOOM CALCULATION
     * Evaluates geographic span of bounding box.
     * High span (e.g. US to Belgium) scales zoom down so whole world/region is visible immediately.
     */
    // 1. Dynamic Minimum Zoom (computed from bounding box span)
    const dynamicMinZoom = useMemo( () => {
        if ( ! floorBounds ) return MIN_MAP_ZOOM;

        const latSpan = Math.abs( floorBounds.north - floorBounds.south );
        const lngSpan = Math.abs( floorBounds.east - floorBounds.west );
        const maxSpan = Math.max( latSpan, lngSpan );

        if ( maxSpan > 40 ) return 2;   // Intercontinental (US to Europe)
        if ( maxSpan > 15 ) return 3;   // Country-wide
        if ( maxSpan > 5 )  return 6;   // Regional
        if ( maxSpan > 1 )  return 9;   // City-wide
        if ( maxSpan > 0.1 ) return 12; // District

        return MIN_MAP_ZOOM; // Local campus zoom
    }, [ floorBounds ] );

    // 2. Initial Zoom Resolution: Custom prop wins if valid, otherwise dynamicMinZoom
    const parsedZoom = zoom !== null && zoom !== undefined ? Number.parseInt( zoom, 10 ) : NaN;
    const initialZoom = ! Number.isNaN( parsedZoom ) && parsedZoom > 0
        ? Math.max( dynamicMinZoom, parsedZoom ) // Keep at or above minZoom to prevent map restriction crashes
        : dynamicMinZoom;

    // 3. Initial Tilt Resolution
    const parsedTilt = Number.parseInt( tilt, 10 );
    const initialTilt = ! Number.isNaN( parsedTilt )
        ? Math.min( Math.max( 0, parsedTilt ), MAX_MAP_TILT )
        : 0;
    const isFloorMode = activeFloor !== 0;

    const overlayBounds = viewportBounds || floorBounds;
    const floorOverlayPaths = [
        {
            lat: overlayBounds.north + OVERLAY_PAD,
            lng: overlayBounds.west - OVERLAY_PAD,
        },
        {
            lat: overlayBounds.north + OVERLAY_PAD,
            lng: overlayBounds.east + OVERLAY_PAD,
        },
        {
            lat: overlayBounds.south - OVERLAY_PAD,
            lng: overlayBounds.east + OVERLAY_PAD,
        },
        {
            lat: overlayBounds.south - OVERLAY_PAD,
            lng: overlayBounds.west - OVERLAY_PAD,
        },
    ];

    // Fetch GeoJSON spatial features
    useEffect( () => {
        const fetchTableData = async () => {
            try {
                const response = await fetch( SPATIAL_DATA_ENDPOINT );
                const data = await response.json();
                if ( data && data.features ) {
                    setSpatialFeatures(
                        data.features.map( normalizeSpatialFeature )
                    );
                }
            } catch ( err ) {
                console.error( 'Spatial Data Fetch Error:', err );
            }
        };
        fetchTableData();
    }, [] );

    // Sync locations from props
    useEffect( () => {
        if ( propsLocations.length > 0 ) {
            setLocations( propsLocations );
            setIsLoading( false );
        }
    }, [ propsLocations ] );

    useEffect( () => {
        if ( editMode && selectedLocationProp ) {
            const floor = Number.parseInt(
                selectedLocationProp.properties?.floor,
                10
            );
            if ( ! Number.isNaN( floor ) ) setActiveFloor( floor );
            setSelectedLocation( {
                ...selectedLocationProp.properties,
                geometry: selectedLocationProp.geometry,
                type: 'spatial',
                fid: selectedLocationProp.properties?.fid,
                layer_type: selectedLocationProp.properties?.layer_type,
            } );
            setIsDrawerOpen( isDrawerOpenProp );
        }
    }, [ selectedLocationProp, isDrawerOpenProp, editMode ] );

    const handleMapClick = ( e ) => {
        if ( ! e.detail?.latLng ) return;

        if ( isListeningForOriginClick ) {
            const clickedLat = e.detail.latLng.lat;
            const clickedLng = e.detail.latLng.lng;

            const dynamicPinLocationObject = {
                name: `${ __(
                    'Pinned Location',
                    'bawbab-interactive-maps'
                ) } (${ clickedLat.toFixed( 4 ) }, ${ clickedLng.toFixed(
                    4
                ) })`,
                lat: clickedLat,
                lng: clickedLng,
                floor: activeFloor,
            };

            setManualOriginNode( dynamicPinLocationObject );
            setIsListeningForOriginClick( false );
            return;
        }

        setSelectedLocation( null );
        setIsDrawerOpen( false );
        setActiveNavigationPath( null );
        setManualOriginNode( null );
    };

    return (
        <div
            className={ `map-theme-${ COLOR_THEME } map-container` }
            style={ {
                ...cssVariables,
                display: 'flex',
                flexDirection: 'column',
                width,
                height,
                background: '#f0f0f0',
                overflow: 'hidden',
            } }
        >
            { isLayoutReady && (
                <MapSearch
                    spatialFeatures={ processedSpatialFeatures.filter(
                        ( f ) =>
                            f.properties.layer_type === 'buildings' ||
                            f.properties.layer_type === 'land_use'
                    ) }
                    locations={ locations }
                    onSelect={ ( item ) => {
                        if ( item.type === 'spatial' ) {
                            const floor = Number.parseInt(
                                item.floor ?? item.properties?.floor,
                                10
                            );
                            if ( ! Number.isNaN( floor ) )
                                setActiveFloor( floor );
                            setSelectedLocation( {
                                ...item,
                                geometry: processedSpatialFeatures.find(
                                    ( f ) => f.properties.fid === item.fid
                                )?.geometry,
                            } );
                        } else {
                            setSelectedLocation( item );
                        }
                        setIsDrawerOpen( true );
                        setActiveNavigationPath( null );
                        setManualOriginNode( null );
                    } }
                    logoProp={ MAP_LOGO }
                    mapTitleProp={ mapTitleProp }
                    mapDescriptionProp={ mapDescriptionProp }
                    navBackgroundProp={ NAV_BACKGROUND }
                />
            ) }

            <div
                ref={ containerRef }
                style={ {
                    flex: 1,
                    position: 'relative',
                    width: '100%',
                    overflow: 'hidden',
                    cursor: isListeningForOriginClick ? 'crosshair' : 'default',
                } }
            >
                { ( ! isLayoutReady || ! API_KEY ) && (
                    <div
                        style={ {
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        } }
                    >
                        <Spinner />
                    </div>
                ) }

                { isLayoutReady && API_KEY && (
                    <MapErrorBoundary key={ `error-boundary-${ API_KEY }` }>
                        <APIProvider
                            apiKey={ API_KEY }
                            key={ `provider-${ API_KEY }` }
                        >
                            <div
                                style={ {
                                    height: '100%',
                                    width: '100%',
                                    opacity: isLayoutReady ? 1 : 0,
                                } }
                            >
                                { isLightboxOpen && (
                                    <div
                                        className="map-lightbox-overlay"
                                        onClick={ () =>
                                            setIsLightboxOpen( false )
                                        }
                                    >
                                        <button className="lightbox-close-btn">
                                            &times;
                                        </button>
                                        <div
                                            className="lightbox-img-frame"
                                            onClick={ ( e ) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <img
                                                src={ lightboxImage }
                                                alt="Large format"
                                            />
                                        </div>
                                    </div>
                                ) }
                                { ! editMode && (
                                    <Fragment>
                                        <DrawingSidebar
                                            isOpen={ isDrawerOpen }
                                            selectedLoc={
                                                selectedLocation
                                                    ? {
                                                            ...selectedLocation,
                                                            manualOriginNode,
                                                            onTriggerOriginPick:
                                                                setIsListeningForOriginClick,
                                                      }
                                                    : null
                                            }
                                            onClose={ () => {
                                                setIsDrawerOpen( false );
                                                setActiveNavigationPath( null );
                                                setManualOriginNode( null );
                                            } }
                                            onImageClick={
                                                handleSidebarImageClick
                                            }
                                            mapDimensions={ dimensions }
                                            onRouteGenerated={ ( route ) =>
                                                setActiveNavigationPath( route )
                                            }
                                            onRouteCleared={ () => {
                                                setActiveNavigationPath( null );
                                                setManualOriginNode( null );
                                            } }
                                        />
                                        <MapLegend
                                            mapDimensions={ dimensions }
                                            categoryColorMap={
                                                categoryColorMap
                                            }
                                        />
                                    </Fragment>
                                ) }

                                <LayerToggler
                                    mapDimensions={ dimensions }
                                    visibleLayers={ visibleLayers }
                                    layerOpacity={ layerOpacity }
                                    onToggle={ toggleLayer }
                                    onOpacityChange={ handleOpacityChange }
                                />

                                <FloorSwitcher
                                    mapDimensions={ dimensions }
                                    activeFloor={ activeFloor }
                                    onFloorChange={ setActiveFloor }
                                    availableFloors={ availableFloors }
                                />

                                <Map
                                    key={ `map-${ locations.length }-${ initialZoom }-${ initialTilt }-${ dynamicMinZoom }` }
                                    mapTypeId={ MAP_TYPE }
                                    defaultCenter={ defaultCenter }
                                    defaultZoom={ initialZoom }
                                    minZoom={ dynamicMinZoom }
                                    defaultTilt={ initialTilt }
                                    mapId={ MAP_ID }
                                    fullscreenControl={ false }
                                    gestureHandling={ 'greedy' }
                                    onBoundsChanged={ ( e ) =>
                                        setViewportBounds( e.detail.bounds )
                                    }
                                    onClick={ handleMapClick }
                                    restriction={ {
                                        latLngBounds: floorBounds,
                                        strictBounds: false,
                                    } }
                                >
                                    <ZoomHandler
                                        selectedLocation={ selectedLocation }
                                        isDrawerOpen={ isDrawerOpen }
                                        editMode={ editMode }
                                        containerRef={ containerRef }
                                    />

                                    { isFloorMode && (
                                        <Polygon
                                            paths={ floorOverlayPaths }
                                            options={ {
                                                zIndex: FLOOR_OVERLAY_Z_INDEX,
                                                fillColor:
                                                    activeFloor > 0
                                                        ? '#ffffff'
                                                        : '#000000',
                                                fillOpacity:
                                                    activeFloor > 0
                                                        ? 0.72
                                                        : 0.65,
                                                strokeWeight: 0,
                                                clickable: false,
                                            } }
                                        />
                                    ) }

                                    { activeNavigationPath &&
                                        activeNavigationPath.coordinates && (
                                            <Polyline
                                                paths={ activeNavigationPath.coordinates.filter(
                                                    ( coord ) =>
                                                        coord.floor ===
                                                            activeFloor &&
                                                        coord.isProjectionConnectorArc
                                                ) }
                                                options={ {
                                                    strokeOpacity: 0,
                                                    icons: [
                                                        {
                                                            icon: {
                                                                path: 'M 0,-1 0,1',
                                                                strokeOpacity: 0.85,
                                                                strokeWeight: 4,
                                                                strokeColor:
                                                                    '#007cba',
                                                            },
                                                            offset: '0',
                                                            repeat: '15px',
                                                        },
                                                    ],
                                                    zIndex:
                                                        FLOOR_OVERLAY_Z_INDEX +
                                                        490,
                                                    clickable: false,
                                                } }
                                            />
                                        ) }

                                    { activeNavigationPath &&
                                        activeNavigationPath.coordinates && (
                                            <Polyline
                                                paths={ activeNavigationPath.coordinates.filter(
                                                    ( coord ) =>
                                                        coord.floor ===
                                                            activeFloor &&
                                                        ! coord.isProjectionConnectorArc
                                                ) }
                                                options={ {
                                                    strokeColor: '#007cba',
                                                    strokeOpacity: 0.95,
                                                    strokeWeight: 6,
                                                    zIndex:
                                                        FLOOR_OVERLAY_Z_INDEX +
                                                        500,
                                                    clickable: false,
                                                } }
                                            />
                                        ) }

                                    { visibleLayers.markers &&
                                        locations.map( ( loc, index ) => {
                                            const mLat = parseFloat( loc.lat );
                                            const mLng = parseFloat( loc.lng );
                                            if (
                                                isNaN( mLat ) ||
                                                isNaN( mLng ) ||
                                                loc.showMarker === false
                                            )
                                                return null;
                                            const markerPos = {
                                                lat: mLat,
                                                lng: mLng,
                                            };
                                            return (
                                                <Fragment key={ index }>
                                                    <AdvancedMarker
                                                        position={ markerPos }
                                                        zIndex={ 2000 }
                                                        onClick={ () => {
                                                            setIsDrawerOpen(
                                                                true
                                                            );
                                                            setSelectedLocation(
                                                                loc
                                                            );
                                                            setActiveNavigationPath(
                                                                null
                                                            );
                                                            setManualOriginNode(
                                                                null
                                                            );
                                                            if ( onMarkerClick )
                                                                onMarkerClick(
                                                                    loc
                                                                );
                                                        } }
                                                    >
                                                        <Pin
                                                            background={
                                                                '#004a99'
                                                            }
                                                            glyphColor={
                                                                '#fff'
                                                            }
                                                            borderColor={
                                                                '#000'
                                                            }
                                                        />
                                                    </AdvancedMarker>
                                                </Fragment>
                                            );
                                        } ) }

                                    { visibleLayers.labels &&
                                        processedSpatialFeatures.length > 0 && (
                                            <MapLabels
                                                features={ processedSpatialFeatures.filter(
                                                    ( f ) =>
                                                        f.properties
                                                            ?.show_label !==
                                                        false
                                                ) }
                                                visibleLayers={ visibleLayers }
                                                activeFloor={ activeFloor }
                                                markerZIndex={
                                                    FLOOR_OVERLAY_Z_INDEX + 120
                                                }
                                                editMode={ editMode }
                                            />
                                        ) }

                                    <SpatialFeaturesRenderer
                                        spatialFeatures={
                                            processedSpatialFeatures
                                        }
                                        visibleLayers={ visibleLayers }
                                        selectedLocation={ selectedLocation }
                                        editMode={ editMode }
                                        hoveredFeature={ hoveredFeature }
                                        activeFloor={ activeFloor }
                                        layerOpacity={ layerOpacity }
                                        isFloorMode={ isFloorMode }
                                        FLOOR_AWARE_LAYERS={
                                            FLOOR_AWARE_LAYERS
                                        }
                                        FLOOR_LAYER_Z_INDEX={
                                            FLOOR_LAYER_Z_INDEX
                                        }
                                        ACTIVE_FLOOR_Z_INDEX_BOOST={
                                            ACTIVE_FLOOR_Z_INDEX_BOOST
                                        }
                                        formatCoords={ formatCoords }
                                        setHoveredFeature={ setHoveredFeature }
                                        setSelectedLocation={
                                            setSelectedLocation
                                        }
                                        setIsDrawerOpen={ setIsDrawerOpen }
                                        setActiveNavigationPath={
                                            setActiveNavigationPath
                                        }
                                        setManualOriginNode={
                                            setManualOriginNode
                                        }
                                        onFeatureSelect={ onFeatureSelect }
                                    />
                                </Map>
                            </div>
                        </APIProvider>
                    </MapErrorBoundary>
                ) }
            </div>
        </div>
    );
}