/**
 * MapLegendManager Component
 * QGIS-style dual-column Legend Manager with layer-aware auto-grouping & reset.
 *
 * File: src/components/mapLegendManager.jsx
 */

import { useState, useMemo } from '@wordpress/element';
import {
    Button,
    CheckboxControl,
    ToggleControl,
    Flex,
    FlexItem,
    TextControl,
    SelectControl,
    Modal,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const LAYER_TITLES = {
    buildings: __( 'Buildings', TEXT_DOMAIN ),
    land_use: __( 'Land Use', TEXT_DOMAIN ),
    paths: __( 'Pathways', TEXT_DOMAIN ),
    parcels: __( 'Parcels', TEXT_DOMAIN ),
    entries: __( 'Entries & Doors', TEXT_DOMAIN ),
};

export const MapLegendManager = ( {
    categoryMap = {},
    legendConfig = {},
    setLegendConfig,
} ) => {
    const [ showMergeModal, setShowMergeModal ] = useState( false );
    const [ mergeLabel, setMergeLabel ] = useState( '' );
    const [ selectedMergeCats, setSelectedMergeCats ] = useState( [] );
    const [ targetSectionId, setTargetSectionId ] = useState( '' );
    const [ newSectionTitle, setNewSectionTitle ] = useState( '' );

    const allCategoryKeys = Object.keys( categoryMap );

    // Build Set of compositeKeys currently assigned anywhere in the legend
    const assignedCategoryKeys = useMemo( () => {
        const assigned = new Set();
        ( legendConfig.sections || [] ).forEach( ( sec ) => {
            ( sec.items || [] ).forEach( ( item ) => {
                ( item.categories || [] ).forEach( ( ck ) => assigned.add( ck ) );
            } );
        } );
        return assigned;
    }, [ legendConfig.sections ] );

    // Set of categories already merged into a multi-category line
    const alreadyMergedCategorySet = useMemo( () => {
        const merged = new Set();
        ( legendConfig.sections || [] ).forEach( ( sec ) => {
            ( sec.items || [] )
                .filter( ( item ) => item.type === 'merged' )
                .forEach( ( item ) => {
                    ( item.categories || [] ).forEach( ( ck ) => merged.add( ck ) );
                } );
        } );
        return merged;
    }, [ legendConfig.sections ] );

    // Group available categories by layer_type for the right palette
    const availableCategoriesByLayer = useMemo( () => {
        const grouped = {};
        allCategoryKeys.forEach( ( compositeKey ) => {
            const info = categoryMap[ compositeKey ] || {};
            const layer =
                info.layer_type ||
                ( compositeKey.includes( '::' )
                    ? compositeKey.split( '::' )[ 0 ]
                    : 'buildings' );

            if ( ! grouped[ layer ] ) grouped[ layer ] = [];
            grouped[ layer ].push( {
                compositeKey,
                isAssigned: assignedCategoryKeys.has( compositeKey ),
                ...info,
            } );
        } );
        return grouped;
    }, [ categoryMap, allCategoryKeys, assignedCategoryKeys ] );

    // Helper: Find matching layer section via title/layer_type fuzzy matching
    const findMatchingSectionForLayer = ( sections, layerKey ) => {
        const expectedTitle = ( LAYER_TITLES[ layerKey ] || layerKey ).toLowerCase();

        return sections.find( ( sec ) => {
            if ( sec.layer_type === layerKey || sec.id === `sec_layer_${ layerKey }` ) {
                return true;
            }
            const secTitle = ( sec.title || '' ).toLowerCase();
            return secTitle.includes( expectedTitle ) || expectedTitle.includes( secTitle );
        } );
    };

    // 1. Add Custom Legend Section
    const handleAddSection = () => {
        if ( ! newSectionTitle.trim() ) return;
        const newSec = {
            id: `sec_${ Date.now() }`,
            title: newSectionTitle.trim(),
            items: [],
        };
        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: [ ...( prev.sections || [] ), newSec ],
        } ) );
        setNewSectionTitle( '' );
    };

    // 2. Unrestricted Remove Section
    const handleRemoveSection = ( secId ) => {
        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: ( prev.sections || [] ).filter( ( s ) => s.id !== secId ),
        } ) );
    };

    // 3. Rename Section Header
    const handleRenameSection = ( secId, title ) => {
        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: ( prev.sections || [] ).map( ( s ) =>
                s.id === secId ? { ...s, title } : s
            ),
        } ) );
    };

    // 4. Toggle Item Visibility
    const handleToggleItem = ( secId, itemId, checked ) => {
        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: ( prev.sections || [] ).map( ( sec ) => {
                if ( sec.id !== secId ) return sec;
                return {
                    ...sec,
                    items: sec.items.map( ( item ) =>
                        item.id === itemId
                            ? { ...item, showInLegend: checked }
                            : item
                    ),
                };
            } ),
        } ) );
    };

    // 5. Remove Item from Section
    const handleRemoveItem = ( secId, itemId ) => {
        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: ( prev.sections || [] ).map( ( sec ) => {
                if ( sec.id !== secId ) return sec;
                return {
                    ...sec,
                    items: sec.items.filter( ( item ) => item.id !== itemId ),
                };
            } ),
        } ) );
    };

    // 6. Reorder Items Within Section
    const handleMoveItemOrder = ( secIndex, itemIndex, direction ) => {
        const sections = [ ...( legendConfig.sections || [] ) ];
        const items = [ ...sections[ secIndex ].items ];
        const targetIndex = itemIndex + direction;

        if ( targetIndex < 0 || targetIndex >= items.length ) return;

        const temp = items[ itemIndex ];
        items[ itemIndex ] = items[ targetIndex ];
        items[ targetIndex ] = temp;

        sections[ secIndex ].items = items;
        setLegendConfig( ( prev ) => ( { ...prev, sections } ) );
    };

    // 7. Transfer Item to Different Section
    const handleTransferItemToSection = ( currentSecId, itemId, newSecId ) => {
        if ( ! newSecId || currentSecId === newSecId ) return;

        setLegendConfig( ( prev ) => {
            let itemToMove = null;

            const updatedSections = ( prev.sections || [] ).map( ( sec ) => {
                if ( sec.id === currentSecId ) {
                    const found = sec.items.find( ( i ) => i.id === itemId );
                    if ( found ) itemToMove = found;
                    return {
                        ...sec,
                        items: sec.items.filter( ( i ) => i.id !== itemId ),
                    };
                }
                return sec;
            } );

            if ( itemToMove ) {
                const targetSec = updatedSections.find( ( s ) => s.id === newSecId );
                if ( targetSec ) {
                    targetSec.items.push( itemToMove );
                }
            }

            return { ...prev, sections: updatedSections };
        } );
    };

    // 8. Add Category from Palette (Layer-Aware Auto Grouping)
    const handleAddCategoryToLegend = ( compositeKey ) => {
        setLegendConfig( ( prev ) => {
            let sections = [ ...( prev.sections || [] ) ];

            const info = categoryMap[ compositeKey ] || {};
            const layerKey =
                info.layer_type ||
                ( compositeKey.includes( '::' )
                    ? compositeKey.split( '::' )[ 0 ]
                    : 'buildings' );
            const catSlug = compositeKey.includes( '::' )
                ? compositeKey.split( '::' )[ 1 ]
                : compositeKey;

            // Search for existing section by layer type or fuzzy title match
            let targetSec = findMatchingSectionForLayer( sections, layerKey );

            // Auto-create a section named after the layer if no match exists
            if ( ! targetSec ) {
                const layerTitle = LAYER_TITLES[ layerKey ] || layerKey.toUpperCase();
                targetSec = {
                    id: `sec_layer_${ layerKey }_${ Date.now() }`,
                    title: layerTitle,
                    layer_type: layerKey,
                    items: [],
                };
                sections.push( targetSec );
            }

            const newItem = {
                id: `leg_${ compositeKey }_${ Date.now() }`,
                label: info.label || catSlug,
                type: 'single',
                categories: [ compositeKey ],
                showInLegend: true,
            };

            const updatedSections = sections.map( ( sec ) => {
                if ( sec.id === targetSec.id ) {
                    return { ...sec, items: [ ...sec.items, newItem ] };
                }
                return sec;
            } );

            return { ...prev, sections: updatedSections };
        } );
    };

    // 9. Reset Legend Structure Back to Layer Defaults
    const handleResetLegendToLayers = () => {
        const newSectionsMap = {};

        allCategoryKeys.forEach( ( compositeKey ) => {
            const info = categoryMap[ compositeKey ] || {};
            const layerKey =
                info.layer_type ||
                ( compositeKey.includes( '::' )
                    ? compositeKey.split( '::' )[ 0 ]
                    : 'buildings' );
            const catSlug = compositeKey.includes( '::' )
                ? compositeKey.split( '::' )[ 1 ]
                : compositeKey;

            if ( ! newSectionsMap[ layerKey ] ) {
                newSectionsMap[ layerKey ] = {
                    id: `sec_layer_${ layerKey }`,
                    title: LAYER_TITLES[ layerKey ] || layerKey.toUpperCase(),
                    layer_type: layerKey,
                    items: [],
                };
            }

            newSectionsMap[ layerKey ].items.push( {
                id: `leg_${ compositeKey }_${ Date.now() }`,
                label: info.label || catSlug,
                type: 'single',
                categories: [ compositeKey ],
                showInLegend: true,
            } );
        } );

        setLegendConfig( ( prev ) => ( {
            ...prev,
            sections: Object.values( newSectionsMap ),
        } ) );
    };

    // 10. Merge Categories
    const handleConfirmMergeCategories = () => {
        if ( ! mergeLabel.trim() || selectedMergeCats.length < 2 ) return;

        const newMergedItem = {
            id: `merge_${ Date.now() }`,
            label: mergeLabel.trim(),
            type: 'merged',
            categories: selectedMergeCats,
            showInLegend: true,
        };

        const targetCatSet = new Set( selectedMergeCats );

        setLegendConfig( ( prev ) => {
            let sections = [ ...( prev.sections || [] ) ];

            const updatedSections = sections.map( ( sec ) => {
                const cleanItems = ( sec.items || [] ).filter( ( item ) => {
                    if ( item.type === 'merged' ) return true;
                    return ! item.categories.some( ( c ) => targetCatSet.has( c ) );
                } );
                return { ...sec, items: cleanItems };
            } );

            const secToAddTo = targetSectionId || updatedSections[ 0 ]?.id;
            const targetSec =
                updatedSections.find( ( s ) => s.id === secToAddTo ) ||
                updatedSections[ 0 ];

            if ( targetSec ) {
                targetSec.items.unshift( newMergedItem );
            }

            return { ...prev, sections: updatedSections };
        } );

        setMergeLabel( '' );
        setSelectedMergeCats( [] );
        setShowMergeModal( false );
    };

    // 11. Unmerge Categories
    const handleUnmergeItem = ( secId, itemId ) => {
        const sections = [ ...( legendConfig.sections || [] ) ];
        const sec = sections.find( ( s ) => s.id === secId );
        if ( ! sec ) return;

        const targetItem = sec.items.find( ( i ) => i.id === itemId );
        if ( ! targetItem || targetItem.type !== 'merged' ) return;

        const restoredItems = targetItem.categories.map( ( compositeKey ) => {
            const catSlug = compositeKey.includes( '::' )
                ? compositeKey.split( '::' )[ 1 ]
                : compositeKey;
            return {
                id: `leg_${ compositeKey }_${ Date.now() }`,
                label: categoryMap[ compositeKey ]?.label || catSlug,
                type: 'single',
                categories: [ compositeKey ],
                showInLegend: true,
            };
        } );

        sec.items = sec.items
            .filter( ( i ) => i.id !== itemId )
            .concat( restoredItems );
        setLegendConfig( ( prev ) => ( { ...prev, sections } ) );
    };

    const sectionDropdownOptions = ( legendConfig.sections || [] ).map( ( s ) => ( {
        label: s.title || s.id,
        value: s.id,
    } ) );

    return (
        <div
            style={ {
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '15px',
            } }
        >
            <h2
                style={ {
                    fontSize: '16px',
                    fontWeight: '600',
                    marginTop: 0,
                    marginBottom: '8px',
                } }
            >
                { __( 'Map Legend Customizer', TEXT_DOMAIN ) }
            </h2>
            <p style={ { fontSize: '13px', color: '#666', marginBottom: '20px' } }>
                { __(
                    'Organize active legend sections on the left or assign available layer categories from the right palette.',
                    TEXT_DOMAIN
                ) }
            </p>

            { /* TOP CONTROL BAR */ }
            <div
                style={ {
                    marginBottom: '20px',
                    padding: '14px',
                    background: '#f9f9f9',
                    borderRadius: '6px',
                    border: '1px solid #eee',
                } }
            >
                <Flex align="center" justify="space-between" wrap gap={ 3 }>
                    <Flex align="center" gap={ 4 } wrap>
                        <ToggleControl
                            label={ __( 'Enable Public Map Legend', TEXT_DOMAIN ) }
                            checked={ Boolean( legendConfig.enabled ) }
                            onChange={ ( val ) =>
                                setLegendConfig( ( prev ) => ( {
                                    ...prev,
                                    enabled: val,
                                } ) )
                            }
                            __nextHasNoMarginBottom
                        />

                        <ToggleControl
                            label={ __( 'Show Section Titles in Legend', TEXT_DOMAIN ) }
                            checked={ legendConfig.showSectionHeaders !== false }
                            onChange={ ( val ) =>
                                setLegendConfig( ( prev ) => ( {
                                    ...prev,
                                    showSectionHeaders: val,
                                } ) )
                            }
                            disabled={ ! legendConfig.enabled }
                            __nextHasNoMarginBottom
                        />
                    </Flex>

                    <Flex align="center" gap={ 2 }>
                        <Button
                            variant="secondary"
                            icon="undo"
                            onClick={ handleResetLegendToLayers }
                            disabled={ ! legendConfig.enabled }
                        >
                            { __( 'Reset Legend to Layer Defaults', TEXT_DOMAIN ) }
                        </Button>

                        <Button
                            variant="secondary"
                            icon="groups"
                            onClick={ () => setShowMergeModal( true ) }
                            disabled={ ! legendConfig.enabled }
                        >
                            { __( 'Merge Categories into 1 Line', TEXT_DOMAIN ) }
                        </Button>
                    </Flex>
                </Flex>
            </div>

            { legendConfig.enabled && (
                <div
                    style={ {
                        display: 'grid',
                        gridTemplateColumns: '1fr 320px',
                        gap: '20px',
                        alignItems: 'start',
                    } }
                >
                    { /* LEFT COLUMN: ACTIVE LEGEND SECTIONS & ITEMS */ }
                    <div>
                        <h3
                            style={ {
                                fontSize: '13px',
                                fontWeight: '700',
                                marginTop: 0,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                color: '#444',
                            } }
                        >
                            { __( 'Active Legend Layout', TEXT_DOMAIN ) }
                        </h3>

                        { ( legendConfig.sections || [] ).length === 0 ? (
                            <div
                                style={ {
                                    padding: '24px',
                                    border: '2px dashed #e0e0e0',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    color: '#888',
                                    background: '#fafafa',
                                    marginBottom: '20px',
                                } }
                            >
                                <p style={ { margin: '0 0 8px 0', fontSize: '13px' } }>
                                    { __(
                                        'No sections in legend. Add a section below or pick a category from available layers on the right.',
                                        TEXT_DOMAIN
                                    ) }
                                </p>
                            </div>
                        ) : (
                            ( legendConfig.sections || [] ).map( ( section, secIdx ) => (
                                <div
                                    key={ section.id }
                                    style={ {
                                        marginBottom: '20px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '4px',
                                        background: '#fff',
                                        overflow: 'hidden',
                                    } }
                                >
                                    { /* SECTION HEADER */ }
                                    <div
                                        style={ {
                                            padding: '10px 12px',
                                            background: '#f5f5f5',
                                            borderBottom: '1px solid #e0e0e0',
                                        } }
                                    >
                                        <Flex align="center" justify="space-between" gap={ 3 }>
                                            <FlexItem style={ { flex: 1 } }>
                                                <TextControl
                                                    value={ section.title }
                                                    onChange={ ( val ) =>
                                                        handleRenameSection( section.id, val )
                                                    }
                                                    style={ {
                                                        height: '32px',
                                                        fontWeight: '700',
                                                    } }
                                                    __nextHasNoMarginBottom
                                                />
                                            </FlexItem>
                                            <Button
                                                isDestructive
                                                isSmall
                                                icon="trash"
                                                onClick={ () => handleRemoveSection( section.id ) }
                                                label={ __( 'Delete Section', TEXT_DOMAIN ) }
                                            />
                                        </Flex>
                                    </div>

                                    { /* SECTION ITEMS TABLE */ }
                                    <div style={ { borderBottom: '1px solid #eee' } }>
                                        { section.items.length === 0 ? (
                                            <p
                                                style={ {
                                                    fontSize: '11px',
                                                    fontStyle: 'italic',
                                                    color: '#999',
                                                    padding: '12px',
                                                    margin: 0,
                                                    textAlign: 'center',
                                                } }
                                            >
                                                { __(
                                                    'Empty group (Hidden on public map until items are added).',
                                                    TEXT_DOMAIN
                                                ) }
                                            </p>
                                        ) : (
                                            section.items.map( ( item, itemIdx ) => {
                                                const isFirst = itemIdx === 0;
                                                const isLast =
                                                    itemIdx === section.items.length - 1;

                                                return (
                                                    <div
                                                        key={ item.id }
                                                        style={ {
                                                            display: 'grid',
                                                            gridTemplateColumns:
                                                                '40px 1fr 120px 80px 60px 40px',
                                                            gap: '6px',
                                                            padding: '8px 10px',
                                                            alignItems: 'center',
                                                            borderTop:
                                                                itemIdx === 0
                                                                    ? 'none'
                                                                    : '1px solid #eee',
                                                            opacity: item.showInLegend
                                                                ? 1
                                                                : 0.5,
                                                        } }
                                                    >
                                                        <div style={ { textAlign: 'center' } }>
                                                            <CheckboxControl
                                                                checked={ Boolean(
                                                                    item.showInLegend
                                                                ) }
                                                                onChange={ ( checked ) =>
                                                                    handleToggleItem(
                                                                        section.id,
                                                                        item.id,
                                                                        checked
                                                                    )
                                                                }
                                                                __nextHasNoMarginBottom
                                                            />
                                                        </div>

                                                        <div>
                                                            <strong style={ { fontSize: '12px' } }>
                                                                { item.label }
                                                            </strong>
                                                            { item.type === 'merged' && (
                                                                <span
                                                                    style={ {
                                                                        fontSize: '10px',
                                                                        color: '#2271b1',
                                                                        marginLeft: '6px',
                                                                        background: '#f0f6fb',
                                                                        padding: '2px 4px',
                                                                        borderRadius: '3px',
                                                                    } }
                                                                >
                                                                    { sprintf(
                                                                        __( '[Merged %d]', TEXT_DOMAIN ),
                                                                        item.categories.length
                                                                    ) }
                                                                </span>
                                                            ) }
                                                        </div>

                                                        <div>
                                                            <SelectControl
                                                                value={ section.id }
                                                                options={ sectionDropdownOptions }
                                                                onChange={ ( newSecId ) =>
                                                                    handleTransferItemToSection(
                                                                        section.id,
                                                                        item.id,
                                                                        newSecId
                                                                    )
                                                                }
                                                                style={ {
                                                                    height: '28px',
                                                                    fontSize: '11px',
                                                                    padding: '0 4px',
                                                                } }
                                                                __nextHasNoMarginBottom
                                                            />
                                                        </div>

                                                        <Flex align="center" gap={ 1 }>
                                                            { item.categories.map( ( ck ) => {
                                                                const catColor =
                                                                    categoryMap[ ck ]?.color ||
                                                                    '#007cba';
                                                                return (
                                                                    <div
                                                                        key={ ck }
                                                                        title={ `${
                                                                            categoryMap[ ck ]?.label || ck
                                                                        } (${ catColor })` }
                                                                        style={ {
                                                                            width: '14px',
                                                                            height: '14px',
                                                                            borderRadius: '50%',
                                                                            background: catColor,
                                                                            border: '1px solid #ccc',
                                                                        } }
                                                                    />
                                                                );
                                                            } ) }
                                                        </Flex>

                                                        <Flex justify="center" gap={ 1 }>
                                                            <Button
                                                                isSmall
                                                                icon="arrow-up-alt2"
                                                                disabled={ isFirst }
                                                                onClick={ () =>
                                                                    handleMoveItemOrder(
                                                                        secIdx,
                                                                        itemIdx,
                                                                        -1
                                                                    )
                                                                }
                                                            />
                                                            <Button
                                                                isSmall
                                                                icon="arrow-down-alt2"
                                                                disabled={ isLast }
                                                                onClick={ () =>
                                                                    handleMoveItemOrder(
                                                                        secIdx,
                                                                        itemIdx,
                                                                        1
                                                                    )
                                                                }
                                                            />
                                                        </Flex>

                                                        <div style={ { textAlign: 'center' } }>
                                                            { item.type === 'merged' ? (
                                                                <Button
                                                                    isSmall
                                                                    isDestructive
                                                                    icon="editor-break"
                                                                    onClick={ () =>
                                                                        handleUnmergeItem(
                                                                            section.id,
                                                                            item.id
                                                                        )
                                                                    }
                                                                    label={ __( 'Unmerge', TEXT_DOMAIN ) }
                                                                />
                                                            ) : (
                                                                <Button
                                                                    isSmall
                                                                    isDestructive
                                                                    icon="no-alt"
                                                                    onClick={ () =>
                                                                        handleRemoveItem(
                                                                            section.id,
                                                                            item.id
                                                                        )
                                                                    }
                                                                    label={ __( 'Remove from Legend', TEXT_DOMAIN ) }
                                                                />
                                                            ) }
                                                        </div>
                                                    </div>
                                                );
                                            } )
                                        ) }
                                    </div>
                                </div>
                            ) )
                        ) }

                        { /* ADD NEW SECTION FIELD */ }
                        <div
                            style={ {
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-end',
                                paddingTop: '15px',
                                borderTop: '1px solid #eee',
                            } }
                        >
                            <div style={ { flex: 1 } }>
                                <TextControl
                                    label={ __( 'Add Custom Legend Section', TEXT_DOMAIN ) }
                                    placeholder="e.g. Residential, Amenities, Facilities"
                                    value={ newSectionTitle }
                                    onChange={ setNewSectionTitle }
                                    style={ { height: '36px' } }
                                    __nextHasNoMarginBottom
                                />
                            </div>
                            <Button
                                variant="secondary"
                                icon="plus-alt"
                                onClick={ handleAddSection }
                                disabled={ ! newSectionTitle.trim() }
                                style={ { height: '36px' } }
                            >
                                { __( 'Add Section', TEXT_DOMAIN ) }
                            </Button>
                        </div>
                    </div>

                    { /* RIGHT COLUMN: AVAILABLE CATEGORIES PALETTE */ }
                    <div
                        style={ {
                            background: '#fcfcfc',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            padding: '14px',
                        } }
                    >
                        <h3
                            style={ {
                                fontSize: '13px',
                                fontWeight: '700',
                                marginTop: 0,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                color: '#444',
                            } }
                        >
                            { __( 'Available Layer Categories', TEXT_DOMAIN ) }
                        </h3>

                        { Object.keys( availableCategoriesByLayer ).length === 0 ? (
                            <p style={ { fontSize: '12px', color: '#888', fontStyle: 'italic' } }>
                                { __( 'No layer categories discovered.', TEXT_DOMAIN ) }
                            </p>
                        ) : (
                            Object.keys( availableCategoriesByLayer ).map( ( layerKey ) => {
                                const catList = availableCategoriesByLayer[ layerKey ];
                                const layerTitle = LAYER_TITLES[ layerKey ] || layerKey.toUpperCase();

                                return (
                                    <div key={ layerKey } style={ { marginBottom: '16px' } }>
                                        <div
                                            style={ {
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: '#2271b1',
                                                marginBottom: '6px',
                                                paddingBottom: '3px',
                                                borderBottom: '1px solid #e0e0e0',
                                            } }
                                        >
                                            { layerTitle }
                                        </div>

                                        <div style={ { display: 'flex', flexDirection: 'column', gap: '6px' } }>
                                            { catList.map( ( cat ) => {
                                                const { compositeKey, label, color, isAssigned } = cat;
                                                const catSlug = compositeKey.includes( '::' )
                                                    ? compositeKey.split( '::' )[ 1 ]
                                                    : compositeKey;

                                                return (
                                                    <div
                                                        key={ compositeKey }
                                                        style={ {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '6px 8px',
                                                            gap: '10px',
                                                            background: isAssigned ? '#f0f0f0' : '#fff',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '3px',
                                                            opacity: isAssigned ? 0.6 : 1,
                                                        } }
                                                    >
                                                        <Flex align="center" gap={ 2 } style={ { minWidth: 0, flex: 1 } }>
                                                            <div
                                                                style={ {
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    borderRadius: '50%',
                                                                    background: color || '#007cba',
                                                                    border: '1px solid #ccc',
                                                                    flexShrink: 0,
                                                                } }
                                                            />
                                                            <span
                                                                style={ {
                                                                    fontSize: '11px',
                                                                    fontWeight: '500',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                } }
                                                                title={ label || catSlug }
                                                            >
                                                                { label || catSlug }
                                                            </span>
                                                        </Flex>

                                                        { ! isAssigned && (
                                                            <Button
                                                                isSmall
                                                                variant="tertiary"
                                                                icon="plus-alt"
                                                                onClick={ () => handleAddCategoryToLegend( compositeKey ) }
                                                                label={ __( 'Add to Legend', TEXT_DOMAIN ) }
                                                                style={ {
                                                                    height: '24px',
                                                                    minWidth: '24px',
                                                                    padding: 0,
                                                                    flexShrink: 0,
                                                                } }
                                                            />
                                                        ) }
                                                    </div>
                                                );
                                            } ) }
                                        </div>
                                    </div>
                                );
                            } )
                        ) }
                    </div>
                </div>
            ) }

            { /* MODAL: MERGE CATEGORIES */ }
            { showMergeModal && (
                <Modal
                    title={ __( 'Merge Categories into Single Legend Entry', TEXT_DOMAIN ) }
                    onRequestClose={ () => setShowMergeModal( false ) }
                    style={ { maxWidth: '500px', width: '100%' } }
                >
                    <div style={ { display: 'flex', flexDirection: 'column', gap: '15px' } }>
                        <TextControl
                            label={ __( 'Unified Legend Entry Label', TEXT_DOMAIN ) }
                            placeholder="e.g. Indoor Pathing Systems"
                            value={ mergeLabel }
                            onChange={ setMergeLabel }
                        />

                        <SelectControl
                            label={ __( 'Target Legend Section Group', TEXT_DOMAIN ) }
                            value={ targetSectionId }
                            options={ ( legendConfig.sections || [] ).map( ( s ) => ( {
                                label: s.title,
                                value: s.id,
                            } ) ) }
                            onChange={ setTargetSectionId }
                        />

                        <div>
                            <label
                                style={ {
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    color: '#666',
                                    display: 'block',
                                    marginBottom: '8px',
                                } }
                            >
                                { __( 'Select Categories to Merge (At least 2)', TEXT_DOMAIN ) }
                            </label>
                            <div
                                style={ {
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid #eee',
                                    padding: '10px',
                                    borderRadius: '4px',
                                } }
                            >
                                { allCategoryKeys.map( ( compositeKey ) => {
                                    const isChecked = selectedMergeCats.includes( compositeKey );
                                    const isAlreadyMerged = alreadyMergedCategorySet.has( compositeKey );
                                    const catInfo = categoryMap[ compositeKey ] || {};

                                    return (
                                        <div
                                            key={ `merge_wrap_${ compositeKey }` }
                                            style={ { opacity: isAlreadyMerged ? 0.5 : 1 } }
                                        >
                                            <CheckboxControl
                                                label={ `${ catInfo.label || compositeKey } [${
                                                    catInfo.layer_type || 'buildings'
                                                }] ${
                                                    isAlreadyMerged
                                                        ? __( '(Already Merged)', TEXT_DOMAIN )
                                                        : ''
                                                }` }
                                                checked={ isChecked }
                                                disabled={ isAlreadyMerged }
                                                onChange={ ( checked ) => {
                                                    if ( checked ) {
                                                        setSelectedMergeCats( ( prev ) => [
                                                            ...prev,
                                                            compositeKey,
                                                        ] );
                                                    } else {
                                                        setSelectedMergeCats( ( prev ) =>
                                                            prev.filter( ( s ) => s !== compositeKey )
                                                        );
                                                    }
                                                } }
                                            />
                                        </div>
                                    );
                                } ) }
                            </div>
                        </div>

                        <Flex
                            justify="flex-end"
                            style={ {
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid #eee',
                            } }
                        >
                            <Button variant="tertiary" onClick={ () => setShowMergeModal( false ) }>
                                { __( 'Cancel', TEXT_DOMAIN ) }
                            </Button>
                            <Button
                                variant="primary"
                                onClick={ handleConfirmMergeCategories }
                                disabled={
                                    ! mergeLabel.trim() || selectedMergeCats.length < 2
                                }
                            >
                                { __( 'Merge into Single Item', TEXT_DOMAIN ) }
                            </Button>
                        </Flex>
                    </div>
                </Modal>
            ) }
        </div>
    );
};