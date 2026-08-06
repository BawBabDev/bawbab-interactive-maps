import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * useCampusRouting
 * 
 * Manages the in-memory graph building, polygon intersection door calculations,
 * and multi-floor pathfinding across the custom campus network topologies.
 */
export const useCampusRouting = () => {
    const [graph, setGraph] = useState(null);
    const [isGraphLoading, setIsGraphLoading] = useState(false);
    const [activeRoute, setActiveRoute] = useState(null);
    const [error, setError] = useState(null);

    /**
     * fetchGraph
     */
    const fetchGraph = useCallback(async () => {
        if (graph) return graph;
        
        setIsGraphLoading(true);
        setError(null);
        
        try {
            console.log("📡 [useCampusRouting] Fetching navigation graph data from database...");
            const response = await fetch('/wp-json/foulkeways/v1/get-navigation-graph');
            if (!response.ok) throw new Error(__('Failed to load network graph maps.', 'foulkeways-interactive-map'));
            
            const data = await response.json();
            
            // Normalize entries payload to unwrap MultiPoint wrappers immediately
            const normalizedEntries = (data.entries || []).map(entry => {
                let coords = entry.geom?.coordinates;
                
                if (entry.geom?.type === 'MultiPoint' && Array.isArray(coords) && Array.isArray(coords[0])) {
                    coords = coords[0];
                }
                
                return {
                    ...entry,
                    unwrappedCoords: Array.isArray(coords) ? [parseFloat(coords[0]), parseFloat(coords[1])] : null
                };
            }).filter(e => e.unwrappedCoords !== null && !isNaN(e.unwrappedCoords[0]));

            const adjList = {};
            
            data.network.forEach(segment => {
                let coords = segment.geom?.coordinates;
                if (!coords) return;

                if (segment.geom.type === 'MultiLineString' && Array.isArray(coords[0])) {
                    coords = coords[0];
                }

                if (!Array.isArray(coords) || coords.length < 2 || !coords[0] || !coords[coords.length - 1]) return;
                
                const startLng = typeof coords[0][0] === 'number' ? coords[0][0] : parseFloat(coords[0][0]);
                const startLat = typeof coords[0][1] === 'number' ? coords[0][1] : parseFloat(coords[0][1]);
                const endLng = typeof coords[coords.length - 1][0] === 'number' ? coords[coords.length - 1][0] : parseFloat(coords[coords.length - 1][0]);
                const endLat = typeof coords[coords.length - 1][1] === 'number' ? coords[coords.length - 1][1] : parseFloat(coords[coords.length - 1][1]);

                if (isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) return;

                const startKey = `${startLng.toFixed(6)},${startLat.toFixed(6)}`;
                const endKey = `${endLng.toFixed(6)},${endLat.toFixed(6)}`;
                
                if (!adjList[startKey]) adjList[startKey] = [];
                if (!adjList[endKey]) adjList[endKey] = [];
                
                const distance = parseFloat(segment.length_m) || 1.0;
                const floor = parseInt(segment.floor, 10) || 0;
                
                adjList[startKey].push({ node: endKey, weight: distance, floor, segmentCoords: coords });
                adjList[endKey].push({ node: startKey, weight: distance, floor, segmentCoords: [...coords].reverse() });
            });

            const parsedGraph = { adjList, entries: normalizedEntries };
            setGraph(parsedGraph);
            setIsGraphLoading(false);
            return parsedGraph;
            
        } catch (err) {
            console.error("❌ [useCampusRouting] Graph Initialization Error:", err);
            setError(err.message);
            setIsGraphLoading(false);
            return null;
        }
    }, [graph]);

    /**
     * findIntersectingDoors
     * Tightened down to isolate only points directly touching the active building envelope structure.
     */
    const findIntersectingDoors = useCallback((feature, loadedEntries) => {
        if (!feature || !loadedEntries) return [];
        
        let polyCoords = [];
        const geomType = feature.geometry?.type || feature.type;
        
        if (geomType === 'Polygon' || feature.geometry?.type === 'Polygon') {
            polyCoords = feature.geometry?.coordinates?.[0] || feature.coordinates?.[0];
        } else if (geomType === 'MultiPolygon' || feature.geometry?.type === 'MultiPolygon') {
            polyCoords = feature.geometry?.coordinates?.[0]?.[0] || feature.coordinates?.[0]?.[0];
        }
        
        if (!Array.isArray(polyCoords) || polyCoords.length === 0) return [];
        
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        polyCoords.forEach((coord) => {
            if (!Array.isArray(coord) || coord.length < 2) return;
            const lng = coord[0];
            const lat = coord[1];
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        });
        
        // TIGHTENED ACCURACY MARGINS: Drop offset search values from 35 meters down to ~5-8 meters max
        const LAT_PADDING = 0.00007; 
        const LNG_PADDING = 0.00009;
        
        const matchedDoors = loadedEntries.filter(entry => {
            if (entry.type !== 'door' || !entry.unwrappedCoords) return false;
            const [eLng, eLat] = entry.unwrappedCoords;
            return (
                eLng >= (minLng - LNG_PADDING) &&
                eLng <= (maxLng + LNG_PADDING) &&
                eLat >= (minLat - LAT_PADDING) &&
                eLat <= (maxLat + LAT_PADDING)
            );
        });

        console.log(`🚪 [useCampusRouting] Restricted filter executed. Mapped ${matchedDoors.length} doors.`);
        return matchedDoors;
    }, []);

    /**
     * calculateRoute
     */
    const calculateRoute = useCallback(async (startEntry, endEntry) => {
        const currentGraph = await fetchGraph();
        if (!currentGraph || !startEntry || !endEntry) return null;
        
        const { adjList } = currentGraph;
        
        // Unpack origin coords whether it's a pure dictionary point drop or an entry object model node
        const startLng = startEntry.unwrappedCoords ? startEntry.unwrappedCoords[0] : parseFloat(startEntry.lng);
        const startLat = startEntry.unwrappedCoords ? startEntry.unwrappedCoords[1] : parseFloat(startEntry.lat);
        const endLng = endEntry.unwrappedCoords[0];
        const endLat = endEntry.unwrappedCoords[1];
        
        // Find nearest topological network junction anchor node point to connect our projection line
        let nearestNetworkNodeKey = null;
        let infiniteMinDistance = Infinity;
        
        Object.keys(adjList).forEach(nodeKey => {
            const [nLng, nLat] = nodeKey.split(',').map(parseFloat);
            const delta = Math.hypot(startLat - nLat, startLng - nLng);
            if (delta < infiniteMinDistance) {
                infiniteMinDistance = delta;
                nearestNetworkNodeKey = nodeKey;
            }
        });

        if (!nearestNetworkNodeKey || !adjList[nearestNetworkNodeKey]) {
            setError(__('No structural network path lines could be aligned nearby.', 'foulkeways-interactive-map'));
            return null;
        }

        const startKey = nearestNetworkNodeKey;
        const endKey = `${endLng.toFixed(6)},${endLat.toFixed(6)}`;
        
        const distances = {};
        const previous = {};
        const queue = new Set();
        
        Object.keys(adjList).forEach(node => {
            distances[node] = Infinity;
            previous[node] = null;
            queue.add(node);
        });
        
        distances[startKey] = 0;
        
        while (queue.size > 0) {
            let shortestNode = null;
            queue.forEach(node => {
                if (shortestNode === null || distances[node] < distances[shortestNode]) {
                    shortestNode = node;
                }
            });
            
            if (shortestNode === endKey || distances[shortestNode] === Infinity) break;
            queue.delete(shortestNode);
            
            const neighbors = adjList[shortestNode] || [];
            neighbors.forEach(neighbor => {
                if (!queue.has(neighbor.node)) return;
                
                const alternatePathCost = distances[shortestNode] + neighbor.weight;
                if (alternatePathCost < distances[neighbor.node]) {
                    distances[neighbor.node] = alternatePathCost;
                    previous[neighbor.node] = {
                        fromNode: shortestNode,
                        edgeData: neighbor
                    };
                }
            });
        }
        
        if (distances[endKey] === Infinity) {
            setError(__('No routing connection possible between targets.', 'foulkeways-interactive-map'));
            return null;
        }
        
        const pathSegments = [];
        let u = endKey;
        
        while (previous[u]) {
            const step = previous[u];
            pathSegments.unshift(step.edgeData);
            u = step.fromNode;
        }
        
        const calculatedCoordinates = [];
        pathSegments.forEach((segment, idx) => {
            segment.segmentCoords.forEach((coord, coordIdx) => {
                if (coordIdx === 0 && idx > 0) return; 
                calculatedCoordinates.push({ lat: coord[1], lng: coord[0], floor: segment.floor });
            });
        });
        
        // BUILD THE PROJECTION ARC: Prepend user exact cursor click coords straight to network path array
        const [junctionLng, junctionLat] = nearestNetworkNodeKey.split(',').map(parseFloat);
        const projectionConnectorLine = [
            { lat: startLat, lng: startLng, floor: endEntry.floor, isProjectionConnectorArc: true },
            { lat: junctionLat, lng: junctionLng, floor: endEntry.floor, isProjectionConnectorArc: true }
        ];

        return {
            coordinates: [...projectionConnectorLine, ...calculatedCoordinates],
            totalDistance: distances[endKey],
            targetFloor: endEntry.floor
        };
    }, [fetchGraph]);

    return { fetchGraph, calculateRoute, findIntersectingDoors, activeRoute, setActiveRoute, isGraphLoading, error, graph };
};