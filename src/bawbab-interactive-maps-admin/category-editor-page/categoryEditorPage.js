/**
 * CategoryEditorPage Component
 * Tabbed interface for managing groups, category mappings, and map legends with dirty-state and confirmation modals.
 *
 * File: src/components/categoryEditorPage.jsx
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, Flex, NoticeList, Spinner, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import { useCategoryManager } from './hooks/useCategoryManager';
import { CategoryGroupManager } from './components/categoryGroupManager';
import { CategoryMappingTable } from './components/categoryMappingTable';
import { MapLegendManager } from './components/mapLegendManager';
import { ConfirmModal, CancelModal } from '../confirmModal';

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

    // Baseline snapshot for dirty-state detection
    const initialSnapshotRef = useRef( null );
    const [ isDirty, setIsDirty ] = useState( false );

    // Modal Visibility States
    const [ showSaveModal, setShowSaveModal ] = useState( false );
    const [ showCancelModal, setShowCancelModal ] = useState( false );
    const [ showCleanupModal, setShowCleanupModal ] = useState( false );

    const notices = useSelect(
        ( select ) => select( noticesStore ).getNotices(),
        []
    );
    const { removeNotice } = useDispatch( noticesStore );

    // Capture initial state snapshot once loading finishes
    useEffect( () => {
        if ( ! isLoading && initialSnapshotRef.current === null ) {
            initialSnapshotRef.current = JSON.stringify( {
                groups,
                categoryMap,
                legendConfig,
            } );
        }
    }, [ isLoading, groups, categoryMap, legendConfig ] );

    // Evaluate dirty state whenever form state updates
    useEffect( () => {
        if ( initialSnapshotRef.current !== null ) {
            const currentSnapshot = JSON.stringify( {
                groups,
                categoryMap,
                legendConfig,
            } );
            setIsDirty( currentSnapshot !== initialSnapshotRef.current );
        }
    }, [ groups, categoryMap, legendConfig ] );

    const handleConfirmSave = async () => {
        setShowSaveModal( false );
        const success = await saveCategoryData( groups, categoryMap, legendConfig );
        if ( success ) {
            initialSnapshotRef.current = JSON.stringify( {
                groups,
                categoryMap,
                legendConfig,
            } );
            setIsDirty( false );
        }
    };

    const handleConfirmDiscard = () => {
        setShowCancelModal( false );
        if ( initialSnapshotRef.current !== null ) {
            const baseline = JSON.parse( initialSnapshotRef.current );
            setGroups( baseline.groups );
            setCategoryMap( baseline.categoryMap );
            setLegendConfig( baseline.legendConfig );
            setIsDirty( false );
        }
    };

    const handleConfirmCleanup = async () => {
        setShowCleanupModal( false );
        const success = await cleanupUnusedCategories();
        if ( success ) {
            initialSnapshotRef.current = JSON.stringify( {
                groups,
                categoryMap,
                legendConfig,
            } );
            setIsDirty( false );
        }
    };

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
                                />
                            ) }

                            { activeTab.name === 'categories' && (
                                <CategoryMappingTable
                                    groups={ groups }
                                    categoryMap={ categoryMap }
                                    setCategoryMap={ setCategoryMap }
                                />
                            ) }

                            { activeTab.name === 'legend' && (
                                <MapLegendManager
                                    categoryMap={ categoryMap }
                                    legendConfig={ legendConfig }
                                    setLegendConfig={ setLegendConfig }
                                />
                            ) }
                        </div>
                    ) }
                </TabPanel>
            </div>

            { /* GLOBAL ACTIONS FOOTER CONTAINER */ }
            <div
                style={ {
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '16px 20px',
                    marginTop: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    boxSizing: 'border-box',
                } }
            >
                { /* LEFT: CLEANUP BUTTON */ }
                <div>
                    <Button
                        variant="secondary"
                        isDestructive
                        onClick={ () => setShowCleanupModal( true ) }
                        isBusy={ isSaving }
                        disabled={ isSaving }
                        style={ {
                            height: '40px',
                            padding: '0 20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                        } }
                    >
                        { __( 'Cleanup Unused Categories', TEXT_DOMAIN ) }
                    </Button>
                </div>

                { /* RIGHT: DISCARD CHANGES & SAVE SETTINGS */ }
                <div
                    style={ {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    } }
                >
                    <Button
                        variant="secondary"
                        onClick={ () => setShowCancelModal( true ) }
                        disabled={ ! isDirty || isSaving }
                        style={ {
                            height: '40px',
                            padding: '0 20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            opacity: isDirty ? 1 : 0.4,
                            cursor: isDirty ? 'pointer' : 'default',
                            pointerEvents: isDirty ? 'auto' : 'none',
                        } }
                    >
                        { __( 'Discard Changes', TEXT_DOMAIN ) }
                    </Button>

                    <Button
                        variant="primary"
                        onClick={ () => setShowSaveModal( true ) }
                        isBusy={ isSaving }
                        disabled={ ! isDirty || isSaving }
                        style={ {
                            height: '40px',
                            padding: '0 32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            opacity: isDirty ? 1 : 0.4,
                            cursor: isDirty ? 'pointer' : 'default',
                            pointerEvents: isDirty ? 'auto' : 'none',
                        } }
                    >
                        { isSaving
                            ? __( 'Saving...', TEXT_DOMAIN )
                            : __( 'Save Category Settings', TEXT_DOMAIN ) }
                    </Button>
                </div>
            </div>

            { /* MODAL: CONFIRM SAVE */ }
            <ConfirmModal
                isOpen={ showSaveModal }
                title={ __( 'Save Category Settings', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to save all navigation group, category mapping, and map legend modifications?',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Save Changes', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmSave }
                onCancel={ () => setShowSaveModal( false ) }
                isBusy={ isSaving }
            />

            { /* MODAL: DISCARD CHANGES */ }
            <CancelModal
                isOpen={ showCancelModal }
                title={ __( 'Discard Category Modifications?', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to discard your changes? All unsaved edits will be reverted back to the last saved configuration.',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Discard Changes', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmDiscard }
                onCancel={ () => setShowCancelModal( false ) }
            />

            { /* MODAL: CONFIRM CLEANUP */ }
            <ConfirmModal
                isOpen={ showCleanupModal }
                title={ __( 'Cleanup Unused Categories', TEXT_DOMAIN ) }
                message={ __(
                    'Warning: Running schema cleanup will prune all category mappings and legend configurations associated with spatial data that no longer exists in MySQL. Proceed?',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Run Cleanup', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmCleanup }
                onCancel={ () => setShowCleanupModal( false ) }
                isBusy={ isSaving }
            />
        </div>
    );
};

export default CategoryEditorPage;