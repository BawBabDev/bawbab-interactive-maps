import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { useCategoryManager } from '../../hooks/useCategoryManager';

const LegendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/**
 * MapLegend Component
 * Renders an expandable map legend supporting single and multi-color merged category swatches.
 */
export const MapLegend = ({ mapDimensions }) => {
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = width > 0 && (width < 800 || height < 500);

    const [isOpen, setIsOpen] = useState(true);
    const hasInitialized = useRef(false);

    const { categoryMap, legendConfig } = useCategoryManager();

    useEffect(() => {
        if (width > 0 && !hasInitialized.current) {
            if (isSmallUI) setIsOpen(false);
            hasInitialized.current = true;
        }
    }, [width, height, isSmallUI]);

    // Don't render anything if the legend is globally disabled in settings
    if (legendConfig && legendConfig.enabled === false) {
        return null;
    }

    // Process legend items based on legendConfig or fallback to active categoryMap
    const visibleLegendItems = useMemo(() => {
        // Option A: Use saved legendConfig items if configured
        if (legendConfig && Array.isArray(legendConfig.items) && legendConfig.items.length > 0) {
            return legendConfig.items
                .filter(item => item.showInLegend !== false)
                .map(item => {
                    // Resolve swatches for merged or single category items
                    const swatches = (item.categories || []).map(catSlug => {
                        return categoryMap[catSlug]?.color || '#007cba';
                    });

                    return {
                        id: item.id || item.label,
                        label: item.label,
                        swatches: swatches.length > 0 ? swatches : ['#007cba']
                    };
                });
        }

        // Option B: Fallback to all categories in categoryMap
        return Object.keys(categoryMap).map(catSlug => {
            const cat = categoryMap[catSlug] || {};
            return {
                id: catSlug,
                label: cat.label || catSlug,
                swatches: [cat.color || '#007cba']
            };
        });
    }, [categoryMap, legendConfig]);

    if (visibleLegendItems.length === 0) {
        return null;
    }

    return (
        <div 
            style={{
                position: 'absolute', 
                bottom: '20px', 
                left: '20px', 
                zIndex: 400,
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', 
                flexDirection: 'column',
                width: isOpen ? 'max-content' : '40px',
                maxHeight: isOpen ? '450px' : '40px', 
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                cursor: isOpen ? 'default' : 'pointer',
                transformOrigin: 'bottom left' 
            }}
            onClick={() => !isOpen && setIsOpen(true)}
        >
            {/* HEADER / ICON SECTION */}
            <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                minHeight: '40px',
                padding: '0 11px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {!isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <LegendIcon />
                    </div>
                ) : (
                    <>
                        <span style={{ color: '#333', fontSize: '13px', fontWeight: '800', marginLeft: '5px' }}>
                            {__('Legend', 'bawbab-interactive-maps')}
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', display: 'flex' }}
                        >
                            <CloseIcon />
                        </button>
                    </>
                )}
            </div>

            {/* CONTENT SECTION */}
            <div style={{ 
                padding: '0 16px 16px 16px', 
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isOpen ? 'auto' : 'none',
                overflowY: 'auto',
                maxHeight: '440px'
            }}>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visibleLegendItems.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Color Swatch Container (Supports Multi-Color Merged Entries) */}
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                {item.swatches.map((color, idx) => (
                                    <div
                                        key={`${item.id}-swatch-${idx}`}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            background: color,
                                            borderRadius: '3px',
                                            border: '1px solid rgba(0,0,0,0.1)'
                                        }}
                                    />
                                ))}
                            </div>
                            <span style={{ fontSize: '11px', color: '#333', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapLegend;