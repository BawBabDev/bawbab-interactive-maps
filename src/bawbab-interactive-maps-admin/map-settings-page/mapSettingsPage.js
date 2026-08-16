import { useState } from '@wordpress/element';
import {
    Panel,
    Button,
    Flex,
    FlexItem,
    NoticeList,
    Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import BawBabIMaps from '../../bawbab-interactive-maps-block/components/maps';
import AdminSidebar from './components/adminSidebar';
import { useMapCredentialsCheck } from './hooks/useMapCredentialsCheck';
import { useMapSettings } from './hooks/useMapSettings';
import { useTypographySettings } from './hooks/useTypographySettings';

/**
 * MapSettingsPage Component
 */
const MapSettingsPage = () => {
    const [ refreshTrigger, setRefreshTrigger ] = useState( 0 );
    const triggerMapRefresh = () => setRefreshTrigger( ( prev ) => prev + 1 );

    // Custom Map Settings Hook
    const {
        settings,
        setters,
        repeater,
        isLoaded,
        isSaving,
        saveSettings,
    } = useMapSettings();

    const {
        mapDescription,
        mapType,
        locations,
        mapLogo,
        colorTheme,
        navBackground,
        googleApiKey,
        googleMapId,
        typography,
    } = settings;

    const {
        setMapDescription,
        setMapType,
        setMapLogo,
        setColorTheme,
        setNavBackground,
        setGoogleApiKey,
        setGoogleMapId,
        setTypography,
    } = setters;

    // Dedicated typography hook for central font state, reset, and dynamic CSS variables
    const {
        typographySettings,
        updateTypography,
        resetTypography,
    } = useTypographySettings( typography || {} );

    const handleTypographyChange = ( key, value ) => {
        updateTypography( key, value );
        if ( setTypography ) {
            setTypography( ( prev ) => ( {
                ...( prev || {} ),
                [ key ]: value,
            } ) );
        }
    };

    const handleResetTypography = () => {
        resetTypography();
        if ( setTypography ) {
            setTypography( {} );
        }
    };

    // Notices dispatchers
    const { createSuccessNotice, createErrorNotice, removeNotice } =
        useDispatch( noticesStore );
    const notices = useSelect(
        ( select ) => select( noticesStore ).getNotices(),
        []
    );

    useMapCredentialsCheck( isLoaded, googleApiKey, googleMapId );

    // Save action handler
    const handleSave = async () => {
        const result = await saveSettings();

        if ( result.success ) {
            if ( result.credentialsChanged ) {
                createSuccessNotice(
                    __(
                        'Google Maps API credentials updated! Reloading page...',
                        'bawbab-interactive-maps'
                    ),
                    { type: 'snackbar' }
                );
                setTimeout( () => {
                    window.location.reload();
                }, 1000 );
            } else {
                triggerMapRefresh();
                createSuccessNotice(
                    __(
                        'Settings saved successfully!',
                        'bawbab-interactive-maps'
                    ),
                    { type: 'snackbar' }
                );
            }
        } else {
            createErrorNotice(
                __( 'Error saving settings: ', 'bawbab-interactive-maps' ) +
                    ( result.error?.message || '' )
            );
        }
    };

    return (
        <div className="wrap">
            <NoticeList
                notices={ notices }
                onRemove={ removeNotice }
                style={ { marginBottom: '20px' } }
            />

            <h1
                className="wp-heading-inline"
                style={ { marginBottom: '20px' } }
            >
                { __(
                    'Bawbab Interactive Map Settings',
                    'bawbab-interactive-maps'
                ) }
            </h1>
            <hr className="wp-header-end" />

            <Panel
                style={ {
                    marginTop: '20px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    height: 'auto',
                    overflow: 'hidden',
                } }
            >
                <Flex align="stretch" gap={ 0 } style={ { height: '100%' } }>
                    { /* LEFT SIDEBAR CONTROLS CONTAINER */ }
                    <FlexItem
                        style={ {
                            flex: '0 0 500px',
                            borderRight: '1px solid #e0e0e0',
                            height: '88vh',
                        } }
                    >
                        <div
                            style={ {
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            } }
                        >
                            <div style={ { flex: 1, overflow: 'auto' } }>
                                <AdminSidebar
                                    mapDescription={ mapDescription }
                                    setMapDescription={ setMapDescription }
                                    mapType={ mapType }
                                    setMapType={ setMapType }
                                    locations={ locations }
                                    addLocation={ repeater.addLocation }
                                    removeLocation={ repeater.removeLocation }
                                    updateLocation={ repeater.updateLocation }
                                    addImageToLocation={
                                        repeater.addImageToLocation
                                    }
                                    removeImageFromLocation={
                                        repeater.removeImageFromLocation
                                    }
                                    onUploadSuccess={ triggerMapRefresh }
                                    mapLogo={ mapLogo }
                                    setMapLogo={ setMapLogo }
                                    navBackground={ navBackground }
                                    setNavBackground={ setNavBackground }
                                    colorTheme={ colorTheme }
                                    setColorTheme={ setColorTheme }
                                    googleApiKey={ googleApiKey }
                                    setGoogleApiKey={ setGoogleApiKey }
                                    googleMapId={ googleMapId }
                                    setGoogleMapId={ setGoogleMapId }
                                    typographySettings={ typographySettings }
                                    updateTypography={ handleTypographyChange }
                                    resetTypography={ handleResetTypography }
                                />
                            </div>
                            <div
                                style={ {
                                    padding: '24px',
                                    borderTop: '1px solid #e0e0e0',
                                    background: '#fcfcfc',
                                } }
                            >
                                <div style={ { textAlign: 'center' } }>
                                    <Button
                                        variant="primary"
                                        onClick={ handleSave }
                                        isBusy={ isSaving }
                                        disabled={ isSaving }
                                        style={ {
                                            width: '100%',
                                            height: '45px',
                                            justifyContent: 'center',
                                        } }
                                    >
                                        { isSaving
                                            ? __(
                                                  'Saving...',
                                                  'bawbab-interactive-maps'
                                              )
                                            : __(
                                                  'Save All Changes',
                                                  'bawbab-interactive-maps'
                                              ) }
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </FlexItem>

                    { /* RIGHT PREVIEW MAP BLOCK SCREEN */ }
                    <FlexItem
                        style={ { flex: '1' } }
                        key={ `map-wrapper-${ googleApiKey }-${ googleMapId }-${ refreshTrigger }` }
                    >
                        { isLoaded ? (
                            <BawBabIMaps
                                mapTypeProp={ mapType }
                                locations={ locations }
                                mapLogoProp={ mapLogo }
                                navBackgroundProp={ navBackground }
                                colorThemeProp={ colorTheme }
                                apiKeyProp={ googleApiKey }
                                mapIdProp={ googleMapId }
                                selectedLocationProp={ {
                                    properties: { typography: typographySettings },
                                } }
                            />
                        ) : (
                            <div
                                style={ {
                                    display: 'flex',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                } }
                            >
                                <Spinner />
                            </div>
                        ) }
                    </FlexItem>
                </Flex>
            </Panel>
        </div>
    );
};

export default MapSettingsPage;