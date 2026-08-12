import { useEffect } from '@wordpress/element';

/**
 * Custom hook to intercept window URL search parameters and auto-select matching geo-features
 */
export const useMapUrlParams = (
	spatialFeatures,
	setActiveFloor,
	setSelectedLocation,
	setIsDrawerOpen
) => {
	useEffect( () => {
		const params = new URLSearchParams( window.location.search );
		const unitParam = params.get( 'unit' )?.toLowerCase().trim();
		const locationParam = params.get( 'location' )?.toLowerCase().trim();

		if ( ( unitParam || locationParam ) && spatialFeatures.length > 0 ) {
			const feature = spatialFeatures.find( ( f ) => {
				const featCode = f.properties?.code?.toLowerCase().trim();
				const featName = f.properties?.name?.toLowerCase().trim();
				if ( unitParam && featCode === unitParam ) return true;
				if ( locationParam && featName === locationParam ) return true;
				return false;
			} );
			if ( feature ) {
				const floor = Number.parseInt( feature.properties?.floor, 10 );
				if ( ! Number.isNaN( floor ) ) setActiveFloor( floor );
				setSelectedLocation( {
					...feature.properties,
					geometry: feature.geometry,
					type: 'spatial',
				} );
				setIsDrawerOpen( true );
			}
		}
	}, [
		spatialFeatures,
		setActiveFloor,
		setSelectedLocation,
		setIsDrawerOpen,
	] );
};
