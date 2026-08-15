import { useState, useEffect } from '@wordpress/element';
import { 
    Modal, Button, TextControl, SelectControl, Flex, FlexItem, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { renderIconBySlug, LEGACY_ICON_NAMES } from '../../../constants/iconRegistry';
import { normalizeFieldType } from '../utils/dualCounterHelper';
import { IconPickerModal } from './iconPickerModal';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const FIELD_TYPE_OPTIONS = [
    { label: __('Text', TEXT_DOMAIN), value: 'text' },
    { label: __('Number', TEXT_DOMAIN), value: 'number' },
    { label: __('Boolean', TEXT_DOMAIN), value: 'boolean' },
    { label: __('Dual Counter', TEXT_DOMAIN), value: 'dual_counter' },
];

const DUAL_MODE_OPTIONS = [
    { label: __('Category Split (e.g. Shower / Bathroom)', TEXT_DOMAIN), value: 'split' },
    { label: __('Time Breakdown (Hours / Minutes)', TEXT_DOMAIN), value: 'time' },
    { label: __('Measurement (Feet / Inches)', TEXT_DOMAIN), value: 'measurement' },
];

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

export const AttributeConfigModal = ({ 
    isOpen, 
    item, 
    onClose, 
    onSave 
}) => {
    if (!isOpen || !item) return null;

    const [label, setLabel] = useState(item.label || item.key);
    const [type, setType] = useState(normalizeFieldType(item.type));
    const [icon, setIcon] = useState(item.icon || '');
    
    // Dual Counter sub-panel configuration
    const cfg = item.config || {};
    const [dualMode, setDualMode] = useState(cfg.mode || 'split');
    const [majorLabel, setMajorLabel] = useState(cfg.majorLabel || '');
    const [minorLabel, setMinorLabel] = useState(cfg.minorLabel || '');
    
    const [showTypeWarning, setShowTypeWarning] = useState(false);
    const [pendingType, setPendingType] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Isolated Icon Picker state (Kept inside AttributeConfigModal)
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [pickerSlot, setPickerSlot] = useState('primary'); // 'primary' | 'secondary'

    useEffect(() => {
        setLabel(item.label || item.key);
        setType(normalizeFieldType(item.type));
        setIcon(item.icon || '');
        const currentCfg = item.config || {};
        setDualMode(currentCfg.mode || 'split');
        setMajorLabel(currentCfg.majorLabel || '');
        setMinorLabel(currentCfg.minorLabel || '');
    }, [item]);

    const handleTypeSelect = (newType) => {
        if (newType === type) return;
        setPendingType(newType);
        setShowTypeWarning(true);
    };

    const confirmTypeChange = () => {
        if (!pendingType) return;
        setType(pendingType);
        setShowTypeWarning(false);
        setPendingType(null);
    };

    const handleOpenPicker = (slot = 'primary') => {
        setPickerSlot(slot);
        setIsIconPickerOpen(true);
    };

    // Updates local state ONLY when an icon is selected from IconPickerModal
    const handleSelectIconFromPicker = (selectedSlug) => {
        if (type === 'dual_counter') {
            const iconParts = (icon || '').split(',');
            const primary = iconParts[0] || '';
            const secondary = iconParts[1] || '';

            if (pickerSlot === 'secondary') {
                setIcon(`${primary},${selectedSlug || ''}`);
            } else {
                setIcon(`${selectedSlug || ''},${secondary}`);
            }
        } else {
            setIcon(selectedSlug || '');
        }
        setIsIconPickerOpen(false);
    };

    const handleSave = async () => {
        setIsSaving(true);

        const updatedConfig = type === 'dual_counter' ? {
            mode: dualMode,
            majorLabel: majorLabel.trim(),
            minorLabel: minorLabel.trim(),
        } : null;

        const res = await onSave({
            ...item,
            label: label.trim() || item.key,
            type,
            icon,
            config: updatedConfig
        });

        setIsSaving(false);
        if (res && res.success !== false) {
            onClose();
        }
    };

    // Guard: Prevent AttributeConfigModal from closing when the child IconPickerModal triggers focus events
    const handleModalRequestClose = () => {
        if (isIconPickerOpen) return;
        onClose();
    };

    const isDual = type === 'dual_counter';
    const iconParts = (icon || '').split(',');
    const primaryIcon = iconParts[0] || '';
    const secondaryIcon = iconParts[1] || '';

    return (
        <>
            <Modal
                title={sprintf(__('Configure Attribute: %s', TEXT_DOMAIN), item.label || item.key)}
                onRequestClose={handleModalRequestClose}
                style={{ maxWidth: '600px', width: '100%' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 1. DISPLAY LABEL EDITING */}
                    <TextControl
                        label={__('Display Label', TEXT_DOMAIN)}
                        value={label}
                        onChange={setLabel}
                        help={sprintf(__('Database Slug: %s (non-editable)', TEXT_DOMAIN), item.key)}
                        __nextHasNoMarginBottom
                    />

                    {/* 2. FIELD TYPE SELECTION */}
                    <SelectControl
                        label={__('Field Type', TEXT_DOMAIN)}
                        value={type}
                        options={FIELD_TYPE_OPTIONS}
                        onChange={handleTypeSelect}
                        __nextHasNoMarginBottom
                    />

                    {/* 3. ICON ASSIGNMENT / CLEARING */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                            {isDual ? __('Icons (Major / Minor)', TEXT_DOMAIN) : __('Assigned Icon', TEXT_DOMAIN)}
                        </label>

                        <Flex gap={2} align="center">
                            {isDual ? (
                                <Flex gap={1} align="center" style={{ flex: 1 }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenPicker('primary')}
                                        style={{ height: '36px', flex: 1, justifyContent: 'center', gap: '6px' }}
                                    >
                                        {renderStyledIcon(primaryIcon, 18) ? (
                                            <>
                                                {renderStyledIcon(primaryIcon, 18)}
                                                <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{primaryIcon}</span>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Major Icon', TEXT_DOMAIN)}</span>
                                        )}
                                    </Button>
                                    <span style={{ color: '#888' }}>/</span>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleOpenPicker('secondary')}
                                        style={{ height: '36px', flex: 1, justifyContent: 'center', gap: '6px' }}
                                    >
                                        {renderStyledIcon(secondaryIcon, 18) ? (
                                            <>
                                                {renderStyledIcon(secondaryIcon, 18)}
                                                <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{secondaryIcon}</span>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Minor Icon', TEXT_DOMAIN)}</span>
                                        )}
                                    </Button>
                                </Flex>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => handleOpenPicker('primary')}
                                    style={{ height: '36px', flex: 1, justifyContent: 'center', gap: '6px' }}
                                >
                                    {renderStyledIcon(primaryIcon, 18) ? (
                                        <>
                                            {renderStyledIcon(primaryIcon, 18)}
                                            <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{primaryIcon}</span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Icon Assigned', TEXT_DOMAIN)}</span>
                                    )}
                                </Button>
                            )}

                            {icon !== '' && (
                                <Button
                                    isDestructive
                                    variant="tertiary"
                                    icon="no-alt"
                                    onClick={() => setIcon('')}
                                    label={__('Clear Icon (Set to No Icon)', TEXT_DOMAIN)}
                                    showTooltip
                                />
                            )}
                        </Flex>
                    </div>

                    {/* 4. DUAL COUNTER MODE & SUBCATEGORY CONFIGURATION */}
                    {isDual && (
                        <div style={{ padding: '14px', background: '#f9f9f9', border: '1px solid #d0d7de', borderRadius: '4px' }}>
                            <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '10px' }}>
                                {__('Dual Counter Subcategories & Mode', TEXT_DOMAIN)}
                            </Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <SelectControl
                                    label={__('Display Mode', TEXT_DOMAIN)}
                                    value={dualMode}
                                    options={DUAL_MODE_OPTIONS}
                                    onChange={setDualMode}
                                    __nextHasNoMarginBottom
                                />
                                <Flex gap={2}>
                                    <FlexItem style={{ flex: 1 }}>
                                        <TextControl
                                            label={__('Major Subcategory Label', TEXT_DOMAIN)}
                                            placeholder={dualMode === 'split' ? __('e.g. Shower', TEXT_DOMAIN) : 'Hours'}
                                            value={majorLabel}
                                            onChange={setMajorLabel}
                                            help={__('Displayed under 1st icon box', TEXT_DOMAIN)}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                    <FlexItem style={{ flex: 1 }}>
                                        <TextControl
                                            label={__('Minor Subcategory Label', TEXT_DOMAIN)}
                                            placeholder={dualMode === 'split' ? __('e.g. Bathroom', TEXT_DOMAIN) : 'Minutes'}
                                            value={minorLabel}
                                            onChange={setMinorLabel}
                                            help={__('Displayed under 2nd icon box', TEXT_DOMAIN)}
                                            __nextHasNoMarginBottom
                                        />
                                    </FlexItem>
                                </Flex>
                            </div>
                        </div>
                    )}

                    {/* TYPE CHANGE WARNING OVERLAY */}
                    {showTypeWarning && (
                        <div style={{ padding: '12px', background: '#fff8e5', borderLeft: '4px solid #dba617', borderRadius: '3px' }}>
                            <Text display="block" style={{ fontSize: '12px', color: '#645300', marginBottom: '8px' }}>
                                <strong>{__('Type Change Notice:', TEXT_DOMAIN)}</strong> {sprintf(__('Changing attribute type to "%s" alters UI rendering, but does NOT convert existing values in MySQL.', TEXT_DOMAIN), pendingType)}
                            </Text>
                            <Flex justify="flex-end" gap={2}>
                                <Button isSmall variant="tertiary" onClick={() => { setShowTypeWarning(false); setPendingType(null); }}>
                                    {__('Cancel Type Change', TEXT_DOMAIN)}
                                </Button>
                                <Button isSmall variant="secondary" onClick={confirmTypeChange}>
                                    {__('Confirm Type Change', TEXT_DOMAIN)}
                                </Button>
                            </Flex>
                        </div>
                    )}

                    {/* MODAL ACTION BUTTONS */}
                    <Flex justify="flex-end" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', gap: '10px' }}>
                        <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
                            {__('Cancel', TEXT_DOMAIN)}
                        </Button>
                        <Button variant="primary" onClick={handleSave} isBusy={isSaving} disabled={isSaving}>
                            {__('Save Attribute Configuration', TEXT_DOMAIN)}
                        </Button>
                    </Flex>
                </div>
            </Modal>

            {/* INNER ICON PICKER MODAL */}
            <IconPickerModal
                isOpen={isIconPickerOpen}
                onClose={() => setIsIconPickerOpen(false)}
                onSelectIcon={handleSelectIconFromPicker}
                currentIconKey={pickerSlot === 'secondary' ? secondaryIcon : primaryIcon}
            />
        </>
    );
};