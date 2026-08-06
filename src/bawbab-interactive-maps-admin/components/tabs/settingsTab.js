import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalText as Text, SelectControl, PanelBody, Flex, FlexItem, TextControl,Button } from '@wordpress/components';

export const SettingsTab = ({ mapType, setMapType, colorTheme, setColorTheme, googleApiKey, setGoogleApiKey, googleMapId, setGoogleMapId
}) => {
    const [showApiKey, setShowApiKey] = useState(false);
    const [showMapId, setShowMapId] = useState(false);

    return (
        <div className="tab-content">
            <Text variant="title.small" display="block" style={{ marginBottom: '15px' }}>{__('Global Interface Style', 'bawbab-interactive-maps')}</Text>
            <SelectControl 
                label={__('Default Map View', 'bawbab-interactive-maps')} 
                value={mapType} 
                options={[
                    { label: __('Normal (Roadmap)', 'bawbab-interactive-maps'), value: 'roadmap' },
                    { label: __('Hybrid', 'bawbab-interactive-maps'), value: 'hybrid' }, 
                    { label: __('Satellite', 'bawbab-interactive-maps'), value: 'satellite' }
                ]} 
                onChange={setMapType} 
            />
            
            <hr style={{ margin: '20px 0' }} />

            <SelectControl 
                label={__('Color Theme', 'bawbab-interactive-maps')} 
                value={colorTheme} 
                options={[
                    { label: __('Corporate Blue', 'bawbab-interactive-maps'), value: 'blue' }, 
                    { label: __('Nature Green', 'bawbab-interactive-maps'), value: 'green' }, 
                    { label: __('Estate Yellow', 'bawbab-interactive-maps'), value: 'yellow' }
                ]} 
                onChange={setColorTheme} 
            />

            {/* VISUAL THEME PREVIEW BOX */}
            <div className={`map-theme-${colorTheme}`} style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <div style={{ background: 'var(--map-header-bg)', padding: '10px', borderRadius: '4px', borderLeft: '4px solid var(--map-primary)' }}>
                    <strong style={{ color: 'var(--map-primary)', fontSize: '12px', display: 'block' }}>{__('Theme Preview', 'bawbab-interactive-maps')}</strong>
                    <span style={{ color: 'var(--map-text-dark)', fontSize: '11px' }}>{__('This is how titles and highlights will appear.', 'bawbab-interactive-maps')}</span>
                </div>
                <div style={{ marginTop: '10px', background: 'var(--map-accent)', padding: '8px', fontSize: '10px', borderRadius: '4px', textAlign: 'center', color: 'var(--map-primary)', fontWeight: 'bold' }}>
                    {__('Active Button / Hover State', 'bawbab-interactive-maps')}
                </div>
            </div>

            <PanelBody title={__('Google Maps Configuration', 'bawbab-interactive-maps')} style={{ marginTop: '20px' }}>
                {/* --- API KEY INPUT --- */}
                <div style={{ marginBottom: '15px' }}>
                    <Flex align="center" gap={0}>
                        <FlexItem style={{ flexGrow: 1 }}>
                            <TextControl
                                label={__('Google Maps API Key', 'bawbab-interactive-maps')}
                                type={showApiKey ? 'text' : 'password'}
                                value={googleApiKey}
                                onChange={setGoogleApiKey}
                                __nextHasNoMarginBottom
                            />
                        </FlexItem>
                        <FlexItem>
                            <Button 
                                variant="tertiary" // tertiary removes the background and the "link" underline
                                icon={showApiKey ? "visibility" : "hidden"} 
                                onClick={() => setShowApiKey(!showApiKey)}
                                style={{ 
                                    height: '30px', // Smaller footprint
                                    padding: '0 4px', 
                                    marginTop: '26px', // Fine-tuned alignment with the input box center
                                    boxShadow: 'none',
                                    minWidth: 'auto',
                                    border: 'none',
                                    textDecoration: 'none' // Ensures no underline remains
                                }}
                            />
                        </FlexItem>
                    </Flex>
                    <Text variant="caption" color="#666" style={{ marginTop: '4px', display: 'block' }}>
                        {__('Enter your API key from the Google Cloud Console.', 'bawbab-interactive-maps')}
                    </Text>
                </div>

                {/* --- MAP ID INPUT --- */}
                <div>
                    <Flex align="center" gap={0}>
                        <FlexItem style={{ flexGrow: 1 }}>
                            <TextControl
                                label={__('Google Map ID', 'bawbab-interactive-maps')}
                                type={showMapId ? 'text' : 'password'}
                                value={googleMapId}
                                onChange={setGoogleMapId}
                                __nextHasNoMarginBottom
                            />
                        </FlexItem>
                        <FlexItem>
                            <Button 
                                variant="tertiary"
                                icon={showMapId ? "visibility" : "hidden"} 
                                onClick={() => setShowMapId(!showMapId)}
                                style={{ height: '30px',  padding: '0 4px', marginTop: '26px', 
                                    boxShadow: 'none', minWidth: 'auto', border: 'none',textDecoration: 'none'
                                }}
                            />
                        </FlexItem>
                    </Flex>
                    <Text variant="caption" color="#666" style={{ marginTop: '4px', display: 'block' }}>
                        {__('Required for Advanced Markers and Cloud Styling.', 'bawbab-interactive-maps')}
                    </Text>
                </div>
            </PanelBody>
        </div>
    );
};
