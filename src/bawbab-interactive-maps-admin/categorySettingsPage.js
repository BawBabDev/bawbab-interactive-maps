import { useState } from '@wordpress/element';
import { 
    Panel, PanelBody, Button, TextControl, SelectControl, 
    Flex, FlexItem, NoticeList, Spinner, ColorPicker, Dropdown, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCategoryManager } from '../hooks/useCategoryManager';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const CategorySettingsPage = () => {
    const { 
        groups, 
        setGroups, 
        categoryMap, 
        setCategoryMap, 
        isLoading, 
        isSaving, 
        saveCategoryData,
        cleanupUnusedCategories
    } = useCategoryManager();

    const notices = useSelect((select) => select(noticesStore).getNotices(), []);
    const { removeNotice } = useDispatch(noticesStore);

    const [newGroupTitle, setNewGroupTitle] = useState('');

    const handleAddGroup = () => {
        if (!newGroupTitle.trim()) return;
        const newId = `group_${Date.now()}`;
        const updatedGroups = [
            ...groups,
            { id: newId, title: newGroupTitle.trim(), displayType: 'flat' }
        ];
        setGroups(updatedGroups);
        setNewGroupTitle('');
    };

    const handleRemoveGroup = (groupId) => {
        if (groups.length <= 1) {
            alert(__('You must keep at least one category group.', TEXT_DOMAIN));
            return;
        }

        const fallbackGroupId = groups.find(g => g.id !== groupId)?.id || '';
        const updatedGroups = groups.filter(g => g.id !== groupId);

        const updatedMap = { ...categoryMap };
        Object.keys(updatedMap).forEach(cat => {
            if (updatedMap[cat].groupId === groupId) {
                updatedMap[cat] = { ...updatedMap[cat], groupId: fallbackGroupId };
            }
        });

        setGroups(updatedGroups);
        setCategoryMap(updatedMap);
    };

    const handleUpdateGroup = (groupId, key, value) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, [key]: value } : g));
    };

    const handleUpdateCategory = (catSlug, key, value) => {
        setCategoryMap(prev => ({
            ...prev,
            [catSlug]: {
                ...(prev[catSlug] || {}),
                [key]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <Flex justify="center" style={{ padding: '60px' }}>
                <Spinner />
            </Flex>
        );
    }

    const groupOptions = [
        { label: __('-- Unassigned / Hidden from Public Menu --', TEXT_DOMAIN), value: '' },
        ...groups.map(g => ({ label: g.title, value: g.id }))
    ];

    // Primary List Source: All categories registered in categoryMap (wp_options)
    const allCategorySlugs = Object.keys(categoryMap);

    return (
        <div className="wrap" style={{ maxWidth: '960px', margin: '20px auto' }}>
            <NoticeList notices={notices} onRemove={removeNotice} style={{ marginBottom: '20px' }} />

            <h1 className="wp-heading-inline" style={{ marginBottom: '10px' }}>
                {__('Map Category & Navigation Settings', TEXT_DOMAIN)}
            </h1>
            <p style={{ color: '#666', marginBottom: '25px' }}>
                {__('Manage navigation groups, assign spatial categories strictly 1-to-1, and configure category colors across your map layers.', TEXT_DOMAIN)}
            </p>

            {/* 1. TOP GROUP MANAGEMENT SECTION */}
            <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <PanelBody title={__('1. Category Navigation Groups', TEXT_DOMAIN)} initialOpen={true}>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                        {__('Groups structure top-level navigation tabs and side drawer accordions on the public map.', TEXT_DOMAIN)}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {groups.map((group) => (
                            <div key={group.id} style={{ padding: '12px 15px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                <Flex align="center" justify="space-between" gap={3}>
                                    <FlexItem style={{ flex: 1 }}>
                                        <TextControl
                                            label={__('Group Title', TEXT_DOMAIN)}
                                            value={group.title}
                                            onChange={(val) => handleUpdateGroup(group.id, 'title', val)}
                                            style={{ height: '36px' }}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                    <FlexItem style={{ width: '220px' }}>
                                        <SelectControl
                                            label={__('Layout Type', TEXT_DOMAIN)}
                                            value={group.displayType || 'flat'}
                                            options={[
                                                { label: __('Nested Accordion (Grouped)', TEXT_DOMAIN), value: 'grouped' },
                                                { label: __('Flat List (Single Items)', TEXT_DOMAIN), value: 'flat' }
                                            ]}
                                            onChange={(val) => handleUpdateGroup(group.id, 'displayType', val)}
                                            style={{ height: '36px' }}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                    <FlexItem style={{ alignSelf: 'flex-end', marginBottom: '2px' }}>
                                        <Button
                                            isDestructive
                                            isSmall
                                            icon="trash"
                                            onClick={() => handleRemoveGroup(group.id)}
                                            label={__('Delete Group', TEXT_DOMAIN)}
                                            style={{ height: '36px', minWidth: '36px' }}
                                        />
                                    </FlexItem>
                                </Flex>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                        <div style={{ flex: 1 }}>
                            <TextControl
                                label={__('Create New Group Title', TEXT_DOMAIN)}
                                placeholder="e.g. Wellness Centers or Dining"
                                value={newGroupTitle}
                                onChange={setNewGroupTitle}
                                style={{ height: '36px' }}
                                __nextHasNoMarginBottom
                            />
                        </div>
                        <Button
                            variant="secondary"
                            icon="plus-alt"
                            onClick={handleAddGroup}
                            disabled={!newGroupTitle.trim()}
                            style={{ height: '36px' }}
                        >
                            {__('Add Group', TEXT_DOMAIN)}
                        </Button>
                    </div>
                </PanelBody>
            </Panel>

            {/* 2. UNIFIED CATEGORY ASSIGNMENT & COLOR TABLE */}
            <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <PanelBody title={__('2. Spatial Categories Configuration (1-to-1 Mapping)', TEXT_DOMAIN)} initialOpen={true}>
                    {allCategorySlugs.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '20px' }}>
                            {__('No categories found. Import spatial features to auto-register categories.', TEXT_DOMAIN)}
                        </p>
                    ) : (
                        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 240px 80px', gap: '12px', padding: '10px 12px', background: '#f5f5f5', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                                <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                                <span>{__('Display Label', TEXT_DOMAIN)}</span>
                                <span>{__('Assigned Group', TEXT_DOMAIN)}</span>
                                <span style={{ textAlign: 'center' }}>{__('Color', TEXT_DOMAIN)}</span>
                            </div>

                            {/* RENDER ALL SAVED CATEGORIES FROM wp_options */}
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
                                                renderToggle={({ isOpen, onToggle }) => (
                                                    <Button
                                                        onClick={onToggle}
                                                        aria-expanded={isOpen}
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
            </Panel>

            {/* ACTION BUTTONS CONTAINER */}
            <Flex justify="space-between" align="center" style={{ marginTop: '25px' }}>
                <Button
                    variant="secondary"
                    isDestructive
                    onClick={cleanupUnusedCategories}
                    isBusy={isSaving}
                    disabled={isSaving}
                >
                    {__('Cleanup Unused Categories', TEXT_DOMAIN)}
                </Button>

                <Button
                    variant="primary"
                    onClick={() => saveCategoryData(groups, categoryMap)}
                    isBusy={isSaving}
                    disabled={isSaving}
                    style={{ height: '40px', padding: '0 32px' }}
                >
                    {isSaving ? __('Saving...', TEXT_DOMAIN) : __('Save Category Settings', TEXT_DOMAIN)}
                </Button>
            </Flex>
        </div>
    );
};

export default CategorySettingsPage;