import {
	Button,
	ButtonGroup,
	FlexItem,
	TextControl,
	TextareaControl,
	Flex,
	Dashicon,
	Modal,
	ComboboxControl,
	ToggleControl,
	SelectControl,
	ColorPicker,
	Dropdown,
	__experimentalText as Text,
} from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { useCategoryManager } from '../../category-editor-page/hooks/useCategoryManager';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const formatFieldLabel = ( str ) => {
	if ( ! str ) return '';
	return str
		.split( '_' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
};

const createKeySlug = ( label ) => {
	return ( label || '' )
		.trim()
		.toLowerCase()
		.replace( /[^a-z0-9\s_]/g, '' )
		.replace( /\s+/g, '_' );
};

/**
 * PropertyInputControl Component
 */
const PropertyInputControl = ( {
	propKey,
	label,
	value,
	schemaType,
	onChange,
	onClear,
} ) => {
	const lowerKey = propKey.toLowerCase();
	const displayLabel = label || formatFieldLabel( propKey );

	// 1. Check schemaType explicitly first before falling back to dynamic value inference
	let resolvedType = 'text';

	if ( schemaType ) {
		resolvedType = schemaType;
	} else if (
		typeof value === 'boolean' ||
		value === 'true' ||
		value === 'false'
	) {
		resolvedType = 'boolean';
	} else if (
		typeof value === 'number' &&
		lowerKey !== 'code' &&
		lowerKey !== 'fid'
	) {
		resolvedType = 'number';
	} else {
		resolvedType = 'text';
	}

	if ( resolvedType === 'boolean' ) {
		const isNullOrUnset =
			value === null || value === undefined || value === '';
		const isTrue =
			! isNullOrUnset &&
			( value === true ||
				value === 'true' ||
				value === 1 ||
				value === '1' );
		const isFalse = ! isNullOrUnset && ! isTrue;

		return (
			<Flex
				align="center"
				justify="space-between"
				style={ { height: '36px' } }
			>
				<span
					style={ {
						fontSize: '13px',
						fontWeight: '500',
						color: isNullOrUnset ? '#757575' : '#1d2327',
					} }
				>
					{ displayLabel }
				</span>

				<ButtonGroup>
					<Button
						isSmall
						variant={ isTrue ? 'primary' : 'secondary' }
						onClick={ () => onChange( true ) }
					>
						{ __( 'Yes', TEXT_DOMAIN ) }
					</Button>
					<Button
						isSmall
						variant={ isFalse ? 'destructive' : 'secondary' }
						onClick={ () => onChange( false ) }
						style={
							isFalse
								? {
										background: '#d63638',
										color: '#fff',
										borderColor: '#d63638',
								  }
								: undefined
						}
					>
						{ __( 'No', TEXT_DOMAIN ) }
					</Button>
					<Button
						isSmall
						variant={ isNullOrUnset ? 'tertiary' : 'secondary' }
						onClick={ onClear }
						style={ {
							background: isNullOrUnset ? '#e0e0e0' : undefined,
							color: isNullOrUnset ? '#333' : undefined,
						} }
					>
						{ __( 'Unset', TEXT_DOMAIN ) }
					</Button>
				</ButtonGroup>
			</Flex>
		);
	}

	const renderAlignedControl = ( inputNode ) => (
		<div>
			<label
				style={ {
					fontSize: '11px',
					fontWeight: '600',
					textTransform: 'uppercase',
					color: '#666',
					display: 'block',
					marginBottom: '4px',
				} }
			>
				{ displayLabel }
			</label>
			<Flex align="center" gap={ 2 }>
				<FlexItem style={ { flex: 1 } }>{ inputNode }</FlexItem>
				<FlexItem style={ { flexShrink: 0 } }>
					<Button
						isDestructive
						icon="no-alt"
						isSmall
						onClick={ onClear }
						label={ __( 'Clear Value', TEXT_DOMAIN ) }
						showTooltip
						style={ {
							height: '32px',
							minWidth: '32px',
							padding: 0,
						} }
					/>
				</FlexItem>
			</Flex>
		</div>
	);

	if ( resolvedType === 'dual_counter' ) {
		return renderAlignedControl(
			<TextControl
				type="number"
				step="0.5"
				min="0"
				max="100"
				value={
					value !== null && value !== undefined && value !== ''
						? String( value )
						: ''
				}
				onChange={ ( newVal ) =>
					onChange( newVal !== '' ? parseFloat( newVal ) : null )
				}
				style={ { height: '32px' } }
				__nextHasNoMarginBottom
			/>
		);
	}

	if ( resolvedType === 'number' ) {
		return renderAlignedControl(
			<TextControl
				type="number"
				step="0.5"
				value={
					value !== null && value !== undefined && value !== ''
						? String( value )
						: ''
				}
				onChange={ ( newVal ) =>
					onChange( newVal !== '' ? Number( newVal ) : null )
				}
				style={ { height: '32px' } }
				__nextHasNoMarginBottom
			/>
		);
	}

	// STANDARD TEXT INPUT FIELD
	return renderAlignedControl(
		<TextControl
			type="text"
			value={
				value !== null && value !== undefined ? String( value ) : ''
			}
			onChange={ ( newVal ) => onChange( newVal ) }
			style={ { height: '32px' } }
			__nextHasNoMarginBottom
		/>
	);
};

const DataEditor = ( {
	building,
	draft = {},
	globalSchema = [],
	updateSchemaKey,
	updateDraft,
	onUpdate,
	onCancel,
	hasChanges,
	isSaving,
} ) => {
	if ( ! building || ! building.properties ) return null;

	const [ localProps, setLocalProps ] = useState( building.properties );
	const [ pages, setPages ] = useState( [] );
	const [ isLoadingPages, setIsLoadingPages ] = useState( true );

	const [ showSaveModal, setShowSaveModal ] = useState( false );
	const [ showCancelModal, setShowCancelModal ] = useState( false );

	// Dynamic property state
	const [ newPropLabel, setNewPropLabel ] = useState( '' );
	const [ newPropValue, setNewPropValue ] = useState( '' );
	const [ newPropType, setNewPropType ] = useState( 'text' );
	const [ showAddPropModal, setShowAddPropModal ] = useState( false );
	const [ isAddingProp, setIsAddingProp ] = useState( false );

	// Category Manager
	const { categoryMap } = useCategoryManager();

	const getValue = ( key, dbValue ) => {
		if ( draft && draft.hasOwnProperty( key ) ) return draft[ key ];
		if ( dbValue !== null && dbValue !== undefined ) return dbValue;
		if (
			localProps.custom_attributes &&
			localProps.custom_attributes[ key ] !== undefined
		) {
			return localProps.custom_attributes[ key ];
		}
		return '';
	};

	const currentCategory = getValue( 'category', localProps.category );
	const layerType = localProps.layer_type || 'buildings';
	const compositeCategoryKey = `${ layerType }::${ currentCategory }`;

	const globalCategoryColor =
		categoryMap[ compositeCategoryKey ]?.color ||
		categoryMap[ currentCategory ]?.color ||
		'#007cba';

	const categoryOptions = useMemo( () => {
		return Object.keys( categoryMap ).map( ( key ) => {
			const catSlug = key.includes( '::' ) ? key.split( '::' )[ 1 ] : key;
			return {
				label: categoryMap[ key ].label || formatFieldLabel( catSlug ),
				value: catSlug,
			};
		} );
	}, [ categoryMap ] );

	const derivedSlugKey = createKeySlug( newPropLabel );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/pages?per_page=100&_fields=id,title' } )
			.then( ( data ) => {
				const options = data.map( ( page ) => ( {
					value: page.id.toString(),
					label: page.title.rendered || `ID: ${ page.id }`,
				} ) );
				setPages( options );
			} )
			.catch( ( err ) => console.error( 'Error fetching pages:', err ) )
			.finally( () => setIsLoadingPages( false ) );
	}, [] );

	useEffect( () => {
		setLocalProps( building.properties );
	}, [ building.properties ] );

	const hasCustomFillColor =
		getValue( 'use_custom_color', localProps.use_custom_color ) === true ||
		getValue( 'use_custom_color', localProps.use_custom_color ) === 1;

	const activeFillColor =
		getValue( 'fill_color', localProps.fill_color ) || globalCategoryColor;

	const handleToggleCustomColor = ( enabled ) => {
		if ( enabled ) {
			updateDraft( {
				use_custom_color: true,
				fill_color: activeFillColor || globalCategoryColor,
			} );
		} else {
			updateDraft( {
				use_custom_color: false,
				fill_color: '',
			} );
		}
	};

	const mergedCustomAttributes = useMemo( () => {
		let baseAttrs = localProps.custom_attributes || {};
		if ( typeof baseAttrs === 'string' ) {
			try {
				baseAttrs = JSON.parse( baseAttrs );
			} catch ( e ) {
				baseAttrs = {};
			}
		}

		const draftAttrs = draft.custom_attributes || {};
		const combined = { ...baseAttrs, ...draftAttrs };

		globalSchema.forEach( ( schemaItem ) => {
			if ( ! combined.hasOwnProperty( schemaItem.key ) ) {
				combined[ schemaItem.key ] = null;
			}
		} );

		return combined;
	}, [
		localProps.custom_attributes,
		draft.custom_attributes,
		globalSchema,
	] );

	const updateCustomAttr = ( key, value ) => {
		updateDraft( {
			custom_attributes: {
				...( draft.custom_attributes ||
					localProps.custom_attributes ||
					{} ),
				[ key ]: value,
			},
		} );
	};

	const clearCustomAttrValue = ( key ) => {
		updateCustomAttr( key, null );
	};

	const handleAddCustomProperty = async () => {
		if ( ! newPropLabel.trim() || ! derivedSlugKey ) return;

		setIsAddingProp( true );

		try {
			if ( updateSchemaKey ) {
				await updateSchemaKey( {
					key: derivedSlugKey,
					label: newPropLabel.trim(),
					type: newPropType,
				} );
			}

			let formattedValue = newPropValue;
			if ( newPropType === 'number' || newPropType === 'dual_counter' ) {
				formattedValue =
					newPropValue !== '' ? Number( newPropValue ) : null;
			} else if ( newPropType === 'boolean' ) {
				formattedValue =
					newPropValue === 'true' || newPropValue === true;
			}

			updateCustomAttr( derivedSlugKey, formattedValue );

			setNewPropLabel( '' );
			setNewPropValue( '' );
			setNewPropType( 'text' );
			setShowAddPropModal( false );
		} catch ( err ) {
			console.error( 'Error adding global custom property:', err );
		} finally {
			setIsAddingProp( false );
		}
	};

	const featureName = getValue( 'name', localProps.name );
	const featureCode = getValue( 'code', localProps.code );
	const customTitle = getValue( 'title', localProps.title );
	const linkedPageId = getValue( 'wp_page_id', localProps.wp_page_id );
	const isInteractive = getValue(
		'is_interactive',
		localProps.is_interactive !== undefined
			? !! localProps.is_interactive
			: true
	);
	const showLabel = getValue(
		'show_label',
		localProps.show_label !== undefined ? !! localProps.show_label : true
	);
	const desc = getValue( 'description', localProps.description );
	const appendDescription = getValue(
		'append_description',
		!! localProps.append_description
	);

	const customVideoUrl = getValue(
		'custom_video_url',
		localProps.custom_video_url
	);
	const customFloorplanUrl = getValue(
		'custom_floorplan_url',
		localProps.custom_floorplan_url
	);
	const hidePageVideo = getValue(
		'hide_page_video',
		!! localProps.hide_page_video
	);
	const hidePageFloorplan = getValue(
		'hide_page_floorplan',
		!! localProps.hide_page_floorplan
	);

	const getGallery = () => {
		if ( draft && draft.gallery ) return draft.gallery;
		try {
			const parsed =
				typeof localProps.gallery === 'string'
					? JSON.parse( localProps.gallery )
					: localProps.gallery;
			return Array.isArray( parsed ) ? parsed : [];
		} catch ( e ) {
			return [];
		}
	};

	const currentGallery = getGallery();
	const customAttrKeys = Object.keys( mergedCustomAttributes );

	const handleConfirmSave = () => {
		setShowSaveModal( false );
		onUpdate();
	};

	return (
		<div
			className="building-editor-container"
			style={ { maxWidth: '650px' } }
		>
			<div
				style={ {
					marginBottom: '20px',
					paddingBottom: '10px',
					borderBottom: '1px solid #eee',
				} }
			>
				<Text variant="title.medium" display="block">
					{ __( 'Internal ID:', TEXT_DOMAIN ) } { localProps.fid }
				</Text>
			</div>

			<div
				style={ {
					padding: '15px',
					background: '#fafafa',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
					marginBottom: '20px',
				} }
			>
				<Text
					variant="label"
					display="block"
					style={ { fontWeight: '600', marginBottom: '12px' } }
				>
					{ __( 'Core Identification & Canvas Label', TEXT_DOMAIN ) }
				</Text>

				<Flex gap={ 3 } style={ { marginBottom: '12px' } }>
					<FlexItem style={ { flex: 1 } }>
						<TextControl
							label={ __( 'Feature Name', TEXT_DOMAIN ) }
							value={ featureName }
							onChange={ ( val ) => updateDraft( { name: val } ) }
							placeholder={ __(
								'e.g. Building A or Main Entrance',
								TEXT_DOMAIN
							) }
							help={ __(
								'Primary name used in navigation and map labels.',
								TEXT_DOMAIN
							) }
							__nextHasNoMarginBottom
						/>
					</FlexItem>
					<FlexItem style={ { flex: '0 0 180px' } }>
						<TextControl
							label={ __( 'Unit / Room Code', TEXT_DOMAIN ) }
							value={ featureCode }
							onChange={ ( val ) => updateDraft( { code: val } ) }
							placeholder={ __( 'e.g. 101A', TEXT_DOMAIN ) }
							help={ __(
								'Room or unit code label.',
								TEXT_DOMAIN
							) }
							__nextHasNoMarginBottom
						/>
					</FlexItem>
				</Flex>

				<TextControl
					label={ __(
						'Display Title (Overrides WP Page Title in Side Drawer)',
						TEXT_DOMAIN
					) }
					value={ customTitle }
					onChange={ ( val ) => updateDraft( { title: val } ) }
					placeholder={ featureName || localProps.name }
					help={ __(
						'Public header shown inside side drawer popups when selected.',
						TEXT_DOMAIN
					) }
					__nextHasNoMarginBottom
				/>
			</div>

			<div style={ { marginBottom: '20px' } }>
				<SelectControl
					label={ __( 'Feature Category', TEXT_DOMAIN ) }
					value={ currentCategory }
					options={ categoryOptions }
					onChange={ ( val ) => updateDraft( { category: val } ) }
					help={ __(
						'Determines default group placement and color theme.',
						TEXT_DOMAIN
					) }
					__nextHasNoMarginBottom
				/>
			</div>

			<div
				style={ {
					padding: '15px',
					background: '#f0f6fb',
					borderRadius: '4px',
					borderLeft: '4px solid #2271b1',
					marginBottom: '20px',
				} }
			>
				<ComboboxControl
					label={ __( 'Linked WordPress Page', TEXT_DOMAIN ) }
					value={ linkedPageId ? linkedPageId.toString() : '' }
					onChange={ ( val ) => updateDraft( { wp_page_id: val } ) }
					options={ pages }
				/>
			</div>

			<div
				style={ {
					padding: '15px',
					background: '#f9f9f9',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
					marginBottom: '20px',
				} }
			>
				<Flex
					align="center"
					justify="space-between"
					style={ {
						marginBottom: hasCustomFillColor ? '12px' : '0',
					} }
				>
					<div>
						<Text
							variant="label"
							display="block"
							style={ { fontWeight: '600' } }
						>
							{ __( 'Unit Custom Fill Color', TEXT_DOMAIN ) }
						</Text>
						<Text
							variant="caption"
							style={ { color: '#666', fontSize: '11px' } }
						>
							{ hasCustomFillColor
								? __(
										'Custom color override activated for this unit.',
										TEXT_DOMAIN
								  )
								: sprintf(
										__(
											'Using global category color (%s). Toggle on to set a custom color.',
											TEXT_DOMAIN
										),
										globalCategoryColor
								  ) }
						</Text>
					</div>

					<ToggleControl
						checked={ hasCustomFillColor }
						onChange={ handleToggleCustomColor }
						__nextHasNoMarginBottom
					/>
				</Flex>

				{ hasCustomFillColor && (
					<Flex
						align="center"
						gap={ 3 }
						style={ {
							paddingTop: '10px',
							borderTop: '1px solid #eee',
						} }
					>
						<FlexItem style={ { flex: 1 } }>
							<TextControl
								label={ __( 'Hex Color Code', TEXT_DOMAIN ) }
								value={ activeFillColor }
								onChange={ ( val ) =>
									updateDraft( { fill_color: val } )
								}
								placeholder={ globalCategoryColor }
								style={ { height: '36px' } }
								__nextHasNoMarginBottom
							/>
						</FlexItem>

						<FlexItem style={ { alignSelf: 'flex-end' } }>
							<Dropdown
								renderToggle={ ( { isOpen, onToggle } ) => (
									<Button
										onClick={ onToggle }
										aria-expanded={ isOpen }
										style={ {
											width: '36px',
											height: '36px',
											padding: 0,
											borderRadius: '4px',
											background:
												activeFillColor ||
												globalCategoryColor,
											border: '2px solid #fff',
											boxShadow: '0 0 0 1px #ccc',
											cursor: 'pointer',
										} }
									/>
								) }
								renderContent={ () => (
									<div style={ { padding: '12px' } }>
										<ColorPicker
											color={
												activeFillColor ||
												globalCategoryColor
											}
											onChangeComplete={ ( val ) =>
												updateDraft( {
													fill_color: val.hex,
												} )
											}
											disableAlpha
										/>
									</div>
								) }
							/>
						</FlexItem>
					</Flex>
				) }
			</div>

			{ /* CUSTOM FEATURE PROPERTIES */ }
			<div
				style={ {
					marginBottom: '20px',
					padding: '15px',
					background: '#f9f9f9',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				} }
			>
				<Flex
					align="center"
					justify="space-between"
					style={ { marginBottom: '12px' } }
				>
					<Text
						variant="label"
						display="block"
						style={ { fontWeight: '600' } }
					>
						{ __( 'Custom Feature Properties', TEXT_DOMAIN ) }
					</Text>
					<Button
						variant="secondary"
						isSmall
						icon="plus-alt"
						onClick={ () => setShowAddPropModal( true ) }
					>
						{ __( 'Add Property', TEXT_DOMAIN ) }
					</Button>
				</Flex>

				{ customAttrKeys.length === 0 ? (
					<Text
						variant="caption"
						style={ { color: '#666', fontStyle: 'italic' } }
					>
						{ __(
							'No custom attributes associated with this feature.',
							TEXT_DOMAIN
						) }
					</Text>
				) : (
					<div
						style={ {
							border: '1px solid #e0e0e0',
							borderRadius: '4px',
							background: '#fff',
							overflow: 'hidden',
						} }
					>
						{ customAttrKeys.map( ( key, index ) => {
							const schemaItem = globalSchema.find(
								( s ) => s.key === key
							);
							const isLast = index === customAttrKeys.length - 1;

							return (
								<div
									key={ key }
									style={ {
										padding: '10px 12px',
										borderBottom: isLast
											? 'none'
											: '1px solid #f0f0f0',
									} }
								>
									<PropertyInputControl
										propKey={ key }
										label={ schemaItem?.label }
										schemaType={ schemaItem?.type }
										value={ mergedCustomAttributes[ key ] }
										onChange={ ( newVal ) =>
											updateCustomAttr( key, newVal )
										}
										onClear={ () =>
											clearCustomAttrValue( key )
										}
									/>
								</div>
							);
						} ) }
					</div>
				) }
			</div>

			{ /* MEDIA OVERRIDES SECTION */ }
			<div
				style={ {
					marginBottom: '20px',
					padding: '15px',
					background: '#fcfcfc',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				} }
			>
				<Text
					variant="label"
					display="block"
					style={ { fontWeight: '600', marginBottom: '12px' } }
				>
					{ __(
						'Page Media Overrides (Video & Floorplan)',
						TEXT_DOMAIN
					) }
				</Text>

				<div
					style={ {
						marginBottom: '15px',
						paddingBottom: '12px',
						borderBottom: '1px solid #eee',
					} }
				>
					<ToggleControl
						label={ __( 'Hide Linked Page Video', TEXT_DOMAIN ) }
						checked={ hidePageVideo }
						onChange={ ( val ) =>
							updateDraft( { hide_page_video: val } )
						}
					/>
					{ ! hidePageVideo && (
						<div style={ { marginTop: '12px' } }>
							<TextControl
								label={ __( 'Custom Video URL', TEXT_DOMAIN ) }
								value={ customVideoUrl }
								onChange={ ( val ) =>
									updateDraft( { custom_video_url: val } )
								}
								__nextHasNoMarginBottom
							/>
						</div>
					) }
				</div>

				<div>
					<ToggleControl
						label={ __(
							'Hide Linked Page Floorplan',
							TEXT_DOMAIN
						) }
						checked={ hidePageFloorplan }
						onChange={ ( val ) =>
							updateDraft( { hide_page_floorplan: val } )
						}
					/>
					{ ! hidePageFloorplan && (
						<div
							style={ {
								marginTop: '12px',
								display: 'flex',
								gap: '8px',
								alignItems: 'flex-start',
							} }
						>
							<div style={ { flex: 1 } }>
								<TextControl
									label={ __(
										'Custom Floorplan URL',
										TEXT_DOMAIN
									) }
									value={ customFloorplanUrl }
									onChange={ ( val ) =>
										updateDraft( {
											custom_floorplan_url: val,
										} )
									}
									__nextHasNoMarginBottom
								/>
							</div>
							<Button
								variant="secondary"
								icon="upload"
								onClick={ () => {
									const frame = window.wp.media( {
										title: __(
											'Select Custom Floorplan',
											TEXT_DOMAIN
										),
										multiple: false,
									} );
									frame.on( 'select', () => {
										const attachment = frame
											.state()
											.get( 'selection' )
											.first()
											.toJSON();
										updateDraft( {
											custom_floorplan_url:
												attachment.url,
										} );
									} );
									frame.open();
								} }
								style={ { marginTop: '24px', height: '36px' } }
							/>
						</div>
					) }
				</div>
			</div>

			{ /* CUSTOM DESCRIPTION */ }
			<div style={ { marginBottom: '20px' } }>
				<TextareaControl
					label={ __( 'Custom Description', TEXT_DOMAIN ) }
					value={ desc }
					onChange={ ( val ) => updateDraft( { description: val } ) }
					rows={ 5 }
				/>

				{ linkedPageId && desc.trim().length > 0 && (
					<div
						style={ {
							marginTop: '10px',
							padding: '10px 12px',
							background: '#fff',
							border: '1px solid #ccd0d4',
							borderRadius: '4px',
						} }
					>
						<ToggleControl
							label={ __(
								'Append to WP Page Content',
								TEXT_DOMAIN
							) }
							checked={ appendDescription }
							onChange={ ( val ) =>
								updateDraft( { append_description: val } )
							}
						/>
					</div>
				) }
			</div>

			{ /* MAP BEHAVIOR TOGGLES */ }
			<div
				style={ {
					marginBottom: '20px',
					padding: '15px',
					background: '#fcfcfc',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
				} }
			>
				<Text
					variant="label"
					display="block"
					style={ { fontWeight: '600', marginBottom: '12px' } }
				>
					{ __( 'Map Interaction & Display Settings', TEXT_DOMAIN ) }
				</Text>
				<div
					style={ {
						display: 'flex',
						flexDirection: 'column',
						gap: '10px',
					} }
				>
					<ToggleControl
						label={ __(
							'Feature is Interactive (Clickable on map)',
							TEXT_DOMAIN
						) }
						checked={ isInteractive }
						onChange={ ( val ) =>
							updateDraft( { is_interactive: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Display Name/Code Label on Map Canvas',
							TEXT_DOMAIN
						) }
						checked={ showLabel }
						onChange={ ( val ) =>
							updateDraft( { show_label: val } )
						}
					/>
				</div>
			</div>

			{ /* CUSTOM GALLERY */ }
			<div style={ { margin: '20px 0' } }>
				<Text
					variant="label"
					display="block"
					style={ { marginBottom: '10px' } }
				>
					{ __( 'Custom Gallery', TEXT_DOMAIN ) }
				</Text>
				<Flex
					wrap="wrap"
					gap={ 2 }
					style={ {
						marginBottom: '15px',
						background: '#f9f9f9',
						padding: '10px',
						borderRadius: '4px',
						justifyContent: 'flex-start',
					} }
				>
					{ currentGallery.map( ( img ) => (
						<div
							key={ img.id }
							style={ {
								position: 'relative',
								width: '80px',
								height: '80px',
							} }
						>
							<img
								src={ img.url }
								style={ {
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									borderRadius: '4px',
								} }
								alt=""
							/>
							<Button
								isDestructive
								onClick={ () =>
									updateDraft( {
										gallery: currentGallery.filter(
											( g ) => g.id !== img.id
										),
									} )
								}
								style={ {
									position: 'absolute',
									top: '-5px',
									right: '-5px',
									padding: '0',
									background: '#fff',
									borderRadius: '50%',
									minWidth: '18px',
									height: '18px',
									border: '1px solid #ccc',
								} }
							>
								<Dashicon icon="no-alt" size={ 14 } />
							</Button>
						</div>
					) ) }
				</Flex>
				<Button
					variant="secondary"
					icon="upload"
					onClick={ () => {
						const frame = window.wp.media( {
							title: __( 'Manage Gallery', TEXT_DOMAIN ),
							multiple: true,
						} );
						frame.on( 'select', () => {
							const selection = frame
								.state()
								.get( 'selection' )
								.toJSON();
							const newImages = selection.map( ( img ) => ( {
								id: img.id,
								url: img.url,
							} ) );
							updateDraft( {
								gallery: [ ...currentGallery, ...newImages ],
							} );
						} );
						frame.open();
					} }
					style={ { width: '100%', justifyContent: 'center' } }
				>
					{ __( 'Manage Images', TEXT_DOMAIN ) }
				</Button>
			</div>

			{ /* ACTION BUTTONS */ }
			<Flex
				justify="flex-start"
				style={ { marginTop: '30px', gap: '15px' } }
			>
				<Button
					variant="secondary"
					onClick={ () => setShowCancelModal( true ) }
					disabled={ isSaving || ! hasChanges }
					style={ {
						height: '40px',
						flex: '1',
						justifyContent: 'center',
					} }
				>
					{ __( 'Discard All Changes', TEXT_DOMAIN ) }
				</Button>
				<Button
					variant="primary"
					isBusy={ isSaving }
					disabled={ ! hasChanges }
					onClick={ () => setShowSaveModal( true ) }
					style={ {
						height: '40px',
						flex: '1',
						justifyContent: 'center',
					} }
				>
					{ __( 'Save All Changes', TEXT_DOMAIN ) }
				</Button>
			</Flex>

			{ /* MODAL: ADD CUSTOM PROPERTY */ }
			{ showAddPropModal && (
				<Modal
					title={ __( 'Add Custom Property Globally', TEXT_DOMAIN ) }
					onRequestClose={ () => setShowAddPropModal( false ) }
				>
					<div
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: '15px',
						} }
					>
						<TextControl
							label={ __( 'Property Field Name', TEXT_DOMAIN ) }
							placeholder="e.g. Duration, Square Feet, or Fireplace"
							value={ newPropLabel }
							onChange={ setNewPropLabel }
							help={
								derivedSlugKey
									? sprintf(
											__(
												'Database Key Slug: %s',
												TEXT_DOMAIN
											),
											derivedSlugKey
									  )
									: ''
							}
						/>
						<SelectControl
							label={ __( 'Property Type', TEXT_DOMAIN ) }
							value={ newPropType }
							options={ [
								{
									label: __( 'Text String', TEXT_DOMAIN ),
									value: 'text',
								},
								{
									label: __( 'Number', TEXT_DOMAIN ),
									value: 'number',
								},
								{
									label: __(
										'Boolean (Yes/No Flag)',
										TEXT_DOMAIN
									),
									value: 'boolean',
								},
								{
									label: __(
										'Dual Counter (0.5 steps)',
										TEXT_DOMAIN
									),
									value: 'dual_counter',
								},
							] }
							onChange={ setNewPropType }
						/>
						<TextControl
							label={ __(
								'Initial Value for Active Feature',
								TEXT_DOMAIN
							) }
							placeholder="e.g. 1.5, 980, or true"
							value={ newPropValue }
							onChange={ setNewPropValue }
						/>
						<Flex
							justify="flex-end"
							style={ { marginTop: '10px' } }
						>
							<Button
								variant="tertiary"
								onClick={ () => setShowAddPropModal( false ) }
								disabled={ isAddingProp }
							>
								{ __( 'Cancel', TEXT_DOMAIN ) }
							</Button>
							<Button
								variant="primary"
								onClick={ handleAddCustomProperty }
								disabled={
									! newPropLabel.trim() || isAddingProp
								}
								isBusy={ isAddingProp }
							>
								{ __( 'Add Property Globally', TEXT_DOMAIN ) }
							</Button>
						</Flex>
					</div>
				</Modal>
			) }

			{ /* CONFIRMATION MODALS */ }
			{ showSaveModal && (
				<Modal
					title={ __( 'Save All Changes?', TEXT_DOMAIN ) }
					onRequestClose={ () => setShowSaveModal( false ) }
				>
					<p>
						{ __(
							'This will save all pending modifications to the map database.',
							TEXT_DOMAIN
						) }
					</p>
					<Flex justify="flex-end" style={ { marginTop: '20px' } }>
						<Button
							variant="tertiary"
							onClick={ () => setShowSaveModal( false ) }
						>
							{ __( 'Wait, go back', TEXT_DOMAIN ) }
						</Button>
						<Button variant="primary" onClick={ handleConfirmSave }>
							{ __( 'Confirm and Save All', TEXT_DOMAIN ) }
						</Button>
					</Flex>
				</Modal>
			) }

			{ showCancelModal && (
				<Modal
					title={ __( 'Discard Changes?', TEXT_DOMAIN ) }
					onRequestClose={ () => setShowCancelModal( false ) }
				>
					<p>
						{ __( 'You have unsaved modifications.', TEXT_DOMAIN ) }
					</p>
					<Flex justify="flex-end" style={ { marginTop: '20px' } }>
						<Button
							variant="tertiary"
							onClick={ () => setShowCancelModal( false ) }
						>
							{ __( 'Keep editing', TEXT_DOMAIN ) }
						</Button>
						<Button
							isDestructive
							onClick={ () => {
								onCancel();
								setShowCancelModal( false );
							} }
						>
							{ __( 'Discard Everything', TEXT_DOMAIN ) }
						</Button>
					</Flex>
				</Modal>
			) }
		</div>
	);
};

export default DataEditor;