import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { useCategoryManager } from '../../bawbab-interactive-maps-admin/category-editor-page/hooks/useCategoryManager';
import {
	DEFAULT_GROUPS,
	DEFAULT_CATEGORY_MAPPINGS,
} from '../../bawbab-interactive-maps-admin/category-editor-page/constants/defaultCategories';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * SearchList Component
 *
 * Dynamic navigation menu rendering feature hierarchies based on the 1-to-1
 * Group & Category settings. Accommodates grouped multi-unit accordions
 * as well as flat facility/amenity lists and location pins.
 * Ignores unassigned categories (groupId === '') from the public menu.
 */
const SearchList = ( {
	spatialFeatures = [],
	locations = [],
	onSelect,
	isOpen,
	onCloseMenu,
} ) => {
	const [ activeTab, setActiveTab ] = useState( null );
	const menuRef = useRef( null );

	const { groups, categoryMap } = useCategoryManager();

	// Dismiss dropdown when clicking outside menu container
	useEffect( () => {
		const handleClickOutside = ( event ) => {
			if (
				isOpen &&
				menuRef.current &&
				! menuRef.current.contains( event.target )
			) {
				if ( ! event.target.closest( '.burger-btn' ) ) {
					onCloseMenu();
					setActiveTab( null );
				}
			}
		};

		if ( isOpen ) {
			document.addEventListener( 'mousedown', handleClickOutside );
		}

		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ isOpen, onCloseMenu ] );

	const toggleTab = ( e, tabId ) => {
		e.preventDefault();
		e.stopPropagation();
		setActiveTab( ( prev ) => ( prev === tabId ? null : tabId ) );
	};

	/**
	 * Process spatial features and locations into dynamic category group buckets
	 */
	const categoryData = useMemo( () => {
		const activeGroups = groups.length > 0 ? groups : DEFAULT_GROUPS;
		const activeMap =
			Object.keys( categoryMap ).length > 0
				? categoryMap
				: DEFAULT_CATEGORY_MAPPINGS;

		// Initialize empty group buckets matching valid, non-empty group definitions
		const groupBuckets = {};
		activeGroups.forEach( ( group ) => {
			if ( ! group.id ) return;
			groupBuckets[ group.id ] = {
				id: group.id,
				title: group.title,
				displayType: group.displayType || 'flat',
				groupedItems: {}, // Keyed by parent feature name (for Name + Code features)
				flatItems: [], // Array of flat items (for Name-only features or pins)
			};
		} );

		// 1. Process Spatial GeoJSON Features
		spatialFeatures.forEach( ( f ) => {
			const props = f.properties || {};

			// STRICT FILTERING:
			// 1. Must be explicitly interactive (is_interactive === true or 1)
			// 2. Must have a valid, non-empty name property
			const isInteractive =
				props.is_interactive === true ||
				props.is_interactive === 1 ||
				props.is_interactive === '1';
			const hasValidName =
				props.name &&
				typeof props.name === 'string' &&
				props.name.trim() !== '';

			if ( ! isInteractive || ! hasValidName ) {
				return;
			}

			const featureItem = {
				...props,
				type: 'spatial',
				geometry: f.geometry,
			};
			const category = props.category || '';
			const layer = props.layer_type || 'buildings';

			// COMPOSITE KEY RESOLUTION: Match "layer_type::category_slug" or fallback to bare category
			const compositeKey = `${ layer }::${ category }`;
			const catInfo = activeMap[ compositeKey ] || activeMap[ category ];
			const targetGroupId = catInfo?.groupId;

			// Strict check: Ignore unassigned features or features mapped to non-existent groups
			if ( ! targetGroupId || ! groupBuckets[ targetGroupId ] ) {
				return;
			}

			const bucket = groupBuckets[ targetGroupId ];

			// Distinguish between Grouped Accordion items (has BOTH Name and Code) and Flat items
			if (
				props.name &&
				props.code &&
				bucket.displayType === 'grouped'
			) {
				const groupName = props.name;
				if ( ! bucket.groupedItems[ groupName ] ) {
					bucket.groupedItems[ groupName ] = [];
				}
				bucket.groupedItems[ groupName ].push( featureItem );
			} else {
				bucket.flatItems.push( featureItem );
			}
		} );

		// 2. Process Custom Location Pin Markers (added to flat items of the 'amenities' group if present)
		const fallbackFlatGroupId = groupBuckets[ 'amenities' ]
			? 'amenities'
			: activeGroups.find( ( g ) => g.id )?.id;
		if ( fallbackFlatGroupId && groupBuckets[ fallbackFlatGroupId ] ) {
			locations.forEach( ( loc ) => {
				if ( loc.title && loc.showMarker !== false ) {
					groupBuckets[ fallbackFlatGroupId ].flatItems.push( {
						...loc,
						name: loc.title,
						type: 'marker',
					} );
				}
			} );
		}

		// 3. Format and Sort Grouped Accordion Structures
		const naturalSort = ( a, b ) =>
			( a.code || a.name || '' ).localeCompare(
				b.code || b.name || '',
				undefined,
				{ numeric: true }
			);

		const formattedTabs = activeGroups
			.map( ( group ) => {
				if ( ! group.id ) return null;
				const bucket = groupBuckets[ group.id ];
				if ( ! bucket ) return null;

				const formattedGroups = Object.keys( bucket.groupedItems )
					.map( ( groupName ) => ( {
						groupName,
						units: bucket.groupedItems[ groupName ].sort(
							naturalSort
						),
					} ) )
					.sort( ( a, b ) =>
						a.groupName.localeCompare( b.groupName )
					);

				return {
					id: bucket.id,
					title: bucket.title,
					displayType: bucket.displayType,
					groups: formattedGroups,
					flatItems: bucket.flatItems.sort( naturalSort ),
				};
			} )
			.filter( Boolean );

		return formattedTabs;
	}, [ spatialFeatures, locations, groups, categoryMap ] );

	/**
	 * Sub-Component: Renders an individual dynamic navigation tab and its dropdown
	 */
	const NavItem = ( { tab } ) => {
		const isTabOpen = activeTab === tab.id;
		const [ activeGroup, setActiveGroup ] = useState( null );

		const toggleGroup = ( e, groupName ) => {
			e.preventDefault();
			e.stopPropagation();
			setActiveGroup( ( prev ) =>
				prev === groupName ? null : groupName
			);
		};

		const hasGroupedItems = tab.groups && tab.groups.length > 0;
		const hasFlatItems = tab.flatItems && tab.flatItems.length > 0;

		// Skip rendering tabs that contain no items
		if ( ! hasGroupedItems && ! hasFlatItems ) return null;

		return (
			<div
				className={ `nav-item-container ${
					isTabOpen ? 'is-expanded' : ''
				}` }
			>
				<button
					className="nav-tab-btn"
					onClick={ ( e ) => toggleTab( e, tab.id ) }
				>
					{ __( tab.title, TEXT_DOMAIN ) }{ ' ' }
					<span className="chevron"></span>
				</button>
				<div className="nav-dropdown">
					{ /* Render Grouped Accordion Rows */ }
					{ hasGroupedItems &&
						tab.groups.map( ( group, idx ) => {
							const isGroupOpen = activeGroup === group.groupName;
							return (
								<div
									key={ `group-${ idx }` }
									className={ `dropdown-group-container ${
										isGroupOpen ? 'group-expanded' : ''
									}` }
								>
									<div
										className="dropdown-row group-header"
										onClick={ ( e ) =>
											toggleGroup( e, group.groupName )
										}
									>
										{ group.groupName }{ ' ' }
										<span className="side-chevron"></span>
									</div>
									<div className="sub-side-menu">
										{ group.units.map( ( unit, uIdx ) => (
											<div
												key={ `unit-${ uIdx }` }
												className="dropdown-row"
												onClick={ () => {
													onSelect( unit );
													onCloseMenu();
													setActiveTab( null );
												} }
											>
												{ unit.code || unit.name }
											</div>
										) ) }
									</div>
								</div>
							);
						} ) }

					{ /* Render Flat List Rows */ }
					{ hasFlatItems &&
						tab.flatItems.map( ( item, idx ) => (
							<div
								key={ `flat-${ idx }` }
								className="dropdown-row"
								onClick={ () => {
									onSelect( item );
									onCloseMenu();
									setActiveTab( null );
								} }
							>
								{ item.name || item.title }
							</div>
						) ) }
				</div>
			</div>
		);
	};

	return (
		<div
			ref={ menuRef }
			className={ `nav-menu ${ isOpen ? 'mobile-open' : '' }` }
		>
			{ categoryData.map( ( tab ) => (
				<NavItem key={ tab.id } tab={ tab } />
			) ) }
		</div>
	);
};

export default SearchList;
