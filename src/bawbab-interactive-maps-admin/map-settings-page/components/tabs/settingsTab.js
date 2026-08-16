import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	SelectControl,
	Flex,
	Button,
} from '@wordpress/components';
import { WPMediaUploader } from '../../utils/WPMediaUploader';

export const SettingsTab = ( {
	mapLogo,
	setMapLogo,
	navBackground,
	setNavBackground,
	colorTheme,
	setColorTheme,
} ) => {
	return (
		<div className="tab-content">
			<Text
				variant="title.small"
				display="block"
				style={ { marginBottom: '15px' } }
			>
				{ __(
					'Layout & Branding Settings',
					'bawbab-interactive-maps'
				) }
			</Text>

			{ /* --- LOGO SECTION --- */ }
			<div
				style={ {
					padding: '20px',
					background: '#f9f9f9',
					borderRadius: '4px',
					border: '1px solid #e0e0e0',
				} }
			>
				<Text
					variant="label"
					display="block"
					style={ { marginBottom: '10px', fontWeight: '600' } }
				>
					{ __( 'Map Logo', 'bawbab-interactive-maps' ) }
				</Text>

				{ mapLogo && (
					<div
						style={ {
							marginBottom: '15px',
							background: '#fff',
							padding: '10px',
							border: '1px solid #ccc',
							display: 'inline-block',
						} }
					>
						<img
							src={ mapLogo }
							alt={ __(
								'Logo Preview',
								'bawbab-interactive-maps'
							) }
							style={ {
								maxHeight: '80px',
								maxWidth: '100%',
								display: 'block',
							} }
						/>
					</div>
				) }

				<Flex justify="space-between" gap={ 3 }>
					<Button
						variant="secondary"
						onClick={ () =>
							WPMediaUploader(
								( img ) => setMapLogo( img.url ),
								'Logo'
							)
						}
					>
						{ mapLogo
							? __( 'Change Logo', 'bawbab-interactive-maps' )
							: __( 'Upload Logo', 'bawbab-interactive-maps' ) }
					</Button>
					{ mapLogo && (
						<Button
							isDestructive
							variant="link"
							onClick={ () => setMapLogo( '' ) }
						>
							{ __( 'Remove Logo', 'bawbab-interactive-maps' ) }
						</Button>
					) }
				</Flex>
				<Text
					variant="muted"
					display="block"
					style={ { marginTop: '10px' } }
				>
					{ __(
						'This logo will appear in the top navigation bar of the interactive map.',
						'bawbab-interactive-maps'
					) }
				</Text>
			</div>

			{ /* --- NAVBAR BACKGROUND SECTION --- */ }
			<div
				style={ {
					marginTop: '20px',
					padding: '20px',
					background: '#f9f9f9',
					borderRadius: '4px',
					border: '1px solid #e0e0e0',
				} }
			>
				<Text
					variant="label"
					display="block"
					style={ { marginBottom: '10px', fontWeight: '600' } }
				>
					{ __(
						'Navbar Background Image',
						'bawbab-interactive-maps'
					) }
				</Text>

				<Flex justify="space-between" gap={ 3 }>
					<Button
						variant="secondary"
						onClick={ () => {
							const frame = window.wp.media( {
								title: __(
									'Select Background',
									'bawbab-interactive-maps'
								),
								multiple: false,
							} );
							frame.on( 'select', () =>
								setNavBackground(
									frame
										.state()
										.get( 'selection' )
										.first()
										.toJSON().url
								)
							);
							frame.open();
						} }
					>
						{ navBackground
							? __(
									'Change Background',
									'bawbab-interactive-maps'
							  )
							: __(
									'Upload Background',
									'bawbab-interactive-maps'
							  ) }
					</Button>
					{ navBackground && (
						<Button
							isDestructive
							variant="link"
							onClick={ () => setNavBackground( '' ) }
						>
							{ __(
								'Remove Background',
								'bawbab-interactive-maps'
							) }
						</Button>
					) }
				</Flex>
				<Text
					variant="caption"
					color="#666"
					display="block"
					style={ { marginTop: '10px' } }
				>
					{ __(
						'Will be displayed as a faded background in the top bar.',
						'bawbab-interactive-maps'
					) }
				</Text>
			</div>

			<hr style={ { margin: '25px 0' } } />

			{ /* --- COLOR THEME SECTION --- */ }
			<SelectControl
				label={ __( 'Color Theme', 'bawbab-interactive-maps' ) }
				value={ colorTheme }
				options={ [
					{
						label: __(
							'Corporate Blue',
							'bawbab-interactive-maps'
						),
						value: 'blue',
					},
					{
						label: __( 'Nature Green', 'bawbab-interactive-maps' ),
						value: 'green',
					},
					{
						label: __( 'Estate Yellow', 'bawbab-interactive-maps' ),
						value: 'yellow',
					},
				] }
				onChange={ setColorTheme }
			/>

			{ /* VISUAL THEME PREVIEW BOX */ }
			<div
				className={ `map-theme-${ colorTheme }` }
				style={ {
					marginTop: '15px',
					padding: '15px',
					border: '1px solid #ddd',
					borderRadius: '8px',
				} }
			>
				<div
					style={ {
						background: 'var(--map-header-bg)',
						padding: '10px',
						borderRadius: '4px',
						borderLeft: '4px solid var(--map-primary)',
					} }
				>
					<strong
						style={ {
							color: 'var(--map-primary)',
							fontSize: '12px',
							display: 'block',
						} }
					>
						{ __( 'Theme Preview', 'bawbab-interactive-maps' ) }
					</strong>
					<span
						style={ {
							color: 'var(--map-text-dark)',
							fontSize: '11px',
						} }
					>
						{ __(
							'This is how titles and highlights will appear.',
							'bawbab-interactive-maps'
						) }
					</span>
				</div>
				<div
					style={ {
						marginTop: '10px',
						background: 'var(--map-accent)',
						padding: '8px',
						fontSize: '10px',
						borderRadius: '4px',
						textAlign: 'center',
						color: 'var(--map-primary)',
						fontWeight: 'bold',
					} }
				>
					{ __(
						'Active Button / Hover State',
						'bawbab-interactive-maps'
					) }
				</div>
			</div>
		</div>
	);
};
