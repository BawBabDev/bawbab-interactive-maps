/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 *
 * @return {Element} Element to render.
 */

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { zoom, tilt, mapType, width, height } = attributes;
	return (
		<div
			{ ...useBlockProps.save( {
				className: 'bawbab-imaps-container', // Match this in your view.js
			} ) }
			data-zoom={ zoom }
			data-tilt={ tilt }
			data-map-type={ mapType }
			data-width={ width }
			data-height={ height }
			//locations come from Global Settings therefore only need to view.js
			//data-locations={JSON.stringify(attributes.locations)}
		>
			<div className="map-placeholder">
				Loading Bawbab Interactive Map...
			</div>
		</div>
	);
}
