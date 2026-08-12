/**
 * Utility functions for spatial bounding box calculations and geofencing.
 */

/**
 * Calculates dynamic center and bounding box restrictions based on GIS features.
 * Default campus center stays strictly geographical.
 *
 * @param {Array} spatialFeatures Array of GeoJSON features
 * @param {Array} locations Array of marker locations
 * @param {boolean} isDrawerOpen Whether the side drawer is open
 * @param {number} containerWidth Width of map container in pixels
 * @param {number} sidebarWidth Width of sidebar in pixels
 * @returns {Object} { center: { lat, lng }, bounds: { north, south, east, west } }
 */
export const calculateSpatialBounds = (
	spatialFeatures = [],
	locations = [],
	isDrawerOpen = false,
	containerWidth = 0,
	sidebarWidth = 0
) => {
	let minLat = Infinity,
		maxLat = -Infinity;
	let minLng = Infinity,
		maxLng = -Infinity;

	spatialFeatures.forEach( ( feature ) => {
		if ( ! feature.geometry ) return;

		const extractCoords = ( coords ) => {
			if ( typeof coords[ 0 ] === 'number' ) {
				const [ lng, lat ] = coords;
				if ( ! isNaN( lat ) && ! isNaN( lng ) ) {
					minLat = Math.min( minLat, lat );
					maxLat = Math.max( maxLat, lat );
					minLng = Math.min( minLng, lng );
					maxLng = Math.max( maxLng, lng );
				}
			} else if ( Array.isArray( coords ) ) {
				coords.forEach( extractCoords );
			}
		};
		extractCoords( feature.geometry.coordinates );
	} );

	locations.forEach( ( loc ) => {
		const lat = parseFloat( loc.lat );
		const lng = parseFloat( loc.lng );
		if ( ! isNaN( lat ) && ! isNaN( lng ) ) {
			minLat = Math.min( minLat, lat );
			maxLat = Math.max( maxLat, lat );
			minLng = Math.min( minLng, lng );
			maxLng = Math.max( maxLng, lng );
		}
	} );

	if ( minLat === Infinity || maxLat === -Infinity ) {
		return {
			center: { lat: 40.202687, lng: -75.251563 },
			bounds: {
				north: 40.212687,
				south: 40.187687,
				east: -75.231563,
				west: -75.271563,
			},
		};
	}

	const latMargin = Math.max( ( maxLat - minLat ) * 0.15, 0.005 );
	const baseLngMargin = Math.max( ( maxLng - minLng ) * 0.15, 0.005 );

	// Dynamic western geofence margin for panning when drawer is open
	let westLngMargin = baseLngMargin;

	if ( isDrawerOpen && containerWidth > 768 && sidebarWidth > 0 ) {
		const sidebarRatio = sidebarWidth / containerWidth;
		const totalLngSpan = maxLng - minLng;
		westLngMargin = baseLngMargin + totalLngSpan * sidebarRatio;
	}

	return {
		// Center remains the true geometric centroid of campus data
		center: {
			lat: ( minLat + maxLat ) / 2,
			lng: ( minLng + maxLng ) / 2,
		},
		bounds: {
			north: maxLat + latMargin,
			south: minLat - latMargin,
			east: maxLng + baseLngMargin,
			west: minLng - westLngMargin,
		},
	};
};
