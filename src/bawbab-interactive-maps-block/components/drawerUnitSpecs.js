import { __ } from '@wordpress/i18n';
import { renderIconBySlug } from '../../constants/iconRegistry';
import { useAttributeSchema } from '../../bawbab-interactive-maps-admin/spatial-data-editor-page/hooks/useAttributeSchema';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const formatFieldLabel = (str) => {
    if (!str) return '';
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const UnitSpecs = ({ specs }) => {
    if (!specs) return null;

    const { schema } = useAttributeSchema();

    let customAttrs = specs.custom_attributes || {};
    if (typeof customAttrs === 'string') {
        try {
            customAttrs = JSON.parse(customAttrs);
        } catch (e) {
            customAttrs = {};
        }
    }

    const sq_ft = customAttrs.sq_ft !== undefined ? customAttrs.sq_ft : specs.sq_ft;
    const baths = customAttrs.baths !== undefined ? customAttrs.baths : specs.baths;
    const fireplace = customAttrs.fireplace !== undefined ? customAttrs.fireplace : specs.fireplace;
    const sunroom = customAttrs.sunroom !== undefined ? customAttrs.sunroom : specs.sunroom;

    const hasSqFt = sq_ft !== undefined && sq_ft !== null && sq_ft !== '';
    const hasBaths = baths !== undefined && baths !== null && baths !== '';
    const hasFireplace = fireplace !== undefined && fireplace !== null;
    const hasSunroom = sunroom !== undefined && sunroom !== null;

    const hasClassicSpecs = hasSqFt || hasBaths || hasFireplace || hasSunroom;

    const classicKeys = ['sq_ft', 'baths', 'fireplace', 'sunroom'];
    const extraAttrKeys = Object.keys(customAttrs).filter(k => !classicKeys.includes(k));

    if (!hasClassicSpecs && extraAttrKeys.length === 0) {
        return null;
    }

    // Resolve dynamic icons for baths from schema
    const bathsSchemaItem = (schema || []).find(s => s.key === 'baths');
    const bathsIconConfig = (bathsSchemaItem?.icon || 'shower,sink').split(',');
    const showerIconSlug = bathsIconConfig[0] || 'shower';
    const sinkIconSlug = bathsIconConfig[1] || 'sink';

    const valBaths = parseFloat(baths) || 0;
    const showerCount = Math.floor(valBaths);
    const sinkCount = Math.ceil(valBaths);

    return (
        <div className="location-specs-container">
            {/* CLASSIC ICON GRID */}
            {hasClassicSpecs && (
                <>
                    {hasSqFt && (
                        <div className="specs-row area-row">
                            <div className="spec-item area-item">
                                <div className="spec-icon-row">
                                    <span className="fa-icon">{renderIconBySlug('area')}</span>
                                    <span className="spec-number">{sq_ft}</span>
                                </div>
                                <span className="spec-label">{__('Area (sq ft)', TEXT_DOMAIN)}</span>
                            </div>
                        </div>
                    )}

                    {hasBaths && (
                        <div className="specs-row dual-row">
                            <div className="spec-item">
                                <div className="spec-icon-row">
                                    <span className="fa-icon">{renderIconBySlug(showerIconSlug)}</span>
                                    <span className="spec-number">{valBaths > 0 ? `x${showerCount}` : '--'}</span>
                                </div>
                                <span className="spec-label">{__('Shower', TEXT_DOMAIN)}</span>
                            </div>

                            <div className="spec-item">
                                <div className="spec-icon-row">
                                    <span className="fa-icon">{renderIconBySlug(sinkIconSlug)}</span>
                                    <span className="spec-number">{valBaths > 0 ? `x${sinkCount}` : '--'}</span>
                                </div>
                                <span className="spec-label">{__('Bathroom', TEXT_DOMAIN)}</span>
                            </div>
                        </div>
                    )}

                    {(hasFireplace || hasSunroom) && (
                        <div className="specs-row dual-row">
                            {hasFireplace && (
                                <div className={`spec-item ${!fireplace ? 'is-disabled' : ''}`}>
                                    <div className="spec-icon-row">
                                        <div className="icon-wrapper">
                                            <span className="fa-icon">{renderIconBySlug('fireplace')}</span>
                                            {!fireplace && <span className="no-sign"></span>}
                                        </div>
                                    </div>
                                    <span className="spec-label">{__('Fireplace', TEXT_DOMAIN)}</span>
                                </div>
                            )}

                            {hasSunroom && (
                                <div className={`spec-item ${!sunroom ? 'is-disabled' : ''}`}>
                                    <div className="spec-icon-row">
                                        <div className="icon-wrapper">
                                            <span className="fa-icon">{renderIconBySlug('sun')}</span>
                                            {!sunroom && <span className="no-sign"></span>}
                                        </div>
                                    </div>
                                    <span className="spec-label">{__('Sunroom', TEXT_DOMAIN)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* DYNAMIC CUSTOM ATTRIBUTE BADGES */}
            {extraAttrKeys.length > 0 && (
                <div className="generic-specs-badges" style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {extraAttrKeys.map((key) => {
                        const val = customAttrs[key];
                        if (val === null || val === undefined || val === '') return null;

                        const schemaItem = (schema || []).find(s => s.key === key);
                        const fieldLabel = schemaItem?.label || formatFieldLabel(key);
                        const iconSlug = schemaItem?.icon;
                        const iconSvg = renderIconBySlug(iconSlug);

                        const displayVal = typeof val === 'boolean' 
                            ? (val ? __('Yes', TEXT_DOMAIN) : __('No', TEXT_DOMAIN)) 
                            : String(val);

                        return (
                            <div 
                                key={key} 
                                style={{ 
                                    padding: '6px 12px', 
                                    background: '#f0f4f8', 
                                    borderRadius: '12px', 
                                    border: '1px solid #d0d7de', 
                                    fontSize: '12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {iconSvg && (
                                    <span style={{ display: 'flex', alignItems: 'center', color: '#333' }}>
                                        {iconSvg}
                                    </span>
                                )}
                                <span>
                                    <strong>{fieldLabel}:</strong> {displayVal}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};