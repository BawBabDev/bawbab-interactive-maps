import { useState, useEffect, Fragment } from '@wordpress/element';
import Polygon from './hooks/usePolygonHelper';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useCoordinateFormatter } from '../admin/coordinateFormatter';
import DrawingSidebar from './drawer';
import { MapLegend, LayerToggler } from './components/mapControls';
import { MapSearch } from './components/mapSearch';
import { __ } from '@wordpress/i18n';

export default function Map({ locations: propsLocations = [],  zoom = 16, tilt = 0 , onMarkerClick, width = '100%', height = 'stretch' }) {

    const { formatCoords } = useCoordinateFormatter();

    // State for GraphQL Data
    // const [parcelPath, setParcelPath] = useState(null);
    // const [gqlBuildings, setGqlBuildings] = useState([]);
    // Tracks which marker's InfoWindow is currently open
    const [openIndex, setOpenIndex] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen ] = useState(false);
    const [locations, setLocations] = useState(propsLocations);
     const [isLoading, setIsLoading] = useState(propsLocations.length === 0);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Layer control states
    const [visibleLayers, setVisibleLayers] = useState({
            parcels: true,
            buildings: true,
            paths: true,
            land_use: true
        });
    const toggleLayer = (layer) => {
        setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };
    const [layerOpacity, setLayerOpacity] = useState({
        parcels: 1.0,
        buildings: 1.0,
        paths: 1.0,
        land_use: 1.0
    });
    const handleOpacityChange = (layer, val) => {
        setLayerOpacity(prev => ({ ...prev, [layer]: val }));
    };

    // State for Custom Table Spatial Data (Parcels, Buildings, Paths, Land Use)
    const [spatialFeatures, setSpatialFeatures] = useState([]);

    // console.log("Locations received by component:", locations);
    const API_KEY = 'AIzaSyBeiJUEPnmIVlYaIzg41wOMsS0sNqb9XnE';
    const MAP_ID = 'aaeca3e0a49d01ecc82e3f92b1c8e9';

    // const GRAPHQL_ENDPOINT = 'https://34.149.108.92.nip.io/internal-frontend-api/api/graphql';
    const GRAPHQL_PROXY__ENDPOINT = '/wp-json/bawbab-interactive-map/v1/bwb_imaps_proxy_graphql';
    const SPATIAL_DATA_ENDPOINT = '/wp-json/bawbab-interactive-map/v1/get-spatial-data';

    //Fetch Data from GraphQL Proxy
    // useEffect(() => {
    //     const fetchGqlData = async () => {
    //         const query = `
    //             query GetParcelAndBuildings($lat: Float!, $lng: Float!) {
    //                 parcelOnPoint(lat: $lat, lng: $lng) {
    //                     geom
    //                     buildings {
    //                         building_plus_code
    //                         lat
    //                         lng
    //                         geom
    //                     }
    //                 }
    //             }`;

    //         try {
    //             const response = await fetch(GRAPHQL_ENDPOINT, {
    //                 method: 'POST',
    //                 headers: { 
    //                     'Content-Type': 'application/json',
    //                     'x-api-key': GQL_API_KEY // Added API Key here
    //                 },
    //                 body: JSON.stringify({
    //                     query,
    //                     variables: { lat: 40.202687, lng: -75.251563 }
    //                 })
    //             });

    //             const response = await fetch(GRAPHQL_PROXY__ENDPOINT, {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ query, variables: { lat: 40.202687, lng: -75.251563 } })
    //             });

    //             const result = await response.json();
    //             const data = result.data?.parcelOnPoint;

    //             if (data) {
    //                 setParcelPath(formatCoords(data.geom.coordinates));
    //                 setGqlBuildings(data.buildings);
    //             }
    //         } catch (err) {
    //             console.error("GraphQL Fetch Error:", err);
    //         }
    //     };
    //     fetchGqlData();
    // }, [formatCoords]);


    //Fetch Data from Custom WordPress Spatial Table
    useEffect(() => {
        const fetchTableData = async () => {
            try {
                const response = await fetch(SPATIAL_DATA_ENDPOINT);
                const data = await response.json(); // This is the FeatureCollection
                if (data && data.features) {
                    setSpatialFeatures(data.features);
                }
            } catch (err) {
                console.error("Spatial Data Fetch Error:", err);
            }
        };

        fetchTableData();
    }, []);

    //Sync state with props (Used for the Settings Page sidebar updates)
    useEffect(() => {
        if (propsLocations.length > 0) {
            setLocations(propsLocations);
            setIsLoading(false);
        }
    }, [propsLocations]);
    

    // Fetch global settings only if we don't have locations from settings page
    useEffect(() => {
        if (propsLocations.length > 0) return;

        const fetchGlobalSettings = async () => {
            try {
                const apiRootLink = document.querySelector('link[rel="https://api.w.org"]');
                const apiRoot = apiRootLink ? apiRootLink.href : '/wp-json/';
                
                // UPDATED: Pointed to the new REST API namespace
                const response = await fetch(`${apiRoot}bwb-imaps-federated-api/v1/map-locations`);
                if (response.ok) {
                    const data = await response.json();
                    setLocations(data.locations || []);
                }
            } catch (err) {
                console.error("Map Data Fetch Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlobalSettings();
    }, []);

    // Determine the map's default center based on the first location
    // Fallback to estate coordinates if the list is empty
    const firstLoc = locations[0];
    const defaultCenter = {
        lat: parseFloat(firstLoc?.lat) || 40.202687,
        lng: parseFloat(firstLoc?.lng) || -75.251563
    };

    return (
        <div style={{ 
            display: 'flex', 
            width: width, 
            height: height, 
            minHeight: height,
            position: 'relative', 
            overflow: 'hidden',
            paddingTop: '60px' // padding to make space for the fixed-ish navbar
        }}>
            <APIProvider apiKey={API_KEY}>
                {/* Search Navbar on Top */}
                <MapSearch 
                    spatialFeatures={spatialFeatures} 
                    locations={locations} 
                    onSelect={(item) => {
                        setSelectedLocation(item);
                        setIsDrawerOpen(true);
                    }}
                />

                <DrawingSidebar 
                    isOpen={isDrawerOpen} 
                    onClose={() => {
                        setIsDrawerOpen(false);
                        setSelectedLocation(null); 
                    }} 
                    selectedLoc={selectedLocation}
                />
                <MapLegend />
                <LayerToggler 
                    visibleLayers={visibleLayers} 
                    layerOpacity={layerOpacity}
                    onToggle={toggleLayer} 
                    onOpacityChange={handleOpacityChange}
                />
                <Map 
                    key={locations.length} 
                    defaultCenter={defaultCenter} 
                    defaultZoom={parseInt(zoom) || 15} 
                    defaultTilt={parseInt(tilt) || 0} 
                    mapId={MAP_ID} 
                    fullscreenControl={false}
                    restriction={{
                        latLngBounds: {
                            north: defaultCenter.lat + 0.01,
                            south: defaultCenter.lat - 0.015,
                            east: defaultCenter.lng + 0.02,
                            west: defaultCenter.lng - 0.02,
                        },
                        strictBounds: false
                    }}
                >
                    {/* Parcel Boundary */}
                    {/* {parcelPath && (
                        <Polygon paths={parcelPath} options={{strokeColor: "#348e3a",strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#32b53b",fillOpacity: 0.2,}} 
                        />
                    )} */}
                    {/* Building Footprints from GQL */}
                    {/* {gqlBuildings.map((b, i) => {
                        const path = b.geom ? formatCoords(b.geom.coordinates) : null;
                        return path ? (
                            <Polygon key={`poly-${i}`} 
                                paths={path} options={{strokeColor: "#023469",strokeWeight: 1,fillColor: "#004a99", fillOpacity: 0.4, clickable: true }}
                            />
                        ) : null;
                    })} */}

                    {locations.map((loc, index) => {
                        const mLat = parseFloat(loc.lat);
                        const mLng = parseFloat(loc.lng);

                        // Skip rendering if coordinates are missing or invalid
                        if (isNaN(mLat) || isNaN(mLng)) {
                            console.warn(`Invalid coordinates for location ${index}:`, loc);
                            return null;
                        }

                        if (loc.showMarker === false) return null;

                        const markerPos = { lat: mLat, lng: mLng };

                        // console.log(`Marker position:`, markerPos);

                        return (
                            <Fragment key={index}>
                                <AdvancedMarker key={`marker-${index}`} position={markerPos} 
                                    onClick={() => {
                                        console.log("Marker clicked data:", loc);
                                        setIsDrawerOpen(true);
                                        setSelectedLocation(loc);
                                        if (onMarkerClick) onMarkerClick(loc);
                                    }}
                                >
                                    <Pin background={'#004a99'} glyphColor={'#fff'} borderColor={'#000'} />
                                </AdvancedMarker>

                                {openIndex === index && (
                                    <InfoWindow position={markerPos} onCloseClick={() => setOpenIndex(null)}>
                                        <div style={{ color: '#000', padding: '5px', maxWidth: '200px' }}>
                                            <h3 style={{ margin: '0 0 5px', fontSize: '14px' }}>{loc.title || 'Location'}</h3>
                                            <p style={{ margin: 0, fontSize: '12px' }}>{loc.description}</p>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Fragment>
                        );
                    })}
                    {spatialFeatures
                        .filter(feature => visibleLayers[feature.properties.layer_type])
                        .map((feature, i) => {
                            const coords = formatCoords(feature.geometry.coordinates);
                            const { fid, layer_type, category, fill_color, name, gallery, wp_page_id, description } = feature.properties;

                            if (!coords || coords.length === 0) return null;

                            // HIGHLIGHT LOGIC: Check if this feature is the one currently selected
                            const isSelected = selectedLocation && 
                                            selectedLocation.fid === fid && 
                                            selectedLocation.layer_type === layer_type &&
                                            isDrawerOpen;

                            const currentOpacity = layerOpacity[layer_type] ?? 0.5;

                            const layerStyles = {
                                        parcels: { 
                                            zIndex: isSelected ? 999 : 4, 
                                            fillColor: "transparent", 
                                            strokeColor: isSelected ? "#ffff00" : "#000000ff", 
                                            strokeWeight: isSelected ? 2 : 1.5, 
                                            clickable: false 
                                        },
                                        buildings: { 
                                            zIndex: isSelected ? 999 : 3, 
                                            fillColor: fill_color || "#888888", 
                                            strokeColor: isSelected ? "#ffff00" : "#ffffffff", 
                                            fillOpacity: currentOpacity, 
                                            strokeOpacity: 1, 
                                            strokeWeight: isSelected ? 2 : 0.4, 
                                            clickable: true 
                                        },
                                        paths: { 
                                            zIndex: isSelected ? 999 : 2, 
                                            fillColor: fill_color || "#888888", 
                                            strokeColor: isSelected ? "#ffff00" : "transparent", 
                                            fillOpacity: currentOpacity, 
                                            strokeWeight: isSelected ? 2 : 0.2, 
                                            clickable: false 
                                        },
                                        land_use: { 
                                            zIndex: isSelected ? 999 : 1, 
                                            fillColor: fill_color || "#888888", 
                                            strokeColor: isSelected ? "#ffff00" : "transparent", 
                                            fillOpacity: currentOpacity, 
                                            strokeWeight: isSelected ? 2 : 0.2, 
                                            clickable: true 
                                        }
                                    };

                            const options = layerStyles[layer_type] || layerStyles.parcels;
                            const isMulti = feature.geometry.type === 'MultiPolygon';

                            // Core Interactivity Check
                            const isInteractiveLayer = layer_type !== 'parcels' && layer_type !== 'paths';

                            // Checks if at least one of these is truthy (not null, not undefined, not empty string)
                            const hasContent = !!(
                                name || 
                                description || 
                                (wp_page_id && parseInt(wp_page_id) > 0) || 
                                (gallery && gallery.length > 0)
                            );

                            const handlePolygonClick = () => {
                                // Only proceed if it's an allowed layer AND has data to show
                                if (!isInteractiveLayer || !hasContent) return;

                                setSelectedLocation({ 
                                    title: name || 'Unnamed Feature', 
                                    description: description || category || 'No description available.',
                                    gallery: gallery || [], 
                                    ...feature.properties 
                                });
                                setIsDrawerOpen(true);
                            };

                            if (isMulti) {
                                return coords.map((polyPaths, polyIdx) => (
                                    <Polygon 
                                        key={`table-spatial-${i}-${polyIdx}`} 
                                        paths={polyPaths} 
                                        options={options}
                                        // Only attach the click listener if it's actually meant to be clickable
                                        onClick={(isInteractiveLayer && hasContent) ? handlePolygonClick : undefined}
                                    />
                                ));
                            }

                            return (
                                <Polygon 
                                    key={`table-spatial-${i}`} 
                                    paths={coords} 
                                    options={options}
                                    onClick={(isInteractiveLayer && hasContent) ? handlePolygonClick : undefined}
                                />
                            );
                        })
                    }
                </Map>
            </APIProvider>
            <style>
                {`
                    [data-testid="map"] {
                        height: auto !important;
                    }

                    .map-placeholder {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #777;
                        font-size: 16px;
                    }
                `}
            </style>
        </div>
    );
}
