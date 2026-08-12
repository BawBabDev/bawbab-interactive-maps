import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	TextareaControl,
	SelectControl,
	PanelBody,
	Flex,
	FlexItem,
	TextControl,
	Button,
} from '@wordpress/components';

export const MapsTab = ( {
	mapDescription,
	setMapDescription,
	mapType,
	setMapType,
	googleApiKey,
	setGoogleApiKey,
	googleMapId,
	setGoogleMapId,
} ) => {
	const [ showApiKey, setShowApiKey ] = useState( false );
	const [ showMapId, setShowMapId ] = useState( false );

	return (
		<div className="tab-content">
			<Text
				variant="title.small"
				display="block"
				style={ { marginBottom: '15px' } }
			>
				{ __(
					'Global Map Details & Provider Settings',
					'bawbab-interactive-maps'
				) }
			</Text>

			{ /* --- MAP DESCRIPTION --- */ }
			<TextareaControl
				label={ __(
					'Main Map Description',
					'bawbab-interactive-maps'
				) }
				value={ mapDescription }
				onChange={ setMapDescription }
				rows={ 5 }
			/>

			<hr style={ { margin: '20px 0' } } />

			{ /* --- DEFAULT MAP VIEW --- */ }
			<SelectControl
				label={ __( 'Default Map View', 'bawbab-interactive-maps' ) }
				value={ mapType }
				options={ [
					{
						label: __(
							'Normal (Roadmap)',
							'bawbab-interactive-maps'
						),
						value: 'roadmap',
					},
					{
						label: __( 'Hybrid', 'bawbab-interactive-maps' ),
						value: 'hybrid',
					},
					{
						label: __( 'Satellite', 'bawbab-interactive-maps' ),
						value: 'satellite',
					},
				] }
				onChange={ setMapType }
			/>

			{ /* --- GOOGLE MAPS CONFIGURATION --- */ }
			<PanelBody
				title={ __(
					'Google Maps API Credentials',
					'bawbab-interactive-maps'
				) }
				style={ { marginTop: '20px' } }
			>
				{ /* API KEY INPUT */ }
				<div style={ { marginBottom: '15px' } }>
					<Flex align="center" gap={ 0 }>
						<FlexItem style={ { flexGrow: 1 } }>
							<TextControl
								label={ __(
									'Google Maps API Key',
									'bawbab-interactive-maps'
								) }
								type={ showApiKey ? 'text' : 'password' }
								value={ googleApiKey }
								onChange={ setGoogleApiKey }
								__nextHasNoMarginBottom
							/>
						</FlexItem>
						<FlexItem>
							<Button
								variant="tertiary"
								icon={ showApiKey ? 'visibility' : 'hidden' }
								onClick={ () => setShowApiKey( ! showApiKey ) }
								style={ {
									height: '30px',
									padding: '0 4px',
									marginTop: '26px',
									boxShadow: 'none',
									minWidth: 'auto',
									border: 'none',
									textDecoration: 'none',
								} }
							/>
						</FlexItem>
					</Flex>
					<Text
						variant="caption"
						color="#666"
						style={ { marginTop: '4px', display: 'block' } }
					>
						{ __(
							'Enter your API key from the Google Cloud Console.',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>

				{ /* MAP ID INPUT */ }
				<div>
					<Flex align="center" gap={ 0 }>
						<FlexItem style={ { flexGrow: 1 } }>
							<TextControl
								label={ __(
									'Google Map ID',
									'bawbab-interactive-maps'
								) }
								type={ showMapId ? 'text' : 'password' }
								value={ googleMapId }
								onChange={ setGoogleMapId }
								__nextHasNoMarginBottom
							/>
						</FlexItem>
						<FlexItem>
							<Button
								variant="tertiary"
								icon={ showMapId ? 'visibility' : 'hidden' }
								onClick={ () => setShowMapId( ! showMapId ) }
								style={ {
									height: '30px',
									padding: '0 4px',
									marginTop: '26px',
									boxShadow: 'none',
									minWidth: 'auto',
									border: 'none',
									textDecoration: 'none',
								} }
							/>
						</FlexItem>
					</Flex>
					<Text
						variant="caption"
						color="#666"
						style={ { marginTop: '4px', display: 'block' } }
					>
						{ __(
							'Required for Advanced Markers and Cloud Styling.',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>
		</div>
	);
};
