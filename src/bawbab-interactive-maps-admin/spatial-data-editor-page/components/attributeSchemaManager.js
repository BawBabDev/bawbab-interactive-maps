import { useState, useEffect } from '@wordpress/element';
import { 
    Button, TextControl, SelectControl, Flex, FlexItem,
    Spinner, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { IconPickerModal } from './iconPickerModal';
import { AttributeConfigModal } from './attributeConfigModal';
import { renderIconBySlug, LEGACY_ICON_NAMES } from '../constants/iconRegistry';
import { normalizeFieldType } from '../utils/dualCounterHelper';
import { useAttributeSchema } from '../hooks/useAttributeSchema';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const FIELD_TYPE_OPTIONS = [
    { label: __('Text', TEXT_DOMAIN), value: 'text' },
    { label: __('Number', TEXT_DOMAIN), value: 'number' },
    { label: __('Boolean', TEXT_DOMAIN), value: 'boolean' },
    { label: __('Dual Counter', TEXT_DOMAIN), value: 'dual_counter' },
];

const LAYOUT_OPTIONS = [
    { label: __('Grid (2 Per Row)', TEXT_DOMAIN), value: 'half' },
    { label: __('Full Width (1 Line)', TEXT_DOMAIN), value: 'full' },
];

const DUAL_MODE_OPTIONS = [
    { label: __('Category Split (e.g. Shower / Bathroom)', TEXT_DOMAIN), value: 'split' },
    { label: __('Time Breakdown (Hours / Minutes)', TEXT_DOMAIN), value: 'time' },
    { label: __('Measurement (Feet / Inches)', TEXT_DOMAIN), value: 'measurement' },
];

const TIME_UNIT_OPTIONS = [
    { label: __('Hours & Minutes (1 hr 30 min)', TEXT_DOMAIN), value: 'hours_minutes' },
    { label: __('Minutes & Seconds (1 min 30 sec)', TEXT_DOMAIN), value: 'minutes_seconds' },
    { label: __('Days & Hours (1 d 12 hr)', TEXT_DOMAIN), value: 'days_hours' },
];

const MEASUREMENT_UNIT_OPTIONS = [
    { label: __('Feet & Inches (6\' 7")', TEXT_DOMAIN), value: 'feet_inches' },
    { label: __('Miles & Feet (1 mi 500 ft)', TEXT_DOMAIN), value: 'miles_feet' },
    { label: __('Kilometers & Meters (1 km 500 m)', TEXT_DOMAIN), value: 'km_meters' },
    { label: __('Meters & Centimeters (1 m 50 cm)', TEXT_DOMAIN), value: 'meters_cm' },
];

const createKeySlug = (label) => {
    return (label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');
};

const renderStyledIcon = (iconSlug, size = 18) => {
    if (!iconSlug) return null;
    const icon = renderIconBySlug(iconSlug, { size });
    if (!icon) return null;

    const isLegacy = LEGACY_ICON_NAMES.includes(iconSlug);

    return (
        <span 
            className={`bwb-custom-icon-wrapper ${isLegacy ? 'is-legacy' : 'is-lucide'}`} 
            style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#333',
                lineHeight: 0
            }}
        >
            {icon}
            <style>{`
                .bwb-custom-icon-wrapper.is-lucide svg {
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 2px !important;
                }
                .bwb-custom-icon-wrapper.is-legacy svg {
                    fill: currentColor !important;
                    stroke: none !important;
                    width: ${size}px !important;
                    height: ${size}px !important;
                }
            `}</style>
        </span>
    );
};

export const AttributeSchemaManager = ({ 
    schema = [], 
    isLoading = false, 
    onUpdateKey, 
    onDeleteKey, 
    onRefreshFeatures 
}) => {
    const { reorderSchemaKeys } = useAttributeSchema();

    // Local Schema state ensures immediate re-rendering upon arrow click
    const [localSchema, setLocalSchema] = useState(schema);

    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const [newLayout, setNewLayout] = useState('half');
    const [newIconPrimary, setNewIconPrimary] = useState('');
    const [newIconSecondary, setNewIconSecondary] = useState('');
    
    // Dual Counter registration options
    const [newDualMode, setNewDualMode] = useState('split');
    const [newMainUnit, setNewMainUnit] = useState('hours_minutes');
    const [newMajorLabel, setNewMajorLabel] = useState('');
    const [newMinorLabel, setNewMinorLabel] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Configuration Modal state
    const [editingAttribute, setEditingAttribute] = useState(null);

    // Icon Picker Modal state
    const [isIconModalOpen, setIsIconModalOpen] = useState(false);
    const [editingItemKey, setEditingItemKey] = useState(null);
    const [editingTargetSlot, setEditingTargetSlot] = useState('primary');

    // Keep localSchema in sync with incoming schema prop changes
    useEffect(() => {
        if (Array.isArray(schema)) {
            setLocalSchema(schema);
        }
    }, [schema]);

    const derivedKey = createKeySlug(newLabel);

    const handleTypeChange = (val) => {
        setNewType(val);
        if (val === 'dual_counter') {
            setNewDualMode('split');
            setNewMainUnit('hours_minutes');
        }
    };

    const isNewDual = newType === 'dual_counter';
    const isNewSplit = isNewDual && newDualMode === 'split';

    const handleAddKey = async () => {
        if (!newLabel.trim() || !derivedKey) return;
        setIsSubmitting(true);

        let formattedIcon = newIconPrimary;
        if (isNewSplit) {
            formattedIcon = `${newIconPrimary || ''},${newIconSecondary || ''}`;
        }

        // Category split mode is strictly saved as full width
        const effectiveLayout = isNewSplit ? 'full' : newLayout;

        const config = {
            layout: effectiveLayout,
            order: localSchema.length,
            ...(isNewDual ? {
                mode: newDualMode,
                mainUnit: newDualMode === 'time' ? newMainUnit : (newDualMode === 'measurement' ? newMainUnit : ''),
                majorLabel: newMajorLabel.trim(),
                minorLabel: newMinorLabel.trim(),
            } : {})
        };

        const res = await onUpdateKey({
            key: derivedKey,
            label: newLabel.trim(),
            type: newType,
            icon: formattedIcon,
            config
        });

        if (res.success) {
            setNewLabel('');
            setNewType('text');
            setNewLayout('half');
            setNewIconPrimary('');
            setNewIconSecondary('');
            setNewDualMode('split');
            setNewMainUnit('hours_minutes');
            setNewMajorLabel('');
            setNewMinorLabel('');
            if (onRefreshFeatures) onRefreshFeatures();
        }
        setIsSubmitting(false);
    };

    const handleMoveItem = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= localSchema.length) return;

        // Perform instant local array swap for zero-latency visual reordering
        const updatedSchema = [...localSchema];
        const [movedItem] = updatedSchema.splice(index, 1);
        updatedSchema.splice(targetIndex, 0, movedItem);

        // Assign explicit numeric order properties based on index
        const orderedSchema = updatedSchema.map((item, idx) => ({
            ...item,
            config: {
                ...(item.config || {}),
                order: idx
            }
        }));

        // Render UI immediately
        setLocalSchema(orderedSchema);

        // Persist new sequence back to database via REST endpoint
        if (typeof reorderSchemaKeys === 'function') {
            const res = await reorderSchemaKeys(orderedSchema);
            if (res && res.success && onRefreshFeatures) {
                onRefreshFeatures();
            }
        }
    };

    const handleDeleteKey = async (key) => {
        const res = await onDeleteKey(key);
        if (res.success && onRefreshFeatures) {
            onRefreshFeatures();
        }
    };

    const handleSaveModalConfig = async (updatedItem) => {
        const res = await onUpdateKey(updatedItem);
        if (res && res.success !== false && onRefreshFeatures) {
            onRefreshFeatures();
        }
        return res;
    };

    const handleOpenIconPicker = (itemKey, slot = 'primary') => {
        setEditingItemKey(itemKey);
        setEditingTargetSlot(slot);
        setIsIconModalOpen(true);
    };

    const handleSelectIcon = (selectedIconKey) => {
        if (editingItemKey) {
            const item = localSchema.find(s => s.key === editingItemKey);
            if (item) {
                let updatedIcon = selectedIconKey;
                const normalizedType = normalizeFieldType(item.type);
                const isSplit = normalizedType === 'dual_counter' && item.config?.mode === 'split';

                if (isSplit) {
                    const rawIcons = (item.icon || '').split(',');
                    const primary = rawIcons[0] || '';
                    const secondary = rawIcons[1] || '';

                    if (editingTargetSlot === 'secondary') {
                        updatedIcon = `${primary},${selectedIconKey || ''}`;
                    } else {
                        updatedIcon = `${selectedIconKey || ''},${secondary}`;
                    }
                }

                const updatedItem = { ...item, icon: updatedIcon };
                onUpdateKey(updatedItem).then(() => {
                    if (editingAttribute && editingAttribute.key === item.key) {
                        setEditingAttribute(updatedItem);
                    }
                    if (onRefreshFeatures) onRefreshFeatures();
                });
            }
        } else {
            if (newType === 'dual_counter' && newDualMode === 'split' && editingTargetSlot === 'secondary') {
                setNewIconSecondary(selectedIconKey);
            } else {
                setNewIconPrimary(selectedIconKey);
            }
        }
    };

    // Calculate grid template columns depending on whether display layout drop-down is visible
    const formGridColumns = isNewSplit
        ? '1fr 140px 180px auto'
        : '1fr 140px 140px 140px auto';

    return (
        <div className="tab-content">
            <h2 variant="title.medium" display="block" style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '8px' }}>
                {__('Custom Attributes Schema Manager', TEXT_DOMAIN)}
            </h2>
            <Text variant="caption" display="block" style={{ color: '#666', marginBottom: '20px' }}>
                {__('Manage custom fields across all map features. Use the arrow buttons to reorder how custom fields appear inside the side drawer.', TEXT_DOMAIN)}
            </Text>

            {/* REGISTER NEW FIELD FORM */}
            <div style={{ padding: '16px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '12px' }}>
                    {__('Register New Custom Field', TEXT_DOMAIN)}
                </Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: formGridColumns, gap: '12px', alignItems: 'end' }}>
                        <div>
                            <TextControl
                                label={__('Field Display Label', TEXT_DOMAIN)}
                                placeholder="e.g. Duration, Square Feet, or Fireplace"
                                value={newLabel}
                                onChange={setNewLabel}
                                style={{ height: '36px', minHeight: '36px' }}
                                __nextHasNoMarginBottom
                            />
                        </div>

                        <div className="bwb-select-control-wrapper">
                            <SelectControl
                                label={__('Field Type', TEXT_DOMAIN)}
                                value={normalizeFieldType(newType)}
                                options={FIELD_TYPE_OPTIONS}
                                onChange={handleTypeChange}
                                style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                __nextHasNoMarginBottom
                            />
                        </div>

                        {/* DISPLAY LAYOUT SELECTOR (HIDDEN IN CATEGORY SPLIT MODE) */}
                        {!isNewSplit && (
                            <div className="bwb-select-control-wrapper">
                                <SelectControl
                                    label={__('Display Layout', TEXT_DOMAIN)}
                                    value={newLayout}
                                    options={LAYOUT_OPTIONS}
                                    onChange={setNewLayout}
                                    style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                    __nextHasNoMarginBottom
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>
                                {isNewSplit ? __('Icons (Major / Minor)', TEXT_DOMAIN) : __('Icon', TEXT_DOMAIN)}
                            </label>

                            {isNewSplit ? (
                                <Flex gap={1} align="center">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenIconPicker(null, 'primary')}
                                        style={{ height: '36px', minHeight: '36px', flex: 1, justifyContent: 'center', padding: '0 8px' }}
                                        label={__('Select Major Unit Icon', TEXT_DOMAIN)}
                                        showTooltip
                                    >
                                        {renderStyledIcon(newIconPrimary, 18) || <span style={{ fontSize: '11px', color: '#999' }}>{__('Choose', TEXT_DOMAIN)}</span>}
                                    </Button>
                                    <span style={{ fontSize: '12px', color: '#888' }}>/</span>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenIconPicker(null, 'secondary')}
                                        style={{ height: '36px', minHeight: '36px', flex: 1, justifyContent: 'center', padding: '0 8px' }}
                                        label={__('Select Minor Unit Icon', TEXT_DOMAIN)}
                                        showTooltip
                                    >
                                        {renderStyledIcon(newIconSecondary, 18) || <span style={{ fontSize: '11px', color: '#999' }}>{__('Choose', TEXT_DOMAIN)}</span>}
                                    </Button>
                                </Flex>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => handleOpenIconPicker(null, 'primary')}
                                    style={{ height: '36px', minHeight: '36px', width: '100%', justifyContent: 'center', gap: '6px' }}
                                >
                                    {newIconPrimary && renderIconBySlug(newIconPrimary) ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {renderStyledIcon(newIconPrimary, 18)}
                                            <span style={{ fontSize: '12px', color: '#333', textTransform: 'capitalize' }}>{newIconPrimary}</span>
                                        </span>
                                    ) : (
                                        <span>{__('Choose Icon', TEXT_DOMAIN)}</span>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div>
                            <Button
                                variant="primary"
                                onClick={handleAddKey}
                                isBusy={isSubmitting}
                                disabled={!newLabel.trim() || isSubmitting}
                                style={{ height: '36px', minHeight: '36px', padding: '0 16px' }}
                            >
                                {__('Add Field', TEXT_DOMAIN)}
                            </Button>
                        </div>
                    </div>

                    {/* DUAL COUNTER SPECIFIC CREATION OPTIONS */}
                    {isNewDual && (
                        <div style={{ padding: '12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                            <Flex gap={2} align="end">
                                <FlexItem style={{ flex: 1 }} className="bwb-select-control-wrapper">
                                    <SelectControl
                                        label={__('Dual Counter Mode', TEXT_DOMAIN)}
                                        value={newDualMode}
                                        options={DUAL_MODE_OPTIONS}
                                        onChange={(mode) => {
                                            setNewDualMode(mode);
                                            setNewMainUnit(mode === 'time' ? 'hours_minutes' : 'feet_inches');
                                        }}
                                        style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px' }}
                                        __nextHasNoMarginBottom
                                    />
                                </FlexItem>

                                {newDualMode === 'time' && (
                                    <FlexItem style={{ flex: 1 }} className="bwb-select-control-wrapper">
                                        <SelectControl
                                            label={__('Main Time Unit', TEXT_DOMAIN)}
                                            value={newMainUnit}
                                            options={TIME_UNIT_OPTIONS}
                                            onChange={setNewMainUnit}
                                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px' }}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                )}

                                {newDualMode === 'measurement' && (
                                    <FlexItem style={{ flex: 1 }} className="bwb-select-control-wrapper">
                                        <SelectControl
                                            label={__('Distance Unit', TEXT_DOMAIN)}
                                            value={newMainUnit}
                                            options={MEASUREMENT_UNIT_OPTIONS}
                                            onChange={setNewMainUnit}
                                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px' }}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                )}

                                {newDualMode === 'split' && (
                                    <>
                                        <FlexItem style={{ flex: 1 }}>
                                            <TextControl
                                                label={__('Major Label', TEXT_DOMAIN)}
                                                placeholder={__('e.g. Shower', TEXT_DOMAIN)}
                                                value={newMajorLabel}
                                                onChange={setNewMajorLabel}
                                                style={{ height: '36px', minHeight: '36px' }}
                                                __nextHasNoMarginBottom
                                            />
                                        </FlexItem>
                                        <FlexItem style={{ flex: 1 }}>
                                            <TextControl
                                                label={__('Minor Label', TEXT_DOMAIN)}
                                                placeholder={__('e.g. Bathroom', TEXT_DOMAIN)}
                                                value={newMinorLabel}
                                                onChange={setNewMinorLabel}
                                                style={{ height: '36px', minHeight: '36px' }}
                                                __nextHasNoMarginBottom
                                            />
                                        </FlexItem>
                                    </>
                                )}
                            </Flex>
                        </div>
                    )}
                </div>

                {derivedKey && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                        {sprintf(__('Database Key Slug: %s', TEXT_DOMAIN), derivedKey)}
                    </div>
                )}
            </div>

            {/* SCHEMA GRID TABLE */}
            {isLoading ? (
                <Flex justify="center" style={{ padding: '40px' }}><Spinner /></Flex>
            ) : localSchema.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '20px' }}>
                    {__('No custom attribute keys registered yet. Create one above or import a GeoJSON dataset.', TEXT_DOMAIN)}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 110px 100px 100px 100px', gap: '12px', padding: '0 12px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                        <span>{__('Order', TEXT_DOMAIN)}</span>
                        <span>{__('Display Label', TEXT_DOMAIN)}</span>
                        <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                        <span>{__('Type', TEXT_DOMAIN)}</span>
                        <span>{__('Layout', TEXT_DOMAIN)}</span>
                        <span>{__('Icon(s)', TEXT_DOMAIN)}</span>
                        <span style={{ textAlign: 'right' }}>{__('Actions', TEXT_DOMAIN)}</span>
                    </div>

                    {localSchema.map((item, index) => {
                        const normalizedType = normalizeFieldType(item.type);
                        const isDualCounter = normalizedType === 'dual_counter';
                        const dualMode = item.config?.mode || 'split';
                        const layoutMode = isDualCounter && dualMode === 'split' ? 'full' : (item.config?.layout || 'half');
                        const isSplit = isDualCounter && dualMode === 'split';

                        const effectiveIconSlug = item.icon || '';
                        const iconParts = effectiveIconSlug.split(',');
                        
                        const primarySlug = iconParts[0] || '';
                        const secondarySlug = iconParts[1] || '';

                        return (
                            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 110px 100px 100px 100px', gap: '12px', padding: '8px 12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', alignItems: 'center' }}>
                                {/* REORDER BUTTONS */}
                                <Flex gap={1} align="center">
                                    <Button
                                        isSmall
                                        variant="tertiary"
                                        icon="arrow-up-alt2"
                                        disabled={index === 0}
                                        onClick={() => handleMoveItem(index, -1)}
                                        label={__('Move Up', TEXT_DOMAIN)}
                                        style={{ minWidth: '24px', padding: 0 }}
                                    />
                                    <Button
                                        isSmall
                                        variant="tertiary"
                                        icon="arrow-down-alt2"
                                        disabled={index === localSchema.length - 1}
                                        onClick={() => handleMoveItem(index, 1)}
                                        label={__('Move Down', TEXT_DOMAIN)}
                                        style={{ minWidth: '24px', padding: 0 }}
                                    />
                                </Flex>

                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label || item.key}</span>
                                <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', width: 'fit-content' }}>{item.key}</code>
                                
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2271b1', background: '#f0f6fb', padding: '2px 8px', borderRadius: '10px', width: 'fit-content', fontWeight: '600' }}>
                                    {isDualCounter ? `dual (${dualMode})` : normalizedType}
                                </span>

                                <span style={{ fontSize: '11px', color: '#555', textTransform: 'capitalize' }}>
                                    {layoutMode === 'full' ? __('Full Width', TEXT_DOMAIN) : __('Grid (2/row)', TEXT_DOMAIN)}
                                </span>
                                
                                <Flex align="center" gap={1}>
                                    {isSplit ? (
                                        <>
                                            {renderStyledIcon(primarySlug, 16) || <span style={{ fontSize: '11px', color: '#bbb' }}>--</span>}
                                            <span style={{ fontSize: '10px', color: '#aaa' }}>/</span>
                                            {renderStyledIcon(secondarySlug, 16) || <span style={{ fontSize: '11px', color: '#bbb' }}>--</span>}
                                        </>
                                    ) : (
                                        renderStyledIcon(primarySlug, 16) || <span style={{ fontSize: '11px', color: '#999' }}>--</span>
                                    )}
                                </Flex>

                                <Flex justify="end" gap={1}>
                                    <Button
                                        variant="secondary"
                                        icon="admin-generic"
                                        isSmall
                                        onClick={() => setEditingAttribute(item)}
                                        label={__('Configure Attribute', TEXT_DOMAIN)}
                                        showTooltip
                                    />

                                    <Button
                                        isDestructive
                                        icon="trash"
                                        isSmall
                                        onClick={() => handleDeleteKey(item.key)}
                                        label={__('Delete Field Globally', TEXT_DOMAIN)}
                                        showTooltip
                                    />
                                </Flex>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODULAR ATTRIBUTE CONFIGURATION MODAL */}
            <AttributeConfigModal
                isOpen={Boolean(editingAttribute)}
                item={editingAttribute}
                onClose={() => setEditingAttribute(null)}
                onSave={handleSaveModalConfig}
            />

            {/* REUSABLE ICON PICKER MODAL */}
            <IconPickerModal
                isOpen={isIconModalOpen}
                onClose={() => setIsIconModalOpen(false)}
                onSelectIcon={handleSelectIcon}
                currentIconKey={
                    editingItemKey 
                        ? (() => {
                            const item = localSchema.find(s => s.key === editingItemKey);
                            const normalizedType = normalizeFieldType(item?.type);
                            const isSplit = normalizedType === 'dual_counter' && item?.config?.mode === 'split';
                            const raw = item?.icon || '';

                            if (isSplit) {
                                const parts = raw.split(',');
                                return editingTargetSlot === 'secondary' ? (parts[1] || '') : (parts[0] || '');
                            }
                            return raw.split(',')[0] || '';
                        })()
                        : (editingTargetSlot === 'secondary' ? newIconSecondary : newIconPrimary)
                }
            />
        </div>
    );
};