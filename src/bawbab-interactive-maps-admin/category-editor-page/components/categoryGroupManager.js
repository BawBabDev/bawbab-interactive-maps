import { useState } from '@wordpress/element';
import {
    Button,
    TextControl,
    SelectControl,
    Flex,
    FlexItem,
    __experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const CategoryGroupManager = ( {
    groups,
    setGroups,
    categoryMap,
    setCategoryMap,
} ) => {
    const [ newGroupTitle, setNewGroupTitle ] = useState( '' );

    const handleAddGroup = () => {
        if ( ! newGroupTitle.trim() ) return;
        const newId = `group_${ Date.now() }`;
        setGroups( [
            ...groups,
            { id: newId, title: newGroupTitle.trim(), displayType: 'flat' },
        ] );
        setNewGroupTitle( '' );
    };

    const handleRemoveGroup = ( groupId ) => {
        if ( groups.length <= 1 ) {
            alert(
                __( 'You must keep at least one category group.', 'bawbab-interactive-maps' )
            );
            return;
        }

        const fallbackGroupId =
            groups.find( ( g ) => g.id !== groupId )?.id || '';
        const updatedGroups = groups.filter( ( g ) => g.id !== groupId );

        const updatedMap = { ...categoryMap };
        Object.keys( updatedMap ).forEach( ( cat ) => {
            if ( updatedMap[ cat ].groupId === groupId ) {
                updatedMap[ cat ] = {
                    ...updatedMap[ cat ],
                    groupId: fallbackGroupId,
                };
            }
        } );

        setGroups( updatedGroups );
        setCategoryMap( updatedMap );
    };

    const handleUpdateGroup = ( groupId, key, value ) => {
        setGroups( ( prev ) =>
            prev.map( ( g ) =>
                g.id === groupId ? { ...g, [ key ]: value } : g
            )
        );
    };

    return (
        <div className="tab-content">
            <h2
                style={ {
                    fontSize: '16px',
                    fontWeight: '700',
                    marginTop: 0,
                    marginBottom: '8px',
                } }
            >
                { __( 'Category Navigation Groups', 'bawbab-interactive-maps' ) }
            </h2>
            <Text
                variant="caption"
                display="block"
                style={ {
                    color: '#666',
                    marginBottom: '20px',
                } }
            >
                { __(
                    'Groups structure top-level navigation tabs and side drawer accordions on the public map.',
                    'bawbab-interactive-maps'
                ) }
            </Text>

            { /* REGISTER NEW GROUP FORM CARD */ }
            <div
                style={ {
                    padding: '16px',
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    marginBottom: '25px',
                } }
            >
                <Text
                    variant="label"
                    display="block"
                    style={ { fontWeight: '600', marginBottom: '12px' } }
                >
                    { __( 'Create New Category Group', 'bawbab-interactive-maps' ) }
                </Text>

                <div
                    style={ {
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-end',
                    } }
                >
                    <div style={ { flex: 1 } }>
                        <TextControl
                            label={ __( 'Group Title', 'bawbab-interactive-maps' ) }
                            placeholder={ __(
                                'e.g. Wellness Centers or Dining',
                                'bawbab-interactive-maps'
                            ) }
                            value={ newGroupTitle }
                            onChange={ setNewGroupTitle }
                            style={ { height: '36px', minHeight: '36px' } }
                            __nextHasNoMarginBottom
                        />
                    </div>
                    <Button
                        variant="primary"
                        icon="plus-alt"
                        onClick={ handleAddGroup }
                        disabled={ ! newGroupTitle.trim() }
                        style={ {
                            height: '36px',
                            minHeight: '36px',
                            padding: '0 16px',
                        } }
                    >
                        { __( 'Add Group', 'bawbab-interactive-maps' ) }
                    </Button>
                </div>
            </div>

            { /* GROUPS LIST */ }
            <div
                style={ {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                } }
            >
                { groups.map( ( group ) => (
                    <div
                        key={ group.id }
                        style={ {
                            padding: '12px 15px',
                            background: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                        } }
                    >
                        <Flex
                            align="center"
                            justify="space-between"
                            gap={ 3 }
                        >
                            <FlexItem style={ { flex: 1 } }>
                                <TextControl
                                    label={ __( 'Group Title', 'bawbab-interactive-maps' ) }
                                    value={ group.title }
                                    onChange={ ( val ) =>
                                        handleUpdateGroup(
                                            group.id,
                                            'title',
                                            val
                                        )
                                    }
                                    style={ { height: '36px' } }
                                    __nextHasNoMarginBottom
                                />
                            </FlexItem>

                            <FlexItem
                                style={ { width: '220px' } }
                                className="select-control-wrapper"
                            >
                                <SelectControl
                                    label={ __( 'Layout Type', 'bawbab-interactive-maps' ) }
                                    value={ group.displayType || 'flat' }
                                    options={ [
                                        {
                                            label: __(
                                                'Nested Accordion (Grouped)',
                                                'bawbab-interactive-maps'
                                            ),
                                            value: 'grouped',
                                        },
                                        {
                                            label: __(
                                                'Flat List (Single Items)',
                                                'bawbab-interactive-maps'
                                            ),
                                            value: 'flat',
                                        },
                                    ] }
                                    onChange={ ( val ) =>
                                        handleUpdateGroup(
                                            group.id,
                                            'displayType',
                                            val
                                        )
                                    }
                                    style={ {
                                        height: '36px',
                                        minHeight: '36px',
                                        lineHeight: '36px',
                                        padding: '0 8px',
                                        marginTop: 0,
                                    } }
                                    __nextHasNoMarginBottom
                                />
                            </FlexItem>

                            <FlexItem
                                style={ {
                                    alignSelf: 'flex-end',
                                    marginBottom: '2px',
                                } }
                            >
                                <Button
                                    isDestructive
                                    isSmall
                                    icon="trash"
                                    onClick={ () =>
                                        handleRemoveGroup( group.id )
                                    }
                                    label={ __(
                                        'Delete Group',
                                        'bawbab-interactive-maps'
                                    ) }
                                    style={ {
                                        height: '36px',
                                        minWidth: '36px',
                                    } }
                                />
                            </FlexItem>
                        </Flex>
                    </div>
                ) ) }
            </div>
        </div>
    );
};