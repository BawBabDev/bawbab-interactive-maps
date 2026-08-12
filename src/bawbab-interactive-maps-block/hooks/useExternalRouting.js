import { useState, useCallback } from '@wordpress/element';

// Foulkeways property core bounding envelope limits (Pennsylvanie Center coordinates)
const CAMPUS_CENTER = { lat: 40.202687, lng: -75.251563 };
const INNER_RADIUS_KM = 0.5; // Under 500m counts as on-site walker

/**
 * useExternalRouting
 *
 * Validates distance constraints and outputs handover entry URLs pointing
 * to the nearest car park or main road gate node.
 *
 * @returns {Object} { checkUserProximity, getHandoverLink, isCalculating, positionState }
 */
export const useExternalRouting = () => {
	const [ isCalculating, setIsCalculating ] = useState( false );
	const [ positionState, setPositionState ] = useState( {
		onCampus: true,
		userCoords: null,
	} );

	/**
	 * computeHaversineDistance
	 * Standard complex geometry math equation calculating pure distances in kilometers over a sphere.
	 */
	const computeHaversineDistance = ( coords1, coords2 ) => {
		const R = 6371; // Earth constant radius in KM
		const dLat = ( ( coords2.lat - coords1.lat ) * Math.PI ) / 180;
		const dLng = ( ( coords2.lng - coords1.lng ) * Math.PI ) / 180;
		const a =
			Math.sin( dLat / 2 ) * Math.sin( dLat / 2 ) +
			Math.cos( ( coords1.lat * Math.PI ) / 180 ) *
				Math.cos( ( coords2.lat * Math.PI ) / 180 ) *
				Math.sin( dLng / 2 ) *
				Math.sin( dLng / 2 );
		const c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );
		return R * c;
	};

	/**
	 * checkUserProximity
	 * Requests permissions to access GPS coordinates and identifies handover thresholds.
	 */
	const checkUserProximity = useCallback( async () => {
		if ( ! navigator.geolocation ) {
			return { onCampus: true, coords: null };
		}

		setIsCalculating( true );

		return new Promise( ( resolve ) => {
			navigator.geolocation.getCurrentPosition(
				( position ) => {
					const uCoords = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					const distance = computeHaversineDistance(
						uCoords,
						CAMPUS_CENTER
					);

					const isInsideProperty = distance <= INNER_RADIUS_KM;
					const result = {
						onCampus: isInsideProperty,
						coords: uCoords,
					};

					setPositionState( result );
					setIsCalculating( false );
					resolve( result );
				},
				( error ) => {
					console.warn(
						'Geolocation tracking denied. Defaulting to Internal Navigation:',
						error
					);
					const defaultState = { onCampus: true, coords: null };
					setPositionState( defaultState );
					setIsCalculating( false );
					resolve( defaultState );
				},
				{ enableHighAccuracy: true, timeout: 5000 }
			);
		} );
	}, [] );

	/**
	 * getHandoverLink
	 * Targets cross-platform deep links directly inside the native Google Maps application
	 * mapping driving instructions safely to campus perimeter intersections.
	 *
	 * @param {Array} entries loaded entries from useCampusRouting to find nearest access points.
	 * @param {Object} userCoords current tracked user coordinates if available.
	 */
	const getHandoverLink = useCallback( ( entries, userCoords ) => {
		if ( ! entries || entries.length === 0 ) {
			return `https://www.google.com/maps/dir/?api=1&destination=${ CAMPUS_CENTER.lat },${ CAMPUS_CENTER.lng }`;
		}

		// Filter gateway entry targets
		const gates = entries.filter(
			( e ) => e.type === 'main_road_entrance' || e.type === 'parking'
		);
		const targetGate =
			gates.length > 0
				? gates[ 0 ]
				: {
						geom: {
							coordinates: [
								CAMPUS_CENTER.lng,
								CAMPUS_CENTER.lat,
							],
						},
				  };

		// If user coordinates are accessible, pick the single closest gateway node mathematically
		let optimalGate = targetGate;
		if ( userCoords && gates.length > 0 ) {
			let shortestDist = Infinity;
			gates.forEach( ( gate ) => {
				const gCoords = {
					lat: gate.geom.coordinates[ 1 ],
					lng: gate.geom.coordinates[ 0 ],
				};
				const d = computeHaversineDistance( userCoords, gCoords );
				if ( d < shortestDist ) {
					shortestDist = d;
					optimalGate = gate;
				}
			} );
		}

		const [ destLng, destLat ] = optimalGate.geom.coordinates;

		// Universal deep-link format supported on iOS, Android, and Desktop browsers seamlessly
		return `https://www.google.com/maps/dir/?api=1&destination=${ destLat },${ destLng }&travelmode=driving`;
	}, [] );

	return {
		checkUserProximity,
		getHandoverLink,
		isCalculating,
		positionState,
	};
};
