import React, { useState, useEffect } from '@wordpress/element';
import { Button, SelectControl, Dashicon, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCampusRouting } from '../hooks/useCampusRouting';

/**
 * CampusNavigation Component
 */
export const CampusNavigation = ({ 
    destinationFeature, 
    manualOriginNode,      
    onTriggerOriginPick,   
    onRouteGenerated, 
    onRouteCleared 
}) => {
    const { fetchGraph, calculateRoute, findIntersectingDoors, isGraphLoading, error: internalError } = useCampusRouting();

    const [isNavActive, setIsNavActive] = useState(false);
    const [matchingDoors, setMatchingDoors] = useState([]);
    const [selectedDoor, setSelectedDoor] = useState(null);
    const [graphEntries, setGraphEntries] = useState([]);
    const [isPickingOrigin, setIsOriginPickActive] = useState(false);
    const [proximityState, setProximityState] = useState({ onCampus: true, userCoords: null });

    useEffect(() => {
        if (!isNavActive || !destinationFeature) return;

        const initializeNavigation = async () => {
            console.log("🧭 [CampusNavigation] Initializing routing context panels...");
            const graphData = await fetchGraph();
            if (graphData) {
                setGraphEntries(graphData.entries);
                window.foulkewaysNavigationGraphEntries = graphData.entries;
                
                const doors = findIntersectingDoors(destinationFeature, graphData.entries);
                setMatchingDoors(doors);
                
                if (doors.length > 0) {
                    setSelectedDoor(doors[0]); 
                    console.log("🎯 [CampusNavigation] Initial destination target mapped:", doors[0]);
                } else {
                    console.warn("⚠️ [CampusNavigation] No door found near selected building envelope bounds.");
                }
            }
        };

        initializeNavigation();
    }, [isNavActive, destinationFeature, fetchGraph, findIntersectingDoors]);

    useEffect(() => {
        if (manualOriginNode) {
            console.log("📍 [CampusNavigation] Received manual origin point selection:", manualOriginNode);
            setIsOriginPickActive(false);
        }
    }, [manualOriginNode]);

    const handleStartNavigation = () => {
        setIsNavActive(true);
    };

    const handleCancelNavigation = () => {
        setIsNavActive(false);
        setMatchingDoors([]);
        setSelectedDoor(null);
        setIsOriginPickActive(false);
        onRouteCleared();
    };

    const toggleOriginPicker = () => {
        const nextState = !isPickingOrigin;
        setIsOriginPickActive(nextState);
        if (onTriggerOriginPick) {
            onTriggerOriginPick(nextState);
        }
    };

    const handleExecuteRouting = async () => {
        if (!selectedDoor || graphEntries.length === 0) {
            console.warn("⚠️ [CampusNavigation] Execution aborted: target door properties or node entries array are missing.");
            return;
        }

        let startPoint = manualOriginNode;

        if (!startPoint) {
            console.log("ℹ️ [CampusNavigation] No pinned origin point set. Resolving fallback gate nodes array...");
            const gateways = graphEntries.filter(e => 
                e.type === 'main_road_entrance' || 
                e.type === 'main_pathway_entrance' || 
                e.type === 'parking'
            );
            
            startPoint = gateways.length > 0 ? gateways[0] : selectedDoor;
            console.log("ℹ️ [CampusNavigation] Final chosen starting point:", startPoint);
        }

        const routeResult = await calculateRoute(startPoint, selectedDoor);
        if (routeResult && onRouteGenerated) {
            onRouteGenerated(routeResult);
        }
    };

    if (!isNavActive) {
        return (
            <div className="navigation-trigger-zone">
                <Button 
                    variant="primary"
                    className="is-primary" // Added fallback layout class token
                    icon="navigation"
                    onClick={handleStartNavigation}
                    style={{ width: '100%', height: '40px', justifyContent: 'center' }}
                >
                    {__('Get Directions', 'bawbab-interactive-maps')}
                </Button>
            </div>
        );
    }

    return (
        <div className="navigation-active-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', width: '100%' }}>
                <h3 className="nav-planner-title" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--map-text-dark)', margin: '0', padding: '0',textAlign: 'left', marginRight: 'auto' }}>
                    {__('Route Planner', 'bawbab-interactive-maps')}
                </h3>
                <Button 
                    variant="link" 
                    className="is-link is-destructive" 
                    onClick={handleCancelNavigation} 
                    style={{ paddingRight: '0', marginRight: '0' }} // Ensures Cancel flushes completely to the right edge
                >
                    {__('Cancel', 'bawbab-interactive-maps')}
                </Button>
            </div>

            {isGraphLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><Spinner /></div>
            ) : (
                <>
                    {internalError && (
                        <div style={{ color: '#d63638', fontSize: '11px', marginBottom: '10px' }}>{internalError}</div>
                    )}

                    {/* SELECT ORIGIN CONTROL STEP */}
                    <div style={{ marginBottom: '15px', padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#666', display: 'block', marginBottom: '5px' }}>
                            {__('Starting Point:', 'bawbab-interactive-maps')}
                        </label>
                        
                        {manualOriginNode ? (
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#2c3338', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Dashicon icon="location-alt" style={{ color: '#007cba' }} />
                                <span>{manualOriginNode.name || sprintf(__('Selected Node ID: %d', 'bawbab-interactive-maps'), manualOriginNode.fid)}</span>
                            </div>
                        ) : (
                            <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                                {__('No starting point selected (Defaulting to Main Gate Entrance)', 'bawbab-interactive-maps')}
                            </span>
                        )}

                        <Button 
                            variant="secondary"
                            className={`is-secondary ${isPickingOrigin ? 'is-pressed' : ''}`} // Binds contextual active styling variables dynamically
                            isPressed={isPickingOrigin}
                            onClick={toggleOriginPicker}
                            style={{ width: '100%', marginTop: '10px', justifyContent: 'center', fontSize: '11px', height: '28px' }}
                        >
                            <Dashicon icon={isPickingOrigin ? "stop" : "location"} />
                            {isPickingOrigin ? __('Cancel pin assignment...', 'bawbab-interactive-maps') : __('Pin Origin location from Map', 'bawbab-interactive-maps')}
                        </Button>
                    </div>

                    {/* SELECT TARGET DOOR SECTION */}
                    {matchingDoors.length > 1 && (
                        <SelectControl
                            label={__('Select Destination Door:', 'bawbab-interactive-maps')}
                            value={selectedDoor ? JSON.stringify(selectedDoor) : ''}
                            options={matchingDoors.map(door => ({
                                label: door.name || sprintf(__('Entrance Door (Floor %1$d)', 'bawbab-interactive-maps'), door.floor),
                                value: JSON.stringify(door)
                            }))}
                            onChange={(val) => setSelectedDoor(JSON.parse(val))}
                        />
                    )}

                    {matchingDoors.length === 1 && (
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '15px' }}>
                            <Dashicon icon="yes" style={{ color: '#46b450' }} />
                            {sprintf(__('Target entrance: %s', 'bawbab-interactive-maps'), matchingDoors[0].name || __('Main Entrance Door', 'bawbab-interactive-maps'))}
                        </div>
                    )}

                    {matchingDoors.length === 0 && (
                        <div style={{ fontSize: '11px', color: '#d63638', marginBottom: '15px', fontStyle: 'italic' }}>
                            {__('No door points discovered inside search buffer boundaries.', 'bawbab-interactive-maps')}
                        </div>
                    )}

                    <Button 
                        variant="primary"
                        className="is-primary" // Enforces custom override configurations profile hook rules
                        disabled={!selectedDoor}
                        onClick={handleExecuteRouting}
                        style={{ width: '100%', height: '36px', justifyContent: 'center', marginTop: '10px' }}
                    >
                        {__('Calculate Campus Path', 'bawbab-interactive-maps')}
                    </Button>
                </>
            )}
        </div>
    );
};