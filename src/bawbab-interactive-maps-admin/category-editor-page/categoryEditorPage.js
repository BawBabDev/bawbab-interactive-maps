import { useState } from '@wordpress/element';
import { Button, Flex, NoticeList, Spinner, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import { useCategoryManager } from './hooks/useCategoryManager';
import { CategoryGroupManager } from './components/categoryGroupManager';
import { CategoryMappingTable } from './components/categoryMappingTable';
import { MapLegendManager } from './components/mapLegendManager';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const CategoryEditorPage = () => {
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
        cleanupUnusedCategories,
    } = useCategoryManager();

    const notices = useSelect(
        ( select ) => select( noticesStore ).getNotices(),
        []
    );
    const { removeNotice } = useDispatch( noticesStore );

    if ( isLoading ) {
        return (
            <Flex justify="center" style={ { padding: '60px' } }>
                <Spinner />
            </Flex>
        );
    }

    const tabs = [
        {
            name: 'groups',
            title: __( 'Navigation Groups', TEXT_DOMAIN ),
            className: 'category-tab-groups',
        },
        {
            name: 'categories',
            title: __( 'Category Mappings & Colors', TEXT_DOMAIN ),
            className: 'category-tab-mappings',
        },
        {
            name: 'legend',
            title: __( 'Map Legend Customizer', TEXT_DOMAIN ),
            className: 'category-tab-legend',
        },
    ];

    return (
        <div
            className="wrap"
            style={ { maxWidth: '960px', margin: '20px auto' } }
        >
            <NoticeList
                notices={ notices }
                onRemove={ removeNotice }
                style={ { marginBottom: '20px' } }
            />

            <h1
                className="wp-heading-inline"
                style={ { marginBottom: '10px' } }
            >
                { __( 'Edit Categories & Navigation', TEXT_DOMAIN ) }
            </h1>
            <p style={ { color: '#666', marginBottom: '20px' } }>
                { __(
                    'Manage navigation groups, assign spatial categories strictly 1-to-1, and configure category colors across your map layers.',
                    TEXT_DOMAIN
                ) }
            </p>

            { /* TABBED INTERFACE CONTAINER */ }
            <div
                style={ {
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '20px',
                    marginBottom: '20px',
                } }
            >
                <TabPanel
                    className="category-editor-tab-panel"
                    activeClass="is-active"
                    tabs={ tabs }
                >
                    { ( activeTab ) => (
                        <div style={ { paddingTop: '20px' } }>
                            { activeTab.name === 'groups' && (
                                <CategoryGroupManager
                                    groups={ groups }
                                    setGroups={ setGroups }
                                    categoryMap={ categoryMap }
                                    setCategoryMap={ setCategoryMap }
                                    isOpen={ true }
                                    onToggle={ () => {} }
                                />
                            ) }

                            { activeTab.name === 'categories' && (
                                <CategoryMappingTable
                                    groups={ groups }
                                    categoryMap={ categoryMap }
                                    setCategoryMap={ setCategoryMap }
                                    isOpen={ true }
                                    onToggle={ () => {} }
                                />
                            ) }

                            { activeTab.name === 'legend' && (
                                <MapLegendManager
                                    categoryMap={ categoryMap }
                                    legendConfig={ legendConfig }
                                    setLegendConfig={ setLegendConfig }
                                    isOpen={ true }
                                    onToggle={ () => {} }
                                />
                            ) }
                        </div>
                    ) }
                </TabPanel>
            </div>

            { /* GLOBAL ACTIONS FOOTER */ }
            <Flex
                justify="space-between"
                align="center"
                style={ { marginTop: '20px' } }
            >
                <Button
                    variant="secondary"
                    isDestructive
                    onClick={ cleanupUnusedCategories }
                    isBusy={ isSaving }
                    disabled={ isSaving }
                >
                    { __( 'Cleanup Unused Categories', TEXT_DOMAIN ) }
                </Button>

                <Button
                    variant="primary"
                    onClick={ () =>
                        saveCategoryData( groups, categoryMap, legendConfig )
                    }
                    isBusy={ isSaving }
                    disabled={ isSaving }
                    style={ { height: '40px', padding: '0 32px' } }
                >
                    { isSaving
                        ? __( 'Saving...', TEXT_DOMAIN )
                        : __( 'Save Category Settings', TEXT_DOMAIN ) }
                </Button>
            </Flex>
        </div>
    );
};

export default CategoryEditorPage;