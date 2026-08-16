import { useState, useMemo } from '@wordpress/element';
import {
    Button,
    TextControl,
    SelectControl,
    Flex,
    ColorPicker,
    Dropdown,
    Modal,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const LAYER_LABELS = {
    buildings: __( 'Buildings Layer', TEXT_DOMAIN ),
    land_use: __( 'Land Use Layer', TEXT_DOMAIN ),
    paths: __( 'Pathways Layer', TEXT_DOMAIN ),
    parcels: __( 'Parcels Layer', TEXT_DOMAIN ),
    entries: __( 'Entries Layer', TEXT_DOMAIN ),
};

export const CategoryMappingTable = ( {
    groups,
    categoryMap,
    setCategoryMap,
} ) => {
    const [ showAddCatModal, setShowAddCatModal ] = useState( false );
    const [ newCatLabel, setNewCatLabel ] = useState( '' );
    const [ newCatGroupId, setNewCatGroupId ] = useState( '' );
    const [ newCatLayerType, setNewCatLayerType ] = useState( 'buildings' );
    const [ newCatColor, setNewCatColor ] = useState( '#007cba' );

    const derivedCatSlug = ( newCatLabel || '' )
        .trim()
        .toLowerCase()
        .replace( /[^a-z0-9\s_]/g, '' )
        .replace( /\s+/g, '_' );

    const handleUpdateCategory = ( compositeKey, key, value ) => {
        setCategoryMap( ( prev ) => ( {
            ...prev,
            [ compositeKey ]: {
                ...( prev[ compositeKey ] || {} ),
                [ key ]: value,
            },
        } ) );
    };

    const handleConfirmAddCategory = () => {
        if ( ! newCatLabel.trim() || ! derivedCatSlug ) return;

        const compositeKey = `${ newCatLayerType }::${ derivedCatSlug }`;

        if ( categoryMap[ compositeKey ] ) {
            alert(
                __(
                    'A category with this database slug already exists in this layer.',
                    TEXT_DOMAIN
                )
            );
            return;
        }

        setCategoryMap( ( prev ) => ( {
            ...prev,
            [ compositeKey ]: {
                label: newCatLabel.trim(),
                groupId: newCatGroupId,
                layer_type: newCatLayerType,
                color: newCatColor,
            },
        } ) );

        setNewCatLabel( '' );
        setNewCatGroupId( '' );
        setNewCatLayerType( 'buildings' );
        setNewCatColor( '#007cba' );
        setShowAddCatModal( false );
    };

    const groupOptions = [
        {
            label: __(
                '-- Unassigned / Hidden from Public Menu --',
                TEXT_DOMAIN
            ),
            value: '',
        },
        ...groups.map( ( g ) => ( { label: g.title, value: g.id } ) ),
    ];

    // Group categories strictly by layer_type, never dropping valid keys
    const categoriesByLayer = useMemo( () => {
        const grouped = {};
        Object.keys( categoryMap ).forEach( ( compositeKey ) => {
            const info = categoryMap[ compositeKey ] || {};
            const layer =
                info.layer_type ||
                ( compositeKey.includes( '::' )
                    ? compositeKey.split( '::' )[ 0 ]
                    : 'buildings' );

            if ( ! grouped[ layer ] ) grouped[ layer ] = [];
            grouped[ layer ].push( { compositeKey, ...info } );
        } );
        return grouped;
    }, [ categoryMap ] );

    const activeLayers = Object.keys( categoriesByLayer );

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
                { __(
                    'Spatial Categories Configuration (Grouped by Layer)',
                    TEXT_DOMAIN
                ) }
            </h2>

            <Flex
                justify="space-between"
                align="center"
                style={ { marginBottom: '20px' } }
            >
                <p style={ { fontSize: '13px', color: '#666', margin: 0 } }>
                    { __(
                        'Categories map 1-to-1 to navigation groups and set feature colors for each layer.',
                        TEXT_DOMAIN
                    ) }
                </p>
                <Button
                    variant="secondary"
                    icon="plus-alt"
                    onClick={ () => setShowAddCatModal( true ) }
                >
                    { __( 'Add Category', TEXT_DOMAIN ) }
                </Button>
            </Flex>

            { activeLayers.length === 0 ? (
                <p
                    style={ {
                        fontStyle: 'italic',
                        color: '#888',
                        textAlign: 'center',
                        padding: '20px',
                    } }
                >
                    { __(
                        'No categories found. Click "Add Category" above or import spatial features.',
                        TEXT_DOMAIN
                    ) }
                </p>
            ) : (
                activeLayers.map( ( layerKey ) => {
                    const items = categoriesByLayer[ layerKey ];
                    const layerTitle =
                        LAYER_LABELS[ layerKey ] ||
                        `${ layerKey.toUpperCase() } Layer`;

                    return (
                        <div
                            key={ layerKey }
                            style={ {
                                marginBottom: '20px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                overflow: 'hidden',
                            } }
                        >
                            <div
                                style={ {
                                    padding: '8px 12px',
                                    background: '#e8f0f8',
                                    borderBottom: '1px solid #d0e0f0',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    color: '#1d2327',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                } }
                            >
                                <span>{ layerTitle }</span>
                                <span
                                    style={ {
                                        fontSize: '11px',
                                        fontWeight: 'normal',
                                        color: '#666',
                                    } }
                                >
                                    { sprintf(
                                        __( '%d categories', TEXT_DOMAIN ),
                                        items.length
                                    ) }
                                </span>
                            </div>

                            <div
                                style={ {
                                    display: 'grid',
                                    gridTemplateColumns:
                                        '160px 1fr 240px 80px',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    background: '#f5f5f5',
                                    borderBottom: '1px solid #e0e0e0',
                                    fontWeight: '600',
                                    fontSize: '11px',
                                    color: '#555',
                                } }
                            >
                                <span>
                                    { __( 'Database Slug', TEXT_DOMAIN ) }
                                </span>
                                <span>
                                    { __( 'Display Label', TEXT_DOMAIN ) }
                                </span>
                                <span>
                                    { __( 'Assigned Group', TEXT_DOMAIN ) }
                                </span>
                                <span style={ { textAlign: 'center' } }>
                                    { __( 'Color', TEXT_DOMAIN ) }
                                </span>
                            </div>

                            { items.map( ( catItem, index ) => {
                                const { compositeKey } = catItem;
                                const catSlug = compositeKey.includes( '::' )
                                    ? compositeKey.split( '::' )[ 1 ]
                                    : compositeKey;
                                const currentColor =
                                    catItem.color || '#007cba';
                                const isLast = index === items.length - 1;

                                return (
                                    <div
                                        key={ compositeKey }
                                        style={ {
                                            display: 'grid',
                                            gridTemplateColumns:
                                                '160px 1fr 240px 80px',
                                            gap: '12px',
                                            padding: '8px 12px',
                                            alignItems: 'center',
                                            borderBottom: isLast
                                                ? 'none'
                                                : '1px solid #eee',
                                            background:
                                                index % 2 === 0
                                                    ? '#fff'
                                                    : '#fafafa',
                                        } }
                                    >
                                        <code
                                            style={ {
                                                background: '#f0f0f0',
                                                padding: '3px 6px',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                width: 'fit-content',
                                            } }
                                        >
                                            { catSlug }
                                        </code>

                                        <TextControl
                                            value={ catItem.label || '' }
                                            onChange={ ( val ) =>
                                                handleUpdateCategory(
                                                    compositeKey,
                                                    'label',
                                                    val
                                                )
                                            }
                                            placeholder={ catSlug }
                                            style={ { height: '32px' } }
                                            __nextHasNoMarginBottom
                                        />

                                        <SelectControl
                                            value={
                                                catItem.groupId !== undefined
                                                    ? catItem.groupId
                                                    : ''
                                            }
                                            options={ groupOptions }
                                            onChange={ ( val ) =>
                                                handleUpdateCategory(
                                                    compositeKey,
                                                    'groupId',
                                                    val
                                                )
                                            }
                                            style={ { height: '32px' } }
                                            __nextHasNoMarginBottom
                                        />

                                        <div
                                            style={ {
                                                textAlign: 'center',
                                            } }
                                        >
                                            <Dropdown
                                                renderToggle={ ( {
                                                    isOpen: isDropdownOpen,
                                                    onToggle: toggleDropdown,
                                                } ) => (
                                                    <Button
                                                        onClick={
                                                            toggleDropdown
                                                        }
                                                        aria-expanded={
                                                            isDropdownOpen
                                                        }
                                                        style={ {
                                                            width: '26px',
                                                            height: '26px',
                                                            minWidth: '26px',
                                                            padding: 0,
                                                            borderRadius: '4px',
                                                            background:
                                                                currentColor,
                                                            border:
                                                                '2px solid #fff',
                                                            boxShadow:
                                                                '0 0 0 1px #ccc',
                                                            cursor: 'pointer',
                                                        } }
                                                    />
                                                ) }
                                                renderContent={ () => (
                                                    <div
                                                        style={ {
                                                            padding: '12px',
                                                        } }
                                                    >
                                                        <ColorPicker
                                                            color={
                                                                currentColor
                                                            }
                                                            onChangeComplete={ (
                                                                val
                                                            ) =>
                                                                handleUpdateCategory(
                                                                    compositeKey,
                                                                    'color',
                                                                    val.hex
                                                                )
                                                            }
                                                            disableAlpha
                                                        />
                                                    </div>
                                                ) }
                                            />
                                        </div>
                                    </div>
                                );
                            } ) }
                        </div>
                    );
                } )
            ) }

            { /* MODAL: ADD CUSTOM CATEGORY */ }
            { showAddCatModal && (
                <Modal
                    title={ __( 'Add New Category', TEXT_DOMAIN ) }
                    onRequestClose={ () => setShowAddCatModal( false ) }
                    style={ { maxWidth: '500px', width: '100%' } }
                >
                    <div
                        style={ {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                        } }
                    >
                        <TextControl
                            label={ __( 'Category Label Name', TEXT_DOMAIN ) }
                            placeholder="e.g. Electric Vehicle Charging"
                            value={ newCatLabel }
                            onChange={ setNewCatLabel }
                            help={
                                derivedCatSlug
                                    ? sprintf(
                                          __(
                                              'Database Slug: %s',
                                              TEXT_DOMAIN
                                          ),
                                          derivedCatSlug
                                      )
                                    : ''
                            }
                        />

                        <SelectControl
                            label={ __( 'Target Layer Type', TEXT_DOMAIN ) }
                            value={ newCatLayerType }
                            options={ [
                                {
                                    label: __( 'Buildings', TEXT_DOMAIN ),
                                    value: 'buildings',
                                },
                                {
                                    label: __( 'Land Use', TEXT_DOMAIN ),
                                    value: 'land_use',
                                },
                                {
                                    label: __( 'Pathways', TEXT_DOMAIN ),
                                    value: 'paths',
                                },
                                {
                                    label: __( 'Parcels', TEXT_DOMAIN ),
                                    value: 'parcels',
                                },
                            ] }
                            onChange={ setNewCatLayerType }
                        />

                        <SelectControl
                            label={ __(
                                'Assigned Navigation Group',
                                TEXT_DOMAIN
                            ) }
                            value={ newCatGroupId }
                            options={ groupOptions }
                            onChange={ setNewCatGroupId }
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
                                { __( 'Category Fill Color', TEXT_DOMAIN ) }
                            </label>
                            <Flex align="center" gap={ 3 }>
                                <div
                                    style={ {
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '4px',
                                        background: newCatColor,
                                        border: '1px solid #ccc',
                                    } }
                                />
                                <ColorPicker
                                    color={ newCatColor }
                                    onChangeComplete={ ( val ) =>
                                        setNewCatColor( val.hex )
                                    }
                                    disableAlpha
                                />
                            </Flex>
                        </div>

                        <Flex
                            justify="flex-end"
                            style={ {
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid #eee',
                            } }
                        >
                            <Button
                                variant="tertiary"
                                onClick={ () => setShowAddCatModal( false ) }
                            >
                                { __( 'Cancel', TEXT_DOMAIN ) }
                            </Button>
                            <Button
                                variant="primary"
                                onClick={ handleConfirmAddCategory }
                                disabled={ ! newCatLabel.trim() }
                            >
                                { __( 'Add Category', TEXT_DOMAIN ) }
                            </Button>
                        </Flex>
                    </div>
                </Modal>
            ) }
        </div>
    );
};