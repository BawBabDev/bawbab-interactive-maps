import { __ } from '@wordpress/i18n';
import {
    Flex,
    FlexItem,
    Button,
    SearchControl,
    SelectControl,
    CheckboxControl,
    TextControl,
    Dashicon,
} from '@wordpress/components';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const LAYER_OPTIONS = [
    { label: __( 'All Map Layers', TEXT_DOMAIN ), value: 'all' },
    { label: __( 'Buildings Layer', TEXT_DOMAIN ), value: 'buildings' },
    { label: __( 'Land Use Layer', TEXT_DOMAIN ), value: 'land_use' },
    { label: __( 'Pathways Layer', TEXT_DOMAIN ), value: 'paths' },
    { label: __( 'Parcels Layer', TEXT_DOMAIN ), value: 'parcels' },
    { label: __( 'Entries Layer', TEXT_DOMAIN ), value: 'entries' },
];

export const FeatureSearchFilter = ( {
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
} ) => {
    return (
        <div
            style={ {
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                background: '#f9f9f9',
                flexShrink: 0,
            } }
        >
            <div style={ { marginBottom: '10px' } }>
                <SelectControl
                    label={ __( 'Target Map Layer', TEXT_DOMAIN ) }
                    value={ selectedLayer }
                    options={ LAYER_OPTIONS }
                    onChange={ ( val ) => setSelectedLayer( val ) }
                    __nextHasNoMarginBottom
                />
            </div>

            <Flex align="center" gap={ 2 }>
                <FlexItem style={ { flex: 1 } }>
                    <SearchControl
                        value={ searchQuery }
                        onChange={ setSearchQuery }
                        placeholder={ __( 'Search units...', TEXT_DOMAIN ) }
                        __nextHasNoMarginBottom
                    />
                </FlexItem>

                <FlexItem>
                    <Button
                        onClick={ () => setIsFilterOpen( ( prev ) => ! prev ) }
                        label={ __( 'Toggle Filters', TEXT_DOMAIN ) }
                        showTooltip
                        style={ {
                            height: '40px',
                            minWidth: '40px',
                            padding: '0 8px',
                            background: '#f0f0f0',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        } }
                    >
                        <Dashicon
                            icon="filter"
                            style={ {
                                color: isFilterOpen ? '#2271b1' : '#666',
                                transition: 'color 0.2s ease',
                            } }
                        />
                    </Button>
                </FlexItem>
            </Flex>

            { isFilterOpen && (
                <div
                    className="no-scrollbar"
                    style={ {
                        marginTop: '12px',
                        paddingTop: '10px',
                        paddingLeft: '4px',
                        paddingRight: '4px',
                        borderTop: '1px solid #e0e0e0',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        boxSizing: 'border-box',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    } }
                >
                    <SelectControl
                        label={ __( 'Category', TEXT_DOMAIN ) }
                        value={ filterCategory }
                        options={ categories }
                        onChange={ ( val ) => setFilterCategory( val ) }
                        __nextHasNoMarginBottom
                    />

                    { ( discoveredAttributes.booleans.length > 0 ||
                        discoveredAttributes.numbers.length > 0 ) && (
                        <div
                            style={ {
                                marginTop: '12px',
                                paddingTop: '10px',
                                borderTop: '1px dashed #ddd',
                            } }
                        >
                            <strong
                                style={ {
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    color: '#666',
                                    display: 'block',
                                    marginBottom: '8px',
                                } }
                            >
                                { __( 'Dynamic Custom Filters', TEXT_DOMAIN ) }
                            </strong>

                            <div
                                style={ {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    paddingLeft: '2px',
                                } }
                            >
                                { discoveredAttributes.booleans.map(
                                    ( key ) => (
                                        <CheckboxControl
                                            key={ `filter-bool-${ key }` }
                                            label={ formatLabel( key ) }
                                            checked={ Boolean(
                                                dynamicFilters[ key ]
                                            ) }
                                            onChange={ ( val ) =>
                                                handleDynamicFilterChange(
                                                    key,
                                                    val
                                                )
                                            }
                                            __nextHasNoMarginBottom
                                        />
                                    )
                                ) }
                            </div>

                            { discoveredAttributes.numbers.map( ( key ) => {
                                const currentVal = dynamicFilters[ key ] || {};
                                return (
                                    <div
                                        key={ `filter-num-${ key }` }
                                        style={ { marginTop: '8px' } }
                                    >
                                        <span
                                            style={ {
                                                fontSize: '11px',
                                                fontWeight: '500',
                                            } }
                                        >
                                            { formatLabel( key ) }
                                        </span>
                                        <Flex
                                            gap={ 2 }
                                            style={ { marginTop: '2px' } }
                                        >
                                            <FlexItem style={ { flex: 1 } }>
                                                <TextControl
                                                    type="number"
                                                    step="0.5"
                                                    placeholder={ __(
                                                        'Min',
                                                        TEXT_DOMAIN
                                                    ) }
                                                    value={ currentVal.min || '' }
                                                    onChange={ ( val ) =>
                                                        handleDynamicFilterChange(
                                                            key,
                                                            {
                                                                ...currentVal,
                                                                min: val,
                                                            }
                                                        )
                                                    }
                                                    style={ {
                                                        height: '28px',
                                                        fontSize: '11px',
                                                    } }
                                                    __nextHasNoMarginBottom
                                                />
                                            </FlexItem>
                                            <FlexItem style={ { flex: 1 } }>
                                                <TextControl
                                                    type="number"
                                                    step="0.5"
                                                    placeholder={ __(
                                                        'Max',
                                                        TEXT_DOMAIN
                                                    ) }
                                                    value={ currentVal.max || '' }
                                                    onChange={ ( val ) =>
                                                        handleDynamicFilterChange(
                                                            key,
                                                            {
                                                                ...currentVal,
                                                                max: val,
                                                            }
                                                        )
                                                    }
                                                    style={ {
                                                        height: '28px',
                                                        fontSize: '11px',
                                                    } }
                                                    __nextHasNoMarginBottom
                                                />
                                            </FlexItem>
                                        </Flex>
                                    </div>
                                );
                            } ) }
                        </div>
                    ) }
                </div>
            ) }
        </div>
    );
};