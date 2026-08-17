/**
 * CategoryEditorPage Component
 * Refactored with a vertical tab sidebar, full-width content workspace,
 * fixed viewport scroll container, and pinned bottom action footer.
 *
 * File: src/components/categoryEditorPage.jsx
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, Flex, NoticeList, Spinner, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import { useCategoryManager } from './hooks/useCategoryManager';
import { CategoryGroupManager } from './components/categoryGroupManager';
import { CategoryMappingTable } from './components/categoryMappingTable';
import { MapLegendManager } from './components/mapLegendManager';
import { ConfirmModal, CancelModal } from '../modals/confirmModal';

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

    // Active Navigation Tab ('groups', 'categories', or 'legend')
    const [ activeNavTab, setActiveNavTab ] = useState( 'groups' );

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

    const navTabs = [
        {
            id: 'groups',
            label: __( 'Group Editor', TEXT_DOMAIN ),
            icon: 'category',
        },
        {
            id: 'categories',
            label: __( 'Category Editor', TEXT_DOMAIN ),
            icon: 'filter',
        },
        {
            id: 'legend',
            label: __( 'Legend Editor', TEXT_DOMAIN ),
            icon: 'list-view',
        },
    ];

    return (
        <div
            className="wrap"
            style={ {
                height: 'calc(100vh - 65px)',
                maxHeight: 'calc(100vh - 65px)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                marginRight: '15px',
                marginLeft: '15px',
                marginBottom: '15px',
                overflow: 'hidden',
            } }
        >
            { /* HIDE WP FOOTER AND LOCK WINDOW FROM SCROLLING */ }
            <style>{ `
                #wpfooter { display: none !important; }
                #wpbody-content { padding-bottom: 0 !important; }
                html, body { overflow: hidden !important; }
            ` }</style>

            <NoticeList
                notices={ notices }
                onRemove={ removeNotice }
                style={ { marginBottom: '8px', flexShrink: 0 } }
            />

            { /* PAGE TITLE HEADER */ }
            <div style={ { flexShrink: 0 } }>
                <h1
                    className="wp-heading-inline"
                    style={ { marginBottom: '8px' } }
                >
                    { __( 'Edit Categories & Navigation', TEXT_DOMAIN ) }
                </h1>
                <hr className="wp-header-end" />
            </div>

            { /* MAIN WORKSPACE CONTAINER PANEL */ }
            <div
                style={ {
                    marginTop: '8px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'row',
                } }
            >
                { /* FAR LEFT VERTICAL NAVIGATION SIDEBAR (100PX FIXED WIDTH) */ }
                <div
                    style={ {
                        width: '100px',
                        flex: '0 0 100px',
                        borderRight: '1px solid #e0e0e0',
                        background: '#fcfcfc',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                    } }
                >
                    { navTabs.map( ( tab ) => {
                        const isActive = activeNavTab === tab.id;
                        return (
                            <Button
                                key={ tab.id }
                                onClick={ () => setActiveNavTab( tab.id ) }
                                style={ {
                                    height: '70px',
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 0,
                                    margin: 0,
                                    borderBottom: '1px solid #eee',
                                    background: isActive ? '#fff' : 'transparent',
                                    color: isActive ? '#007cba' : '#555',
                                    boxShadow: isActive ? 'inset 4px 0 0 #007cba' : 'none',
                                    fontWeight: isActive ? '600' : '400',
                                    cursor: 'pointer',
                                    padding: '8px 4px',
                                } }
                            >
                                <div
                                    style={ {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '11px',
                                    } }
                                >
                                    <Dashicon icon={ tab.icon } />
                                    <span style={ { textAlign: 'center', lineHeight: '1.2' } }>
                                        { tab.label }
                                    </span>
                                </div>
                            </Button>
                        );
                    } ) }
                </div>

                { /* FULL-WIDTH TAB CONTENT AREA WITH PINNED ACTION FOOTER */ }
                <div
                    style={ {
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                    } }
                >
                    { /* SCROLLABLE CONTENT WORKSPACE FOR ACTIVE TAB */ }
                    <div
                        style={ {
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            padding: '24px 30px',
                        } }
                    >
                        { activeNavTab === 'groups' && (
                            <CategoryGroupManager
                                groups={ groups }
                                setGroups={ setGroups }
                                categoryMap={ categoryMap }
                                setCategoryMap={ setCategoryMap }
                            />
                        ) }

                        { activeNavTab === 'categories' && (
                            <CategoryMappingTable
                                groups={ groups }
                                categoryMap={ categoryMap }
                                setCategoryMap={ setCategoryMap }
                            />
                        ) }

                        { activeNavTab === 'legend' && (
                            <MapLegendManager
                                categoryMap={ categoryMap }
                                legendConfig={ legendConfig }
                                setLegendConfig={ setLegendConfig }
                            />
                        ) }
                    </div>

                    { /* STATIC ACTION FOOTER PINNED AT BOTTOM Across FULL WIDTH */ }
                    <div
                        style={ {
                            padding: '12px 24px',
                            borderTop: '1px solid #e0e0e0',
                            background: '#fcfcfc',
                            flexShrink: 0,
                            zIndex: 10,
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
                                    height: '38px',
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
                                    height: '38px',
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
                                    height: '38px',
                                    padding: '0 28px',
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