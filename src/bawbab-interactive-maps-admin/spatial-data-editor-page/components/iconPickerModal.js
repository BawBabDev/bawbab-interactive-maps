import { useState, useMemo } from '@wordpress/element';
import { Modal, TextControl, SelectControl, Button, Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { 
    ICON_CATEGORIES, 
    getIconsByCategory, 
    renderIconBySlug, 
    LEGACY_ICON_NAMES 
} from '../../../constants/iconRegistry';

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
    const [activeCategory, setActiveCategory] = useState('all');

    const categorySelectOptions = useMemo(() => {
        return ICON_CATEGORIES.map(cat => ({
            value: cat.id,
            label: cat.label
        }));
    }, []);

    const filteredIconNames = useMemo(() => {
        const categoryIcons = getIconsByCategory(activeCategory);
        const query = search.toLowerCase().trim();

        if (!query) {
            return categoryIcons.slice(0, 150); // Cap initial render at 150 for immediate performance
        }

        return categoryIcons.filter(name => 
            name.toLowerCase().includes(query)
        ).slice(0, 200);
    }, [search, activeCategory]);

    if (!isOpen) return null;

    return (
        <Modal 
            title={__('Select Field Icon', TEXT_DOMAIN)} 
            onRequestClose={onClose}
            style={{ maxWidth: '640px', width: '100%' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* SEARCH CONTROL + CATEGORY SELECTOR DROPDOWN SIDE-BY-SIDE */}
                <Flex gap={2} align="end">
                    <FlexItem style={{ flex: 1 }}>
                        <TextControl
                            label={__('Search Icons', TEXT_DOMAIN)}
                            placeholder={__('Search among all 1,500+ icons...', TEXT_DOMAIN)}
                            value={search}
                            onChange={setSearch}
                            style={{ height: '36px' }}
                            __nextHasNoMarginBottom
                        />
                    </FlexItem>

                    <FlexItem style={{ width: '190px' }} className="bwb-select-control-wrapper">
                        <SelectControl
                            label={__('Filter Category', TEXT_DOMAIN)}
                            value={activeCategory}
                            options={categorySelectOptions}
                            onChange={setActiveCategory}
                            style={{ height: '36px', minHeight: '36px', lineHeight: '36px', padding: '0 8px', marginTop: 0 }}
                            __nextHasNoMarginBottom
                        />
                    </FlexItem>
                </Flex>

                {/* GRID OF ICONS */}
                <div 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                        gap: '10px', 
                        maxHeight: '340px', 
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

                <Flex justify="flex-end" style={{ marginTop: '5px' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {__('Cancel', TEXT_DOMAIN)}
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};