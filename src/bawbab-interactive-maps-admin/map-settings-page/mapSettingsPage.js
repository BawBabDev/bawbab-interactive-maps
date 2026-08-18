import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, NoticeList, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import BawBabIMaps from '../../bawbab-interactive-maps-block/components/maps';
import AdminSidebar from './components/adminSidebar';
import { useMapCredentialsCheck } from './hooks/useMapCredentialsCheck';
import { useMapSettings } from './hooks/useMapSettings';
import { useTypographySettings } from './hooks/useTypographySettings';
import { ConfirmModal, CancelModal } from '../modals/confirmModal';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * MapSettingsPage Component
 */
const MapSettingsPage = ( { onDirtyStateChange } ) => {
    const [ refreshTrigger, setRefreshTrigger ] = useState( 0 );
    const triggerMapRefresh = () => setRefreshTrigger( ( prev ) => prev + 1 );

    // Modals trigger state
    const [ showConfirmModal, setShowConfirmModal ] = useState( false );
    const [ showCancelModal, setShowCancelModal ] = useState( false );

    // Custom Map Settings Hook (Primary Data Owner)
    const {
        settings,
        setters,
        repeater,
        isLoaded,
        isSaving,
        saveSettings,
        refetchSettings, // Hook helper to restore saved state from REST API
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

    // Dedicated typography hook (State synced with settings.typography)
    const {
        typographySettings,
        updateTypography,
        resetTypography,
    } = useTypographySettings( typography || {} );

    // Baseline snapshot for dirty-state detection
    const initialSnapshotRef = useRef( null );
    const savedCredentialsRef = useRef( { apiKey: '', mapId: '' } );
    const [ isDirty, setIsDirty ] = useState( false );

    // Clean, normalized snapshot string function
    const getSettingsSnapshot = ( data ) => {
        if ( ! data ) return '';

        const cleanFonts = data.typography || {};
        const sortedFontKeys = Object.keys( cleanFonts ).sort();
        const normalizedFonts = {};
        sortedFontKeys.forEach( ( k ) => {
            normalizedFonts[ k ] = cleanFonts[ k ];
        } );

        return JSON.stringify( {
            mapDescription: data.mapDescription || '',
            mapType: data.mapType || 'hybrid',
            mapLogo: data.mapLogo || '',
            colorTheme: data.colorTheme || 'blue',
            navBackground: data.navBackground || '',
            googleApiKey: data.googleApiKey || '',
            googleMapId: data.googleMapId || '',
            locations: data.locations || [],
            typography: normalizedFonts,
        } );
    };

    // Capture initial baseline snapshot ONLY ONCE after REST API data is fully loaded
    useEffect( () => {
        if ( isLoaded && initialSnapshotRef.current === null ) {
            initialSnapshotRef.current = getSettingsSnapshot( settings );
            savedCredentialsRef.current = {
                apiKey: settings.googleApiKey || '',
                mapId: settings.googleMapId || '',
            };
        }
    }, [ isLoaded, settings ] );

    // Evaluate dirty state whenever settings change
    useEffect( () => {
        if ( initialSnapshotRef.current !== null ) {
            const currentSnapshot = getSettingsSnapshot( settings );
            setIsDirty( currentSnapshot !== initialSnapshotRef.current );
        }
    }, [ settings ] );

    // Transmit local dirty state to the parent App Shell for global navigation intercepting
    useEffect( () => {
        if ( typeof onDirtyStateChange === 'function' ) {
            onDirtyStateChange( isDirty );
        }

        return () => {
            if ( typeof onDirtyStateChange === 'function' ) {
                onDirtyStateChange( false );
            }
        };
    }, [ isDirty, onDirtyStateChange ] );

    // Synchronize font edits into both local hook state AND parent settings state
    const handleTypographyChange = ( keyOrObject, value ) => {
        updateTypography( keyOrObject, value );

        if ( setTypography ) {
            setTypography( ( prev ) => {
                if ( typeof keyOrObject === 'object' ) {
                    return { ...( prev || {} ), ...keyOrObject };
                }
                return { ...( prev || {} ), [ keyOrObject ]: value };
            } );
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

    const handleConfirmSave = async () => {
        setShowConfirmModal( false );
        const result = await saveSettings();

        if ( result.success ) {
            initialSnapshotRef.current = getSettingsSnapshot( settings );
            savedCredentialsRef.current = {
                apiKey: googleApiKey || '',
                mapId: googleMapId || '',
            };
            setIsDirty( false );

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

    // DISCARD / CANCEL HANDLER
    const handleConfirmCancel = async () => {
        setShowCancelModal( false );

        // Check if user changed API key or Map ID prior to clicking discard
        const credentialsTouched =
            googleApiKey !== savedCredentialsRef.current.apiKey ||
            googleMapId !== savedCredentialsRef.current.mapId;

        if ( credentialsTouched ) {
            createSuccessNotice(
                __( 'Restoring map API credentials... Reloading page...', TEXT_DOMAIN ),
                { type: 'snackbar' }
            );
            setTimeout( () => {
                window.location.reload();
            }, 500 );
            return;
        }

        let restoredData = null;

        // Restore clean data from REST API or fallback store
        if ( typeof refetchSettings === 'function' ) {
            restoredData = await refetchSettings();
        } else {
            restoredData = window.bawbinmapsSettings || {};
            setMapDescription( restoredData.mapDescription || '' );
            setMapType( restoredData.mapType || 'hybrid' );
            setMapLogo( restoredData.mapLogo || '' );
            setColorTheme( restoredData.colorTheme || 'blue' );
            setNavBackground( restoredData.navBackground || '' );
            setGoogleApiKey( restoredData.googleApiKey || '' );
            setGoogleMapId( restoredData.googleMapId || '' );
            setTypography( restoredData.typography || {} );
        }

        // Re-align snapshot baseline to the restored dataset and deactivate action buttons
        const cleanState = restoredData || settings;
        initialSnapshotRef.current = getSettingsSnapshot( cleanState );
        setIsDirty( false );

        if ( typeof onDirtyStateChange === 'function' ) {
            onDirtyStateChange( false );
        }

        triggerMapRefresh();

        createSuccessNotice(
            __( 'Unsaved changes discarded.', TEXT_DOMAIN ),
            { type: 'snackbar' }
        );
    };

    return (
        <div
            className="wrap"
            style={ {
                height: 'calc(100vh - 65px)',
                maxHeight: 'calc(100vh - 65px)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                marginRight: '15px',
                marginLeft: '15px',
                marginBottom: '15px',
                overflow: 'hidden',
            } }
        >
            { /* HIDE WP FOOTER AND LOCK WINDOW FROM SCROLLING */ }
            <style>{ `
                #wpfooter { display: none !important; }
                #wpbody-content { padding-bottom: 0 !important; }
                html, body { overflow: hidden !important; }
            ` }</style>

            <NoticeList
                notices={ notices }
                onRemove={ removeNotice }
                style={ { marginBottom: '8px', flexShrink: 0 } }
            />

            { /* PAGE TITLE HEADER */ }
            <div style={ { flexShrink: 0 } }>
                <h1
                    className="wp-heading-inline"
                    style={ { marginBottom: '8px' } }
                >
                    { __( 'Bawbab Interactive Map Settings', TEXT_DOMAIN ) }
                </h1>
                <hr className="wp-header-end" />
            </div>

            { /* MAIN WORKSPACE CONTAINER PANEL */ }
            <div
                style={ {
                    marginTop: '8px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'row',
                } }
            >
                { /* LEFT SIDEBAR CONTAINER (FIXED 500PX WIDTH) */ }
                <div
                    style={ {
                        flex: '0 0 500px',
                        width: '500px',
                        borderRight: '1px solid #e0e0e0',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                    } }
                >
                    { /* SCROLLABLE ADMIN SIDEBAR TAB CONTENT */ }
                    <div style={ { flex: 1, minHeight: 0, overflow: 'hidden' } }>
                        <AdminSidebar
                            mapDescription={ mapDescription }
                            setMapDescription={ setMapDescription }
                            mapType={ mapType }
                            setMapType={ setMapType }
                            locations={ locations }
                            addLocation={ repeater.addLocation }
                            removeLocation={ repeater.removeLocation }
                            updateLocation={ repeater.updateLocation }
                            addImageToLocation={ repeater.addImageToLocation }
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

                    { /* STATIC ACTION FOOTER PINNED AT BOTTOM LEFT */ }
                    <div
                        style={ {
                            padding: '12px 20px',
                            borderTop: '1px solid #e0e0e0',
                            background: '#fcfcfc',
                            flexShrink: 0,
                            zIndex: 10,
                        } }
                    >
                        <div
                            style={ {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                boxSizing: 'border-box',
                            } }
                        >
                            { /* LEFT: DISCARD CHANGES */ }
                            <Button
                                variant="secondary"
                                onClick={ () => setShowCancelModal( true ) }
                                disabled={ ! isDirty || isSaving }
                                style={ {
                                    height: '38px',
                                    padding: '0 20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    whiteSpace: 'nowrap',
                                    opacity: isDirty ? 1 : 0.4,
                                    cursor: isDirty ? 'pointer' : 'default',
                                    pointerEvents: isDirty ? 'auto' : 'none',
                                } }
                            >
                                { __( 'Discard Changes', TEXT_DOMAIN ) }
                            </Button>

                            { /* RIGHT: SAVE ALL CHANGES */ }
                            <Button
                                variant="primary"
                                onClick={ () => setShowConfirmModal( true ) }
                                isBusy={ isSaving }
                                disabled={ ! isDirty || isSaving }
                                style={ {
                                    height: '38px',
                                    padding: '0 22px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    whiteSpace: 'nowrap',
                                    opacity: isDirty ? 1 : 0.4,
                                    cursor: isDirty ? 'pointer' : 'default',
                                    pointerEvents: isDirty ? 'auto' : 'none',
                                } }
                            >
                                { isSaving
                                    ? __( 'Saving...', TEXT_DOMAIN )
                                    : __( 'Save All Changes', TEXT_DOMAIN ) }
                            </Button>
                        </div>
                    </div>
                </div>

                { /* RIGHT MAP PREVIEW CONTAINER */ }
                <div style={ { flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' } }>
                    { isLoaded ? (
                        <BawBabIMaps
                            key={ `map-preview-${ refreshTrigger }` }
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
                </div>
            </div>

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
                    'Are you sure you want to discard your unsaved modifications?',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Discard Changes', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmCancel }
                onCancel={ () => setShowCancelModal( false ) }
            />
        </div>
    );
};

export default MapSettingsPage;