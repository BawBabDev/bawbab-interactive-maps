import { __ } from '@wordpress/i18n';
import { renderIconBySlug } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/constants/iconRegistry';
import { useAttributeSchema } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/hooks/useAttributeSchema';
import { formatDualCounter } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/utils/dualCounterHelper';

const formatFieldLabel = (str) => {
    if (!str) return '';
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/**
 * Safely resolves an icon slug into a renderable node or null to avoid React #130 crashes
 */
const SafeIcon = ({ iconSlug }) => {
    if (!iconSlug) return null;
    const resolved = renderIconBySlug(iconSlug);
    if (!resolved) return null;
    return <>{resolved}</>;
};

export const UnitSpecs = ({ specs }) => {
    if (!specs) return null;

    const { schema = [] } = useAttributeSchema();

    // 1. Resolve custom_attributes
    let customAttrs = specs.custom_attributes || {};
    if (typeof customAttrs === 'string') {
        try {
            customAttrs = JSON.parse(customAttrs);
        } catch (e) {
            customAttrs = {};
        }
    }

    const rawAttrs = {
        sq_ft: customAttrs.sq_ft !== undefined ? customAttrs.sq_ft : specs.sq_ft,
        fireplace: customAttrs.fireplace !== undefined ? customAttrs.fireplace : specs.fireplace,
        sunroom: customAttrs.sunroom !== undefined ? customAttrs.sunroom : specs.sunroom,
        ...customAttrs
    };

    const activeKeys = Object.keys(rawAttrs).filter(key => {
        const val = rawAttrs[key];
        return val !== undefined && val !== null && val !== '';
    });

    if (activeKeys.length === 0) {
        return null;
    }

    // 2. Sort ALL active keys strictly based on position in central schema
    const schemaKeyOrder = schema.map(s => s.key);
    const sortedKeys = activeKeys.sort((a, b) => {
        const indexA = schemaKeyOrder.indexOf(a);
        const indexB = schemaKeyOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    // 3. Build rows dynamically using schema configurations
    const rows = [];
    let standaloneBuffer = [];

    const flushBuffer = () => {
        if (standaloneBuffer.length > 0) {
            rows.push({ type: 'dual', items: [...standaloneBuffer] });
            standaloneBuffer = [];
        }
    };

    sortedKeys.forEach((key) => {
        const val = rawAttrs[key];
        const schemaItem = schema.find(s => s.key === key);
        const attributeName = schemaItem?.label || formatFieldLabel(key);
        const fieldType = schemaItem?.type || (typeof val === 'boolean' ? 'boolean' : (isFinite(val) ? 'number' : 'text'));
        
        const config = schemaItem?.config || {};
        const isFullWidth = config.layout === 'full';

        if (fieldType === 'dual_counter') {
            const rawIcons = (schemaItem?.icon || '').split(',');
            const primaryIconSlug = rawIcons[0] || '';
            const secondaryIconSlug = rawIcons[1] || '';

            const mode = config.mode || 'split';

            // Resolve explicit subcategory / unit designations set by user
            let majorSubcategory = config.majorLabel;
            let minorSubcategory = config.minorLabel;

            if (!majorSubcategory) {
                if (key === 'baths') {
                    majorSubcategory = __('Shower', 'bawbab-interactive-maps');
                } else if (mode === 'time') {
                    majorSubcategory = __('hr', 'bawbab-interactive-maps');
                } else if (mode === 'measurement') {
                    majorSubcategory = __('ft', 'bawbab-interactive-maps');
                } else {
                    majorSubcategory = __('Major', 'bawbab-interactive-maps');
                }
            }

            if (!minorSubcategory) {
                if (key === 'baths') {
                    minorSubcategory = __('Bathroom', 'bawbab-interactive-maps');
                } else if (mode === 'time') {
                    minorSubcategory = __('min', 'bawbab-interactive-maps');
                } else if (mode === 'measurement') {
                    minorSubcategory = __('in', 'bawbab-interactive-maps');
                } else {
                    minorSubcategory = __('Minor', 'bawbab-interactive-maps');
                }
            }

            const formatted = formatDualCounter(val, {
                mode,
                mainUnit: config.mainUnit,
                majorLabel: majorSubcategory,
                minorLabel: minorSubcategory,
            });

            // TIME & MEASUREMENT: Single icon, single-line text display
            if (mode === 'time' || mode === 'measurement') {
                const itemObj = {
                    id: key,
                    type: 'text',
                    icon: primaryIconSlug,
                    value: formatted.displayText || String(val),
                    label: attributeName,
                    isFullWidth
                };

                if (isFullWidth) {
                    flushBuffer();
                    rows.push({ type: 'full', items: [itemObj] });
                } else {
                    standaloneBuffer.push(itemObj);
                    if (standaloneBuffer.length === 2) flushBuffer();
                }
            } else {
                // CATEGORY SPLIT: Occupies a full row block
                flushBuffer();

                const isMajorZero = formatted.majorCount === 0;
                const isMinorZero = formatted.minorCount === 0;

                rows.push({
                    type: 'dual',
                    items: [
                        {
                            id: `${key}_major`,
                            // Convert to boolean style when zero so red cross / disabled state renders
                            type: isMajorZero ? 'boolean' : 'number',
                            icon: primaryIconSlug,
                            isTrue: !isMajorZero,
                            value: isMajorZero ? '' : formatted.majorValue,
                            label: majorSubcategory,
                            parentAttribute: attributeName
                        },
                        {
                            id: `${key}_minor`,
                            // Convert to boolean style when zero so red cross / disabled state renders
                            type: isMinorZero ? 'boolean' : 'number',
                            icon: secondaryIconSlug,
                            isTrue: !isMinorZero,
                            value: isMinorZero ? '' : formatted.minorValue,
                            label: minorSubcategory,
                            parentAttribute: attributeName
                        }
                    ]
                });
            }
        } else {
            // STANDARD FIELDS: Text, Number, Boolean
            let itemObj = null;

            if (fieldType === 'boolean') {
                const isTrue = Boolean(val) && val !== 'false' && val !== '0';
                const defaultIcon = schemaItem?.icon || (key === 'fireplace' ? 'fireplace' : (key === 'sunroom' ? 'sun' : 'check'));

                itemObj = {
                    id: key,
                    type: 'boolean',
                    icon: defaultIcon,
                    isTrue,
                    label: attributeName,
                    isFullWidth
                };
            } else if (fieldType === 'number') {
                itemObj = {
                    id: key,
                    type: 'number',
                    icon: schemaItem?.icon || (key === 'sq_ft' ? 'area' : ''),
                    value: key === 'sq_ft' ? val : (isFinite(val) ? `x${val}` : val),
                    label: attributeName,
                    isFullWidth
                };
            } else {
                itemObj = {
                    id: key,
                    type: 'text',
                    icon: schemaItem?.icon || '',
                    value: String(val),
                    label: attributeName,
                    isFullWidth
                };
            }

            if (isFullWidth) {
                flushBuffer();
                rows.push({ type: 'full', items: [itemObj] });
            } else {
                standaloneBuffer.push(itemObj);
                if (standaloneBuffer.length === 2) flushBuffer();
            }
        }
    });

    flushBuffer();

    return (
        <div className="location-specs-container">
            {rows.map((row, rowIndex) => (
                <div 
                    key={rowIndex} 
                    className={`specs-row ${row.type === 'full' ? 'full-width-row' : 'dual-row'}`}
                    style={{ justifyContent: row.type === 'full' ? 'center' : 'space-around' }}
                >
                    {row.items.map((item) => {
                        const hasIcon = Boolean(item.icon);

                        if (item.type === 'boolean') {
                            return (
                                <div 
                                    key={item.id} 
                                    className={`spec-item ${!item.isTrue ? 'is-disabled' : ''} ${item.isFullWidth ? 'is-full-width' : ''}`}
                                    style={{ flex: item.isFullWidth ? '0 0 100%' : 1 }}
                                >
                                    <div className="spec-icon-row">
                                        <div className="icon-wrapper">
                                            {hasIcon && (
                                                <span className="fa-icon" style={{ color: !item.isTrue ? '#a7aaad' : '#333' }}>
                                                    <SafeIcon iconSlug={item.icon} />
                                                </span>
                                            )}
                                            {!item.isTrue && <span className="no-sign"></span>}
                                        </div>
                                    </div>
                                    <span className="spec-label">{item.label}</span>
                                    {item.parentAttribute && (
                                        <span className="spec-label" style={{ color: '#aaa', marginTop: '2px', fontWeight: '500' }}>
                                            {item.parentAttribute}
                                        </span>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={item.id} 
                                className={`spec-item ${item.isFullWidth ? 'is-full-width' : ''}`}
                                style={{ flex: item.isFullWidth ? '0 0 100%' : 1 }}
                            >
                                {/* LINE 1: ICON + VALUE */}
                                <div className="spec-icon-row">
                                    {hasIcon && (
                                        <span className="fa-icon">
                                            <SafeIcon iconSlug={item.icon} />
                                        </span>
                                    )}
                                    <span className="spec-number">
                                        {item.value}
                                    </span>
                                </div>

                                {/* LINE 2: SUBCATEGORY OR FIELD LABEL */}
                                <span className="spec-label">
                                    {item.label}
                                </span>

                                {/* LINE 3: PARENT ATTRIBUTE LABEL (FOR CATEGORY SPLIT ITEMS) */}
                                {item.parentAttribute && (
                                    <span className="spec-label" style={{ color: '#aaa', marginTop: '2px', fontWeight: '500' }}>
                                        {item.parentAttribute}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};