import { useState } from '@wordpress/element';
import { 
    Button, TextControl, SelectControl, Flex, FlexItem,
    Spinner, Dashicon, Modal, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { IconPickerModal } from './iconPickerModal';
import { renderIconBySlug, LEGACY_ICON_NAMES } from '../../../constants/iconRegistry';
import { normalizeFieldType } from '../utils/dualCounterHelper';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const DEFAULT_LEGACY_ICONS = {
    sq_ft: 'area',
    baths: 'shower,sink',
    fireplace: 'fireplace',
    sunroom: 'sun'
};

const FIELD_TYPE_OPTIONS = [
    { label: __('Text', TEXT_DOMAIN), value: 'text' },
    { label: __('Number', TEXT_DOMAIN), value: 'number' },
    { label: __('Boolean', TEXT_DOMAIN), value: 'boolean' },
    { label: __('Dual Counter', TEXT_DOMAIN), value: 'dual_counter' },
];

const DUAL_MODE_OPTIONS = [
    { label: __('Category Split (Full / Half Items)', TEXT_DOMAIN), value: 'split' },
    { label: __('Time Breakdown (Hours / Minutes)', TEXT_DOMAIN), value: 'time' },
    { label: __('Measurement (Feet / Inches)', TEXT_DOMAIN), value: 'measurement' },
];

const createKeySlug = (label) => {
    return (label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');
};

const renderStyledIcon = (iconSlug, size = 18) => {
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
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const [newIconPrimary, setNewIconPrimary] = useState('');
    const [newIconSecondary, setNewIconSecondary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dual Counter Config State
    const [dualMode, setDualMode] = useState('split');
    const [majorLabel, setMajorLabel] = useState('');
    const [minorLabel, setMinorLabel] = useState('');

    const [isIconModalOpen, setIsIconModalOpen] = useState(false);
    const [editingItemKey, setEditingItemKey] = useState(null);
    const [editingTargetSlot, setEditingTargetSlot] = useState('primary');

    const [pendingTypeChange, setPendingTypeChange] = useState(null);

    const derivedKey = createKeySlug(newLabel);

    const handleAddKey = async () => {
        if (!newLabel.trim() || !derivedKey) return;
        setIsSubmitting(true);

        let formattedIcon = newIconPrimary;
        if (newType === 'dual_counter') {
            const p = newIconPrimary || 'shower';
            const s = newIconSecondary || 'sink';
            formattedIcon = `${p},${s}`;
        }

        const config = newType === 'dual_counter' ? {
            mode: dualMode,
            majorLabel: majorLabel || (dualMode === 'split' ? __('Full', TEXT_DOMAIN) : 'hr'),
            minorLabel: minorLabel || (dualMode === 'split' ? __('Half', TEXT_DOMAIN) : 'min'),
        } : null;

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
            setNewIconPrimary('');
            setNewIconSecondary('');
            setMajorLabel('');
            setMinorLabel('');
            setDualMode('split');
            if (onRefreshFeatures) onRefreshFeatures();
        }
        setIsSubmitting(false);
    };

    const handleDeleteKey = async (key) => {
        const res = await onDeleteKey(key);
        if (res.success && onRefreshFeatures) {
            onRefreshFeatures();
        }
    };

    const triggerTypeChangeConfirmation = (item, targetType) => {
        if (normalizeFieldType(item.type) === targetType) return;
        setPendingTypeChange({ item, targetType });
    };

    const confirmTypeChange = async () => {
        if (!pendingTypeChange) return;

        const { item, targetType } = pendingTypeChange;
        let updatedIcon = item.icon;
        
        if (targetType === 'dual_counter' && (!item.icon || !item.icon.includes(','))) {
            updatedIcon = item.icon ? `${item.icon},sink` : 'shower,sink';
        }

        const res = await onUpdateKey({
            ...item,
            type: targetType,
            icon: updatedIcon
        });

        if (res.success && onRefreshFeatures) {
            onRefreshFeatures();
        }

        setPendingTypeChange(null);
    };

    const handleSelectIcon = (selectedIconKey) => {
        if (editingItemKey) {
            const item = schema.find(s => s.key === editingItemKey);
            if (item) {
                let updatedIcon = selectedIconKey;
                const normalizedType = normalizeFieldType(item.type);

                if (normalizedType === 'dual_counter') {
                    const rawIcons = (item.icon || DEFAULT_LEGACY_ICONS[item.key] || 'shower,sink').split(',');
                    const primary = rawIcons[0] || 'shower';
                    const secondary = rawIcons[1] || 'sink';

                    if (editingTargetSlot === 'secondary') {
                        updatedIcon = `${primary},${selectedIconKey || 'sink'}`;
                    } else {
                        updatedIcon = `${selectedIconKey || 'shower'},${secondary}`;
                    }
                }

                onUpdateKey({
                    ...item,
                    icon: updatedIcon
                }).then(() => {
                    if (onRefreshFeatures) onRefreshFeatures();
                });
            }
        } else {
            if (newType === 'dual_counter' && editingTargetSlot === 'secondary') {
                setNewIconSecondary(selectedIconKey);
            } else {
                setNewIconPrimary(selectedIconKey);
            }
        }
    };

    const handleUnassignIcon = async (item) => {
        const res = await onUpdateKey({
            ...item,
            icon: ''
        });
        if (res.success && onRefreshFeatures) {
            onRefreshFeatures();
        }
    };

    return (
        <div style={{ padding: '20px 0' }}>
            <Text variant="title.medium" display="block" style={{ marginBottom: '6px' }}>
                {__('Global Custom Attributes Schema Manager', TEXT_DOMAIN)}
            </Text>
            <Text variant="caption" display="block" style={{ color: '#666', marginBottom: '20px' }}>
                {__('Manage custom fields across all map features. Adding a field registers it globally; deleting a field purges it from all units in the database.', TEXT_DOMAIN)}
            </Text>

            {/* ADD NEW FIELD FORM */}
            <div style={{ padding: '16px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '12px' }}>
                    {__('Register New Custom Field', TEXT_DOMAIN)}
                </Text>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px auto', gap: '12px', alignItems: 'end' }}>
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
                            onChange={(val) => {
                                setNewType(val);
                                if (val === 'dual_counter') {
                                    if (!newIconPrimary) setNewIconPrimary('shower');
                                    if (!newIconSecondary) setNewIconSecondary('sink');
                                }
                            }}
                            style={{ 
                                height: '36px', 
                                minHeight: '36px', 
                                lineHeight: '36px',
                                padding: '0 8px',
                                marginTop: 0
                            }}
                            __nextHasNoMarginBottom
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>
                            {normalizeFieldType(newType) === 'dual_counter' ? __('Icons (Major / Minor)', TEXT_DOMAIN) : __('Icon', TEXT_DOMAIN)}
                        </label>

                        {normalizeFieldType(newType) === 'dual_counter' ? (
                            <Flex gap={1} align="center">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setEditingItemKey(null);
                                        setEditingTargetSlot('primary');
                                        setIsIconModalOpen(true);
                                    }}
                                    style={{ height: '36px', minHeight: '36px', flex: 1, justifyContent: 'center', padding: '0 8px' }}
                                    label={__('Select Major Unit Icon', TEXT_DOMAIN)}
                                    showTooltip
                                >
                                    {renderStyledIcon(newIconPrimary || 'shower', 18)}
                                </Button>

                                <span style={{ fontSize: '12px', color: '#888' }}>/</span>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setEditingItemKey(null);
                                        setEditingTargetSlot('secondary');
                                        setIsIconModalOpen(true);
                                    }}
                                    style={{ height: '36px', minHeight: '36px', flex: 1, justifyContent: 'center', padding: '0 8px' }}
                                    label={__('Select Minor Unit Icon', TEXT_DOMAIN)}
                                    showTooltip
                                >
                                    {renderStyledIcon(newIconSecondary || 'sink', 18)}
                                </Button>
                            </Flex>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingItemKey(null);
                                    setEditingTargetSlot('primary');
                                    setIsIconModalOpen(true);
                                }}
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

                {/* DUAL COUNTER MODE CONFIGURATION SUB-PANEL */}
                {normalizeFieldType(newType) === 'dual_counter' && (
                    <div style={{ marginTop: '15px', padding: '12px', background: '#fff', border: '1px solid #d0d7de', borderRadius: '4px' }}>
                        <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '8px' }}>
                            {__('Dual Counter Interpretation Settings', TEXT_DOMAIN)}
                        </Text>
                        <Flex gap={3} align="center">
                            <FlexItem style={{ flex: '0 0 220px' }}>
                                <SelectControl
                                    label={__('Display Mode', TEXT_DOMAIN)}
                                    value={dualMode}
                                    options={DUAL_MODE_OPTIONS}
                                    onChange={setDualMode}
                                    __nextHasNoMarginBottom
                                />
                            </FlexItem>
                            <FlexItem style={{ flex: 1 }}>
                                <TextControl
                                    label={__('Major Unit Label', TEXT_DOMAIN)}
                                    placeholder={dualMode === 'split' ? __('Full Bath / Item', TEXT_DOMAIN) : 'hr'}
                                    value={majorLabel}
                                    onChange={setMajorLabel}
                                    __nextHasNoMarginBottom
                                />
                            </FlexItem>
                            <FlexItem style={{ flex: 1 }}>
                                <TextControl
                                    label={__('Minor Unit Label', TEXT_DOMAIN)}
                                    placeholder={dualMode === 'split' ? __('Half Bath / Item', TEXT_DOMAIN) : 'min'}
                                    value={minorLabel}
                                    onChange={setMinorLabel}
                                    __nextHasNoMarginBottom
                                />
                            </FlexItem>
                        </Flex>
                    </div>
                )}

                {derivedKey && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                        {sprintf(__('Database Key Slug: %s', TEXT_DOMAIN), derivedKey)}
                    </div>
                )}
            </div>

            {/* SCHEMA GRID */}
            {isLoading ? (
                <Flex justify="center" style={{ padding: '40px' }}><Spinner /></Flex>
            ) : schema.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '20px' }}>
                    {__('No custom attribute keys registered yet. Create one above or import a GeoJSON dataset.', TEXT_DOMAIN)}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 140px 80px', gap: '12px', padding: '0 12px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                        <span>{__('Display Label', TEXT_DOMAIN)}</span>
                        <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                        <span>{__('Type', TEXT_DOMAIN)}</span>
                        <span>{__('Icon(s)', TEXT_DOMAIN)}</span>
                        <span style={{ textAlign: 'right' }}>{__('Actions', TEXT_DOMAIN)}</span>
                    </div>

                    {schema.map((item) => {
                        const normalizedType = normalizeFieldType(item.type);
                        const isDualCounter = normalizedType === 'dual_counter';
                        const effectiveIconSlug = item.icon || DEFAULT_LEGACY_ICONS[item.key] || '';
                        const iconParts = effectiveIconSlug.split(',');
                        
                        const primarySlug = iconParts[0] || 'shower';
                        const secondarySlug = iconParts[1] || 'sink';

                        return (
                            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 140px 80px', gap: '12px', padding: '8px 12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label || item.key}</span>
                                <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', width: 'fit-content' }}>{item.key}</code>
                                
                                <div className="bwb-select-control-wrapper">
                                    <SelectControl
                                        value={normalizedType}
                                        options={FIELD_TYPE_OPTIONS}
                                        onChange={(val) => triggerTypeChangeConfirmation(item, val)}
                                        style={{ 
                                            height: '28px', 
                                            minHeight: '28px', 
                                            lineHeight: '28px', 
                                            fontSize: '11px',
                                            padding: '0 6px',
                                            marginTop: 0
                                        }}
                                        __nextHasNoMarginBottom
                                    />
                                </div>
                                
                                <Flex align="center" gap={1}>
                                    {isDualCounter ? (
                                        <>
                                            <Button
                                                variant="tertiary"
                                                isSmall
                                                onClick={() => {
                                                    setEditingItemKey(item.key);
                                                    setEditingTargetSlot('primary');
                                                    setIsIconModalOpen(true);
                                                }}
                                                style={{ padding: '0 4px', height: '28px', minWidth: '28px' }}
                                                label={__('Major Unit Icon', TEXT_DOMAIN)}
                                                showTooltip
                                            >
                                                {renderStyledIcon(primarySlug, 16)}
                                            </Button>

                                            <span style={{ fontSize: '10px', color: '#aaa' }}>/</span>

                                            <Button
                                                variant="tertiary"
                                                isSmall
                                                onClick={() => {
                                                    setEditingItemKey(item.key);
                                                    setEditingTargetSlot('secondary');
                                                    setIsIconModalOpen(true);
                                                }}
                                                style={{ padding: '0 4px', height: '28px', minWidth: '28px' }}
                                                label={__('Minor Unit Icon', TEXT_DOMAIN)}
                                                showTooltip
                                            >
                                                {renderStyledIcon(secondarySlug, 16)}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="tertiary"
                                            isSmall
                                            onClick={() => {
                                                setEditingItemKey(item.key);
                                                setEditingTargetSlot('primary');
                                                setIsIconModalOpen(true);
                                            }}
                                            style={{ padding: '0 6px', height: '28px', minWidth: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            label={__('Assign or Change Icon', TEXT_DOMAIN)}
                                            showTooltip
                                        >
                                            {renderIconBySlug(primarySlug) ? (
                                                renderStyledIcon(primarySlug, 16)
                                            ) : (
                                                <span style={{ fontSize: '11px', color: '#757575' }}>{__('Set Icon', TEXT_DOMAIN)}</span>
                                            )}
                                        </Button>
                                    )}

                                    {item.icon && (
                                        <Button
                                            isDestructive
                                            icon="no-alt"
                                            isSmall
                                            onClick={() => handleUnassignIcon(item)}
                                            label={__('Unassign Icon', TEXT_DOMAIN)}
                                            showTooltip
                                            style={{ height: '24px', minWidth: '24px', padding: 0 }}
                                        />
                                    )}
                                </Flex>

                                <div style={{ textAlign: 'right' }}>
                                    <Button
                                        isDestructive
                                        icon="trash"
                                        isSmall
                                        onClick={() => handleDeleteKey(item.key)}
                                        label={__('Delete Field Globally', TEXT_DOMAIN)}
                                        showTooltip
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* SAFETY MODAL */}
            {pendingTypeChange && (
                <Modal
                    title={__('Warning: Change Field Attribute Type?', TEXT_DOMAIN)}
                    onRequestClose={() => setPendingTypeChange(null)}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Text display="block" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                            {sprintf(
                                __('You are changing the data type for attribute "%s" to "%s".', TEXT_DOMAIN),
                                pendingTypeChange.item.label || pendingTypeChange.item.key,
                                pendingTypeChange.targetType
                            )}
                        </Text>
                        
                        <div style={{ padding: '12px', background: '#fff8e5', borderLeft: '4px solid #dba617', borderRadius: '3px' }}>
                            <Text display="block" style={{ fontSize: '12px', color: '#645300' }}>
                                <strong>{__('Please Note:', TEXT_DOMAIN)}</strong> {__('This action changes the schema interpretation lens for UI rendering, but DOES NOT convert raw values stored in MySQL.', TEXT_DOMAIN)}
                            </Text>
                        </div>

                        <Flex justify="flex-end" style={{ marginTop: '10px', gap: '10px' }}>
                            <Button
                                variant="tertiary"
                                onClick={() => setPendingTypeChange(null)}
                            >
                                {__('Cancel', TEXT_DOMAIN)}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={confirmTypeChange}
                            >
                                {__('Confirm Type Change', TEXT_DOMAIN)}
                            </Button>
                        </Flex>
                    </div>
                </Modal>
            )}

            {/* ICON PICKER MODAL */}
            <IconPickerModal
                isOpen={isIconModalOpen}
                onClose={() => setIsIconModalOpen(false)}
                onSelectIcon={handleSelectIcon}
                currentIconKey={
                    editingItemKey 
                        ? (() => {
                            const item = schema.find(s => s.key === editingItemKey);
                            const normalizedType = normalizeFieldType(item?.type);
                            const raw = item?.icon || DEFAULT_LEGACY_ICONS[editingItemKey] || '';
                            if (normalizedType === 'dual_counter') {
                                const parts = raw.split(',');
                                return editingTargetSlot === 'secondary' ? (parts[1] || 'sink') : (parts[0] || 'shower');
                            }
                            return raw;
                        })()
                        : (editingTargetSlot === 'secondary' ? (newIconSecondary || 'sink') : (newIconPrimary || 'shower'))
                }
            />
        </div>
    );
};