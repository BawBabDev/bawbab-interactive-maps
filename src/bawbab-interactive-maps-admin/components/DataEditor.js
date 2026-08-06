import { 
    Button, TextControl, TextareaControl, Flex, Dashicon, CheckboxControl,
    Modal, ComboboxControl, ToggleControl, PanelBody, __experimentalText as Text 
} from '@wordpress/components';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

const DataEditor = ({ building, draft, updateDraft, onUpdate, onCancel, hasChanges, isSaving }) => {
    if (!building || !building.properties) return null;

    const [localProps, setLocalProps] = useState(building.properties);
    const [pages, setPages] = useState([]);
    const [isLoadingPages, setIsLoadingPages] = useState(true);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        apiFetch({ path: '/wp/v2/pages?per_page=100&_fields=id,title' })
            .then((data) => {
                const options = data.map(page => ({
                    value: page.id.toString(),
                    label: page.title.rendered || `ID: ${page.id}`
                }));
                setPages(options);
            })
            .catch(err => console.error("Error fetching pages:", err))
            .finally(() => setIsLoadingPages(false));
    }, []);

    useEffect(() => {
        setLocalProps(building.properties);
    }, [building.properties]); 

    const getValue = (key, dbValue) => {
        if (draft && draft.hasOwnProperty(key)) return draft[key];
        return dbValue !== null && dbValue !== undefined ? dbValue : '';
    };

    const customTitle = getValue('title', localProps.title);
    const desc = getValue('description', localProps.description);
    const linkedPageId = getValue('wp_page_id', localProps.wp_page_id);
    const appendDescription = getValue('append_description', !!localProps.append_description);
    const sqFt = getValue('sq_ft', localProps.sq_ft);
    const baths = getValue('baths', localProps.baths);
    const hasFireplace = getValue('fireplace', !!localProps.fireplace);
    const hasSunroom = getValue('sunroom', !!localProps.sunroom);
    
    // Media Override State Getters
    const customVideoUrl = getValue('custom_video_url', localProps.custom_video_url);
    const customFloorplanUrl = getValue('custom_floorplan_url', localProps.custom_floorplan_url);
    const hidePageVideo = getValue('hide_page_video', !!localProps.hide_page_video);
    const hidePageFloorplan = getValue('hide_page_floorplan', !!localProps.hide_page_floorplan);

    const getGallery = () => {
        if (draft && draft.gallery) return draft.gallery;
        try {
            const parsed = typeof localProps.gallery === 'string' ? JSON.parse(localProps.gallery) : localProps.gallery;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    };

    const currentGallery = getGallery();
    const isResidential = ['residential_apartment', 'cottage'].includes(localProps.category);

    const handleConfirmSave = () => {
        setShowSaveModal(false);
        onUpdate();
    };

    return (
        <div className="building-editor-container" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                <Text variant="title.medium" display="block">
                    {__('Internal ID:', 'bawbab-imaps-vertical-tabs')} {localProps.name || localProps.fid}
                </Text>
            </div>

            {/* CUSTOM TITLE OVERRIDE */}
            <div style={{ marginBottom: '25px', display: 'block' }}>
                <TextControl 
                    label={__('Display Title (Overrides WP Page Title)', 'bawbab-interactive-maps')} 
                    value={customTitle} 
                    onChange={(val) => updateDraft({ title: val })}
                    placeholder={localProps.name}
                    help={__('Leave blank to fall back to the linked WP Page title.', 'bawbab-interactive-maps')}
                    __nextHasNoMarginBottom={false}
                />
            </div>

            {isResidential && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                    <TextControl label={__('Square Feet', 'bawbab-interactive-maps')} value={sqFt} onChange={(val) => updateDraft({ sq_ft: val })} placeholder={__('e.g. 980 - 1,000', 'bawbab-interactive-maps')} />
                    <TextControl label={__('Bathrooms (0-5)', 'bawbab-interactive-maps')} type="number" step="0.5" value={baths} onChange={(v) => updateDraft({ baths: v })} />
                    <CheckboxControl label={__('Has Fireplace', 'bawbab-interactive-maps')} checked={hasFireplace} onChange={(val) => updateDraft({ fireplace: val })} />
                    <CheckboxControl label={__('Has Sunroom', 'bawbab-interactive-maps')} checked={hasSunroom} onChange={(val) => updateDraft({ sunroom: val })} />
                </div>
            )}

            {/* LINKED WORDPRESS PAGE */}
            <div style={{ padding: '15px', background: '#f0f6fb', borderRadius: '4px', borderLeft: '4px solid #2271b1', marginBottom: '20px' }}>
                <ComboboxControl
                    label={__('Linked WordPress Page', 'bawbab-interactive-maps')}
                    help={__('Start typing to link a page from your site.', 'bawbab-interactive-maps')}
                    value={linkedPageId ? linkedPageId.toString() : ''}
                    onChange={(val) => updateDraft({ wp_page_id: val })}
                    options={pages}
                />
            </div>

            {/* ACF MEDIA OVERRIDES SECTION */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fcfcfc', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '12px', textTransform: 'none' }}>
                    {__('Page Media Overrides (Video & Floorplan)', 'bawbab-interactive-maps')}
                </Text>
                
                {/* Video Overrides */}
                <div style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                    <ToggleControl
                        label={__('Hide Linked Page Video', 'bawbab-interactive-maps')}
                        checked={hidePageVideo}
                        onChange={(val) => updateDraft({ hide_page_video: val })}
                    />
                    {!hidePageVideo && (
                        <div style={{ marginTop: '12px' }}>
                            <TextControl
                                label={
                                    <span style={{ textTransform: 'none', fontWeight: '500' }}>
                                        {__('Custom Video URL (Overrides Page Video)', 'bawbab-interactive-maps')}
                                    </span>
                                }
                                placeholder="e.g. https://vimeo.com/123456789"
                                value={customVideoUrl}
                                onChange={(val) => updateDraft({ custom_video_url: val })}
                                __nextHasNoMarginBottom
                            />
                        </div>
                    )}
                </div>

                {/* Floorplan Overrides */}
                <div>
                    <ToggleControl
                        label={__('Hide Linked Page Floorplan', 'bawbab-interactive-maps')}
                        checked={hidePageFloorplan}
                        onChange={(val) => updateDraft({ hide_page_floorplan: val })}
                    />
                    {!hidePageFloorplan && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <TextControl
                                    label={
                                        <span style={{ textTransform: 'none', fontWeight: '500' }}>
                                            {__('Custom Floorplan Image/PDF URL', 'bawbab-interactive-maps')}
                                        </span>
                                    }
                                    placeholder="https://..."
                                    value={customFloorplanUrl}
                                    onChange={(val) => updateDraft({ custom_floorplan_url: val })}
                                    __nextHasNoMarginBottom
                                />
                            </div>
                            <Button 
                                variant="secondary" 
                                icon="upload"
                                onClick={() => {
                                    const frame = window.wp.media({ title: __('Select Custom Floorplan', 'bawbab-interactive-maps'), multiple: false });
                                    frame.on('select', () => {
                                        const attachment = frame.state().get('selection').first().toJSON();
                                        updateDraft({ custom_floorplan_url: attachment.url });
                                    });
                                    frame.open();
                                }}
                                style={{ marginTop: '24px', height: '36px' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOM DESCRIPTION */}
            <div style={{ marginBottom: '20px' }}>
                <TextareaControl 
                    label={__('Custom Description', 'bawbab-interactive-maps')} 
                    value={desc} 
                    onChange={(val) => updateDraft({ description: val })} 
                    rows={5} 
                />
                
                {linkedPageId && desc.trim().length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fff', border: '1px solid #ccd0d4', borderRadius: '4px' }}>
                        <ToggleControl
                            label={__('Append to WP Page Content', 'bawbab-interactive-maps')}
                            help={appendDescription 
                                ? __('Custom description will appear ABOVE the linked WP page content.', 'bawbab-interactive-maps') 
                                : __('Custom description will REPLACE the linked WP page content.', 'bawbab-interactive-maps')}
                            checked={appendDescription}
                            onChange={(val) => updateDraft({ append_description: val })}
                        />
                    </div>
                )}
            </div>

            {/* MEDIA GALLERY */}
            <div style={{ margin: '20px 0' }}>
                <Text variant="label" display="block" style={{ marginBottom: '10px' }}>{__('Custom Gallery', 'bawbab-interactive-maps')}</Text>
                <Flex wrap="wrap" gap={2} style={{ marginBottom: '15px', background: '#f9f9f9', padding: '10px', borderRadius: '4px', justifyContent: 'flex-start' }}>
                    {currentGallery.map((img) => (
                        <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                            <Button isDestructive onClick={() => updateDraft({ gallery: currentGallery.filter(g => g.id !== img.id) })} style={{ position: 'absolute', top: '-5px', right: '-5px', padding: '0', background: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px', border: '1px solid #ccc' }}><Dashicon icon="no-alt" size={14} /></Button>
                        </div>
                    ))}
                </Flex>
                <Button variant="secondary" icon="upload" onClick={() => {
                    const frame = window.wp.media({ title: __('Manage Gallery', 'bawbab-interactive-maps'), multiple: true });
                    frame.on('select', () => {
                        const selection = frame.state().get('selection').toJSON();
                        const newImages = selection.map(img => ({ id: img.id, url: img.url }));
                        updateDraft({ gallery: [...currentGallery, ...newImages] });
                    });
                    frame.open();
                }} style={{ width: '100%', justifyContent: 'center' }}>{__('Manage Images', 'bawbab-interactive-maps')}</Button>
            </div>

            {/* ACTION BUTTONS */}
            <Flex justify="flex-start" style={{ marginTop: '30px', gap: '15px' }}>
                <Button variant="secondary" onClick={() => setShowCancelModal(true)} disabled={isSaving || !hasChanges} style={{ height: '40px', flex: '1', justifyContent: 'center' }}>
                    {__('Discard All Changes', 'bawbab-interactive-maps')}
                </Button>
                <Button variant="primary" isBusy={isSaving} disabled={!hasChanges} onClick={() => setShowSaveModal(true)} style={{ height: '40px', flex: '1', justifyContent: 'center' }}>
                    {__('Save All Changes', 'bawbab-interactive-maps')}
                </Button>
            </Flex>

            {/* MODALS */}
            {showSaveModal && (
                <Modal title={__('Save All Changes?', 'bawbab-interactive-maps')} onRequestClose={() => setShowSaveModal(false)}>
                    <p>{__('This will save all pending modifications to the map database.', 'bawbab-interactive-maps')}</p>
                    <Flex justify="flex-end" style={{ marginTop: '20px' }}>
                        <Button variant="tertiary" onClick={() => setShowSaveModal(false)}>{__('Wait, go back', 'bawbab-interactive-maps')}</Button>
                        <Button variant="primary" onClick={handleConfirmSave}>{__('Confirm and Save All', 'bawbab-interactive-maps')}</Button>
                    </Flex>
                </Modal>
            )}

            {showCancelModal && (
                <Modal title={__('Discard Changes?', 'bawbab-interactive-maps')} onRequestClose={() => setShowCancelModal(false)}>
                    <p>{__('You have unsaved modifications. Discarding will reset all features to their last saved state.', 'bawbab-interactive-maps')}</p>
                    <Flex justify="flex-end" style={{ marginTop: '20px' }}>
                        <Button variant="tertiary" onClick={() => setShowCancelModal(false)}>{__('Keep editing', 'bawbab-interactive-maps')}</Button>
                        <Button isDestructive onClick={() => { onCancel(); setShowCancelModal(false); }}>{__('Discard Everything', 'bawbab-interactive-maps')}</Button>
                    </Flex>
                </Modal>
            )}
        </div>
    );
};

export default DataEditor;