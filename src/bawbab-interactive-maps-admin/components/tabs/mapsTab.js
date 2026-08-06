import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalText as Text, TextareaControl, Flex, Button } from '@wordpress/components';
import { useWPMediaUploader } from '../../utils/useWPMediaUploader';

export const MapsTab = ({ mapDescription,setMapDescription,  mapLogo,setMapLogo,navBackground, setNavBackground }) => {
    return (
        <div className="tab-content">
            <Text variant="title.small" display="block" style={{ marginBottom: '15px' }}>{__('Global Map Details', 'bawbab-interactive-maps')}</Text>
            <TextareaControl label={__('Main Map Description', 'bawbab-interactive-maps')} value={mapDescription} onChange={setMapDescription} rows={8} />
        
            {/* --- LOGO SECTION --- */}
            <div style={{ marginTop: '25px', padding: '20px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <Text variant="label" display="block" style={{ marginBottom: '10px', fontWeight: '600' }}>
                    {__('Map Logo', 'bawbab-interactive-maps')}
                </Text>
                
                {mapLogo && (
                    <div style={{ marginBottom: '15px', background: '#fff', padding: '10px', border: '1px solid #ccc', display: 'inline-block' }}>
                        <img src={mapLogo} alt={__('Logo Preview', 'bawbab-interactive-maps')} style={{ maxHeight: '80px', maxWidth: '100%', display: 'block' }} />
                    </div>
                )}

                <Flex justify="flex-start" gap={3}>
                    {/* Logo Selection*/}
                    <Button variant="secondary" onClick={() => useWPMediaUploader((img) => setMapLogo(img.url), 'Logo')}>
                        {mapLogo ? __('Change Logo', 'bawbab-interactive-maps') : __('Upload Logo', 'bawbab-interactive-maps')}
                    </Button>
                    {mapLogo && (
                        <Button isDestructive variant="link" onClick={() => setMapLogo('')}>
                            {__('Remove Logo', 'bawbab-interactive-maps')}
                        </Button>
                    )}
                </Flex>
                <Text variant="muted" display="block" style={{ marginTop: '10px' }}>
                    {__('This logo will appear in the top navigation bar of the interactive map.', 'bawbab-interactive-maps')}
                </Text>
            </div>

            {/* --- NAVBAR BACKGROUND SECTION --- */}
            <div style={{ marginTop: '25px', padding: '20px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <Text variant="label" display="block" style={{ marginBottom: '10px', fontWeight: '600' }}>{__('Navbar Background Image', 'bawbab-interactive-maps')}</Text>

                {/* Re-use the same Media Library logic as logo */}
                <Flex justify="flex-start" gap={3}>
                    <Button variant="secondary" onClick={() => {
                        const frame = window.wp.media({ title: __('Select Background', 'bawbab-interactive-maps'), multiple: false });
                        frame.on('select', () => setNavBackground(frame.state().get('selection').first().toJSON().url));
                        frame.open();
                    }}>
                        {navBackground ? __('Change Background', 'bawbab-interactive-maps') : __('Upload Background', 'bawbab-interactive-maps')}
                    </Button>
                    {navBackground && (
                        <Button isDestructive variant="link" onClick={() => setNavBackground('')}>
                            {__('Remove', 'bawbab-interactive-maps')}
                        </Button>
                    )}
                </Flex>
                <Text variant="caption" color="#666" display="block" style={{ marginTop: '10px' }}>
                    {__('Will be displayed as a faded background in the top bar.', 'bawbab-interactive-maps')}
                </Text>
            </div>
        </div>
    );
};
