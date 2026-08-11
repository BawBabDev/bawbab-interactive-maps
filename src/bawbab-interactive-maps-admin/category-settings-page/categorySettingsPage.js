import { useState, useRef } from '@wordpress/element';
import { Button, Flex, NoticeList, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import { useCategoryManager } from './hooks/useCategoryManager';
import { CategoryGroupManager } from './components/categoryGroupManager';
import { CategoryMappingTable } from './components/categoryMappingTable';
import { MapLegendManager } from './components/mapLegendManager';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const CategorySettingsPage = () => {
    const { 
        groups, 
        setGroups, 
        categoryMap, 
        setCategoryMap, 
        legendConfig,
        setLegendConfig,
        isLoading, 
        isSaving, 
        saveCategoryData,
        cleanupUnusedCategories
    } = useCategoryManager();

    // Accordion State: Default to null so ALL panels are collapsed on page load
    const [activeAccordion, setActiveAccordion] = useState(null);

    // Individual refs for each accordion panel container
    const panelRefs = {
        groups: useRef(null),
        categories: useRef(null),
        legend: useRef(null)
    };

    const notices = useSelect((select) => select(noticesStore).getNotices(), []);
    const { removeNotice } = useDispatch(noticesStore);

    const handleToggleAccordion = (panelKey) => {
        setActiveAccordion(prev => {
            const nextState = prev === panelKey ? null : panelKey;

            if (nextState !== null) {
                // Short timeout gives React time to un-collapse the panel DOM before calculating position
                setTimeout(() => {
                    const targetEl = panelRefs[panelKey]?.current;
                    if (targetEl) {
                        // Dynamically check WordPress Admin Bar height
                        const wpAdminBar = document.getElementById('wpadminbar');
                        const adminBarHeight = wpAdminBar ? wpAdminBar.offsetHeight : 32;
                        const marginPaddingOffset = 20;

                        // Calculate absolute Y position of the target panel
                        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - adminBarHeight - marginPaddingOffset;

                        // Only scroll if the header would otherwise be cut off or obscured
                        if (window.scrollY > offsetPosition || Math.abs(window.scrollY - offsetPosition) > 10) {
                            window.scrollTo({
                                top: Math.max(0, offsetPosition),
                                behavior: 'smooth'
                            });
                        }
                    }
                }, 80);
            }

            return nextState;
        });
    };

    if (isLoading) {
        return (
            <Flex justify="center" style={{ padding: '60px' }}>
                <Spinner />
            </Flex>
        );
    }

    return (
        <div className="wrap" style={{ maxWidth: '960px', margin: '20px auto' }}>
            <NoticeList notices={notices} onRemove={removeNotice} style={{ marginBottom: '20px' }} />

            <h1 className="wp-heading-inline" style={{ marginBottom: '10px' }}>
                {__('Map Category & Navigation Settings', TEXT_DOMAIN)}
            </h1>
            <p style={{ color: '#666', marginBottom: '25px' }}>
                {__('Manage navigation groups, assign spatial categories strictly 1-to-1, and configure category colors across your map layers.', TEXT_DOMAIN)}
            </p>

            {/* PANEL 1: GROUP MANAGER */}
            <div ref={panelRefs.groups}>
                <CategoryGroupManager 
                    groups={groups} 
                    setGroups={setGroups} 
                    categoryMap={categoryMap} 
                    setCategoryMap={setCategoryMap} 
                    isOpen={activeAccordion === 'groups'}
                    onToggle={() => handleToggleAccordion('groups')}
                />
            </div>

            {/* PANEL 2: CATEGORY MAPPINGS TABLE & MODAL */}
            <div ref={panelRefs.categories}>
                <CategoryMappingTable 
                    groups={groups} 
                    categoryMap={categoryMap} 
                    setCategoryMap={setCategoryMap} 
                    isOpen={activeAccordion === 'categories'}
                    onToggle={() => handleToggleAccordion('categories')}
                />
            </div>

            {/* PANEL 3: LEGEND CUSTOMIZER & MERGING */}
            <div ref={panelRefs.legend}>
                <MapLegendManager 
                    categoryMap={categoryMap} 
                    legendConfig={legendConfig} 
                    setLegendConfig={setLegendConfig} 
                    isOpen={activeAccordion === 'legend'}
                    onToggle={() => handleToggleAccordion('legend')}
                />
            </div>

            {/* GLOBAL ACTIONS FOOTER */}
            <Flex justify="space-between" align="center" style={{ marginTop: '25px' }}>
                <Button
                    variant="secondary"
                    isDestructive
                    onClick={cleanupUnusedCategories}
                    isBusy={isSaving}
                    disabled={isSaving}
                >
                    {__('Cleanup Unused Categories', TEXT_DOMAIN)}
                </Button>

                <Button
                    variant="primary"
                    onClick={() => saveCategoryData(groups, categoryMap, legendConfig)}
                    isBusy={isSaving}
                    disabled={isSaving}
                    style={{ height: '40px', padding: '0 32px' }}
                >
                    {isSaving ? __('Saving...', TEXT_DOMAIN) : __('Save Category Settings', TEXT_DOMAIN)}
                </Button>
            </Flex>
        </div>
    );
};

export default CategorySettingsPage;