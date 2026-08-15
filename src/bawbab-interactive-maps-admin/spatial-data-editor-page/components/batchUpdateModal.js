import { useState, useMemo } from '@wordpress/element';
import { Modal, Button, SelectControl, CheckboxControl, Flex, __experimentalText as Text } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

// Fields strictly protected from bulk editing
const PROTECTED_FIELDS = ['fid', 'layer_type', 'code', 'name', 'category'];

export const BatchUpdateModal = ({
    isOpen,
    activeFeature,
    draftData = {},
    globalSchema = [],
    groups = [],
    categoryMap = {},
    allFeatures = [],
    onClose,
    onConfirmBatch
}) => {
    if (!isOpen || !activeFeature) return null;

    const [scopeType, setScopeType] = useState('category'); // 'category' | 'group' | 'name'

    const featureProps = activeFeature.properties || {};
    const currentCategory = featureProps.category || '';
    const currentLayer = featureProps.layer_type || 'buildings';
    const currentName = featureProps.name || '';

    // Resolve composite category key
    const compositeKey = `${currentLayer}::${currentCategory}`;
    const categoryInfo = categoryMap[compositeKey] || categoryMap[currentCategory] || {};
    const matchedGroupId = categoryInfo.groupId || '';
    const matchedGroup = groups.find(g => g.id === matchedGroupId);

    // Extract ONLY fields explicitly changed by user interaction on the active feature
    const modifiedFieldList = useMemo(() => {
        const fields = [];
        const dirtyKeys = draftData._dirtyKeys || [];

        dirtyKeys.forEach((dirtyKey) => {
            // Handle Custom Attributes
            if (dirtyKey.startsWith('custom_attr::')) {
                const attrKey = dirtyKey.replace('custom_attr::', '');
                if (PROTECTED_FIELDS.includes(attrKey)) return;

                const schemaItem = globalSchema.find((s) => s.key === attrKey);
                const val = draftData.custom_attributes ? draftData.custom_attributes[attrKey] : undefined;

                fields.push({
                    key: attrKey,
                    label: schemaItem?.label || attrKey,
                    isCustomAttr: true,
                    value: val,
                });
            } 
            // Handle Core Fields
            else {
                const key = dirtyKey;
                if (PROTECTED_FIELDS.includes(key) || key === '_dirtyKeys') return;

                let label = key;
                if (key === 'title') label = __('Display Title', TEXT_DOMAIN);
                else if (key === 'wp_page_id') label = __('Linked WP Page', TEXT_DOMAIN);
                else if (key === 'use_custom_color') label = __('Use Custom Fill Color', TEXT_DOMAIN);
                else if (key === 'fill_color') label = __('Custom Fill Color', TEXT_DOMAIN);
                else if (key === 'description') label = __('Custom Description', TEXT_DOMAIN);
                else if (key === 'append_description') label = __('Append to WP Page Content', TEXT_DOMAIN);
                else if (key === 'is_interactive') label = __('Feature is Interactive', TEXT_DOMAIN);
                else if (key === 'show_label') label = __('Display Label on Map', TEXT_DOMAIN);
                else if (key === 'hide_page_video') label = __('Hide Page Video', TEXT_DOMAIN);
                else if (key === 'custom_video_url') label = __('Custom Video URL', TEXT_DOMAIN);
                else if (key === 'hide_page_floorplan') label = __('Hide Page Floorplan', TEXT_DOMAIN);
                else if (key === 'custom_floorplan_url') label = __('Custom Floorplan URL', TEXT_DOMAIN);
                else if (key === 'gallery') label = __('Custom Gallery', TEXT_DOMAIN);

                fields.push({
                    key,
                    label,
                    isCustomAttr: false,
                    value: draftData[key],
                });
            }
        });

        return fields;
    }, [draftData, globalSchema]);

    // Initial state: All modified fields checked by default
    const [selectedFields, setSelectedFields] = useState(() => {
        const initial = {};
        modifiedFieldList.forEach(f => { initial[f.key] = true; });
        return initial;
    });

    const toggleFieldSelection = (key) => {
        setSelectedFields(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Count affected features per scope
    const targetCounts = useMemo(() => {
        let categoryCount = 0;
        let groupCount = 0;
        let nameCount = 0;

        allFeatures.forEach(f => {
            const p = f.properties || {};
            const fCat = p.category || '';
            const fLayer = p.layer_type || 'buildings';
            const fComposite = `${fLayer}::${fCat}`;
            const fCatInfo = categoryMap[fComposite] || categoryMap[fCat] || {};

            if (fCat === currentCategory) categoryCount++;
            if (matchedGroupId && fCatInfo.groupId === matchedGroupId) groupCount++;
            if (currentName && p.name === currentName) nameCount++;
        });

        return { categoryCount, groupCount, nameCount };
    }, [allFeatures, currentCategory, matchedGroupId, currentName, categoryMap]);

    const scopeOptions = useMemo(() => {
        const options = [];

        if (currentCategory) {
            options.push({
                label: sprintf(
                    __('All units in Category: "%s" (%d units)', TEXT_DOMAIN),
                    categoryInfo.label || currentCategory,
                    targetCounts.categoryCount
                ),
                value: 'category'
            });
        }

        if (matchedGroup) {
            options.push({
                label: sprintf(
                    __('All units in Category Group: "%s" (%d units)', TEXT_DOMAIN),
                    matchedGroup.title,
                    targetCounts.groupCount
                ),
                value: 'group'
            });
        }

        if (currentName) {
            options.push({
                label: sprintf(
                    __('All units sharing Name: "%s" (%d units)', TEXT_DOMAIN),
                    currentName,
                    targetCounts.nameCount
                ),
                value: 'name'
            });
        }

        return options;
    }, [currentCategory, categoryInfo, matchedGroup, currentName, targetCounts]);

    const handleApplyBatch = () => {
        let filterPredicate = null;

        if (scopeType === 'category') {
            filterPredicate = (f) => (f.properties?.category || '') === currentCategory;
        } else if (scopeType === 'group') {
            filterPredicate = (f) => {
                const fCat = f.properties?.category || '';
                const fLayer = f.properties?.layer_type || 'buildings';
                const fComposite = `${fLayer}::${fCat}`;
                const fInfo = categoryMap[fComposite] || categoryMap[fCat] || {};
                return fInfo.groupId === matchedGroupId;
            };
        } else if (scopeType === 'name') {
            filterPredicate = (f) => (f.properties?.name || '') === currentName;
        }

        // Filter list of payload entries to only include checked fields
        const fieldsToSync = modifiedFieldList.filter(f => selectedFields[f.key]);

        if (filterPredicate && fieldsToSync.length > 0) {
            onConfirmBatch({
                fieldsToSync,
                filterPredicate
            });
        }

        onClose();
    };

    const hasSelectedFields = Object.values(selectedFields).some(Boolean);

    return (
        <Modal
            title={__('Apply Changes to Other Features (Batch Draft)', TEXT_DOMAIN)}
            onRequestClose={onClose}
            style={{ maxWidth: '580px', width: '100%' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Text display="block" style={{ fontSize: '13px', color: '#555' }}>
                    {__('Select the target group scope and check which modified fields you want to propagate to other features. (Changes will be staged as drafts until you save.)', TEXT_DOMAIN)}
                </Text>

                {/* 1. SCOPE SELECTION DROPDOWN */}
                <SelectControl
                    label={__('Target Feature Group', TEXT_DOMAIN)}
                    value={scopeType}
                    options={scopeOptions}
                    onChange={setScopeType}
                    __nextHasNoMarginBottom
                />

                {/* 2. MODIFIED FIELDS TO SYNC CHECKLIST */}
                <div style={{ padding: '12px', background: '#f9f9f9', border: '1px solid #d0d7de', borderRadius: '4px' }}>
                    <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '8px' }}>
                        {__('Select Fields to Propagate:', TEXT_DOMAIN)}
                    </Text>

                    {modifiedFieldList.length === 0 ? (
                        <Text variant="caption" style={{ color: '#888', fontStyle: 'italic' }}>
                            {__('No modified fields found in active draft. Change a field in the editor first.', TEXT_DOMAIN)}
                        </Text>
                    ) : (
                        <div 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '10px', 
                                maxHeight: '180px', 
                                overflowY: 'auto',
                                padding: '4px 6px'
                            }}
                        >
                            {modifiedFieldList.map(field => (
                                <CheckboxControl
                                    key={field.key}
                                    label={
                                        <span>
                                            <strong>{field.label}:</strong>{' '}
                                            <code style={{ fontSize: '11px', color: '#2271b1' }}>
                                                {typeof field.value === 'boolean' 
                                                    ? (field.value ? 'Yes' : 'No') 
                                                    : String(field.value ?? 'Unset')}
                                            </code>
                                        </span>
                                    }
                                    checked={Boolean(selectedFields[field.key])}
                                    onChange={() => toggleFieldSelection(field.key)}
                                    __nextHasNoMarginBottom
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ACTION BUTTONS */}
                <Flex justify="flex-end" gap={2} style={{ marginTop: '10px' }}>
                    <Button variant="tertiary" onClick={onClose}>
                        {__('Cancel', TEXT_DOMAIN)}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleApplyBatch}
                        disabled={!hasSelectedFields || modifiedFieldList.length === 0}
                    >
                        {__('Apply to Group Drafts', TEXT_DOMAIN)}
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};