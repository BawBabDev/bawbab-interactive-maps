import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalText as Text, PanelBody,TextControl,Flex, FlexItem, ToggleControl, Button,Dashicon,TextareaControl, ExternalLink } from '@wordpress/components';
import { useWPMediaUploader } from '../../utils/useWPMediaUploader';

export const LocationsTab = ({ locations, updateLocation, removeImageFromLocation, addImageToLocation,removeLocation, addLocation }) => {
    return (
        <div className="tab-content">
            <Text variant="title.small" display="block" style={{ marginBottom: '15px' }}>{__('Estate Locations', 'bawbab-interactive-maps')}</Text>
            {locations.map((loc, i) => (
                <PanelBody key={i} title={loc.title || `${__('New Location', 'bawbab-interactive-maps')} #${i + 1}`} initialOpen={i === 0} className="location-repeater-item">
                    <div style={{ padding: '5px 0' }}>
                        <TextControl label={__('Location Title', 'bawbab-interactive-maps')} value={loc.title} onChange={(v) => updateLocation(i, 'title', v)} />
                        <Flex gap={2} style={{ marginTop: '15px' }}>
                            <FlexItem style={{ flex: 1 }}><TextControl label={__('Lat', 'bawbab-interactive-maps')} value={loc.lat} onChange={(v) => updateLocation(i, 'lat', v)} /></FlexItem>
                            <FlexItem style={{ flex: 1 }}><TextControl label={__('Lng', 'bawbab-interactive-maps')} value={loc.lng} onChange={(v) => updateLocation(i, 'lng', v)} /></FlexItem>
                        </Flex>
                        <Flex wrap="wrap" style={{ marginTop: '15px', marginBottom: '15px' }}>
                            <ToggleControl
                                label={__('Show or hide Marker on Map', 'bawbab-interactive-maps')}
                                checked={ loc.showMarker ?? true }
                                onChange={(v) => updateLocation(i, 'showMarker', v)}
                            />
                        </Flex>
                        <div style={{ margin: '20px 0' }}>
                            <Flex wrap="wrap" gap={2} style={{ marginBottom: '10px', justifyContent: 'flex-start' }}>
                                {loc.gallery?.map((img, imgIdx) => (
                                    <div key={imgIdx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                        <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                        <Button isDestructive onClick={() => removeImageFromLocation(i, imgIdx)} style={{ position: 'absolute', top: '-5px', right: '-5px', padding: '0', background: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px' }}><Dashicon icon="no-alt" size={14} /></Button>
                                    </div>
                                ))}
                            </Flex>
                            {/* Media upload button */}
                            {(!loc.gallery || loc.gallery.length < 5) && (
                                <Button 
                                    variant="secondary" 
                                    icon="upload" 
                                    onClick={() => useWPMediaUploader((img) => addImageToLocation(i, { id: img.id, url: img.url }), 'Image')}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {__('Add Image', 'bawbab-interactive-maps')}
                                </Button>
                            )}
                        </div>

                        <TextareaControl label={__('Description', 'bawbab-interactive-maps')} value={loc.description} onChange={(v) => updateLocation(i, 'description', v)} rows={3} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <Button isDestructive variant="link" icon="trash" onClick={() => removeLocation(i)} showTooltip label={__('Delete Location', 'bawbab-interactive-maps')} />
                        </div>
                    </div>
                </PanelBody>
            ))}
            <Button variant="secondary" icon="plus" onClick={addLocation} style={{ width: '100%', justifyContent: 'center' }}>{__('Add New Location', 'bawbab-interactive-maps')}</Button>
            <Flex wrap="wrap" gap={2} style={{ margin: '10px 0px', justifyContent: 'flex-end' }}>
                <ExternalLink href="admin.php?page=bawbab-interactive-maps-edit-spatial-data" style={{ color: 'red' }}>
                    {__('Edit Uploaded Buildings Data', 'bawbab-interactive-maps')}
                </ExternalLink>
            </Flex>
        </div>
    );
};
