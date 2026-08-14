import { useState } from '@wordpress/element';
import { 
    Button, TextControl, SelectControl, Flex, 
    Spinner, Dashicon, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { IconPickerModal } from './iconPickerModal';
import { renderIconBySlug, LEGACY_ICON_NAMES } from '../../../constants/iconRegistry';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

// Legacy default icon fallbacks for standard keys
const DEFAULT_LEGACY_ICONS = {
    sq_ft: 'area',
    baths: 'shower,sink',
    fireplace: 'fireplace',
    sunroom: 'sun'
};

const createKeySlug = (label) => {
    return (label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');
};

/**
 * Smart wrapper helper to render filled legacy SVGs or Lucide stroke line icons cleanly
 */
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

    // Modal state for picking icons (supports primary & secondary for bathrooms)
    const [isIconModalOpen, setIsIconModalOpen] = useState(false);
    const [editingItemKey, setEditingItemKey] = useState(null); // null = new field form
    const [editingTargetSlot, setEditingTargetSlot] = useState('primary'); // 'primary' | 'secondary'

    const derivedKey = createKeySlug(newLabel);

    const handleAddKey = async () => {
        if (!newLabel.trim() || !derivedKey) return;
        setIsSubmitting(true);

        // Format single vs dual comma-separated icon value
        let formattedIcon = newIconPrimary;
        if (newType === 'bathrooms') {
            const p = newIconPrimary || 'shower';
            const s = newIconSecondary || 'sink';
            formattedIcon = `${p},${s}`;
        }

        const res = await onUpdateKey({
            key: derivedKey,
            label: newLabel.trim(),
            type: newType,
            icon: formattedIcon
        });

        if (res.success) {
            setNewLabel('');
            setNewType('text');
            setNewIconPrimary('');
            setNewIconSecondary('');
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

    const handleSelectIcon = (selectedIconKey) => {
        if (editingItemKey) {
            // Updating existing field in schema table
            const item = schema.find(s => s.key === editingItemKey);
            if (item) {
                let updatedIcon = selectedIconKey;

                if (item.type === 'bathrooms') {
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
            // Setting icon in 'Register New Field' form
            if (newType === 'bathrooms' && editingTargetSlot === 'secondary') {
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

            {/* ADD NEW FIELD FORM WITH DYNAMIC SINGLE / DUAL ICON SELECTION */}
            <div style={{ padding: '16px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '12px' }}>
                    {__('Register New Custom Field', TEXT_DOMAIN)}
                </Text>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 180px auto', gap: '12px', alignItems: 'end' }}>
                    {/* 1. FIELD LABEL INPUT */}
                    <div>
                        <TextControl
                            label={__('Field Display Label', TEXT_DOMAIN)}
                            placeholder="e.g. Square Feet or Has Sunroom"
                            value={newLabel}
                            onChange={setNewLabel}
                            style={{ height: '36px', minHeight: '36px' }}
                            __nextHasNoMarginBottom
                        />
                    </div>

                    {/* 2. FIELD TYPE DROPDOWN */}
                    <div className="bwb-select-control-wrapper">
                        <SelectControl
                            label={__('Field Type', TEXT_DOMAIN)}
                            value={newType}
                            options={[
                                { label: __('Text', TEXT_DOMAIN), value: 'text' },
                                { label: __('Number', TEXT_DOMAIN), value: 'number' },
                                { label: __('Boolean', TEXT_DOMAIN), value: 'boolean' },
                                { label: __('Bathrooms', TEXT_DOMAIN), value: 'bathrooms' },
                            ]}
                            onChange={(val) => {
                                setNewType(val);
                                // Set initial default icons when switching to bathrooms
                                if (val === 'bathrooms') {
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

                    {/* 3. ICON SELECTION TRIGGER(S) */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>
                            {newType === 'bathrooms' ? __('Icons (Full / Half)', TEXT_DOMAIN) : __('Icon', TEXT_DOMAIN)}
                        </label>

                        {newType === 'bathrooms' ? (
                            /* DUAL BUTTON CONTROLS FOR BATHROOMS TYPE */
                            <Flex gap={1} align="center">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setEditingItemKey(null);
                                        setEditingTargetSlot('primary');
                                        setIsIconModalOpen(true);
                                    }}
                                    style={{ height: '36px', minHeight: '36px', flex: 1, justifyContent: 'center', padding: '0 8px' }}
                                    label={__('Select Full Bath / Shower Icon', TEXT_DOMAIN)}
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
                                    label={__('Select Half Bath / Sink Icon', TEXT_DOMAIN)}
                                    showTooltip
                                >
                                    {renderStyledIcon(newIconSecondary || 'sink', 18)}
                                </Button>
                            </Flex>
                        ) : (
                            /* SINGLE BUTTON CONTROL FOR STANDARD TYPES */
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

                    {/* 4. SUBMIT BUTTON */}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px 80px', gap: '12px', padding: '0 12px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                        <span>{__('Display Label', TEXT_DOMAIN)}</span>
                        <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                        <span>{__('Type', TEXT_DOMAIN)}</span>
                        <span>{__('Icon(s)', TEXT_DOMAIN)}</span>
                        <span style={{ textAlign: 'right' }}>{__('Actions', TEXT_DOMAIN)}</span>
                    </div>

                    {schema.map((item) => {
                        const isBathroom = item.type === 'bathrooms';
                        const effectiveIconSlug = item.icon || DEFAULT_LEGACY_ICONS[item.key] || '';
                        const iconParts = effectiveIconSlug.split(',');
                        
                        const primarySlug = iconParts[0] || 'shower';
                        const secondarySlug = iconParts[1] || 'sink';

                        return (
                            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px 80px', gap: '12px', padding: '10px 12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label || item.key}</span>
                                <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', width: 'fit-content' }}>{item.key}</code>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2271b1', background: '#f0f6fb', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                                    {item.type || 'text'}
                                </span>
                                
                                {/* ICON SELECTION COLUMN: Dual controls for 'bathrooms' vs Single for text/number */}
                                <Flex align="center" gap={1}>
                                    {isBathroom ? (
                                        <>
                                            {/* PRIMARY ICON (Shower / Full Bath) */}
                                            <Button
                                                variant="tertiary"
                                                isSmall
                                                onClick={() => {
                                                    setEditingItemKey(item.key);
                                                    setEditingTargetSlot('primary');
                                                    setIsIconModalOpen(true);
                                                }}
                                                style={{ padding: '0 4px', height: '28px', minWidth: '28px' }}
                                                label={__('Full Bath Icon', TEXT_DOMAIN)}
                                                showTooltip
                                            >
                                                {renderStyledIcon(primarySlug, 16)}
                                            </Button>

                                            <span style={{ fontSize: '10px', color: '#aaa' }}>/</span>

                                            {/* SECONDARY ICON (Sink / Half Bath) */}
                                            <Button
                                                variant="tertiary"
                                                isSmall
                                                onClick={() => {
                                                    setEditingItemKey(item.key);
                                                    setEditingTargetSlot('secondary');
                                                    setIsIconModalOpen(true);
                                                }}
                                                style={{ padding: '0 4px', height: '28px', minWidth: '28px' }}
                                                label={__('Half Bath / Sink Icon', TEXT_DOMAIN)}
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

                                    {/* UNASSIGN ICON BUTTON */}
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

            {/* REUSABLE ICON PICKER MODAL */}
            <IconPickerModal
                isOpen={isIconModalOpen}
                onClose={() => setIsIconModalOpen(false)}
                onSelectIcon={handleSelectIcon}
                currentIconKey={
                    editingItemKey 
                        ? (() => {
                            const item = schema.find(s => s.key === editingItemKey);
                            const raw = item?.icon || DEFAULT_LEGACY_ICONS[editingItemKey] || '';
                            if (item?.type === 'bathrooms') {
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