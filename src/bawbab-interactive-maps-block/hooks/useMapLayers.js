import { useState, useMemo } from '@wordpress/element';
import { FLOOR_AWARE_LAYERS } from '../constants/mapConstants';

/**
 * Custom hook to encapsulate map configuration layer toggles and opacities
 */
export const useMapLayers = ( spatialFeatures ) => {
	const [ visibleLayers, setVisibleLayers ] = useState( {
		markers: true,
		labels: true,
		parcels: true,
		buildings: true,
		paths: true,
		land_use: true,
	} );

	const [ layerOpacity, setLayerOpacity ] = useState( {
		parcels: 1.0,
		buildings: 1.0,
		paths: 1.0,
		land_use: 1.0,
	} );

	const [ activeFloor, setActiveFloor ] = useState( 0 );

	const toggleLayer = ( layer ) =>
		setVisibleLayers( ( prev ) => ( {
			...prev,
			[ layer ]: ! prev[ layer ],
		} ) );
	const handleOpacityChange = ( layer, val ) =>
		setLayerOpacity( ( prev ) => ( { ...prev, [ layer ]: val } ) );

	// Memoize the calculated floor list to prevent expensive re-computations during runtime panning
	const availableFloors = useMemo( () => {
		const floorSet = new Set( [ 0 ] );
		spatialFeatures.forEach( ( f ) => {
			if ( FLOOR_AWARE_LAYERS.includes( f.properties?.layer_type ) ) {
				const v = Number.parseInt( f.properties.floor, 10 );
				if ( ! Number.isNaN( v ) ) floorSet.add( v );
			}
		} );
		return Array.from( floorSet );
	}, [ spatialFeatures ] );

	return {
		visibleLayers,
		toggleLayer,
		layerOpacity,
		handleOpacityChange,
		activeFloor,
		setActiveFloor,
		availableFloors,
	};
};
