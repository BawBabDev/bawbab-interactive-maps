/**
 * MapLegend Component
 * Displays custom sections, categories, and color swatches in map overlay.
 *
 * File: src/components/mapLegend.jsx
 */

import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { useCategoryManager } from '../../bawbab-interactive-maps-admin/category-editor-page/hooks/useCategoryManager';

/**
 * Renderable SVG icons for Legend toggle state
 */
const LegendIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13" />
    </svg>
);

const CloseIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const MapLegend = ( { mapDimensions } ) => {
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = width > 0 && ( width < 800 || height < 500 );

    const [ isOpen, setIsOpen ] = useState( true );
    const hasInitialized = useRef( false );

    const { categoryMap, legendConfig } = useCategoryManager();

    // Collapse legend automatically on initial load for compact screens
    useEffect( () => {
        if ( width > 0 && ! hasInitialized.current ) {
            if ( isSmallUI ) setIsOpen( false );
            hasInitialized.current = true;
        }
    }, [ width, height, isSmallUI ] );

    const isLegendEnabled = Boolean( legendConfig?.enabled !== false );
    const showHeaders = legendConfig?.showSectionHeaders !== false;

    // Filter and resolve categories and swatches per active section
    const activeSections = useMemo( () => {
        if (
            ! isLegendEnabled ||
            ! legendConfig?.sections ||
            ! Array.isArray( legendConfig.sections )
        ) {
            return [];
        }

        return legendConfig.sections
            .map( ( section ) => {
                const visibleItems = ( section.items || [] )
                    .filter( ( item ) => item.showInLegend !== false )
                    .map( ( item ) => {
                        const swatches = ( item.categories || [] ).map(
                            ( compositeKey ) => {
                                return (
                                    categoryMap[ compositeKey ]?.color ||
                                    '#007cba'
                                );
                            }
                        );

                        return {
                            id: item.id,
                            label: item.label,
                            swatches:
                                swatches.length > 0 ? swatches : [ '#007cba' ],
                        };
                    } );

                if ( visibleItems.length === 0 ) return null;

                return {
                    id: section.id,
                    title: section.title,
                    items: visibleItems,
                };
            } )
            .filter( Boolean );
    }, [ categoryMap, legendConfig, isLegendEnabled ] );

    // Flatten items when section titles are toggled off
    const flatItems = useMemo( () => {
        return showHeaders ? [] : activeSections.flatMap( ( s ) => s.items );
    }, [ showHeaders, activeSections ] );

    // Safe unmount fallback
    if ( ! isLegendEnabled || activeSections.length === 0 ) {
        return <div style={ { display: 'none' } } className="map-legend-hidden" />;
    }

    return (
        <div
            className={ `map-legend-container ${ isOpen ? 'is-open' : 'is-collapsed' }` }
            onClick={ () => ! isOpen && setIsOpen( true ) }
        >
            { /* LEGEND HEADER BAR */ }
            <div className="map-legend-header">
                { ! isOpen ? (
                    <div className="map-legend-icon-trigger">
                        <LegendIcon />
                    </div>
                ) : (
                    <>
                        <span className="map-legend-title">
                            { __( 'Legend', 'bawbab-interactive-maps' ) }
                        </span>
                        <button
                            type="button"
                            className="map-legend-close-btn"
                            onClick={ ( e ) => {
                                e.stopPropagation();
                                setIsOpen( false );
                            } }
                            aria-label={ __( 'Close Legend', 'bawbab-interactive-maps' ) }
                        >
                            <CloseIcon />
                        </button>
                    </>
                ) }
            </div>

            { /* LEGEND CONTENT VIEWPORT */ }
            <div className="map-legend-body">
                <div className="map-legend-sections-wrapper">
                    { showHeaders
                        ? activeSections.map( ( section ) => (
                                <div key={ section.id } className="map-legend-section">
                                    <div className="map-legend-section-title">
                                        { section.title }
                                    </div>
                                    <div className="map-legend-items-list">
                                        { section.items.map( ( item ) => (
                                            <div
                                                key={ item.id }
                                                className="map-legend-item-row"
                                            >
                                                <div className="map-legend-swatches-group">
                                                    { item.swatches.map( ( color, idx ) => (
                                                        <div
                                                            key={ `${ item.id }-swatch-${ idx }` }
                                                            className="map-legend-swatch"
                                                            style={ { background: color } }
                                                        />
                                                    ) ) }
                                                </div>
                                                <span className="map-legend-item-label">
                                                    { item.label }
                                                </span>
                                            </div>
                                        ) ) }
                                    </div>
                                </div>
                          ) )
                        : flatItems.map( ( item ) => (
                                <div key={ item.id } className="map-legend-item-row">
                                    <div className="map-legend-swatches-group">
                                        { item.swatches.map( ( color, idx ) => (
                                            <div
                                                key={ `${ item.id }-swatch-${ idx }` }
                                                className="map-legend-swatch"
                                                style={ { background: color } }
                                            />
                                        ) ) }
                                    </div>
                                    <span className="map-legend-item-label">
                                        { item.label }
                                    </span>
                                </div>
                          ) ) }
                </div>
            </div>
        </div>
    );
};

export default MapLegend;