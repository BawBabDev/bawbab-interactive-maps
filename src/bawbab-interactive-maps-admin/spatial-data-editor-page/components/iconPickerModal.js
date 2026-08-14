import { useState, useMemo } from '@wordpress/element';
import { Modal, TextControl, Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ALL_ICON_NAMES, renderIconBySlug, LEGACY_ICON_NAMES } from '../../../constants/iconRegistry';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const renderModalIcon = (iconName) => {
    const icon = renderIconBySlug(iconName, { size: 20 });
    if (!icon) return null;

    const isLegacy = LEGACY_ICON_NAMES.includes(iconName);

    return (
        <span 
            className={`bwb-modal-icon-wrapper ${isLegacy ? 'is-legacy' : 'is-lucide'}`} 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}
        >
            {icon}
            <style>{`
                .bwb-modal-icon-wrapper.is-lucide svg {
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 2px !important;
                }
                .bwb-modal-icon-wrapper.is-legacy svg {
                    fill: currentColor !important;
                    stroke: none !important;
                    width: 20px !important;
                    height: 20px !important;
                }
            `}</style>
        </span>
    );
};

export const IconPickerModal = ({ isOpen, onClose, onSelectIcon, currentIconKey = '' }) => {
    const [search, setSearch] = useState('');

    const filteredIconNames = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) {
            return ALL_ICON_NAMES.slice(0, 100);
        }
        return ALL_ICON_NAMES.filter(name => 
            name.toLowerCase().includes(query)
        ).slice(0, 150);
    }, [search]);

    if (!isOpen) return null;

    return (
        <Modal 
            title={__('Select Field Icon', TEXT_DOMAIN)} 
            onRequestClose={onClose}
            style={{ maxWidth: '600px', width: '100%' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <TextControl
                    placeholder={__('Search icons (e.g. area, shower, Bed, Wifi, Flame)...', TEXT_DOMAIN)}
                    value={search}
                    onChange={setSearch}
                    __nextHasNoMarginBottom
                />

                <div 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                        gap: '10px', 
                        maxHeight: '320px', 
                        overflowY: 'auto',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        background: '#fafafa'
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            onSelectIcon('');
                            onClose();
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '12px 6px',
                            borderRadius: '6px',
                            border: !currentIconKey ? '2px solid #2271b1' : '1px solid #ddd',
                            background: !currentIconKey ? '#f0f6fb' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        <span style={{ fontSize: '18px', color: '#999' }}>Ø</span>
                        <span style={{ fontSize: '11px', color: '#666' }}>{__('No Icon', TEXT_DOMAIN)}</span>
                    </button>

                    {filteredIconNames.map(iconName => {
                        const isSelected = currentIconKey === iconName;

                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => {
                                    onSelectIcon(iconName);
                                    onClose();
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 4px',
                                    borderRadius: '6px',
                                    border: isSelected ? '2px solid #2271b1' : '1px solid #ddd',
                                    background: isSelected ? '#f0f6fb' : '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{ color: isSelected ? '#2271b1' : '#333', display: 'flex', alignItems: 'center', height: '20px' }}>
                                    {renderModalIcon(iconName)}
                                </span>
                                <span style={{ fontSize: '10px', color: '#555', textAlign: 'center', wordBreak: 'break-word', textTransform: 'capitalize' }}>
                                    {iconName}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <Flex justify="flex-end" style={{ marginTop: '10px' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {__('Cancel', TEXT_DOMAIN)}
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};