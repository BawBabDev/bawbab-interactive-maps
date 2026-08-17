import { __ } from '@wordpress/i18n';
import { NoticeList, Button, Dashicon } from '@wordpress/components';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

import DataEditor, { isFeatureDraftDirty } from './components/dataEditor';
import { AttributeSchemaManager } from './components/attributeSchemaManager';
import BawBabIMaps from '../../bawbab-interactive-maps-block/components/maps';
import {
    discoverCustomAttributes,
    matchesAllFilters,
} from './utils/editFilters';
import { useAttributeSchema } from './hooks/useAttributeSchema';
import { useCategoryManager } from '../category-editor-page/hooks/useCategoryManager';
import {
    DEFAULT_GROUPS,
    DEFAULT_CATEGORY_MAPPINGS,
} from '../category-editor-page/constants/defaultCategories';
import { ConfirmModal, CancelModal } from '../modals/confirmModal';
import { BatchUpdateModal } from './components/batchUpdateModal';
import { UnitSidebarList } from './components/unitSidebarList';

const TEXT_DOMAIN = 'bawbab-interactive-maps';
const ENDPOINT_GET_SETTINGS = '/wp-json/bwb-imaps-federated-api/v1/get-map-settings';
const PROTECTED_FIELDS = ['fid', 'layer_type', 'code', 'name', 'category'];

const formatLabel = ( str ) => {
    if ( ! str ) return '';
    return str
        .split( '_' )
        .map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
        .join( ' ' );
};

/**
 * SpatialDataEditorPage Component
 */
const SpatialDataEditorPage = ( { onDirtyStateChange } ) => {
    const [ features, setFeatures ] = useState( [] );
    const [ selectedLayer, setSelectedLayer ] = useState( 'all' );
    const [ searchQuery, setSearchQuery ] = useState( '' );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ isSaving, setIsSaving ] = useState( false );
    const [ activeFeature, setActiveFeature ] = useState( null );
    const [ resetCounter, setResetCounter ] = useState( 0 );
    const [ drafts, setDrafts ] = useState( {} );

    // Modals trigger state
    const [ showConfirmModal, setShowConfirmModal ] = useState( false );
    const [ showCancelModal, setShowCancelModal ] = useState( false );
    const [ showBatchModal, setShowBatchModal ] = useState( false );

    // Active Navigation Tab ('editor' or 'schema')
    const [ activeNavTab, setActiveNavTab ] = useState( 'editor' );

    // Category Manager Hook
    const { groups, categoryMap } = useCategoryManager();

    // Attribute Schema Hook
    const {
        schema,
        isLoadingSchema,
        updateSchemaKey,
        deleteSchemaKey,
    } = useAttributeSchema();

    // Map settings
    const [ googleApiKey, setGoogleApiKey ] = useState( '' );
    const [ googleMapId, setGoogleMapId ] = useState( '' );
    const [ mapType, setMapType ] = useState( 'hybrid' );
    const [ mapLogo, setMapLogo ] = useState( '' );
    const [ navBackground, setNavBackground ] = useState( '' );
    const [ colorTheme, setColorTheme ] = useState( 'blue' );

    const [ openedTopTab, setOpenedGroup ] = useState( null );
    const [ openedSubGroup, setOpenedSubGroup ] = useState( {} );
    const sidebarListRef = useRef( null );

    const [ isFilterOpen, setIsFilterOpen ] = useState( false );
    const [ filterCategory, setFilterCategory ] = useState( 'all' );
    const [ dynamicFilters, setDynamicFilters ] = useState( {} );

    const { removeNotice, createSuccessNotice, createErrorNotice } =
        useDispatch( noticesStore );
    const notices = useSelect(
        ( select ) => select( noticesStore ).getNotices(),
        []
    );

    // 1. Fetch Features
    const fetchFeatures = async () => {
        setIsLoading( true );
        try {
            const response = await fetch(
                '/wp-json/bwb-imaps-federated-api/v1/get-spatial-data'
            );
            const data = await response.json();
            const allFeatures = data.features || [];

            setFeatures( allFeatures );

            setActiveFeature( ( prevActive ) => {
                if ( ! prevActive ) return null;
                const updated = allFeatures.find(
                    ( f ) =>
                        String( f.properties.fid ) ===
                            String( prevActive.properties.fid ) &&
                        f.properties.layer_type ===
                            prevActive.properties.layer_type
                );
                return updated || prevActive;
            } );
        } catch ( err ) {
            console.error( 'Error fetching spatial data:', err );
        } finally {
            setIsLoading( false );
        }
    };

    // 2. Discover Dynamic Attributes
    const discoveredAttributes = useMemo( () => {
        return discoverCustomAttributes( features );
    }, [ features ] );

    const handleDynamicFilterChange = ( key, value ) => {
        setDynamicFilters( ( prev ) => ( { ...prev, [ key ]: value } ) );
    };

    // Active Feature Composite Key & Dirty States
    const activeCompositeKey = activeFeature
        ? `${ activeFeature.properties.layer_type }::${ activeFeature.properties.fid }`
        : '';
    const activeDraft = drafts[ activeCompositeKey ] || {};

    const isCurrentDraftDirty = useMemo( () => {
        return isFeatureDraftDirty( activeFeature, activeDraft, schema );
    }, [ activeFeature, activeDraft, schema ] );

    const hasAnyDraftChanges = useMemo( () => {
        return Object.keys( drafts ).length > 0;
    }, [ drafts ] );

    // Transmit overall page dirty state signal to top-level router/app shell
    useEffect( () => {
        if ( typeof onDirtyStateChange === 'function' ) {
            onDirtyStateChange( hasAnyDraftChanges );
        }

        return () => {
            if ( typeof onDirtyStateChange === 'function' ) {
                onDirtyStateChange( false );
            }
        };
    }, [ hasAnyDraftChanges, onDirtyStateChange ] );

    const activeDirtyKeys = activeDraft._dirtyKeys || [];
    const hasActiveFeatureDirtyKeys = useMemo( () => {
        return (
            isCurrentDraftDirty &&
            activeDirtyKeys.some( ( k ) => {
                const cleanKey = k.startsWith( 'custom_attr::' )
                    ? k.replace( 'custom_attr::', '' )
                    : k;
                return ! PROTECTED_FIELDS.includes( cleanKey );
            } )
        );
    }, [ isCurrentDraftDirty, activeDirtyKeys ] );

    // 3. Process Two-Level Category Accordion Structure
    const displayStructure = useMemo( () => {
        const activeGroups = groups.length > 0 ? groups : DEFAULT_GROUPS;
        const activeMap =
            Object.keys( categoryMap ).length > 0
                ? categoryMap
                : DEFAULT_CATEGORY_MAPPINGS;

        const filteredFeatures = features.filter( ( f ) => {
            const matchesLayer =
                selectedLayer === 'all' ||
                f.properties?.layer_type === selectedLayer;
            const matchesSearchAndCustom = matchesAllFilters(
                f,
                searchQuery,
                filterCategory,
                dynamicFilters
            );
            return matchesLayer && matchesSearchAndCustom;
        } );

        const naturalSort = ( a, b ) =>
            ( a.properties?.code || a.properties?.name || '' ).localeCompare(
                b.properties?.code || b.properties?.name || '',
                undefined,
                { numeric: true }
            );

        const mainCategories = [];
        const assignedFeatureFids = new Set();

        activeGroups.forEach( ( group ) => {
            if ( ! group.id ) return;

            const matchingFeatures = filteredFeatures.filter( ( f ) => {
                const cat = f.properties?.category || '';
                const layer = f.properties?.layer_type || 'buildings';
                const compositeKey = `${ layer }::${ cat }`;

                const mappedInfo =
                    activeMap[ compositeKey ] || activeMap[ cat ];
                return mappedInfo?.groupId === group.id;
            } );

            if ( matchingFeatures.length === 0 ) return;

            matchingFeatures.forEach( ( f ) =>
                assignedFeatureFids.add(
                    `${ f.properties.layer_type }-${ f.properties.fid }`
                )
            );

            const subGroupMap = {};
            const flatItems = [];

            matchingFeatures.forEach( ( f ) => {
                const p = f.properties || {};
                if ( p.name && p.code && group.displayType === 'grouped' ) {
                    if ( ! subGroupMap[ p.name ] ) subGroupMap[ p.name ] = [];
                    subGroupMap[ p.name ].push( f );
                } else {
                    flatItems.push( f );
                }
            } );

            const subGroups = Object.keys( subGroupMap )
                .filter( ( subName ) => subGroupMap[ subName ].length > 0 )
                .sort()
                .map( ( subName ) => ( {
                    id: `sub-${ group.id }-${ subName.replace( /\s+/g, '_' ) }`,
                    title: subName,
                    items: subGroupMap[ subName ].sort( naturalSort ),
                } ) );

            mainCategories.push( {
                id: `group-${ group.id }`,
                title: group.title,
                displayType: group.displayType || 'flat',
                subGroups,
                flatItems: flatItems.sort( naturalSort ),
                totalCount: matchingFeatures.length,
            } );
        } );

        const unassignedFeatures = filteredFeatures.filter(
            ( f ) =>
                ! assignedFeatureFids.has(
                    `${ f.properties.layer_type }-${ f.properties.fid }`
                )
        );

        if ( unassignedFeatures.length > 0 ) {
            mainCategories.push( {
                id: 'group-unassigned',
                title: __( 'Unassigned / Other Features', TEXT_DOMAIN ),
                displayType: 'flat',
                subGroups: [],
                flatItems: unassignedFeatures.sort( naturalSort ),
                totalCount: unassignedFeatures.length,
            } );
        }

        return mainCategories;
    }, [
        features,
        selectedLayer,
        searchQuery,
        filterCategory,
        dynamicFilters,
        groups,
        categoryMap,
    ] );

    // Auto-expand & scroll sidebar
    useEffect( () => {
        if ( ! activeFeature || ! activeFeature.properties ) return;

        const targetFid = String( activeFeature.properties.fid );
        const targetLayer = activeFeature.properties.layer_type || 'buildings';

        let matchingTopTabId = null;
        let matchingSubGroupId = null;

        displayStructure.forEach( ( topTab ) => {
            const inFlat = topTab.flatItems.some(
                ( f ) =>
                    String( f.properties.fid ) === targetFid &&
                    f.properties.layer_type === targetLayer
            );
            if ( inFlat ) {
                matchingTopTabId = topTab.id;
            }

            topTab.subGroups.forEach( ( subGroup ) => {
                const inSub = subGroup.items.some(
                    ( f ) =>
                        String( f.properties.fid ) === targetFid &&
                        f.properties.layer_type === targetLayer
                );
                if ( inSub ) {
                    matchingTopTabId = topTab.id;
                    matchingSubGroupId = subGroup.id;
                }
            } );
        } );

        if ( matchingTopTabId ) {
            setOpenedGroup( matchingTopTabId );
        }

        if ( matchingSubGroupId ) {
            setOpenedSubGroup( ( prev ) => ( {
                ...prev,
                [ matchingSubGroupId ]: true,
            } ) );
        }

        const scrollTimer = setTimeout( () => {
            const targetElementId = `item-${ targetLayer }-${ targetFid }`;
            const targetEl = document.getElementById( targetElementId );

            if ( targetEl && sidebarListRef.current ) {
                targetEl.scrollIntoView( {
                    behavior: 'smooth',
                    block: 'nearest',
                } );
            }
        }, 120 );

        return () => clearTimeout( scrollTimer );
    }, [ activeFeature, displayStructure ] );

    const updateDraft = ( layerType, fid, data, options = {} ) => {
        const compositeKey = `${ layerType }::${ fid }`;
        setDrafts( ( prev ) => {
            const currentDraft = prev[ compositeKey ] || {};
            const currentDirty = new Set( currentDraft._dirtyKeys || [] );

            if ( ! options.isSystemInit ) {
                Object.keys( data ).forEach( ( key ) => {
                    if ( key === 'custom_attributes' ) {
                        Object.keys( data.custom_attributes || {} ).forEach( ( attrKey ) => {
                            currentDirty.add( `custom_attr::${ attrKey }` );
                        } );
                    } else if ( key !== '_dirtyKeys' ) {
                        currentDirty.add( key );
                    }
                } );
            }

            const updatedCustomAttrs = {
                ...( currentDraft.custom_attributes || {} ),
                ...( data.custom_attributes || {} ),
            };

            return {
                ...prev,
                [ compositeKey ]: {
                    ...currentDraft,
                    ...data,
                    _dirtyKeys: Array.from( currentDirty ),
                    ...( Object.keys( updatedCustomAttrs ).length > 0
                        ? { custom_attributes: updatedCustomAttrs }
                        : {} ),
                },
            };
        } );
    };

    const handleExecuteBatchUpdate = ( { fieldsToSync, filterPredicate } ) => {
        const targetFeatures = features.filter( filterPredicate );

        if ( targetFeatures.length === 0 || ! fieldsToSync || fieldsToSync.length === 0 ) return;

        const syncedDirtyKeyIdentifiers = new Set();
        fieldsToSync.forEach( ( { key, isCustomAttr } ) => {
            if ( isCustomAttr ) {
                syncedDirtyKeyIdentifiers.add( `custom_attr::${ key }` );
            } else {
                syncedDirtyKeyIdentifiers.add( key );
            }
        } );

        setDrafts( ( prev ) => {
            const updatedDrafts = { ...prev };

            targetFeatures.forEach( ( f ) => {
                const compositeKey = `${ f.properties.layer_type }::${ f.properties.fid }`;
                const currentDraft = updatedDrafts[ compositeKey ] || {};
                let currentCustomAttrs = {
                    ...( f.properties.custom_attributes || {} ),
                    ...( currentDraft.custom_attributes || {} ),
                };

                const directCoreUpdates = {};

                fieldsToSync.forEach( ( { key, isCustomAttr, value } ) => {
                    if ( isCustomAttr ) {
                        currentCustomAttrs[ key ] = value;
                    } else {
                        directCoreUpdates[ key ] = value;
                    }
                } );

                const updatedDirtyKeys = ( currentDraft._dirtyKeys || [] ).filter(
                    ( dirtyKey ) => ! syncedDirtyKeyIdentifiers.has( dirtyKey )
                );

                updatedDrafts[ compositeKey ] = {
                    ...currentDraft,
                    ...directCoreUpdates,
                    _dirtyKeys: updatedDirtyKeys,
                    ...( Object.keys( currentCustomAttrs ).length > 0
                        ? { custom_attributes: currentCustomAttrs }
                        : {} ),
                };
            } );

            return updatedDrafts;
        } );
    };

    const handleCancel = () => {
        setShowCancelModal( false );
        setDrafts( {} );
        setResetCounter( ( prev ) => prev + 1 );
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal( false );
        const draftKeys = Object.keys( drafts );
        if ( draftKeys.length === 0 ) return;

        setIsSaving( true );

        try {
            const savePromises = draftKeys.map( async ( compositeKey ) => {
                const draftData = drafts[ compositeKey ];
                const [ layerType, fid ] = compositeKey.split( '::' );
                const feature = features.find(
                    ( f ) =>
                        String( f.properties.fid ) === String( fid ) &&
                        f.properties.layer_type === layerType
                );

                if ( ! feature ) return;

                const helperBool = ( key, defaultBool ) => {
                    if ( draftData[ key ] !== undefined )
                        return draftData[ key ] ? 1 : 0;
                    return feature.properties[ key ] !== undefined
                        ? feature.properties[ key ]
                            ? 1
                            : 0
                        : defaultBool;
                };

                const mergedCustomAttrs = {
                    ...( feature.properties.custom_attributes || {} ),
                    ...( draftData.custom_attributes || {} ),
                };

                const { _dirtyKeys, ...cleanDraftData } = draftData;

                const payload = {
                    fid: fid,
                    layer_type: layerType,
                    ...cleanDraftData,
                    is_interactive: helperBool( 'is_interactive', 1 ),
                    show_label: helperBool( 'show_label', 1 ),
                    append_description: helperBool( 'append_description', 0 ),
                    hide_page_video: helperBool( 'hide_page_video', 0 ),
                    hide_page_floorplan: helperBool( 'hide_page_floorplan', 0 ),
                    custom_video_url:
                        draftData.custom_video_url !== undefined
                            ? draftData.custom_video_url
                            : feature.properties.custom_video_url || '',
                    custom_floorplan_url:
                        draftData.custom_floorplan_url !== undefined
                            ? draftData.custom_floorplan_url
                            : feature.properties.custom_floorplan_url || '',
                    custom_attributes: mergedCustomAttrs,
                };

                const response = await fetch(
                    '/wp-json/bwb-imaps-federated-api/v1/update-spatial-meta',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': window.wpApiSettings?.nonce || '',
                        },
                        body: JSON.stringify( payload ),
                    }
                );

                return await response.json();
            } );

            await Promise.all( savePromises );

            setDrafts( {} );
            setResetCounter( ( prev ) => prev + 1 );
            await fetchFeatures();
            createSuccessNotice(
                __( 'Feature changes saved successfully!', TEXT_DOMAIN ),
                { type: 'snackbar' }
            );
        } catch ( err ) {
            console.error( 'Global Save Exception:', err );
            createErrorNotice( __( 'Error saving feature changes.', TEXT_DOMAIN ) );
        } finally {
            setIsSaving( false );
        }
    };

    // Load Settings
    useEffect( () => {
        const settings = window.bwbimapsSettings;
        if ( settings?.googleApiKey && settings?.googleMapId ) {
            setGoogleApiKey( settings.googleApiKey );
            setGoogleMapId( settings.googleMapId );
            setMapType( settings.mapType || 'hybrid' );
            setMapLogo( settings.mapLogo || '' );
            setNavBackground( settings.navBackground || '' );
            setColorTheme( settings.colorTheme || 'blue' );
        } else {
            fetch( ENDPOINT_GET_SETTINGS )
                .then( ( res ) => ( res.ok ? res.json() : {} ) )
                .then( ( data ) => {
                    if ( data ) {
                        const key = data.googleApiKey || '';
                        const id = data.googleMapId || '';
                        const type = data.mapType || 'hybrid';
                        const logo = data.mapLogo || '';
                        const bg = data.navBackground || '';
                        const theme = data.colorTheme || 'blue';

                        setGoogleApiKey( key );
                        setGoogleMapId( id );
                        setMapType( type );
                        setMapLogo( logo );
                        setNavBackground( bg );
                        setColorTheme( theme );

                        if ( ! window.bwbimapsSettings )
                            window.bwbimapsSettings = {};
                        window.bwbimapsSettings = {
                            ...window.bwbimapsSettings,
                            googleApiKey: key,
                            googleMapId: id,
                            mapType: type,
                            mapLogo: logo,
                            navBackground: bg,
                            colorTheme: theme,
                            categoryConfig: data.categoryConfig || null,
                        };
                    }
                } )
                .catch( ( err ) =>
                    console.error(
                        'Error loading Map Settings in Edit Tool:',
                        err
                    )
                );
        }
    }, [] );

    useEffect( () => {
        fetchFeatures();
    }, [] );

    const categories = useMemo( () => {
        const cats = new Set(
            features.map( ( f ) => f.properties.category ).filter( Boolean )
        );
        return [
            { label: __( 'All Categories', TEXT_DOMAIN ), value: 'all' },
            ...Array.from( cats ).map( ( cat ) => ( {
                label: formatLabel( cat ),
                value: cat,
            } ) ),
        ];
    }, [ features ] );

    const navTabs = [
        {
            id: 'editor',
            label: __( 'Feature Editor', TEXT_DOMAIN ),
            icon: 'edit',
        },
        {
            id: 'schema',
            label: __( 'Attributes Editor', TEXT_DOMAIN ),
            icon: 'category',
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
            { /* MASK WP FOOTER AND PREVENT PAGE OVERFLOW */ }
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
                    { __( 'Edit Map Features', TEXT_DOMAIN ) }
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

                { /* MAIN VIEW SWITCHER BASED ON ACTIVE NAVIGATION TAB */ }
                { activeNavTab === 'editor' ? (
                    <div
                        style={ {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            height: '100%',
                            minHeight: 0,
                            overflow: 'hidden',
                        } }
                    >
                        { /* UNIT SEARCH LIST SIDEBAR SUBCOMPONENT (FIXED 350PX WIDTH) */ }
                        <UnitSidebarList
                            selectedLayer={ selectedLayer }
                            setSelectedLayer={ setSelectedLayer }
                            searchQuery={ searchQuery }
                            setSearchQuery={ setSearchQuery }
                            isFilterOpen={ isFilterOpen }
                            setIsFilterOpen={ setIsFilterOpen }
                            filterCategory={ filterCategory }
                            setFilterCategory={ setFilterCategory }
                            categories={ categories }
                            discoveredAttributes={ discoveredAttributes }
                            dynamicFilters={ dynamicFilters }
                            handleDynamicFilterChange={ handleDynamicFilterChange }
                            formatLabel={ formatLabel }
                            onOpenSchema={ () => setActiveNavTab( 'schema' ) }
                            sidebarListRef={ sidebarListRef }
                            isLoading={ isLoading }
                            displayStructure={ displayStructure }
                            openedTopTab={ openedTopTab }
                            setOpenedGroup={ setOpenedGroup }
                            openedSubGroup={ openedSubGroup }
                            setOpenedSubGroup={ setOpenedSubGroup }
                            activeFeature={ activeFeature }
                            setActiveFeature={ setActiveFeature }
                            setActiveNavTab={ setActiveNavTab }
                            isCurrentDraftDirty={ isCurrentDraftDirty }
                            isSaving={ isSaving }
                            hasActiveFeatureDirtyKeys={ hasActiveFeatureDirtyKeys }
                            onOpenCancelModal={ () => setShowCancelModal( true ) }
                            onOpenConfirmModal={ () => setShowConfirmModal( true ) }
                            onOpenBatchModal={ () => setShowBatchModal( true ) }
                        />

                        { /* DATA EDITOR & PREVIEW CONTAINER */ }
                        <div
                            style={ {
                                flex: 1,
                                height: '100%',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                background: '#fdfdfd',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                            } }
                        >
                            { activeFeature ? (
                                <div
                                    style={ {
                                        padding: '40px 20px',
                                        maxWidth: '700px',
                                        width: '100%',
                                        margin: '0 auto',
                                        boxSizing: 'border-box',
                                    } }
                                >
                                    <DataEditor
                                        key={ `${ activeFeature.properties.layer_type }-${ activeFeature.properties.fid }` }
                                        building={ activeFeature }
                                        draft={ activeDraft }
                                        globalSchema={ schema }
                                        allFeatures={ features }
                                        updateSchemaKey={ updateSchemaKey }
                                        onOpenSchema={ () => setActiveNavTab( 'schema' ) }
                                        updateDraft={ ( data, options ) =>
                                            updateDraft(
                                                activeFeature.properties
                                                    .layer_type,
                                                activeFeature.properties.fid,
                                                data,
                                                options
                                            )
                                        }
                                    />

                                    <div
                                        style={ {
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            marginLeft: '-20px',
                                            marginRight: '-20px',
                                            paddingLeft: '20px',
                                            paddingRight: '20px',
                                        } }
                                    >
                                        <h2
                                            style={ {
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginBottom: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            } }
                                        >
                                            <Dashicon icon="location-alt" />
                                            { __(
                                                'Location Preview',
                                                TEXT_DOMAIN
                                            ) }
                                        </h2>
                                        <div
                                            style={ {
                                                height: '450px',
                                                border: '1px solid #ddd',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                boxShadow:
                                                    '0 2px 8px rgba(0,0,0,0.05)',
                                            } }
                                        >
                                            <BawBabIMaps
                                                key={ `preview-map-${ resetCounter }` }
                                                height="450px"
                                                editMode={ true }
                                                selectedLocationProp={
                                                    activeFeature
                                                }
                                                isDrawerOpenProp={ true }
                                                onFeatureSelect={ ( feature ) =>
                                                    setActiveFeature( feature )
                                                }
                                                apiKeyProp={ googleApiKey }
                                                mapIdProp={ googleMapId }
                                                mapTypeProp={ mapType }
                                                mapLogoProp={ mapLogo }
                                                navBackgroundProp={ navBackground }
                                                colorThemeProp={ colorTheme }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={ {
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#949494',
                                        background: '#fcfcfc',
                                        height: '100%',
                                        width: '100%',
                                        minHeight: '400px',
                                        padding: '40px 20px',
                                        boxSizing: 'border-box',
                                    } }
                                >
                                    <div
                                        style={ {
                                            background: '#fff',
                                            padding: '40px',
                                            borderRadius: '50%',
                                            marginBottom: '20px',
                                            border: '1px solid #e0e0e0',
                                            boxShadow:
                                                'inset 0 0 15px rgba(0,0,0,0.02)',
                                        } }
                                    >
                                        <Dashicon icon="edit" size={ 60 } />
                                    </div>
                                    <h2
                                        style={ {
                                            color: '#1d2327',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                        } }
                                    >
                                        { __(
                                            'No Feature Selected',
                                            TEXT_DOMAIN
                                        ) }
                                    </h2>
                                    <p
                                        style={ {
                                            maxWidth: '300px',
                                            textAlign: 'center',
                                            margin: 0,
                                            fontSize: '13px',
                                        } }
                                    >
                                        { __(
                                            'Select a unit or amenity from the left sidebar or directly on the map to begin editing its details.',
                                            TEXT_DOMAIN
                                        ) }
                                    </p>
                                </div>
                            ) }
                        </div>
                    </div>
                ) : (
                    /* ATTRIBUTE SCHEMA MANAGER FULL VIEW */
                    <div
                        style={ {
                            flex: 1,
                            height: '100%',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            padding: '30px',
                            background: '#fdfdfd',
                            boxSizing: 'border-box',
                        } }
                    >
                        <AttributeSchemaManager
                            schema={ schema }
                            isLoading={ isLoadingSchema }
                            onUpdateKey={ updateSchemaKey }
                            onDeleteKey={ deleteSchemaKey }
                            onRefreshFeatures={ fetchFeatures }
                        />
                    </div>
                ) }
            </div>

            { /* BATCH UPDATE SELECTION MODAL */ }
            <BatchUpdateModal
                isOpen={ showBatchModal }
                activeFeature={ activeFeature }
                draftData={ activeDraft }
                globalSchema={ schema }
                groups={ groups }
                categoryMap={ categoryMap }
                allFeatures={ features }
                onClose={ () => setShowBatchModal( false ) }
                onConfirmBatch={ handleExecuteBatchUpdate }
            />

            { /* GENERIC CONFIRMATION MODAL */ }
            <ConfirmModal
                isOpen={ showConfirmModal }
                title={ __( 'Save Feature Changes', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to save all modified feature details to the database?',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Save Changes', TEXT_DOMAIN ) }
                onConfirm={ handleConfirmSave }
                onCancel={ () => setShowConfirmModal( false ) }
                isBusy={ isSaving }
            />

            { /* GENERIC CANCELLATION MODAL */ }
            <CancelModal
                isOpen={ showCancelModal }
                title={ __( 'Discard Draft Modifications', TEXT_DOMAIN ) }
                message={ __(
                    'Are you sure you want to discard your unsaved modifications? All pending edits for this feature will be reset.',
                    TEXT_DOMAIN
                ) }
                confirmLabel={ __( 'Discard Edits', TEXT_DOMAIN ) }
                onConfirm={ handleCancel }
                onCancel={ () => setShowCancelModal( false ) }
            />
        </div>
    );
};

export default SpatialDataEditorPage;