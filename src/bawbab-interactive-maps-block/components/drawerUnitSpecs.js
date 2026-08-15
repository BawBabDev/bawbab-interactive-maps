import { __ } from '@wordpress/i18n';
import { renderIconBySlug } from '../../constants/iconRegistry';
import { useAttributeSchema } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/hooks/useAttributeSchema';
import { formatDualCounter } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/utils/dualCounterHelper';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

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

    // 2. Separate Square Feet (dedicated top row)
    const sqFtVal = rawAttrs.sq_ft;
    const hasSqFt = activeKeys.includes('sq_ft');
    const otherKeys = activeKeys.filter(k => k !== 'sq_ft');

    // 3. Build rows
    const rows = [];
    let standaloneBuffer = [];

    const flushBuffer = () => {
        if (standaloneBuffer.length > 0) {
            rows.push({ type: 'dual', items: [...standaloneBuffer] });
            standaloneBuffer = [];
        }
    };

    otherKeys.forEach((key) => {
        const val = rawAttrs[key];
        const schemaItem = schema.find(s => s.key === key);
        const attributeName = schemaItem?.label || formatFieldLabel(key);
        const fieldType = schemaItem?.type || (typeof val === 'boolean' ? 'boolean' : (isFinite(val) ? 'number' : 'text'));

        if (fieldType === 'dual_counter') {
            const rawIcons = (schemaItem?.icon || '').split(',');
            const primaryIconSlug = rawIcons[0] || '';
            const secondaryIconSlug = rawIcons[1] || '';

            const config = schemaItem?.config || {};
            const mode = config.mode || 'split';

            // Resolve explicit subcategory / unit designations set by user in AttributeConfigModal
            let majorSubcategory = config.majorLabel;
            let minorSubcategory = config.minorLabel;

            if (!majorSubcategory) {
                if (key === 'baths') {
                    majorSubcategory = __('Shower', TEXT_DOMAIN);
                } else if (mode === 'time') {
                    majorSubcategory = __('hr', TEXT_DOMAIN);
                } else if (mode === 'measurement') {
                    majorSubcategory = __('ft', TEXT_DOMAIN);
                } else {
                    majorSubcategory = __('Major', TEXT_DOMAIN);
                }
            }

            if (!minorSubcategory) {
                if (key === 'baths') {
                    minorSubcategory = __('Bathroom', TEXT_DOMAIN);
                } else if (mode === 'time') {
                    minorSubcategory = __('min', TEXT_DOMAIN);
                } else if (mode === 'measurement') {
                    minorSubcategory = __('in', TEXT_DOMAIN);
                } else {
                    minorSubcategory = __('Minor', TEXT_DOMAIN);
                }
            }

            const formatted = formatDualCounter(val, {
                mode,
                mainUnit: config.mainUnit,
                majorLabel: majorSubcategory,
                minorLabel: minorSubcategory,
            });

            // TIME & MEASUREMENT: Single icon, compact single-line text display using selected units
            if (mode === 'time' || mode === 'measurement') {
                standaloneBuffer.push({
                    id: key,
                    type: 'text',
                    icon: primaryIconSlug,
                    value: formatted.displayText || String(val),
                    label: attributeName
                });

                if (standaloneBuffer.length === 2) flushBuffer();
            } else {
                // CATEGORY SPLIT: 2 icons, 2 subcategories, parent attribute label repeated below each
                flushBuffer();

                rows.push({
                    type: 'dual',
                    items: [
                        {
                            id: `${key}_major`,
                            type: 'number',
                            icon: primaryIconSlug,
                            value: formatted.majorValue !== undefined && formatted.majorValue !== null ? formatted.majorValue : '--',
                            label: majorSubcategory,
                            parentAttribute: attributeName
                        },
                        {
                            id: `${key}_minor`,
                            type: 'number',
                            icon: secondaryIconSlug,
                            value: formatted.minorValue !== undefined && formatted.minorValue !== null ? formatted.minorValue : '--',
                            label: minorSubcategory,
                            parentAttribute: attributeName
                        }
                    ]
                });
            }
        } else if (fieldType === 'boolean') {
            const isTrue = Boolean(val) && val !== 'false' && val !== '0';
            const defaultIcon = key === 'fireplace' ? 'fireplace' : (key === 'sunroom' ? 'sun' : 'check');

            standaloneBuffer.push({
                id: key,
                type: 'boolean',
                icon: schemaItem?.icon !== undefined ? schemaItem.icon : defaultIcon,
                isTrue,
                label: attributeName
            });

            if (standaloneBuffer.length === 2) flushBuffer();
        } else if (fieldType === 'number') {
            standaloneBuffer.push({
                id: key,
                type: 'number',
                icon: schemaItem?.icon || '',
                value: isFinite(val) ? `x${val}` : val,
                label: attributeName
            });

            if (standaloneBuffer.length === 2) flushBuffer();
        } else {
            standaloneBuffer.push({
                id: key,
                type: 'text',
                icon: schemaItem?.icon || '',
                value: String(val),
                label: attributeName
            });

            if (standaloneBuffer.length === 2) flushBuffer();
        }
    });

    flushBuffer();

    return (
        <div className="location-specs-container">
            {/* ROW 1: SQUARE FEET */}
            {hasSqFt && (
                <div className="specs-row area-row">
                    <div className="spec-item area-item">
                        <div className="spec-icon-row">
                            <span className="fa-icon" style={{ color: '#333' }}>
                                <SafeIcon iconSlug="area" />
                            </span>
                            <span className="spec-number">{sqFtVal}</span>
                        </div>
                        <span className="spec-label">{__('Area (sq ft)', TEXT_DOMAIN)}</span>
                    </div>
                </div>
            )}

            {/* SUBSEQUENT ROWS */}
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="specs-row dual-row">
                    {row.items.map((item) => {
                        const hasIcon = Boolean(item.icon);

                        if (item.type === 'boolean') {
                            return (
                                <div key={item.id} className={`spec-item ${!item.isTrue ? 'is-disabled' : ''}`}>
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
                                </div>
                            );
                        }

                        return (
                            <div key={item.id} className="spec-item">
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