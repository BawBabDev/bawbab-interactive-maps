import { useState } from '@wordpress/element';
import { 
    Button, TextControl, SelectControl, Flex, FlexItem, 
    Spinner, Dashicon, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * Creates a clean database key slug from a human-readable label
 */
const createKeySlug = (label) => {
    return (label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const derivedKey = createKeySlug(newLabel);

    const handleAddKey = async () => {
        if (!newLabel.trim() || !derivedKey) return;
        setIsSubmitting(true);

        const res = await onUpdateKey({
            key: derivedKey,
            label: newLabel.trim(),
            type: newType
        });

        if (res.success) {
            setNewLabel('');
            setNewType('text');
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

    return (
        <div style={{ padding: '20px 0' }}>
            <Text variant="title.medium" display="block" style={{ marginBottom: '6px' }}>
                {__('Global Custom Attributes Schema Manager', TEXT_DOMAIN)}
            </Text>
            <Text variant="caption" display="block" style={{ color: '#666', marginBottom: '20px' }}>
                {__('Manage custom fields across all map features. Adding a field registers it globally; deleting a field purges it from all units in the database.', TEXT_DOMAIN)}
            </Text>

            {/* ADD NEW GLOBAL ATTRIBUTE KEY FORM WITH UNIFIED HEIGHTS */}
            <div style={{ padding: '16px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '25px' }}>
                <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '12px' }}>
                    {__('Register New Custom Field', TEXT_DOMAIN)}
                </Text>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '12px', alignItems: 'end' }}>
                    {/* 1. TEXT INPUT CONTROL */}
                    <div>
                        <TextControl
                            label={__('Field Name / Display Label', TEXT_DOMAIN)}
                            placeholder="e.g. Square Feet or Has Sunroom"
                            value={newLabel}
                            onChange={setNewLabel}
                            help={derivedKey ? sprintf(__('Database Key Slug: %s', TEXT_DOMAIN), derivedKey) : ''}
                            style={{ height: '36px', minHeight: '36px' }}
                            __nextHasNoMarginBottom
                        />
                    </div>

                    {/* 2. SELECT DROP-DOWN CONTROL (STYLED TO MATCH TEXT CONTROL) */}
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
                            onChange={setNewType}
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

                    {/* 3. SUBMIT BUTTON */}
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

            {/* EXISTING SCHEMA KEYS LIST */}
            {isLoading ? (
                <Flex justify="center" style={{ padding: '40px' }}><Spinner /></Flex>
            ) : schema.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '20px' }}>
                    {__('No custom attribute keys registered yet. Create one above or import a GeoJSON dataset.', TEXT_DOMAIN)}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px', gap: '12px', padding: '0 12px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: '600', fontSize: '12px', color: '#555' }}>
                        <span>{__('Display Label', TEXT_DOMAIN)}</span>
                        <span>{__('Database Slug', TEXT_DOMAIN)}</span>
                        <span>{__('Type', TEXT_DOMAIN)}</span>
                        <span style={{ textAlign: 'right' }}>{__('Actions', TEXT_DOMAIN)}</span>
                    </div>

                    {schema.map((item) => (
                        <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px', gap: '12px', padding: '10px 12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label || item.key}</span>
                            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', width: 'fit-content' }}>{item.key}</code>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2271b1', background: '#f0f6fb', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                                {item.type || 'text'}
                            </span>
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
                    ))}
                </div>
            )}
        </div>
    );
};