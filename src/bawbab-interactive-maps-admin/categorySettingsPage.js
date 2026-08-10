import { useState, useEffect } from '@wordpress/element';
import { 
    Panel, PanelBody, Button, TextControl, SelectControl, CheckboxControl, 
    Flex, NoticeList, Spinner, ColorPicker, Dropdown, __experimentalText as Text 
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

// Default preset configuration matching Foulkeways out of the box
const DEFAULT_CATEGORY_CONFIG = {
    tabs: [
        {
            id: 'apartments',
            title: 'Apartments',
            displayType: 'grouped',
            categories: ['residential_apartment']
        },
        {
            id: 'cottages',
            title: 'Cottages',
            displayType: 'grouped',
            categories: ['cottage']
        },
        {
            id: 'amenities',
            title: 'Amenities',
            displayType: 'flat',
            categories: ['amenity', 'community_center', 'personal_care', 'skilled_care', 'fitness_center', 'utilities']
        }
    ],
    categoryColors: {
        residential_apartment: '#1565c0',
        cottage: '#2e7d32',
        community_center: '#007cba',
        personal_care: '#f57c00',
        skilled_care: '#d84315',
        fitness_center: '#00838f',
        amenity: '#8d6e63'
    }
};

export const CategorySettingsPage = () => {
    const [categoryConfig, setCategoryConfig] = useState(DEFAULT_CATEGORY_CONFIG);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
    const notices = useSelect( ( select ) => select( noticesStore ).getNotices(), [] );
    const { removeNotice } = useDispatch( noticesStore );

    // Fetch existing spatial data categories and current options on mount
    useEffect(() => {
        const loadSettingsAndCategories = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch saved WP settings options
                const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
                const savedData = settingsRes?.bwb_imaps_options_data;

                if (savedData?.categoryConfig) {
                    setCategoryConfig(savedData.categoryConfig);
                }

                // 2. Fetch spatial features to discover all categories in the database
                const spatialRes = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-spatial-data');
                const spatialData = await spatialRes.json();
                
                if (spatialData?.features) {
                    const uniqueCats = new Set();
                    spatialData.features.forEach(f => {
                        if (f.properties?.category) {
                            uniqueCats.add(f.properties.category);
                        }
                    });
                    setAvailableCategories(Array.from(uniqueCats));
                }
            } catch (err) {
                console.error("Error loading category settings:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettingsAndCategories();
    }, []);

    // Save category configuration back to WordPress options
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsRes = await apiFetch({ path: '/wp/v2/settings' });
            const currentOptions = settingsRes?.bwb_imaps_options_data || {};

            await apiFetch({
                path: '/wp/v2/settings',
                method: 'POST',
                data: {
                    bwb_imaps_options_data: {
                        ...currentOptions,
                        categoryConfig
                    }
                }
            });

            if (!window.bwbimapsSettings) window.bwbimapsSettings = {};
            window.bwbimapsSettings.categoryConfig = categoryConfig;
            window.bwbimapsSettings.categoryColors = categoryConfig.categoryColors || {};

            createSuccessNotice(__('Category & Navigation settings saved successfully!', TEXT_DOMAIN), {
                type: 'snackbar'
            });
        } catch (err) {
            createErrorNotice(__('Error saving category settings: ', TEXT_DOMAIN) + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Tab Management
    const addTab = () => {
        const newId = `tab_${Date.now()}`;
        setCategoryConfig(prev => ({
            ...prev,
            tabs: [
                ...prev.tabs,
                { id: newId, title: 'New Group', displayType: 'flat', categories: [] }
            ]
        }));
    };

    const removeTab = (index) => {
        setCategoryConfig(prev => ({
            ...prev,
            tabs: prev.tabs.filter((_, i) => i !== index)
        }));
    };

    const updateTab = (index, key, value) => {
        setCategoryConfig(prev => {
            const newTabs = [...prev.tabs];
            newTabs[index] = { ...newTabs[index], [key]: value };
            return { ...prev, tabs: newTabs };
        });
    };

    const toggleCategoryInTab = (tabIndex, catSlug) => {
        setCategoryConfig(prev => {
            const newTabs = [...prev.tabs];
            const currentCats = newTabs[tabIndex].categories || [];
            
            const updatedCats = currentCats.includes(catSlug)
                ? currentCats.filter(c => c !== catSlug)
                : [...currentCats, catSlug];

            newTabs[tabIndex] = { ...newTabs[tabIndex], categories: updatedCats };
            return { ...prev, tabs: newTabs };
        });
    };

    // Category Color Management
    const updateCategoryColor = (catSlug, hexColor) => {
        setCategoryConfig(prev => ({
            ...prev,
            categoryColors: {
                ...(prev.categoryColors || {}),
                [catSlug]: hexColor
            }
        }));
    };

    if (isLoading) {
        return (
            <Flex justify="center" style={{ padding: '60px' }}>
                <Spinner />
            </Flex>
        );
    }

    return (
        <div className="wrap" style={{ maxWidth: '900px', margin: '20px auto' }}>
            <NoticeList notices={notices} onRemove={removeNotice} style={{ marginBottom: '20px' }} />

            <h1 className="wp-heading-inline" style={{ marginBottom: '10px' }}>
                {__('Map Category & Navigation Settings', TEXT_DOMAIN)}
            </h1>
            <p style={{ color: '#666', marginBottom: '25px' }}>
                {__('Configure top-level navigation tabs, assign spatial categories to tabs, and customize fill colors for each category.', TEXT_DOMAIN)}
            </p>

            {/* TAB CONFIGURATION SECTION */}
            <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '30px' }}>
                <PanelBody title={__('Navigation Menu Tabs Configuration', TEXT_DOMAIN)} initialOpen={true}>
                    {categoryConfig.tabs.map((tab, tabIdx) => (
                        <div key={tab.id} style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                            <Flex align="center" justify="space-between" style={{ marginBottom: '12px' }}>
                                <Text variant="title.small" style={{ fontWeight: '600' }}>
                                    {sprintf(__('Tab #%d: %s', TEXT_DOMAIN), tabIdx + 1, tab.title)}
                                </Text>
                                <Button isDestructive isSmall icon="trash" onClick={() => removeTab(tabIdx)} label={__('Remove Tab', TEXT_DOMAIN)} />
                            </Flex>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <TextControl
                                    label={__('Tab Title', TEXT_DOMAIN)}
                                    value={tab.title}
                                    onChange={(val) => updateTab(tabIdx, 'title', val)}
                                />
                                <SelectControl
                                    label={__('Display Layout Type', TEXT_DOMAIN)}
                                    value={tab.displayType}
                                    options={[
                                        { label: __('Nested Accordion (Grouped by Name)', TEXT_DOMAIN), value: 'grouped' },
                                        { label: __('Flat List (Single Items & Pins)', TEXT_DOMAIN), value: 'flat' }
                                    ]}
                                    onChange={(val) => updateTab(tabIdx, 'displayType', val)}
                                />
                            </div>

                            <Text variant="label" display="block" style={{ fontWeight: '600', marginBottom: '8px' }}>
                                {__('Assigned Spatial Categories:', TEXT_DOMAIN)}
                            </Text>

                            {/* FLEX LAYOUT WITH MULTI-LINE WRAPPING */}
                            <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '12px', 
                                background: '#fff', 
                                padding: '12px', 
                                borderRadius: '4px', 
                                border: '1px solid #eee' 
                            }}>
                                {availableCategories.length === 0 ? (
                                    <Text variant="caption" style={{ color: '#888' }}>
                                        {__('No categories found in spatial data. Import features first to assign categories.', TEXT_DOMAIN)}
                                    </Text>
                                ) : (
                                    availableCategories.map(catSlug => (
                                        <div 
                                            key={catSlug} 
                                            style={{ 
                                                flex: '0 0 calc(33.333% - 8px)', 
                                                minWidth: '180px',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            <CheckboxControl
                                                label={catSlug}
                                                checked={(tab.categories || []).includes(catSlug)}
                                                onChange={() => toggleCategoryInTab(tabIdx, catSlug)}
                                                __nextHasNoMarginBottom
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}

                    <Button variant="secondary" icon="plus-alt" onClick={addTab} style={{ marginTop: '10px' }}>
                        {__('Add New Navigation Tab', TEXT_DOMAIN)}
                    </Button>
                </PanelBody>
            </Panel>

            {/* CATEGORY COLOR MANAGEMENT SECTION WITH COLOR PICKER */}
            <Panel style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '30px' }}>
                <PanelBody title={__('Category Map Fill Colors', TEXT_DOMAIN)} initialOpen={true}>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                        {__('Customize fill colors for each category. Click the color swatch to open the color picker.', TEXT_DOMAIN)}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                        {availableCategories.map(catSlug => {
                            const currentColor = (categoryConfig.categoryColors || {})[catSlug] || '#007cba';

                            return (
                                <div key={catSlug} style={{ padding: '12px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                    <Flex align="center" justify="space-between" style={{ marginBottom: '8px' }}>
                                        <Text style={{ fontWeight: '600', fontSize: '12px' }}>{catSlug}</Text>
                                        
                                        {/* DROPDOWN COLOR PICKER SWATCH */}
                                        <Dropdown
                                            renderToggle={({ isOpen, onToggle }) => (
                                                <Button
                                                    onClick={onToggle}
                                                    aria-expanded={isOpen}
                                                    style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        minWidth: '24px',
                                                        padding: 0,
                                                        borderRadius: '4px',
                                                        background: currentColor,
                                                        border: '2px solid #fff',
                                                        boxShadow: '0 0 0 1px #ccc',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            )}
                                            renderContent={() => (
                                                <div style={{ padding: '10px' }}>
                                                    <ColorPicker
                                                        color={currentColor}
                                                        onChangeComplete={(val) => updateCategoryColor(catSlug, val.hex)}
                                                        disableAlpha
                                                    />
                                                </div>
                                            )}
                                        />
                                    </Flex>
                                    
                                    <TextControl
                                        value={currentColor}
                                        onChange={(val) => updateCategoryColor(catSlug, val)}
                                        placeholder="#007cba"
                                        __nextHasNoMarginBottom
                                    />
                                </div>
                            );
                        })}
                    </div>
                </PanelBody>
            </Panel>

            {/* SAVE BUTTON */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    isBusy={isSaving} 
                    disabled={isSaving}
                    style={{ height: '40px', padding: '0 30px' }}
                >
                    {isSaving ? __('Saving...', TEXT_DOMAIN) : __('Save Category Settings', TEXT_DOMAIN)}
                </Button>
            </div>
        </div>
    );
};

export default CategorySettingsPage;