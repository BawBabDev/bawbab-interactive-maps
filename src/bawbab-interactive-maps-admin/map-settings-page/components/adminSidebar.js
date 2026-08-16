import { TabPanel, Dashicon } from '@wordpress/components';
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
    const tabs = [
        {
            name: 'map',
            title: (
                <div className="tab-label">
                    <Dashicon icon="location-alt" />
                    <span>{ __( 'Map', 'bawbab-interactive-maps' ) }</span>
                </div>
            ),
        },
        {
            name: 'locations',
            title: (
                <div className="tab-label">
                    <Dashicon icon="location" />
                    <span>
                        { __( 'Locations', 'bawbab-interactive-maps' ) }
                    </span>
                </div>
            ),
        },
        {
            name: 'importer',
            title: (
                <div className="tab-label">
                    <Dashicon icon="cloud-upload" />
                    <span>{ __( 'Importer', 'bawbab-interactive-maps' ) }</span>
                </div>
            ),
        },
        {
            name: 'settings',
            title: (
                <div className="tab-label">
                    <Dashicon icon="admin-settings" />
                    <span>
                        { __( 'Layout Settings', 'bawbab-interactive-maps' ) }
                    </span>
                </div>
            ),
        },
        {
            name: 'typography',
            title: (
                <div className="tab-label">
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
                    <span>
                        { __( 'Font Management', 'bawbab-interactive-maps' ) }
                    </span>
                </div>
            ),
        },
        {
            name: 'info',
            title: (
                <div className="tab-label">
                    <Dashicon icon="info" />
                    <span>{ __( 'Info', 'bawbab-interactive-maps' ) }</span>
                </div>
            ),
        },
    ];

    return (
        <div className="wrap">
            <TabPanel
                className="bawbab-imaps-vertical-tabs"
                orientation="vertical"
                tabs={ tabs }
                style={ { background: '#fff' } }
            >
                { ( tab ) => (
                    <div
                        style={ {
                            padding: '0',
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        } }
                    >
                        <div
                            style={ {
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px',
                            } }
                        >
                            { tab.name === 'map' && (
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

                            { tab.name === 'locations' && (
                                <LocationsTab
                                    locations={ locations }
                                    updateLocation={ updateLocation }
                                    removeImageFromLocation={
                                        removeImageFromLocation
                                    }
                                    addImageToLocation={ addImageToLocation }
                                    removeLocation={ removeLocation }
                                    addLocation={ addLocation }
                                />
                            ) }

                            { tab.name === 'importer' && (
                                <SpatialDataUploader
                                    onUploadSuccess={ onUploadSuccess }
                                />
                            ) }

                            { tab.name === 'settings' && (
                                <SettingsTab
                                    mapLogo={ mapLogo }
                                    setMapLogo={ setMapLogo }
                                    navBackground={ navBackground }
                                    setNavBackground={ setNavBackground }
                                    colorTheme={ colorTheme }
                                    setColorTheme={ setColorTheme }
                                />
                            ) }

                            { tab.name === 'typography' && (
                                <TypographyTab
                                    typographySettings={ typographySettings }
                                    updateTypography={ updateTypography }
                                    resetTypography={ resetTypography }
                                />
                            ) }

                            { tab.name === 'info' && <InfoTab /> }
                        </div>
                    </div>
                ) }
            </TabPanel>
        </div>
    );
};

export default AdminSidebar;