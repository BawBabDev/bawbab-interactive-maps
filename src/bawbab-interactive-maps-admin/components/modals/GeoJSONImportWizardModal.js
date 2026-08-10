import { 
    Modal, Button, SelectControl, CheckboxControl, Flex, FlexItem, 
    Spinner, Notice, ToggleControl 
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * Enhanced Auto-matcher for GeoJSON property keys against standard database fields.
 */
const autoMatchColumn = (stdField, detectedKeys) => {
    if (!detectedKeys || !detectedKeys.length) return '';

    const lowerKeys = detectedKeys.map(k => k.toLowerCase());

    const aliases = {
        fid: ['fid', 'id', 'feature_id', 'building_id', 'unit_id', 'objectid', 'cartodb_id'],
        floor: ['floor', 'level', 'floor_num', 'floor_number', 'storey'],
        name: ['name', 'label', 'title', 'building_name', 'unit_name'],
        code: ['code', 'unit', 'unit_code', 'room', 'room_number', 'unit_no'],
        category: ['category', 'cat', 'type', 'layer', 'class', 'building_type'],
        fill_color: ['fill_color', 'color', 'fill', 'hex_color', 'style_color'],
        lat: ['lat', 'latitude', 'centroid_lat', 'lat_y', 'y_coord'],
        lng: ['lng', 'longitude', 'centroid_lng', 'lng_x', 'x_coord', 'lon'],
        title: ['title', 'drawer_title', 'display_name', 'full_name'],
        description: ['description', 'desc', 'details', 'notes', 'summary'],
        wp_page_id: ['wp_page_id', 'page_id', 'linked_page', 'wp_page', 'post_id'],
        is_interactive: ['is_interactive', 'interactive', 'clickable'],
        show_label: ['show_label', 'display_label', 'visible_label', 'label_visible'],
    };

    const targetAliases = aliases[stdField] || [stdField];

    // Pass 1: Check for exact equality
    for (let i = 0; i < detectedKeys.length; i++) {
        const key = lowerKeys[i];
        if (targetAliases.some(alias => key === alias)) {
            return detectedKeys[i];
        }
    }

    // Pass 2: Word boundary regex matching
    for (let i = 0; i < detectedKeys.length; i++) {
        const key = lowerKeys[i];
        for (const alias of targetAliases) {
            if (alias.length <= 2 && key !== alias) continue;
            
            const regex = new RegExp(`(?:^|_)${alias}(?:$|_)`, 'i');
            if (regex.test(key)) {
                return detectedKeys[i];
            }
        }
    }

    return '';
};

/**
 * Infer data type from sample value
 */
const inferDataType = (val) => {
    if (val === null || val === undefined) return 'string';
    if (typeof val === 'boolean' || val === 'true' || val === 'false' || val === '0' || val === '1') return 'boolean';
    if (!isNaN(Number(val))) return 'number';
    return 'string';
};

/**
 * GeoJSONImportWizardModal Component
 */
export const GeoJSONImportWizardModal = ({ 
    file, 
    layerType, 
    onClose, 
    onInspect, 
    onExecuteImport 
}) => {
    const [isInspecting, setIsInspecting] = useState(true);
    const [inspectionError, setInspectionError] = useState(null);
    const [detectedKeys, setDetectedKeys] = useState([]);
    const [sampleProps, setSampleProps] = useState({});
    const [totalFeatures, setTotalFeatures] = useState(0);

    const standardFields = [
        { key: 'fid', label: __('Feature ID (fid)', TEXT_DOMAIN), required: true },
        { key: 'lat', label: __('Latitude (Center / Label)', TEXT_DOMAIN), required: false, supportsAuto: true },
        { key: 'lng', label: __('Longitude (Center / Label)', TEXT_DOMAIN), required: false, supportsAuto: true },
        { key: 'floor', label: __('Floor Number', TEXT_DOMAIN), required: false },
        { key: 'name', label: __('Name / Group Label', TEXT_DOMAIN), required: false },
        { key: 'code', label: __('Unit / Room Code', TEXT_DOMAIN), required: false },
        { key: 'category', label: __('Category Slug', TEXT_DOMAIN), required: false },
        { key: 'fill_color', label: __('Fill Color (HEX)', TEXT_DOMAIN), required: false },
        { key: 'wp_page_id', label: __('Linked WP Page ID', TEXT_DOMAIN), required: false },
        { key: 'is_interactive', label: __('Interactive Flag (0/1)', TEXT_DOMAIN), required: false },
        { key: 'show_label', label: __('Show Label Flag (0/1)', TEXT_DOMAIN), required: false },
        { key: 'title', label: __('Side Drawer Title', TEXT_DOMAIN), required: false },
        { key: 'description', label: __('Description Text', TEXT_DOMAIN), required: false },
    ];

    const [enabledStandardFields, setEnabledStandardFields] = useState({
        fid: true,
        lat: true,
        lng: true,
        floor: true,
        name: true,
        code: true,
        category: true,
        fill_color: true,
        wp_page_id: true,
        is_interactive: true,
        show_label: true,
        title: true,
        description: true,
    });

    const [autoComputeCoords, setAutoComputeCoords] = useState({
        lat: true,
        lng: true,
    });

    const [standardMapping, setStandardMapping] = useState({});
    const [customSelections, setCustomSelections] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const inspect = async () => {
            setIsInspecting(true);
            setInspectionError(null);
            try {
                const res = await onInspect(file);
                if (isMounted && res.success) {
                    const keys = res.detected_properties || [];
                    setDetectedKeys(keys);
                    setSampleProps(res.sample_properties || {});
                    setTotalFeatures(res.total_features || 0);

                    const initialStandardMapping = {};
                    const initialStandardEnabled = {};
                    const initialAutoCompute = { lat: true, lng: true };
                    const mappedSourceKeys = [];

                    standardFields.forEach(field => {
                        const match = autoMatchColumn(field.key, keys);
                        initialStandardMapping[field.key] = match;
                        
                        if ((field.key === 'lat' || field.key === 'lng') && match) {
                            initialAutoCompute[field.key] = false;
                        }

                        const isEnabled = field.required || Boolean(match) || field.supportsAuto;
                        initialStandardEnabled[field.key] = isEnabled;
                        
                        if (match && isEnabled) {
                            mappedSourceKeys.push(match);
                        }
                    });

                    const initialCustom = {};
                    keys.forEach(k => {
                        initialCustom[k] = !mappedSourceKeys.includes(k);
                    });

                    setStandardMapping(initialStandardMapping);
                    setEnabledStandardFields(initialStandardEnabled);
                    setAutoComputeCoords(initialAutoCompute);
                    setCustomSelections(initialCustom);
                } else if (isMounted) {
                    setInspectionError(res.message || __('Failed to inspect GeoJSON structure.', TEXT_DOMAIN));
                }
            } catch (err) {
                if (isMounted) {
                    setInspectionError(__('Network error during file inspection.', TEXT_DOMAIN));
                }
            } finally {
                if (isMounted) setIsInspecting(false);
            }
        };

        inspect();
        return () => { isMounted = false; };
    }, [file]);

    const handleStandardToggle = (stdKey, checked) => {
        if (stdKey === 'fid') return;
        setEnabledStandardFields(prev => ({ ...prev, [stdKey]: checked }));
    };

    const handleStandardChange = (stdKey, sourceVal) => {
        setStandardMapping(prev => ({ ...prev, [stdKey]: sourceVal }));
    };

    const handleCustomToggle = (propKey, checked) => {
        setCustomSelections(prev => ({ ...prev, [propKey]: checked }));
    };

    const handleImportSubmit = async () => {
        if (!enabledStandardFields.fid || !standardMapping.fid) {
            alert(__('Please map a column to the required Feature ID (fid).', TEXT_DOMAIN));
            return;
        }

        const activeStandardMapping = {};
        Object.keys(enabledStandardFields).forEach(key => {
            if (enabledStandardFields[key]) {
                if ((key === 'lat' || key === 'lng') && autoComputeCoords[key]) {
                    activeStandardMapping[key] = '__AUTO_COMPUTE__';
                } else if (standardMapping[key]) {
                    activeStandardMapping[key] = standardMapping[key];
                }
            }
        });

        const mappedSourceColumns = Object.values(activeStandardMapping).filter(v => v !== '__AUTO_COMPUTE__');
        
        const selectedCustomList = [];
        Object.keys(customSelections).forEach(k => {
            if (customSelections[k] && !mappedSourceColumns.includes(k)) {
                const sampleVal = sampleProps[k];
                const inferred = inferDataType(sampleVal);
                selectedCustomList.push({
                    key: k,
                    type: inferred
                });
            }
        });

        setIsExecuting(true);
        try {
            await onExecuteImport({
                file,
                layerType,
                fieldMapping: activeStandardMapping,
                importedCustomKeys: selectedCustomList
            });
            onClose();
        } catch (err) {
            console.error('Import execution failed:', err);
        } finally {
            setIsExecuting(false);
        }
    };

    const propertySelectOptions = [
        { label: __('-- Select GeoJSON Column --', TEXT_DOMAIN), value: '' },
        ...detectedKeys.map(key => ({
            label: `${key}${sampleProps[key] !== undefined ? `(e.g. "${sampleProps[key]}")` : ''}`,
            value: key
        }))
    ];

    const mappedSourceColumns = Object.keys(enabledStandardFields)
        .filter(k => enabledStandardFields[k])
        .map(k => standardMapping[k])
        .filter(Boolean);

    const dynamicKeys = detectedKeys.filter(k => !mappedSourceColumns.includes(k));

    return (
        <Modal 
            title={sprintf(__('Import Wizard: %s Layer', TEXT_DOMAIN), layerType.toUpperCase())}
            onRequestClose={onClose}
            style={{ maxWidth: '780px', width: '100%' }}
        >
            {isInspecting ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Spinner />
                    <p style={{ marginTop: '10px', color: '#666' }}>
                        {__('Inspecting GeoJSON structure...', TEXT_DOMAIN)}
                    </p>
                </div>
            ) : inspectionError ? (
                <div>
                    <Notice status="error" isDismissible={false}>
                        {inspectionError}
                    </Notice>
                    <Flex justify="end" style={{ marginTop: '20px' }}>
                        <Button variant="secondary" onClick={onClose}>
                            {__('Close', TEXT_DOMAIN)}
                        </Button>
                    </Flex>
                </div>
            ) : (
                <div>
                    <Notice status="info" isDismissible={false} style={{ marginBottom: '20px' }}>
                        {sprintf(__('Found %1$d features with %2$d attributes in GeoJSON.', TEXT_DOMAIN), totalFeatures, detectedKeys.length)}
                    </Notice>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                            {__('1. System Fields Mapping', TEXT_DOMAIN)}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            {__('Check fields to update in the database. Unchecked fields will be preserved.', TEXT_DOMAIN)}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f9f9f9', padding: '12px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                            {standardFields.map(field => {
                                const isChecked = enabledStandardFields[field.key];
                                const isAuto = field.supportsAuto && autoComputeCoords[field.key];

                                return (
                                    <Flex key={field.key} align="center" justify="space-between" gap={3} style={{ opacity: isChecked ? 1 : 0.6 }}>
                                        <FlexItem style={{ flex: '0 0 220px' }}>
                                            <CheckboxControl
                                                label={
                                                    <span>
                                                        <strong>{field.label}</strong>
                                                        {field.required && <span style={{ color: '#d63638' }}> *</span>}
                                                    </span>
                                                }
                                                checked={isChecked}
                                                disabled={field.required}
                                                onChange={(checked) => handleStandardToggle(field.key, checked)}
                                                __nextHasNoMarginBottom
                                            />
                                        </FlexItem>

                                        <FlexItem style={{ flex: 1 }}>
                                            <Flex align="center" gap={2}>
                                                {field.supportsAuto && isChecked && (
                                                    <ToggleControl
                                                        label={__('Auto-Compute Centroid', TEXT_DOMAIN)}
                                                        checked={isAuto}
                                                        onChange={(val) => setAutoComputeCoords(prev => ({ ...prev, [field.key]: val }))}
                                                        __nextHasNoMarginBottom
                                                    />
                                                )}

                                                {!isAuto && (
                                                    <div style={{ flex: 1 }}>
                                                        <SelectControl
                                                            value={standardMapping[field.key] || ''}
                                                            options={propertySelectOptions}
                                                            disabled={!isChecked}
                                                            onChange={(val) => handleStandardChange(field.key, val)}
                                                            __nextHasNoMarginBottom
                                                        />
                                                    </div>
                                                )}
                                            </Flex>
                                        </FlexItem>
                                    </Flex>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                            {__('2. Dynamic GeoJSON Custom Attributes (Check to Import)', TEXT_DOMAIN)}
                        </h3>
                        {dynamicKeys.length === 0 ? (
                            <p style={{ fontStyle: 'italic', color: '#888' }}>
                                {__('All GeoJSON attributes mapped to system fields above.', TEXT_DOMAIN)}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: '#f9f9f9', padding: '12px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                                {dynamicKeys.map(key => {
                                    const sampleVal = sampleProps[key];
                                    const inferredType = inferDataType(sampleVal);

                                    return (
                                        <Flex key={key} align="center" justify="space-between" style={{ padding: '6px 8px', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <FlexItem style={{ flex: 1 }}>
                                                <CheckboxControl
                                                    label={
                                                        <span>
                                                            <strong>{key}</strong>
                                                            <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px' }}>
                                                                {`[${inferredType}]${sampleVal !== undefined ? `(e.g., "${sampleVal}")` : ''}`}
                                                            </span>
                                                        </span>
                                                    }
                                                    checked={Boolean(customSelections[key])}
                                                    onChange={(checked) => handleCustomToggle(key, checked)}
                                                    __nextHasNoMarginBottom
                                                />
                                            </FlexItem>
                                        </Flex>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Flex justify="end" gap={3} style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                        <Button variant="secondary" onClick={onClose} disabled={isExecuting}>
                            {__('Cancel', TEXT_DOMAIN)}
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleImportSubmit} 
                            isBusy={isExecuting} 
                            disabled={isExecuting || !standardMapping.fid || !enabledStandardFields.fid}
                        >
                            {isExecuting ? __('Importing...', TEXT_DOMAIN) : __('Execute Import', TEXT_DOMAIN)}
                        </Button>
                    </Flex>
                </div>
            )}
        </Modal>
    );
};