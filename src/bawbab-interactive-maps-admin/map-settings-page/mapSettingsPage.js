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
import { ConfirmModal, CancelModal } from '../confirmModal';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * MapSettingsPage Component
 */
const MapSettingsPage = () => {
    const [ refreshTrigger, setRefreshTrigger ] = useState( 0 );
    const triggerMapRefresh = () => setRefreshTrigger( ( prev ) => prev + 1 );

    // Modals trigger state
    const [ showConfirmModal, setShowConfirmModal ] = useState( false );
    const [ showCancelModal, setShowCancelModal ] = useState( false );

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

    // Confirmed Save Execution Handler
    const handleConfirmSave = async () => {
        setShowConfirmModal( false );
        const result = await saveSettings();

        if ( result.success ) {
            if ( result.credentialsChanged ) {
                createSuccessNotice(
                    __(
                        'Google Maps API credentials updated! Reloading page...',
                        TEXT_DOMAIN
                    ),
                    { type: 'snackbar' }
                );
                setTimeout( () => {
                    window.location.reload();
                }, 1000 );
            } else {
                triggerMapRefresh();
                createSuccessNotice(
                    __( 'Settings saved successfully!', TEXT_DOMAIN ),
                    { type: 'snackbar' }
                );
            }
        } else {
            createErrorNotice(
                __( 'Error saving settings: ', TEXT_DOMAIN ) +
                    ( result.error?.message || '' )
            );
        }
    };

    // Revert / Discard Changes Handler
    const handleConfirmCancel = () => {
        setShowCancelModal( false );
        window.location.reload();
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
                { __( 'Bawbab Interactive Map Settings', TEXT_DOMAIN ) }
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

                            { /* ACTION FOOTER WITH SAVE & DISCARD BUTTONS */ }
                            <div
                                style={ {
                                    padding: '20px 24px',
                                    borderTop: '1px solid #e0e0e0',
                                    background: '#fcfcfc',
                                } }
                            >
                                <Flex justify="space-between" align="center" gap={ 3 }>
                                    <Button
                                        variant="tertiary"
                                        isDestructive
                                        onClick={ () => setShowCancelModal( true ) }
                                        disabled={ isSaving }
                                    >
                                        { __( 'Discard Changes', TEXT_DOMAIN ) }
                                    </Button>

                                    <Button
                                        variant="primary"
                                        onClick={ () => setShowConfirmModal( true ) }
                                        isBusy={ isSaving }
                                        disabled={ isSaving }
                                        style={ {
                                            height: '40px',
                                            padding: '0 24px',
                                        } }
                                    >
                                        { isSaving
                                            ? __( 'Saving...', TEXT_DOMAIN )
                                            : __( 'Save All Changes', TEXT_DOMAIN ) }
                                    </Button>
                                </Flex>
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

            { /* GENERIC CONFIRMATION MODAL */ }
            <ConfirmModal
                isOpen={ showConfirmModal }
                title={ __( 'Save Map Settings', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to save and apply all map settings and typography changes?',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Save Changes', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmSave }
                onCancel={ () => setShowConfirmModal( false ) }
                isBusy={ isSaving }
            />

            { /* GENERIC CANCELLATION MODAL */ }
            <CancelModal
                isOpen={ showCancelModal }
                title={ __( 'Discard Map Changes', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to discard your unsaved modifications? The page will reload to restore your last saved configuration.',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Discard & Reload', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmCancel }
                onCancel={ () => setShowCancelModal( false ) }
            />
        </div>
    );
};

export default MapSettingsPage;