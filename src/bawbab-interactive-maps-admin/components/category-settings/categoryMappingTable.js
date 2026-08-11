import { useState } from '@wordpress/element';
import { Panel, PanelBody, Button, TextControl, SelectControl, Flex, ColorPicker, Dropdown, Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const CategoryMappingTable = ({ 
    groups, 
    categoryMap, 
    setCategoryMap,
    isOpen,
    onToggle
}) => {
    const [showAddCatModal, setShowAddCatModal] = useState(false);
    const [newCatLabel, setNewCatLabel] = useState('');
    const [newCatGroupId, setNewCatGroupId] = useState('');
    const [newCatColor, setNewCatColor] = useState('#007cba');

    const derivedCatSlug = (newCatLabel || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');

    const handleUpdateCategory = (catSlug, key, value) => {
        setCategoryMap(prev => ({
            ...prev,
            [catSlug]: {
                ...(prev[catSlug] || {}),
                [key]: value
            }
        }));
    };

    const handleConfirmAddCategory = () => {
        if (!newCatLabel.trim() || !derivedCatSlug) return;

        if (categoryMap[derivedCatSlug]) {
            alert(__('A category with this database slug already exists.', TEXT_DOMAIN));
            return;
        }

        setCategoryMap(prev => ({
            ...prev,
            [derivedCatSlug]: {
                label: newCatLabel.trim(),
                groupId: newCatGroupId,
                color: newCatColor
            }
        }));

        setNewCatLabel('');
        setNewCatGroupId('');
        setNewCatColor('#007cba');
        setShowAddCatModal(false);
    };

    const groupOptions = [
        { label: __('-- Unassigned / Hidden from Public Menu --', TEXT_DOMAIN), value: '' },
        ...groups.map(g => ({ label: g.title, value: g.id }))
    ];

    const allCategorySlugs = Object.keys(categoryMap);

    return (
        <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '15px' }}>
            <PanelBody 
                title={__('2. Spatial Categories Configuration (1-to-1 Mapping)', TEXT_DOMAIN)} 
                opened={isOpen}
                onToggle={onToggle}
            >
                <Flex justify="space-between" align="center" style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                        {__('Categories map 1-to-1 to navigation groups and determine feature styling across the map.', TEXT_DOMAIN)}
                    </p>
                    <Button
                        variant="secondary"
                        icon="plus-alt"
                        onClick={() => setShowAddCatModal(true)}
                    >
                        {__('Add Category', TEXT_DOMAIN)}
                    </Button>
                </Flex>

                {allCategorySlugs.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '20px' }}>
                        {__('No categories found. Click "Add Category" above or import spatial features.', TEXT_DOMAIN)}
                    </p>
                ) : (
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 240px 80px', gap: '12px', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                            <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                            <span>{__('Display Label', TEXT_DOMAIN)}</span>
                            <span>{__('Assigned Group', TEXT_DOMAIN)}</span>
                            <span style={{ textAlign: 'center' }}>{__('Color', TEXT_DOMAIN)}</span>
                        </div>

                        {allCategorySlugs.map((catSlug, index) => {
                            const catInfo = categoryMap[catSlug] || {};
                            const currentColor = catInfo.color || '#007cba';
                            const isLast = index === allCategorySlugs.length - 1;

                            return (
                                <div 
                                    key={catSlug} 
                                    style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '160px 1fr 240px 80px', 
                                        gap: '12px', 
                                        padding: '10px 12px', 
                                        alignItems: 'center',
                                        borderBottom: isLast ? 'none' : '1px solid #eee',
                                        background: index % 2 === 0 ? '#fff' : '#fafafa'
                                    }}
                                >
                                    <code style={{ background: '#f0f0f0', padding: '3px 6px', borderRadius: '3px', fontSize: '12px', width: 'fit-content' }}>
                                        {catSlug}
                                    </code>

                                    <TextControl
                                        value={catInfo.label || ''}
                                        onChange={(val) => handleUpdateCategory(catSlug, 'label', val)}
                                        placeholder={catSlug}
                                        style={{ height: '34px' }}
                                        __nextHasNoMarginBottom
                                    />

                                    <SelectControl
                                        value={catInfo.groupId !== undefined ? catInfo.groupId : ''}
                                        options={groupOptions}
                                        onChange={(val) => handleUpdateCategory(catSlug, 'groupId', val)}
                                        style={{ height: '34px' }}
                                        __nextHasNoMarginBottom
                                    />

                                    <div style={{ textAlign: 'center' }}>
                                        <Dropdown
                                            renderToggle={({ isOpen: isDropdownOpen, onToggle: toggleDropdown }) => (
                                                <Button
                                                    onClick={toggleDropdown}
                                                    aria-expanded={isDropdownOpen}
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        minWidth: '28px',
                                                        padding: 0,
                                                        borderRadius: '4px',
                                                        background: currentColor,
                                                        border: '2px solid #fff',
                                                        boxShadow: '0 0 0 1px #ccc',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            )}
                                            renderContent={() => (
                                                <div style={{ padding: '12px' }}>
                                                    <ColorPicker
                                                        color={currentColor}
                                                        onChangeComplete={(val) => handleUpdateCategory(catSlug, 'color', val.hex)}
                                                        disableAlpha
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </PanelBody>

            {/* MODAL: ADD CUSTOM CATEGORY */}
            {showAddCatModal && (
                <Modal 
                    title={__('Add New Category', TEXT_DOMAIN)} 
                    onRequestClose={() => setShowAddCatModal(false)}
                    style={{ maxWidth: '500px', width: '100%' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <TextControl
                            label={__('Category Label Name', TEXT_DOMAIN)}
                            placeholder="e.g. Electric Vehicle Charging"
                            value={newCatLabel}
                            onChange={setNewCatLabel}
                            help={derivedCatSlug ? sprintf(__('Database Slug: %s', TEXT_DOMAIN), derivedCatSlug) : ''}
                        />

                        <SelectControl
                            label={__('Assigned Group', TEXT_DOMAIN)}
                            value={newCatGroupId}
                            options={groupOptions}
                            onChange={setNewCatGroupId}
                        />

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '8px' }}>
                                {__('Category Fill Color', TEXT_DOMAIN)}
                            </label>
                            <Flex align="center" gap={3}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: newCatColor, border: '1px solid #ccc' }} />
                                <ColorPicker
                                    color={newCatColor}
                                    onChangeComplete={(val) => setNewCatColor(val.hex)}
                                    disableAlpha
                                />
                            </Flex>
                        </div>

                        <Flex justify="flex-end" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <Button variant="tertiary" onClick={() => setShowAddCatModal(false)}>
                                {__('Cancel', TEXT_DOMAIN)}
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleConfirmAddCategory} 
                                disabled={!newCatLabel.trim()}
                            >
                                {__('Add Category', TEXT_DOMAIN)}
                            </Button>
                        </Flex>
                    </div>
                </Modal>
            )}
        </Panel>
    );
};