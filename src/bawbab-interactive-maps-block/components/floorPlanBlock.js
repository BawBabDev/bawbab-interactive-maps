import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const FloorPlanBlock = ( { directFloorplanAssetUrl, onImageClick } ) => {
	if ( ! directFloorplanAssetUrl ) return null;

	return (
		/* DEDICATED INDEPENDENT FLOORPLAN BLOCK SECTOR */
		<div
			style={ {
				margin: '25px 0',
				padding: '15px',
				background: '#fcfcfc',
				border: '1px solid #eee',
				borderRadius: '12px',
			} }
		>
			<h4
				style={ {
					fontSize: '12px',
					textTransform: 'uppercase',
					color: '#666',
					fontWeight: '700',
					marginTop: '0',
					marginBottom: '12px',
					letterSpacing: '0.5px',
				} }
			>
				{ __( 'Residence Floor Plan', 'bawbab-interactive-maps' ) }
			</h4>
			<div
				style={ {
					width: '100%',
					background: '#fff',
					borderRadius: '8px',
					border: '1px solid #e5e5e5',
					overflow: 'hidden',
					cursor: 'pointer',
				} }
				onClick={ () => onImageClick( directFloorplanAssetUrl ) }
			>
				<img
					src={ directFloorplanAssetUrl }
					alt={ __(
						'Floor Plan Blueprint',
						'bawbab-interactive-maps'
					) }
					style={ {
						width: '100%',
						height: 'auto',
						display: 'block',
						objectFit: 'contain',
						maxHeight: '300px',
					} }
				/>
			</div>
		</div>
	);
};
