import { useState, useEffect } from '@wordpress/element';
import { Panel, Button, Flex, FlexItem, NoticeList, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import BawBabIMaps from '../bawbab-interactive-maps-block/components/maps';
import AdminSidebar from './components/AdminSidebar';
import { useMapCredentialsCheck } from './hooks/useMapCredentialsCheck';

/**
 * MainSettingsPage Component
 * 
 * Root administration core panel orchestrated around the interactive mapping systems.
 * Provides high-level asynchronous data persistence interfacing with native core WP Options APIs.
 */
const MainSettingsPage = () => {

    // --- STATE MANAGEMENT ---
    const [mapDescription, setMapDescription] = useState('');
    const [mapType, setMapType] = useState('hybrid');
    const [locations, setLocations] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerMapRefresh = () => setRefreshTrigger(prev => prev + 1);
    const [mapLogo, setMapLogo] = useState('');
    const [colorTheme, setColorTheme] = useState(null);
    const [navBackground, setNavBackground] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [googleMapId, setGoogleMapId] = useState('');

    // --- NOTICES SETUP ---
    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
    const notices = useSelect( ( select ) => select( noticesStore ).getNotices(), [] );
    const { removeNotice } = useDispatch( noticesStore );

    useMapCredentialsCheck( isLoaded, googleApiKey, googleMapId );

    // --- LOAD DATA ON MOUNT ---
    useEffect( () => {
        apiFetch( { path: '/wp/v2/settings' } ).then( ( response ) => {
            const data = response.bwb_imaps_options_data;
            if ( data ) {
                setMapDescription( data.mapDescription || '' );
                setMapType( data.mapType || 'roadmap' );
                setLocations( data.locations || [] );
                setMapLogo( data.mapLogo || '' );
                setColorTheme( data.colorTheme || 'blue' ); 
                setNavBackground ( data.navBackground || '');
                setGoogleApiKey(data.googleApiKey || '');
                setGoogleMapId( data.googleMapId || '' );
            } else {
                // Instantiation default fallback values
                setColorTheme('blue');
            }
            setIsLoaded(true);
        } ).catch( ( err ) => {
            console.error( 'Error loading settings context schemas:', err );
            setColorTheme('blue');
            setIsLoaded(true);
        });
    }, [] );


    // --- SAVE DATA ACTION ---
    const handleSave = async () => {
        setIsSaving( true );
        try {
            // 1. Fetch current saved options to preserve categoryConfig & attribute_schema
            let currentOptions = {};
            try {
                const settingsRes = await apiFetch( { path: '/wp/v2/settings' } );
                currentOptions = settingsRes?.bwb_imaps_options_data || {};
            } catch ( err ) {
                console.warn( 'Could not fetch existing options before save:', err );
            }

            // 2. Helper to guarantee string types for REST API validation
            const safeString = ( val ) => ( typeof val === 'string' ? val : ( val?.url || '' ) );

            // 3. POST merged payload to REST API
            await apiFetch( {
                path: '/wp/v2/settings',
                method: 'POST',
                data: {
                    bwb_imaps_options_data: {
                        ...currentOptions, // Preserves categoryConfig & attribute_schema!
                        mapDescription: safeString( mapDescription ),
                        mapType: safeString( mapType ),
                        locations: Array.isArray( locations ) ? locations : [],
                        mapLogo: safeString( mapLogo ),
                        navBackground: safeString( navBackground ), // Guarantees string type!
                        colorTheme: safeString( colorTheme ),
                        googleApiKey: safeString( googleApiKey ),
                        googleMapId: safeString( googleMapId )
                    }
                },
            } );
            
            // Explicit memory management sync parameters to window state
            window.bwbimapsSettings = {
                ...window.bwbimapsSettings,
                mapType: safeString( mapType ),
                colorTheme: safeString( colorTheme ),
                mapLogo: safeString( mapLogo ),
                googleApiKey: safeString( googleApiKey ),
                googleMapId: safeString( googleMapId ),
                navBackground: safeString( navBackground )
            };

            createSuccessNotice( __( 'Settings saved successfully!', 'bawbab-interactive-maps' ), {
                type: 'snackbar',
            } );
            
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch ( error ) {
            console.error( 'Save settings REST error:', error );
            createErrorNotice( __( 'Error saving settings: ', 'bawbab-interactive-maps' ) + error.message );
        } finally {
            setIsSaving( false );
        }
    };

    // --- REPEATER ACTIONS ---
    const addLocation = () => setLocations([...locations, { title: '', lat: '', lng: '', description: '', gallery: [], showMarker: true }]);
    const removeLocation = (index) => setLocations(locations.filter((_, i) => i !== index));
    const updateLocation = (index, key, value) => {
        const newLocs = [...locations];
        newLocs[index][key] = value;
        setLocations(newLocs);
    };

    const addImageToLocation = (locIdx, media) => {
        const newLocs = [...locations];
        newLocs[locIdx].gallery = [...(newLocs[locIdx].gallery || []), { id: media.id, url: media.url }];
        setLocations(newLocs);
    };

    const removeImageFromLocation = (locIdx, imgIdx) => {
        const newLocs = [...locations];
        newLocs[locIdx].gallery = newLocs[locIdx].gallery.filter((_, i) => i !== imgIdx);
        setLocations(newLocs);
    };

    return (
        <div className="wrap">
            <NoticeList notices={ notices } onRemove={ removeNotice } style={{ marginBottom: '20px' }}/>

            <h1 className="wp-heading-inline" style={{ marginBottom: '20px' }}>
                {__('Bawbab Interactive Map Settings', 'bawbab-interactive-maps')}
            </h1>
            <hr className="wp-header-end" />

            <Panel style={{ marginTop: '20px', background: '#fff', border: '1px solid #e0e0e0', height: 'auto', overflow: 'hidden' }}>
                <Flex align="stretch" gap={0} style={{ height: '100%' }}>
                    {/* LEFT SIDEBAR CONTROLS CONTAINER */}
                    <FlexItem style={{ flex: '0 0 500px', borderRight: '1px solid #e0e0e0', height: '88vh' }}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                <AdminSidebar 
                                    mapDescription={mapDescription} setMapDescription={setMapDescription}
                                    mapType={mapType} setMapType={setMapType}
                                    locations={locations} addLocation={addLocation}
                                    removeLocation={removeLocation} updateLocation={updateLocation}
                                    addImageToLocation={addImageToLocation} removeImageFromLocation={removeImageFromLocation}
                                    onUploadSuccess={triggerMapRefresh}
                                    mapLogo={mapLogo} setMapLogo={setMapLogo}
                                    navBackground={navBackground} setNavBackground={setNavBackground}
                                    colorTheme={colorTheme} setColorTheme={setColorTheme}
                                    googleApiKey={googleApiKey} setGoogleApiKey={setGoogleApiKey}
                                    googleMapId={googleMapId} setGoogleMapId={setGoogleMapId}
                                />
                            </div>
                            <div style={{ padding: '24px', borderTop: '1px solid #e0e0e0', background: '#fcfcfc' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Button 
                                        variant="primary" 
                                        onClick={ handleSave }
                                        isBusy={ isSaving }
                                        disabled={ isSaving }
                                        style={{ width: '100%', height: '45px', justifyContent: 'center' }}
                                    >
                                        { isSaving ? __('Saving...', 'bawbab-interactive-maps') : __('Save All Changes', 'bawbab-interactive-maps') }
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </FlexItem>
                    
                    {/* RIGHT PREVIEW MAP BLOCK SCREEN */}
                    <FlexItem style={{ flex: '1' }} key={`map-wrapper-${googleApiKey}-${googleMapId}-${refreshTrigger}`} >
                        {isLoaded ? (
                            <BawBabIMaps
                                mapTypeProp={mapType}
                                locations={locations}
                                mapLogo={mapLogo}
                                navBackground={navBackground} 
                                colorTheme={colorTheme}
                                apiKeyProp={googleApiKey}
                                mapIdProp={googleMapId}
                            />
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <Spinner />
                            </div>
                        )}
                    </FlexItem>
                </Flex>
            </Panel>
        </div>
    );
};

export default MainSettingsPage;