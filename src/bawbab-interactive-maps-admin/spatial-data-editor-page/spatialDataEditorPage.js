import { __ } from '@wordpress/i18n';
import {
	Panel,
	Flex,
	FlexItem,
	NoticeList,
	Button,
	Spinner,
	SearchControl,
	SelectControl,
	PanelBody,
	CheckboxControl,
	TextControl,
	Dashicon,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import DataEditor from './components/dataEditor';
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

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const formatLabel = ( str ) => {
	if ( ! str ) return '';
	return str
		.split( '_' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
};

const LAYER_OPTIONS = [
	{ label: __( 'All Map Layers', TEXT_DOMAIN ), value: 'all' },
	{ label: __( 'Buildings Layer', TEXT_DOMAIN ), value: 'buildings' },
	{ label: __( 'Land Use Layer', TEXT_DOMAIN ), value: 'land_use' },
	{ label: __( 'Pathways Layer', TEXT_DOMAIN ), value: 'paths' },
	{ label: __( 'Parcels Layer', TEXT_DOMAIN ), value: 'parcels' },
	{ label: __( 'Entries Layer', TEXT_DOMAIN ), value: 'entries' },
];

/**
 * EditPage Component
 */
const SpatialDataEditorPage = () => {
	const [ features, setFeatures ] = useState( [] );
	const [ selectedLayer, setSelectedLayer ] = useState( 'all' ); // Layer Selector Filter State
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ activeFeature, setActiveFeature ] = useState( null );
	const [ resetCounter, setResetCounter ] = useState( 0 );
	const [ drafts, setDrafts ] = useState( {} );

	// Panel Tab Navigation State ('editor' vs 'schema')
	const [ activeTab, setActiveTab ] = useState( 'editor' );

	// Category Manager Hook (1-to-1 Groups & Mappings)
	const { groups, categoryMap } = useCategoryManager();

	// Attribute Schema Hook
	const {
		schema,
		isLoadingSchema,
		updateSchemaKey,
		deleteSchemaKey,
		fetchSchema,
	} = useAttributeSchema();

	// Map settings
	const [ googleApiKey, setGoogleApiKey ] = useState( '' );
	const [ googleMapId, setGoogleMapId ] = useState( '' );
	const [ mapType, setMapType ] = useState( 'hybrid' );
	const [ mapLogo, setMapLogo ] = useState( '' );
	const [ navBackground, setNavBackground ] = useState( '' );
	const [ colorTheme, setColorTheme ] = useState( 'blue' );

	// Accordion state
	const [ openedTopTab, setOpenedGroup ] = useState( null );
	const [ openedSubGroup, setOpenedSubGroup ] = useState( {} );
	const sidebarListRef = useRef( null );

	// Filter Panel Deploy State
	const [ isFilterOpen, setIsFilterOpen ] = useState( false );
	const [ filterCategory, setFilterCategory ] = useState( 'all' );
	const [ dynamicFilters, setDynamicFilters ] = useState( {} );

	const { removeNotice } = useDispatch( noticesStore );
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices(),
		[]
	);

	// 1. Fetch Features (Preserves ALL layers so non-interactive features/metadata can be edited)
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

	// 3. Process Two-Level Category Accordion Structure Using Composite Key Resolution
	const displayStructure = useMemo( () => {
		const activeGroups = groups.length > 0 ? groups : DEFAULT_GROUPS;
		const activeMap =
			Object.keys( categoryMap ).length > 0
				? categoryMap
				: DEFAULT_CATEGORY_MAPPINGS;

		// Apply layer filter + search & custom dynamic filters
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

			// Match features using composite key resolution (layer_type::category) or flat category fallback
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

		// Collect unassigned or uncategorized features into default bucket
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

	// AUTO-EXPAND AND SCROLL TO MATCHING SIDEBAR UNIT WHEN A MAP FEATURE IS SELECTED
	useEffect( () => {
		if ( ! activeFeature || ! activeFeature.properties ) return;

		const targetFid = String( activeFeature.properties.fid );
		const targetLayer = activeFeature.properties.layer_type || 'buildings';

		let matchingTopTabId = null;
		let matchingSubGroupId = null;

		// Locate which accordion bucket contains the selected feature
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

		// Scroll sidebar container to the unit element smoothly
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

	const updateDraft = ( layerType, fid, data ) => {
		const compositeKey = `${ layerType }::${ fid }`;
		setDrafts( ( prev ) => {
			const currentDraft = prev[ compositeKey ] || {};
			const updatedCustomAttrs = {
				...( currentDraft.custom_attributes || {} ),
				...( data.custom_attributes || {} ),
			};

			return {
				...prev,
				[ compositeKey ]: {
					...currentDraft,
					...data,
					...( Object.keys( updatedCustomAttrs ).length > 0
						? { custom_attributes: updatedCustomAttrs }
						: {} ),
				},
			};
		} );
	};

	const handleCancel = () => {
		setDrafts( {} );
		setResetCounter( ( prev ) => prev + 1 );
	};

	const saveAllDrafts = async () => {
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

				const payload = {
					fid: fid,
					layer_type: layerType,
					...draftData,
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
		} catch ( err ) {
			console.error( 'Global Save Exception:', err );
		} finally {
			setIsSaving( false );
		}
	};

	const renderFeatureItem = ( f ) => {
		const isActive =
			activeFeature?.properties.fid === f.properties.fid &&
			activeFeature?.properties.layer_type === f.properties.layer_type;
		let itemLabel = f.properties.code
			? `${ __( 'Unit', TEXT_DOMAIN ) } ${ f.properties.code }`
			: f.properties.name;
		if ( ! itemLabel )
			itemLabel = `${ f.properties.layer_type } #${ f.properties.fid }`;

		return (
			<div
				id={ `item-${ f.properties.layer_type }-${ f.properties.fid }` }
				key={ `${ f.properties.layer_type }-${ f.properties.fid }` }
				onClick={ () => {
					setActiveFeature( f );
					setActiveTab( 'editor' );
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
			apiFetch( { path: '/wp/v2/settings' } )
				.then( ( response ) => {
					const data = response.bwb_imaps_options_data;
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

	const activeCompositeKey = activeFeature
		? `${ activeFeature.properties.layer_type }::${ activeFeature.properties.fid }`
		: '';

	return (
		<div
			className="wrap"
			style={ {
				height: 'calc(100vh - 140px)',
				display: 'flex',
				flexDirection: 'column',
			} }
		>
			<NoticeList
				notices={ notices }
				onRemove={ removeNotice }
				style={ { marginBottom: '20px', flexShrink: 0 } }
			/>

			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					marginBottom: '20px',
					flexShrink: 0,
				} }
			>
				<h1 className="wp-heading-inline" style={ { margin: 0 } }>
					{ __( 'Edit Map Features', TEXT_DOMAIN ) }
				</h1>
			</div>

			<div
				style={ {
					flex: 1,
					minHeight: 0,
					background: '#fff',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
					display: 'flex',
					overflow: 'hidden',
				} }
			>
				{ /* LEFT SIDEBAR: UNITS LIST & FILTERS */ }
				<div
					style={ {
						flex: '0 0 350px',
						borderRight: '1px solid #e0e0e0',
						display: 'flex',
						flexDirection: 'column',
						height: '100%',
					} }
				>
					<div
						style={ {
							padding: '15px',
							borderBottom: '1px solid #f0f0f0',
							background: '#f9f9f9',
							flexShrink: 0,
						} }
					>
						{ /* LAYER SELECTION CONTROL */ }
						<div style={ { marginBottom: '10px' } }>
							<SelectControl
								label={ __( 'Target Map Layer', TEXT_DOMAIN ) }
								value={ selectedLayer }
								options={ LAYER_OPTIONS }
								onChange={ ( val ) => setSelectedLayer( val ) }
								__nextHasNoMarginBottom
							/>
						</div>

						{ /* SEARCH & FILTER CONTROLS */ }
						<Flex align="center" gap={ 2 }>
							<FlexItem style={ { flex: 1 } }>
								<SearchControl
									value={ searchQuery }
									onChange={ setSearchQuery }
									placeholder={ __(
										'Search units...',
										TEXT_DOMAIN
									) }
									__nextHasNoMarginBottom
								/>
							</FlexItem>

							<FlexItem>
								<Button
									onClick={ () =>
										setIsFilterOpen( ( prev ) => ! prev )
									}
									label={ __(
										'Toggle Filters',
										TEXT_DOMAIN
									) }
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
											color: isFilterOpen
												? '#2271b1'
												: '#666',
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
									borderTop: '1px solid #e0e0e0',
									maxHeight: '200px',
									overflowY: 'auto',
									scrollbarWidth: 'none',
									msOverflowStyle: 'none',
								} }
							>
								<SelectControl
									label={ __( 'Category Slug', TEXT_DOMAIN ) }
									value={ filterCategory }
									options={ categories }
									onChange={ ( val ) =>
										setFilterCategory( val )
									}
									__nextHasNoMarginBottom
								/>

								{ ( discoveredAttributes.booleans.length > 0 ||
									discoveredAttributes.numbers.length >
										0 ) && (
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
											{ __(
												'Dynamic Custom Filters',
												TEXT_DOMAIN
											) }
										</strong>

										<div
											style={ {
												display: 'flex',
												flexDirection: 'column',
												gap: '6px',
											} }
										>
											{ discoveredAttributes.booleans.map(
												( key ) => (
													<CheckboxControl
														key={ `filter-bool-${ key }` }
														label={ formatLabel(
															key
														) }
														checked={ Boolean(
															dynamicFilters[
																key
															]
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

										{ discoveredAttributes.numbers.map(
											( key ) => {
												const currentVal =
													dynamicFilters[ key ] || {};
												return (
													<div
														key={ `filter-num-${ key }` }
														style={ {
															marginTop: '8px',
														} }
													>
														<span
															style={ {
																fontSize:
																	'11px',
																fontWeight:
																	'500',
															} }
														>
															{ formatLabel(
																key
															) }
														</span>
														<Flex
															gap={ 2 }
															style={ {
																marginTop:
																	'2px',
															} }
														>
															<FlexItem
																style={ {
																	flex: 1,
																} }
															>
																<TextControl
																	type="number"
																	step="0.5"
																	placeholder={ __(
																		'Min',
																		TEXT_DOMAIN
																	) }
																	value={
																		currentVal.min ||
																		''
																	}
																	onChange={ (
																		val
																	) =>
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
																		fontSize:
																			'11px',
																	} }
																	__nextHasNoMarginBottom
																/>
															</FlexItem>
															<FlexItem
																style={ {
																	flex: 1,
																} }
															>
																<TextControl
																	type="number"
																	step="0.5"
																	placeholder={ __(
																		'Max',
																		TEXT_DOMAIN
																	) }
																	value={
																		currentVal.max ||
																		''
																	}
																	onChange={ (
																		val
																	) =>
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
																		fontSize:
																			'11px',
																	} }
																	__nextHasNoMarginBottom
																/>
															</FlexItem>
														</Flex>
													</div>
												);
											}
										) }
									</div>
								) }
							</div>
						) }
					</div>

					<div
						ref={ sidebarListRef }
						style={ {
							flex: 1,
							overflowY: 'auto',
							padding: '10px',
						} }
					>
						{ isLoading ? (
							<Flex
								justify="center"
								style={ { padding: '20px' } }
							>
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
											prev === topTab.id
												? null
												: topTab.id
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
													setOpenedSubGroup(
														( prev ) => ( {
															...prev,
															[ subGroup.id ]:
																! prev[
																	subGroup.id
																],
														} )
													)
												}
												style={ {
													fontWeight: '600',
													fontSize: '12px',
													cursor: 'pointer',
													padding: '6px 0',
													color: '#2271b1',
													display: 'flex',
													alignItems: 'center',
													justifyContent:
														'space-between',
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
												<div
													style={ {
														marginTop: '4px',
													} }
												>
													{ subGroup.items.map(
														( f ) =>
															renderFeatureItem(
																f
															)
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
				</div>

				{ /* RIGHT PANEL: TABBED INTERFACE (FEATURE EDITOR VS SCHEMA MANAGER) */ }
				<div
					style={ {
						flex: 1,
						height: '100%',
						overflowY: 'auto',
						background: '#fdfdfd',
						display: 'flex',
						flexDirection: 'column',
					} }
				>
					{ /* TAB BAR HEADER */ }
					<div
						style={ {
							display: 'flex',
							background: '#f9f9f9',
							borderBottom: '1px solid #e0e0e0',
							flexShrink: 0,
						} }
					>
						<button
							onClick={ () => setActiveTab( 'editor' ) }
							style={ {
								padding: '12px 20px',
								border: 'none',
								background:
									activeTab === 'editor'
										? '#fff'
										: 'transparent',
								borderBottom:
									activeTab === 'editor'
										? '2px solid #2271b1'
										: '2px solid transparent',
								fontWeight:
									activeTab === 'editor' ? '600' : '400',
								color:
									activeTab === 'editor' ? '#2271b1' : '#555',
								cursor: 'pointer',
								fontSize: '13px',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							} }
						>
							<Dashicon icon="edit" size={ 16 } />
							{ __( 'Edit Feature Details', TEXT_DOMAIN ) }
						</button>

						<button
							onClick={ () => setActiveTab( 'schema' ) }
							style={ {
								padding: '12px 20px',
								border: 'none',
								background:
									activeTab === 'schema'
										? '#fff'
										: 'transparent',
								borderBottom:
									activeTab === 'schema'
										? '2px solid #2271b1'
										: '2px solid transparent',
								fontWeight:
									activeTab === 'schema' ? '600' : '400',
								color:
									activeTab === 'schema' ? '#2271b1' : '#555',
								cursor: 'pointer',
								fontSize: '13px',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							} }
						>
							<Dashicon icon="category" size={ 16 } />
							{ __( 'Custom Attributes', TEXT_DOMAIN ) } (
							{ schema.length })
						</button>
					</div>

					{ /* TAB CONTENT 1: FEATURE EDITOR */ }
					{ activeTab === 'editor' && (
						<div style={ { flex: 1, overflowY: 'auto' } }>
							{ activeFeature ? (
								<div
									style={ {
										padding: '40px 20px',
										maxWidth: '800px',
										width: '100%',
										margin: '0 auto',
									} }
								>
									<DataEditor
										key={ `${ activeFeature.properties.layer_type }-${ activeFeature.properties.fid }` }
										building={ activeFeature }
										draft={
											drafts[ activeCompositeKey ] || {}
										}
										globalSchema={ schema }
										updateSchemaKey={ updateSchemaKey }
										updateDraft={ ( data ) =>
											updateDraft(
												activeFeature.properties
													.layer_type,
												activeFeature.properties.fid,
												data
											)
										}
										onUpdate={ saveAllDrafts }
										onCancel={ handleCancel }
										isSaving={ isSaving }
										hasChanges={
											Object.keys( drafts ).length > 0
										}
									/>

									<div
										style={ {
											marginTop: '40px',
											borderTop: '20px solid #f0f0f0',
											paddingTop: '30px',
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
											{ /* PREVIEW MAP STAYS MOUNTED AND RE-RENDERS ONLY WHEN SAVED VIA resetCounter */ }
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
												mapLogo={ mapLogo }
												navBackground={ navBackground }
												colorTheme={ colorTheme }
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
										minHeight: '400px',
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
					) }

					{ /* TAB CONTENT 2: ATTRIBUTE SCHEMA MANAGER */ }
					{ activeTab === 'schema' && (
						<div
							style={ {
								flex: 1,
								overflowY: 'auto',
								padding: '30px',
								maxWidth: '900px',
								width: '100%',
								margin: '0 auto',
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
			</div>
		</div>
	);
};

export default SpatialDataEditorPage;
