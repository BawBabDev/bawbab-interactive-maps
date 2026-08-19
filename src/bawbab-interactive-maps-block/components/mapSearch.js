import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import SearchList from './mapSearchList';

export const MapSearch = ( {
    spatialFeatures,
    locations,
    onSelect,
    navBackgroundProp,
    logoProp,
    mapTitleProp,
    mapDescriptionProp,
} ) => {
    const [ searchQuery, setSearchQuery ] = useState( '' );
    const [ isSearchFocused, setIsSearchFocused ] = useState( false );
    const [ isBurgerOpen, setIsBurgerOpen ] = useState( false );
    const mapSettings = window.bawbinmapsSettings || {};
    const colorTheme = mapSettings.colorTheme;
    const mapLogo = logoProp || mapSettings.mapLogo || '';
    const navBackground =
        navBackgroundProp || mapSettings.navBackground || '';

    // Ensure props take absolute priority over window globals
    const mapTitle = mapTitleProp ?? mapSettings.mapTitle ?? __( 'Interactive Map', 'bawbab-interactive-maps' );
    const mapDescription = mapDescriptionProp ?? mapSettings.mapDescription ?? '';

    // Flat list for global search input
    const allNamedFeatures = useMemo( () => {
        const list = [];
        spatialFeatures.forEach( ( f ) => {
            if ( f.properties.name )
                list.push( {
                    ...f.properties,
                    geometry: f.geometry,
                    type: 'spatial',
                } );
        } );
        locations.forEach( ( loc ) => {
            if ( loc.title )
                list.push( { ...loc, name: loc.title, type: 'marker' } );
        } );
        return list;
    }, [ spatialFeatures, locations ] );

    const filteredResults = useMemo( () => {
        if ( searchQuery.length < 2 ) return [];
        return allNamedFeatures
            .filter(
                ( item ) =>
                    ( item.name || '' )
                        .toLowerCase()
                        .includes( searchQuery.toLowerCase() ) ||
                    ( item.code || '' )
                        .toLowerCase()
                        .includes( searchQuery.toLowerCase() )
            )
            .sort( ( a, b ) =>
                ( a.code || a.name || '' ).localeCompare(
                    b.code || b.name || '',
                    undefined,
                    { numeric: true }
                )
            )
            .slice( 0, 8 );
    }, [ searchQuery, allNamedFeatures ] );

    return (
        <div className={ `map-theme-${ colorTheme }` } style={ { width: '100%' } }>
            <div
                className="map-navbar"
                style={ {
                    '--nav-bg': navBackground
                        ? `url(${ navBackground })`
                        : 'none',
                } }
            >
                { /* SECTION 1: BURGER BUTTON (IMMUTABLE) */ }
                <button
                    className={ `burger-btn ${ isBurgerOpen ? 'active' : '' }` }
                    onClick={ () => setIsBurgerOpen( ! isBurgerOpen ) }
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                { /* SECTION 2: LOGO + DIVIDER 1 + FLEXIBLE TITLE/SUBTITLE */ }
                <div className="nav-logo-section">
                    { mapLogo && (
                        <>
                            <img
                                src={ mapLogo }
                                alt={ __( 'Map Logo', 'bawbab-interactive-maps' ) }
                            />
                            <div className="nav-divider" />
                        </>
                    ) }

                    <div
                        className="map-header-text-block"
                        style={ {
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            lineHeight: '1.2',
                            flex: '1 1 auto',
                            minWidth: 0,
                            overflow: 'hidden',
                        } }
                    >
                        { mapTitle && (
                            <span
                                className="map-navbar-title"
                                title={ mapTitle }
                            >
                                { mapTitle }
                            </span>
                        ) }
                        { mapDescription && (
                            <span
                                className="map-navbar-subtitle"
                                title={ mapDescription }
                            >
                                { mapDescription }
                            </span>
                        ) }
                    </div>
                </div>

                <SearchList
                    spatialFeatures={ spatialFeatures }
                    locations={ locations }
                    onSelect={ onSelect }
                    isOpen={ isBurgerOpen }
                    onCloseMenu={ () => setIsBurgerOpen( false ) }
                />

                { /* SECTION 3: DIVIDER 2 + FIXED SEARCH INPUT */ }
                <div className="nav-divider" />

                <div className="nav-search-section" style={ { flexShrink: 0 } }>
                    <input
                        type="text"
                        placeholder={ __(
                            'Search Name or Code...',
                            'bawbab-interactive-maps'
                        ) }
                        value={ searchQuery }
                        onChange={ ( e ) => setSearchQuery( e.target.value ) }
                        onFocus={ () => setIsSearchFocused( true ) }
                        onBlur={ () =>
                            setTimeout( () => setIsSearchFocused( false ), 200 )
                        }
                    />
                    { isSearchFocused && filteredResults.length > 0 && (
                        <div className="autocomplete-results">
                            { filteredResults.map( ( item, idx ) => (
                                <div
                                    key={ idx }
                                    className="result-row"
                                    onClick={ () => onSelect( item ) }
                                >
                                    <span className="result-name">
                                        { item.name }{ ' ' }
                                        { item.code ? `(${ item.code })` : '' }
                                    </span>
                                    <span className="result-category">
                                        { item.category?.replace( '_', ' ' ) }
                                    </span>
                                </div>
                            ) ) }
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};

export default MapSearch;