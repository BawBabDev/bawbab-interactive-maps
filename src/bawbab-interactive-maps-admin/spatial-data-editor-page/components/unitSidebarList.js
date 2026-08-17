import { __ } from '@wordpress/i18n';
import {
    Flex,
    Button,
    Spinner,
    PanelBody,
    Dashicon,
} from '@wordpress/components';
import { FeatureSearchFilter } from './featureSearchFilter';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const UnitSidebarList = ( {
    selectedLayer,
    setSelectedLayer,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    filterCategory,
    setFilterCategory,
    categories,
    discoveredAttributes,
    dynamicFilters,
    handleDynamicFilterChange,
    formatLabel,
    onOpenSchema,
    sidebarListRef,
    isLoading,
    displayStructure,
    openedTopTab,
    setOpenedGroup,
    openedSubGroup,
    setOpenedSubGroup,
    activeFeature,
    setActiveFeature,
    setActiveNavTab,
    isCurrentDraftDirty,
    isSaving,
    hasActiveFeatureDirtyKeys,
    onOpenCancelModal,
    onOpenConfirmModal,
    onOpenBatchModal,
} ) => {
    const renderFeatureItem = ( f ) => {
        const isActive =
            activeFeature?.properties.fid === f.properties.fid &&
            activeFeature?.properties.layer_type === f.properties.layer_type;

        // Prioritize code as primary identifier, falling back to name
        let itemLabel = f.properties.code
            ? `${ __( 'Unit', TEXT_DOMAIN ) } ${ f.properties.code }`
            : f.properties.name;
            
        if ( ! itemLabel ) {
            itemLabel = `${ f.properties.layer_type } #${ f.properties.fid }`;
        }

        return (
            <div
                id={ `item-${ f.properties.layer_type }-${ f.properties.fid }` }
                key={ `${ f.properties.layer_type }-${ f.properties.fid }` }
                onClick={ () => {
                    setActiveFeature( f );
                    setActiveNavTab( 'editor' );
                } }
                style={ {
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    background: isActive ? '#f0f6fb' : '#fff',
                    borderTop: '1px solid',
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: isActive ? '#2271b1' : '#e0e0e0',
                    borderLeft: `4px solid ${
                        isActive ? '#2271b1' : '#f0f0f0'
                    }`,
                    transition: 'all 0.2s ease',
                } }
            >
                <div
                    style={ {
                        fontWeight: isActive ? '600' : '400',
                        fontSize: '13px',
                        color: '#1d2327',
                    } }
                >
                    { itemLabel }
                </div>
                { ( ! f.properties.code || ! f.properties.name ) && (
                    <div
                        style={ {
                            fontSize: '10px',
                            color: '#666',
                            marginTop: '2px',
                        } }
                    >
                        { formatLabel(
                            f.properties.category || f.properties.layer_type
                        ) }
                    </div>
                ) }
            </div>
        );
    };

    return (
        <div
            style={ {
                flex: '0 0 350px',
                width: '350px',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            } }
        >
            { /* SEARCH & FILTER CONTROLS SUBCOMPONENT */ }
            <FeatureSearchFilter
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
                onOpenSchema={ onOpenSchema }
            />

            { /* SCROLLABLE ACCORDION LIST */ }
            <div
                ref={ sidebarListRef }
                style={ {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                } }
            >
                { isLoading ? (
                    <Flex justify="center" style={ { padding: '20px' } }>
                        <Spinner />
                    </Flex>
                ) : displayStructure.length === 0 ? (
                    <div
                        style={ {
                            textAlign: 'center',
                            padding: '30px 15px',
                            color: '#666',
                        } }
                    >
                        <Dashicon
                            icon="search"
                            size={ 32 }
                            style={ {
                                marginBottom: '10px',
                                color: '#999',
                            } }
                        />
                        <p
                            style={ {
                                fontStyle: 'italic',
                                margin: 0,
                                fontSize: '13px',
                            } }
                        >
                            { __(
                                'No units found matching your search or active filters.',
                                TEXT_DOMAIN
                            ) }
                        </p>
                    </div>
                ) : (
                    displayStructure.map( ( topTab ) => (
                        <PanelBody
                            key={ topTab.id }
                            title={ `${ topTab.title } (${ topTab.totalCount })` }
                            opened={ openedTopTab === topTab.id }
                            onToggle={ () =>
                                setOpenedGroup( ( prev ) =>
                                    prev === topTab.id ? null : topTab.id
                                )
                            }
                        >
                            { topTab.subGroups.map( ( subGroup ) => (
                                <div
                                    key={ subGroup.id }
                                    style={ {
                                        marginLeft: '10px',
                                        marginBottom: '8px',
                                        borderLeft: '2px solid #2271b1',
                                        paddingLeft: '8px',
                                    } }
                                >
                                    <div
                                        onClick={ () =>
                                            setOpenedSubGroup( ( prev ) => ( {
                                                ...prev,
                                                [ subGroup.id ]:
                                                    ! prev[ subGroup.id ],
                                            } ) )
                                        }
                                        style={ {
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            padding: '6px 0',
                                            color: '#2271b1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        } }
                                    >
                                        <span>
                                            { subGroup.title } (
                                            { subGroup.items.length })
                                        </span>
                                        <Dashicon
                                            icon={
                                                openedSubGroup[
                                                    subGroup.id
                                                ] === true
                                                    ? 'arrow-up-alt2'
                                                    : 'arrow-down-alt2'
                                            }
                                            size={ 14 }
                                        />
                                    </div>

                                    { openedSubGroup[ subGroup.id ] ===
                                        true && (
                                        <div style={ { marginTop: '4px' } }>
                                            { subGroup.items.map( ( f ) =>
                                                renderFeatureItem( f )
                                            ) }
                                        </div>
                                    ) }
                                </div>
                            ) ) }

                            { topTab.flatItems.map( ( f ) =>
                                renderFeatureItem( f )
                            ) }
                        </PanelBody>
                    ) )
                ) }
            </div>

            { /* STATIC ACTION FOOTER PINNED AT BOTTOM LEFT OF UNIT SIDEBAR */ }
            <div
                style={ {
                    padding: '12px 10px',
                    borderTop: '1px solid #e0e0e0',
                    background: '#fcfcfc',
                    flexShrink: 0,
                    zIndex: 10,
                } }
            >
                <Flex align="center" justify="space-between" gap={ 1.5 }>
                    { /* DISCARD CHANGES BUTTON */ }
                    <Button
                        variant="secondary"
                        onClick={ onOpenCancelModal }
                        disabled={ ! isCurrentDraftDirty || isSaving }
                        style={ {
                            height: '38px',
                            flex: '1 1 0%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            opacity: isCurrentDraftDirty ? 1 : 0.4,
                            cursor: isCurrentDraftDirty ? 'pointer' : 'default',
                            pointerEvents: isCurrentDraftDirty
                                ? 'auto'
                                : 'none',
                            padding: '0 4px',
                        } }
                    >
                        { __( 'Discard', TEXT_DOMAIN ) }
                    </Button>

                    { /* SAVE ALL CHANGES BUTTON */ }
                    <Button
                        variant="primary"
                        onClick={ onOpenConfirmModal }
                        isBusy={ isSaving }
                        disabled={ ! isCurrentDraftDirty || isSaving }
                        style={ {
                            height: '38px',
                            flex: '1 1 0%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            opacity: isCurrentDraftDirty ? 1 : 0.4,
                            cursor: isCurrentDraftDirty ? 'pointer' : 'default',
                            pointerEvents: isCurrentDraftDirty
                                ? 'auto'
                                : 'none',
                            padding: '0 4px',
                        } }
                    >
                        { isSaving
                            ? __( 'Saving...', TEXT_DOMAIN )
                            : __( 'Save All', TEXT_DOMAIN ) }
                    </Button>

                    { /* BATCH SYNC BUTTON */ }
                    <Button
                        variant="primary"
                        onClick={ onOpenBatchModal }
                        disabled={ ! hasActiveFeatureDirtyKeys }
                        style={ {
                            height: '38px',
                            flex: '1.2 1 0%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            lineHeight: '1.15',
                            fontSize: '11px',
                            padding: '2px 4px',
                            opacity: hasActiveFeatureDirtyKeys ? 1 : 0.4,
                            cursor: hasActiveFeatureDirtyKeys
                                ? 'pointer'
                                : 'default',
                            pointerEvents: hasActiveFeatureDirtyKeys
                                ? 'auto'
                                : 'none',
                        } }
                    >
                        { __( 'Apply to Other Features', TEXT_DOMAIN ) }
                    </Button>
                </Flex>
            </div>
        </div>
    );
};