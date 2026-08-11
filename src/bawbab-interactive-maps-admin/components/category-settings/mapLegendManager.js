import { useState } from '@wordpress/element';
import { Panel, PanelBody, Button, CheckboxControl, ToggleControl, Flex, TextControl, Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const MapLegendManager = ({ 
    categoryMap, 
    legendConfig, 
    setLegendConfig,
    isOpen,
    onToggle
}) => {
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeLabel, setMergeLabel] = useState('');
    const [selectedMergeCats, setSelectedMergeCats] = useState([]);

    const allCategorySlugs = Object.keys(categoryMap);

    const handleToggleLegendItem = (itemId, checked) => {
        setLegendConfig(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === itemId ? { ...item, showInLegend: checked } : item)
        }));
    };

    const handleMoveLegendItem = (index, direction) => {
        const items = [...legendConfig.items];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const temp = items[index];
        items[index] = items[targetIndex];
        items[targetIndex] = temp;

        setLegendConfig(prev => ({ ...prev, items }));
    };

    const handleConfirmMergeCategories = () => {
        if (!mergeLabel.trim() || selectedMergeCats.length < 2) return;

        const newItem = {
            id: `merge_${Date.now()}`,
            label: mergeLabel.trim(),
            type: 'merged',
            categories: selectedMergeCats,
            showInLegend: true
        };

        const filteredItems = legendConfig.items.filter(item => {
            return !item.categories.some(cat => selectedMergeCats.includes(cat));
        });

        setLegendConfig(prev => ({
            ...prev,
            items: [newItem, ...filteredItems]
        }));

        setMergeLabel('');
        setSelectedMergeCats([]);
        setShowMergeModal(false);
    };

    const handleUnmergeItem = (itemId) => {
        const targetItem = legendConfig.items.find(i => i.id === itemId);
        if (!targetItem || targetItem.type !== 'merged') return;

        const restoredItems = targetItem.categories.map(catSlug => ({
            id: `leg_${catSlug}_${Date.now()}`,
            label: categoryMap[catSlug]?.label || catSlug,
            type: 'single',
            categories: [catSlug],
            showInLegend: true
        }));

        setLegendConfig(prev => ({
            ...prev,
            items: [
                ...prev.items.filter(i => i.id !== itemId),
                ...restoredItems
            ]
        }));
    };

    return (
        <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
            <PanelBody 
                title={__('3. Map Legend Customizer & Merging', TEXT_DOMAIN)} 
                opened={isOpen}
                onToggle={onToggle}
            >
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                    {__('Configure which categories appear in the public map legend, reorder entries, or merge multiple categories under a single label.', TEXT_DOMAIN)}
                </p>

                <Flex align="center" justify="space-between" style={{ marginBottom: '20px', padding: '12px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
                    <ToggleControl
                        label={__('Enable Public Map Legend', TEXT_DOMAIN)}
                        checked={Boolean(legendConfig.enabled)}
                        onChange={(val) => setLegendConfig(prev => ({ ...prev, enabled: val }))}
                        __nextHasNoMarginBottom
                    />

                    <Button
                        variant="secondary"
                        icon="groups"
                        onClick={() => setShowMergeModal(true)}
                        disabled={!legendConfig.enabled}
                    >
                        {__('Merge Categories into 1 Legend Line', TEXT_DOMAIN)}
                    </Button>
                </Flex>

                {legendConfig.enabled && (
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 200px 120px 80px', gap: '12px', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                            <span style={{ textAlign: 'center' }}>{__('Show', TEXT_DOMAIN)}</span>
                            <span>{__('Legend Label', TEXT_DOMAIN)}</span>
                            <span>{__('Mapped Category Swatches', TEXT_DOMAIN)}</span>
                            <span style={{ textAlign: 'center' }}>{__('Reorder', TEXT_DOMAIN)}</span>
                            <span style={{ textAlign: 'center' }}>{__('Action', TEXT_DOMAIN)}</span>
                        </div>

                        {legendConfig.items.map((item, index) => {
                            const isFirst = index === 0;
                            const isLast = index === legendConfig.items.length - 1;

                            return (
                                <div 
                                    key={item.id}
                                    style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '60px 1fr 200px 120px 80px', 
                                        gap: '12px', 
                                        padding: '10px 12px', 
                                        alignItems: 'center',
                                        borderBottom: isLast ? 'none' : '1px solid #eee',
                                        background: index % 2 === 0 ? '#fff' : '#fafafa',
                                        opacity: item.showInLegend ? 1 : 0.5
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <CheckboxControl
                                            checked={Boolean(item.showInLegend)}
                                            onChange={(checked) => handleToggleLegendItem(item.id, checked)}
                                            __nextHasNoMarginBottom
                                        />
                                    </div>

                                    <div>
                                        <strong>{item.label}</strong>
                                        {item.type === 'merged' && (
                                            <span style={{ fontSize: '11px', color: '#2271b1', marginLeft: '8px', background: '#f0f6fb', padding: '2px 6px', borderRadius: '3px' }}>
                                                {sprintf(__('[Merged %d categories]', TEXT_DOMAIN), item.categories.length)}
                                            </span>
                                        )}
                                    </div>

                                    <Flex align="center" gap={1}>
                                        {item.categories.map(catSlug => {
                                            const catColor = categoryMap[catSlug]?.color || '#007cba';
                                            return (
                                                <div 
                                                    key={catSlug}
                                                    title={`${categoryMap[catSlug]?.label || catSlug} (${catColor})`}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        background: catColor,
                                                        border: '1px solid #ccc'
                                                    }}
                                                />
                                            );
                                        })}
                                    </Flex>

                                    <Flex justify="center" gap={1}>
                                        <Button
                                            isSmall
                                            icon="arrow-up-alt2"
                                            disabled={isFirst}
                                            onClick={() => handleMoveLegendItem(index, -1)}
                                            label={__('Move Up', TEXT_DOMAIN)}
                                        />
                                        <Button
                                            isSmall
                                            icon="arrow-down-alt2"
                                            disabled={isLast}
                                            onClick={() => handleMoveLegendItem(index, 1)}
                                            label={__('Move Down', TEXT_DOMAIN)}
                                        />
                                    </Flex>

                                    <div style={{ textAlign: 'center' }}>
                                        {item.type === 'merged' && (
                                            <Button
                                                isSmall
                                                isDestructive
                                                icon="editor-break"
                                                onClick={() => handleUnmergeItem(item.id)}
                                                label={__('Unmerge Categories', TEXT_DOMAIN)}
                                                showTooltip
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </PanelBody>

            {/* MODAL: MERGE CATEGORIES */}
            {showMergeModal && (
                <Modal 
                    title={__('Merge Categories into Single Legend Entry', TEXT_DOMAIN)}
                    onRequestClose={() => setShowMergeModal(false)}
                    style={{ maxWidth: '500px', width: '100%' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <TextControl
                            label={__('Unified Legend Entry Label', TEXT_DOMAIN)}
                            placeholder="e.g. Indoor Pathing Systems"
                            value={mergeLabel}
                            onChange={setMergeLabel}
                        />

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '8px' }}>
                                {__('Select Categories to Merge (At least 2)', TEXT_DOMAIN)}
                            </label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                                {allCategorySlugs.map(slug => {
                                    const isChecked = selectedMergeCats.includes(slug);
                                    return (
                                        <CheckboxControl
                                            key={`merge_check_${slug}`}
                                            label={`${categoryMap[slug]?.label || slug} (${slug})`}
                                            checked={isChecked}
                                            onChange={(checked) => {
                                                if (checked) {
                                                    setSelectedMergeCats(prev => [...prev, slug]);
                                                } else {
                                                    setSelectedMergeCats(prev => prev.filter(s => s !== slug));
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <Flex justify="flex-end" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <Button variant="tertiary" onClick={() => setShowMergeModal(false)}>
                                {__('Cancel', TEXT_DOMAIN)}
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleConfirmMergeCategories} 
                                disabled={!mergeLabel.trim() || selectedMergeCats.length < 2}
                            >
                                {__('Merge into Single Item', TEXT_DOMAIN)}
                            </Button>
                        </Flex>
                    </div>
                </Modal>
            )}
        </Panel>
    );
};