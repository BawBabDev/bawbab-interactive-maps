import { 
    TabPanel, PanelBody, Button, TextControl, TextareaControl, ExternalLink,
    SelectControl, ToggleControl, Flex, FlexItem, Dashicon, __experimentalText as Text 
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { MapsTab } from './tabs/mapsTab';
import { LocationsTab } from './tabs/locationsTab';
import { SettingsTab } from './tabs/settingsTab';
import { SpatialDataUploader } from './tabs/spatialDataUploader';
import { InfoTab } from './tabs/infoTab';

const AdminSidebar = ({ 
    mapDescription, setMapDescription, mapType, setMapType, locations, addLocation, removeLocation, 
    updateLocation, addImageToLocation, removeImageFromLocation, onUploadSuccess, mapLogo, setMapLogo, navBackground, 
    setNavBackground, colorTheme, setColorTheme, googleApiKey, setGoogleApiKey, googleMapId, setGoogleMapId 
}) => {
    const tabs = [
        { name: 'map', title: (<div className="tab-label"><Dashicon icon="location-alt" /><span>{__('Map', 'bawbab-interactive-maps')}</span></div>) },
        { name: 'locations', title: (<div className="tab-label"><Dashicon icon="location" /><span>{__('Locations', 'bawbab-interactive-maps')}</span></div>) },
        { name: 'importer', title: (<div className="tab-label"><Dashicon icon="cloud-upload" /><span>{__('Importer', 'bawbab-interactive-maps')}</span></div>) },
        { name: 'settings', title: (<div className="tab-label"><Dashicon icon="admin-settings" /><span>{__('Layout Settings', 'bawbab-interactive-maps')}</span></div>) },
        { name: 'info', title: (<div className="tab-label"><Dashicon icon="info" /><span>{__('Info', 'bawbab-interactive-maps')}</span></div>) },
    ];

    return (
        <div className="wrap">
            <TabPanel className="bawbab-imaps-vertical-tabs" orientation="vertical" tabs={tabs} style={{ background: "#fff" }}>
                {(tab) => (
                    <div style={{ padding: '0', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {tab.name === 'map' && (
                                <MapsTab 
                                    mapDescription={mapDescription}
                                    setMapDescription={setMapDescription}
                                    mapType={mapType}
                                    setMapType={setMapType}
                                    googleApiKey={googleApiKey}
                                    setGoogleApiKey={setGoogleApiKey}
                                    googleMapId={googleMapId}
                                    setGoogleMapId={setGoogleMapId}
                                />
                            )}

                            {tab.name === 'locations' && (
                                <LocationsTab 
                                    locations={locations}
                                    updateLocation={updateLocation}
                                    removeImageFromLocation={removeImageFromLocation}
                                    addImageToLocation={addImageToLocation}
                                    removeLocation={removeLocation}
                                    addLocation={addLocation}
                                />
                            )}

                            {tab.name === 'importer' && (
                                <SpatialDataUploader onUploadSuccess={onUploadSuccess} />
                            )}

                            {tab.name === 'settings' && (
                                <SettingsTab
                                    mapLogo={mapLogo}
                                    setMapLogo={setMapLogo}
                                    navBackground={navBackground}
                                    setNavBackground={setNavBackground}
                                    colorTheme={colorTheme}
                                    setColorTheme={setColorTheme}
                                />
                            )}

                            {tab.name === 'info' && (
                                <InfoTab />
                            )}
                        </div>
                    </div>
                )}
            </TabPanel>
        </div>
    );
};

export default AdminSidebar;