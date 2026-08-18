/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import {
	PanelBody,
	RangeControl,
	Placeholder,
	Spinner,
	TextControl,
} from '@wordpress/components';
import BawBabIMaps from './components/maps';

const MIN_MAP_ZOOM = 15;
const MAX_MAP_ZOOM = 20;

export default function Edit( { attributes, setAttributes } ) {
	const { zoom, tilt, width, height } = attributes;
	const [ settingsData, setSettingsData ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		// Use apiFetch to get the global settings object
		apiFetch( { path: '/wp/v2/settings' } )
			.then( ( response ) => {
				const data = response.bawbin_maps_options_data;
				if ( data ) {
					setSettingsData( data );
				}
			} )
			.catch( ( err ) =>
				console.error( 'Error loading map settings:', err )
			)
			.finally( () => setIsLoading( false ) );
	}, [] );

	const blockProps = useBlockProps();

	if ( isLoading ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					label={ __(
						'Loading Map Data...',
						'bawbab-interactive-maps'
					) }
				>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	// Extract the locations AND the theme from the fetched settings
	const locations = settingsData?.locations || [];
	const colorTheme = settingsData?.colorTheme || 'blue';
	const mapLogo = settingsData?.mapLogo || '';
	const googleApiKey = settingsData?.googleApiKey || '';
	const googleMapId = settingsData?.googleMapId || '';
	const navBackground = settingsData?.navBackground || '';
	const mapType = settingsData?.mapType || 'hybrid';

	return (
		<div { ...blockProps }>
			{ /* Sidebar Settings */ }
			<InspectorControls>
				<PanelBody
					title={ __(
						'Map display Settings',
						'bawbab-interactive-maps'
					) }
				>
					<RangeControl
						label="Default Zoom Level"
						value={ attributes.zoom }
						onChange={ ( val ) =>
							setAttributes( {
								zoom: Math.max( MIN_MAP_ZOOM, val ),
							} )
						}
						min={ MIN_MAP_ZOOM }
						max={ MAX_MAP_ZOOM }
					/>
					{ /* Tilt control hidden — map does not use 3D rendering */ }
					<RangeControl
						label="Tilt Angle"
						value={ attributes.tilt }
						onChange={ ( val ) => setAttributes( { tilt: val } ) }
						min={ 0 }
						max={ 90 }
					/>
					<TextControl
						label={ __( 'Map Width', 'bawbab-interactive-maps' ) }
						value={ attributes.width }
						onChange={ ( val ) => setAttributes( { width: val } ) }
						help={ __(
							'e.g., 100% or 600px',
							'bawbab-interactive-maps'
						) }
					/>
					<TextControl
						label={ __( 'Map Height', 'bawbab-interactive-maps' ) }
						value={ attributes.height }
						onChange={ ( val ) => setAttributes( { height: val } ) }
						help={ __( 'e.g., 400px', 'bawbab-interactive-maps' ) }
					/>
					<p style={ { fontSize: '11px', color: '#757575' } }>
						{ __(
							'Note: Locations are managed in the ',
							'bawbab-interactive-maps'
						) }
						<a
							href="admin.php?page=bawbab-interactive-maps-settings"
							target="_blank"
						>
							{ __(
								'Map Settings Page',
								'bawbab-interactive-maps'
							) }
						</a>
						.
					</p>
				</PanelBody>
			</InspectorControls>

			{ /* The Visual Imap */ }

			<BawBabIMaps
				/* Force clean mount when settings finally arrive */
				key={ `gutenberg-map-${ googleApiKey }` }
				locations={ locations }
				zoom={ zoom }
				tilt={ tilt }
				width={ attributes.width }
				height={ attributes.height }
				mapLogo={ mapLogo }
				navBackgroundProp={ navBackground }
				colorTheme={ colorTheme }
				apiKeyProp={ googleApiKey }
				mapIdProp={ googleMapId }
				mapTypeProp={ mapType }
			/>
		</div>
	);
}
