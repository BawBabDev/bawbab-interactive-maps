import { useState } from '@wordpress/element';
import { Dashicon, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { MapsTab } from './tabs/mapsTab';
import { LocationsTab } from './tabs/locationsTab';
import { SettingsTab } from './tabs/settingsTab';
import { SpatialDataUploader } from './tabs/spatialDataUploader';
import { InfoTab } from './tabs/infoTab';
import TypographyTab from './tabs/typographyTab';

const AdminSidebar = ( {
    mapDescription,
    setMapDescription,
    mapType,
    setMapType,
    locations,
    addLocation,
    removeLocation,
    updateLocation,
    addImageToLocation,
    removeImageFromLocation,
    onUploadSuccess,
    mapLogo,
    setMapLogo,
    navBackground,
    setNavBackground,
    colorTheme,
    setColorTheme,
    googleApiKey,
    setGoogleApiKey,
    googleMapId,
    setGoogleMapId,
    typographySettings,
    updateTypography,
    resetTypography,
} ) => {
    const [ activeTab, setActiveTab ] = useState( 'map' );

    const tabs = [
        {
            name: 'map',
            label: __( 'Map', 'bawbab-interactive-maps' ),
            icon: <Dashicon icon="location-alt" />,
        },
        {
            name: 'locations',
            label: __( 'Locations', 'bawbab-interactive-maps' ),
            icon: <Dashicon icon="location" />,
        },
        {
            name: 'importer',
            label: __( 'Importer', 'bawbab-interactive-maps' ),
            icon: <Dashicon icon="cloud-upload" />,
        },
        {
            name: 'settings',
            label: __( 'Layout Settings', 'bawbab-interactive-maps' ),
            icon: <Dashicon icon="admin-settings" />,
        },
        {
            name: 'typography',
            label: __( 'Font Management', 'bawbab-interactive-maps' ),
            icon: (
                <span
                    style={ {
                        fontWeight: 800,
                        fontSize: '13px',
                        lineHeight: 1,
                        letterSpacing: '-1px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                    } }
                >
                    Aa
                </span>
            ),
        },
        {
            name: 'info',
            label: __( 'Info', 'bawbab-interactive-maps' ),
            icon: <Dashicon icon="info" />,
        },
    ];

    return (
        <div
            style={ {
                display: 'flex',
                height: '100%',
                width: '100%',
                minHeight: 0,
                overflow: 'hidden',
                background: '#fff',
            } }
        >
            { /* LEFT COLUMN: VERTICAL TAB NAVIGATION (100PX FIXED WIDTH) */ }
            <div
                style={ {
                    width: '100px',
                    flex: '0 0 100px',
                    borderRight: '1px solid #e0e0e0',
                    background: '#fcfcfc',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                } }
            >
                { tabs.map( ( tab ) => {
                    const isActive = activeTab === tab.name;
                    return (
                        <Button
                            key={ tab.name }
                            onClick={ () => setActiveTab( tab.name ) }
                            style={ {
                                height: '70px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 0,
                                margin: 0,
                                borderBottom: '1px solid #eee',
                                background: isActive ? '#fff' : 'transparent',
                                color: isActive ? '#007cba' : '#555',
                                boxShadow: isActive ? 'inset 4px 0 0 #007cba' : 'none',
                                fontWeight: isActive ? '600' : '400',
                                cursor: 'pointer',
                                padding: '8px 4px',
                            } }
                        >
                            <div
                                style={ {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                } }
                            >
                                { tab.icon }
                                <span style={ { textAlign: 'center', lineHeight: '1.2' } }>
                                    { tab.label }
                                </span>
                            </div>
                        </Button>
                    );
                } ) }
            </div>

            { /* RIGHT COLUMN: TAB CONTENT (SCROLLABLE CONTAINER) */ }
            <div
                style={ {
                    flex: 1,
                    height: '100%',
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '20px',
                    boxSizing: 'border-box',
                } }
            >
                { activeTab === 'map' && (
                    <MapsTab
                        mapDescription={ mapDescription }
                        setMapDescription={ setMapDescription }
                        mapType={ mapType }
                        setMapType={ setMapType }
                        googleApiKey={ googleApiKey }
                        setGoogleApiKey={ setGoogleApiKey }
                        googleMapId={ googleMapId }
                        setGoogleMapId={ setGoogleMapId }
                    />
                ) }

                { activeTab === 'locations' && (
                    <LocationsTab
                        locations={ locations }
                        updateLocation={ updateLocation }
                        removeImageFromLocation={ removeImageFromLocation }
                        addImageToLocation={ addImageToLocation }
                        removeLocation={ removeLocation }
                        addLocation={ addLocation }
                    />
                ) }

                { activeTab === 'importer' && (
                    <SpatialDataUploader onUploadSuccess={ onUploadSuccess } />
                ) }

                { activeTab === 'settings' && (
                    <SettingsTab
                        mapLogo={ mapLogo }
                        setMapLogo={ setMapLogo }
                        navBackground={ navBackground }
                        setNavBackground={ setNavBackground }
                        colorTheme={ colorTheme }
                        setColorTheme={ setColorTheme }
                    />
                ) }

                { activeTab === 'typography' && (
                    <TypographyTab
                        typographySettings={ typographySettings }
                        updateTypography={ updateTypography }
                        resetTypography={ resetTypography }
                    />
                ) }

                { activeTab === 'info' && <InfoTab /> }
            </div>
        </div>
    );
};

export default AdminSidebar;