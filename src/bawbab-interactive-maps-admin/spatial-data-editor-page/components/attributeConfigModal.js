import { useState, useEffect } from '@wordpress/element';
import { 
    Modal, Button, TextControl, SelectControl, Flex, FlexItem, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { renderIconBySlug, LEGACY_ICON_NAMES } from '../constants/iconRegistry';
import { normalizeFieldType } from '../utils/dualCounterHelper';
import { IconPickerModal } from './iconPickerModal';

const FIELD_TYPE_OPTIONS = [
    { label: __('Text', 'bawbab-interactive-maps'), value: 'text' },
    { label: __('Number', 'bawbab-interactive-maps'), value: 'number' },
    { label: __('Boolean', 'bawbab-interactive-maps'), value: 'boolean' },
    { label: __('Dual Counter', 'bawbab-interactive-maps'), value: 'dual_counter' },
];

const LAYOUT_OPTIONS = [
    { label: __('Grid (2 Per Row)', 'bawbab-interactive-maps'), value: 'half' },
    { label: __('Full Width (1 Line)', 'bawbab-interactive-maps'), value: 'full' },
];

const DUAL_MODE_OPTIONS = [
    { label: __('Category Split (e.g. Shower / Bathroom)', 'bawbab-interactive-maps'), value: 'split' },
    { label: __('Time Breakdown (Hours / Minutes)', 'bawbab-interactive-maps'), value: 'time' },
    { label: __('Measurement (Feet / Inches)', 'bawbab-interactive-maps'), value: 'measurement' },
];

const TIME_UNIT_OPTIONS = [
    { label: __('Hours & Minutes (1 hr 30 min)', 'bawbab-interactive-maps'), value: 'hours_minutes' },
    { label: __('Minutes & Seconds (1 min 30 sec)', 'bawbab-interactive-maps'), value: 'minutes_seconds' },
    { label: __('Days & Hours (1 d 12 hr)', 'bawbab-interactive-maps'), value: 'days_hours' },
];

const MEASUREMENT_UNIT_OPTIONS = [
    { label: __('Feet & Inches (6\' 7")', 'bawbab-interactive-maps'), value: 'feet_inches' },
    { label: __('Miles & Feet (1 mi 500 ft)', 'bawbab-interactive-maps'), value: 'miles_feet' },
    { label: __('Kilometers & Meters (1 km 500 m)', 'bawbab-interactive-maps'), value: 'km_meters' },
    { label: __('Meters & Centimeters (1 m 50 cm)', 'bawbab-interactive-maps'), value: 'meters_cm' },
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
            className={`bawbin-maps-custom-icon-wrapper ${isLegacy ? 'is-legacy' : 'is-lucide'}`} 
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
                .bawbin-maps-custom-icon-wrapper.is-lucide svg {
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 2px !important;
                }
                .bawbin-maps-custom-icon-wrapper.is-legacy svg {
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
    mode = 'edit', // 'edit' | 'create'
    onClose, 
    onSave 
}) => {
    if (!isOpen || !item) return null;

    const isCreateMode = mode === 'create' || item.key === 'new_attribute';

    const [label, setLabel] = useState(item.label || '');
    const [type, setType] = useState(normalizeFieldType(item.type));
    const [icon, setIcon] = useState(item.icon || '');
    
    // Configuration Settings
    const cfg = item.config || {};
    const [dualMode, setDualMode] = useState(cfg.mode || 'split');
    const [layoutMode, setLayoutMode] = useState(
        normalizeFieldType(item.type) === 'dual_counter' && (cfg.mode || 'split') === 'split'
            ? 'full'
            : (cfg.layout || 'half')
    );
    const [mainUnit, setMainUnit] = useState(cfg.mainUnit || '');
    const [majorLabel, setMajorLabel] = useState(cfg.majorLabel || '');
    const [minorLabel, setMinorLabel] = useState(cfg.minorLabel || '');
    
    const [showTypeWarning, setShowTypeWarning] = useState(false);
    const [pendingType, setPendingType] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Inner Icon Picker State
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [pickerSlot, setPickerSlot] = useState('primary');

    useEffect(() => {
        setLabel(item.label || '');
        const normType = normalizeFieldType(item.type);
        setType(normType);
        setIcon(item.icon || '');
        const currentCfg = item.config || {};
        const currentMode = currentCfg.mode || 'split';
        setDualMode(currentMode);
        
        // Force full width layout for split mode
        if (normType === 'dual_counter' && currentMode === 'split') {
            setLayoutMode('full');
        } else {
            setLayoutMode(currentCfg.layout || 'half');
        }

        setMainUnit(currentCfg.mainUnit || '');
        setMajorLabel(currentCfg.majorLabel || '');
        setMinorLabel(currentCfg.minorLabel || '');
    }, [item]);

    const derivedKey = isCreateMode ? createKeySlug(label) : item.key;

    const handleDualModeChange = (newMode) => {
        setDualMode(newMode);
        if (newMode === 'split') {
            setLayoutMode('full'); // Category Split is strictly full width
            setMainUnit('');
        } else if (newMode === 'time') {
            setMainUnit('hours_minutes');
        } else if (newMode === 'measurement') {
            setMainUnit('feet_inches');
        }
    };

    const handleTypeSelect = (newType) => {
        if (newType === type) return;
        if (isCreateMode) {
            setType(newType);
            if (newType === 'dual_counter') {
                setDualMode('split');
                setLayoutMode('full');
                setMainUnit('hours_minutes');
            }
        } else {
            setPendingType(newType);
            setShowTypeWarning(true);
        }
    };

    const confirmTypeChange = () => {
        if (!pendingType) return;
        setType(pendingType);
        if (pendingType === 'dual_counter' && dualMode === 'split') {
            setLayoutMode('full');
        }
        setShowTypeWarning(false);
        setPendingType(null);
    };

    const handleOpenPicker = (slot = 'primary') => {
        setPickerSlot(slot);
        setIsIconPickerOpen(true);
    };

    const handleSelectIconFromPicker = (selectedSlug) => {
        const isSplitMode = type === 'dual_counter' && dualMode === 'split';
        if (isSplitMode) {
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

    const isCategorySplit = type === 'dual_counter' && dualMode === 'split';

    const handleSave = async () => {
        if (isCreateMode && !label.trim()) return;

        setIsSaving(true);

        const effectiveLayout = isCategorySplit ? 'full' : layoutMode;

        const updatedConfig = {
            layout: effectiveLayout,
            ...(type === 'dual_counter' ? {
                mode: dualMode,
                mainUnit: dualMode === 'time' ? (mainUnit || 'hours_minutes') : (dualMode === 'measurement' ? (mainUnit || 'feet_inches') : ''),
                majorLabel: majorLabel.trim(),
                minorLabel: minorLabel.trim(),
            } : {})
        };

        const res = await onSave({
            ...item,
            key: derivedKey,
            label: label.trim() || derivedKey,
            type,
            icon,
            config: updatedConfig
        });

        setIsSaving(false);
        if (res && res.success !== false) {
            onClose();
        }
    };

    const handleModalRequestClose = () => {
        if (isIconPickerOpen) return;
        onClose();
    };

    const isDual = type === 'dual_counter';

    const iconParts = (icon || '').split(',');
    const primaryIcon = iconParts[0] || '';
    const secondaryIcon = iconParts[1] || '';

    const modalTitle = isCreateMode 
        ? __('Register New Custom Field', 'bawbab-interactive-maps')
        : sprintf(__('Configure Attribute: %s', 'bawbab-interactive-maps'), item.label || item.key);

    return (
        <>
            <Modal
                title={modalTitle}
                onRequestClose={handleModalRequestClose}
                style={{ maxWidth: '600px', width: '100%' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 1. DISPLAY LABEL EDITING */}
                    <TextControl
                        label={__('Display Label', 'bawbab-interactive-maps')}
                        value={label}
                        onChange={setLabel}
                        placeholder="e.g. Duration, Square Feet, or Fireplace"
                        help={
                            isCreateMode
                                ? sprintf(__('Database Key Slug: %s', 'bawbab-interactive-maps'), derivedKey || '--')
                                : sprintf(__('Database Slug: %s (non-editable)', 'bawbab-interactive-maps'), item.key)
                        }
                        style={{ height: '36px', minHeight: '36px' }}
                        __nextHasNoMarginBottom
                    />

                    {/* 2. FIELD TYPE SELECTION */}
                    <div className="select-control-wrapper">
                        <SelectControl
                            label={__('Field Type', 'bawbab-interactive-maps')}
                            value={type}
                            options={FIELD_TYPE_OPTIONS}
                            onChange={handleTypeSelect}
                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                            __nextHasNoMarginBottom
                        />
                    </div>

                    {/* 3. DUAL COUNTER MODE & UNIT SETTINGS */}
                    {isDual && (
                        <div style={{ padding: '14px', background: '#f9f9f9', border: '1px solid #d0d7de', borderRadius: '4px' }}>
                            <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '10px' }}>
                                {__('Dual Counter Mode & Unit Settings', 'bawbab-interactive-maps')}
                            </Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="select-control-wrapper">
                                    <SelectControl
                                        label={__('Display Mode', 'bawbab-interactive-maps')}
                                        value={dualMode}
                                        options={DUAL_MODE_OPTIONS}
                                        onChange={handleDualModeChange}
                                        style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                        __nextHasNoMarginBottom
                                    />
                                </div>

                                {/* ENFORCED UNIT SELECTION FOR TIME AND MEASUREMENT */}
                                {dualMode === 'time' && (
                                    <div className="select-control-wrapper">
                                        <SelectControl
                                            label={__('Main Time Unit Structure', 'bawbab-interactive-maps')}
                                            value={mainUnit || 'hours_minutes'}
                                            options={TIME_UNIT_OPTIONS}
                                            onChange={setMainUnit}
                                            help={__('Choose the primary time unit structure for side drawer display.', 'bawbab-interactive-maps')}
                                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                            __nextHasNoMarginBottom
                                        />
                                    </div>
                                )}

                                {dualMode === 'measurement' && (
                                    <div className="select-control-wrapper">
                                        <SelectControl
                                            label={__('Main Distance / Measurement Unit System', 'bawbab-interactive-maps')}
                                            value={mainUnit || 'feet_inches'}
                                            options={MEASUREMENT_UNIT_OPTIONS}
                                            onChange={setMainUnit}
                                            help={__('Choose the distance unit system for side drawer display.', 'bawbab-interactive-maps')}
                                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                            __nextHasNoMarginBottom
                                        />
                                    </div>
                                )}

                                {/* SUBCATEGORY LABELS FOR SPLIT MODE ONLY */}
                                {dualMode === 'split' && (
                                    <Flex gap={2}>
                                        <FlexItem style={{ flex: 1 }}>
                                            <TextControl
                                                label={__('Major Subcategory Label', 'bawbab-interactive-maps')}
                                                placeholder={__('e.g. Shower', 'bawbab-interactive-maps')}
                                                value={majorLabel}
                                                onChange={setMajorLabel}
                                                help={__('Label for primary item', 'bawbab-interactive-maps')}
                                                style={{ height: '36px', minHeight: '36px' }}
                                                __nextHasNoMarginBottom
                                            />
                                        </FlexItem>
                                        <FlexItem style={{ flex: 1 }}>
                                            <TextControl
                                                label={__('Minor Subcategory Label', 'bawbab-interactive-maps')}
                                                placeholder={__('e.g. Bathroom', 'bawbab-interactive-maps')}
                                                value={minorLabel}
                                                onChange={setMinorLabel}
                                                help={__('Label for secondary item', 'bawbab-interactive-maps')}
                                                style={{ height: '36px', minHeight: '36px' }}
                                                __nextHasNoMarginBottom
                                            />
                                        </FlexItem>
                                    </Flex>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. DISPLAY LAYOUT SELECTION (DISPLAYED BELOW DUAL COUNTER SETTINGS; HIDDEN FOR CATEGORY SPLIT) */}
                    {!isCategorySplit && (
                        <div className="select-control-wrapper">
                            <SelectControl
                                label={__('Display Layout in Side Drawer', 'bawbab-interactive-maps')}
                                value={layoutMode}
                                options={LAYOUT_OPTIONS}
                                onChange={setLayoutMode}
                                help={__('Choose whether this field occupies a full row or fits into a 2-column grid row.', 'bawbab-interactive-maps')}
                                style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                                __nextHasNoMarginBottom
                            />
                        </div>
                    )}

                    {/* 5. ICON ASSIGNMENT / CLEARING */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '6px' }}>
                            {isCategorySplit ? __('Icons (Major / Minor)', 'bawbab-interactive-maps') : __('Assigned Icon', 'bawbab-interactive-maps')}
                        </label>

                        <Flex gap={2} align="center">
                            {isCategorySplit ? (
                                /* Category Split: 2 Icons */
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
                                            <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Major Icon', 'bawbab-interactive-maps')}</span>
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
                                            <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Minor Icon', 'bawbab-interactive-maps')}</span>
                                        )}
                                    </Button>
                                </Flex>
                            ) : (
                                /* Time, Measurement, Text, Number, Boolean: 1 Icon */
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
                                        <span style={{ fontSize: '12px', color: '#888' }}>🚫 {__('No Icon Assigned', 'bawbab-interactive-maps')}</span>
                                    )}
                                </Button>
                            )}

                            {icon !== '' && (
                                <Button
                                    isDestructive
                                    variant="tertiary"
                                    icon="no-alt"
                                    onClick={() => setIcon('')}
                                    label={__('Clear Icon (Set to No Icon)', 'bawbab-interactive-maps')}
                                    showTooltip
                                />
                            )}
                        </Flex>
                    </div>

                    {/* TYPE CHANGE WARNING OVERLAY */}
                    {showTypeWarning && (
                        <div style={{ padding: '12px', background: '#fff8e5', borderLeft: '4px solid #dba617', borderRadius: '3px' }}>
                            <Text display="block" style={{ fontSize: '12px', color: '#645300', marginBottom: '8px' }}>
                                <strong>{__('Type Change Notice:', 'bawbab-interactive-maps')}</strong> {sprintf(__('Changing attribute type to "%s" alters UI rendering, but does NOT convert existing values in MySQL.', 'bawbab-interactive-maps'), pendingType)}
                            </Text>
                            <Flex justify="flex-end" gap={2}>
                                <Button isSmall variant="tertiary" onClick={() => { setShowTypeWarning(false); setPendingType(null); }}>
                                    {__('Cancel Type Change', 'bawbab-interactive-maps')}
                                </Button>
                                <Button isSmall variant="secondary" onClick={confirmTypeChange}>
                                    {__('Confirm Type Change', 'bawbab-interactive-maps')}
                                </Button>
                            </Flex>
                        </div>
                    )}

                    {/* MODAL ACTION BUTTONS */}
                    <Flex justify="flex-end" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', gap: '10px' }}>
                        <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
                            {__('Cancel', 'bawbab-interactive-maps')}
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSave} 
                            isBusy={isSaving} 
                            disabled={isSaving || (isCreateMode && !label.trim())}
                        >
                            {isCreateMode ? __('Register Attribute', 'bawbab-interactive-maps') : __('Save Attribute Configuration', 'bawbab-interactive-maps')}
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