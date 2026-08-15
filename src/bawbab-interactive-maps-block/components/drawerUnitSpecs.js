import { __ } from '@wordpress/i18n';
import { renderIconBySlug } from '../../constants/iconRegistry';
import { useAttributeSchema } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/hooks/useAttributeSchema';
import { formatDualCounter } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/utils/dualCounterHelper';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const formatFieldLabel = (str) => {
    if (!str) return '';
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
        const label = schemaItem?.label || formatFieldLabel(key);
        const fieldType = schemaItem?.type || (typeof val === 'boolean' ? 'boolean' : (isFinite(val) ? 'number' : 'text'));

        if (fieldType === 'dual_counter') {
            flushBuffer();

            const rawIcons = (schemaItem?.icon || 'shower,sink').split(',');
            const primaryIconSlug = rawIcons[0] || 'shower';
            const secondaryIconSlug = rawIcons[1] || 'sink';

            const config = schemaItem?.config || {};
            const formatted = formatDualCounter(val, {
                mode: config.mode || 'split',
                majorLabel: config.majorLabel || __('Full', TEXT_DOMAIN),
                minorLabel: config.minorLabel || __('Half', TEXT_DOMAIN),
                majorUnit: config.majorUnit || 'hr',
                minorUnit: config.minorUnit || 'min'
            });

            // Push both major and minor icons together on the exact same row line
            rows.push({
                type: 'dual',
                items: [
                    {
                        id: `${key}_major`,
                        type: 'number',
                        icon: primaryIconSlug,
                        value: formatted.majorValue,
                        label: formatted.majorLabel || label
                    },
                    {
                        id: `${key}_minor`,
                        type: 'number',
                        icon: secondaryIconSlug,
                        value: formatted.minorValue,
                        label: formatted.minorLabel || label
                    }
                ]
            });
        } else if (fieldType === 'boolean') {
            const isTrue = Boolean(val) && val !== 'false' && val !== '0';
            const defaultIcon = key === 'fireplace' ? 'fireplace' : (key === 'sunroom' ? 'sun' : 'check');

            standaloneBuffer.push({
                id: key,
                type: 'boolean',
                icon: schemaItem?.icon || defaultIcon,
                isTrue,
                label
            });

            if (standaloneBuffer.length === 2) flushBuffer();
        } else if (fieldType === 'number') {
            standaloneBuffer.push({
                id: key,
                type: 'number',
                icon: schemaItem?.icon || 'hash',
                value: isFinite(val) ? `x${val}` : val,
                label
            });

            if (standaloneBuffer.length === 2) flushBuffer();
        } else {
            standaloneBuffer.push({
                id: key,
                type: 'text',
                icon: schemaItem?.icon || 'file-text',
                value: String(val),
                label
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
                                {renderIconBySlug('area')}
                            </span>
                            <span className="spec-number">{sqFtVal}</span>
                        </div>
                        <span className="spec-label">{__('Area (sq ft)', TEXT_DOMAIN)}</span>
                    </div>
                </div>
            )}

            {/* SUBSEQUENT ROWS: PAIRED 2 PER ROW */}
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="specs-row dual-row">
                    {row.items.map((item) => {
                        const iconSvg = renderIconBySlug(item.icon);

                        if (item.type === 'boolean') {
                            return (
                                <div key={item.id} className={`spec-item ${!item.isTrue ? 'is-disabled' : ''}`}>
                                    <div className="spec-icon-row">
                                        <div className="icon-wrapper">
                                            <span className="fa-icon" style={{ color: item.isTrue ? '#333' : '#a7aaad' }}>
                                                {iconSvg}
                                            </span>
                                            {!item.isTrue && <span className="no-sign"></span>}
                                        </div>
                                    </div>
                                    <span className="spec-label">{item.label}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={item.id} className="spec-item">
                                <div className="spec-icon-row">
                                    <span className="fa-icon" style={{ color: '#333' }}>
                                        {iconSvg}
                                    </span>
                                    <span className="spec-number">{item.value}</span>
                                </div>
                                <span className="spec-label">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};