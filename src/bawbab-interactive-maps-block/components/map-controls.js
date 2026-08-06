import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { Icon } from '@iconify/react';

const LegendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>
);
const LayersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const FloorIcon = () => (
    <Icon
        icon="bi:building-fill-add"
        width="22"
        height="22"
        aria-hidden="true"
        style={{
            color: '#1f2a44',
            filter: 'drop-shadow(0 1px 0 #fff) drop-shadow(0 0 1px rgba(0,0,0,0.35))',
        }}
    />
);

export const MapLegend = ({ mapDimensions }) => {
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = width > 0 && (width < 800 || height < 500);
    
    const [isOpen, setIsOpen] = useState(true);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (width > 0 && !hasInitialized.current) {
            if (isSmallUI) setIsOpen(false);
            hasInitialized.current = true;
        }
    }, [width, height, isSmallUI]);

    const legendItems = [
        { label: 'Residential Apartments', color: '#d70f4f' },
        { label: 'Cottages', color: '#d776e9' },
        { label: 'Community Center', color: '#ed8401' },
        { label: 'Personal Care', color: '#f6e395' },
        { label: 'Skilled Care', color: '#ede370' },
        { label: 'Amenities', color: '#48dad0' },
        { label: 'Fitness Center', color: '#6ab6ea' },
        { label: 'Utilities', color: '#0f73d7' },
        { label: 'Carport / Garage / Support', color: '#ce6787' },
        { label: 'Pathways / Patios', color: '#ddebaf' },
        { label: 'Trail', color: '#7c4e1c' },
        { label: 'Indoor / Covered Pathways', colors: ['#e39cb2', '#feba67', '#ede79f'] },
    ];

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
                maxHeight: isOpen ? '500px' : '40px', 
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
                justifyContent: 'space-between', 
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
                            {__('Legend', 'foulkeways')}
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
                pointerEvents: isOpen ? 'auto' : 'none'
            }}>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {legendItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                {(item.colors || [item.color]).map((swatchColor, swatchIdx) => (
                                    <div
                                        key={`${idx}-${swatchIdx}`}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            background: swatchColor,
                                            borderRadius: '3px',
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

export const LayerToggler = ({ visibleLayers, layerOpacity, onToggle, onOpacityChange, mapDimensions }) => {
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = width > 0 && (width < 800 || height < 500);

    // CLOSED BY DEFAULT ON ALL SCREEN SIZES
    const [isOpen, setIsOpen] = useState(false);

    // Layers that should NOT show an opacity slider
    const noOpacityLayers = ['parcels', 'labels', 'markers'];

    return (
        <div 
            style={{
                position: 'absolute', top: '20px', right: '20px', zIndex: 400,
                background: 'rgba(255, 255, 255, 0.98)',
                padding: isOpen ? '16px' : '0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', gap: '12px',
                width: isOpen ? (isSmallUI ? '150px' : '180px') : '40px',
                height: isOpen ? 'auto' : '40px',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                cursor: isOpen ? 'default' : 'pointer',
                transformOrigin: 'top right'
            }}
            onClick={() => !isOpen && setIsOpen(true)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: isOpen ? 'auto' : '40px', padding: isOpen ? '0' : '11px' }}>
                {!isOpen ? <LayersIcon /> : (
                    <>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#333' }}>{__('Layers', 'foulkeways')}</span>
                        <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', display: 'flex' }}>
                            <CloseIcon />
                        </button>
                    </>
                )}
            </div>

            {isOpen && Object.keys(visibleLayers).map(layer => (
                <div key={layer} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div 
                        onClick={() => onToggle(layer)} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', textTransform: 'capitalize', color: '#000', fontWeight: '600', margin: 0 }}
                    >
                        <div className={`cb-wrapper ${visibleLayers[layer] ? 'is-checked' : ''}`}>
                             <svg className="cb-tick" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        </div>
                        <span>{layer.replace('_', ' ')}</span>
                    </div>

                    {/* Only show opacity slider if layer is visible AND not in the excluded list */}
                    {visibleLayers[layer] && !noOpacityLayers.includes(layer) && (
                        <input 
                            type="range" className="subtle-slider"
                            min="0" max="1" step="0.1"
                            value={layerOpacity[layer] ?? 0.5}
                            onChange={(e) => onOpacityChange(layer, parseFloat(e.target.value))}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

const floorLabel = (value) => {
    if (value === 0) return 'G';
    if (value > 0) return `+${value}`;
    return `${value}`;
};

export const FloorSwitcher = ({ mapDimensions, activeFloor = 0, onFloorChange, availableFloors = [0] }) => {
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = width > 0 && (width < 800 || height < 500);

    const [isOpen, setIsOpen] = useState(true);
    const hasInitialized = useRef(false);
    const activeRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (width > 0 && !hasInitialized.current) {
            if (isSmallUI) setIsOpen(false);
            hasInitialized.current = true;
        }
    }, [width, height, isSmallUI]);

    useEffect(() => {
        if (isOpen && activeRef.current && activeRef.current.parentElement) {
            const container = activeRef.current.parentElement;
            const target = activeRef.current;

            // Scroll ONLY the floor stack container
            container.scrollTo({
                top: target.offsetTop - container.offsetTop,
                behavior: 'smooth'
            });
        }
    }, [isOpen, activeFloor]);

    // Sort floors top-to-bottom: highest first
    const sortedFloors = [...availableFloors].sort((a, b) => b - a);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            if (!isOpen) return;
            e.preventDefault();
            e.stopPropagation();
            const direction = e.deltaY < 0 ? 1 : -1;
            const currentIndex = sortedFloors.indexOf(activeFloor);
            const nextIndex = currentIndex - direction;
            if (nextIndex >= 0 && nextIndex < sortedFloors.length) {
                onFloorChange(sortedFloors[nextIndex]);
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isOpen, sortedFloors, activeFloor, onFloorChange]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                bottom: '24px',
                right: isSmallUI ? '66px' : '74px',
                zIndex: 390,
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                width: isOpen ? '52px' : '40px',
                maxHeight: isOpen ? '320px' : '40px',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                cursor: isOpen ? 'default' : 'pointer',
                transformOrigin: 'bottom right'
            }}
            onClick={() => !isOpen && setIsOpen(true)}
        >
            {/* Header icon / close button */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '40px',
                flexShrink: 0,
            }}>
                {!isOpen ? (
                    <FloorIcon />
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        title={__('Close floor selector', 'foulkeways')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            {/* Floor stack - scrollable */}
            {isOpen && (
                <div style={{
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '0 6px 8px',
                    scrollbarWidth: 'none',
                }}>
                    {sortedFloors.map((floorValue) => {
                        const isActive = activeFloor === floorValue;
                        const isGround = floorValue === 0;
                        return (
                            <button
                                key={floorValue}
                                ref={isActive ? activeRef : null}
                                onClick={() => onFloorChange(floorValue)}
                                title={isGround ? __('Ground floor', 'foulkeways') : floorValue > 0 ? `${__('Floor', 'foulkeways')} +${floorValue}` : `${__('Basement', 'foulkeways')} ${floorValue}`}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    border: isActive ? '2px solid #1f5faa' : '1px solid #e0e0e0',
                                    background: isActive ? '#1f5faa' : isGround ? '#f5f5f5' : '#fff',
                                    color: isActive ? '#fff' : '#333',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {floorLabel(floorValue)}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};