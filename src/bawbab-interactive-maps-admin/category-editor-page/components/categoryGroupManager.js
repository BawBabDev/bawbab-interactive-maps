import { useState } from '@wordpress/element';
import {
    Button,
    TextControl,
    SelectControl,
    Flex,
    FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

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
                __( 'You must keep at least one category group.', TEXT_DOMAIN )
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
                { __( 'Category Navigation Groups', TEXT_DOMAIN ) }
            </h2>
            <p
                style={ {
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '20px',
                } }
            >
                { __(
                    'Groups structure top-level navigation tabs and side drawer accordions on the public map.',
                    TEXT_DOMAIN
                ) }
            </p>

            <div
                style={ {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px',
                } }
            >
                { groups.map( ( group ) => (
                    <div
                        key={ group.id }
                        style={ {
                            padding: '12px 15px',
                            background: '#f9f9f9',
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
                                    label={ __(
                                        'Group Title',
                                        TEXT_DOMAIN
                                    ) }
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
                            <FlexItem style={ { width: '220px' } }>
                                <SelectControl
                                    label={ __(
                                        'Layout Type',
                                        TEXT_DOMAIN
                                    ) }
                                    value={ group.displayType || 'flat' }
                                    options={ [
                                        {
                                            label: __(
                                                'Nested Accordion (Grouped)',
                                                TEXT_DOMAIN
                                            ),
                                            value: 'grouped',
                                        },
                                        {
                                            label: __(
                                                'Flat List (Single Items)',
                                                TEXT_DOMAIN
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
                                    style={ { height: '36px' } }
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
                                        TEXT_DOMAIN
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
                        label={ __(
                            'Create New Group Title',
                            TEXT_DOMAIN
                        ) }
                        placeholder="e.g. Wellness Centers or Dining"
                        value={ newGroupTitle }
                        onChange={ setNewGroupTitle }
                        style={ { height: '36px' } }
                        __nextHasNoMarginBottom
                    />
                </div>
                <Button
                    variant="secondary"
                    icon="plus-alt"
                    onClick={ handleAddGroup }
                    disabled={ ! newGroupTitle.trim() }
                    style={ { height: '36px' } }
                >
                    { __( 'Add Group', TEXT_DOMAIN ) }
                </Button>
            </div>
        </div>
    );
};