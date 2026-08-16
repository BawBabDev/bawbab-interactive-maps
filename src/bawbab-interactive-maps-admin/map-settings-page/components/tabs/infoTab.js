import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	Dashicon,
	Flex,
	FlexItem,
	Strong,
	ExternalLink,
	__experimentalText as Text,
} from '@wordpress/components';

export const InfoTab = () => {
	return (
		<div
			className="tab-content bawbab-info-tab-container"
			style={ { padding: '5px 0' } }
		>
			{ /* --- COMPLIANT HEADER CONTAINER --- */ }
			<div style={ { marginBottom: '20px', paddingBottom: '15px' } }>
				<Text
					variant="title.small"
					display="block"
					style={ { fontWeight: '600', color: '#101828' } }
				>
					{ __(
						'About Bawbab Interactive Maps',
						'bawbab-interactive-maps'
					) }
				</Text>
				<Text
					variant="caption"
					display="block"
					style={ { color: '#667085', marginTop: '4px' } }
				>
					{ __(
						'This is an interactive mapping plugin used by campuses, estates and other facilities to provide a visual representation of estate locations, buildings, and points of interest.It is designed to enhance user experience by offering an intuitive interface for exploring and interacting with spatial data.',
						'bawbab-interactive-maps'
					) }
				</Text>
			</div>
			<Text
				variant="title.small"
				display="block"
				style={ {
					fontWeight: '600',
					color: '#101828',
					marginBottom: '10px',
				} }
			>
				{ __( 'FAQs', 'bawbab-interactive-maps' ) }
			</Text>
			{ /* --- FAQ1 --- */ }
			<PanelBody
				title={ __(
					'Can I update metadata by importing a new GeoJSON?',
					'bawbab-interactive-maps'
				) }
				initialOpen={ true }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							"No. The importer updates spatial geometries (outlines, paths, boundaries) without affecting custom WordPress database entries. Changes to metadata inside a new GeoJSON will not overwrite existing site content. To completely replace metadata, you must use the 'Clear Layer' option first, which permanently deletes all existing customizations for that layer.",
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>

			{ /* --- FAQ2 --- */ }
			<PanelBody
				title={ __(
					'What happens when new buildings are added to the GeoJSON?',
					'bawbab-interactive-maps'
				) }
				initialOpen={ false }
				style={ { marginTop: '15px' } }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							'The plugin automatically detects and creates any new features found in the dataset. Meanwhile, existing features are updated with the new structural geometries while completely preserving their custom descriptions, links, and media.',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>

			{ /* --- FAQ3 --- */ }
			<PanelBody
				title={ __(
					'How do I prepare GeoJSON data for import?',
					'bawbab-interactive-maps'
				) }
				initialOpen={ false }
				style={ { marginTop: '15px' } }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							'Files must follow standard GeoJSON specifications. Each feature requires a unique Feature ID (FID) along with layer attributes like Name, Category, Code, and Coordinates. Content management fields like galleries, videos, and descriptions are managed directly within WordPress and should be omitted from the GIS file. You can export compatible GeoJSON files directly from software like QGIS or ArcGIS.',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>
			{ /* --- FAQ4 --- */ }
			<PanelBody
				title={ __(
					'I already have Shapefiles. Can I use them?',
					'bawbab-interactive-maps'
				) }
				initialOpen={ false }
				style={ { marginTop: '15px' } }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							"Yes. You can use standard GIS software to export your ESRI Shapefiles into GeoJSON format. You may need to tweak attribute column names to align with the plugin's expected properties before running the importer.",
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>
			{ /* --- FAQ5 --- */ }
			<PanelBody
				title={ __(
					"I don't have any GIS data. Can you create it for me?",
					'bawbab-interactive-maps'
				) }
				initialOpen={ false }
				style={ { marginTop: '15px' } }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							'Yes. Our team provides complete digitization services. We can map your buildings, campus boundaries, pathways, and points of interest from scratch, and deliver import-ready GeoJSON files.',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>
			{ /* --- FAQ6 --- */ }
			<PanelBody
				title={ __( 'I Still Need Help', 'bawbab-interactive-maps' ) }
				initialOpen={ false }
				style={ { marginTop: '15px' } }
			>
				<div style={ { padding: '5px 0' } }>
					<Text
						variant="caption"
						display="block"
						style={ { color: '#667085', marginTop: '4px' } }
					>
						{ __(
							'For technical troubleshooting, manual setup, GIS digitization, or feature requests, contact our core support team directly via email: \n Corentin Sanchez Trenado: corentins@bawbab.com; \n Marcellus Oketch:oketchmarcellus@bawbab.com;',
							'bawbab-interactive-maps'
						) }
					</Text>
				</div>
			</PanelBody>
			<div style={ { marginTop: '10px' } }>
				<Text
					variant="title.small"
					display="block"
					style={ { fontWeight: '600', color: '#101828' } }
				>
					{ __( 'Bawbab the Company', 'bawbab-interactive-maps' ) }
				</Text>
				<Text
					variant="body"
					display="block"
					style={ {
						lineHeight: '1.6',
						color: '#344054',
						marginBottom: '15px',
					} }
				>
					{ __(
						"Bawbab Technologies is an infrastructure pioneer engineering Africa's first AI-driven scalable Digital Address Infrastructure (DAI) core platform. By translating localized landmarks into machine-readable digital address logistics networks, the platform helps close the continent's substantial $1.2B+ addressability gap.",
						'bawbab-interactive-maps'
					) }
				</Text>

				<Flex
					align="center"
					gap={ 3 }
					style={ {
						background: '#f9fafb',
						padding: '12px',
						borderRadius: '6px',
						borderLeft: '4px solid #007cba',
					} }
				>
					<FlexItem>
						<Dashicon
							icon="admin-site-alt3"
							size={ 20 }
							style={ { color: '#007cba' } }
						/>
					</FlexItem>
					<FlexItem style={ { flex: 1 } }>
						<strong
							style={ {
								display: 'block',
								fontSize: '12px',
								color: '#1d2939',
							} }
						>
							{ __(
								'DAI Location Intelligence',
								'bawbab-interactive-maps'
							) }
						</strong>
						<span style={ { fontSize: '11px', color: '#475467' } }>
							{ __(
								'Demonstrating capabilities across e-commerce, logistics, Emergency Response (EMR), banking, and government services.',
								'bawbab-interactive-maps'
							) }
						</span>
					</FlexItem>
				</Flex>
			</div>
			<div style={ { marginTop: '10px' } }>
				<Text
					variant="title.small"
					display="block"
					style={ { fontWeight: '600', color: '#101828' } }
				>
					{ __(
						'Authors & Contributors',
						'bawbab-interactive-maps'
					) }
				</Text>
				{ /* Author 1 */ }
				<Flex
					justify="flex-start"
					align="center"
					style={ {
						padding: '8px 0',
						borderBottom: '1px solid #f2f4f7',
					} }
				>
					<Flex justify="flex-start" gap={ 2 }>
						<Dashicon
							icon="businessperson"
							style={ { color: '#555' } }
						/>
						<strong>
							{ __(
								'Bawbab Technologies',
								'bawbab-interactive-maps'
							) }
						</strong>
					</Flex>
					<ExternalLink href="https://bawbab.com">
						{ __( 'Visit Website', 'bawbab-interactive-maps' ) }
					</ExternalLink>
				</Flex>

				{ /* Author 2 */ }
				<Flex
					justify="flex-start"
					align="center"
					style={ {
						padding: '8px 0',
						borderBottom: '1px solid #f2f4f7',
					} }
				>
					<Flex justify="flex-start" gap={ 2 }>
						<Dashicon
							icon="admin-users"
							style={ { color: '#555' } }
						/>
						<strong>
							{ __( 'Marcel Oketch', 'bawbab-interactive-maps' ) }
						</strong>
					</Flex>
					<ExternalLink href="https://profiles.wordpress.org/marcellus89/">
						{ __( 'View Profile', 'bawbab-interactive-maps' ) }
					</ExternalLink>
				</Flex>

				{ /* Author 3 */ }
				<Flex
					justify="flex-start"
					align="center"
					style={ { padding: '8px 0' } }
				>
					<Flex justify="flex-start" gap={ 2 }>
						<Dashicon
							icon="welcome-learn-more"
							style={ { color: '#555' } }
						/>
						<strong>
							{ __(
								'Dr. Coretin Sanchez',
								'bawbab-interactive-maps'
							) }
						</strong>
					</Flex>
					<ExternalLink href="https://profiles.wordpress.org/corentinsanchez/">
						{ __( 'View Profile', 'bawbab-interactive-maps' ) }
					</ExternalLink>
				</Flex>
			</div>
		</div>
	);
};
