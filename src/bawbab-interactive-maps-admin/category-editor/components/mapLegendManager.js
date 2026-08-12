import { useState } from '@wordpress/element';
import {
	Panel,
	PanelBody,
	Button,
	CheckboxControl,
	ToggleControl,
	Flex,
	FlexItem,
	TextControl,
	SelectControl,
	Modal,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const MapLegendManager = ( {
	categoryMap,
	legendConfig,
	setLegendConfig,
	isOpen,
	onToggle,
} ) => {
	const [ showMergeModal, setShowMergeModal ] = useState( false );
	const [ mergeLabel, setMergeLabel ] = useState( '' );
	const [ selectedMergeCats, setSelectedMergeCats ] = useState( [] );
	const [ targetSectionId, setTargetSectionId ] = useState( '' );
	const [ newSectionTitle, setNewSectionTitle ] = useState( '' );

	const allCategoryKeys = Object.keys( categoryMap );

	// Compute set of categories that are ALREADY merged into existing merge lines
	const alreadyMergedCategorySet = new Set(
		( legendConfig.sections || [] ).flatMap( ( sec ) =>
			( sec.items || [] )
				.filter( ( item ) => item.type === 'merged' )
				.flatMap( ( item ) => item.categories || [] )
		)
	);

	// 1. Add Custom Legend Section
	const handleAddSection = () => {
		if ( ! newSectionTitle.trim() ) return;
		const newSec = {
			id: `sec_${ Date.now() }`,
			title: newSectionTitle.trim(),
			items: [],
		};
		setLegendConfig( ( prev ) => ( {
			...prev,
			sections: [ ...( prev.sections || [] ), newSec ],
		} ) );
		setNewSectionTitle( '' );
	};

	// 2. Remove Section Header
	const handleRemoveSection = ( secId ) => {
		setLegendConfig( ( prev ) => {
			if ( ( prev.sections || [] ).length <= 1 ) {
				alert(
					__(
						'You must keep at least one legend section group.',
						TEXT_DOMAIN
					)
				);
				return prev;
			}

			const targetSec = prev.sections.find( ( s ) => s.id === secId );
			if ( ! targetSec ) return prev;

			const remainingSections = prev.sections.filter(
				( s ) => s.id !== secId
			);
			if ( targetSec.items.length > 0 ) {
				remainingSections[ 0 ].items = [
					...remainingSections[ 0 ].items,
					...targetSec.items,
				];
			}

			return { ...prev, sections: remainingSections };
		} );
	};

	// 3. Rename Section Header
	const handleRenameSection = ( secId, title ) => {
		setLegendConfig( ( prev ) => ( {
			...prev,
			sections: prev.sections.map( ( s ) =>
				s.id === secId ? { ...s, title } : s
			),
		} ) );
	};

	// 4. Toggle Visibility Checkbox for Legend Item
	const handleToggleItem = ( secId, itemId, checked ) => {
		setLegendConfig( ( prev ) => ( {
			...prev,
			sections: prev.sections.map( ( sec ) => {
				if ( sec.id !== secId ) return sec;
				return {
					...sec,
					items: sec.items.map( ( item ) =>
						item.id === itemId
							? { ...item, showInLegend: checked }
							: item
					),
				};
			} ),
		} ) );
	};

	// 5. Reorder Items Within Section
	const handleMoveItemOrder = ( secIndex, itemIndex, direction ) => {
		const sections = [ ...legendConfig.sections ];
		const items = [ ...sections[ secIndex ].items ];
		const targetIndex = itemIndex + direction;

		if ( targetIndex < 0 || targetIndex >= items.length ) return;

		const temp = items[ itemIndex ];
		items[ itemIndex ] = items[ targetIndex ];
		items[ targetIndex ] = temp;

		sections[ secIndex ].items = items;
		setLegendConfig( ( prev ) => ( { ...prev, sections } ) );
	};

	// 6. TRANSFER ITEM TO A DIFFERENT SECTION
	const handleTransferItemToSection = ( currentSecId, itemId, newSecId ) => {
		if ( ! newSecId || currentSecId === newSecId ) return;

		setLegendConfig( ( prev ) => {
			let itemToMove = null;

			const updatedSections = ( prev.sections || [] ).map( ( sec ) => {
				if ( sec.id === currentSecId ) {
					const found = sec.items.find( ( i ) => i.id === itemId );
					if ( found ) itemToMove = found;
					return {
						...sec,
						items: sec.items.filter( ( i ) => i.id !== itemId ),
					};
				}
				return sec;
			} );

			if ( itemToMove ) {
				const targetSec = updatedSections.find(
					( s ) => s.id === newSecId
				);
				if ( targetSec ) {
					targetSec.items.push( itemToMove );
				}
			}

			return { ...prev, sections: updatedSections };
		} );
	};

	// 7. Merge Categories into 1 Legend Line (FIXED: NEVER WIPES PREVIOUS MERGES)
	const handleConfirmMergeCategories = () => {
		if ( ! mergeLabel.trim() || selectedMergeCats.length < 2 ) return;

		const newMergedItem = {
			id: `merge_${ Date.now() }`,
			label: mergeLabel.trim(),
			type: 'merged',
			categories: selectedMergeCats,
			showInLegend: true,
		};

		const targetCatSet = new Set( selectedMergeCats );

		// Filter out single items that are being merged, while preserving existing merged items
		const updatedSections = ( legendConfig.sections || [] ).map(
			( sec ) => {
				const cleanItems = ( sec.items || [] ).filter( ( item ) => {
					if ( item.type === 'merged' ) {
						// Always keep existing merged items unless every category in it was re-selected
						return true;
					}
					// For single items, remove if its category is in the new merge
					return ! item.categories.some( ( c ) =>
						targetCatSet.has( c )
					);
				} );

				return { ...sec, items: cleanItems };
			}
		);

		const secToAddTo = targetSectionId || updatedSections[ 0 ]?.id;
		const targetSec =
			updatedSections.find( ( s ) => s.id === secToAddTo ) ||
			updatedSections[ 0 ];

		if ( targetSec ) {
			targetSec.items.unshift( newMergedItem );
		}

		setLegendConfig( ( prev ) => ( {
			...prev,
			sections: updatedSections,
		} ) );
		setMergeLabel( '' );
		setSelectedMergeCats( [] );
		setShowMergeModal( false );
	};

	// 8. Unmerge Multi-Color Category Item
	const handleUnmergeItem = ( secId, itemId ) => {
		const sections = [ ...legendConfig.sections ];
		const sec = sections.find( ( s ) => s.id === secId );
		if ( ! sec ) return;

		const targetItem = sec.items.find( ( i ) => i.id === itemId );
		if ( ! targetItem || targetItem.type !== 'merged' ) return;

		const restoredItems = targetItem.categories.map( ( compositeKey ) => {
			const catSlug = compositeKey.includes( '::' )
				? compositeKey.split( '::' )[ 1 ]
				: compositeKey;
			return {
				id: `leg_${ compositeKey }_${ Date.now() }`,
				label: categoryMap[ compositeKey ]?.label || catSlug,
				type: 'single',
				categories: [ compositeKey ],
				showInLegend: true,
			};
		} );

		sec.items = sec.items
			.filter( ( i ) => i.id !== itemId )
			.concat( restoredItems );
		setLegendConfig( ( prev ) => ( { ...prev, sections } ) );
	};

	const sectionDropdownOptions = ( legendConfig.sections || [] ).map(
		( s ) => ( {
			label: s.title || s.id,
			value: s.id,
		} )
	);

	return (
		<Panel
			style={ {
				background: '#fff',
				border: '1px solid #e0e0e0',
				borderRadius: '6px',
				marginBottom: '25px',
			} }
		>
			<PanelBody
				title={ __(
					'3. Map Legend Customizer & Sections',
					TEXT_DOMAIN
				) }
				opened={ isOpen }
				onToggle={ onToggle }
			>
				<p
					style={ {
						fontSize: '13px',
						color: '#666',
						marginBottom: '15px',
					} }
				>
					{ __(
						'Create custom section groups for the legend, rename headers, reorder entries, or move items across sections without altering underlying spatial keys.',
						TEXT_DOMAIN
					) }
				</p>

				{ /* CONTROL HEADER */ }
				<div
					style={ {
						marginBottom: '20px',
						padding: '14px',
						background: '#f9f9f9',
						borderRadius: '6px',
						border: '1px solid #eee',
					} }
				>
					<div
						style={ {
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '16px',
						} }
					>
						<div
							style={ {
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								gap: '20px',
							} }
						>
							<ToggleControl
								label={ __(
									'Enable Public Map Legend',
									TEXT_DOMAIN
								) }
								checked={ Boolean( legendConfig.enabled ) }
								onChange={ ( val ) =>
									setLegendConfig( ( prev ) => ( {
										...prev,
										enabled: val,
									} ) )
								}
								__nextHasNoMarginBottom
							/>

							<ToggleControl
								label={ __(
									'Show Section Titles in Public Legend',
									TEXT_DOMAIN
								) }
								checked={
									legendConfig.showSectionHeaders !== false
								}
								onChange={ ( val ) =>
									setLegendConfig( ( prev ) => ( {
										...prev,
										showSectionHeaders: val,
									} ) )
								}
								disabled={ ! legendConfig.enabled }
								__nextHasNoMarginBottom
							/>
						</div>

						<Button
							variant="secondary"
							icon="groups"
							onClick={ () => setShowMergeModal( true ) }
							disabled={ ! legendConfig.enabled }
						>
							{ __(
								'Merge Categories into 1 Line',
								TEXT_DOMAIN
							) }
						</Button>
					</div>
				</div>

				{ legendConfig.enabled && (
					<div>
						{ /* SECTIONS RENDERING */ }
						{ ( legendConfig.sections || [] ).map(
							( section, secIdx ) => (
								<div
									key={ section.id }
									style={ {
										marginBottom: '20px',
										border: '1px solid #e0e0e0',
										borderRadius: '4px',
										background: '#fff',
										overflow: 'hidden',
									} }
								>
									<div
										style={ {
											padding: '10px 12px',
											background: '#f5f5f5',
											borderBottom: '1px solid #e0e0e0',
										} }
									>
										<Flex
											align="center"
											justify="space-between"
											gap={ 3 }
										>
											<FlexItem style={ { flex: 1 } }>
												<TextControl
													value={ section.title }
													onChange={ ( val ) =>
														handleRenameSection(
															section.id,
															val
														)
													}
													style={ {
														height: '32px',
														fontWeight: '700',
													} }
													__nextHasNoMarginBottom
												/>
											</FlexItem>
											<Button
												isDestructive
												isSmall
												icon="trash"
												onClick={ () =>
													handleRemoveSection(
														section.id
													)
												}
												label={ __(
													'Delete Section Header',
													TEXT_DOMAIN
												) }
											/>
										</Flex>
									</div>

									<div
										style={ {
											borderBottom: '1px solid #eee',
										} }
									>
										<div
											style={ {
												display: 'grid',
												gridTemplateColumns:
													'50px 1fr 140px 120px 80px 70px',
												gap: '8px',
												padding: '8px 12px',
												background: '#fafafa',
												fontSize: '11px',
												fontWeight: '600',
												color: '#666',
											} }
										>
											<span
												style={ {
													textAlign: 'center',
												} }
											>
												{ __( 'Show', TEXT_DOMAIN ) }
											</span>
											<span>
												{ __(
													'Legend Label',
													TEXT_DOMAIN
												) }
											</span>
											<span>
												{ __(
													'Move to Section',
													TEXT_DOMAIN
												) }
											</span>
											<span>
												{ __(
													'Swatches',
													TEXT_DOMAIN
												) }
											</span>
											<span
												style={ {
													textAlign: 'center',
												} }
											>
												{ __( 'Reorder', TEXT_DOMAIN ) }
											</span>
											<span
												style={ {
													textAlign: 'center',
												} }
											>
												{ __( 'Action', TEXT_DOMAIN ) }
											</span>
										</div>

										{ section.items.map(
											( item, itemIdx ) => {
												const isFirst = itemIdx === 0;
												const isLast =
													itemIdx ===
													section.items.length - 1;

												return (
													<div
														key={ item.id }
														style={ {
															display: 'grid',
															gridTemplateColumns:
																'50px 1fr 140px 120px 80px 70px',
															gap: '8px',
															padding: '8px 12px',
															alignItems:
																'center',
															borderTop:
																'1px solid #eee',
															opacity:
																item.showInLegend
																	? 1
																	: 0.5,
														} }
													>
														{ /* Visibility Checkbox */ }
														<div
															style={ {
																textAlign:
																	'center',
															} }
														>
															<CheckboxControl
																checked={ Boolean(
																	item.showInLegend
																) }
																onChange={ (
																	checked
																) =>
																	handleToggleItem(
																		section.id,
																		item.id,
																		checked
																	)
																}
																__nextHasNoMarginBottom
															/>
														</div>

														{ /* Title / Label */ }
														<div>
															<strong>
																{ item.label }
															</strong>
															{ item.type ===
																'merged' && (
																<span
																	style={ {
																		fontSize:
																			'10px',
																		color: '#2271b1',
																		marginLeft:
																			'6px',
																		background:
																			'#f0f6fb',
																		padding:
																			'2px 4px',
																		borderRadius:
																			'3px',
																	} }
																>
																	{ sprintf(
																		__(
																			'[Merged %d]',
																			TEXT_DOMAIN
																		),
																		item
																			.categories
																			.length
																	) }
																</span>
															) }
														</div>

														{ /* TRANSFER TO SECTION DROPDOWN */ }
														<div>
															<SelectControl
																value={
																	section.id
																}
																options={
																	sectionDropdownOptions
																}
																onChange={ (
																	newSecId
																) =>
																	handleTransferItemToSection(
																		section.id,
																		item.id,
																		newSecId
																	)
																}
																style={ {
																	height: '28px',
																	fontSize:
																		'11px',
																	padding:
																		'0 6px',
																} }
																__nextHasNoMarginBottom
															/>
														</div>

														{ /* Color Swatches */ }
														<Flex
															align="center"
															gap={ 1 }
														>
															{ item.categories.map(
																(
																	compositeKey
																) => {
																	const catColor =
																		categoryMap[
																			compositeKey
																		]
																			?.color ||
																		'#007cba';
																	return (
																		<div
																			key={
																				compositeKey
																			}
																			title={ `${
																				categoryMap[
																					compositeKey
																				]
																					?.label ||
																				compositeKey
																			} (${ catColor })` }
																			style={ {
																				width: '16px',
																				height: '16px',
																				borderRadius:
																					'50%',
																				background:
																					catColor,
																				border: '1px solid #ccc',
																			} }
																		/>
																	);
																}
															) }
														</Flex>

														{ /* Up/Down Reorder */ }
														<Flex
															justify="center"
															gap={ 1 }
														>
															<Button
																isSmall
																icon="arrow-up-alt2"
																disabled={
																	isFirst
																}
																onClick={ () =>
																	handleMoveItemOrder(
																		secIdx,
																		itemIdx,
																		-1
																	)
																}
															/>
															<Button
																isSmall
																icon="arrow-down-alt2"
																disabled={
																	isLast
																}
																onClick={ () =>
																	handleMoveItemOrder(
																		secIdx,
																		itemIdx,
																		1
																	)
																}
															/>
														</Flex>

														{ /* Unmerge Action */ }
														<div
															style={ {
																textAlign:
																	'center',
															} }
														>
															{ item.type ===
																'merged' && (
																<Button
																	isSmall
																	isDestructive
																	icon="editor-break"
																	onClick={ () =>
																		handleUnmergeItem(
																			section.id,
																			item.id
																		)
																	}
																	label={ __(
																		'Unmerge Categories',
																		TEXT_DOMAIN
																	) }
																/>
															) }
														</div>
													</div>
												);
											}
										) }
									</div>
								</div>
							)
						) }

						{ /* CREATE NEW LEGEND SECTION HEADER */ }
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
										'Add Custom Legend Section Header',
										TEXT_DOMAIN
									) }
									placeholder="e.g. Housing & Residential, Amenities, or Outdoor Features"
									value={ newSectionTitle }
									onChange={ setNewSectionTitle }
									style={ { height: '36px' } }
									__nextHasNoMarginBottom
								/>
							</div>
							<Button
								variant="secondary"
								icon="plus-alt"
								onClick={ handleAddSection }
								disabled={ ! newSectionTitle.trim() }
								style={ { height: '36px' } }
							>
								{ __( 'Add Section', TEXT_DOMAIN ) }
							</Button>
						</div>
					</div>
				) }
			</PanelBody>

			{ /* MODAL: MERGE CATEGORIES */ }
			{ showMergeModal && (
				<Modal
					title={ __(
						'Merge Categories into Single Legend Entry',
						TEXT_DOMAIN
					) }
					onRequestClose={ () => setShowMergeModal( false ) }
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
							label={ __(
								'Unified Legend Entry Label',
								TEXT_DOMAIN
							) }
							placeholder="e.g. Indoor Pathing Systems"
							value={ mergeLabel }
							onChange={ setMergeLabel }
						/>

						<SelectControl
							label={ __(
								'Target Legend Section Group',
								TEXT_DOMAIN
							) }
							value={ targetSectionId }
							options={ ( legendConfig.sections || [] ).map(
								( s ) => ( { label: s.title, value: s.id } )
							) }
							onChange={ setTargetSectionId }
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
								{ __(
									'Select Categories to Merge (At least 2)',
									TEXT_DOMAIN
								) }
							</label>
							<div
								style={ {
									maxHeight: '200px',
									overflowY: 'auto',
									border: '1px solid #eee',
									padding: '10px',
									borderRadius: '4px',
								} }
							>
								{ allCategoryKeys.map( ( compositeKey ) => {
									const isChecked =
										selectedMergeCats.includes(
											compositeKey
										);
									const isAlreadyMerged =
										alreadyMergedCategorySet.has(
											compositeKey
										);
									const catInfo =
										categoryMap[ compositeKey ] || {};

									return (
										<div
											key={ `merge_wrap_${ compositeKey }` }
											style={ {
												opacity: isAlreadyMerged
													? 0.5
													: 1,
											} }
										>
											<CheckboxControl
												label={ `${
													catInfo.label ||
													compositeKey
												} [${
													catInfo.layer_type ||
													'buildings'
												}] ${
													isAlreadyMerged
														? __(
																'(Already Merged)',
																TEXT_DOMAIN
														  )
														: ''
												}` }
												checked={ isChecked }
												disabled={ isAlreadyMerged }
												onChange={ ( checked ) => {
													if ( checked ) {
														setSelectedMergeCats(
															( prev ) => [
																...prev,
																compositeKey,
															]
														);
													} else {
														setSelectedMergeCats(
															( prev ) =>
																prev.filter(
																	( s ) =>
																		s !==
																		compositeKey
																)
														);
													}
												} }
											/>
										</div>
									);
								} ) }
							</div>
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
								onClick={ () => setShowMergeModal( false ) }
							>
								{ __( 'Cancel', TEXT_DOMAIN ) }
							</Button>
							<Button
								variant="primary"
								onClick={ handleConfirmMergeCategories }
								disabled={
									! mergeLabel.trim() ||
									selectedMergeCats.length < 2
								}
							>
								{ __( 'Merge into Single Item', TEXT_DOMAIN ) }
							</Button>
						</Flex>
					</div>
				</Modal>
			) }
		</Panel>
	);
};
